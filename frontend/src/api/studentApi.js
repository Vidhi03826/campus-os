import api from "./axios";

/* =========================================================
   JOBS
   ========================================================= */

export const getJobs = async (params = {}) => {
    const response = await api.get("/api/jobs", {
        params,
    });

    return response.data;
};

export const getJobById = async (jobId) => {
    const response = await api.get(`/api/jobs/${jobId}`);

    return response.data;
};

/* =========================================================
   SAVED JOBS
   ========================================================= */

export const saveJob = async (jobId) => {
    const response = await api.post(
        `/api/students/me/saved-jobs/${jobId}`
    );

    return response.data;
};

export const unsaveJob = async (jobId) => {
    await api.delete(
        `/api/students/me/saved-jobs/${jobId}`
    );
};

export const getSavedJobs = async () => {
    const response = await api.get(
        "/api/students/me/saved-jobs"
    );

    return response.data;
};

/* =========================================================
   RESUME
   ========================================================= */

export const getResumeMetadata = async () => {
    const response = await api.get(
        "/api/students/me/resume"
    );

    return response.data;
};

export const uploadResume = async (file) => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await api.post(
        "/api/students/me/resume",
        formData
    );

    return response.data;
};

export const deleteResume = async () => {
    await api.delete(
        "/api/students/me/resume"
    );
};

/*
 * Download through Axios so the existing authentication
 * interceptor can attach the access token.
 */
export const downloadResume = async () => {
    const response = await api.get(
        "/api/students/me/resume/download",
        {
            responseType: "blob",
        }
    );

    return response;
};