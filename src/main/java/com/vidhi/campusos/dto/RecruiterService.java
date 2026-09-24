package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.CompanyRequest;
import com.vidhi.campusos.dto.CompanyResponse;
import com.vidhi.campusos.entity.Company;
import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.CompanyRepository;
import com.vidhi.campusos.repository.RecruiterProfileRepository;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecruiterService {

    private final RecruiterProfileRepository recruiterProfileRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    public RecruiterService(
            RecruiterProfileRepository recruiterProfileRepository,
            CompanyRepository companyRepository,
            UserRepository userRepository
    ) {
        this.recruiterProfileRepository =
                recruiterProfileRepository;
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CompanyResponse createCompany(
            UserDetails userDetails,
            CompanyRequest request
    ) {

        User user = getCurrentUser(userDetails);

        if (user.getRole() != UserRole.RECRUITER) {
            throw new AccessDeniedException(
                    "Only recruiters can create company profiles"
            );
        }

        if (recruiterProfileRepository.existsByUserId(
                user.getId()
        )) {
            throw new ResourceAlreadyExistsException(
                    "Recruiter profile already exists"
            );
        }

        if (companyRepository.existsByNameIgnoreCase(
                request.name().trim()
        )) {
            throw new ResourceAlreadyExistsException(
                    "A company with this name already exists"
            );
        }

        Company company = new Company(
                request.name().trim(),
                request.description() != null
                        ? request.description().trim()
                        : null,
                request.website() != null
                        ? request.website().trim()
                        : null,
                request.location() != null
                        ? request.location().trim()
                        : null
        );

        Company savedCompany =
                companyRepository.save(company);

        RecruiterProfile recruiterProfile =
                new RecruiterProfile(
                        user,
                        savedCompany,
                        request.designation() != null
                                ? request.designation().trim()
                                : null
                );

        RecruiterProfile savedProfile =
                recruiterProfileRepository.save(
                        recruiterProfile
                );

        return toResponse(savedCompany, savedProfile);
    }

    @Transactional(readOnly = true)
    public CompanyResponse getMyCompany(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        RecruiterProfile recruiterProfile =
                recruiterProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        return toResponse(
                recruiterProfile.getCompany(),
                recruiterProfile
        );
    }

    @Transactional
    public CompanyResponse updateMyCompany(
            UserDetails userDetails,
            CompanyRequest request
    ) {

        User user = getCurrentUser(userDetails);

        RecruiterProfile recruiterProfile =
                recruiterProfileRepository
                        .findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Recruiter profile not found"
                                )
                        );

        Company company =
                recruiterProfile.getCompany();

        String requestedName =
                request.name().trim();

        if (!company.getName().equalsIgnoreCase(
                requestedName
        )
                && companyRepository.existsByNameIgnoreCase(
                requestedName
        )) {

            throw new ResourceAlreadyExistsException(
                    "A company with this name already exists"
            );
        }

        company.setName(requestedName);

        company.setDescription(
                request.description() != null
                        ? request.description().trim()
                        : null
        );

        company.setWebsite(
                request.website() != null
                        ? request.website().trim()
                        : null
        );

        company.setLocation(
                request.location() != null
                        ? request.location().trim()
                        : null
        );

        recruiterProfile.setDesignation(
                request.designation() != null
                        ? request.designation().trim()
                        : null
        );

        return toResponse(
                company,
                recruiterProfile
        );
    }

    private User getCurrentUser(
            UserDetails userDetails
    ) {

        return userRepository.findByEmail(
                userDetails.getUsername()
        ).orElseThrow(() ->
                new ResourceNotFoundException(
                        "Authenticated user not found"
                )
        );
    }

    private CompanyResponse toResponse(
            Company company,
            RecruiterProfile recruiterProfile
    ) {

        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getDescription(),
                company.getWebsite(),
                company.getLocation(),
                recruiterProfile.getDesignation(),
                recruiterProfile.getVerificationStatus()
        );
    }
}