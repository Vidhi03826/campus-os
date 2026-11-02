
import api from "./axios";

export const getAdminAnalytics = async () => {
    const response = await api.get("/api/admin/analytics");
    return response.data;
};

export const getPendingRecruiters = async () => {
    const response = await api.get("/api/admin/recruiters/pending");
    return response.data;
};

export const verifyRecruiter = async (id) => {
    const response = await api.patch(`/api/admin/recruiters/${id}/verify`);
    return response.data;
};

export const rejectRecruiter = async (id) => {
    const response = await api.patch(`/api/admin/recruiters/${id}/reject`);
    return response.data;
};

export const getAdminJobs = async () => {
    const response = await api.get("/api/admin/jobs");
    return response.data;
};

export const closeAdminJob = async (id) => {
    const response = await api.patch(`/api/admin/jobs/${id}/close`);
    return response.data;
};

export const archiveAdminJob = async (id) => {
    const response = await api.patch(`/api/admin/jobs/${id}/archive`);
    return response.data;
};

export const getAdminUsers = async () => {
    const response = await api.get("/api/admin/users");
    return response.data;
};

export const activateAdminUser = async (id) => {
    const response = await api.patch(`/api/admin/users/${id}/activate`);
    return response.data;
};

export const deactivateAdminUser = async (id) => {
    const response = await api.patch(`/api/admin/users/${id}/deactivate`);
    return response.data;
};

export const unlockAdminUser = async (id) => {
    const response = await api.patch(`/api/admin/users/${id}/unlock`);
    return response.data;
};
