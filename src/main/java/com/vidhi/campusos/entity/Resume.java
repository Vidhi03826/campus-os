package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "resumes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_resume_student",
                        columnNames = "student_id"
                ),
                @UniqueConstraint(
                        name = "uk_resume_storage_key",
                        columnNames = "storage_key"
                )
        }
)
public class Resume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "student_id",
            nullable = false,
            unique = true
    )
    private StudentProfile student;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 500, unique = true)
    private String storageKey;

    @Column(nullable = false, length = 100)
    private String contentType;

    @Column(nullable = false)
    private long fileSize;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Resume() {
    }

    public Resume(
            StudentProfile student,
            String fileName,
            String storageKey,
            String contentType,
            long fileSize
    ) {
        this.student = student;
        this.fileName = fileName;
        this.storageKey = storageKey;
        this.contentType = contentType;
        this.fileSize = fileSize;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
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

    public String getFileName() {
        return fileName;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getContentType() {
        return contentType;
    }

    public long getFileSize() {
        return fileSize;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}