package com.vidhi.campusos.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI campusOsOpenAPI() {

        return new OpenAPI()

                .info(
                        new Info()
                                .title("CampusOS API")
                                .version("1.0.0")
                                .description(
                                        """
                                        CampusOS is a campus recruitment platform
                                        connecting students, recruiters and administrators.

                                        Core capabilities:
                                        - Authentication and JWT authorization
                                        - Student profiles and resumes
                                        - Job discovery and saved jobs
                                        - Job applications and application tracking
                                        - Recruiter and company management
                                        - Recruiter verification
                                        - Notifications
                                        - Administrative moderation and analytics
                                        """
                                )
                                .contact(
                                        new Contact()
                                                .name("CampusOS")
                                )
                                .license(
                                        new License()
                                                .name("CampusOS")
                                )
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        "bearerAuth",
                                        new SecurityScheme()
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }
}