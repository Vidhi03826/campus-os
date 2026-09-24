package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResumeRepository
        extends JpaRepository<Resume, Long> {

    Optional<Resume> findByStudent_User_Id(Long userId);

    boolean existsByStudent_User_Id(Long userId);
}