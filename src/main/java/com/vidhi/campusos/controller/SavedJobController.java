package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.SavedJobResponse;
import com.vidhi.campusos.service.SavedJobService;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/students/me/saved-jobs")
@SecurityRequirement(name = "bearerAuth")
public class SavedJobController {

    private final SavedJobService savedJobService;

    public SavedJobController(
            SavedJobService savedJobService
    ) {
        this.savedJobService = savedJobService;
    }

    // =========================================================
    // SAVE JOB
    // POST /api/students/me/saved-jobs/{jobId}
    // =========================================================

    @PostMapping("/{jobId}")
    public ResponseEntity<SavedJobResponse> saveJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        SavedJobResponse response =
                savedJobService.saveJob(
                        userDetails,
                        jobId
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // GET MY SAVED JOBS
    // GET /api/students/me/saved-jobs
    // =========================================================

    @GetMapping
    public ResponseEntity<List<SavedJobResponse>> getMySavedJobs(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        List<SavedJobResponse> response =
                savedJobService.getMySavedJobs(
                        userDetails
                );

        return ResponseEntity.ok(response);
    }

    // =========================================================
    // REMOVE SAVED JOB
    // DELETE /api/students/me/saved-jobs/{jobId}
    // =========================================================

    @DeleteMapping("/{jobId}")
    public ResponseEntity<Void> removeSavedJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        savedJobService.removeSavedJob(
                userDetails,
                jobId
        );

        return ResponseEntity.noContent().build();
    }
}