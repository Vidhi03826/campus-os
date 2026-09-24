package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.UserResponse;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getCurrentUser(
            UserDetails userDetails
    ) {

        User user = userRepository.findByEmail(
                userDetails.getUsername()
        ).orElseThrow(() ->
                new IllegalStateException(
                        "Authenticated user not found"
                )
        );

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}