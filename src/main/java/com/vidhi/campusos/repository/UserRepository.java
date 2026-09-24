package com.vidhi.campusos.repository;

import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(UserRole role);
}