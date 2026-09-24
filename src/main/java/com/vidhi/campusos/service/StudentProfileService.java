package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.SkillResponse;
import com.vidhi.campusos.dto.StudentProfileRequest;
import com.vidhi.campusos.dto.StudentProfileResponse;
import com.vidhi.campusos.entity.Skill;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceAlreadyExistsException;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.SkillRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    public StudentProfileService(
            StudentProfileRepository studentProfileRepository,
            UserRepository userRepository,
            SkillRepository skillRepository
    ) {
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional
    public StudentProfileResponse createProfile(
            UserDetails userDetails,
            StudentProfileRequest request
    ) {

        User user = getCurrentUser(userDetails);

        if (user.getRole() != UserRole.STUDENT) {
            throw new AccessDeniedException(
                    "Only students can create student profiles"
            );
        }

        if (studentProfileRepository.existsByUserId(user.getId())) {
            throw new ResourceAlreadyExistsException(
                    "Student profile already exists"
            );
        }

        StudentProfile profile = new StudentProfile(
                user,
                request.college().trim(),
                request.degree() != null
                        ? request.degree().trim()
                        : null,
                request.branch() != null
                        ? request.branch().trim()
                        : null,
                request.graduationYear(),
                request.bio() != null
                        ? request.bio().trim()
                        : null
        );

        StudentProfile saved =
                studentProfileRepository.save(profile);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getMyProfile(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        StudentProfile profile =
                studentProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        return toResponse(profile);
    }

    @Transactional
    public StudentProfileResponse updateMyProfile(
            UserDetails userDetails,
            StudentProfileRequest request
    ) {

        User user = getCurrentUser(userDetails);

        StudentProfile profile =
                studentProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        profile.setCollege(request.college().trim());

        profile.setDegree(
                request.degree() != null
                        ? request.degree().trim()
                        : null
        );

        profile.setBranch(
                request.branch() != null
                        ? request.branch().trim()
                        : null
        );

        profile.setGraduationYear(
                request.graduationYear()
        );

        profile.setBio(
                request.bio() != null
                        ? request.bio().trim()
                        : null
        );

        return toResponse(profile);
    }

    @Transactional
    public StudentProfileResponse addSkill(
            UserDetails userDetails,
            Long skillId
    ) {

        User user = getCurrentUser(userDetails);

        if (user.getRole() != UserRole.STUDENT) {
            throw new AccessDeniedException(
                    "Only students can manage skills"
            );
        }

        StudentProfile profile =
                studentProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Skill not found"
                        )
                );

        profile.getSkills().add(skill);

        return toResponse(profile);
    }

    @Transactional
    public StudentProfileResponse removeSkill(
            UserDetails userDetails,
            Long skillId
    ) {

        User user = getCurrentUser(userDetails);

        if (user.getRole() != UserRole.STUDENT) {
            throw new AccessDeniedException(
                    "Only students can manage skills"
            );
        }

        StudentProfile profile =
                studentProfileRepository.findByUserId(user.getId())
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Student profile not found"
                                )
                        );

        boolean removed = profile.getSkills()
                .removeIf(skill ->
                        skill.getId().equals(skillId)
                );

        if (!removed) {
            throw new ResourceNotFoundException(
                    "Skill is not associated with this student"
            );
        }

        return toResponse(profile);
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

    private StudentProfileResponse toResponse(
            StudentProfile profile
    ) {

        User user = profile.getUser();

        Set<SkillResponse> skills =
                profile.getSkills()
                        .stream()
                        .map(skill ->
                                new SkillResponse(
                                        skill.getId(),
                                        skill.getName()
                                )
                        )
                        .collect(Collectors.toSet());

        return new StudentProfileResponse(
                profile.getId(),
                user.getName(),
                user.getEmail(),
                profile.getCollege(),
                profile.getDegree(),
                profile.getBranch(),
                profile.getGraduationYear(),
                profile.getBio(),
                skills
        );
    }
}