package io.skillbridge.operations;

import io.skillbridge.model.User;
import java.util.List;

/**
 * Phase 2 Syllabus Requirement: Dedicated UserOperations interface.
 * Defines business contracts for authentication, user registration,
 * credential validation, and profile management.
 */
public interface UserOperations {

    /**
     * Registers a new user with salted and hashed password.
     * @param user the user domain object
     * @param rawPassword the plain-text password to hash and validate
     * @return true if registration succeeded, false if duplicate or invalid
     * @throws IllegalArgumentException if validation rules fail
     */
    boolean registerUser(User user, String rawPassword);

    /**
     * Authenticates a user using email and password.
     * @param email the user email address
     * @param rawPassword the plain-text password to verify
     * @return the authenticated User object, or null if credentials are invalid
     */
    User authenticate(String email, String rawPassword);

    /**
     * Validates whether the given credentials match an existing record.
     * @param email user email
     * @param rawPassword plain-text password
     * @return true if valid, false otherwise
     */
    boolean validateCredentials(String email, String rawPassword);

    /**
     * Checks if the given email is already registered in the system.
     * @param email the email to check
     * @return true if already registered, false otherwise
     */
    boolean isEmailRegistered(String email);

    /**
     * Retrieves a user by email address.
     * @param email the email address
     * @return User object or null if not found
     */
    User getUserByEmail(String email);

    /**
     * Retrieves a user by unique identifier.
     * @param id the user id
     * @return User object or null if not found
     */
    User getUserById(String id);

    /**
     * Updates user timezone in database.
     * @param userId the user id
     * @param newTimezone the new timezone (e.g. Asia/Kolkata)
     * @return true if updated, false if user not found
     */
    boolean updateUserTimezone(String userId, String newTimezone);

    /**
     * Validates password against university syllabus security policy:
     * Minimum 8 characters, at least one uppercase, one lowercase, and one digit.
     * @param password the password string
     * @return true if compliant, false otherwise
     */
    boolean validatePasswordPolicy(String password);

    /**
     * Validates email format using standard RFC pattern.
     * @param email the email string
     * @return true if valid email format, false otherwise
     */
    boolean validateEmailFormat(String email);

    /**
     * Returns an unmodifiable list of all registered users.
     * @return list of User objects
     */
    List<User> getAllUsers();
}
