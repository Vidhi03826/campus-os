package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.AdminAnalyticsResponse;
import com.vidhi.campusos.dto.AdminRecruiterResponse;
import com.vidhi.campusos.dto.AdminUserResponse;
import com.vidhi.campusos.dto.JobResponse;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.service.AdminService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@Tag(
        name = "Admin",
        description = "Recruiter verification, moderation, analytics and user management"
)
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final AdminService adminService;

    public AdminController(
            AdminService adminService
    ) {
        this.adminService = adminService;
    }

    // =========================================================
    // RECRUITER MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET PENDING RECRUITERS
    // ---------------------------------------------------------

    @GetMapping("/recruiters/pending")
    public ResponseEntity<List<AdminRecruiterResponse>>
    getPendingRecruiters(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return ResponseEntity.ok(
                adminService.getPendingRecruiters(
                        userDetails
                )
        );
    }

    // ---------------------------------------------------------
    // VERIFY RECRUITER
    // ---------------------------------------------------------

    @PatchMapping(
            "/recruiters/{recruiterProfileId}/verify"
    )
    public ResponseEntity<AdminRecruiterResponse>
    verifyRecruiter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long recruiterProfileId
    ) {

        return ResponseEntity.ok(
                adminService.verifyRecruiter(
                        userDetails,
                        recruiterProfileId
                )
        );
    }

    // ---------------------------------------------------------
    // REJECT RECRUITER
    // ---------------------------------------------------------

    @PatchMapping(
            "/recruiters/{recruiterProfileId}/reject"
    )
    public ResponseEntity<AdminRecruiterResponse>
    rejectRecruiter(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long recruiterProfileId
    ) {

        return ResponseEntity.ok(
                adminService.rejectRecruiter(
                        userDetails,
                        recruiterProfileId
                )
        );
    }

    // =========================================================
    // JOB MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET ALL JOBS
    // ---------------------------------------------------------

    @GetMapping("/jobs")
    public ResponseEntity<List<JobResponse>>
    getJobs(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) JobStatus status
    ) {

        return ResponseEntity.ok(
                adminService.getJobs(
                        userDetails,
                        status
                )
        );
    }

    // ---------------------------------------------------------
    // CLOSE JOB
    // ---------------------------------------------------------

    @PatchMapping("/jobs/{jobId}/close")
    public ResponseEntity<JobResponse>
    closeJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return ResponseEntity.ok(
                adminService.closeJobAsAdmin(
                        userDetails,
                        jobId
                )
        );
    }

    // ---------------------------------------------------------
    // ARCHIVE JOB
    // ---------------------------------------------------------

    @PatchMapping("/jobs/{jobId}/archive")
    public ResponseEntity<JobResponse>
    archiveJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return ResponseEntity.ok(
                adminService.archiveJob(
                        userDetails,
                        jobId
                )
        );
    }

    // =========================================================
    // ANALYTICS
    // =========================================================

    // ---------------------------------------------------------
    // GET ADMIN ANALYTICS
    // ---------------------------------------------------------

    @GetMapping("/analytics")
    public ResponseEntity<AdminAnalyticsResponse>
    getAnalytics(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return ResponseEntity.ok(
                adminService.getAnalytics(
                        userDetails
                )
        );
    }

    // =========================================================
    // USER MANAGEMENT
    // =========================================================

    // ---------------------------------------------------------
    // GET ALL USERS
    // ---------------------------------------------------------

    @GetMapping("/users")
    public ResponseEntity<List<AdminUserResponse>>
    getUsers(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return ResponseEntity.ok(
                adminService.getUsers(
                        userDetails
                )
        );
    }

    // ---------------------------------------------------------
    // GET USER BY ID
    // ---------------------------------------------------------

    @GetMapping("/users/{userId}")
    public ResponseEntity<AdminUserResponse>
    getUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                adminService.getUser(
                        userDetails,
                        userId
                )
        );
    }

    // ---------------------------------------------------------
    // ACTIVATE USER
    // ---------------------------------------------------------

    @PatchMapping("/users/{userId}/activate")
    public ResponseEntity<AdminUserResponse>
    activateUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                adminService.activateUser(
                        userDetails,
                        userId
                )
        );
    }

    // ---------------------------------------------------------
    // DEACTIVATE USER
    // ---------------------------------------------------------

    @PatchMapping("/users/{userId}/deactivate")
    public ResponseEntity<AdminUserResponse>
    deactivateUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                adminService.deactivateUser(
                        userDetails,
                        userId
                )
        );
    }

    // ---------------------------------------------------------
    // UNLOCK USER
    // ---------------------------------------------------------

    @PatchMapping("/users/{userId}/unlock")
    public ResponseEntity<AdminUserResponse>
    unlockUser(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long userId
    ) {

        return ResponseEntity.ok(
                adminService.unlockUser(
                        userDetails,
                        userId
                )
        );
    }
}