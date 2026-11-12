package io.skillbridge.exception;

import java.util.Collections;
import java.util.List;

/**
 * Phase 2: Custom exception for clear and structured handling of invalid user input.
 */
public class ValidationException extends IllegalArgumentException {
    private static final long serialVersionUID = 1L;
    private final List<String> errors;

    public ValidationException(String message) {
        super(message);
        this.errors = List.of(message);
    }

    public ValidationException(List<String> errors) {
        super(errors != null && !errors.isEmpty() ? String.join("; ", errors) : "Validation failed.");
        this.errors = errors != null ? Collections.unmodifiableList(errors) : Collections.emptyList();
    }

    public List<String> getErrors() {
        return errors;
    }
}
