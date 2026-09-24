package com.vidhi.campusos.dto;

import com.vidhi.campusos.entity.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateApplicationStatusRequest(

        @NotNull(message = "Status is required")
        ApplicationStatus status

) {
}