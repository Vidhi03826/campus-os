package com.vidhi.campusos.dto;

public record TokenResponse(
        String accessToken,
        String refreshToken
) {
}