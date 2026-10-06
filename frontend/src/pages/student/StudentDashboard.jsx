import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Bookmark,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    RefreshCw,
    Search,
    Sparkles,
    Target,
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
import { getMyApplications } from "../../api/applicationApi";

import "../../styles/student-dashboard.css";

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

    const difference = Date.now() - date.getTime();

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

    return months === 1
        ? "1 month ago"
        : `${months} months ago`;
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
            return `₹${(value / 100000).toFixed(1)}L`;
        }

        return `₹${Math.round(value / 1000)}K`;
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
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function extractList(value) {
    if (Array.isArray(value)) {
        return value;
    }

    return (
        value?.content ||
        value?.items ||
        value?.jobs ||
        value?.applications ||
        value?.data ||
        []
    );
}

function StatCard({
                      icon: Icon,
                      label,
                      value,
                      meta,
                      href,
                  }) {
    const content = (
        <>
            <div className="dashboard-stat-top">
                <div className="dashboard-stat-icon">
                    <Icon size={18} />
                </div>

                {meta && (
                    <span className="dashboard-stat-meta">
                        {meta}
                    </span>
                )}
            </div>

            <strong className="dashboard-stat-value">
                {value}
            </strong>

            <span className="dashboard-stat-label">
                {label}
            </span>
        </>
    );

    if (href) {
        return (
            <Link
                to={href}
                className="dashboard-stat-card"
            >
                {content}
            </Link>
        );
    }

    return (
        <div className="dashboard-stat-card">
            {content}
        </div>
    );
}

function ApplicationRow({ application }) {
    const status = String(
        application.status || "APPLIED"
    ).toUpperCase();

    const title =
        application.jobTitle ||
        application.job?.title ||
        "Untitled opportunity";

    const company =
        application.companyName ||
        application.company?.name ||
        "Company";

    const applicationId =
        application.applicationId ||
        application.id;

    return (
        <Link
            to={
                applicationId
                    ? `/student/applications/${applicationId}`
                    : "/student/applications"
            }
            className="dashboard-application-row"
        >
            <div className="dashboard-company-avatar">
                {getInitials(company) || "C"}
            </div>

            <div className="dashboard-application-main">
                <strong>{title}</strong>

                <span>
                    {company}
                    <span className="dashboard-dot">
                        •
                    </span>
                    {formatRelativeDate(
                        application.updatedAt ||
                        application.appliedAt
                    )}
                </span>
            </div>

            <span
                className={`dashboard-status ${getStatusClass(
                    status
                )}`}
            >
                {formatStatus(status)}
            </span>

            <ChevronRight
                size={16}
                className="dashboard-row-arrow"
            />
        </Link>
    );
}

function RecommendedJob({ job }) {
    const company =
        job.companyName ||
        job.company?.name ||
        "Company";

    return (
        <Link
            to={`/student/jobs/${job.id}`}
            className="dashboard-job-card"
        >
            <div className="dashboard-job-top">
                <div className="dashboard-company-avatar">
                    {getInitials(company) || "C"}
                </div>

                <Bookmark size={16} />
            </div>

            <span className="dashboard-job-company">
                {company}
            </span>

            <strong className="dashboard-job-title">
                {job.title}
            </strong>

            <div className="dashboard-job-meta">
                <span>
                    {job.location || "Remote"}
                </span>

                <span>
                    {formatJobType(job.jobType)}
                </span>
            </div>

            <div className="dashboard-job-bottom">
                <strong>
                    {formatSalary(
                        job.salaryMin,
                        job.salaryMax
                    )}
                </strong>

                <ArrowRight size={15} />
            </div>
        </Link>
    );
}

