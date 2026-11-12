package io.skillbridge.exception;

/**
 * Phase 2: Exception thrown when authentication credentials fail or user is invalid.
 */
public class AuthenticationException extends Exception {
    private static final long serialVersionUID = 1L;

    public AuthenticationException(String message) {
        super(message);
    }
}
