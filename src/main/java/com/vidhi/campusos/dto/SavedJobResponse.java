package com.vidhi.campusos.dto;

import java.time.Instant;

public record SavedJobResponse(
        JobResponse job,
        Instant savedAt
) {
}