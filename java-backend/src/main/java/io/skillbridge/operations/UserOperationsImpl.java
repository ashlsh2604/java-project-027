package io.skillbridge.operations;

import io.skillbridge.model.User;
import io.skillbridge.util.PasswordUtil;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Phase 2 Implementation: Concrete implementation of UserOperations.
 * Provides thread-safe, secure user operations and persists users into data/plms-db.json.
 */
public class UserOperationsImpl implements UserOperations {

    private static volatile UserOperationsImpl instance;
    private final Map<String, User> userCache = new ConcurrentHashMap<>();
    private final Path dbPath;

    public UserOperationsImpl() {
        this(findDbPath());
    }

    public UserOperationsImpl(Path dbPath) {
        this.dbPath = dbPath;
        loadDatabase();
    }

    public static UserOperationsImpl getInstance() {
        if (instance == null) {
            synchronized (UserOperationsImpl.class) {
                if (instance == null) {
                    instance = new UserOperationsImpl();
                }
            }
        }
        return instance;
    }

    private static Path findDbPath() {
        Path p = Paths.get("data", "plms-db.json");
        if (Files.exists(p)) return p;
        Path parent = Paths.get("..", "data", "plms-db.json");
        if (Files.exists(parent)) return parent;
        return p;
    }

    @Override
    public synchronized boolean registerUser(User user, String rawPassword) {
        if (user == null || rawPassword == null) {
            throw new IllegalArgumentException("User object and raw password cannot be null");
        }

        String email = user.getEmail();
        if (!validateEmailFormat(email)) {
            throw new IllegalArgumentException("Invalid email format: " + email);
        }

        if (isEmailRegistered(email)) {
            return false;
        }

        if (user.getFullName() == null || user.getFullName().trim().length() < 2) {
            throw new IllegalArgumentException("Full name must be at least 2 characters long");
        }

        if (!validatePasswordPolicy(rawPassword)) {
            throw new IllegalArgumentException("Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters");
        }

        if (user.getId() == null || user.getId().isBlank()) {
            user.setId("usr-" + UUID.randomUUID().toString().substring(0, 8));
        }

        String salt = PasswordUtil.generateSalt();
        String hash = PasswordUtil.hashPassword(rawPassword, salt);
        user.setSalt(salt);
        user.setPasswordHash(hash);

        if (user.getTimezone() == null || user.getTimezone().isBlank()) {
            user.setTimezone("Asia/Kolkata");
        }

        String now = Instant.now().toString();
        user.setCreatedAt(now);
        user.setLastLoginAt(now);

        userCache.put(user.getEmail().toLowerCase(), user);
        saveDatabase();
        return true;
    }

    @Override
    public synchronized User authenticate(String email, String rawPassword) {
        if (email == null || rawPassword == null) {
            return null;
        }
        User user = getUserByEmail(email);
        if (user == null) {
            return null;
        }
        boolean matches = PasswordUtil.verifyPassword(rawPassword, user.getSalt(), user.getPasswordHash());
        if (matches) {
            user.setLastLoginAt(Instant.now().toString());
            saveDatabase();
            return user;
        }
        return null;
    }

    @Override
    public boolean validateCredentials(String email, String rawPassword) {
        return authenticate(email, rawPassword) != null;
    }

    @Override
    public boolean isEmailRegistered(String email) {
        if (email == null) return false;
        return userCache.containsKey(email.trim().toLowerCase());
    }

    @Override
    public User getUserByEmail(String email) {
        if (email == null) return null;
        return userCache.get(email.trim().toLowerCase());
    }

    @Override
    public User getUserById(String id) {
        if (id == null) return null;
        for (User u : userCache.values()) {
            if (id.equals(u.getId())) {
                return u;
            }
        }
        return null;
    }

    @Override
    public synchronized boolean updateUserTimezone(String userId, String newTimezone) {
        User user = getUserById(userId);
        if (user == null || newTimezone == null || newTimezone.isBlank()) {
            return false;
        }
        user.setTimezone(newTimezone.trim());
        saveDatabase();
        return true;
    }

    @Override
    public boolean validatePasswordPolicy(String password) {
        return PasswordUtil.isStrongPassword(password);
    }

    @Override
    public boolean validateEmailFormat(String email) {
        return PasswordUtil.isValidEmail(email);
    }

    @Override
    public List<User> getAllUsers() {
        return Collections.unmodifiableList(new ArrayList<>(userCache.values()));
    }

    // ==========================================
    // Database Persistence
    // ==========================================

