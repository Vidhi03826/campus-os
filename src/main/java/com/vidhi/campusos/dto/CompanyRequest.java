package com.vidhi.campusos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CompanyRequest(

        @NotBlank(message = "Company name is required")
        @Size(
                max = 200,
                message = "Company name must not exceed 200 characters"
        )
        String name,

        @Size(
                max = 5000,
                message = "Description must not exceed 5000 characters"
        )
        String description,

        @Size(
                max = 500,
                message = "Website must not exceed 500 characters"
        )
        String website,

        @Size(
                max = 200,
                message = "Location must not exceed 200 characters"
        )
        String location,

        @Size(
                max = 100,
                message = "Designation must not exceed 100 characters"
        )
        String designation
) {
}