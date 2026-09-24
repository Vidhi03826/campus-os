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

@Service
public class StudentResumeService {

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

        validationService.validate(file);

        User user = getCurrentUser(userDetails);

        StudentProfile student =
                studentProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        if( resumeRepository.existsByStudent_User_Id(user.getId()))
        {
            throw new ResourceAlreadyExistsException(
                    "Resume already exists"
            );
        }

        String storageKey =
                storageService.store(file);

        Resume resume = new Resume(
                student,
                extractOriginalFileName(file),
                storageKey,
                file.getContentType(),
                file.getSize()
        );

        Resume saved = resumeRepository.save(resume);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResume(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        Resume resume =
                resumeRepository.findByStudent_User_Id(user.getId())
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

        User user = getCurrentUser(userDetails);

        Resume resume =
                resumeRepository.findByStudent_User_Id(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Resume not found"
                                )
                        );

        byte[] fileBytes =
                storageService.load(
                        resume.getStorageKey()
                );

        return new ByteArrayResource(fileBytes);
    }

    @Transactional
    public void deleteResume(
            UserDetails userDetails
    ) throws IOException {

        User user = getCurrentUser(userDetails);

        Resume resume =
                resumeRepository.findByStudent_User_Id(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Resume not found"
                                )
                        );

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

        return java.nio.file.Paths
                .get(originalName)
                .getFileName()
                .toString();
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