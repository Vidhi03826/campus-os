
package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.UpdateUserRequest;
import com.vidhi.campusos.dto.UserResponse;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getCurrentUser(UserDetails userDetails) {
        User user = getAuthenticatedUser(userDetails);
        return toResponse(user);
    }

    @Transactional
    public UserResponse updateCurrentUser(
            UserDetails userDetails,
            UpdateUserRequest request
    ) {
        User user = getAuthenticatedUser(userDetails);
        user.setName(request.name().trim());
        userRepository.save(user);
        return toResponse(user);
    }

    private User getAuthenticatedUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() ->
                        new IllegalStateException("Authenticated user not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole()
        );
    }
}
