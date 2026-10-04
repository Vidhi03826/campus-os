import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function Login() {
    const navigate = useNavigate();

    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            const currentUser = await login(email, password);

            /*
             * Backend returns the user's role.
             * Route based on that role.
             */
            if (currentUser.role === "STUDENT") {
                navigate("/student/dashboard");
            } else if (currentUser.role === "RECRUITER") {
                navigate("/recruiter/dashboard");
            } else if (currentUser.role === "ADMIN") {
                navigate("/admin/dashboard");
            } else {
                setError("Unknown user role.");
            }

        } catch (err) {
            console.error("Login failed:", err);

            const message =
                err.response?.data?.message ||
                "Login failed. Please check your credentials.";

            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f5f7fb"
            }}
        >
            <form
                onSubmit={handleSubmit}
                style={{
                    width: "380px",
                    padding: "35px",
                    background: "white",
                    borderRadius: "14px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.08)"
                }}
            >
                <h1>CampusOS</h1>

                <p>
                    Login to continue
                </p>

                {error && (
                    <div
                        style={{
                            color: "red",
                            marginBottom: "15px"
                        }}
                    >
                        {error}
                    </div>
                )}

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        marginBottom: "12px"
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px",
                        marginBottom: "16px"
                    }}
                />

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>
        </div>
    );
}

export default Login;