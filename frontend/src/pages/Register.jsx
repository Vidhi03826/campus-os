
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Building2, CheckCircle2 } from "lucide-react";
import { registerUser } from "../api/authApi";

export default function Register() {
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("STUDENT");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        setLoading(true);

        try {
            await registerUser({
                name: name.trim(),
                email: email.trim(),
                password,
                role,
            });

            navigate("/login", {
                replace: true,
                state: {
                    registered: true,
                    role,
                    email: email.trim(),
                },
            });
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "Registration failed. Please check your details."
            );
        } finally {
            setLoading(false);
        }
    };

    const fieldStyle = {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px 13px",
        border: "1px solid #d8deea",
        borderRadius: 9,
        fontSize: 14,
        outlineColor: "#315ee7",
        marginTop: 7,
    };

    const labelStyle = {
        display: "block",
        fontSize: 13,
        fontWeight: 600,
        color: "#344054",
        marginTop: 15,
    };

    return (
        <main style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "linear-gradient(135deg, #eef3ff, #f8faff 55%, #e8f8f4)",
            fontFamily: "Inter, system-ui, sans-serif",
        }}>
            <form onSubmit={handleSubmit} style={{
                width: "100%",
                maxWidth: 440,
                boxSizing: "border-box",
                background: "#fff",
                padding: "32px",
                borderRadius: 20,
                boxShadow: "0 18px 55px rgba(31, 51, 91, 0.12)",
                border: "1px solid rgba(255,255,255,.9)",
            }}>
                <div style={{
                    width: 44,
                    height: 44,
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 13,
                    background: "#173b73",
                    color: "white",
                    fontWeight: 800,
                    fontSize: 20,
                    marginBottom: 18,
                }}>C</div>

                <h1 style={{
                    fontSize: 27,
                    letterSpacing: "-1px",
                    color: "#142748",
                    margin: "0 0 8px",
                }}>Join CampusOS</h1>

                <p style={{
                    color: "#667085",
                    fontSize: 14,
                    lineHeight: 1.6,
                    margin: "0 0 23px",
                }}>
                    Create your account and take the next step in your career journey.
                </p>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                }}>
                    {[
                        {
                            value: "STUDENT",
                            title: "I'm a Student",
                            description: "Discover and apply for jobs",
                            Icon: GraduationCap,
                        },
                        {
                            value: "RECRUITER",
                            title: "I'm a Recruiter",
                            description: "Hire great candidates",
                            Icon: Building2,
                        },
                    ].map(({ value, title, description, Icon }) => {
                        const selected = role === value;

                        return (
                            <button
                                key={value}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setRole(value)}
                                style={{
                                    position: "relative",
                                    textAlign: "left",
                                    padding: 14,
                                    minHeight: 132,
                                    borderRadius: 12,
                                    border: selected
                                        ? "2px solid #315ee7"
                                        : "1px solid #e0e5ef",
                                    background: selected ? "#f2f6ff" : "#fff",
                                    color: "#1d2939",
                                    cursor: "pointer",
                                }}
                            >
                                <Icon size={23} color={selected ? "#315ee7" : "#667085"} />
                                {selected && (
                                    <CheckCircle2
                                        size={17}
                                        color="#315ee7"
                                        style={{ position: "absolute", top: 12, right: 10 }}
                                    />
                                )}
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 13,
                                    marginTop: 13,
                                }}>{title}</div>
                                <div style={{
                                    color: "#667085",
                                    fontSize: 11,
                                    lineHeight: 1.5,
                                    marginTop: 5,
                                }}>{description}</div>
                            </button>
                        );
                    })}
                </div>

                <label style={labelStyle} htmlFor="register-name">Full name</label>
                <input
                    id="register-name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    maxLength={100}
                    required
                    style={fieldStyle}
                />

                <label style={labelStyle} htmlFor="register-email">Email address</label>
                <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    style={fieldStyle}
                />

                <label style={labelStyle} htmlFor="register-password">Password</label>
                <input
                    id="register-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={100}
                    required
                    style={fieldStyle}
                />

                <label style={labelStyle} htmlFor="register-confirm">Confirm password</label>
                <input
                    id="register-confirm"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={100}
                    required
                    style={fieldStyle}
                />

                {role === "RECRUITER" && (
                    <p style={{
                        color: "#76520e",
                        background: "#fff8e6",
                        padding: 11,
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                        marginTop: 14,
                    }}>
                        After registration, complete your company profile.
                        Your account must be verified by an admin before you can publish jobs.
                    </p>
                )}

                {error && (
                    <p role="alert" style={{
                        color: "#b42318",
                        background: "#fff1f0",
                        padding: 11,
                        borderRadius: 8,
                        fontSize: 13,
                    }}>{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: 14,
                        marginTop: 22,
                        border: 0,
                        borderRadius: 10,
                        background: loading ? "#8296bd" : "#173b73",
                        color: "white",
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: loading ? "wait" : "pointer",
                    }}
                >
                    {loading ? "Creating account..." : "Create account"}
                </button>

                <p style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "#667085",
                    marginTop: 22,
                    marginBottom: 0,
                }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{
                        color: "#2454c6",
                        fontWeight: 700,
                        textDecoration: "none",
                    }}>Log in</Link>
                </p>
            </form>
        </main>
    );
}
