import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

function ProtectedRoute({ allowedRoles }) {
    const {
        user,
        loading,
        isAuthenticated
    } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "40px" }}>
                Loading CampusOS...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export default ProtectedRoute;