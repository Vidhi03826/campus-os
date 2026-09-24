package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.ApplicationStatus;

import java.time.Instant;

public record ApplicationStatusHistoryResponse(
        Long historyId,
        Long applicationId,
        ApplicationStatus fromStatus,
        ApplicationStatus toStatus,
        Long changedByUserId,
        String changedByName,
        Instant changedAt
) {
}