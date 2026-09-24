package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "application_status_history",
        indexes = {
                @Index(
                        name = "idx_status_history_application",
                        columnList = "application_id"
                ),
                @Index(
                        name = "idx_status_history_changed_at",
                        columnList = "changed_at"
                )
        }
)
public class ApplicationStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "application_id",
            nullable = false
    )
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "from_status",
            length = 30
    )
    private ApplicationStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "to_status",
            nullable = false,
            length = 30
    )
    private ApplicationStatus toStatus;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "changed_by_user_id",
            nullable = false
    )
    private User changedBy;

    @Column(
            name = "changed_at",
            nullable = false,
            updatable = false
    )
    private Instant changedAt;

    protected ApplicationStatusHistory() {
    }

    public ApplicationStatusHistory(
            Application application,
            ApplicationStatus fromStatus,
            ApplicationStatus toStatus,
            User changedBy
    ) {
        this.application = application;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.changedBy = changedBy;
    }

    @PrePersist
    protected void onCreate() {
        this.changedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public ApplicationStatus getFromStatus() {
        return fromStatus;
    }

    public ApplicationStatus getToStatus() {
        return toStatus;
    }

    public User getChangedBy() {
        return changedBy;
    }

    public Instant getChangedAt() {
        return changedAt;
    }
}