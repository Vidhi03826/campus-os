import api from "./axios";

export const loginUser = async (data) => {
    const response = await api.post(
        "/api/auth/login",
        data
    );

    return response.data;
};

export const registerUser = async (data) => {
    const response = await api.post(
        "/api/auth/register",
        data
    );

    return response.data;
};

export const getCurrentUser = async () => {
    const response = await api.get(
        "/api/users/me"
    );

    return response.data;
};

export const refreshAccessToken = async (refreshToken) => {
    const response = await api.post(
        "/api/auth/refresh",
        {
            refreshToken
        }
    );

    return response.data;
};

export const logoutUser = async (refreshToken) => {
    await api.post(
        "/api/auth/logout",
        {
            refreshToken
        }
    );
};