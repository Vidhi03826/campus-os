package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "notifications",
        indexes = {
                @Index(
                        name = "idx_notifications_user",
                        columnList = "user_id"
                ),
                @Index(
                        name = "idx_notifications_user_read_created",
                        columnList = "user_id, is_read, created_at"
                )
        }
)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 40
    )
    private NotificationType type;

    @Column(
            nullable = false,
            length = 150
    )
    private String title;

    @Column(
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String message;

    @Column(
            name = "is_read",
            nullable = false
    )
    private boolean read = false;

    @Column(
            nullable = false,
            updatable = false
    )
    private Instant createdAt;

    protected Notification() {
    }

    public Notification(
            User user,
            NotificationType type,
            String title,
            String message
    ) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.read = false;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public boolean isRead() {
        return read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}