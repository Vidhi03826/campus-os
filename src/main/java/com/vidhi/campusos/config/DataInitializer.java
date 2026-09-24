package com.vidhi.campusos.config;

import com.vidhi.campusos.entity.Skill;
import com.vidhi.campusos.repository.SkillRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeSkills(
            SkillRepository skillRepository
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

                if (!skillRepository
                        .existsByNameIgnoreCase(skillName)) {

                    skillRepository.save(
                            new Skill(skillName)
                    );
                }
            }
        };
    }
}