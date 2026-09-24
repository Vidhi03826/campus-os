package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.SavedJob;
import com.vidhi.campusos.entity.SavedJobId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedJobRepository extends JpaRepository<SavedJob, SavedJobId> {

    boolean existsByStudent_IdAndJob_Id(Long studentId, Long jobId);

    Optional<SavedJob> findByStudent_IdAndJob_Id(Long studentId, Long jobId);

    List<SavedJob> findByStudent_IdOrderBySavedAtDesc(Long studentId);

    void deleteByStudent_IdAndJob_Id(Long studentId, Long jobId);

    List<SavedJob> findByStudent_IdAndJob_IdIn(
            Long studentId,
            List<Long> jobIds
    );
}