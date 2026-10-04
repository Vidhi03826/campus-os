import { useNavigate } from "react-router-dom";

function AdminDashboard() {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        navigate("/login");
    };

    const user =
        JSON.parse(
            localStorage.getItem("user")
        );

    return (
        <div className="dashboard">

            <h1>CampusOS</h1>

            <h2>Admin Dashboard</h2>

            <div className="dashboard-card">

                <h3>
                    Welcome, {user?.name}
                </h3>

                <p>
                    Email: {user?.email}
                </p>

                <p>
                    Role: {user?.role}
                </p>

            </div>

            <button
                className="logout-button"
                onClick={logout}
            >
                Logout
            </button>

        </div>
    );
}

export default AdminDashboard;