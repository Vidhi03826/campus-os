package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.NotificationResponse;
import com.vidhi.campusos.dto.PageResponse;
import com.vidhi.campusos.entity.Notification;
import com.vidhi.campusos.entity.NotificationType;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.NotificationRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            NotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void notifyUser(
            User user,
            NotificationType type,
            String title,
            String message
    ) {

        Notification notification =
                new Notification(
                        user,
                        type,
                        title,
                        message
                );

        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> getMyNotifications(
            UserDetails userDetails,
            int page,
            int size
    ) {

        validatePagination(page, size);

        User user = getCurrentUser(userDetails);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );

        Page<Notification> notificationPage =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(
                                user.getId(),
                                pageable
                        );

        return new PageResponse<>(
                notificationPage.getContent()
                        .stream()
                        .map(this::toResponse)
                        .toList(),

                notificationPage.getNumber(),
                notificationPage.getSize(),
                notificationPage.getTotalElements(),
                notificationPage.getTotalPages(),
                notificationPage.hasNext()
        );
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        return notificationRepository
                .countByUserIdAndReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(
            UserDetails userDetails,
            Long notificationId
    ) {

        User user = getCurrentUser(userDetails);

        Notification notification =
                notificationRepository
                        .findByIdAndUserId(
                                notificationId,
                                user.getId()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Notification not found"
                                )
                        );

        notification.setRead(true);
    }

    @Transactional
    public void markAllAsRead(
            UserDetails userDetails
    ) {

        User user = getCurrentUser(userDetails);

        Page<Notification> page =
                notificationRepository
                        .findByUserIdOrderByCreatedAtDesc(
                                user.getId(),
                                Pageable.unpaged()
                        );

        for (Notification notification :
                page.getContent()) {

            notification.setRead(true);
        }
    }

    private User getCurrentUser(
            UserDetails userDetails
    ) {

        return userRepository
                .findByEmail(
                        userDetails.getUsername()
                )
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Authenticated user not found"
                        )
                );
    }

    private void validatePagination(
            int page,
            int size
    ) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "Page must be greater than or equal to 0"
            );
        }

        if (size < 1 || size > 50) {
            throw new IllegalArgumentException(
                    "Page size must be between 1 and 50"
            );
        }
    }

    private NotificationResponse toResponse(
            Notification notification
    ) {

        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}