package com.vidhi.campusos.service;

import org.springframework.core.io.Resource;

public record CandidateResumeFile(
        Resource resource,
        String fileName
) {
}