import axios from "axios";

const API_BASE_URL = "http://localhost:8082";

const api = axios.create({
    baseURL: API_BASE_URL
});

/*
 * Add access token to every normal API request.
 */
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("accessToken");

        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/*
 * Handle expired access tokens.
 */
api.interceptors.response.use(
    (response) => {
        return response;
    },

    async (error) => {
        const originalRequest = error.config;

        /*
         * Only attempt refresh when:
         * 1. Backend returned 401
         * 2. This request hasn't already been retried
         * 3. We are not already calling the refresh endpoint
         */
        if (
            error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("/api/auth/refresh")
        ) {
            originalRequest._retry = true;

            const refreshToken =
                localStorage.getItem("refreshToken");

            if (!refreshToken) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/login";

                return Promise.reject(error);
            }

            try {
                /*
                 * IMPORTANT:
                 * Use plain axios here instead of `api`.
                 *
                 * Otherwise this refresh request itself would
                 * pass through the same interceptors.
                 */
                const response = await axios.post(
                    `${API_BASE_URL}/api/auth/refresh`,
                    {
                        refreshToken
                    }
                );

                const {
                    accessToken,
                    refreshToken: newRefreshToken
                } = response.data;

                /*
                 * Save the newly issued tokens.
                 */
                localStorage.setItem(
                    "accessToken",
                    accessToken
                );

                localStorage.setItem(
                    "refreshToken",
                    newRefreshToken
                );

                /*
                 * Attach the new access token to the
                 * original failed request.
                 */
                originalRequest.headers.Authorization =
                    `Bearer ${accessToken}`;

                /*
                 * Retry the original request.
                 */
                return api(originalRequest);

            } catch (refreshError) {
                console.error(
                    "Refresh token failed:",
                    refreshError
                );

                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                window.location.href = "/login";

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;