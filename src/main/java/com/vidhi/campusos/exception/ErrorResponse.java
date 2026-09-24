package com.vidhi.campusos.exception;

import java.time.Instant;

public record ErrorResponse(
        int status,
        String message,
        String path,
        Instant timestamp
) {
}