package com.vidhi.campusos.dto;

import java.util.Set;

public record StudentProfileResponse(
        Long id,
        String name,
        String email,
        String college,
        String degree,
        String branch,
        Integer graduationYear,
        String bio,
        Set<SkillResponse> skills
) {
}