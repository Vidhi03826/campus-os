package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.JobRequest;
import com.vidhi.campusos.dto.JobResponse;
import com.vidhi.campusos.dto.PageResponse;
import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.vidhi.campusos.service.JobService;
import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@Tag(
        name = "Jobs",
        description = "Public job discovery and recruiter job management APIs"
)
public class JobController {

    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    // =========================
    // PUBLIC JOB ENDPOINTS
    // =========================

    @GetMapping("/api/jobs")
    public PageResponse<JobResponse> getPublishedJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) JobType jobType,
            @RequestParam(required = false) WorkMode workMode,
            @RequestParam(required = false) BigDecimal minSalary,
            @RequestParam(required = false) BigDecimal maxSalary,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {

        return jobService.getPublishedJobs(
                keyword,
                location,
                jobType,
                workMode,
                minSalary,
                maxSalary,
                page,
                size,
                sortBy,
                sortDir
        );
    }

    @GetMapping("/api/jobs/{jobId}")
    public JobResponse getPublishedJob(
            @PathVariable Long jobId
    ) {

        return jobService.getPublishedJob(jobId);
    }


    // =========================
    // RECRUITER ENDPOINTS
    // =========================

    @PostMapping("/api/recruiters/me/jobs")
    @ResponseStatus(HttpStatus.CREATED)
    public JobResponse createJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody JobRequest request
    ) {

        return jobService.createJob(
                userDetails,
                request
        );
    }

    @GetMapping("/api/recruiters/me/jobs")
    public List<JobResponse> getMyJobs(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return jobService.getMyJobs(
                userDetails
        );
    }

    @PutMapping("/api/recruiters/me/jobs/{jobId}")
    public JobResponse updateJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId,
            @Valid @RequestBody JobRequest request
    ) {

        return jobService.updateJob(
                userDetails,
                jobId,
                request
        );
    }

    @PatchMapping("/api/recruiters/me/jobs/{jobId}/publish")
    public JobResponse publishJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return jobService.publishJob(
                userDetails,
                jobId
        );
    }

    @PatchMapping("/api/recruiters/me/jobs/{jobId}/close")
    public JobResponse closeJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long jobId
    ) {

        return jobService.closeJob(
                userDetails,
                jobId
        );
    }
}