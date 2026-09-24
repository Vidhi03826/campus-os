package com.vidhi.campusos.dto;

public record AdminAnalyticsResponse(

        long totalUsers,
        long totalStudents,
        long totalRecruiters,
        long totalAdmins,

        long totalRecruitersPending,

        long totalJobs,
        long draftJobs,
        long publishedJobs,
        long closedJobs,
        long archivedJobs,

        long totalApplications,
        long appliedApplications,
        long underReviewApplications,
        long shortlistedApplications,
        long interviewApplications,
        long selectedApplications,
        long rejectedApplications,
        long withdrawnApplications
) {
}