function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [applications, setApplications] = useState([]);
    const [savedJobs, setSavedJobs] = useState([]);
    const [recommendedJobs, setRecommendedJobs] = useState([]);
    const [resume, setResume] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadDashboard = async (
        isRefresh = false
    ) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

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
                setUser(userResult.value);
            }

            if (
                applicationsResult.status ===
                "fulfilled"
            ) {
                setApplications(
                    extractList(
                        applicationsResult.value
                    )
                );
            }

            if (
                savedResult.status ===
                "fulfilled"
            ) {
                setSavedJobs(
                    extractList(savedResult.value)
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
                setRecommendedJobs(
                    extractList(
                        jobsResult.value
                    )
                );
            }

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
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const firstName =
        user?.name
            ?.trim()
            ?.split(/\s+/)[0] ||
        "there";

    const initials =
        getInitials(user?.name) || "U";

    const applicationStats =
        useMemo(() => {
            const stats = {
                applied: 0,
                review: 0,
                interview: 0,
                selected: 0,
                rejected: 0,
                withdrawn: 0,
            };

            applications.forEach(
                (application) => {
                    const status = String(
                        application.status ||
                        "APPLIED"
                    ).toUpperCase();

                    if (
                        status === "APPLIED"
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
                        status === "INTERVIEW"
                    ) {
                        stats.interview++;
                    } else if (
                        [
                            "SELECTED",
                            "ACCEPTED",
                            "HIRED",
                        ].includes(status)
                    ) {
                        stats.selected++;
                    } else if (
                        status === "REJECTED"
                    ) {
                        stats.rejected++;
                    } else if (
                        status === "WITHDRAWN"
                    ) {
                        stats.withdrawn++;
                    }
                }
            );

            return stats;
        }, [applications]);

    const activeApplications =
        applications.filter(
            (application) =>
                ![
                    "REJECTED",
                    "WITHDRAWN",
                ].includes(
                    String(
                        application.status || ""
                    ).toUpperCase()
                )
        ).length;

    const recentApplications =
        [...applications]
            .sort((a, b) => {
                const first =
                    new Date(
                        a.updatedAt ||
                        a.appliedAt ||
                        0
                    ).getTime();

                const second =
                    new Date(
                        b.updatedAt ||
                        b.appliedAt ||
                        0
                    ).getTime();

                return second - first;
            })
            .slice(0, 5);

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

    const profileProgress =
        useMemo(() => {
            const checks = [
                Boolean(user?.name),
                Boolean(user?.email),
                Boolean(resume),
            ];

            return Math.round(
                (checks.filter(Boolean).length /
                    checks.length) *
                100
            );
        }, [user, resume]);

    const nextAction = useMemo(() => {
        if (profileProgress < 100) {
            return {
                title: "Complete your profile",
                description:
                    "A complete profile makes your application stronger.",
                href: "/student/profile",
                icon: UserRound,
            };
        }

        if (!resume) {
            return {
                title: "Add your resume",
                description:
                    "Upload a resume before applying to more roles.",
                href: "/student/resume",
                icon: FileText,
            };
        }

        if (applications.length === 0) {
            return {
                title: "Start applying",
                description:
                    "Explore opportunities that match your goals.",
                href: "/student/jobs",
                icon: Search,
            };
        }

        return {
            title: "Keep exploring",
            description:
                "You are making progress. Find your next opportunity.",
            href: "/student/jobs",
            icon: Target,
        };
    }, [
        profileProgress,
        resume,
        applications.length,
    ]);

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
            {error && (
                <div className="dashboard-alert">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            loadDashboard()
                        }
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* HERO */}

            <section className="dashboard-hero-v2">
                <div className="dashboard-hero-copy">
                    <div className="dashboard-welcome-pill">
                        <Sparkles size={13} />
                        Student workspace
                    </div>

                    <h1>
                        Welcome back,{" "}
                        <span>{firstName}.</span>
                    </h1>

                    <p>
                        Your opportunities,
                        applications and career
                        progress — organized in one
                        place.
                    </p>

                    <div className="dashboard-hero-actions">
                        <Link
                            to="/student/jobs"
                            className="dashboard-primary-action"
                        >
                            <Search size={16} />
                            Explore opportunities
                            <ArrowRight size={15} />
                        </Link>

                        <Link
                            to="/student/applications"
                            className="dashboard-secondary-action"
                        >
                            Track applications
                        </Link>
                    </div>
                </div>

                <div className="dashboard-profile-mini">
                    <div className="dashboard-avatar-large">
                        {initials}
                    </div>

                    <div>
                        <strong>
                            {user?.name ||
                                "Student"}
                        </strong>

                        <span>
                            {user?.email ||
                                "Student account"}
                        </span>
                    </div>

                    <Link
                        to="/student/profile"
                        aria-label="Open profile"
                    >
                        <ChevronRight size={18} />
                    </Link>
                </div>
            </section>

            {/* STATS */}

            <section className="dashboard-stats-grid">
                <StatCard
                    icon={FileText}
                    label="Applications"
                    value={applications.length}
                    meta={`${activeApplications} active`}
                    href="/student/applications"
                />

                <StatCard
                    icon={Clock3}
                    label="Under review"
                    value={applicationStats.review}
                    meta={
                        applicationStats.interview > 0
                            ? `${applicationStats.interview} interview`
                            : "Keep going"
                    }
                    href="/student/applications"
                />

                <StatCard
                    icon={Bookmark}
                    label="Saved jobs"
                    value={savedJobs.length}
                    meta="Ready to revisit"
                    href="/student/saved-jobs"
                />

                <StatCard
                    icon={CheckCircle2}
                    label="Selected"
                    value={applicationStats.selected}
                    meta={
                        applicationStats.selected > 0
                            ? "Great work"
                            : "Your goal"
                    }
                    href="/student/applications"
                />
            </section>

            {/* MAIN GRID */}

            <section className="dashboard-main-grid">
                <div className="dashboard-main-column">
                    {/* NEXT ACTION */}

                    <section className="dashboard-section-card dashboard-next-action">
                        <div className="dashboard-section-heading">
                            <div>
                                <span className="dashboard-section-eyebrow">
                                    NEXT BEST ACTION
                                </span>

                                <h2>
                                    {nextAction.title}
                                </h2>

                                <p>
                                    {nextAction.description}
                                </p>
                            </div>

                            <div className="dashboard-next-icon">
                                {(() => {
                                    const ActionIcon = nextAction.icon;

                                    return <ActionIcon size={21} />;
                                })()}
                            </div>
                        </div>

                        <Link
                            to={nextAction.href}
                            className="dashboard-next-link"
                        >
                            Continue
                            <ArrowRight size={15} />
                        </Link>
                    </section>

                    {/* APPLICATIONS */}

                    <section className="dashboard-section-card">
                        <div className="dashboard-section-header">
                            <div>
                                <span className="dashboard-section-eyebrow">
                                    APPLICATION TRACKER
                                </span>

                                <h2>
                                    Recent applications
                                </h2>
                            </div>

                            <Link
                                to="/student/applications"
                                className="dashboard-view-all"
                            >
                                View all
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {recentApplications.length >
                        0 ? (
                            <div className="dashboard-application-list">
                                {recentApplications.map(
                                    (
                                        application
                                    ) => (
                                        <ApplicationRow
                                            key={
                                                application.applicationId ||
                                                application.id
                                            }
                                            application={
                                                application
                                            }
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="dashboard-empty-small">
                                <div>
                                    <FileText
                                        size={19}
                                    />
                                </div>

                                <strong>
                                    No applications yet
                                </strong>

                                <span>
                                    Your application
                                    activity will
                                    appear here.
                                </span>

                                <Link
                                    to="/student/jobs"
                                >
                                    Browse jobs
                                    <ArrowRight
                                        size={14}
                                    />
                                </Link>
                            </div>
                        )}
                    </section>

                    {/* RECOMMENDED */}

                    <section className="dashboard-section-card">
                        <div className="dashboard-section-header">
                            <div>
                                <span className="dashboard-section-eyebrow">
                                    DISCOVER
                                </span>

                                <h2>
                                    Fresh opportunities
                                </h2>
                            </div>

                            <Link
                                to="/student/jobs"
                                className="dashboard-view-all"
                            >
                                Explore all
                                <ArrowRight size={14} />
                            </Link>
                        </div>

                        {recommended.length > 0 ? (
                            <div className="dashboard-jobs-grid">
                                {recommended.map(
                                    (job) => (
                                        <RecommendedJob
                                            key={job.id}
                                            job={job}
                                        />
                                    )
                                )}
                            </div>
                        ) : (
                            <div className="dashboard-empty-small">
                                <div>
                                    <BriefcaseBusiness
                                        size={19}
                                    />
                                </div>

                                <strong>
                                    No fresh roles yet
                                </strong>

                                <span>
                                    Check the jobs
                                    marketplace for
                                    new opportunities.
                                </span>

                                <Link
                                    to="/student/jobs"
                                >
                                    Find opportunities
                                    <ArrowRight
                                        size={14}
                                    />
                                </Link>
                            </div>
                        )}
                    </section>
                </div>

                {/* RIGHT RAIL */}

                <aside className="dashboard-side-column">
                    {/* PROFILE */}

                    <section className="dashboard-side-card">
                        <div className="dashboard-side-header">
                            <div>
                                <span>
                                    PROFILE
                                </span>

                                <h3>
                                    Profile strength
                                </h3>
                            </div>

                            <strong>
                                {profileProgress}%
                            </strong>
                        </div>

                        <div className="dashboard-progress">
                            <span
                                style={{
                                    width: `${profileProgress}%`,
                                }}
                            />
                        </div>

                        <p>
                            {profileProgress === 100
                                ? "Your profile is looking complete."
                                : "Complete your profile to make your workspace stronger."}
                        </p>

                        <Link
                            to="/student/profile"
                            className="dashboard-side-link"
                        >
                            Improve profile
                            <ArrowRight size={14} />
                        </Link>
                    </section>

                    {/* CAREER SNAPSHOT */}

                    <section className="dashboard-side-card">
                        <div className="dashboard-side-header">
                            <div>
                                <span>
                                    CAREER SNAPSHOT
                                </span>

                                <h3>
                                    Your progress
                                </h3>
                            </div>

                            <TrendingUp size={18} />
                        </div>

                        <div className="dashboard-progress-list">
                            <div>
                                <span>
                                    Applications
                                </span>

                                <strong>
                                    {
                                        applications.length
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    In review
                                </span>

                                <strong>
                                    {
                                        applicationStats.review
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Interviews
                                </span>

                                <strong>
                                    {
                                        applicationStats.interview
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Selected
                                </span>

                                <strong>
                                    {
                                        applicationStats.selected
                                    }
                                </strong>
                            </div>
                        </div>
                    </section>

                    {/* RESUME */}

                    <section className="dashboard-side-card dashboard-resume-card">
                        <div className="dashboard-resume-icon">
                            <FileText size={19} />
                        </div>

                        <div>
                            <span>
                                RESUME
                            </span>

                            <h3>
                                {resume
                                    ? "Resume ready"
                                    : "Resume missing"}
                            </h3>

                            <p>
                                {resume
                                    ? "Keep it updated before applying."
                                    : "Add your resume to strengthen applications."}
                            </p>
                        </div>

                        <Link
                            to="/student/resume"
                            aria-label="Manage resume"
                        >
                            <ChevronRight
                                size={18}
                            />
                        </Link>
                    </section>

                    {/* REFRESH */}

                    <button
                        type="button"
                        className="dashboard-refresh"
                        onClick={() =>
                            loadDashboard(true)
                        }
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={14}
                            className={
                                refreshing
                                    ? "is-spinning"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh workspace"}
                    </button>
                </aside>
            </section>
        </div>
    );
}

export default StudentDashboard;