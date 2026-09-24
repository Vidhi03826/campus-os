package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Application;
import com.vidhi.campusos.entity.ApplicationStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository
        extends JpaRepository<Application, Long> {

    boolean existsByStudentIdAndJobId(
            Long studentId,
            Long jobId
    );

    List<Application> findByStudentIdOrderByAppliedAtDesc(
            Long studentId
    );

    List<Application> findByJobIdOrderByAppliedAtDesc(
            Long jobId
    );

    Optional<Application> findByIdAndStudentId(
            Long applicationId,
            Long studentId
    );

    long countByStatus(
            ApplicationStatus status
    );
}