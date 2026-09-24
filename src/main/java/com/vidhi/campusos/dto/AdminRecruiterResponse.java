package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.RecruiterVerificationStatus;

public record AdminRecruiterResponse(
        Long recruiterProfileId,
        Long userId,
        String recruiterName,
        String recruiterEmail,
        Long companyId,
        String companyName,
        String designation,
        RecruiterVerificationStatus verificationStatus
) {
}