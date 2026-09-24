package com.vidhi.campusos.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "companies",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_company_name",
                        columnNames = "name"
                )
        }
)
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 500)
    private String website;

    @Column(length = 200)
    private String location;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Company() {
    }

    public Company(
            String name,
            String description,
            String website,
            String location
    ) {
        this.name = name;
        this.description = description;
        this.website = website;
        this.location = location;
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

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getWebsite() {
        return website;
    }

    public String getLocation() {
        return location;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}