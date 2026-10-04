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