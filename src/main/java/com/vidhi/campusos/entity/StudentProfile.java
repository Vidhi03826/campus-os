package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

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

    @Column(nullable = false, length = 200)
    private String college;

    @Column(length = 100)
    private String degree;

    @Column(length = 100)
    private String branch;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected StudentProfile() {
    }

    public StudentProfile(
            User user,
            String college,
            String degree,
            String branch,
            Integer graduationYear,
            String bio
    ) {
        this.user = user;
        this.college = college;
        this.degree = degree;
        this.branch = branch;
        this.graduationYear = graduationYear;
        this.bio = bio;
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

    public User getUser() {
        return user;
    }

    public String getCollege() {
        return college;
    }

    public String getDegree() {
        return degree;
    }

    public String getBranch() {
        return branch;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public String getBio() {
        return bio;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setCollege(String college) {
        this.college = college;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }
    @ManyToMany
    @JoinTable(
            name = "student_skills",
            joinColumns = @JoinColumn(name = "student_id"),
            inverseJoinColumns = @JoinColumn(name = "skill_id")
    )
    private Set<Skill> skills = new HashSet<>();
    public Set<Skill> getSkills() {
        return skills;
    }
}