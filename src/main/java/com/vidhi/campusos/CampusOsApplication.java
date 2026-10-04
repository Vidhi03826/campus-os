package com.vidhi.campusos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.persistence.autoconfigure.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan("com.vidhi.campusos.entity")
@EnableJpaRepositories("com.vidhi.campusos.repository")
public class CampusOsApplication {

    public static void main(String[] args) {
        SpringApplication.run(CampusOsApplication.class, args);
    }
}