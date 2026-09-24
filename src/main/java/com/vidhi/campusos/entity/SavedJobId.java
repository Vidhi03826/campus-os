package com.vidhi.campusos.entity;

import java.io.Serializable;
import java.util.Objects;

public class SavedJobId implements Serializable {

    private Long student;
    private Long job;

    public SavedJobId() {
    }

    public SavedJobId(
            Long student,
            Long job
    ) {
        this.student = student;
        this.job = job;
    }

    public Long getStudent() {
        return student;
    }

    public void setStudent(Long student) {
        this.student = student;
    }

    public Long getJob() {
        return job;
    }

    public void setJob(Long job) {
        this.job = job;
    }

    @Override
    public boolean equals(Object o) {

        if (this == o) {
            return true;
        }

        if (!(o instanceof SavedJobId that)) {
            return false;
        }

        return Objects.equals(student, that.student)
                && Objects.equals(job, that.job);
    }

    @Override
    public int hashCode() {

        return Objects.hash(
                student,
                job
        );
    }
}