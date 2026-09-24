package com.vidhi.campusos.entity;

import jakarta.persistence.*;

@Entity
@Table(
        name = "skills",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_skill_name",
                        columnNames = "name"
                )
        }
)
public class Skill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    protected Skill() {
    }

    public Skill(String name) {
        this.name = name;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}