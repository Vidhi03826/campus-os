import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    Check,
    CheckCircle2,
    FileText,
    Mail,
    RefreshCw,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getCurrentUser } from "../../api/authApi";
import { getResumeMetadata } from "../../api/studentApi";

function getInitials(name = "") {
    return (
        name
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase())
            .join("") || "U"
    );
}

function Profile() {
    const [user, setUser] = useState(null);
    const [resume, setResume] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadProfile = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const [userResult, resumeResult] =
                await Promise.allSettled([
                    getCurrentUser(),
                    getResumeMetadata(),
                ]);

            if (userResult.status === "fulfilled") {
                setUser(userResult.value);
            }

            if (resumeResult.status === "fulfilled") {
                setResume(resumeResult.value);
            } else {
                setResume(null);
            }

            if (
                userResult.status === "rejected" &&
                resumeResult.status === "rejected"
            ) {
                throw userResult.reason;
            }
        } catch (err) {
            console.error("Failed to load profile:", err);

            setError(
                err?.response?.data?.message ||
                "Unable to load your profile right now."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const readiness = useMemo(() => {
        if (!user) {
            return {
                percentage: 0,
                completed: 0,
                total: 3,
            };
        }

        const checks = [
            Boolean(user.name),
            Boolean(user.email),
            Boolean(resume),
        ];

        const completed = checks.filter(Boolean).length;

        return {
            percentage: Math.round((completed / checks.length) * 100),
            completed,
            total: checks.length,
        };
    }, [user, resume]);

    const checklist = [
        {
            label: "Name added",
            complete: Boolean(user?.name),
        },
        {
            label: "Email verified",
            complete: Boolean(user?.email),
        },
        {
            label: "Resume uploaded",
            complete: Boolean(resume),
        },
    ];

    if (loading) {
        return (
            <div className="profile-page">
                <div className="profile-skeleton profile-skeleton-hero" />

                <div className="profile-skeleton-grid">
                    <div className="profile-skeleton profile-skeleton-card" />
                    <div className="profile-skeleton profile-skeleton-card" />
                </div>

                <div className="profile-skeleton profile-skeleton-bottom" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-error">
                <div className="profile-error-icon">
                    <UserRound size={24} />
                </div>

                <span className="eyebrow">ACCOUNT</span>

                <h2>Profile unavailable</h2>

                <p>
                    {error ||
                        "We couldn't load your account information."}
                </p>

                <button
                    className="primary-button"
                    onClick={() => loadProfile(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={15}
                        className={refreshing ? "spin" : ""}
                    />
                    Try again
                </button>
            </div>
        );
    }

    return (
        <div className="profile-page">
            {/* HEADER */}
            <section className="profile-hero">
                <div className="profile-avatar-large">
                    {getInitials(user.name)}
                </div>

                <div className="profile-hero-content">
                    <span className="eyebrow">CAREER PROFILE</span>

                    <div className="profile-title-row">
                        <h1>{user.name}</h1>

                        <span className="profile-role-pill">
                            <ShieldCheck size={13} />
                            {user.role}
                        </span>
                    </div>

                    <p>
                        Your CampusOS identity and application-ready
                        information.
                    </p>

                    <div className="profile-meta">
                        <span>
                            <Mail size={14} />
                            {user.email}
                        </span>

                        <span>
                            <BriefcaseBusiness size={14} />
                            Student workspace
                        </span>
                    </div>
                </div>

                <div className="profile-hero-actions">
                    <button
                        className="icon-button"
                        onClick={() => loadProfile(true)}
                        disabled={refreshing}
                        aria-label="Refresh profile"
                        title="Refresh profile"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "spin" : ""}
                        />
                    </button>
                </div>
            </section>

            {/* ERROR */}
            {error && (
                <div className="profile-inline-error">
                    <span>{error}</span>

                    <button
                        onClick={() => loadProfile(true)}
                        disabled={refreshing}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* READINESS */}
            <section className="profile-readiness-card">
                <div className="profile-readiness-main">
                    <div
                        className="profile-progress-ring profile-progress-ring-large"
                        style={{
                            "--progress": `${readiness.percentage * 3.6}deg`,
                        }}
                    >
                        <div>
                            <strong>{readiness.percentage}%</strong>
                            <span>ready</span>
                        </div>
                    </div>

                    <div className="profile-readiness-copy">
                        <span className="eyebrow">
                            PROFILE READINESS
                        </span>

                        <h2>
                            {readiness.percentage === 100
                                ? "You're application ready"
                                : "Complete your candidate profile"}
                        </h2>

                        <p>
                            {readiness.percentage === 100
                                ? "Your essential CampusOS information is ready for applications."
                                : `${readiness.completed} of ${readiness.total} essential profile items are complete.`}
                        </p>
                    </div>
                </div>

                <div className="profile-checklist">
                    {checklist.map((item) => (
                        <div
                            className={`profile-check ${
                                item.complete ? "complete" : ""
                            }`}
                            key={item.label}
                        >
                            <span>
                                {item.complete ? (
                                    <Check size={13} />
                                ) : (
                                    <span className="profile-check-empty" />
                                )}
                            </span>

                            <strong>{item.label}</strong>
                        </div>
                    ))}
                </div>
            </section>

            {/* SNAPSHOT */}
            <section className="profile-content-grid">
                <div className="profile-surface">
                    <div className="profile-section-heading">
                        <div>
                            <span className="eyebrow">ACCOUNT</span>
                            <h2>Profile snapshot</h2>
                        </div>

                        <div className="profile-heading-icon">
                            <UserRound size={18} />
                        </div>
                    </div>

                    <div className="profile-detail-grid">
                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <UserRound size={17} />
                            </div>

                            <div>
                                <span>Full name</span>
                                <strong>{user.name}</strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <Mail size={17} />
                            </div>

                            <div>
                                <span>Email address</span>
                                <strong>{user.email}</strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <ShieldCheck size={17} />
                            </div>

                            <div>
                                <span>Account role</span>
                                <strong>{user.role}</strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <BriefcaseBusiness size={17} />
                            </div>

                            <div>
                                <span>Workspace</span>
                                <strong>Student</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RESUME */}
                <div className="profile-surface">
                    <div className="profile-section-heading">
                        <div>
                            <span className="eyebrow">DOCUMENT</span>
                            <h2>Resume</h2>
                        </div>

                        <div className="profile-heading-icon">
                            <FileText size={18} />
                        </div>
                    </div>

                    {resume ? (
                        <div className="profile-resume-ready">
                            <div className="profile-resume-status">
                                <CheckCircle2 size={20} />
                            </div>

                            <div className="profile-resume-copy">
                                <strong>Resume uploaded</strong>

                                <p>
                                    {resume.fileName ||
                                        "Current resume"}
                                </p>

                                {resume.updatedAt && (
                                    <span>
                                        Updated{" "}
                                        {new Date(
                                            resume.updatedAt
                                        ).toLocaleDateString("en-IN")}
                                    </span>
                                )}
                            </div>

                            <Link
                                to="/student/resume"
                                className="text-button"
                            >
                                Manage
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    ) : (
                        <div className="profile-resume-empty">
                            <div className="profile-resume-empty-icon">
                                <FileText size={21} />
                            </div>

                            <h3>Your resume is missing</h3>

                            <p>
                                Upload one before applying to
                                opportunities.
                            </p>

                            <Link
                                to="/student/resume"
                                className="primary-button"
                            >
                                Upload resume
                                <ArrowRight size={15} />
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* NEXT STEPS */}
            <section className="profile-next-section">
                <div className="profile-next-copy">
                    <span className="eyebrow">NEXT STEPS</span>

                    <h2>Build a stronger candidate profile</h2>

                    <p>
                        Keep your resume current and continue
                        exploring opportunities that match your
                        goals.
                    </p>
                </div>

                <div className="profile-next-cards">
                    <Link
                        to="/student/resume"
                        className="profile-next-card"
                    >
                        <div className="profile-next-card-icon">
                            <FileText size={19} />
                        </div>

                        <div>
                            <strong>Resume</strong>
                            <span>
                                Keep your latest version ready.
                            </span>
                        </div>

                        <ArrowRight size={16} />
                    </Link>

                    <Link
                        to="/student/jobs"
                        className="profile-next-card"
                    >
                        <div className="profile-next-card-icon">
                            <BriefcaseBusiness size={19} />
                        </div>

                        <div>
                            <strong>Discover opportunities</strong>
                            <span>
                                Find roles that match your goals.
                            </span>
                        </div>

                        <ArrowRight size={16} />
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default Profile;