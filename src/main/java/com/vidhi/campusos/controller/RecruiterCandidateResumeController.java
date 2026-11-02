package com.vidhi.campusos.controller;

import com.vidhi.campusos.service.CandidateResumeFile;
import com.vidhi.campusos.service.StudentResumeService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/recruiters/me/applications")
@SecurityRequirement(name = "bearerAuth")
public class RecruiterCandidateResumeController {

    private final StudentResumeService studentResumeService;

    public RecruiterCandidateResumeController(
            StudentResumeService studentResumeService
    ) {
        this.studentResumeService = studentResumeService;
    }

    @GetMapping("/{applicationId}/resume")
    public ResponseEntity<Resource> downloadCandidateResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long applicationId
    ) throws IOException {

        CandidateResumeFile file =
                studentResumeService.downloadCandidateResume(
                        userDetails,
                        applicationId
                );

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .cacheControl(CacheControl.noStore())
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(file.fileName())
                                .build()
                                .toString()
                )
                .header("X-Content-Type-Options", "nosniff")
                .body(file.resource());
    }
}