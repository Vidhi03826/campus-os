import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Bell,
    Bookmark,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    Plus,
    Sparkles,
    TrendingUp,
    UserRound,
} from "lucide-react";

import { Link } from "react-router-dom";

import { getCurrentUser } from "../../api/authApi";
import {
    getJobs,
    getResumeMetadata,
    getSavedJobs,
} from "../../api/studentApi";
import {
    getMyApplications,
} from "../../api/applicationApi";

function formatStatus(status) {
    if (!status) {
        return "Applied";
    }

    return String(status)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
    return String(status || "applied")
        .toLowerCase()
        .replaceAll("_", "-");
}

function formatDate(value) {
    if (!value) {
        return "Recently";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatRelativeDate(value) {
    if (!value) {
        return "Recently";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    const difference =
        Date.now() - date.getTime();

    const days = Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );

    if (days <= 0) {
        return "Today";
    }

    if (days === 1) {
        return "1 day ago";
    }

    if (days < 30) {
        return `${days} days ago`;
    }

    const months = Math.floor(days / 30);

    if (months === 1) {
        return "1 month ago";
    }

    return `${months} months ago`;
}

function formatJobType(value) {
    if (!value) {
        return "Full Time";
    }

    return String(value)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSalary(min, max) {
    if (min == null && max == null) {
        return "Salary not disclosed";
    }

    const format = (value) => {
        if (value >= 100000) {
            return `₹${(
                value / 100000
            ).toFixed(1)}L`;
        }

        return `₹${Math.round(
            value / 1000
        )}K`;
    };

    if (min != null && max != null) {
        return `${format(min)} – ${format(max)}`;
    }

    return min != null
        ? `From ${format(min)}`
        : `Up to ${format(max)}`;
}

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part[0]?.toUpperCase()
        )
        .join("");
}

function StatCard({
                      icon: Icon,
                      label,
                      value,
                      meta,
                      tone = "blue",
                  }) {
    return (
        <div className={`dashboard-stat-card ${tone}`}>
            <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon">
                    <Icon size={19} />
                </div>

                {meta && (
                    <span className="dashboard-stat-meta">
                        {meta}
                    </span>
                )}
            </div>

            <div className="dashboard-stat-value">
                {value}
            </div>

            <div className="dashboard-stat-label">
                {label}
            </div>
        </div>
    );
}

function StudentDashboard() {
    const [user, setUser] =
        useState(null);

    const [applications, setApplications] =
        useState([]);

    const [savedJobs, setSavedJobs] =
        useState([]);

    const [recommendedJobs, setRecommendedJobs] =
        useState([]);

    const [resume, setResume] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                /*
                 * Promise.allSettled keeps the dashboard
                 * resilient if one optional widget fails.
                 */
                const results =
                    await Promise.allSettled([
                        getCurrentUser(),
                        getMyApplications(),
                        getSavedJobs(),
                        getResumeMetadata(),
                        getJobs({
                            page: 0,
                            size: 6,
                            sort: "createdAt,desc",
                        }),
                    ]);

                const [
                    userResult,
                    applicationsResult,
                    savedResult,
                    resumeResult,
                    jobsResult,
                ] = results;

                if (
                    userResult.status ===
                    "fulfilled"
                ) {
                    setUser(
                        userResult.value
                    );
                }

                if (
                    applicationsResult.status ===
                    "fulfilled"
                ) {
                    const value =
                        applicationsResult.value;

                    setApplications(
                        Array.isArray(value)
                            ? value
                            : value?.content || []
                    );
                }

                if (
                    savedResult.status ===
                    "fulfilled"
                ) {
                    const value =
                        savedResult.value;

                    setSavedJobs(
                        Array.isArray(value)
                            ? value
                            : value?.content || []
                    );
                }

                if (
                    resumeResult.status ===
                    "fulfilled"
                ) {
                    setResume(
                        resumeResult.value
                    );
                }

                if (
                    jobsResult.status ===
                    "fulfilled"
                ) {
                    const value =
                        jobsResult.value;

                    const jobs =
                        Array.isArray(value)
                            ? value
                            : value?.content || [];

                    setRecommendedJobs(
                        jobs
                    );
                }

                /*
                 * Only show a page-level error if the
                 * primary identity request failed.
                 */
                if (
                    userResult.status ===
                    "rejected"
                ) {
                    setError(
                        userResult.reason?.response
                            ?.data?.message ||
                        "Unable to load your workspace."
                    );
                }
            } catch (err) {
                console.error(
                    "Dashboard loading failed:",
                    err
                );

                setError(
                    "Unable to load your dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        loadDashboard();
    }, []);

    const firstName =
        user?.name
            ?.trim()
            ?.split(/\s+/)[0] ||
        "there";

    const applicationStats =
        useMemo(() => {
            const stats = {
                total: applications.length,
                applied: 0,
                review: 0,
                interview: 0,
                accepted: 0,
                rejected: 0,
                withdrawn: 0,
            };

            applications.forEach(
                (application) => {
                    const status =
                        String(
                            application.status ||
                            "APPLIED"
                        ).toUpperCase();

                    stats.total +=
                        0;

                    if (
                        status ===
                        "APPLIED"
                    ) {
                        stats.applied++;
                    } else if (
                        [
                            "UNDER_REVIEW",
                            "REVIEWING",
                            "SHORTLISTED",
                        ].includes(status)
                    ) {
                        stats.review++;
                    } else if (
                        status ===
                        "INTERVIEW"
                    ) {
                        stats.interview++;
                    } else if (
                        [
                            "ACCEPTED",
                            "HIRED",
                        ].includes(status)
                    ) {
                        stats.accepted++;
                    } else if (
                        status ===
                        "REJECTED"
                    ) {
                        stats.rejected++;
                    } else if (
                        status ===
                        "WITHDRAWN"
                    ) {
                        stats.withdrawn++;
                    }
                }
            );

            return stats;
        }, [applications]);

    const profileProgress =
        useMemo(() => {
            const checks = [
                Boolean(user?.name),
                Boolean(user?.email),
                Boolean(resume),
            ];

            const completed =
                checks.filter(Boolean).length;

            return Math.round(
                (completed /
                    checks.length) *
                100
            );
        }, [user, resume]);

    const activeApplications =
        applications.filter(
            (application) => {
                const status =
                    String(
                        application.status ||
                        ""
                    ).toUpperCase();

                return ![
                    "REJECTED",
                    "WITHDRAWN",
                ].includes(status);
            }
        ).length;

    const recentApplications =
        [...applications]
            .sort((a, b) => {
                const first =
                    new Date(
                        a.appliedAt ||
                        a.createdAt ||
                        0
                    ).getTime();

                const second =
                    new Date(
                        b.appliedAt ||
                        b.createdAt ||
                        0
                    ).getTime();

                return second - first;
            })
            .slice(0, 4);

    const appliedJobIds =
        new Set(
            applications.map(
                (application) =>
                    application.jobId ||
                    application.job?.id
            )
        );

    const recommended =
        recommendedJobs
            .filter(
                (job) =>
                    !appliedJobIds.has(
                        job.id
                    )
            )
            .slice(0, 4);

    if (loading) {
        return (
            <div className="student-dashboard-loading">

                <div className="dashboard-loading-hero" />

                <div className="dashboard-loading-stats">
                    <div />
                    <div />
                    <div />
                    <div />
                </div>

                <div className="dashboard-loading-main">
                    <div />
                    <div />
                </div>

            </div>
        );
    }

    return (
        <div className="student-dashboard">

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
                <div className="dashboard-alert">
                    <span>{error}</span>
                </div>
            )}

            {/* ================================================= */}
            {/* HERO */}
            {/* ================================================= */}

            <section className="dashboard-hero-v2">

                <div className="dashboard-hero-copy">

                    <div className="dashboard-welcome-pill">
                        <Sparkles size={13} />
                        Student workspace
                    </div>

                    <h1>
                        Welcome back,{" "}
                        <span>
                            {firstName}.
                        </span>
                    </h1>

                    <p>
                        Your opportunities, applications
                        and career progress — organized in
                        one place.
                    </p>

                    <div className="dashboard-hero-actions">

                        <Link
                            to="/student/jobs"
                            className="primary-button"
                        >
                            <BriefcaseBusiness
                                size={16}
                            />
                            Explore opportunities
                            <ArrowRight size={15} />
                        </Link>

                        <Link
                            to="/student/profile"
                            className="secondary-button"
                        >
                            Complete profile
                        </Link>

                    </div>

                </div>

                <div className="dashboard-profile-card">

                    <div className="dashboard-profile-top">

                        <div className="dashboard-avatar">
                            {getInitials(
                                user?.name
                            )}
                        </div>

                        <div>
                            <span>
                                PROFILE READINESS
                            </span>

                            <strong>
                                {profileProgress}%
                            </strong>
                        </div>

                    </div>

                    <div className="dashboard-progress-track">
                        <div
                            className="dashboard-progress-fill"
                            style={{
                                width:
                                    `${profileProgress}%`,
                            }}
                        />
                    </div>

                    <div className="dashboard-profile-bottom">

                        <span>
                            {profileProgress ===
                            100
                                ? "You're ready to apply."
                                : "A few details can make your profile stronger."}
                        </span>

                        <Link
                            to="/student/profile"
                        >
                            Improve
                            <ChevronRight size={13} />
                        </Link>

                    </div>

                </div>

            </section>

            {/* ================================================= */}
            {/* STAT CARDS */}
            {/* ================================================= */}

            <section className="dashboard-stat-grid">

                <StatCard
                    icon={FileText}
                    label="Total applications"
                    value={applicationStats.total}
                    meta={
                        activeApplications > 0
                            ? `${activeApplications} active`
                            : "Start applying"
                    }
                />

                <StatCard
                    icon={Clock3}
                    label="In review"
                    value={applicationStats.review}
                    meta={
                        applicationStats.review > 0
                            ? "Needs attention"
                            : "No reviews yet"
                    }
                    tone="amber"
                />

                <StatCard
                    icon={Bookmark}
                    label="Saved opportunities"
                    value={savedJobs.length}
                    meta={
                        savedJobs.length > 0
                            ? "Worth revisiting"
                            : "Start bookmarking"
                    }
                    tone="violet"
                />

                <StatCard
                    icon={TrendingUp}
                    label="Interviews"
                    value={applicationStats.interview}
                    meta={
                        applicationStats.interview > 0
                            ? "Good momentum"
                            : "Keep applying"
                    }
                    tone="green"
                />

            </section>

            {/* ================================================= */}
            {/* MAIN GRID */}
            {/* ================================================= */}

            <section className="dashboard-main-grid">

                {/* APPLICATION ACTIVITY */}

                <div className="dashboard-surface dashboard-applications">

                    <div className="dashboard-section-header">

                        <div>
                            <span className="eyebrow">
                                APPLICATION ACTIVITY
                            </span>

                            <h2>
                                Your latest applications
                            </h2>
                        </div>

                        <Link
                            to="/student/applications"
                            className="dashboard-view-link"
                        >
                            View all
                            <ArrowRight size={14} />
                        </Link>

                    </div>

                    {recentApplications.length ===
                    0 ? (
                        <div className="dashboard-empty">

                            <div className="dashboard-empty-icon">
                                <FileText size={21} />
                            </div>

                            <h3>
                                Your application journey
                                starts here
                            </h3>

                            <p>
                                Apply to opportunities and
                                track every stage from this
                                workspace.
                            </p>

                            <Link
                                to="/student/jobs"
                                className="secondary-button"
                            >
                                Find opportunities
                            </Link>

                        </div>
                    ) : (
                        <div className="dashboard-application-list">

                            {recentApplications.map(
                                (application) => {

                                    const title =
                                        application.jobTitle ||
                                        application.job?.title ||
                                        "Job opportunity";

                                    const company =
                                        application.companyName ||
                                        application.company?.name ||
                                        "Company";

                                    const status =
                                        application.status ||
                                        "APPLIED";

                                    const date =
                                        application.appliedAt ||
                                        application.createdAt;

                                    return (
                                        <Link
                                            key={
                                                application.id
                                            }
                                            to={`/student/applications/${application.id}`}
                                            className="dashboard-application-row"
                                        >

                                            <div className="dashboard-company-logo">
                                                {company
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <div className="dashboard-application-info">

                                                <strong>
                                                    {title}
                                                </strong>

                                                <span>
                                                    {company}
                                                </span>

                                            </div>

                                            <div className="dashboard-application-date">
                                                <CalendarIcon />
                                                {formatDate(
                                                    date
                                                )}
                                            </div>

                                            <span
                                                className={`dashboard-status ${getStatusClass(
                                                    status
                                                )}`}
                                            >
                                                {formatStatus(
                                                    status
                                                )}
                                            </span>

                                            <ChevronRight
                                                size={16}
                                                className="dashboard-row-arrow"
                                            />

                                        </Link>
                                    );
                                }
                            )}

                        </div>
                    )}

                </div>

                {/* READINESS */}

                <div className="dashboard-surface dashboard-readiness">

                    <div className="dashboard-section-header">

                        <div>
                            <span className="eyebrow">
                                APPLICATION READINESS
                            </span>

                            <h2>
                                Ready when the right role
                                appears
                            </h2>
                        </div>

                    </div>

                    <div className="readiness-score">

                        <div
                            className="readiness-circle"
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
                            <strong>
                                Candidate readiness
                            </strong>

                            <p>
                                Keep the basics complete
                                before submitting applications.
                            </p>
                        </div>

                    </div>

                    <div className="readiness-list">

                        <div className="readiness-item">
                            <CheckCircle2
                                size={17}
                            />

                            <div>
                                <strong>
                                    Account profile
                                </strong>

                                <span>
                                    {user?.name &&
                                    user?.email
                                        ? "Complete"
                                        : "Needs attention"}
                                </span>
                            </div>
                        </div>

                        <div className="readiness-item">
                            {resume ? (
                                <CheckCircle2
                                    size={17}
                                />
                            ) : (
                                <Plus
                                    size={17}
                                />
                            )}

                            <div>
                                <strong>
                                    Resume
                                </strong>

                                <span>
                                    {resume
                                        ? "Uploaded and ready"
                                        : "Upload a PDF"}
                                </span>
                            </div>

                            {!resume && (
                                <Link
                                    to="/student/resume"
                                    className="readiness-action"
                                >
                                    Add
                                </Link>
                            )}
                        </div>

                        <div className="readiness-item">
                            <CheckCircle2
                                size={17}
                            />

                            <div>
                                <strong>
                                    Job discovery
                                </strong>

                                <span>
                                    {recommendedJobs.length > 0
                                        ? `${recommendedJobs.length} fresh opportunities`
                                        : "Explore opportunities"}
                                </span>
                            </div>
                        </div>

                    </div>

                </div>

            </section>

            {/* ================================================= */}
            {/* RECOMMENDED JOBS */}
            {/* ================================================= */}

            <section className="dashboard-surface dashboard-recommendations">

                <div className="dashboard-section-header">

                    <div>
                        <span className="eyebrow">
                            RECOMMENDED FOR YOU
                        </span>

                        <h2>
                            Fresh opportunities
                        </h2>

                        <p className="dashboard-section-description">
                            Recently published roles from
                            your CampusOS opportunity pool.
                        </p>
                    </div>

                    <Link
                        to="/student/jobs"
                        className="dashboard-view-link"
                    >
                        Discover all
                        <ArrowRight size={14} />
                    </Link>

                </div>

                {recommended.length === 0 ? (
                    <div className="dashboard-empty compact">
                        <BriefcaseBusiness
                            size={24}
                        />

                        <h3>
                            No new recommendations
                        </h3>

                        <p>
                            Explore the complete jobs
                            marketplace to discover your next role.
                        </p>

                        <Link
                            to="/student/jobs"
                            className="secondary-button"
                        >
                            Browse jobs
                        </Link>
                    </div>
                ) : (
                    <div className="dashboard-job-grid">

                        {recommended.map(
                            (job) => {

                                const company =
                                    job.companyName ||
                                    job.company?.name ||
                                    "Company";

                                return (
                                    <Link
                                        key={
                                            job.id
                                        }
                                        to={`/student/jobs/${job.id}`}
                                        className="dashboard-job-card"
                                    >

                                        <div className="dashboard-job-top">

                                            <div className="dashboard-company-logo">
                                                {company
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>

                                            <span className="dashboard-job-arrow">
                                                <ArrowRight
                                                    size={15}
                                                />
                                            </span>

                                        </div>

                                        <span className="dashboard-job-company">
                                            {company}
                                        </span>

                                        <h3>
                                            {job.title}
                                        </h3>

                                        <div className="dashboard-job-meta">

                                            <span>
                                                {job.location ||
                                                    "Remote"}
                                            </span>

                                            <span>
                                                {formatJobType(
                                                    job.jobType
                                                )}
                                            </span>

                                            <span>
                                                {formatJobType(
                                                    job.workMode
                                                )}
                                            </span>

                                        </div>

                                        <div className="dashboard-job-footer">

                                            <strong>
                                                {formatSalary(
                                                    job.salaryMin,
                                                    job.salaryMax
                                                )}
                                            </strong>

                                            <span>
                                                {formatRelativeDate(
                                                    job.createdAt
                                                )}
                                            </span>

                                        </div>

                                    </Link>
                                );
                            }
                        )}

                    </div>
                )}

            </section>

            {/* ================================================= */}
            {/* QUICK ACTIONS */}
            {/* ================================================= */}

            <section className="dashboard-quick-grid">

                <Link
                    to="/student/jobs"
                    className="dashboard-quick-card"
                >
                    <div className="dashboard-quick-icon">
                        <BriefcaseBusiness
                            size={19}
                        />
                    </div>

                    <div>
                        <strong>
                            Discover jobs
                        </strong>

                        <span>
                            Search current opportunities
                        </span>
                    </div>

                    <ArrowRight size={16} />
                </Link>

                <Link
                    to="/student/saved-jobs"
                    className="dashboard-quick-card"
                >
                    <div className="dashboard-quick-icon">
                        <Bookmark size={19} />
                    </div>

                    <div>
                        <strong>
                            Saved opportunities
                        </strong>

                        <span>
                            Revisit roles worth pursuing
                        </span>
                    </div>

                    <ArrowRight size={16} />
                </Link>

                <Link
                    to="/student/profile"
                    className="dashboard-quick-card"
                >
                    <div className="dashboard-quick-icon">
                        <UserRound size={19} />
                    </div>

                    <div>
                        <strong>
                            Candidate profile
                        </strong>

                        <span>
                            Keep your details recruiter-ready
                        </span>
                    </div>

                    <ArrowRight size={16} />
                </Link>

                <Link
                    to="/student/notifications"
                    className="dashboard-quick-card"
                >
                    <div className="dashboard-quick-icon">
                        <Bell size={19} />
                    </div>

                    <div>
                        <strong>
                            Notifications
                        </strong>

                        <span>
                            Stay updated on your activity
                        </span>
                    </div>

                    <ArrowRight size={16} />
                </Link>

            </section>

        </div>
    );
}

function CalendarIcon() {
    return (
        <span className="mini-calendar-icon">
            <Clock3 size={12} />
        </span>
    );
}

export default StudentDashboard;