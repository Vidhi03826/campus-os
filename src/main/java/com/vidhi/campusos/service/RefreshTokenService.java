package com.vidhi.campusos.service;

import com.vidhi.campusos.entity.RefreshToken;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.exception.InvalidRefreshTokenException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.RefreshTokenRepository;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setToken(
                UUID.randomUUID().toString()
        );

        refreshToken.setUser(user);

        refreshToken.setExpiryDate(
                Instant.now().plusMillis(refreshExpiration)
        );

        refreshToken.setRevoked(false);

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyRefreshToken(String token) {

        RefreshToken refreshToken =
                refreshTokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new InvalidRefreshTokenException(
                                        "Invalid refresh token"
                                )
                        );

        if (refreshToken.isRevoked()) {
            throw new InvalidRefreshTokenException(
                    "Refresh token has been revoked"
            );
        }

        if (refreshToken.getExpiryDate()
                .isBefore(Instant.now())) {

            throw new InvalidRefreshTokenException(
                    "Refresh token has expired"
            );
        }

        return refreshToken;
    }

    @Transactional
    public void revoke(String token) {

        RefreshToken refreshToken =
                refreshTokenRepository.findByToken(token)
                        .orElseThrow(() ->
                                new InvalidRefreshTokenException(
                                        "Invalid refresh token"
                                )
                        );

        refreshToken.setRevoked(true);

        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public RefreshToken rotateRefreshToken(
            RefreshToken oldToken
    ) {

        oldToken.setRevoked(true);

        refreshTokenRepository.save(oldToken);

        return createRefreshToken(
                oldToken.getUser().getEmail()
        );
    }
}