package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface JobRepository
        extends JpaRepository<Job, Long>,
        JpaSpecificationExecutor<Job> {

    Optional<Job> findByIdAndCompanyId(
            Long jobId,
            Long companyId
    );

    @EntityGraph(attributePaths = {
            "company"
    })
    List<Job> findByCompanyId(
            Long companyId
    );

    @EntityGraph(attributePaths = {
            "company"
    })
    Optional<Job> findById(Long jobId);

    @EntityGraph(attributePaths = {
            "company"
    })
    Page<Job> findAll(
            Specification<Job> specification,
            Pageable pageable
    );

    long countByStatus(
            JobStatus status
    );
}