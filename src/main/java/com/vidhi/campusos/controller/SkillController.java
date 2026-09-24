package com.vidhi.campusos.controller;

import com.vidhi.campusos.dto.SkillResponse;
import com.vidhi.campusos.repository.SkillRepository;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;

@RestController
@RequestMapping("/api/skills")
public class SkillController {

    private final SkillRepository skillRepository;

    public SkillController(
            SkillRepository skillRepository
    ) {
        this.skillRepository = skillRepository;
    }

    @GetMapping
    public List<SkillResponse> getSkills() {

        return skillRepository.findAll()
                .stream()
                .map(skill ->
                        new SkillResponse(
                                skill.getId(),
                                skill.getName()
                        )
                )
                .toList();
    }
}