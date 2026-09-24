package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

public record JobRequest(

        @NotBlank(message = "Job title is required")
        @Size(
                max = 200,
                message = "Job title must not exceed 200 characters"
        )
        String title,

        @NotBlank(message = "Job description is required")
        @Size(
                max = 10000,
                message = "Job description must not exceed 10000 characters"
        )
        String description,

        @Size(
                max = 200,
                message = "Location must not exceed 200 characters"
        )
        String location,

        @NotNull(message = "Job type is required")
        JobType jobType,

        @NotNull(message = "Work mode is required")
        WorkMode workMode,

        @Min(
                value = 0,
                message = "Minimum experience cannot be negative"
        )
        Integer experienceMin,

        @Min(
                value = 0,
                message = "Maximum experience cannot be negative"
        )
        Integer experienceMax,

        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Minimum salary cannot be negative"
        )
        BigDecimal salaryMin,

        @DecimalMin(
                value = "0.0",
                inclusive = true,
                message = "Maximum salary cannot be negative"
        )
        BigDecimal salaryMax,

        Instant applicationDeadline
) {
}