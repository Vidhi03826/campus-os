package com.vidhi.campusos.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;

@Service
public class ResumeValidationService {

    private static final long MAX_SIZE =
            5L * 1024 * 1024;

    private static final byte[] PDF_SIGNATURE =
            "%PDF-".getBytes(StandardCharsets.US_ASCII);

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

        validateExtension(file);

        validateContentType(file);

        validatePdfSignature(file);
    }

    private void validateExtension(
            MultipartFile file
    ) {

        String originalFilename =
                file.getOriginalFilename();

        if (originalFilename == null ||
                originalFilename.isBlank()) {

            throw new IllegalArgumentException(
                    "Resume filename is required"
            );
        }

        String normalized =
                originalFilename
                        .trim()
                        .toLowerCase(Locale.ROOT);

        if (!normalized.endsWith(".pdf")) {

            throw new IllegalArgumentException(
                    "Only PDF resumes are supported"
            );
        }
    }

    private void validateContentType(
            MultipartFile file
    ) {

        String contentType =
                file.getContentType();

        /*
         * Content-Type is only a request-provided hint.
         *
         * We don't rely on it alone because the actual PDF
         * signature is checked separately.
         */
        if (contentType != null &&
                !"application/pdf".equalsIgnoreCase(
                        contentType
                )) {

            throw new IllegalArgumentException(
                    "Only PDF resumes are supported"
            );
        }
    }

    private void validatePdfSignature(
            MultipartFile file
    ) {

        try (InputStream inputStream =
                     file.getInputStream()) {

            byte[] signature =
                    inputStream.readNBytes(
                            PDF_SIGNATURE.length
                    );

            if (!Arrays.equals(
                    signature,
                    PDF_SIGNATURE
            )) {

                throw new IllegalArgumentException(
                        "Uploaded file is not a valid PDF"
                );
            }

        } catch (IOException exception) {

            throw new IllegalArgumentException(
                    "Unable to read resume file",
                    exception
            );
        }
    }
}