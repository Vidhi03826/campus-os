import api from "./axios";

export const applyToJob = async (jobId) => {
    const response = await api.post(
        `/api/students/me/jobs/${jobId}/applications`
    );

    return response.data;
};

export const getMyApplications = async () => {
    const response = await api.get(
        "/api/students/me/applications"
    );

    return response.data;
};

export const getMyApplication = async (applicationId) => {
    const response = await api.get(
        `/api/students/me/applications/${applicationId}`
    );

    return response.data;
};

export const getApplicationHistory = async (applicationId) => {
    const response = await api.get(
        `/api/students/me/applications/${applicationId}/history`
    );

    return response.data;
};

export const withdrawApplication = async (applicationId) => {
    const response = await api.post(
        `/api/students/me/applications/${applicationId}/withdraw`
    );

    return response.data;
};

// Recruiter: fetch applicants for a job
export const getApplicantsForJob = async (jobId) => {
    const response = await api.get(
        `/api/recruiters/me/jobs/${jobId}/applications`
    );

    return response.data;
};

// Recruiter: update an application's status
export const updateApplicationStatus = async (
    applicationId,
    status
) => {
    const response = await api.patch(
        `/api/recruiters/me/applications/${applicationId}/status`,
        { status }
    );

    return response.data;
};