package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.CompanyRequest;
import com.vidhi.campusos.dto.CompanyResponse;
import com.vidhi.campusos.service.RecruiterService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
@RestController
@RequestMapping("/api/recruiters/me")
@Tag(
        name = "Recruiters",
        description = "Recruiter and company profile management APIs"
)
@SecurityRequirement(name = "bearerAuth")
public class RecruiterController {

    private final RecruiterService recruiterService;

    public RecruiterController(
            RecruiterService recruiterService
    ) {
        this.recruiterService = recruiterService;
    }

    @PostMapping("/company")
    @ResponseStatus(HttpStatus.CREATED)
    public CompanyResponse createCompany(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CompanyRequest request
    ) {
        return recruiterService.createCompany(
                userDetails,
                request
        );
    }

    @GetMapping("/company")
    public CompanyResponse getMyCompany(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return recruiterService.getMyCompany(
                userDetails
        );
    }

    @PutMapping("/company")
    public CompanyResponse updateMyCompany(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CompanyRequest request
    ) {
        return recruiterService.updateMyCompany(
                userDetails,
                request
        );
    }
}