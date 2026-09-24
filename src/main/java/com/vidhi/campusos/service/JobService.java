package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.JobDiscoveryResponse;
import com.vidhi.campusos.dto.JobRequest;
import com.vidhi.campusos.dto.JobResponse;
import com.vidhi.campusos.dto.PageResponse;
import com.vidhi.campusos.entity.Company;
import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.RecruiterVerificationStatus;
import com.vidhi.campusos.entity.SavedJob;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.entity.WorkMode;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.JobSpecifications;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.SavedJobRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SavedJobRepository savedJobRepository;

    public JobService(
            JobRepository jobRepository,
            UserRepository userRepository,
            RecruiterProfileRepository recruiterProfileRepository,
            StudentProfileRepository studentProfileRepository,
            SavedJobRepository savedJobRepository
    ) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.recruiterProfileRepository = recruiterProfileRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.savedJobRepository = savedJobRepository;
    }

    // =========================================================
    // CREATE JOB
    // =========================================================

    @Transactional
    public JobResponse createJob(
            UserDetails userDetails,
            JobRequest request
    ) {

        RecruiterProfile recruiter =
                getCurrentRecruiter(userDetails);

        Company company =
                recruiter.getCompany();

        Job job = new Job(
                company,
                request.title().trim(),
                request.description().trim(),
                normalize(request.location()),
                request.jobType(),
                request.workMode(),
                request.experienceMin(),
                request.experienceMax(),
                request.salaryMin(),
                request.salaryMax(),
                request.applicationDeadline()
        );

        validateJobData(job);

        Job savedJob =
                jobRepository.save(job);

        return toResponse(savedJob);
    }

    // =========================================================
    // PUBLIC JOB SEARCH
    // =========================================================

    @Transactional(readOnly = true)
    @Cacheable(
            value = "publishedJobs",
            key = "T(java.util.Arrays).asList(" +
                    "#keyword, " +
                    "#location, " +
                    "#jobType, " +
                    "#workMode, " +
                    "#minSalary, " +
                    "#maxSalary, " +
                    "#page, " +
                    "#size, " +
                    "#sortBy, " +
                    "#sortDir" +
                    ")"
    )
    public PageResponse<JobResponse> getPublishedJobs(
            String keyword,
            String location,
            JobType jobType,
            WorkMode workMode,
            BigDecimal minSalary,
            BigDecimal maxSalary,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {

        // -----------------------------------------------------
        // Validate pagination
        // -----------------------------------------------------

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page must be greater than or equal to 0"
            );
        }

        if (size < 1 || size > 50) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and 50"
            );
        }

        // -----------------------------------------------------
        // Safe sorting
        // -----------------------------------------------------

        String requestedSortBy =
                sortBy == null || sortBy.isBlank()
                        ? "createdAt"
                        : sortBy;

        String safeSortBy = switch (requestedSortBy) {

            case "title",
                 "createdAt",
                 "salaryMin",
                 "salaryMax",
                 "applicationDeadline" -> requestedSortBy;

            default -> "createdAt";
        };

        Sort.Direction direction =
                "asc".equalsIgnoreCase(sortDir)
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        /*
         * Add id as a tie-breaker.
         *
         * This makes pagination more deterministic when multiple jobs
         * have the same value for the primary sort field.
         */
        Sort sort =
                Sort.by(direction, safeSortBy)
                        .and(
                                Sort.by(
                                        Sort.Direction.ASC,
                                        "id"
                                )
                        );

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sort
                );

        // -----------------------------------------------------
        // Base specification
        // -----------------------------------------------------

        Specification<Job> specification =
                JobSpecifications.hasStatus(
                        JobStatus.PUBLISHED
                );

        // -----------------------------------------------------
        // Keyword search
        // -----------------------------------------------------

        if (keyword != null && !keyword.isBlank()) {

            specification =
                    specification.and(
                            JobSpecifications.keywordContains(
                                    keyword
                            )
                    );
        }

        // -----------------------------------------------------
        // Location filter
        // -----------------------------------------------------

        if (location != null && !location.isBlank()) {

            specification =
                    specification.and(
                            JobSpecifications.locationContains(
                                    location
                            )
                    );
        }

        // -----------------------------------------------------
        // Job type filter
        // -----------------------------------------------------

        if (jobType != null) {

            specification =
                    specification.and(
                            JobSpecifications.hasJobType(
                                    jobType
                            )
                    );
        }

        // -----------------------------------------------------
        // Work mode filter
        // -----------------------------------------------------

        if (workMode != null) {

            specification =
                    specification.and(
                            JobSpecifications.hasWorkMode(
                                    workMode
                            )
                    );
        }

        // -----------------------------------------------------
        // Minimum salary filter
        // -----------------------------------------------------

        if (minSalary != null) {

            if (minSalary.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Minimum salary cannot be negative"
                );
            }

            specification =
                    specification.and(
                            JobSpecifications.salaryAtLeast(
                                    minSalary
                            )
                    );
        }

        // -----------------------------------------------------
        // Maximum salary filter
        // -----------------------------------------------------

        if (maxSalary != null) {

            if (maxSalary.compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException(
                        "Maximum salary cannot be negative"
                );
            }

            specification =
                    specification.and(
                            JobSpecifications.salaryAtMost(
                                    maxSalary
                            )
                    );
        }

        // -----------------------------------------------------
        // Validate salary range
        // -----------------------------------------------------

        if (minSalary != null &&
                maxSalary != null &&
                minSalary.compareTo(maxSalary) > 0) {

            throw new IllegalArgumentException(
                    "Minimum salary cannot exceed maximum salary"
            );
        }

        // -----------------------------------------------------
        // Execute query
        // -----------------------------------------------------

        Page<Job> jobPage =
                jobRepository.findAll(
                        specification,
                        pageable
                );

        // -----------------------------------------------------
        // Convert entity → DTO
        // -----------------------------------------------------

        List<JobResponse> jobs =
                jobPage.getContent()
                        .stream()
                        .map(this::toResponse)
                        .toList();

        // -----------------------------------------------------
        // Return paginated response
        // -----------------------------------------------------

        return new PageResponse<>(
                jobs,
                jobPage.getNumber(),
                jobPage.getSize(),
                jobPage.getTotalElements(),
                jobPage.getTotalPages(),
                jobPage.hasNext()
        );
    }

    // =========================================================
    // GET ONE PUBLIC JOB
    // =========================================================

    @Transactional(readOnly = true)
    public JobResponse getPublishedJob(
            Long jobId
    ) {

        Job job =
                jobRepository.findById(jobId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        if (job.getStatus() != JobStatus.PUBLISHED) {

            throw new ResourceNotFoundException(
                    "Job not found"
            );
        }

        return toResponse(job);
    }

    // =========================================================
    // GET RECRUITER'S JOBS
    // =========================================================

    @Transactional(readOnly = true)
    public List<JobResponse> getMyJobs(
            UserDetails userDetails
    ) {

        RecruiterProfile recruiter =
                getCurrentRecruiter(userDetails);

        Long companyId =
                recruiter.getCompany().getId();

        return jobRepository
                .findByCompanyId(companyId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // =========================================================
    // UPDATE JOB
    // =========================================================

    @Transactional
    @CacheEvict(
            value = "publishedJobs",
            allEntries = true
    )
    public JobResponse updateJob(
            UserDetails userDetails,
            Long jobId,
            JobRequest request
    ) {

        RecruiterProfile recruiter =
                getCurrentRecruiter(userDetails);

        Long companyId =
                recruiter.getCompany().getId();

        Job job =
                jobRepository
                        .findByIdAndCompanyId(
                                jobId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        if (job.getStatus() == JobStatus.CLOSED ||
                job.getStatus() == JobStatus.ARCHIVED) {

            throw new IllegalStateException(
                    "Closed or archived jobs cannot be edited"
            );
        }

        job.setTitle(
                request.title().trim()
        );

        job.setDescription(
                request.description().trim()
        );

        job.setLocation(
                normalize(request.location())
        );

        job.setJobType(
                request.jobType()
        );

        job.setWorkMode(
                request.workMode()
        );

        job.setExperienceMin(
                request.experienceMin()
        );

        job.setExperienceMax(
                request.experienceMax()
        );

        job.setSalaryMin(
                request.salaryMin()
        );

        job.setSalaryMax(
                request.salaryMax()
        );

        job.setApplicationDeadline(
                request.applicationDeadline()
        );

        validateJobData(job);

        return toResponse(job);
    }

    // =========================================================
    // PUBLISH JOB
    // =========================================================

    @Transactional
    @CacheEvict(
            value = "publishedJobs",
            allEntries = true
    )
    public JobResponse publishJob(
            UserDetails userDetails,
            Long jobId
    ) {

        RecruiterProfile recruiter =
                getCurrentRecruiter(userDetails);

        // -----------------------------------------------------
        // Recruiter verification check
        // -----------------------------------------------------

        if (recruiter.getVerificationStatus()
                != RecruiterVerificationStatus.VERIFIED) {

            throw new AccessDeniedException(
                    "Recruiter must be verified before publishing jobs"
            );
        }

        Long companyId =
                recruiter.getCompany().getId();

        Job job =
                jobRepository
                        .findByIdAndCompanyId(
                                jobId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        // -----------------------------------------------------
        // State transition validation
        // -----------------------------------------------------

        if (job.getStatus() != JobStatus.DRAFT) {

            throw new IllegalStateException(
                    "Only draft jobs can be published"
            );
        }

        // -----------------------------------------------------
        // Deadline validation
        // -----------------------------------------------------

        if (job.getApplicationDeadline() != null &&
                !job.getApplicationDeadline()
                        .isAfter(Instant.now())) {

            throw new IllegalStateException(
                    "Application deadline must be in the future"
            );
        }

        validateJobData(job);

        job.setStatus(
                JobStatus.PUBLISHED
        );

        return toResponse(job);
    }

    // =========================================================
    // CLOSE JOB
    // =========================================================

    @Transactional
    @CacheEvict(
            value = "publishedJobs",
            allEntries = true
    )
    public JobResponse closeJob(
            UserDetails userDetails,
            Long jobId
    ) {

        RecruiterProfile recruiter =
                getCurrentRecruiter(userDetails);

        Long companyId =
                recruiter.getCompany().getId();

        Job job =
                jobRepository
                        .findByIdAndCompanyId(
                                jobId,
                                companyId
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        if (job.getStatus() != JobStatus.PUBLISHED) {

            throw new IllegalStateException(
                    "Only published jobs can be closed"
            );
        }

        job.setStatus(
                JobStatus.CLOSED
        );

        return toResponse(job);
    }

    // =========================================================
    // STUDENT JOB DISCOVERY
    // =========================================================

    @Transactional(readOnly = true)
    public Page<JobDiscoveryResponse> discoverJobs(
            UserDetails userDetails,
            String keyword,
            String location,
            JobType jobType,
            WorkMode workMode,
            BigDecimal minSalary,
            BigDecimal maxSalary,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {

        // -----------------------------------------------------
        // Get authenticated student
        // -----------------------------------------------------

        StudentProfile student =
                getCurrentStudent(userDetails);

        // -----------------------------------------------------
        // Pagination validation
        // -----------------------------------------------------

        if (page < 0) {

            throw new IllegalArgumentException(
                    "Page must be greater than or equal to 0"
            );
        }

        if (size < 1 || size > 50) {

            throw new IllegalArgumentException(
                    "Page size must be between 1 and 50"
            );
        }

        // -----------------------------------------------------
        // Validate salaries
        // -----------------------------------------------------

        if (minSalary != null &&
                minSalary.compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Minimum salary cannot be negative"
            );
        }

        if (maxSalary != null &&
                maxSalary.compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Maximum salary cannot be negative"
            );
        }

        if (minSalary != null &&
                maxSalary != null &&
                minSalary.compareTo(maxSalary) > 0) {

            throw new IllegalArgumentException(
                    "Minimum salary cannot exceed maximum salary"
            );
        }

        // -----------------------------------------------------
        // Safe sorting
        // -----------------------------------------------------

        String requestedSortBy =
                sortBy == null || sortBy.isBlank()
                        ? "createdAt"
                        : sortBy;

        String safeSortBy = switch (requestedSortBy) {

            case "title",
                 "createdAt",
                 "salaryMin",
                 "salaryMax",
                 "applicationDeadline" -> requestedSortBy;

            default -> "createdAt";
        };

        Sort.Direction direction =
                "asc".equalsIgnoreCase(sortDir)
                        ? Sort.Direction.ASC
                        : Sort.Direction.DESC;

        Sort sort =
                Sort.by(direction, safeSortBy)
                        .and(
                                Sort.by(
                                        Sort.Direction.ASC,
                                        "id"
                                )
                        );

        Pageable pageable =
                PageRequest.of(
                        page,
                        size,
                        sort
                );

        // -----------------------------------------------------
        // Base query: published jobs only
        // -----------------------------------------------------

        Specification<Job> specification =
                JobSpecifications.hasStatus(
                        JobStatus.PUBLISHED
                );

        // -----------------------------------------------------
        // Keyword
        // -----------------------------------------------------

        if (keyword != null && !keyword.isBlank()) {

            specification =
                    specification.and(
                            JobSpecifications.keywordContains(
                                    keyword
                            )
                    );
        }

        // -----------------------------------------------------
        // Location
        // -----------------------------------------------------

        if (location != null && !location.isBlank()) {

            specification =
                    specification.and(
                            JobSpecifications.locationContains(
                                    location
                            )
                    );
        }

        // -----------------------------------------------------
        // Job type
        // -----------------------------------------------------

        if (jobType != null) {

            specification =
                    specification.and(
                            JobSpecifications.hasJobType(
                                    jobType
                            )
                    );
        }

        // -----------------------------------------------------
        // Work mode
        // -----------------------------------------------------

        if (workMode != null) {

            specification =
                    specification.and(
                            JobSpecifications.hasWorkMode(
                                    workMode
                            )
                    );
        }

        // -----------------------------------------------------
        // Salary
        // -----------------------------------------------------

        if (minSalary != null) {

            specification =
                    specification.and(
                            JobSpecifications.salaryAtLeast(
                                    minSalary
                            )
                    );
        }

        if (maxSalary != null) {

            specification =
                    specification.and(
                            JobSpecifications.salaryAtMost(
                                    maxSalary
                            )
                    );
        }

        // -----------------------------------------------------
        // Execute paginated query
        // -----------------------------------------------------

        Page<Job> jobs =
                jobRepository.findAll(
                        specification,
                        pageable
                );

        // -----------------------------------------------------
        // Collect IDs from this page
        // -----------------------------------------------------

        List<Long> jobIds =
                jobs.getContent()
                        .stream()
                        .map(Job::getId)
                        .toList();

        // -----------------------------------------------------
        // Find which jobs are saved by this student
        //
        // ONE query for the whole page
        // instead of one query per job.
        // -----------------------------------------------------

        Set<Long> savedJobIds =
                new HashSet<>();

        if (!jobIds.isEmpty()) {

            List<SavedJob> savedJobs =
                    savedJobRepository
                            .findByStudent_IdAndJob_IdIn(
                                    student.getId(),
                                    jobIds
                            );

            savedJobIds =
                    savedJobs
                            .stream()
                            .map(
                                    savedJob ->
                                            savedJob
                                                    .getJob()
                                                    .getId()
                            )
                            .collect(
                                    Collectors.toSet()
                            );
        }

        // -----------------------------------------------------
        // Convert to student-specific response
        // -----------------------------------------------------

        final Set<Long> finalSavedJobIds =
                savedJobIds;

        return jobs.map(
                job ->
                        toJobDiscoveryResponse(
                                job,
                                finalSavedJobIds.contains(
                                        job.getId()
                                )
                        )
        );
    }

    // =========================================================
    // GET CURRENT RECRUITER
    // =========================================================

    private RecruiterProfile getCurrentRecruiter(
            UserDetails userDetails
    ) {

        User user =
                userRepository
                        .findByEmail(
                                userDetails.getUsername()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Authenticated user not found"
                                )
                        );

        if (user.getRole() != UserRole.RECRUITER) {

            throw new AccessDeniedException(
                    "Only recruiters can perform this operation"
            );
        }

        return recruiterProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Recruiter profile not found"
                        )
                );
    }

    // =========================================================
    // GET CURRENT STUDENT
    // =========================================================

    private StudentProfile getCurrentStudent(
            UserDetails userDetails
    ) {

        User user =
                userRepository
                        .findByEmail(
                                userDetails.getUsername()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Authenticated user not found"
                                )
                        );

        if (user.getRole() != UserRole.STUDENT) {

            throw new AccessDeniedException(
                    "Only students can perform this operation"
            );
        }

        return studentProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student profile not found"
                        )
                );
    }

    // =========================================================
    // VALIDATE JOB DATA
    // =========================================================

    private void validateJobData(
            Job job
    ) {

        if (job.getExperienceMin() != null &&
                job.getExperienceMax() != null &&
                job.getExperienceMin()
                        > job.getExperienceMax()) {

            throw new IllegalArgumentException(
                    "Minimum experience cannot exceed maximum experience"
            );
        }

        if (job.getSalaryMin() != null &&
                job.getSalaryMin()
                        .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Minimum salary cannot be negative"
            );
        }

        if (job.getSalaryMax() != null &&
                job.getSalaryMax()
                        .compareTo(BigDecimal.ZERO) < 0) {

            throw new IllegalArgumentException(
                    "Maximum salary cannot be negative"
            );
        }

        if (job.getSalaryMin() != null &&
                job.getSalaryMax() != null &&
                job.getSalaryMin()
                        .compareTo(job.getSalaryMax()) > 0) {

            throw new IllegalArgumentException(
                    "Minimum salary cannot exceed maximum salary"
            );
        }

        if (job.getApplicationDeadline() != null &&
                !job.getApplicationDeadline()
                        .isAfter(Instant.now())) {

            throw new IllegalArgumentException(
                    "Application deadline must be in the future"
            );
        }
    }

    // =========================================================
    // NORMALIZE INPUT
    // =========================================================

    private String normalize(
            String value
    ) {

        return value == null
                ? null
                : value.trim();
    }

    // =========================================================
    // JOB → JOB RESPONSE
    // =========================================================

    private JobResponse toResponse(
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
    // JOB → STUDENT DISCOVERY RESPONSE
    // =========================================================

    private JobDiscoveryResponse toJobDiscoveryResponse(
            Job job,
            boolean saved
    ) {

        Company company =
                job.getCompany();

        return new JobDiscoveryResponse(
                job.getId(),
                job.getTitle(),
                job.getDescription(),
                company.getId(),
                company.getName(),
                job.getLocation(),
                job.getJobType(),
                job.getWorkMode(),
                job.getExperienceMin(),
                job.getExperienceMax(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getApplicationDeadline(),
                saved
        );
    }
}