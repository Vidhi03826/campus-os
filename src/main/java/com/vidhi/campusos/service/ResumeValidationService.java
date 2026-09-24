package com.vidhi.campusos.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ResumeValidationService {

    private static final long MAX_SIZE =
            5 * 1024 * 1024;

    public void validate(MultipartFile file) {

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException(
                    "Resume file is required"
            );
        }

        if (file.getSize() > MAX_SIZE) {
            throw new IllegalArgumentException(
                    "Resume must not exceed 5 MB"
            );
        }

        String contentType =
                file.getContentType();

        if (!"application/pdf".equalsIgnoreCase(
                contentType
        )) {
            throw new IllegalArgumentException(
                    "Only PDF resumes are supported"
            );
        }
    }
}