package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.JobResponse;
import com.vidhi.campusos.dto.SavedJobResponse;

import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.SavedJob;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;

import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;

import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.SavedJobRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SavedJobService {

    private final SavedJobRepository savedJobRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    public SavedJobService(
            SavedJobRepository savedJobRepository,
            StudentProfileRepository studentProfileRepository,
            UserRepository userRepository,
            JobRepository jobRepository
    ) {
        this.savedJobRepository =
                savedJobRepository;

        this.studentProfileRepository =
                studentProfileRepository;

        this.userRepository =
                userRepository;

        this.jobRepository =
                jobRepository;
    }

    // =========================================================
    // SAVE JOB
    // =========================================================

    @Transactional
    public SavedJobResponse saveJob(
            UserDetails userDetails,
            Long jobId
    ) {

        User user =
                getCurrentUser(userDetails);

        StudentProfile student =
                getCurrentStudent(user);

        Job job =
                jobRepository.findById(jobId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        // Students can save only visible/public jobs
        if (job.getStatus() != JobStatus.PUBLISHED) {

            throw new ResourceNotFoundException(
                    "Job not found"
            );
        }

        // Duplicate protection
        if (savedJobRepository
                .existsByStudent_IdAndJob_Id(
                        student.getId(),
                        job.getId()
                )) {

            throw new ResourceAlreadyExistsException(
                    "Job is already saved"
            );
        }

        SavedJob savedJob =
                new SavedJob(
                        student,
                        job
                );

        SavedJob persisted =
                savedJobRepository.save(
                        savedJob
                );

        return toResponse(
                persisted
        );
    }

    // =========================================================
    // GET MY SAVED JOBS
    // =========================================================

    @Transactional(readOnly = true)
    public List<SavedJobResponse> getMySavedJobs(
            UserDetails userDetails
    ) {

        User user =
                getCurrentUser(userDetails);

        StudentProfile student =
                getCurrentStudent(user);

        return savedJobRepository
                .findByStudent_IdOrderBySavedAtDesc(
                        student.getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // REMOVE SAVED JOB
    // =========================================================

    @Transactional
    public void removeSavedJob(
            UserDetails userDetails,
            Long jobId
    ) {

        User user =
                getCurrentUser(userDetails);

        StudentProfile student =
                getCurrentStudent(user);

        SavedJob savedJob =
                savedJobRepository
                        .findByStudent_IdAndJob_Id(
                                student.getId(),
                                jobId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Saved job not found"
                                )
                        );

        savedJobRepository.delete(
                savedJob
        );
    }

    // =========================================================
    // CURRENT USER
    // =========================================================

    private User getCurrentUser(
            UserDetails userDetails
    ) {

        return userRepository
                .findByEmail(
                        userDetails.getUsername()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }

    // =========================================================
    // CURRENT STUDENT
    // =========================================================

    private StudentProfile getCurrentStudent(
            User user
    ) {

        if (user.getRole() != UserRole.STUDENT) {

            throw new AccessDeniedException(
                    "Only students can save jobs"
            );
        }

        return studentProfileRepository
                .findByUserId(
                        user.getId()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student profile not found"
                        )
                );
    }

    // =========================================================
    // ENTITY → RESPONSE
    // =========================================================

    private SavedJobResponse toResponse(
            SavedJob savedJob
    ) {

        Job job =
                savedJob.getJob();

        JobResponse jobResponse =
                new JobResponse(
                        job.getId(),
                        job.getCompany().getId(),
                        job.getCompany().getName(),
                        job.getTitle(),
                        job.getDescription(),
                        job.getLocation(),
                        job.getJobType(),
                        job.getWorkMode(),
                        job.getExperienceMin(),
                        job.getExperienceMax(),
                        job.getSalaryMin(),
                        job.getSalaryMax(),
                        job.getStatus(),
                        job.getApplicationDeadline(),
                        job.getCreatedAt(),
                        job.getUpdatedAt()
                );

        return new SavedJobResponse(
                jobResponse,
                savedJob.getSavedAt()
        );
    }
}