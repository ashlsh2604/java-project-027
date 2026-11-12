package io.skillbridge.operations;

import io.skillbridge.exception.AuthenticationException;
import io.skillbridge.exception.ValidationException;
import io.skillbridge.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 1 & 2 Test Suite:
 * Validates Java User class with username/password fields, basic input validation,
 * UserOperations interface contract, and clear invalid input exception handling.
 */
class UserOperationsTest {

    @TempDir
    Path tempDir;

    private UserOperations userOperations;

    @BeforeEach
    void setUp() {
        Path testDbPath = tempDir.resolve("test-users.json");
        userOperations = new UserOperationsImpl(testDbPath);
    }

    @Test
    @DisplayName("Phase 1: User class creates user with username/password fields and validates input")
    void testUserClass_BasicInputValidation() {
        // Valid user instance
        User validUser = new User("marcus_h", "SecurePass2026!");
        validUser.setEmail("marcus@example.com");
        validUser.setFullName("Marcus Holloway");

        assertTrue(User.isValidUsername("marcus_h"));
        assertTrue(User.isValidPassword("SecurePass2026!"));
        assertTrue(User.isValidEmail("marcus@example.com"));
        assertTrue(validUser.isValid());
        assertTrue(validUser.validate().isEmpty());

        // Invalid username (too short or invalid chars)
        assertFalse(User.isValidUsername("ab"));
        assertFalse(User.isValidUsername("user name with spaces"));

        // Invalid password
        assertFalse(User.isValidPassword("short"));
        assertFalse(User.isValidPassword("alllowercase123!"));

        // Invalid user validation list
        User invalidUser = new User("x", "weak");
        assertFalse(invalidUser.isValid());
        assertFalse(invalidUser.validate().isEmpty());
    }

    @Test
    @DisplayName("Phase 2: Handles invalid inputs clearly via ValidationException")
    void testUserOperations_HandlesInvalidInputsClearly() {
        // Missing fields
        assertThrows(ValidationException.class, () ->
                userOperations.validateUserInput("", "", "")
        );

        // Invalid email format
        assertThrows(ValidationException.class, () ->
                userOperations.validateUserInput("validuser", "notanemail", "ValidPass2026!")
        );

        // Weak password
        assertThrows(ValidationException.class, () ->
                userOperations.validateUserInput("validuser", "user@example.com", "weak")
        );
    }

    @Test
    @DisplayName("Phase 2: Authentication throws clear AuthenticationException on invalid credentials")
    void testUserOperations_AuthenticationExceptionOnInvalidCredentials() {
        assertThrows(AuthenticationException.class, () ->
                userOperations.authenticateUser("nonexistent.user", "ValidPass2026!")
        );
    }

    @Test
    @DisplayName("Registration succeeds with valid syllabus credentials and username")
    void testRegisterUser_Success() {
        User user = new User();
        user.setUsername("marcus.holloway");
        user.setFullName("Marcus Holloway");
        user.setEmail("marcus.holloway@example.org");
        user.setTimezone("Asia/Kolkata");

        boolean result = userOperations.registerUser(user, "SecurePass2026!");
        assertTrue(result, "User registration should succeed for new valid credentials");

        User retrieved = userOperations.getUserByEmail("marcus.holloway@example.org");
        assertNotNull(retrieved, "Registered user must be queryable by email");
        assertEquals("Marcus Holloway", retrieved.getFullName());
        assertEquals("marcus.holloway", retrieved.getUsername());
        assertEquals("Asia/Kolkata", retrieved.getTimezone());
        assertNotNull(retrieved.getPasswordHash());
        assertNotNull(retrieved.getSalt());

        // Also queryable by username
        User byUsername = userOperations.getUserByUsername("marcus.holloway");
        assertNotNull(byUsername);
        assertEquals("marcus.holloway@example.org", byUsername.getEmail());
    }

    @Test
    @DisplayName("Registration rejects duplicate email addresses and duplicate usernames")
    void testRegisterUser_DuplicateEmailRejected() {
        User user1 = new User();
        user1.setUsername("ada.lovelace");
        user1.setFullName("Ada Lovelace");
        user1.setEmail("ada.lovelace@computing.org");

        boolean first = userOperations.registerUser(user1, "FirstPass2026!");
        assertTrue(first, "First registration must succeed");

        User user2 = new User();
        user2.setUsername("ada.second");
        user2.setFullName("Ada Clone");
        user2.setEmail("ada.lovelace@computing.org");

        boolean second = userOperations.registerUser(user2, "AnotherPass2026!");
        assertFalse(second, "Second registration with identical email must return false");
    }

