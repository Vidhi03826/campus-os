CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_locked` bit(1) NOT NULL,
  `active` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(255) NOT NULL,
  `failed_login_attempts` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','RECRUITER','STUDENT') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `companies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text,
  `location` varchar(200) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `website` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_company_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `skills` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_skill_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `student_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `bio` text,
  `branch` varchar(100) DEFAULT NULL,
  `college` varchar(200) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `degree` varchar(100) DEFAULT NULL,
  `graduation_year` int DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKhlcwb2egnj8mj3e0mouse1lgy` (`user_id`),
  CONSTRAINT `FK32koy3tgqtaujxhfsn0b9pel2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `recruiter_profiles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `updated_at` datetime(6) NOT NULL,
  `verification_status` enum('PENDING','REJECTED','VERIFIED') NOT NULL,
  `company_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_recruiter_user` (`user_id`),
  KEY `FKiejgf2on9tl6vgrhau023fbgv` (`company_id`),
  CONSTRAINT `FKiejgf2on9tl6vgrhau023fbgv` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`),
  CONSTRAINT `FKptvsvv96hvn5sjrauymiew6gy` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `jobs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `application_deadline` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text NOT NULL,
  `experience_max` int DEFAULT NULL,
  `experience_min` int DEFAULT NULL,
  `job_type` enum('CONTRACT','FULL_TIME','INTERNSHIP','PART_TIME') NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `salary_max` decimal(12,2) DEFAULT NULL,
  `salary_min` decimal(12,2) DEFAULT NULL,
  `status` enum('ARCHIVED','CLOSED','DRAFT','PUBLISHED') NOT NULL,
  `title` varchar(200) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `work_mode` enum('HYBRID','ONSITE','REMOTE') NOT NULL,
  `company_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_jobs_company` (`company_id`),
  KEY `idx_jobs_status` (`status`),
  KEY `idx_jobs_deadline` (`application_deadline`),
  CONSTRAINT `FKrtmqcrktb6s7xq8djbs2a2war` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `student_skills` (
  `student_id` bigint NOT NULL,
  `skill_id` bigint NOT NULL,
  PRIMARY KEY (`student_id`,`skill_id`),
  KEY `FKdyl6ffxg89qebmlpcg2x3fnbw` (`skill_id`),
  CONSTRAINT `FK93mn9m8ibifmgtqmhkaosq1sl` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`),
  CONSTRAINT `FKdyl6ffxg89qebmlpcg2x3fnbw` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `applications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `applied_at` datetime(6) NOT NULL,
  `status` enum('APPLIED','INTERVIEW','REJECTED','SELECTED','SHORTLISTED','UNDER_REVIEW','WITHDRAWN') NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `job_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_application_student_job` (`student_id`,`job_id`),
  KEY `idx_applications_student` (`student_id`),
  KEY `idx_applications_job` (`job_id`),
  KEY `idx_applications_status` (`status`),
  CONSTRAINT `FK65weib1lru9dkrbto5pv389vi` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`),
  CONSTRAINT `FKtf8oyss5glfiyfw0hixe6aq2d` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `application_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `changed_at` datetime(6) NOT NULL,
  `from_status` enum('APPLIED','INTERVIEW','REJECTED','SELECTED','SHORTLISTED','UNDER_REVIEW','WITHDRAWN') DEFAULT NULL,
  `to_status` enum('APPLIED','INTERVIEW','REJECTED','SELECTED','SHORTLISTED','UNDER_REVIEW','WITHDRAWN') NOT NULL,
  `application_id` bigint NOT NULL,
  `changed_by_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_status_history_application` (`application_id`),
  KEY `idx_status_history_changed_at` (`changed_at`),
  KEY `FKfb625atilolbfug9sqxe9xbt1` (`changed_by_user_id`),
  CONSTRAINT `FKfb625atilolbfug9sqxe9xbt1` FOREIGN KEY (`changed_by_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKfdvnrm195jdlti0syxo6qah6h` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `saved_jobs` (
  `job_id` bigint NOT NULL,
  `student_id` bigint NOT NULL,
  `saved_at` datetime(6) NOT NULL,
  PRIMARY KEY (`job_id`,`student_id`),
  KEY `idx_saved_jobs_student` (`student_id`),
  KEY `idx_saved_jobs_job` (`job_id`),
  CONSTRAINT `FKawvc9t3d3efu6ta6h30tb984t` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`),
  CONSTRAINT `FKbwriapb9aiubv7gkhhm51y7g4` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `resumes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `content_type` varchar(100) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_size` bigint NOT NULL,
  `storage_key` varchar(500) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `student_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resume_student` (`student_id`),
  UNIQUE KEY `uk_resume_storage_key` (`storage_key`),
  CONSTRAINT `FKjyjmg63a741i638n25bhe66in` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `message` text NOT NULL,
  `is_read` bit(1) NOT NULL,
  `title` varchar(150) NOT NULL,
  `type` enum('APPLICATION_STATUS_CHANGED','APPLICATION_SUBMITTED') NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user` (`user_id`),
  KEY `idx_notifications_user_read_created` (`user_id`,`is_read`,`created_at`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) NOT NULL,
  `revoked` bit(1) NOT NULL,
  `token` varchar(500) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKghpmfn23vmxfu3spu3lfg4r2d` (`token`),
  KEY `FK1lih5y2npsf8u5o3vhdb9y0os` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
