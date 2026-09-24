package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.RecruiterVerificationStatus;

public record CompanyResponse(
        Long companyId,
        String companyName,
        String description,
        String website,
        String location,
        String recruiterDesignation,
        RecruiterVerificationStatus verificationStatus
) {
}