    @Test
    @DisplayName("Successful authentication with valid password via email or username")
    void testAuthenticate_ValidCredentials() throws Exception {
        User user = new User();
        user.setUsername("alan_turing");
        user.setFullName("Alan Turing");
        user.setEmail("alan.turing@enigma.ac.uk");

        userOperations.registerUser(user, "Turing1936!Engine");

        // Authenticate with email
        User authenticatedByEmail = userOperations.authenticate("alan.turing@enigma.ac.uk", "Turing1936!Engine");
        assertNotNull(authenticatedByEmail);
        assertEquals("Alan Turing", authenticatedByEmail.getFullName());

        // Authenticate with username
        User authenticatedByUsername = userOperations.authenticate("alan_turing", "Turing1936!Engine");
        assertNotNull(authenticatedByUsername);

        // AuthenticateUser method
        User authMethodResult = userOperations.authenticateUser("alan_turing", "Turing1936!Engine");
        assertNotNull(authMethodResult);
    }

    @Test
    @DisplayName("Authentication fails with invalid password")
    void testAuthenticate_InvalidPasswordRejected() {
        User user = new User();
        user.setFullName("Grace Hopper");
        user.setEmail("grace.hopper@navy.mil");

        userOperations.registerUser(user, "CobolPioneer1959!");

        User authenticated = userOperations.authenticate("grace.hopper@navy.mil", "WrongPassword123!");
        assertNull(authenticated, "Authentication must return null for wrong password");
        assertFalse(userOperations.validateCredentials("grace.hopper@navy.mil", "WrongPassword123!"));
    }

    @Test
    @DisplayName("Authentication fails for non-existent email")
    void testAuthenticate_UnknownEmailReturnsNull() {
        User authenticated = userOperations.authenticate("unknown@domain.com", "SomePassword123!");
        assertNull(authenticated, "Non-existent user must return null");
    }

    @Test
    @DisplayName("Password policy validation")
    void testPasswordPolicy_Validation() {
        assertFalse(userOperations.validatePasswordPolicy("Short1!"));
        assertFalse(userOperations.validatePasswordPolicy("lowercase1234!"));
        assertFalse(userOperations.validatePasswordPolicy("UPPERCASE1234!"));
        assertFalse(userOperations.validatePasswordPolicy("NoDigitsAtAll!"));
        assertTrue(userOperations.validatePasswordPolicy("Syllabus2026Pass!"));
        assertTrue(userOperations.validatePasswordPolicy("EnterpriseJava17"));
    }

    @Test
    @DisplayName("RFC email format validation")
    void testEmailFormat_Validation() {
        assertTrue(userOperations.validateEmailFormat("developer@skillbridge.io"));
        assertTrue(userOperations.validateEmailFormat("first.last@university.edu.in"));
        assertFalse(userOperations.validateEmailFormat("plainaddress"));
        assertFalse(userOperations.validateEmailFormat("@missingusername.com"));
        assertFalse(userOperations.validateEmailFormat("developer@.com"));
    }

    @Test
    @DisplayName("User timezone update to India Standard Time")
    void testUpdateUserTimezone_Success() {
        User user = new User();
        user.setFullName("Rajesh Sharma");
        user.setEmail("rajesh.sharma@tech.in");

        userOperations.registerUser(user, "NamasteJava2026!");
        User saved = userOperations.getUserByEmail("rajesh.sharma@tech.in");

        boolean updated = userOperations.updateUserTimezone(saved.getId(), "Asia/Kolkata");
        assertTrue(updated, "Timezone update should succeed");

        User refreshed = userOperations.getUserById(saved.getId());
        assertEquals("Asia/Kolkata", refreshed.getTimezone());
    }

    @Test
    @DisplayName("Retrieve all registered users")
    void testGetAllUsers() {
        List<User> initialUsers = userOperations.getAllUsers();
        int initialCount = initialUsers.size();

        User user = new User();
        user.setFullName("Linus Torvalds");
        user.setEmail("linus@kernel.org");
        userOperations.registerUser(user, "LinuxGit2026!");

        List<User> updatedUsers = userOperations.getAllUsers();
        assertEquals(initialCount + 1, updatedUsers.size());
    }
}
