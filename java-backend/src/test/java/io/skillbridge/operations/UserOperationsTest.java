package io.skillbridge.operations;

import io.skillbridge.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Phase 2 & Phase 6 Test Suite:
 * Validates UserOperations contract, credential validation,
 * password policy compliance, and duplicate user rejection.
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
    @DisplayName("Requirement 6: User registration succeeds with valid syllabus credentials")
    void testRegisterUser_Success() {
        User user = new User();
        user.setFullName("Marcus Holloway");
        user.setEmail("marcus.holloway@example.org");
        user.setTimezone("Asia/Kolkata");

        boolean result = userOperations.registerUser(user, "SecurePass2026!");
        assertTrue(result, "User registration should succeed for new valid credentials");

        User retrieved = userOperations.getUserByEmail("marcus.holloway@example.org");
        assertNotNull(retrieved, "Registered user must be queryable by email");
        assertEquals("Marcus Holloway", retrieved.getFullName());
        assertEquals("Asia/Kolkata", retrieved.getTimezone());
        assertNotNull(retrieved.getPasswordHash());
        assertNotNull(retrieved.getSalt());
    }

    @Test
    @DisplayName("Requirement 6: Registration rejects duplicate email addresses")
    void testRegisterUser_DuplicateEmailRejected() {
        User user1 = new User();
        user1.setFullName("Ada Lovelace");
        user1.setEmail("ada.lovelace@computing.org");

        boolean first = userOperations.registerUser(user1, "FirstPass2026!");
        assertTrue(first, "First registration must succeed");

        User user2 = new User();
        user2.setFullName("Ada Clone");
        user2.setEmail("ada.lovelace@computing.org");

        boolean second = userOperations.registerUser(user2, "AnotherPass2026!");
        assertFalse(second, "Second registration with identical email must return false");
    }

    @Test
    @DisplayName("Requirement 6: Successful authentication with valid password")
    void testAuthenticate_ValidCredentials() {
        User user = new User();
        user.setFullName("Alan Turing");
        user.setEmail("alan.turing@enigma.ac.uk");

        userOperations.registerUser(user, "Turing1936!Engine");

        User authenticated = userOperations.authenticate("alan.turing@enigma.ac.uk", "Turing1936!Engine");
        assertNotNull(authenticated, "Authentication with correct credentials must return User object");
        assertEquals("Alan Turing", authenticated.getFullName());
        assertTrue(userOperations.validateCredentials("alan.turing@enigma.ac.uk", "Turing1936!Engine"));
    }

    @Test
    @DisplayName("Requirement 6: Authentication fails with invalid password")
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
    @DisplayName("Requirement 6: Authentication fails for non-existent email")
    void testAuthenticate_UnknownEmailReturnsNull() {
        User authenticated = userOperations.authenticate("unknown@domain.com", "SomePassword123!");
        assertNull(authenticated, "Non-existent user must return null");
    }

    @Test
    @DisplayName("Phase 2 Requirement: Syllabus password policy validation")
    void testPasswordPolicy_Validation() {
        // Less than 8 characters -> invalid
        assertFalse(userOperations.validatePasswordPolicy("Short1!"));
        // No uppercase -> invalid
        assertFalse(userOperations.validatePasswordPolicy("lowercase1234!"));
        // No lowercase -> invalid
        assertFalse(userOperations.validatePasswordPolicy("UPPERCASE1234!"));
        // No digit -> invalid
        assertFalse(userOperations.validatePasswordPolicy("NoDigitsAtAll!"));
        // Valid compliant passwords
        assertTrue(userOperations.validatePasswordPolicy("Syllabus2026Pass!"));
        assertTrue(userOperations.validatePasswordPolicy("EnterpriseJava17"));
    }

    @Test
    @DisplayName("Phase 2 Requirement: RFC email format validation")
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
    @DisplayName("Phase 2 Requirement: Retrieve all registered users")
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
