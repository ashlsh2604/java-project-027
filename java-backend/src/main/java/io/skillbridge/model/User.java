package io.skillbridge.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Phase 1 Requirement: Java User class with username/password fields and basic input validation.
 * Represents a user domain entity adhering to JavaBean standards.
 */
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    // Validation patterns
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9._-]{3,30}$");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

    private String id;
    private String username;
    private transient String password; // In-memory plain text password for input binding; never serialized
    private String fullName;
    private String email;
    private String passwordHash;
    private String salt;
    private String roleTitle;
    private String timezone;
    private String createdAt;
    private String lastLoginAt;

    public User() {
        this.createdAt = Instant.now().toString();
        this.lastLoginAt = this.createdAt;
        this.timezone = "Asia/Kolkata";
        this.roleTitle = "Software Engineer";
    }

    public User(String username, String password) {
        this();
        this.username = username;
        this.password = password;
        if (username != null && username.contains("@")) {
            this.email = username.trim().toLowerCase();
        }
    }

    public User(String id, String fullName, String email, String passwordHash, String salt, String roleTitle, String timezone) {
        this(id, email != null && email.contains("@") ? email.substring(0, email.indexOf('@')) : email,
                fullName, email, passwordHash, salt, roleTitle, timezone);
    }

    public User(String id, String username, String fullName, String email, String passwordHash, String salt, String roleTitle, String timezone) {
        this.id = id;
        this.username = username != null && !username.isBlank() ? username.trim() : (email != null ? email.trim() : null);
        this.fullName = fullName;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.roleTitle = roleTitle != null && !roleTitle.isBlank() ? roleTitle : "Software Engineer";
        this.timezone = timezone != null && !timezone.isBlank() ? timezone : "Asia/Kolkata";
        this.createdAt = Instant.now().toString();
        this.lastLoginAt = this.createdAt;
    }

    // ==========================================
    // Phase 1: Basic Input Validation Methods
    // ==========================================

    /**
     * Validates username: must be 3-30 characters, alphanumeric with '.', '_', or '-'.
     */
    public static boolean isValidUsername(String username) {
        return username != null && USERNAME_PATTERN.matcher(username.trim()).matches();
    }

    /**
     * Validates password: minimum 8 characters, at least one uppercase letter,
     * one lowercase letter, and one numeric digit.
     */
    public static boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        for (char c : password.toCharArray()) {
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        return hasUpper && hasLower && hasDigit;
    }

    /**
     * Validates email against standard RFC pattern.
     */
    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    /**
     * Executes basic validation across user fields and returns any validation error messages.
     */
    public List<String> validate() {
        List<String> errors = new ArrayList<>();
        if ((username == null || username.isBlank()) && (email == null || email.isBlank())) {
            errors.add("Username or email address is required.");
        }
        if (username != null && !username.isBlank() && !isValidUsername(username) && !isValidEmail(username)) {
            errors.add("Username must be between 3 and 30 characters (letters, numbers, dot, underscore, or hyphen).");
        }
        if (email != null && !email.isBlank() && !isValidEmail(email)) {
            errors.add("Please provide a valid email address.");
        }
        if (password != null && !password.isBlank() && !isValidPassword(password)) {
            errors.add("Password must be at least 8 characters long and contain uppercase, lowercase, and numeric characters.");
        }
        return errors;
    }

    /**
     * Returns true if all basic validation rules pass.
     */
    public boolean isValid() {
        return validate().isEmpty();
    }

    // ==========================================
    // Getters and Setters
    // ==========================================

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUsername() {
        if (username != null && !username.isBlank()) {
            return username;
        }
        return email;
    }

    public void setUsername(String username) {
        this.username = username != null ? username.trim() : null;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        if (fullName != null && !fullName.isBlank()) {
            return fullName;
        }
        return username != null ? username : "Member";
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
        if (this.username == null || this.username.isBlank()) {
            this.username = this.email;
        }
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getSalt() {
        return salt;
    }

    public void setSalt(String salt) {
        this.salt = salt;
    }

    public String getRoleTitle() {
        return roleTitle;
    }

    public void setRoleTitle(String roleTitle) {
        this.roleTitle = roleTitle;
    }

    public String getTimezone() {
        return timezone;
    }

    public void setTimezone(String timezone) {
        this.timezone = timezone;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getLastLoginAt() {
        return lastLoginAt;
    }

    public void setLastLoginAt(String lastLoginAt) {
        this.lastLoginAt = lastLoginAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        User user = (User) o;
        return Objects.equals(email, user.email) || Objects.equals(username, user.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(email != null ? email : username);
    }

    @Override
    public String toString() {
        // Safe string representation: never logs plain password or salt/hash
        return "User{" +
                "id='" + id + '\'' +
                ", username='" + username + '\'' +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", roleTitle='" + roleTitle + '\'' +
                ", timezone='" + timezone + '\'' +
                ", lastLoginAt='" + lastLoginAt + '\'' +
                '}';
    }
}
