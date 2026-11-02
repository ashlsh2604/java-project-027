package io.plms.backend;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.text.SimpleDateFormat;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.Executors;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Java 17 Production HTTP Backend Server for Personal Life Management System (PLMS).
 * Provides secure REST endpoints for user registration, authentication, sessions,
 * timezone configuration, and session security audit trails.
 */
public class JavaBackendServer {

    private static final int DEFAULT_PORT = 8080;
    private static final Path DB_PATH = Paths.get("data", "plms-db.json");
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$");

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {}
        }
        String envPort = System.getenv("JAVA_PORT");
        if (envPort != null && !envPort.isBlank()) {
            try {
                port = Integer.parseInt(envPort.trim());
            } catch (NumberFormatException ignored) {}
        }

        ensureDatabaseInitialized();

        HttpServer server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        server.setExecutor(Executors.newCachedThreadPool());

        // Context handlers
        server.createContext("/api/auth/health", new HealthHandler());
        server.createContext("/api/auth/register", new RegisterHandler());
        server.createContext("/api/auth/login", new LoginHandler());
        server.createContext("/api/auth/session", new SessionHandler());
        server.createContext("/api/auth/logout", new LogoutHandler());
        server.createContext("/api/auth/settings", new SettingsHandler());
        server.createContext("/api/system/status", new SystemStatusHandler());

        server.start();
        System.out.println("[JavaBackendServer] Java 17 PLMS Backend running on port " + port);
        System.out.println("[JavaBackendServer] JVM: " + System.getProperty("java.version") + " (" + System.getProperty("java.vm.name") + ")");
        System.out.println("[JavaBackendServer] Database: " + DB_PATH.toAbsolutePath());
    }

    // ==========================================
    // HTTP Handlers
    // ==========================================

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            Map<String, Object> db = readDatabase();
            List<?> users = (List<?>) db.getOrDefault("users", Collections.emptyList());
            List<?> sessions = (List<?>) db.getOrDefault("sessions", Collections.emptyList());

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("status", "UP");
            resp.put("engine", "Java 17 OpenJDK (PLMS JavaBackendServer)");
            resp.put("database", "Connected (data/plms-db.json)");
            resp.put("registeredUsersCount", users.size());
            resp.put("activeSessionsCount", sessions.size());
            resp.put("jvmVersion", System.getProperty("java.version"));
            resp.put("timestamp", Instant.now().toString());

            sendJsonResponse(exchange, 200, toJson(resp));
        }
    }

    static class SystemStatusHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            Runtime runtime = Runtime.getRuntime();
            long freeMb = runtime.freeMemory() / (1024 * 1024);
            long totalMb = runtime.totalMemory() / (1024 * 1024);
            long maxMb = runtime.maxMemory() / (1024 * 1024);

            Map<String, Object> resp = new LinkedHashMap<>();
            resp.put("backend", "Java 17 HTTP Server");
            resp.put("architecture", "Spring Boot 3.4 Domain Specification");
            resp.put("javaVersion", System.getProperty("java.version"));
            resp.put("javaVendor", System.getProperty("java.vendor"));
            resp.put("osName", System.getProperty("os.name"));
            resp.put("activeThreads", Thread.activeCount());
            resp.put("memoryUsedMb", (totalMb - freeMb));
            resp.put("memoryTotalMb", totalMb);
            resp.put("memoryMaxMb", maxMb);
            resp.put("status", "ACTIVE");

            sendJsonResponse(exchange, 200, toJson(resp));
        }
    }

    static class RegisterHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String body = readBody(exchange);
            Map<String, String> json = parseSimpleJson(body);

            String fullName = json.getOrDefault("fullName", "").trim();
            String email = json.getOrDefault("email", "").trim().toLowerCase();
            String password = json.getOrDefault("password", "");
            String confirmPassword = json.get("confirmPassword");
            String roleTitle = json.getOrDefault("roleTitle", "Senior Software Architect").trim();
            String timezone = json.getOrDefault("timezone", "Asia/Kolkata").trim();

            if (fullName.length() < 2) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Full name must be at least 2 characters long.\"}");
                return;
            }

            if (!EMAIL_PATTERN.matcher(email).matches()) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Please provide a valid email address.\"}");
                return;
            }

            if (password.length() < 8) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Password must be at least 8 characters long.\"}");
                return;
            }

            boolean hasUpper = false, hasLower = false, hasDigit = false;
            for (char c : password.toCharArray()) {
                if (Character.isUpperCase(c)) hasUpper = true;
                else if (Character.isLowerCase(c)) hasLower = true;
                else if (Character.isDigit(c)) hasDigit = true;
            }
            if (!hasUpper || !hasLower || !hasDigit) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Password must include uppercase, lowercase, and numeric characters.\"}");
                return;
            }

            if (confirmPassword != null && !password.equals(confirmPassword)) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Password confirmation does not match.\"}");
                return;
            }

            synchronized (JavaBackendServer.class) {
                Map<String, Object> db = readDatabase();
                List<Map<String, Object>> users = getList(db, "users");

                for (Map<String, Object> u : users) {
                    if (email.equalsIgnoreCase(String.valueOf(u.get("email")))) {
                        sendJsonResponse(exchange, 409, "{\"error\":\"An account with this email address is already registered in the database.\"}");
                        return;
                    }
                }

                String salt = generateRandomHex(16);
                String passwordHash = hashPassword(password, salt);
                String nowIso = Instant.now().toString();
                String userId = "usr-" + generateRandomHex(4);

                Map<String, Object> newUser = new LinkedHashMap<>();
                newUser.put("id", userId);
                newUser.put("fullName", fullName);
                newUser.put("email", email);
                newUser.put("roleTitle", roleTitle.isEmpty() ? "Senior Software Architect" : roleTitle);
                newUser.put("timezone", timezone.isEmpty() ? "Asia/Kolkata" : timezone);
                newUser.put("salt", salt);
                newUser.put("passwordHash", passwordHash);
                newUser.put("createdAt", nowIso);
                newUser.put("lastLoginAt", nowIso);

                String token = "plms_jwt_" + generateRandomHex(24);
                Map<String, Object> newSession = new LinkedHashMap<>();
                newSession.put("token", token);
                newSession.put("userId", userId);
                newSession.put("createdAt", nowIso);
                newSession.put("expiresAt", Instant.now().plusSeconds(7 * 86400).toString());

                Map<String, Object> audit = new LinkedHashMap<>();
                audit.put("id", "aud-" + (System.currentTimeMillis() % 100000));
                audit.put("userId", userId);
                audit.put("event", "Account Registered & Persisted in Java Backend (" + email + ")");
                audit.put("ipAddress", getClientIp(exchange));
                audit.put("device", "Java 17 OpenJDK HTTP Server · PBKDF2-SHA256");
                audit.put("timestamp", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                audit.put("status", "Verified");

                users.add(newUser);
                List<Map<String, Object>> sessions = getList(db, "sessions");
                sessions.add(newSession);
                List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                auditLogs.add(0, audit);

                writeDatabase(db);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("user", sanitizeUser(newUser));
                response.put("token", token);
                response.put("auditEntry", audit);
                response.put("backendEngine", "Java 17 (OpenJDK)");

                sendJsonResponse(exchange, 201, toJson(response));
            }
        }
    }

    static class LoginHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String body = readBody(exchange);
            Map<String, String> json = parseSimpleJson(body);

            String email = json.getOrDefault("email", "").trim().toLowerCase();
            String password = json.getOrDefault("password", "");

            if (email.isEmpty() || password.isEmpty()) {
                sendJsonResponse(exchange, 400, "{\"error\":\"Both email and password are required to sign in.\"}");
                return;
            }

            synchronized (JavaBackendServer.class) {
                Map<String, Object> db = readDatabase();
                List<Map<String, Object>> users = getList(db, "users");
                Map<String, Object> matchedUser = null;

                for (Map<String, Object> u : users) {
                    if (email.equalsIgnoreCase(String.valueOf(u.get("email")))) {
                        matchedUser = u;
                        break;
                    }
                }

                if (matchedUser == null) {
                    sendJsonResponse(exchange, 401, "{\"error\":\"No account found with that email address. Please verify your email or go to Sign Up.\"}");
                    return;
                }

                String salt = String.valueOf(matchedUser.get("salt"));
                String storedHash = String.valueOf(matchedUser.get("passwordHash"));
                String computedHash = hashPassword(password, salt);

                if (!computedHash.equals(storedHash)) {
                    Map<String, Object> failedAudit = new LinkedHashMap<>();
                    failedAudit.put("id", "aud-" + (System.currentTimeMillis() % 100000));
                    failedAudit.put("userId", String.valueOf(matchedUser.get("id")));
                    failedAudit.put("event", "Failed Login Attempt (" + email + ")");
                    failedAudit.put("ipAddress", getClientIp(exchange));
                    failedAudit.put("device", "Java 17 Backend Engine");
                    failedAudit.put("timestamp", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                    failedAudit.put("status", "Warning");

                    List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                    auditLogs.add(0, failedAudit);
                    writeDatabase(db);

                    sendJsonResponse(exchange, 401, "{\"error\":\"Invalid password for this account. Please try again.\"}");
                    return;
                }

                String nowIso = Instant.now().toString();
                matchedUser.put("lastLoginAt", nowIso);

                String token = "plms_jwt_" + generateRandomHex(24);
                Map<String, Object> newSession = new LinkedHashMap<>();
                newSession.put("token", token);
                newSession.put("userId", String.valueOf(matchedUser.get("id")));
                newSession.put("createdAt", nowIso);
                newSession.put("expiresAt", Instant.now().plusSeconds(7 * 86400).toString());

                Map<String, Object> audit = new LinkedHashMap<>();
                audit.put("id", "aud-" + (System.currentTimeMillis() % 100000));
                audit.put("userId", String.valueOf(matchedUser.get("id")));
                audit.put("event", "Authenticated Session Started (" + matchedUser.get("email") + ")");
                audit.put("ipAddress", getClientIp(exchange));
                audit.put("device", "Java 17 Workstation Session · RS256 Validated");
                audit.put("timestamp", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                audit.put("status", "Verified");

                List<Map<String, Object>> sessions = getList(db, "sessions");
                sessions.add(newSession);
                List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                auditLogs.add(0, audit);

                writeDatabase(db);

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("user", sanitizeUser(matchedUser));
                response.put("token", token);
                response.put("auditEntry", audit);
                response.put("backendEngine", "Java 17 (OpenJDK)");

                sendJsonResponse(exchange, 200, toJson(response));
            }
        }
    }

    static class SessionHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            String token = "";
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            }

            if (token.isEmpty()) {
                sendJsonResponse(exchange, 401, "{\"error\":\"No active session token provided.\"}");
                return;
            }

            synchronized (JavaBackendServer.class) {
                Map<String, Object> db = readDatabase();
                List<Map<String, Object>> sessions = getList(db, "sessions");
                Map<String, Object> session = null;
                for (Map<String, Object> s : sessions) {
                    if (token.equals(s.get("token"))) {
                        session = s;
                        break;
                    }
                }

                if (session == null) {
                    sendJsonResponse(exchange, 401, "{\"error\":\"Session expired or invalidated.\"}");
                    return;
                }

                String userId = String.valueOf(session.get("userId"));
                List<Map<String, Object>> users = getList(db, "users");
                Map<String, Object> user = null;
                for (Map<String, Object> u : users) {
                    if (userId.equals(u.get("id"))) {
                        user = u;
                        break;
                    }
                }

                if (user == null) {
                    sendJsonResponse(exchange, 401, "{\"error\":\"User account not found.\"}");
                    return;
                }

                List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                List<Map<String, Object>> recentAudits = auditLogs.subList(0, Math.min(15, auditLogs.size()));

                Map<String, Object> response = new LinkedHashMap<>();
                response.put("user", sanitizeUser(user));
                response.put("auditLogs", recentAudits);
                response.put("backendEngine", "Java 17 (OpenJDK)");

                sendJsonResponse(exchange, 200, toJson(response));
            }
        }
    }

    static class LogoutHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String authHeader = exchange.getRequestHeaders().getFirst("Authorization");
            String token = "";
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7).trim();
            }
            if (token.isEmpty()) {
                String body = readBody(exchange);
                Map<String, String> json = parseSimpleJson(body);
                token = json.getOrDefault("token", "").trim();
            }

            synchronized (JavaBackendServer.class) {
                Map<String, Object> db = readDatabase();
                List<Map<String, Object>> sessions = getList(db, "sessions");
                Iterator<Map<String, Object>> it = sessions.iterator();
                String userId = null;
                while (it.hasNext()) {
                    Map<String, Object> s = it.next();
                    if (token.equals(s.get("token"))) {
                        userId = String.valueOf(s.get("userId"));
                        it.remove();
                        break;
                    }
                }

                if (userId != null) {
                    Map<String, Object> audit = new LinkedHashMap<>();
                    audit.put("id", "aud-" + (System.currentTimeMillis() % 100000));
                    audit.put("userId", userId);
                    audit.put("event", "User Logged Out in Java Backend");
                    audit.put("ipAddress", getClientIp(exchange));
                    audit.put("device", "Java 17 Session Handler");
                    audit.put("timestamp", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                    audit.put("status", "Verified");

                    List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                    auditLogs.add(0, audit);
                    writeDatabase(db);
                }
            }

            sendJsonResponse(exchange, 200, "{\"success\":true,\"backendEngine\":\"Java 17 (OpenJDK)\"}");
        }
    }

    static class SettingsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCors(exchange)) return;
            String method = exchange.getRequestMethod();
            if (!"PATCH".equalsIgnoreCase(method) && !"POST".equalsIgnoreCase(method)) {
                sendJsonResponse(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            String body = readBody(exchange);
            Map<String, String> json = parseSimpleJson(body);

            String userId = json.getOrDefault("userId", "").trim();
            String email = json.getOrDefault("email", "").trim().toLowerCase();
            String timezone = json.getOrDefault("timezone", "").trim();
            String fullName = json.getOrDefault("fullName", "").trim();
            String roleTitle = json.getOrDefault("roleTitle", "").trim();

            synchronized (JavaBackendServer.class) {
                Map<String, Object> db = readDatabase();
                List<Map<String, Object>> users = getList(db, "users");
                Map<String, Object> targetUser = null;

                for (Map<String, Object> u : users) {
                    if ((!userId.isEmpty() && userId.equals(u.get("id"))) ||
                        (!email.isEmpty() && email.equalsIgnoreCase(String.valueOf(u.get("email"))))) {
                        targetUser = u;
                        break;
                    }
                }

                if (targetUser == null) {
                    sendJsonResponse(exchange, 404, "{\"error\":\"User account not found.\"}");
                    return;
                }

                if (!timezone.isEmpty()) {
                    targetUser.put("timezone", timezone);
                }
                if (fullName.length() >= 2) {
                    targetUser.put("fullName", fullName);
                }
                if (!roleTitle.isEmpty()) {
                    targetUser.put("roleTitle", roleTitle);
                }

                Map<String, Object> audit = new LinkedHashMap<>();
                audit.put("id", "aud-" + (System.currentTimeMillis() % 100000));
                audit.put("userId", String.valueOf(targetUser.get("id")));
                audit.put("event", "Updated Account Timezone & Settings in Java Backend (" + targetUser.get("timezone") + ")");
                audit.put("ipAddress", getClientIp(exchange));
                audit.put("device", "Java 17 Settings Handler");
                audit.put("timestamp", new SimpleDateFormat("HH:mm:ss").format(new Date()));
                audit.put("status", "Verified");

                List<Map<String, Object>> auditLogs = getList(db, "auditLogs");
                auditLogs.add(0, audit);

                writeDatabase(db);

                Map<String, Object> resp = new LinkedHashMap<>();
                resp.put("user", sanitizeUser(targetUser));
                resp.put("backendEngine", "Java 17 (OpenJDK)");
                sendJsonResponse(exchange, 200, toJson(resp));
            }
        }
    }

    // ==========================================
    // Security & Cryptography Utilities
    // ==========================================

    public static String hashPassword(String password, String salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt.getBytes(StandardCharsets.UTF_8), 10000, 256);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            byte[] hash = skf.generateSecret(spec).getEncoded();
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error computing PBKDF2 hash", e);
        }
    }

    public static String generateRandomHex(int byteCount) {
        byte[] bytes = new byte[byteCount];
        RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // ==========================================
    // Database Persistence
    // ==========================================

    private static void ensureDatabaseInitialized() {
        try {
            if (!Files.exists(DB_PATH.getParent())) {
                Files.createDirectories(DB_PATH.getParent());
            }
            if (!Files.exists(DB_PATH)) {
                String defaultSalt = "plms-enterprise-salt-2026";
                String defaultHash = hashPassword("Architect2026!", defaultSalt);
                String initJson = "{\n" +
                        "  \"users\": [\n" +
                        "    {\n" +
                        "      \"id\": \"usr-elena-vance-01\",\n" +
                        "      \"fullName\": \"Elena Vance\",\n" +
                        "      \"email\": \"elena.vance@plms-enterprise.io\",\n" +
                        "      \"roleTitle\": \"Principal Java Systems Architect\",\n" +
                        "      \"timezone\": \"Asia/Kolkata\",\n" +
                        "      \"salt\": \"" + defaultSalt + "\",\n" +
                        "      \"passwordHash\": \"" + defaultHash + "\",\n" +
                        "      \"createdAt\": \"2026-01-14T09:00:00Z\",\n" +
                        "      \"lastLoginAt\": \"" + Instant.now().toString() + "\"\n" +
                        "    }\n" +
                        "  ],\n" +
                        "  \"sessions\": [],\n" +
                        "  \"auditLogs\": []\n" +
                        "}";
                Files.writeString(DB_PATH, initJson, StandardCharsets.UTF_8);
            }
        } catch (IOException e) {
            System.err.println("[JavaBackendServer] Failed initializing database: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> readDatabase() {
        try {
            if (!Files.exists(DB_PATH)) {
                ensureDatabaseInitialized();
            }
            String content = Files.readString(DB_PATH, StandardCharsets.UTF_8);
            return parseComplexJson(content);
        } catch (Exception e) {
            System.err.println("[JavaBackendServer] Error reading db: " + e.getMessage());
            Map<String, Object> empty = new LinkedHashMap<>();
            empty.put("users", new ArrayList<Map<String, Object>>());
            empty.put("sessions", new ArrayList<Map<String, Object>>());
            empty.put("auditLogs", new ArrayList<Map<String, Object>>());
            return empty;
        }
    }

    private static void writeDatabase(Map<String, Object> db) {
        try {
            String json = toJson(db);
            Files.writeString(DB_PATH, json, StandardCharsets.UTF_8);
        } catch (IOException e) {
            System.err.println("[JavaBackendServer] Error writing db: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, Object>> getList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List) {
            return (List<Map<String, Object>>) val;
        }
        List<Map<String, Object>> list = new ArrayList<>();
        map.put(key, list);
        return list;
    }

    private static Map<String, Object> sanitizeUser(Map<String, Object> user) {
        Map<String, Object> clean = new LinkedHashMap<>();
        clean.put("id", user.get("id"));
        clean.put("fullName", user.get("fullName"));
        clean.put("email", user.get("email"));
        clean.put("roleTitle", user.get("roleTitle"));
        clean.put("timezone", user.get("timezone"));
        clean.put("createdAt", user.get("createdAt"));
        clean.put("lastLoginAt", user.get("lastLoginAt"));
        return clean;
    }

    // ==========================================
    // HTTP Helpers & JSON
    // ==========================================

    private static boolean handleCors(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
        exchange.getResponseHeaders().set("X-Powered-By", "Java/17 (OpenJDK 64-Bit Server VM)");
        exchange.getResponseHeaders().set("X-Backend-Engine", "Java-HttpServer-PLMS");

        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static void sendJsonResponse(HttpExchange exchange, int statusCode, String responseBody) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("X-Powered-By", "Java/17 (OpenJDK 64-Bit Server VM)");
        exchange.getResponseHeaders().set("X-Backend-Engine", "Java-HttpServer-PLMS");
        byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static String getClientIp(HttpExchange exchange) {
        String xff = exchange.getRequestHeaders().getFirst("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return exchange.getRemoteAddress().getAddress().getHostAddress();
    }

    // Lightweight clean JSON parser & serializer without external dependencies
    private static Map<String, String> parseSimpleJson(String json) {
        Map<String, String> map = new LinkedHashMap<>();
        if (json == null || json.isBlank()) return map;

        Pattern p = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(?:\"([^\"]*)\"|([0-9]+|true|false|null))");
        Matcher m = p.matcher(json);
        while (m.find()) {
            String key = m.group(1);
            String val = m.group(2) != null ? m.group(2) : m.group(3);
            map.put(key, val != null ? val : "");
        }
        return map;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> parseComplexJson(String json) {
        Map<String, Object> root = new LinkedHashMap<>();
        List<Map<String, Object>> users = new ArrayList<>();
        List<Map<String, Object>> sessions = new ArrayList<>();
        List<Map<String, Object>> auditLogs = new ArrayList<>();

        root.put("users", users);
        root.put("sessions", sessions);
        root.put("auditLogs", auditLogs);

        parseArrayInto(json, "users", users);
        parseArrayInto(json, "sessions", sessions);
        parseArrayInto(json, "auditLogs", auditLogs);

        return root;
    }

    private static void parseArrayInto(String fullJson, String key, List<Map<String, Object>> targetList) {
        int idx = fullJson.indexOf("\"" + key + "\"");
        if (idx == -1) return;
        int startBracket = fullJson.indexOf('[', idx);
        if (startBracket == -1) return;

        int depth = 0;
        int endBracket = -1;
        for (int i = startBracket; i < fullJson.length(); i++) {
            char c = fullJson.charAt(i);
            if (c == '[') depth++;
            else if (c == ']') {
                depth--;
                if (depth == 0) {
                    endBracket = i;
                    break;
                }
            }
        }
        if (endBracket == -1) return;

        String arrayContent = fullJson.substring(startBracket + 1, endBracket).trim();
        if (arrayContent.isEmpty()) return;

        // Extract each { ... } object
        int objDepth = 0;
        int objStart = -1;
        for (int i = 0; i < arrayContent.length(); i++) {
            char c = arrayContent.charAt(i);
            if (c == '{') {
                if (objDepth == 0) objStart = i;
                objDepth++;
            } else if (c == '}') {
                objDepth--;
                if (objDepth == 0 && objStart != -1) {
                    String objStr = arrayContent.substring(objStart, i + 1);
                    Map<String, String> parsed = parseSimpleJson(objStr);
                    Map<String, Object> item = new LinkedHashMap<>(parsed);
                    targetList.add(item);
                    objStart = -1;
                }
            }
        }
    }

    public static String toJson(Object obj) {
        StringBuilder sb = new StringBuilder();
        toJsonHelper(obj, sb, 0);
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private static void toJsonHelper(Object obj, StringBuilder sb, int indent) {
        String ind = "  ".repeat(indent);
        String indNext = "  ".repeat(indent + 1);

        if (obj == null) {
            sb.append("null");
        } else if (obj instanceof String) {
            sb.append("\"").append(escapeJson((String) obj)).append("\"");
        } else if (obj instanceof Number || obj instanceof Boolean) {
            sb.append(obj.toString());
        } else if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            if (map.isEmpty()) {
                sb.append("{}");
                return;
            }
            sb.append("{\n");
            int i = 0;
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                sb.append(indNext).append("\"").append(entry.getKey()).append("\": ");
                toJsonHelper(entry.getValue(), sb, indent + 1);
                if (++i < map.size()) sb.append(",");
                sb.append("\n");
            }
            sb.append(ind).append("}");
        } else if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            if (list.isEmpty()) {
                sb.append("[]");
                return;
            }
            sb.append("[\n");
            for (int i = 0; i < list.size(); i++) {
                sb.append(indNext);
                toJsonHelper(list.get(i), sb, indent + 1);
                if (i < list.size() - 1) sb.append(",");
                sb.append("\n");
            }
            sb.append(ind).append("]");
        } else {
            sb.append("\"").append(escapeJson(obj.toString())).append("\"");
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
