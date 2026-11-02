package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record JobMatchResponse(
        Long jobId,
        String title,
        String companyName,
        Long companyId,
        String location,
        JobType jobType,
        WorkMode workMode,
        Integer experienceMin,
        Integer experienceMax,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        Instant applicationDeadline,

        int matchScore,

        List<String> matchedSkills,
        List<String> missingSkills,

        int totalRequiredSkills,
        int matchedSkillCount
) {
}