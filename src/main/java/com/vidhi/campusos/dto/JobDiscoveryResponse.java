package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;

import java.math.BigDecimal;
import java.time.Instant;

public record JobDiscoveryResponse(

        Long id,

        String title,

        String description,

        Long companyId,

        String companyName,

        String location,

        JobType jobType,

        WorkMode workMode,

        Integer minExperienceYears,

        Integer maxExperienceYears,

        BigDecimal salaryMin,

        BigDecimal salaryMax,

        Instant deadline,

        boolean saved
) {
}