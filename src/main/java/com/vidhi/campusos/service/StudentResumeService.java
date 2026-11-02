
package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.ResumeResponse;
import com.vidhi.campusos.entity.Application;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.Resume;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.ApplicationRepository;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.ResumeRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;
import com.vidhi.campusos.service.storage.StorageService;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.InvalidPathException;
import java.nio.file.Paths;
import java.util.Objects;

@Service
public class StudentResumeService {

    private static final String PDF_CONTENT_TYPE =
            "application/pdf";

    private final ResumeRepository resumeRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final ResumeValidationService validationService;
    private final ApplicationRepository applicationRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;

    public StudentResumeService(
            ResumeRepository resumeRepository,
            StudentProfileRepository studentProfileRepository,
            UserRepository userRepository,
            StorageService storageService,
            ResumeValidationService validationService,
            ApplicationRepository applicationRepository,
            RecruiterProfileRepository recruiterProfileRepository
    ) {
        this.resumeRepository = resumeRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
        this.validationService = validationService;
        this.applicationRepository = applicationRepository;
        this.recruiterProfileRepository = recruiterProfileRepository;
    }

    // STUDENT: Upload resume
    @Transactional
    public ResumeResponse uploadResume(
            UserDetails userDetails,
            MultipartFile file
    ) throws IOException {

        // Validate before touching the filesystem or database.
        validationService.validate(file);

        User user = getCurrentUser(userDetails);

        StudentProfile student = studentProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student profile not found"
                        )
                );

        if (resumeRepository.existsByStudent_User_Id(user.getId())) {
            throw new ResourceAlreadyExistsException(
                    "Resume already exists"
            );
        }

        String storageKey = storageService.store(file);

        try {
            Resume resume = new Resume(
                    student,
                    extractOriginalFileName(file),
                    storageKey,
                    PDF_CONTENT_TYPE,
                    file.getSize()
            );

            Resume saved = resumeRepository.save(resume);

            return toResponse(saved);

        } catch (RuntimeException exception) {

            // Clean up the stored file if the database save fails.
            try {
                storageService.delete(storageKey);
            } catch (IOException cleanupException) {
                exception.addSuppressed(cleanupException);
            }

            throw exception;
        }
    }

    // STUDENT: Get resume metadata
    @Transactional(readOnly = true)
    public ResumeResponse getResume(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        Resume resume = resumeRepository
                .findByStudent_User_Id(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resume not found"
                        )
                );

        return toResponse(resume);
    }

    // STUDENT: Download own resume
    @Transactional(readOnly = true)
    public Resource downloadResume(
            UserDetails userDetails
    ) throws IOException {

        User user = getCurrentUser(userDetails);

        Resume resume = resumeRepository
                .findByStudent_User_Id(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resume not found"
                        )
                );

        byte[] fileBytes = storageService.load(
                resume.getStorageKey()
        );

        return new ByteArrayResource(fileBytes);
    }

    // STUDENT: Delete own resume
    @Transactional
    public void deleteResume(
            UserDetails userDetails
    ) throws IOException {

        User user = getCurrentUser(userDetails);

        Resume resume = resumeRepository
                .findByStudent_User_Id(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Resume not found"
                        )
                );

        // Delete the physical file before deleting its database record.
        storageService.delete(resume.getStorageKey());

        resumeRepository.delete(resume);
    }

    // RECRUITER: Download an applicant's resume
    @Transactional(readOnly = true)
    public CandidateResumeFile downloadCandidateResume(
            UserDetails userDetails,
            Long applicationId
    ) throws IOException {

        User recruiterUser = getCurrentUser(userDetails);

        if (recruiterUser.getRole() != UserRole.RECRUITER) {
            throw new AccessDeniedException(
                    "Only recruiters can download applicant resumes"
            );
        }

        RecruiterProfile recruiter = recruiterProfileRepository
                .findByUserId(recruiterUser.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Recruiter profile not found"
                        )
                );

        Application application = applicationRepository
                .findById(applicationId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Application not found"
                        )
                );

        // A recruiter may download resumes only for their own company.
        if (!Objects.equals(
                application.getJob().getCompany().getId(),
                recruiter.getCompany().getId()
        )) {
            throw new AccessDeniedException(
                    "You cannot access this candidate's resume"
            );
        }

        StudentProfile student = application.getStudent();

        Resume resume = resumeRepository
                .findByStudent_User_Id(student.getUser().getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "This candidate has not uploaded a resume"
                        )
                );

        byte[] fileBytes = storageService.load(
                resume.getStorageKey()
        );

        return new CandidateResumeFile(
                new ByteArrayResource(fileBytes),
                resume.getFileName()
        );
    }

    // Get the authenticated user
    private User getCurrentUser(
            UserDetails userDetails
    ) {

        return userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }

    // Safely extract the original uploaded filename
    private String extractOriginalFileName(
            MultipartFile file
    ) {

        String originalName = file.getOriginalFilename();

        if (originalName == null || originalName.isBlank()) {
            return "resume.pdf";
        }

        // Handle both Windows and Unix path separators.
        String normalizedName = originalName.replace('\\', '/');

        try {
            String fileName = Paths.get(normalizedName)
                    .getFileName()
                    .toString()
                    .trim();

            // Remove control characters.
            fileName = fileName
                    .replaceAll("[\\p{Cntrl}]", "")
                    .trim();

            if (fileName.isBlank()) {
                return "resume.pdf";
            }

            // Keep within the 255-character database limit.
            if (fileName.length() > 255) {
                fileName = fileName.substring(0, 255);
            }

            return fileName;

        } catch (InvalidPathException exception) {
            return "resume.pdf";
        }
    }

    // Convert the Resume entity to its response DTO
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
