package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "recruiter_profiles",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_recruiter_user",
                        columnNames = "user_id"
                )
        }
)
public class RecruiterProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false,
            unique = true
    )
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "company_id",
            nullable = false
    )
    private Company company;

    @Column(length = 100)
    private String designation;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "verification_status",
            nullable = false,
            length = 30
    )
    private RecruiterVerificationStatus verificationStatus =
            RecruiterVerificationStatus.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected RecruiterProfile() {
    }

    public RecruiterProfile(
            User user,
            Company company,
            String designation
    ) {
        this.user = user;
        this.company = company;
        this.designation = designation;
    }

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Company getCompany() {
        return company;
    }

    public String getDesignation() {
        return designation;
    }

    public RecruiterVerificationStatus getVerificationStatus() {
        return verificationStatus;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public void setDesignation(String designation) {
        this.designation = designation;
    }

    public void setVerificationStatus(
            RecruiterVerificationStatus verificationStatus
    ) {
        this.verificationStatus = verificationStatus;
    }
}