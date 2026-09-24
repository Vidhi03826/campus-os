package com.vidhi.campusos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentProfileRequest(

        @NotBlank(message = "College is required")
        @Size(max = 200, message = "College must not exceed 200 characters")
        String college,

        @Size(max = 100, message = "Degree must not exceed 100 characters")
        String degree,

        @Size(max = 100, message = "Branch must not exceed 100 characters")
        String branch,

        @Min(value = 2000, message = "Invalid graduation year")
        @Max(value = 2100, message = "Invalid graduation year")
        Integer graduationYear,

        @Size(max = 5000, message = "Bio must not exceed 5000 characters")
        String bio
) {
}