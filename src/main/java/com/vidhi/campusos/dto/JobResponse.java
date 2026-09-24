package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;

import java.math.BigDecimal;
import java.time.Instant;

public record JobResponse(
        Long id,
        Long companyId,
        String companyName,
        String title,
        String description,
        String location,
        JobType jobType,
        WorkMode workMode,
        Integer experienceMin,
        Integer experienceMax,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        JobStatus status,
        Instant applicationDeadline,
        Instant createdAt,
        Instant updatedAt
) {
}