package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "applications",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_application_student_job",
                        columnNames = {"student_id", "job_id"}
                )
        },
        indexes = {
                @Index(
                        name = "idx_applications_student",
                        columnList = "student_id"
                ),
                @Index(
                        name = "idx_applications_job",
                        columnList = "job_id"
                ),
                @Index(
                        name = "idx_applications_status",
                        columnList = "status"
                )
        }
)
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "job_id",
            nullable = false
    )
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(
            nullable = false,
            length = 30
    )
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Column(nullable = false, updatable = false)
    private Instant appliedAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Application() {
    }

    public Application(
            StudentProfile student,
            Job job
    ) {
        this.student = student;
        this.job = job;
        this.status = ApplicationStatus.APPLIED;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.appliedAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public StudentProfile getStudent() {
        return student;
    }

    public Job getJob() {
        return job;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }
}