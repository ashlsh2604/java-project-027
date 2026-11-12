package io.skillbridge.operations;

import io.skillbridge.exception.AuthenticationException;
import io.skillbridge.exception.ValidationException;
import io.skillbridge.model.User;
import java.util.List;

/**
 * Phase 2 Syllabus Requirement: Dedicated UserOperations interface.
 * Defines business contracts for authentication, user registration,
 * credential validation, and clear invalid input handling.
 */
public interface UserOperations {

    /**
     * Registers a new user with salted and hashed password.
     * @param user the user domain object
     * @param rawPassword the plain-text password to hash and validate
     * @return true if registration succeeded, false if duplicate or invalid
     * @throws ValidationException if validation rules fail
     */
    boolean registerUser(User user, String rawPassword) throws ValidationException;

    /**
     * Authenticates a user using username or email and password.
     * @param identifier user email or username
     * @param rawPassword the plain-text password to verify
     * @return the authenticated User object, or null if credentials are invalid
     */
    User authenticate(String identifier, String rawPassword);

    /**
     * Authenticates a user and throws an explicit AuthenticationException on failure.
     * Handles invalid inputs clearly.
     * @param identifier user email or username
     * @param rawPassword plain-text password
     * @return User object on success
     * @throws AuthenticationException if authentication fails
     * @throws ValidationException if input arguments are missing or malformed
     */
    User authenticateUser(String identifier, String rawPassword) throws AuthenticationException, ValidationException;

    /**
     * Validates whether the given credentials match an existing record.
     * @param identifier user email or username
     * @param rawPassword plain-text password
     * @return true if valid, false otherwise
     */
    boolean validateCredentials(String identifier, String rawPassword);

    /**
     * Checks if the given email is already registered in the system.
     * @param email the email to check
     * @return true if already registered, false otherwise
     */
    boolean isEmailRegistered(String email);

    /**
     * Checks if the given username is already registered in the system.
     * @param username the username to check
     * @return true if already registered, false otherwise
     */
    boolean isUsernameRegistered(String username);

    /**
     * Retrieves a user by email address.
     * @param email the email address
     * @return User object or null if not found
     */
    User getUserByEmail(String email);

    /**
     * Retrieves a user by username.
     * @param username the username
     * @return User object or null if not found
     */
    User getUserByUsername(String username);

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
     * Validates password against security policy:
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
     * Validates username format: 3-30 characters, alphanumeric with '.', '_', or '-'.
     * @param username the username string
     * @return true if valid username format, false otherwise
     */
    boolean validateUsernameFormat(String username);

    /**
     * Validates registration inputs and throws clear ValidationException on failure.
     * @param username user username
     * @param email user email
     * @param rawPassword plain-text password
     * @throws ValidationException on any invalid input
     */
    void validateUserInput(String username, String email, String rawPassword) throws ValidationException;

    /**
     * Returns an unmodifiable list of all registered users.
     * @return list of User objects
     */
    List<User> getAllUsers();
}
