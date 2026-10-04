
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import "./recruiter-dashboard.css";

function RecruiterDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const displayName =
        user?.name ||
        user?.fullName ||
        [user?.firstName, user?.lastName]
            .filter(Boolean)
            .join(" ") ||
        "Recruiter";

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join("");

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <main className="recruiter-dashboard">
            <section className="recruiter-welcome">
                <div className="recruiter-welcome-content">
                    <span className="recruiter-eyebrow">
                        RECRUITER WORKSPACE
                    </span>

                    <h1>
                        Welcome back, {displayName}
                    </h1>

                    <p>
                        Your next great hire starts here.
                        Manage opportunities, publish openings,
                        and build your campus talent pipeline.
                    </p>

                    <div className="recruiter-welcome-actions">
                        <button
                            className="recruiter-btn recruiter-btn-primary"
                            onClick={() =>
                                navigate("/recruiter/jobs/new")
                            }
                        >
                            <span aria-hidden="true">＋</span>
                            Post a new job
                        </button>

                        <button
                            className="recruiter-btn recruiter-btn-secondary"
                            onClick={() =>
                                navigate("/recruiter/jobs")
                            }
                        >
                            Manage job postings
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </div>

                <div className="recruiter-welcome-art" aria-hidden="true">
                    <div className="recruiter-art-orbit recruiter-art-orbit-one" />
                    <div className="recruiter-art-orbit recruiter-art-orbit-two" />

                    <div className="recruiter-art-card">
                        <div className="recruiter-art-card-icon">
                            <span>✦</span>
                        </div>

                        <div>
                            <strong>Campus talent</strong>
                            <span>Meet your next team member</span>
                        </div>

                        <div className="recruiter-art-arrow">↗</div>
                    </div>

                    <div className="recruiter-art-dot recruiter-art-dot-one" />
                    <div className="recruiter-art-dot recruiter-art-dot-two" />
                </div>
            </section>

            <section className="recruiter-section">
                <div className="recruiter-section-heading">
                    <div>
                        <span className="recruiter-eyebrow">
                            YOUR WORKSPACE
                        </span>

                        <h2>Everything you need to hire</h2>

                        <p>
                            Shortcuts to your most important
                            recruiting activities.
                        </p>
                    </div>
                </div>

                <div className="recruiter-action-grid">
                    <button
                        className="recruiter-action-card"
                        onClick={() =>
                            navigate("/recruiter/jobs/new")
                        }
                    >
                        <span className="recruiter-action-icon recruiter-icon-purple">
                            ↗
                        </span>

                        <span className="recruiter-action-title">
                            Create a job opening
                        </span>

                        <span className="recruiter-action-description">
                            Publish a new opportunity and tell
                            students what your team is looking for.
                        </span>

                        <span className="recruiter-action-link">
                            Create job <span>→</span>
                        </span>
                    </button>

                    <button
                        className="recruiter-action-card"
                        onClick={() =>
                            navigate("/recruiter/jobs")
                        }
                    >
                        <span className="recruiter-action-icon recruiter-icon-blue">
                            ▤
                        </span>

                        <span className="recruiter-action-title">
                            Manage job postings
                        </span>

                        <span className="recruiter-action-description">
                            Review your existing openings and
                            manage your published opportunities.
                        </span>

                        <span className="recruiter-action-link">
                            View postings <span>→</span>
                        </span>
                    </button>

                    <button
                        className="recruiter-action-card"
                        onClick={() =>
                            navigate("/recruiter/jobs")
                        }
                    >
                        <span className="recruiter-action-icon recruiter-icon-green">
                            ◎
                        </span>

                        <span className="recruiter-action-title">
                            Explore hiring activity
                        </span>

                        <span className="recruiter-action-description">
                            Start from your job postings to
                            follow your recruitment workflow.
                        </span>

                        <span className="recruiter-action-link">
                            Open workspace <span>→</span>
                        </span>
                    </button>
                </div>
            </section>

            <section className="recruiter-bottom-grid">
                <div className="recruiter-panel">
                    <div className="recruiter-panel-heading">
                        <div>
                            <h2>Get started</h2>
                            <p>
                                Set up your recruitment workflow
                                in a few simple steps.
                            </p>
                        </div>

                        <span className="recruiter-panel-heading-icon">
                            ✦
                        </span>
                    </div>

                    <div className="recruiter-checklist">
                        <div className="recruiter-checklist-item">
                            <span className="recruiter-check-number">
                                01
                            </span>

                            <div>
                                <strong>
                                    Create your first job posting
                                </strong>

                                <p>
                                    Define the role, eligibility,
                                    skills and application deadline.
                                </p>
                            </div>

                            <button
                                aria-label="Create your first job posting"
                                onClick={() =>
                                    navigate("/recruiter/jobs/new")
                                }
                            >
                                →
                            </button>
                        </div>

                        <div className="recruiter-checklist-item">
                            <span className="recruiter-check-number">
                                02
                            </span>

                            <div>
                                <strong>
                                    Review your openings
                                </strong>

                                <p>
                                    Keep your job information
                                    accurate and up to date.
                                </p>
                            </div>

                            <button
                                aria-label="Review job openings"
                                onClick={() =>
                                    navigate("/recruiter/jobs")
                                }
                            >
                                →
                            </button>
                        </div>

                        <div className="recruiter-checklist-item">
                            <span className="recruiter-check-number">
                                03
                            </span>

                            <div>
                                <strong>
                                    Track your recruitment
                                </strong>

                                <p>
                                    Use your job postings as the
                                    starting point for hiring activity.
                                </p>
                            </div>

                            <button
                                aria-label="Open recruitment workspace"
                                onClick={() =>
                                    navigate("/recruiter/jobs")
                                }
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>

                <div className="recruiter-panel recruiter-profile-panel">
                    <div className="recruiter-panel-heading">
                        <div>
                            <h2>Your account</h2>
                            <p>
                                Your current CampusOS identity.
                            </p>
                        </div>

                        <span className="recruiter-account-status">
                            <span />
                            Signed in
                        </span>
                    </div>

                    <div className="recruiter-profile-summary">
                        <div className="recruiter-profile-avatar">
                            {initials || "R"}
                        </div>

                        <div className="recruiter-profile-details">
                            <strong>{displayName}</strong>
                            <span>
                                {user?.email || "Email unavailable"}
                            </span>
                        </div>
                    </div>

                    <div className="recruiter-profile-meta">
                        <span>Account role</span>
                        <strong>
                            {user?.role || "RECRUITER"}
                        </strong>
                    </div>

                    <div className="recruiter-profile-note">
                        <span aria-hidden="true">ⓘ</span>

                        <p>
                            Keep your account information accurate
                            so your recruitment workspace stays
                            organized.
                        </p>
                    </div>

                    <button
                        className="recruiter-logout-button"
                        onClick={handleLogout}
                    >
                        <span aria-hidden="true">↪</span>
                        Sign out of CampusOS
                    </button>
                </div>
            </section>

            <footer className="recruiter-dashboard-footer">
                <span>
                    <span className="recruiter-footer-mark">C</span>
                    CampusOS
                </span>

                <span>
                    Connecting campus talent with opportunity.
                </span>
            </footer>
        </main>
    );
}

export default RecruiterDashboard;
