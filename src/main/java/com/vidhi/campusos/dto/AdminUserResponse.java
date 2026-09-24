package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.UserRole;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        boolean active,
        boolean accountLocked
) {
}