    private synchronized void loadDatabase() {
        try {
            if (!Files.exists(dbPath)) {
                seedInitialUsers();
                return;
            }
            String content = Files.readString(dbPath, StandardCharsets.UTF_8);
            parseUsersFromJson(content);
            if (userCache.isEmpty()) {
                seedInitialUsers();
            }
        } catch (Exception e) {
            System.err.println("[UserOperationsImpl] Warning reading db file: " + e.getMessage());
            seedInitialUsers();
        }
    }

    private void seedInitialUsers() {
        String salt = "plms-enterprise-salt-2026";
        String hash = PasswordUtil.hashPassword("Architect2026!", salt);
        User elena = new User(
                "usr-elena-vance-01",
                "Elena Vance",
                "elena.vance@plms-enterprise.io",
                hash,
                salt,
                "Principal Java Systems Architect",
                "Asia/Kolkata"
        );
        userCache.put(elena.getEmail().toLowerCase(), elena);
        saveDatabase();
    }

    private void parseUsersFromJson(String json) {
        int idx = json.indexOf("\"users\"");
        if (idx == -1) return;
        int startBracket = json.indexOf('[', idx);
        int endBracket = -1;
        int depth = 0;
        for (int i = startBracket; i < json.length(); i++) {
            char c = json.charAt(i);
            if (c == '[') depth++;
            else if (c == ']') {
                depth--;
                if (depth == 0) {
                    endBracket = i;
                    break;
                }
            }
        }
        if (startBracket == -1 || endBracket == -1) return;
        String arrayContent = json.substring(startBracket + 1, endBracket);

        Pattern objPattern = Pattern.compile("\\{([^{}]+)\\}");
        Matcher objMatcher = objPattern.matcher(arrayContent);
        while (objMatcher.find()) {
            String objText = objMatcher.group(1);
            Map<String, String> fields = extractJsonFields(objText);
            String email = fields.get("email");
            if (email != null && !email.isBlank()) {
                User u = new User();
                u.setId(fields.get("id"));
                u.setFullName(fields.get("fullName"));
                u.setEmail(email.trim().toLowerCase());
                u.setPasswordHash(fields.get("passwordHash"));
                u.setSalt(fields.get("salt"));
                u.setRoleTitle(fields.get("roleTitle"));
                u.setTimezone(fields.getOrDefault("timezone", "Asia/Kolkata"));
                u.setCreatedAt(fields.get("createdAt"));
                u.setLastLoginAt(fields.get("lastLoginAt"));
                userCache.put(u.getEmail(), u);
            }
        }
    }

    private Map<String, String> extractJsonFields(String text) {
        Map<String, String> map = new HashMap<>();
        Pattern fieldPattern = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");
        Matcher matcher = fieldPattern.matcher(text);
        while (matcher.find()) {
            map.put(matcher.group(1), matcher.group(2));
        }
        return map;
    }

    private synchronized void saveDatabase() {
        try {
            if (dbPath.getParent() != null && !Files.exists(dbPath.getParent())) {
                Files.createDirectories(dbPath.getParent());
            }

            StringBuilder sb = new StringBuilder();
            sb.append("{\n  \"users\": [\n");
            int i = 0;
            int total = userCache.size();
            for (User u : userCache.values()) {
                sb.append("    {\n");
                sb.append("      \"id\": \"").append(escape(u.getId())).append("\",\n");
                sb.append("      \"fullName\": \"").append(escape(u.getFullName())).append("\",\n");
                sb.append("      \"email\": \"").append(escape(u.getEmail())).append("\",\n");
                sb.append("      \"roleTitle\": \"").append(escape(u.getRoleTitle())).append("\",\n");
                sb.append("      \"timezone\": \"").append(escape(u.getTimezone())).append("\",\n");
                sb.append("      \"salt\": \"").append(escape(u.getSalt())).append("\",\n");
                sb.append("      \"passwordHash\": \"").append(escape(u.getPasswordHash())).append("\",\n");
                sb.append("      \"createdAt\": \"").append(escape(u.getCreatedAt())).append("\",\n");
                sb.append("      \"lastLoginAt\": \"").append(escape(u.getLastLoginAt())).append("\"\n");
                sb.append("    }");
                if (++i < total) sb.append(",");
                sb.append("\n");
            }
            sb.append("  ],\n  \"sessions\": [],\n  \"auditLogs\": [\n");
            sb.append("    {\n");
            sb.append("      \"id\": \"aud-sb-").append(System.currentTimeMillis() % 100000).append("\",\n");
            sb.append("      \"event\": \"UserOperations Java Store Synchronized\",\n");
            sb.append("      \"timestamp\": \"").append(Instant.now().toString()).append("\",\n");
            sb.append("      \"status\": \"Verified\"\n");
            sb.append("    }\n");
            sb.append("  ]\n}\n");

            Files.writeString(dbPath, sb.toString(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[UserOperationsImpl] Failed to write db: " + e.getMessage());
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
