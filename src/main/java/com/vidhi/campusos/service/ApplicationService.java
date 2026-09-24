package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.ApplicationResponse;
import com.vidhi.campusos.dto.ApplicationStatusHistoryResponse;
import com.vidhi.campusos.dto.UpdateApplicationStatusRequest;
import com.vidhi.campusos.entity.Application;
import com.vidhi.campusos.entity.ApplicationStatus;
import com.vidhi.campusos.entity.ApplicationStatusHistory;
import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.NotificationType;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.ApplicationRepository;
import com.vidhi.campusos.repository.ApplicationStatusHistoryRepository;
import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository
            applicationStatusHistoryRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final RecruiterProfileRepository recruiterProfileRepository;
    private final JobRepository jobRepository;
    private final NotificationService notificationService;

    public ApplicationService(
            ApplicationRepository applicationRepository,
            ApplicationStatusHistoryRepository applicationStatusHistoryRepository,
            UserRepository userRepository,
            StudentProfileRepository studentProfileRepository,
            RecruiterProfileRepository recruiterProfileRepository,
            JobRepository jobRepository,
            NotificationService notificationService
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationStatusHistoryRepository =
                applicationStatusHistoryRepository;
        this.userRepository = userRepository;
        this.studentProfileRepository =
                studentProfileRepository;
        this.recruiterProfileRepository =
                recruiterProfileRepository;
        this.jobRepository = jobRepository;
        this.notificationService =
                notificationService;
    }

    @Transactional
    public ApplicationResponse apply(
            UserDetails userDetails,
            Long jobId
    ) {

        // =========================================================
        // 1. Resolve authenticated student
        // =========================================================

        User studentUser =
                getCurrentUser(userDetails);

        StudentProfile student =
                getCurrentStudent(studentUser);

        // =========================================================
        // 2. Find job
        // =========================================================

        Job job =
                jobRepository.findById(jobId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Job not found"
                                )
                        );

        // =========================================================
        // 3. Job must be published
        // =========================================================

        if (job.getStatus() != JobStatus.PUBLISHED) {

            throw new IllegalStateException(
                    "Applications are allowed only for published jobs"
            );
        }

        // =========================================================
        // 4. Deadline check
        // =========================================================

        if (job.getApplicationDeadline() != null &&
                !job.getApplicationDeadline()
                        .isAfter(Instant.now())) {

            throw new IllegalStateException(
                    "Application deadline has passed"
            );
        }

        // =========================================================
        // 5. Duplicate application check
        //
        // This happens BEFORE notifications and persistence.
        // =========================================================

        if (applicationRepository.existsByStudentIdAndJobId(
                student.getId(),
                job.getId()
        )) {

            throw new ResourceAlreadyExistsException(
                    "You have already applied to this job"
            );
        }

        // =========================================================
        // 6. Create application
        // =========================================================

        Application application =
                new Application(
                        student,
                        job
                );

        Application savedApplication =
                applicationRepository.save(
                        application
                );

        // =========================================================
        // 7. Create initial history
        // =========================================================

        ApplicationStatusHistory initialHistory =
                new ApplicationStatusHistory(
                        savedApplication,
                        null,
                        ApplicationStatus.APPLIED,
                        studentUser
                );

        applicationStatusHistoryRepository.save(
                initialHistory
        );

        // =========================================================
        // 8. Notify recruiters
        //
        // Notification happens only after a real application
        // has successfully been created.
        // =========================================================

        List<RecruiterProfile> recruiters =
                recruiterProfileRepository
                        .findByCompanyId(
                                job.getCompany().getId()
                        );

        for (RecruiterProfile recruiter : recruiters) {

            notificationService.notifyUser(
                    recruiter.getUser(),
                    NotificationType.APPLICATION_SUBMITTED,
                    "New Application Received",
                    "A student has applied for your job: "
                            + job.getTitle()
            );
        }

        // =========================================================
        // 9. Return response
        // =========================================================

        return toResponse(
                savedApplication
        );
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(
            UserDetails userDetails
    ) {

        StudentProfile student =
                getCurrentStudent(
                        getCurrentUser(userDetails)
                );

        return applicationRepository
                .findByStudentIdOrderByAppliedAtDesc(
                        student.getId()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ApplicationResponse getMyApplication(
            UserDetails userDetails,
            Long applicationId
    ) {

        StudentProfile student =
                getCurrentStudent(
                        getCurrentUser(userDetails)
                );

        Application application =
                applicationRepository
                        .findByIdAndStudentId(
                                applicationId,
                                student.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"
                                )
                        );

        return toResponse(application);
    }

    @Transactional(readOnly = true)
    public List<ApplicationStatusHistoryResponse>
    getMyApplicationHistory(
            UserDetails userDetails,
            Long applicationId
    ) {

        StudentProfile student =
                getCurrentStudent(
                        getCurrentUser(userDetails)
                );

        Application application =
                applicationRepository
                        .findByIdAndStudentId(
                                applicationId,
                                student.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"
                                )
                        );

        return applicationStatusHistoryRepository
                .findByApplicationIdOrderByChangedAtAsc(
                        application.getId()
                )
                .stream()
                .map(this::toHistoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getApplicantsForJob(
            UserDetails userDetails,
            Long jobId
    ) {

        User recruiterUser =
                getCurrentUser(userDetails);

        if (recruiterUser.getRole() != UserRole.RECRUITER) {
            throw new AccessDeniedException(
                    "Only recruiters can view job applicants"
            );
        }

        RecruiterProfile recruiter =
                recruiterProfileRepository
                        .findByUserId(recruiterUser.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Job not found"
                        )
                );

        if (!job.getCompany().getId()
                .equals(recruiter.getCompany().getId())) {

            throw new AccessDeniedException(
                    "You can only view applicants for your company's jobs"
            );
        }

        return applicationRepository
                .findByJobIdOrderByAppliedAtDesc(jobId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(
            UserDetails userDetails,
            Long applicationId,
            UpdateApplicationStatusRequest request
    ) {

        User recruiterUser =
                getCurrentUser(userDetails);

        if (recruiterUser.getRole() != UserRole.RECRUITER) {
            throw new AccessDeniedException(
                    "Only recruiters can update application status"
            );
        }

        RecruiterProfile recruiter =
                recruiterProfileRepository
                        .findByUserId(recruiterUser.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        Application application =
                applicationRepository.findById(applicationId)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"
                                )
                        );

        Job job = application.getJob();

        if (!job.getCompany().getId()
                .equals(recruiter.getCompany().getId())) {

            throw new AccessDeniedException(
                    "You can only update applications for your company's jobs"
            );
        }

        ApplicationStatus currentStatus =
                application.getStatus();

        ApplicationStatus newStatus =
                request.status();

        if (currentStatus == newStatus) {
            throw new IllegalStateException(
                    "Application is already in this status"
            );
        }

        validateTransition(
                currentStatus,
                newStatus
        );

        application.setStatus(newStatus);

        ApplicationStatusHistory history =
                new ApplicationStatusHistory(
                        application,
                        currentStatus,
                        newStatus,
                        recruiterUser
                );

        applicationStatusHistoryRepository.save(
                history
        );

        notificationService.notifyUser(
                application.getStudent().getUser(),
                NotificationType.APPLICATION_STATUS_CHANGED,
                "Application Status Updated",
                "Your application for "
                        + job.getTitle()
                        + " is now "
                        + newStatus.name()
                        + "."
        );

        return toResponse(application);
    }

    @Transactional
    public ApplicationResponse withdrawApplication(
            UserDetails userDetails,
            Long applicationId
    ) {

        User studentUser =
                getCurrentUser(userDetails);

        StudentProfile student =
                getCurrentStudent(studentUser);

        Application application =
                applicationRepository
                        .findByIdAndStudentId(
                                applicationId,
                                student.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Application not found"
                                )
                        );

        ApplicationStatus currentStatus =
                application.getStatus();

        if (currentStatus == ApplicationStatus.SELECTED ||
                currentStatus == ApplicationStatus.REJECTED ||
                currentStatus == ApplicationStatus.WITHDRAWN) {

            throw new IllegalStateException(
                    "Application cannot be withdrawn from its current status"
            );
        }

        application.setStatus(
                ApplicationStatus.WITHDRAWN
        );

        ApplicationStatusHistory history =
                new ApplicationStatusHistory(
                        application,
                        currentStatus,
                        ApplicationStatus.WITHDRAWN,
                        studentUser
                );

        applicationStatusHistoryRepository.save(
                history
        );

        return toResponse(application);
    }

    private void validateTransition(
            ApplicationStatus currentStatus,
            ApplicationStatus newStatus
    ) {

        boolean valid = switch (currentStatus) {

            case APPLIED ->
                    newStatus == ApplicationStatus.UNDER_REVIEW ||
                            newStatus == ApplicationStatus.REJECTED;

            case UNDER_REVIEW ->
                    newStatus == ApplicationStatus.SHORTLISTED ||
                            newStatus == ApplicationStatus.REJECTED;

            case SHORTLISTED ->
                    newStatus == ApplicationStatus.INTERVIEW ||
                            newStatus == ApplicationStatus.REJECTED;

            case INTERVIEW ->
                    newStatus == ApplicationStatus.SELECTED ||
                            newStatus == ApplicationStatus.REJECTED;

            case SELECTED,
                 REJECTED,
                 WITHDRAWN ->
                    false;
        };

        if (!valid) {
            throw new IllegalStateException(
                    "Invalid application status transition: "
                            + currentStatus
                            + " -> "
                            + newStatus
            );
        }
    }

    private StudentProfile getCurrentStudent(
            User user
    ) {

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

    private ApplicationResponse toResponse(
            Application application
    ) {

        Job job = application.getJob();

        return new ApplicationResponse(
                application.getId(),
                job.getId(),
                job.getTitle(),
                job.getCompany().getId(),
                job.getCompany().getName(),
                application.getStatus(),
                application.getAppliedAt(),
                application.getUpdatedAt()
        );
    }

    private ApplicationStatusHistoryResponse
    toHistoryResponse(
            ApplicationStatusHistory history
    ) {

        User changedBy =
                history.getChangedBy();

        return new ApplicationStatusHistoryResponse(
                history.getId(),
                history.getApplication().getId(),
                history.getFromStatus(),
                history.getToStatus(),
                changedBy.getId(),
                changedBy.getName(),
                history.getChangedAt()
        );
    }
}