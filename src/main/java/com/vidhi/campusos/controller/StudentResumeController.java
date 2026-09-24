package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.ResumeResponse;
import com.vidhi.campusos.service.StudentResumeService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;

@RestController
@RequestMapping("/api/students/me/resume")
public class StudentResumeController {

    private final StudentResumeService studentResumeService;

    public StudentResumeController(
            StudentResumeService studentResumeService
    ) {
        this.studentResumeService = studentResumeService;
    }

    @PostMapping(
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResumeResponse uploadResume(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestPart("file") MultipartFile file
    ) throws IOException {

        return studentResumeService.uploadResume(
                userDetails,
                file
        );
    }

    @GetMapping
    public ResumeResponse getResume(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return studentResumeService.getResume(
                userDetails
        );
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> downloadResume(
            @AuthenticationPrincipal UserDetails userDetails
    ) throws IOException {

        Resource resource =
                studentResumeService.downloadResume(
                        userDetails
                );

        return ResponseEntity.ok()
                .contentType(
                        MediaType.APPLICATION_PDF
                )
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition
                                .attachment()
                                .filename("resume.pdf")
                                .build()
                                .toString()
                )
                .body(resource);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteResume(
            @AuthenticationPrincipal UserDetails userDetails
    ) throws IOException {

        studentResumeService.deleteResume(
                userDetails
        );

        return ResponseEntity.noContent().build();
    }
}