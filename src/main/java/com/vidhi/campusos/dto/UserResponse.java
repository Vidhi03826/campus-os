package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.UserRole;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role
) {
}