package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.AdminAnalyticsResponse;
import com.vidhi.campusos.dto.AdminRecruiterResponse;
import com.vidhi.campusos.dto.AdminUserResponse;
import com.vidhi.campusos.dto.JobResponse;

import com.vidhi.campusos.entity.ApplicationStatus;
import com.vidhi.campusos.entity.Company;
import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.RecruiterVerificationStatus;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;

import com.vidhi.campusos.exception.ResourceNotFoundException;

import com.vidhi.campusos.repository.ApplicationRepository;
import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.JobSpecifications;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AdminService {

    private final RecruiterProfileRepository recruiterProfileRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public AdminService(
            RecruiterProfileRepository recruiterProfileRepository,
            UserRepository userRepository,
            JobRepository jobRepository,
            ApplicationRepository applicationRepository
    ) {
        this.recruiterProfileRepository =
                recruiterProfileRepository;

        this.userRepository =
                userRepository;

        this.jobRepository =
                jobRepository;

        this.applicationRepository =
                applicationRepository;
    }

    // =========================================================
    // VERIFY ADMIN
    // =========================================================

    private User verifyAdmin(
            UserDetails userDetails
    ) {

        User admin =
                userRepository
                        .findByEmail(
                                userDetails.getUsername()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Authenticated user not found"
                                )
                        );

        if (admin.getRole() != UserRole.ADMIN) {

            throw new AccessDeniedException(
                    "Only admins can perform this operation"
            );
        }

        return admin;
    }

    // =========================================================
    // RECRUITER MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET PENDING RECRUITERS
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AdminRecruiterResponse>
    getPendingRecruiters(
            UserDetails userDetails
    ) {

        verifyAdmin(userDetails);

        return recruiterProfileRepository
                .findByVerificationStatus(
                        RecruiterVerificationStatus.PENDING
                )
                .stream()
                .map(this::toRecruiterResponse)
                .toList();
    }

    // ---------------------------------------------------------
    // VERIFY RECRUITER
    // ---------------------------------------------------------

    @Transactional
    public AdminRecruiterResponse verifyRecruiter(
            UserDetails userDetails,
            Long recruiterProfileId
    ) {

        verifyAdmin(userDetails);

        RecruiterProfile recruiter =
                recruiterProfileRepository
                        .findById(recruiterProfileId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        if (recruiter.getVerificationStatus()
                == RecruiterVerificationStatus.VERIFIED) {

            throw new IllegalStateException(
                    "Recruiter is already verified"
            );
        }

        recruiter.setVerificationStatus(
                RecruiterVerificationStatus.VERIFIED
        );

        RecruiterProfile savedRecruiter =
                recruiterProfileRepository.save(
                        recruiter
                );

        return toRecruiterResponse(
                savedRecruiter
        );
    }

    // ---------------------------------------------------------
    // REJECT RECRUITER
    // ---------------------------------------------------------

    @Transactional
    public AdminRecruiterResponse rejectRecruiter(
            UserDetails userDetails,
            Long recruiterProfileId
    ) {

        verifyAdmin(userDetails);

        RecruiterProfile recruiter =
                recruiterProfileRepository
                        .findById(recruiterProfileId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        if (recruiter.getVerificationStatus()
                == RecruiterVerificationStatus.REJECTED) {

            throw new IllegalStateException(
                    "Recruiter is already rejected"
            );
        }

        recruiter.setVerificationStatus(
                RecruiterVerificationStatus.REJECTED
        );

        RecruiterProfile savedRecruiter =
                recruiterProfileRepository.save(
                        recruiter
                );

        return toRecruiterResponse(
                savedRecruiter
        );
    }

    // =========================================================
    // JOB MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET ALL JOBS / FILTER BY STATUS
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<JobResponse> getJobs(
            UserDetails userDetails,
            JobStatus status
    ) {

        verifyAdmin(userDetails);

        Sort sort =
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                );

        List<Job> jobs;

        if (status == null) {

            jobs = jobRepository.findAll(sort);

        } else {

            Specification<Job> specification =
                    JobSpecifications.hasStatus(
                            status
                    );

            jobs = jobRepository.findAll(
                    specification,
                    sort
            );
        }

        return jobs.stream()
                .map(this::toJobResponse)
                .toList();
    }

    // ---------------------------------------------------------
    // CLOSE JOB
    // ---------------------------------------------------------

    @Transactional
    @CacheEvict(
            value = "publishedJobs",
            allEntries = true
    )
    public JobResponse closeJobAsAdmin(
            UserDetails userDetails,
            Long jobId
    ) {

        verifyAdmin(userDetails);

        Job job =
                jobRepository
                        .findById(jobId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        if (job.getStatus() == JobStatus.ARCHIVED) {

            throw new IllegalStateException(
                    "Archived jobs cannot be closed"
            );
        }

        if (job.getStatus() == JobStatus.CLOSED) {

            throw new IllegalStateException(
                    "Job is already closed"
            );
        }

        job.setStatus(
                JobStatus.CLOSED
        );

        return toJobResponse(job);
    }

    // ---------------------------------------------------------
    // ARCHIVE JOB
    // ---------------------------------------------------------

    @Transactional
    @CacheEvict(
            value = "publishedJobs",
            allEntries = true
    )
    public JobResponse archiveJob(
            UserDetails userDetails,
            Long jobId
    ) {

        verifyAdmin(userDetails);

        Job job =
                jobRepository
                        .findById(jobId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        if (job.getStatus() == JobStatus.ARCHIVED) {

            throw new IllegalStateException(
                    "Job is already archived"
            );
        }

        job.setStatus(
                JobStatus.ARCHIVED
        );

        return toJobResponse(job);
    }

    // =========================================================
    // ADMIN ANALYTICS
    // =========================================================

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getAnalytics(
            UserDetails userDetails
    ) {

        verifyAdmin(userDetails);

        // -------------------------
        // USER COUNTS
        // -------------------------

        long totalUsers =
                userRepository.count();

        long totalStudents =
                userRepository.countByRole(
                        UserRole.STUDENT
                );

        long totalRecruiters =
                userRepository.countByRole(
                        UserRole.RECRUITER
                );

        long totalAdmins =
                userRepository.countByRole(
                        UserRole.ADMIN
                );

        // -------------------------
        // RECRUITER COUNTS
        // -------------------------

        long totalRecruitersPending =
                recruiterProfileRepository
                        .countByVerificationStatus(
                                RecruiterVerificationStatus.PENDING
                        );

        // -------------------------
        // JOB COUNTS
        // -------------------------

        long totalJobs =
                jobRepository.count();

        long draftJobs =
                jobRepository.countByStatus(
                        JobStatus.DRAFT
                );

        long publishedJobs =
                jobRepository.countByStatus(
                        JobStatus.PUBLISHED
                );

        long closedJobs =
                jobRepository.countByStatus(
                        JobStatus.CLOSED
                );

        long archivedJobs =
                jobRepository.countByStatus(
                        JobStatus.ARCHIVED
                );

        // -------------------------
        // APPLICATION COUNTS
        // -------------------------

        long totalApplications =
                applicationRepository.count();

        long appliedApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.APPLIED
                );

        long underReviewApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.UNDER_REVIEW
                );

        long shortlistedApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.SHORTLISTED
                );

        long interviewApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.INTERVIEW
                );

        long selectedApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.SELECTED
                );

        long rejectedApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.REJECTED
                );

        long withdrawnApplications =
                applicationRepository.countByStatus(
                        ApplicationStatus.WITHDRAWN
                );

        return new AdminAnalyticsResponse(
                totalUsers,
                totalStudents,
                totalRecruiters,
                totalAdmins,

                totalRecruitersPending,

                totalJobs,
                draftJobs,
                publishedJobs,
                closedJobs,
                archivedJobs,

                totalApplications,
                appliedApplications,
                underReviewApplications,
                shortlistedApplications,
                interviewApplications,
                selectedApplications,
                rejectedApplications,
                withdrawnApplications
        );
    }

    // =========================================================
    // USER MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET ALL USERS
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(
            UserDetails userDetails
    ) {

        verifyAdmin(userDetails);

        return userRepository.findAll()
                .stream()
                .map(this::toAdminUserResponse)
                .toList();
    }

    // ---------------------------------------------------------
    // GET USER BY ID
    // ---------------------------------------------------------

    @Transactional(readOnly = true)
    public AdminUserResponse getUser(
            UserDetails userDetails,
            Long userId
    ) {

        verifyAdmin(userDetails);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        return toAdminUserResponse(user);
    }

    // ---------------------------------------------------------
    // ACTIVATE USER
    // ---------------------------------------------------------

    @Transactional
    public AdminUserResponse activateUser(
            UserDetails userDetails,
            Long userId
    ) {

        verifyAdmin(userDetails);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        user.setActive(true);

        User savedUser =
                userRepository.save(user);

        return toAdminUserResponse(
                savedUser
        );
    }

    // ---------------------------------------------------------
    // DEACTIVATE USER
    // ---------------------------------------------------------

    @Transactional
    public AdminUserResponse deactivateUser(
            UserDetails userDetails,
            Long userId
    ) {

        User admin =
                verifyAdmin(userDetails);

        if (admin.getId().equals(userId)) {

            throw new IllegalStateException(
                    "Admin cannot deactivate their own account"
            );
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        user.setActive(false);

        User savedUser =
                userRepository.save(user);

        return toAdminUserResponse(
                savedUser
        );
    }

    // ---------------------------------------------------------
    // UNLOCK USER
    // ---------------------------------------------------------

    @Transactional
    public AdminUserResponse unlockUser(
            UserDetails userDetails,
            Long userId
    ) {

        verifyAdmin(userDetails);

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "User not found"
                                )
                        );

        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);

        User savedUser =
                userRepository.save(user);

        return toAdminUserResponse(
                savedUser
        );
    }

    // =========================================================
    // ENTITY → RECRUITER RESPONSE
    // =========================================================

    private AdminRecruiterResponse
    toRecruiterResponse(
            RecruiterProfile recruiter
    ) {

        User user =
                recruiter.getUser();

        Company company =
                recruiter.getCompany();

        return new AdminRecruiterResponse(
                recruiter.getId(),
                user.getId(),
                user.getName(),
                user.getEmail(),
                company.getId(),
                company.getName(),
                recruiter.getDesignation(),
                recruiter.getVerificationStatus()
        );
    }

    // =========================================================
    // ENTITY → JOB RESPONSE
    // =========================================================

    private JobResponse toJobResponse(
            Job job
    ) {

        Company company =
                job.getCompany();

        return new JobResponse(
                job.getId(),
                company.getId(),
                company.getName(),
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
    }

    // =========================================================
    // ENTITY → ADMIN USER RESPONSE
    // =========================================================

    private AdminUserResponse
    toAdminUserResponse(
            User user
    ) {

        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.isActive(),
                user.isAccountLocked()
        );
    }
}