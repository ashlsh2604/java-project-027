package io.plms.core.web;

import io.plms.core.domain.UserEntity;
import io.plms.core.service.AuthenticationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authService;

    public AuthController(AuthenticationService authService) {
        this.authService = authService;
    }

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8) String password
    ) {}

    public record RegisterRequest(
        @NotBlank @Size(min = 2, max = 120) String fullName,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 128) String password,
        @NotBlank String confirmPassword,
        @NotBlank String roleTitle,
        String timezone
    ) {}

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        UserEntity created = authService.registerUser(request);
        String token = authService.issueSessionToken(created);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "user", created,
            "token", token
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        UserEntity user = authService.authenticate(request.email(), request.password());
        String token = authService.issueSessionToken(user);
        return ResponseEntity.ok(Map.of(
            "user", user,
            "token", token
        ));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, Boolean>> logout(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        authService.revokeSessionToken(authHeader);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
