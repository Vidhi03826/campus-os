package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.ApplicationResponse;
import com.vidhi.campusos.dto.ApplicationStatusHistoryResponse;
import com.vidhi.campusos.dto.UpdateApplicationStatusRequest;
import com.vidhi.campusos.service.ApplicationService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(
        name = "Applications",
        description = "Student applications and recruiter application management"
)
@SecurityRequirement(name = "bearerAuth")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(
            ApplicationService applicationService
    ) {
        this.applicationService = applicationService;
    }

    // =========================================================
    // STUDENT - APPLY TO JOB
    // =========================================================

    @PostMapping("/students/me/jobs/{jobId}/applications")
    public ResponseEntity<ApplicationResponse> applyToJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return ResponseEntity.ok(
                applicationService.apply(
                        userDetails,
                        jobId
                )
        );
    }

    // =========================================================
    // STUDENT - GET MY APPLICATIONS
    // =========================================================

    @GetMapping("/students/me/applications")
    public ResponseEntity<List<ApplicationResponse>> getMyApplications(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return ResponseEntity.ok(
                applicationService.getMyApplications(
                        userDetails
                )
        );
    }

    // =========================================================
    // STUDENT - GET ONE APPLICATION
    // =========================================================

    @GetMapping("/students/me/applications/{applicationId}")
    public ResponseEntity<ApplicationResponse> getMyApplication(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long applicationId
    ) {

        return ResponseEntity.ok(
                applicationService.getMyApplication(
                        userDetails,
                        applicationId
                )
        );
    }

    // =========================================================
    // STUDENT - GET APPLICATION HISTORY
    // =========================================================

    @GetMapping(
            "/students/me/applications/{applicationId}/history"
    )
    public ResponseEntity<List<ApplicationStatusHistoryResponse>>
    getMyApplicationHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long applicationId
    ) {

        return ResponseEntity.ok(
                applicationService.getMyApplicationHistory(
                        userDetails,
                        applicationId
                )
        );
    }

    // =========================================================
    // STUDENT - WITHDRAW APPLICATION
    // =========================================================

    @PostMapping(
            "/students/me/applications/{applicationId}/withdraw"
    )
    public ResponseEntity<ApplicationResponse> withdrawApplication(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long applicationId
    ) {

        return ResponseEntity.ok(
                applicationService.withdrawApplication(
                        userDetails,
                        applicationId
                )
        );
    }

    // =========================================================
    // RECRUITER - GET APPLICANTS FOR JOB
    // =========================================================

    @GetMapping(
            "/recruiters/me/jobs/{jobId}/applications"
    )
    public ResponseEntity<List<ApplicationResponse>>
    getApplicantsForJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return ResponseEntity.ok(
                applicationService.getApplicantsForJob(
                        userDetails,
                        jobId
                )
        );
    }

    // =========================================================
    // RECRUITER - UPDATE APPLICATION STATUS
    // =========================================================

    @PatchMapping(
            "/recruiters/me/applications/{applicationId}/status"
    )
    public ResponseEntity<ApplicationResponse>
    updateApplicationStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long applicationId,
            @Valid @RequestBody UpdateApplicationStatusRequest request
    ) {

        return ResponseEntity.ok(
                applicationService.updateApplicationStatus(
                        userDetails,
                        applicationId,
                        request
                )
        );
    }
}