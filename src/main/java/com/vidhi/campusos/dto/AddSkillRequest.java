package com.vidhi.campusos.dto;

import jakarta.validation.constraints.NotNull;

public record AddSkillRequest(

        @NotNull(message = "Skill ID is required")
        Long skillId
) {
}