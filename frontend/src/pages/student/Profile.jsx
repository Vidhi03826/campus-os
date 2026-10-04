import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    CheckCircle2,
    FileText,
    Mail,
    ShieldCheck,
    UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { getCurrentUser } from "../../api/authApi";
import { getResumeMetadata } from "../../api/studentApi";

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function Profile() {
    const [user, setUser] = useState(null);
    const [resume, setResume] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const [userData, resumeData] =
                    await Promise.allSettled([
                        getCurrentUser(),
                        getResumeMetadata(),
                    ]);

                if (
                    userData.status === "fulfilled"
                ) {
                    setUser(userData.value);
                }

                if (
                    resumeData.status === "fulfilled"
                ) {
                    setResume(resumeData.value);
                }
            } catch (err) {
                console.error(
                    "Failed to load profile:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, []);

    const profileProgress = useMemo(() => {
        if (!user) {
            return 0;
        }

        /*
         * Only count facts we can verify from the current
         * backend responses.
         */
        const checks = [
            Boolean(user.name),
            Boolean(user.email),
            Boolean(resume),
        ];

        const completed =
            checks.filter(Boolean).length;

        return Math.round(
            (completed / checks.length) * 100
        );
    }, [user, resume]);

    if (loading) {
        return (
            <div className="profile-page">

                <div className="profile-skeleton hero" />

                <div className="profile-skeleton body" />

            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-error">
                <h2>
                    Profile unavailable
                </h2>

                <p>
                    {error ||
                        "We couldn't load your account information."}
                </p>
            </div>
        );
    }

    return (
        <div className="profile-page">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <section className="profile-hero">

                <div className="profile-avatar-large">
                    {getInitials(user.name)}
                </div>

                <div className="profile-hero-content">

                    <span className="eyebrow">
                        CAREER PROFILE
                    </span>

                    <h1>
                        {user.name}
                    </h1>

                    <p>
                        Your CampusOS identity and
                        application-ready information.
                    </p>

                    <div className="profile-meta">

                        <span>
                            <Mail size={14} />
                            {user.email}
                        </span>

                        <span>
                            <ShieldCheck size={14} />
                            {user.role}
                        </span>

                    </div>

                </div>

                <div className="profile-progress">

                    <div
                        className="profile-progress-ring"
                        style={{
                            "--progress":
                                `${profileProgress * 3.6}deg`,
                        }}
                    >
                        <div>
                            <strong>
                                {profileProgress}%
                            </strong>

                            <span>
                                ready
                            </span>
                        </div>
                    </div>

                    <div>
                        <span className="eyebrow">
                            PROFILE READINESS
                        </span>

                        <strong>
                            {profileProgress === 100
                                ? "Application ready"
                                : "Keep building"}
                        </strong>
                    </div>

                </div>

            </section>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
                <div className="profile-inline-error">
                    {error}
                </div>
            )}

            {/* ================================================= */}
            {/* PROFILE SNAPSHOT */}
            {/* ================================================= */}

            <section className="profile-content-grid">

                <div className="profile-surface">

                    <div className="profile-section-heading">

                        <div>
                            <span className="eyebrow">
                                ACCOUNT
                            </span>

                            <h2>
                                Profile snapshot
                            </h2>
                        </div>

                    </div>

                    <div className="profile-detail-grid">

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <UserRound size={17} />
                            </div>

                            <div>
                                <span>
                                    Full name
                                </span>

                                <strong>
                                    {user.name}
                                </strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <Mail size={17} />
                            </div>

                            <div>
                                <span>
                                    Email address
                                </span>

                                <strong>
                                    {user.email}
                                </strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <ShieldCheck size={17} />
                            </div>

                            <div>
                                <span>
                                    Account role
                                </span>

                                <strong>
                                    {user.role}
                                </strong>
                            </div>
                        </div>

                        <div className="profile-detail">
                            <div className="profile-detail-icon">
                                <BriefcaseBusiness size={17} />
                            </div>

                            <div>
                                <span>
                                    Workspace
                                </span>

                                <strong>
                                    Student
                                </strong>
                            </div>
                        </div>

                    </div>

                </div>

                {/* Resume card */}

                <div className="profile-surface">

                    <div className="profile-section-heading">

                        <div>
                            <span className="eyebrow">
                                DOCUMENT
                            </span>

                            <h2>
                                Resume
                            </h2>
                        </div>

                        <FileText size={20} />

                    </div>

                    {resume ? (
                        <div className="profile-resume-ready">

                            <div className="profile-resume-status">
                                <CheckCircle2 size={20} />
                            </div>

                            <div>
                                <strong>
                                    Resume uploaded
                                </strong>

                                <p>
                                    {resume.fileName ||
                                        "Current resume"}
                                </p>
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

                            <h3>
                                Your resume is missing
                            </h3>

                            <p>
                                Upload one before applying
                                to opportunities.
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

            {/* ================================================= */}
            {/* CAREER WORKSPACE */}
            {/* ================================================= */}

            <section className="profile-next-section">

                <div>
                    <span className="eyebrow">
                        NEXT STEPS
                    </span>

                    <h2>
                        Build a stronger candidate profile
                    </h2>

                    <p>
                        CampusOS will use your profile,
                        skills and resume to power the rest
                        of your career workspace.
                    </p>
                </div>

                <div className="profile-next-cards">

                    <Link
                        to="/student/resume"
                        className="profile-next-card"
                    >
                        <FileText size={20} />

                        <div>
                            <strong>
                                Resume
                            </strong>

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
                        <BriefcaseBusiness size={20} />

                        <div>
                            <strong>
                                Discover opportunities
                            </strong>

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