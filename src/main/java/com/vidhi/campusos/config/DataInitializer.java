
package com.vidhi.campusos.config;

import com.vidhi.campusos.entity.Skill;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.repository.SkillRepository;
import com.vidhi.campusos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
public class DataInitializer {

    @Value("${APP_ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${APP_ADMIN_PASSWORD:}")
    private String adminPassword;

    @Bean
    CommandLineRunner initializeData(
            SkillRepository skillRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            List<String> defaultSkills = List.of(
                    "Java",
                    "Spring Boot",
                    "Python",
                    "React",
                    "JavaScript",
                    "SQL",
                    "MySQL",
                    "Docker",
                    "Machine Learning",
                    "Git"
            );

            for (String skillName : defaultSkills) {
                if (!skillRepository.existsByNameIgnoreCase(skillName)) {
                    skillRepository.save(new Skill(skillName));
                }
            }

            if (adminEmail != null && !adminEmail.isBlank()
                    && adminPassword != null && adminPassword.length() >= 12) {

                String email = adminEmail.trim().toLowerCase();

                if (!userRepository.existsByEmail(email)) {
                    User admin = User.builder()
                            .name("CampusOS Admin")
                            .email(email)
                            .password(passwordEncoder.encode(adminPassword))
                            .role(UserRole.ADMIN)
                            .active(true)
                            .build();

                    userRepository.save(admin);
                    System.out.println("Initial admin account created.");
                }
            }
        };
    }
}
