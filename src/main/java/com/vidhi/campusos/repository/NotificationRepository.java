package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(
            Long userId,
            Pageable pageable
    );

    long countByUserIdAndReadFalse(
            Long userId
    );

    Optional<Notification> findByIdAndUserId(
            Long notificationId,
            Long userId
    );
}