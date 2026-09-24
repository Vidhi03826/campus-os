package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.StudentProfileRequest;
import com.vidhi.campusos.dto.StudentProfileResponse;
import com.vidhi.campusos.service.StudentProfileService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController
@RequestMapping("/api/students/me/profile")
@Tag(
        name = "Students",
        description = "Student profile, skills and job discovery APIs"
)
@SecurityRequirement(name = "bearerAuth")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    public StudentProfileController(
            StudentProfileService studentProfileService
    ) {
        this.studentProfileService = studentProfileService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentProfileResponse createProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StudentProfileRequest request
    ) {
        return studentProfileService.createProfile(
                userDetails,
                request
        );
    }

    @GetMapping
    public StudentProfileResponse getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return studentProfileService.getMyProfile(
                userDetails
        );
    }

    @PutMapping
    public StudentProfileResponse updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody StudentProfileRequest request
    ) {
        return studentProfileService.updateMyProfile(
                userDetails,
                request
        );
    }

    @PostMapping("/skills/{skillId}")
    public StudentProfileResponse addSkill(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long skillId
    ) {
        return studentProfileService.addSkill(
                userDetails,
                skillId
        );
    }

    @DeleteMapping("/skills/{skillId}")
    public StudentProfileResponse removeSkill(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long skillId
    ) {
        return studentProfileService.removeSkill(
                userDetails,
                skillId
        );
    }
}