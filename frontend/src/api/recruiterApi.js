
import api from "./axios";

export const getMyJobs = async () => {
    const response = await api.get("/api/recruiters/me/jobs");
    return response.data;
};

export const createJob = async (jobData) => {
    const response = await api.post("/api/recruiters/me/jobs", jobData);
    return response.data;
};

export const updateJob = async (jobId, jobData) => {
    const response = await api.put(
        `/api/recruiters/me/jobs/${jobId}`,
        jobData
    );
    return response.data;
};

export const publishJob = async (jobId) => {
    const response = await api.patch(
        `/api/recruiters/me/jobs/${jobId}/publish`
    );
    return response.data;
};

export const closeJob = async (jobId) => {
    const response = await api.patch(
        `/api/recruiters/me/jobs/${jobId}/close`
    );
    return response.data;
};
// Fetch applications for a specific job
export const getApplicantsForJob = async (jobId) => {
    const response = await api.get(
        `/api/applications/jobs/${jobId}/applicants`
    );
    return response.data;
};

// Update the status of an application
export const updateApplicationStatus = async (applicationId, status) => {
    const response = await api.patch(
        `/api/applications/${applicationId}/status`,
        { status }
    );
    return response.data;
};