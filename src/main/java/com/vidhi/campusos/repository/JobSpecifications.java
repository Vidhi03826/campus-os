package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobType;
import com.vidhi.campusos.entity.WorkMode;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public final class JobSpecifications {

    private JobSpecifications() {
    }

    public static Specification<Job> hasStatus(com.vidhi.campusos.entity.JobStatus status) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("status"), status);
    }

    public static Specification<Job> keywordContains(String keyword) {
        return (root, query, criteriaBuilder) -> {

            String pattern = "%" + keyword.trim().toLowerCase() + "%";

            return criteriaBuilder.or(
                    criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("title")),
                            pattern
                    ),
                    criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("description")),
                            pattern
                    )
            );
        };
    }

    public static Specification<Job> locationContains(String location) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + location.trim().toLowerCase() + "%"
                );
    }

    public static Specification<Job> hasJobType(JobType jobType) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("jobType"), jobType);
    }

    public static Specification<Job> hasWorkMode(WorkMode workMode) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.equal(root.get("workMode"), workMode);
    }

    public static Specification<Job> salaryAtLeast(BigDecimal minSalary) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(
                        root.get("salaryMax"),
                        minSalary
                );
    }

    public static Specification<Job> salaryAtMost(BigDecimal maxSalary) {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.lessThanOrEqualTo(
                        root.get("salaryMin"),
                        maxSalary
                );
    }
}