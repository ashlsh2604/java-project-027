package io.skillbridge.model;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * Domain entity representing a user in the SkillBridge / Personal Life Management System.
 * Adheres to JavaBean standards for JSP and Servlet session persistence.
 */
public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
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

    public User(String id, String fullName, String email, String passwordHash, String salt, String roleTitle, String timezone) {
        this.id = id;
        this.fullName = fullName;
        this.email = email != null ? email.trim().toLowerCase() : null;
        this.passwordHash = passwordHash;
        this.salt = salt;
        this.roleTitle = roleTitle != null && !roleTitle.isBlank() ? roleTitle : "Software Engineer";
        this.timezone = timezone != null && !timezone.isBlank() ? timezone : "Asia/Kolkata";
        this.createdAt = Instant.now().toString();
        this.lastLoginAt = this.createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email != null ? email.trim().toLowerCase() : null;
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
        return Objects.equals(email, user.email);
    }

    @Override
    public int hashCode() {
        return Objects.hash(email);
    }

    @Override
    public String toString() {
        return "User{" +
                "id='" + id + '\'' +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                ", roleTitle='" + roleTitle + '\'' +
                ", timezone='" + timezone + '\'' +
                ", lastLoginAt='" + lastLoginAt + '\'' +
                '}';
    }
}
