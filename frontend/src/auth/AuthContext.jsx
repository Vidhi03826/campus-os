import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";

import {
    loginUser,
    getCurrentUser,
    logoutUser
} from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /*
     * When the application starts:
     * If an access token exists, ask the backend
     * who the currently authenticated user is.
     */
    useEffect(() => {
        const loadUser = async () => {
            const accessToken = localStorage.getItem("accessToken");

            if (!accessToken) {
                setLoading(false);
                return;
            }

            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load current user:", error);

                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    /*
     * Login:
     * 1. Call backend
     * 2. Save tokens
     * 3. Fetch user profile
     * 4. Store user in React state
     */
    const login = async (email, password) => {
        const tokenResponse = await loginUser({
            email,
            password
        });

        localStorage.setItem(
            "accessToken",
            tokenResponse.accessToken
        );

        localStorage.setItem(
            "refreshToken",
            tokenResponse.refreshToken
        );

        const currentUser = await getCurrentUser();

        setUser(currentUser);

        return currentUser;
    };

    /*
     * Logout:
     * Try to revoke refresh token on backend.
     * Even if backend logout fails, clear local credentials.
     */
    const logout = async () => {
        const refreshToken = localStorage.getItem("refreshToken");

        try {
            if (refreshToken) {
                await logoutUser(refreshToken);
            }
        } catch (error) {
            console.error("Logout API failed:", error);
        } finally {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
    };

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}