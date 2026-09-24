package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.*;
import com.vidhi.campusos.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController
@RequestMapping("/api/auth")
@Tag(
        name = "Authentication",
        description = "Registration, login, refresh token and authentication APIs"
)
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(
            @Valid @RequestBody RegisterRequest request
    ) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public TokenResponse login(
            @Valid @RequestBody LoginRequest request
    ) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        return authService.refreshAccessToken(
                request.refreshToken()
        );
    }

    @PostMapping("/logout")
    public void logout(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        authService.logout(request.refreshToken());
    }
}