package com.vidhi.campusos.dto;

import java.time.Instant;

public record ResumeResponse(
        Long id,
        String fileName,
        String contentType,
        long fileSize,
        Instant uploadedAt,
        String downloadUrl
) {
}