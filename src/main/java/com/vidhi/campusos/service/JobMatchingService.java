package com.vidhi.campusos.service;

import com.vidhi.campusos.dto.JobMatchResponse;
import com.vidhi.campusos.entity.Job;
import com.vidhi.campusos.entity.JobStatus;
import com.vidhi.campusos.entity.Skill;
import com.vidhi.campusos.entity.StudentProfile;
import com.vidhi.campusos.entity.User;
import com.vidhi.campusos.entity.UserRole;
import com.vidhi.campusos.exception.ResourceNotFoundException;
import com.vidhi.campusos.repository.JobRepository;
import com.vidhi.campusos.repository.SkillRepository;
import com.vidhi.campusos.repository.StudentProfileRepository;
import com.vidhi.campusos.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@Transactional(readOnly = true)
public class JobMatchingService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final SkillRepository skillRepository;

    public JobMatchingService(
            JobRepository jobRepository,
            UserRepository userRepository,
            StudentProfileRepository studentProfileRepository,
            SkillRepository skillRepository
    ) {
        this.jobRepository = jobRepository;
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.skillRepository = skillRepository;
    }

    public List<JobMatchResponse> getRecommendedJobs(
            UserDetails userDetails,
            int limit
    ) {

        if (limit < 1 || limit > 50) {
            throw new IllegalArgumentException(
                    "Limit must be between 1 and 50"
            );
        }

        StudentProfile student =
                getCurrentStudent(userDetails);

        Set<String> studentSkills =
                normalizeSkillNames(student.getSkills());

        /*
         * Load the complete skill catalog already stored
         * in CampusOS. We use this catalog to identify
         * which skills are actually mentioned by a job.
         */
        List<Skill> skillCatalog =
                skillRepository.findAll();

        List<Job> publishedJobs =
                jobRepository.findAll(
                        (root, query, criteriaBuilder) ->
                                criteriaBuilder.equal(
                                        root.get("status"),
                                        JobStatus.PUBLISHED
                                )
                );

        return publishedJobs.stream()
                .map(job ->
                        calculateMatch(
                                job,
                                studentSkills,
                                skillCatalog
                        )
                )
                .sorted(
                        Comparator
                                .comparingInt(
                                        JobMatchResponse::matchScore
                                )
                                .reversed()
                                .thenComparing(
                                        JobMatchResponse::title,
                                        String.CASE_INSENSITIVE_ORDER
                                )
                )
                .limit(limit)
                .toList();
    }

    private JobMatchResponse calculateMatch(
            Job job,
            Set<String> studentSkills,
            List<Skill> skillCatalog
    ) {

        String jobText =
                buildJobText(job);

        Set<String> requiredSkills =
                extractRequiredSkills(
                        jobText,
                        skillCatalog
                );

        Set<String> matchedSkills =
                new HashSet<>(requiredSkills);

        matchedSkills.retainAll(studentSkills);

        Set<String> missingSkills =
                new HashSet<>(requiredSkills);

        missingSkills.removeAll(studentSkills);

        int totalRequiredSkills =
                requiredSkills.size();

        int matchedSkillCount =
                matchedSkills.size();

        int matchScore;

        if (totalRequiredSkills == 0) {

            /*
             * No recognized skills means we cannot honestly
             * claim a high compatibility score.
             *
             * We therefore return 0 instead of pretending
             * that the job is a strong match.
             */
            matchScore = 0;

        } else {

            matchScore =
                    (int) Math.round(
                            (matchedSkillCount * 100.0)
                                    / totalRequiredSkills
                    );
        }

        List<String> sortedMatchedSkills =
                matchedSkills.stream()
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .toList();

        List<String> sortedMissingSkills =
                missingSkills.stream()
                        .sorted(String.CASE_INSENSITIVE_ORDER)
                        .toList();

        return new JobMatchResponse(
                job.getId(),
                job.getTitle(),
                job.getCompany().getName(),
                job.getCompany().getId(),
                job.getLocation(),
                job.getJobType(),
                job.getWorkMode(),
                job.getExperienceMin(),
                job.getExperienceMax(),
                job.getSalaryMin(),
                job.getSalaryMax(),
                job.getApplicationDeadline(),

                matchScore,

                sortedMatchedSkills,
                sortedMissingSkills,

                totalRequiredSkills,
                matchedSkillCount
        );
    }

    private Set<String> extractRequiredSkills(
            String jobText,
            List<Skill> skillCatalog
    ) {

        Set<String> requiredSkills =
                new HashSet<>();

        for (Skill skill : skillCatalog) {

            String normalizedSkill =
                    normalize(skill.getName());

            if (normalizedSkill.isBlank()) {
                continue;
            }

            if (containsSkill(
                    jobText,
                    normalizedSkill
            )) {
                requiredSkills.add(
                        normalizedSkill
                );
            }
        }

        return requiredSkills;
    }

    private boolean containsSkill(
            String jobText,
            String skill
    ) {

        /*
         * Normalize common separators so that:
         *
         * "Spring-Boot"
         * "Spring Boot"
         *
         * can be compared consistently.
         */
        String normalizedJobText =
                jobText
                        .toLowerCase(Locale.ROOT)
                        .replace('-', ' ')
                        .replace('_', ' ');

        String normalizedSkill =
                skill
                        .toLowerCase(Locale.ROOT)
                        .replace('-', ' ')
                        .replace('_', ' ');

        /*
         * For short skills such as "C", "R", etc.,
         * simple contains() can produce false positives.
         *
         * We therefore use token-aware matching for
         * very short alphabetic skills.
         */
        if (normalizedSkill.length() <= 2
                && normalizedSkill.matches("[a-z]+")) {

            String padded =
                    " "
                            + normalizedJobText
                            .replaceAll(
                                    "[^a-z0-9+#.]+",
                                    " "
                            )
                            + " ";

            return padded.contains(
                    " " + normalizedSkill + " "
            );
        }

        return normalizedJobText.contains(
                normalizedSkill
        );
    }

    private String buildJobText(Job job) {

        String title =
                job.getTitle() == null
                        ? ""
                        : job.getTitle();

        String description =
                job.getDescription() == null
                        ? ""
                        : job.getDescription();

        return title + " " + description;
    }

    private Set<String> normalizeSkillNames(
            Set<Skill> skills
    ) {

        Set<String> normalized =
                new HashSet<>();

        for (Skill skill : skills) {

            String name =
                    normalize(skill.getName());

            if (!name.isBlank()) {
                normalized.add(name);
            }
        }

        return normalized;
    }

    private String normalize(String value) {

        if (value == null) {
            return "";
        }

        return value
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("\\s+", " ");
    }

    private StudentProfile getCurrentStudent(
            UserDetails userDetails
    ) {

        User user =
                userRepository
                        .findByEmail(
                                userDetails.getUsername()
                        )
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Authenticated user not found"
                                )
                        );

        if (user.getRole() != UserRole.STUDENT) {

            throw new AccessDeniedException(
                    "Only students can access job recommendations"
            );
        }

        return studentProfileRepository
                .findByUserId(user.getId())
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Student profile not found"
                        )
                );
    }
}