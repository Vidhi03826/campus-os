package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationStatusHistoryRepository
        extends JpaRepository<ApplicationStatusHistory, Long> {

    List<ApplicationStatusHistory>
    findByApplicationIdOrderByChangedAtAsc(
            Long applicationId
    );
}