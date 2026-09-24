package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.LoginRequest;
import com.vidhi.campusos.dto.RegisterRequest;
import com.vidhi.campusos.dto.TokenResponse;
import com.vidhi.campusos.dto.UserResponse;
import com.vidhi.campusos.entity.RefreshToken;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.AccountLockedException;
import com.vidhi.campusos.exception.InvalidCredentialsException;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.repository.UserRepository;
import com.vidhi.campusos.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Set;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final com.vidhi.campusos.service.RefreshTokenService refreshTokenService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            com.vidhi.campusos.service.RefreshTokenService refreshTokenService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public UserResponse register(RegisterRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new ResourceAlreadyExistsException(
                    "An account with this email already exists"
            );
        }

        String encodedPassword =
                passwordEncoder.encode(request.password());

        User user = new User(
                request.name().trim(),
                email,
                encodedPassword,
                UserRole.STUDENT
        );

        User savedUser = userRepository.save(user);

        return new UserResponse(
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getRole()
        );
    }

    public TokenResponse login(LoginRequest request) {

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new InvalidCredentialsException(
                                "Invalid email or password"
                        )
                );

        if (!user.isActive()) {
            throw new AccountLockedException(
                    "Account is inactive"
            );
        }

        if (user.isAccountLocked()) {
            throw new AccountLockedException(
                    "Account is locked due to repeated failed login attempts"
            );
        }

        try {

            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.password()
                    )
            );

        } catch (Exception exception) {

            handleFailedLogin(user);

            throw new InvalidCredentialsException(
                    "Invalid email or password"
            );
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        String accessToken = jwtService.generateToken(
                user.getEmail(),
                Set.of(user.getRole().name())
        );

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(
                        user.getEmail()
                );

        return new TokenResponse(
                accessToken,
                refreshToken.getToken()
        );
    }

    @Transactional
    private void handleFailedLogin(User user) {

        int attempts = user.getFailedLoginAttempts() + 1;

        user.setFailedLoginAttempts(attempts);

        if (attempts >= 5) {
            user.setAccountLocked(true);
        }

        userRepository.save(user);
    }

    @Transactional
    public TokenResponse refreshAccessToken(
            String refreshTokenValue
    ) {

        RefreshToken refreshToken =
                refreshTokenService.verifyRefreshToken(
                        refreshTokenValue
                );

        User user = refreshToken.getUser();

        String accessToken = jwtService.generateToken(
                user.getEmail(),
                Set.of(user.getRole().name())
        );

        RefreshToken newRefreshToken =
                refreshTokenService.rotateRefreshToken(
                        refreshToken
                );

        return new TokenResponse(
                accessToken,
                newRefreshToken.getToken()
        );
    }

    @Transactional
    public void logout(String refreshTokenValue) {
        refreshTokenService.revoke(refreshTokenValue);
    }
}