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

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new refresh token.
     *
     * Returns the RAW token to the caller so it can be sent to the client.
     * Only the HASH is persisted in the database.
     */
    @Transactional
    public String createRefreshToken(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "User not found"
                        )
                );

        String rawToken = generateRawToken();

        RefreshToken refreshToken = new RefreshToken();

        refreshToken.setTokenHash(
                hashToken(rawToken)
        );

        refreshToken.setUser(user);

        refreshToken.setExpiryDate(
                Instant.now().plusMillis(refreshExpiration)
        );

        refreshToken.setRevoked(false);

        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    /**
     * Verifies a refresh token while taking a database row lock.
     *
     * The lock is important for preventing two concurrent refresh
     * requests from successfully using the same token.
     */
    public RefreshToken verifyRefreshToken(String rawToken) {

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken =
                refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
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

    /**
     * Revokes a refresh token.
     */
    @Transactional
    public void revoke(String rawToken) {

        String tokenHash = hashToken(rawToken);

        RefreshToken refreshToken =
                refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
                        .orElseThrow(() ->
                                new InvalidRefreshTokenException(
                                        "Invalid refresh token"
                                )
                        );

        refreshToken.setRevoked(true);

        refreshTokenRepository.save(refreshToken);
    }

    /**
     * Rotates a validated refresh token.
     *
     * The old token is revoked and a completely new refresh token
     * is generated.
     *

    public String rotateRefreshToken(
            RefreshToken oldToken
    ) {

        oldToken.setRevoked(true);

        refreshTokenRepository.save(oldToken);

        return createRefreshToken(
                oldToken.getUser().getEmail()
        );
    }

    /**
     * Generates a cryptographically strong random refresh token.
     *
     * 32 random bytes -> URL-safe Base64 string.
     */
    private String generateRawToken() {

        byte[] randomBytes = new byte[32];

        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(randomBytes);
    }
    @Transactional
    public String rotateRefreshToken(RefreshToken oldToken) {

        oldToken.setRevoked(true);

        refreshTokenRepository.save(oldToken);

        return createRefreshToken(
                oldToken.getUser().getEmail()
        );
    }

    /**
     * Hashes a raw token using SHA-256.
     *
     * The database never receives the raw refresh token.
     */
    private String hashToken(String rawToken) {

        try {

            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash =
                    digest.digest(
                            rawToken.getBytes(StandardCharsets.UTF_8)
                    );

            StringBuilder hex = new StringBuilder(
                    hash.length * 2
            );

            for (byte b : hash) {
                hex.append(
                        String.format("%02x", b)
                );
            }

            return hex.toString();

        } catch (NoSuchAlgorithmException exception) {

            throw new IllegalStateException(
                    "SHA-256 algorithm is not available",
                    exception
            );
        }
    }
}