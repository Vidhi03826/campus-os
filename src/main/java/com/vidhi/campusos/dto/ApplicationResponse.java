package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.ApplicationStatus;

import java.time.Instant;

public record ApplicationResponse(
        Long applicationId,
        Long jobId,
        String jobTitle,
        Long companyId,
        String companyName,
        ApplicationStatus status,
        Instant appliedAt,
        Instant updatedAt
) {
}