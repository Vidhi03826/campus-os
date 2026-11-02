import api from "./axios";
export const getMyStudentProfile = async () => {
    const response = await api.get("/api/students/me/profile");
    return response.data;
};
export const createStudentProfile = async (profileData) => {
    const response = await api.post(
        "/api/students/me/profile",
        profileData
    );
    return response.data;
};
export const updateStudentProfile = async (profileData) => {
    const response = await api.put(
        "/api/students/me/profile",
        profileData
    );
    return response.data;
};