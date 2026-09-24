package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;

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

    List<Job> findByCompanyId(
            Long companyId
    );

    long countByStatus(
            JobStatus status
    );
}