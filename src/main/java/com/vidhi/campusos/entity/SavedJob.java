package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "saved_jobs",
        indexes = {
                @Index(
                        name = "idx_saved_jobs_student",
                        columnList = "student_id"
                ),
                @Index(
                        name = "idx_saved_jobs_job",
                        columnList = "job_id"
                )
        }
)
@IdClass(SavedJobId.class)
public class SavedJob {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "student_id",
            nullable = false
    )
    private StudentProfile student;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "job_id",
            nullable = false
    )
    private Job job;

    @Column(
            name = "saved_at",
            nullable = false
    )
    private Instant savedAt;

    public SavedJob() {
    }

    public SavedJob(
            StudentProfile student,
            Job job
    ) {
        this.student = student;
        this.job = job;
        this.savedAt = Instant.now();
    }

    @PrePersist
    protected void onCreate() {

        if (savedAt == null) {
            savedAt = Instant.now();
        }
    }

    public StudentProfile getStudent() {
        return student;
    }

    public void setStudent(
            StudentProfile student
    ) {
        this.student = student;
    }

    public Job getJob() {
        return job;
    }

    public void setJob(
            Job job
    ) {
        this.job = job;
    }

    public Instant getSavedAt() {
        return savedAt;
    }

    public void setSavedAt(
            Instant savedAt
    ) {
        this.savedAt = savedAt;
    }
}