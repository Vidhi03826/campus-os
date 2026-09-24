package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "jobs",
        indexes = {
                @Index(
                        name = "idx_jobs_company",
                        columnList = "company_id"
                ),
                @Index(
                        name = "idx_jobs_status",
                        columnList = "status"
                ),
                @Index(
                        name = "idx_jobs_deadline",
                        columnList = "application_deadline"
                )
        }
)
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "company_id",
            nullable = false
    )
    private Company company;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(length = 200)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "job_type",
            nullable = false,
            length = 30
    )
    private JobType jobType;

    @Enumerated(EnumType.STRING)
    @Column(
            name = "work_mode",
            nullable = false,
            length = 30
    )
    private WorkMode workMode;

    @Column(name = "experience_min")
    private Integer experienceMin;

    @Column(name = "experience_max")
    private Integer experienceMax;

    @Column(name = "salary_min", precision = 12, scale = 2)
    private BigDecimal salaryMin;

    @Column(name = "salary_max", precision = 12, scale = 2)
    private BigDecimal salaryMax;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private JobStatus status = JobStatus.DRAFT;

    @Column(name = "application_deadline")
    private Instant applicationDeadline;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Job() {
    }

    public Job(
            Company company,
            String title,
            String description,
            String location,
            JobType jobType,
            WorkMode workMode,
            Integer experienceMin,
            Integer experienceMax,
            BigDecimal salaryMin,
            BigDecimal salaryMax,
            Instant applicationDeadline
    ) {
        this.company = company;
        this.title = title;
        this.description = description;
        this.location = location;
        this.jobType = jobType;
        this.workMode = workMode;
        this.experienceMin = experienceMin;
        this.experienceMax = experienceMax;
        this.salaryMin = salaryMin;
        this.salaryMax = salaryMax;
        this.applicationDeadline = applicationDeadline;
        this.status = JobStatus.DRAFT;
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

    public Company getCompany() {
        return company;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public String getLocation() {
        return location;
    }

    public JobType getJobType() {
        return jobType;
    }

    public WorkMode getWorkMode() {
        return workMode;
    }

    public Integer getExperienceMin() {
        return experienceMin;
    }

    public Integer getExperienceMax() {
        return experienceMax;
    }

    public BigDecimal getSalaryMin() {
        return salaryMin;
    }

    public BigDecimal getSalaryMax() {
        return salaryMax;
    }

    public JobStatus getStatus() {
        return status;
    }

    public Instant getApplicationDeadline() {
        return applicationDeadline;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setJobType(JobType jobType) {
        this.jobType = jobType;
    }

    public void setWorkMode(WorkMode workMode) {
        this.workMode = workMode;
    }

    public void setExperienceMin(Integer experienceMin) {
        this.experienceMin = experienceMin;
    }

    public void setExperienceMax(Integer experienceMax) {
        this.experienceMax = experienceMax;
    }

    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }

    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public void setApplicationDeadline(
            Instant applicationDeadline
    ) {
        this.applicationDeadline = applicationDeadline;
    }
}