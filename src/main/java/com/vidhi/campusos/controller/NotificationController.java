package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.NotificationResponse;
import com.vidhi.campusos.dto.PageResponse;
import com.vidhi.campusos.service.NotificationService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@Tag(
        name = "Notifications",
        description = "User notification and read-status APIs"
)
@SecurityRequirement(name = "bearerAuth")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(
            NotificationService notificationService
    ) {
        this.notificationService =
                notificationService;
    }

    @GetMapping
    public PageResponse<NotificationResponse>
    getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        return notificationService.getMyNotifications(
                userDetails,
                page,
                size
        );
    }

    @GetMapping("/unread-count")
    public long getUnreadCount(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        return notificationService.getUnreadCount(
                userDetails
        );
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long notificationId
    ) {

        notificationService.markAsRead(
                userDetails,
                notificationId
        );

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails userDetails
    ) {

        notificationService.markAllAsRead(
                userDetails
        );

        return ResponseEntity.noContent().build();
    }
}