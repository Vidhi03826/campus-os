package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.ResumeResponse;
import com.vidhi.campusos.entity.Resume;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.ResumeRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;
import com.vidhi.campusos.service.storage.StorageService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.InvalidPathException;
import java.nio.file.Paths;
import java.util.Locale;

@Service
public class StudentResumeService {

    private static final String PDF_CONTENT_TYPE =
            "application/pdf";

    private final ResumeRepository resumeRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ResumeValidationService validationService;

    public StudentResumeService(
            ResumeRepository resumeRepository,
            StudentProfileRepository studentProfileRepository,
            UserRepository userRepository,
            StorageService storageService,
            ResumeValidationService validationService
    ) {
        this.resumeRepository = resumeRepository;
        this.studentProfileRepository =
                studentProfileRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.validationService = validationService;
    }

    @Transactional
    public ResumeResponse uploadResume(
            UserDetails userDetails,
            MultipartFile file
    ) throws IOException {

        /*
         * Validate before touching the filesystem
         * or database.
         */
        validationService.validate(file);

        User user =
                getCurrentUser(userDetails);

        StudentProfile student =
                studentProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        if (resumeRepository
                .existsByStudent_User_Id(user.getId())) {

            throw new ResourceAlreadyExistsException(
                    "Resume already exists"
            );
        }

        String storageKey =
                storageService.store(file);

        try {

            Resume resume =
                    new Resume(
                            student,
                            extractOriginalFileName(file),
                            storageKey,
                            PDF_CONTENT_TYPE,
                            file.getSize()
                    );

            Resume saved =
                    resumeRepository.save(resume);

            return toResponse(saved);

        } catch (RuntimeException exception) {

            /*
             * The filesystem write succeeded, but the DB
             * operation failed.
             *
             * Because a DB transaction cannot automatically
             * roll back a filesystem write, explicitly clean
             * up the stored file.
             */
            try {

                storageService.delete(
                        storageKey
                );

            } catch (IOException cleanupException) {

                exception.addSuppressed(
                        cleanupException
                );
            }

            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResume(
            UserDetails userDetails
    ) {

        User user =
                getCurrentUser(userDetails);

        Resume resume =
                resumeRepository
                        .findByStudent_User_Id(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Resume not found"
                                )
                        );

        return toResponse(resume);
    }

    @Transactional(readOnly = true)
    public Resource downloadResume(
            UserDetails userDetails
    ) throws IOException {

        User user =
                getCurrentUser(userDetails);

        Resume resume =
                resumeRepository
                        .findByStudent_User_Id(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Resume not found"
                                )
                        );

        byte[] fileBytes =
                storageService.load(
                        resume.getStorageKey()
                );

        return new ByteArrayResource(
                fileBytes
        );
    }

    @Transactional
    public void deleteResume(
            UserDetails userDetails
    ) throws IOException {

        User user =
                getCurrentUser(userDetails);

        Resume resume =
                resumeRepository
                        .findByStudent_User_Id(
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Resume not found"
                                )
                        );

        /*
         * Delete the physical file first.
         *
         * If filesystem deletion fails, the exception
         * prevents the database transaction from completing.
         */
        storageService.delete(
                resume.getStorageKey()
        );

        resumeRepository.delete(resume);
    }

    private User getCurrentUser(
            UserDetails userDetails
    ) {

        return userRepository.findByEmail(
                userDetails.getUsername()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Authenticated user not found"
                )
        );
    }

    private String extractOriginalFileName(
            MultipartFile file
    ) {

        String originalName =
                file.getOriginalFilename();

        if (originalName == null ||
                originalName.isBlank()) {

            return "resume.pdf";
        }

        /*
         * Treat both Unix and Windows separators as path
         * separators because the filename originates from
         * an external client.
         */
        String normalizedName =
                originalName
                        .replace('\\', '/');

        try {

            String fileName =
                    Paths.get(normalizedName)
                            .getFileName()
                            .toString()
                            .trim();

            /*
             * Remove control characters from the display
             * filename.
             */
            fileName =
                    fileName.replaceAll(
                            "[\\p{Cntrl}]",
                            ""
                    ).trim();

            if (fileName.isBlank()) {
                return "resume.pdf";
            }

            /*
             * Database column allows 255 characters.
             */
            if (fileName.length() > 255) {

                fileName =
                        fileName.substring(
                                0,
                                255
                        );
            }

            return fileName;

        } catch (InvalidPathException exception) {

            return "resume.pdf";
        }
    }

    private ResumeResponse toResponse(
            Resume resume
    ) {

        return new ResumeResponse(
                resume.getId(),
                resume.getFileName(),
                resume.getContentType(),
                resume.getFileSize(),
                resume.getCreatedAt(),
                "/api/students/me/resume/download"
        );
    }
}