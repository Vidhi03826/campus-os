package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.RecruiterProfile;
import com.vidhi.campusos.entity.RecruiterVerificationStatus;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecruiterProfileRepository
        extends JpaRepository<RecruiterProfile, Long> {

    Optional<RecruiterProfile> findByUserId(
            Long userId
    );

    boolean existsByUserId(
            Long userId
    );

    List<RecruiterProfile> findByCompanyId(
            Long companyId
    );

    List<RecruiterProfile> findByVerificationStatus(
            RecruiterVerificationStatus status
    );

    long countByVerificationStatus(
            RecruiterVerificationStatus status
    );
}