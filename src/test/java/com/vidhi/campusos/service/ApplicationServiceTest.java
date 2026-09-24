package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.ApplicationResponse;
import com.vidhi.campusos.dto.UpdateApplicationStatusRequest;
import com.vidhi.campusos.entity.Application;
import com.vidhi.campusos.entity.ApplicationStatus;
import com.vidhi.campusos.entity.ApplicationStatusHistory;
import com.vidhi.campusos.entity.Company;
import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.repository.ApplicationRepository;
import com.vidhi.campusos.repository.ApplicationStatusHistoryRepository;
import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private ApplicationStatusHistoryRepository applicationStatusHistoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private RecruiterProfileRepository recruiterProfileRepository;

    @Mock
    private JobRepository jobRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserDetails userDetails;

    private ApplicationService applicationService;

    @BeforeEach
    void setUp() {

        applicationService =
                new ApplicationService(
                        applicationRepository,
                        applicationStatusHistoryRepository,
                        userRepository,
                        studentProfileRepository,
                        recruiterProfileRepository,
                        jobRepository,
                        notificationService
                );
    }


    // =========================================================
    // APPLY - SUCCESS
    // =========================================================

    @Test
    void shouldApplySuccessfully() {

        User studentUser = mock(User.class);
        StudentProfile student = mock(StudentProfile.class);
        Job job = mock(Job.class);
        Company company = mock(Company.class);
        Application savedApplication = mock(Application.class);

        when(userDetails.getUsername())
                .thenReturn("student@example.com");

        when(userRepository.findByEmail("student@example.com"))
                .thenReturn(Optional.of(studentUser));

        when(studentUser.getRole())
                .thenReturn(UserRole.STUDENT);

        when(studentUser.getId())
                .thenReturn(1L);

        when(studentProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(student));

        when(student.getId())
                .thenReturn(10L);

        when(jobRepository.findById(100L))
                .thenReturn(Optional.of(job));

        when(job.getStatus())
                .thenReturn(JobStatus.PUBLISHED);

        when(job.getApplicationDeadline())
                .thenReturn(null);

        when(job.getId())
                .thenReturn(100L);

        when(job.getTitle())
                .thenReturn("Java Backend Intern");

        when(job.getCompany())
                .thenReturn(company);

        when(company.getId())
                .thenReturn(20L);

        when(company.getName())
                .thenReturn("Test Company");

        when(applicationRepository.existsByStudentIdAndJobId(
                10L,
                100L
        )).thenReturn(false);

        when(applicationRepository.save(any(Application.class)))
                .thenReturn(savedApplication);

        when(savedApplication.getId())
                .thenReturn(500L);

        when(savedApplication.getJob())
                .thenReturn(job);

        when(savedApplication.getStatus())
                .thenReturn(ApplicationStatus.APPLIED);

        when(savedApplication.getAppliedAt())
                .thenReturn(null);

        when(savedApplication.getUpdatedAt())
                .thenReturn(null);

        ApplicationResponse response =
                applicationService.apply(
                        userDetails,
                        100L
                );

        assertNotNull(response);

        verify(applicationRepository)
                .save(any(Application.class));

        verify(applicationStatusHistoryRepository)
                .save(any(ApplicationStatusHistory.class));
    }


    // =========================================================
    // APPLY - DUPLICATE APPLICATION
    // =========================================================

    @Test
    void shouldRejectDuplicateApplication() {

        User studentUser = mock(User.class);
        StudentProfile student = mock(StudentProfile.class);
        Job job = mock(Job.class);

        when(userDetails.getUsername())
                .thenReturn("student@example.com");

        when(userRepository.findByEmail("student@example.com"))
                .thenReturn(Optional.of(studentUser));

        when(studentUser.getRole())
                .thenReturn(UserRole.STUDENT);

        when(studentUser.getId())
                .thenReturn(1L);

        when(studentProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(student));

        when(student.getId())
                .thenReturn(10L);

        when(jobRepository.findById(100L))
                .thenReturn(Optional.of(job));

        when(job.getStatus())
                .thenReturn(JobStatus.PUBLISHED);

        when(job.getApplicationDeadline())
                .thenReturn(null);

        when(job.getId())
                .thenReturn(100L);

        when(applicationRepository.existsByStudentIdAndJobId(
                10L,
                100L
        )).thenReturn(true);

        assertThrows(
                ResourceAlreadyExistsException.class,
                () ->
                        applicationService.apply(
                                userDetails,
                                100L
                        )
        );

        verify(applicationRepository, never())
                .save(any(Application.class));

        verify(applicationStatusHistoryRepository, never())
                .save(any(ApplicationStatusHistory.class));
    }


    // =========================================================
    // UPDATE STATUS - VALID TRANSITION
    // =========================================================

    @Test
    void shouldUpdateApplicationStatus() {

        User recruiterUser = mock(User.class);
        RecruiterProfile recruiter = mock(RecruiterProfile.class);
        Application application = mock(Application.class);
        Job job = mock(Job.class);
        Company company = mock(Company.class);
        StudentProfile student = mock(StudentProfile.class);
        User studentUser = mock(User.class);

        UpdateApplicationStatusRequest request =
                new UpdateApplicationStatusRequest(
                        ApplicationStatus.UNDER_REVIEW
                );

        when(userDetails.getUsername())
                .thenReturn("recruiter@example.com");

        when(userRepository.findByEmail("recruiter@example.com"))
                .thenReturn(Optional.of(recruiterUser));

        when(recruiterUser.getRole())
                .thenReturn(UserRole.RECRUITER);

        when(recruiterUser.getId())
                .thenReturn(2L);

        when(recruiterProfileRepository.findByUserId(2L))
                .thenReturn(Optional.of(recruiter));

        when(recruiter.getCompany())
                .thenReturn(company);

        when(company.getId())
                .thenReturn(20L);

        when(applicationRepository.findById(500L))
                .thenReturn(Optional.of(application));

        when(application.getJob())
                .thenReturn(job);

        when(job.getCompany())
                .thenReturn(company);

        when(application.getStatus())
                .thenReturn(ApplicationStatus.APPLIED);

        when(application.getStudent())
                .thenReturn(student);

        when(student.getUser())
                .thenReturn(studentUser);

        when(job.getTitle())
                .thenReturn("Java Backend Intern");

        when(job.getId())
                .thenReturn(100L);

        when(application.getId())
                .thenReturn(500L);

        when(application.getUpdatedAt())
                .thenReturn(null);

        ApplicationResponse response =
                applicationService.updateApplicationStatus(
                        userDetails,
                        500L,
                        request
                );

        assertNotNull(response);

        verify(application)
                .setStatus(
                        ApplicationStatus.UNDER_REVIEW
                );

        verify(applicationStatusHistoryRepository)
                .save(any(ApplicationStatusHistory.class));

        verify(notificationService)
                .notifyUser(
                        eq(studentUser),
                        any(),
                        anyString(),
                        anyString()
                );
    }


    // =========================================================
    // UPDATE STATUS - INVALID TRANSITION
    // =========================================================

    @Test
    void shouldRejectInvalidStatusTransition() {

        User recruiterUser = mock(User.class);
        RecruiterProfile recruiter = mock(RecruiterProfile.class);
        Application application = mock(Application.class);
        Job job = mock(Job.class);
        Company company = mock(Company.class);

        UpdateApplicationStatusRequest request =
                new UpdateApplicationStatusRequest(
                        ApplicationStatus.SELECTED
                );

        when(userDetails.getUsername())
                .thenReturn("recruiter@example.com");

        when(userRepository.findByEmail("recruiter@example.com"))
                .thenReturn(Optional.of(recruiterUser));

        when(recruiterUser.getRole())
                .thenReturn(UserRole.RECRUITER);

        when(recruiterUser.getId())
                .thenReturn(2L);

        when(recruiterProfileRepository.findByUserId(2L))
                .thenReturn(Optional.of(recruiter));

        when(recruiter.getCompany())
                .thenReturn(company);

        when(company.getId())
                .thenReturn(20L);

        when(applicationRepository.findById(500L))
                .thenReturn(Optional.of(application));

        when(application.getJob())
                .thenReturn(job);

        when(job.getCompany())
                .thenReturn(company);

        when(application.getStatus())
                .thenReturn(ApplicationStatus.APPLIED);

        assertThrows(
                IllegalStateException.class,
                () ->
                        applicationService.updateApplicationStatus(
                                userDetails,
                                500L,
                                request
                        )
        );

        verify(application, never())
                .setStatus(
                        ApplicationStatus.SELECTED
                );

        verify(applicationStatusHistoryRepository, never())
                .save(any(ApplicationStatusHistory.class));
    }


    // =========================================================
    // WITHDRAW - TERMINAL APPLICATION
    // =========================================================

    @Test
    void shouldRejectWithdrawalOfRejectedApplication() {

        User studentUser = mock(User.class);
        StudentProfile student = mock(StudentProfile.class);
        Application application = mock(Application.class);

        when(userDetails.getUsername())
                .thenReturn("student@example.com");

        when(userRepository.findByEmail("student@example.com"))
                .thenReturn(Optional.of(studentUser));

        when(studentUser.getRole())
                .thenReturn(UserRole.STUDENT);

        when(studentUser.getId())
                .thenReturn(1L);

        when(studentProfileRepository.findByUserId(1L))
                .thenReturn(Optional.of(student));

        when(student.getId())
                .thenReturn(10L);

        when(applicationRepository.findByIdAndStudentId(
                500L,
                10L
        )).thenReturn(Optional.of(application));

        when(application.getStatus())
                .thenReturn(ApplicationStatus.REJECTED);

        assertThrows(
                IllegalStateException.class,
                () ->
                        applicationService.withdrawApplication(
                                userDetails,
                                500L
                        )
        );

        verify(application, never())
                .setStatus(
                        ApplicationStatus.WITHDRAWN
                );

        verify(applicationStatusHistoryRepository, never())
                .save(any(ApplicationStatusHistory.class));
    }
}