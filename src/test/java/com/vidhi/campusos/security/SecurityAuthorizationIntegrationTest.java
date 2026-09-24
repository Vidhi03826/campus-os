package com.vidhi.campusos.security;

import com.vidhi.campusos.service.AdminService;

import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import org.springframework.test.context.bean.override.mockito.MockitoBean;

import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class SecurityAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    /*
     * We do not want the ADMIN test to execute the real
     * AdminService/database logic.
     *
     * We only want to verify that Spring Security allows
     * an ADMIN to cross the authorization boundary.
     */
    @MockitoBean
    private AdminService adminService;

    // =========================================================
    // UNAUTHENTICATED USER → PROTECTED ENDPOINT
    // =========================================================

    @Test
    void shouldReturn401WhenUserIsNotAuthenticated()
            throws Exception {

        mockMvc.perform(
                        get("/api/students/me/job-discovery")
                )
                .andExpect(
                        status().isUnauthorized()
                );
    }

    // =========================================================
    // STUDENT → ADMIN ENDPOINT
    // =========================================================

    @Test
    @WithMockUser(
            username = "student@test.com",
            roles = "STUDENT"
    )
    void shouldReturn403WhenStudentAccessesAdminEndpoint()
            throws Exception {

        mockMvc.perform(
                        get("/api/admin/recruiters/pending")
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    // =========================================================
    // RECRUITER → ADMIN ENDPOINT
    // =========================================================

    @Test
    @WithMockUser(
            username = "recruiter@test.com",
            roles = "RECRUITER"
    )
    void shouldReturn403WhenRecruiterAccessesAdminEndpoint()
            throws Exception {

        mockMvc.perform(
                        get("/api/admin/recruiters/pending")
                )
                .andExpect(
                        status().isForbidden()
                );
    }

    // =========================================================
    // ADMIN → ADMIN ENDPOINT
    // =========================================================

    @Test
    @WithMockUser(
            username = "admin@test.com",
            roles = "ADMIN"
    )
    void shouldAllowAdminToAccessAdminEndpoint()
            throws Exception {

        mockMvc.perform(
                        get("/api/admin/recruiters/pending")
                )
                .andExpect(
                        status().isOk()
                );
    }
}