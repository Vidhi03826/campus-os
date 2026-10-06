
import api from "./axios";

export const getMyNotifications = async (page = 0, size = 10) => {
    const response = await api.get("/api/notifications", {
        params: { page, size },
    });
    return response.data;
};

export const getUnreadNotificationCount = async () => {
    const response = await api.get("/api/notifications/unread-count");
    return response.data;
};

export const markNotificationAsRead = async (notificationId) => {
    await api.patch(`/api/notifications/${notificationId}/read`);
};

export const markAllNotificationsAsRead = async () => {
    await api.patch("/api/notifications/read-all");
};
