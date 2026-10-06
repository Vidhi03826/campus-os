import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    BriefcaseBusiness,
    ChevronRight,
    CircleCheck,
    Clock3,
    FileText,
    Plus,
    RefreshCw,
    Users,
    XCircle,
} from "lucide-react";

import { useAuth } from "../../auth/AuthContext";
import { getMyJobs } from "../../api/recruiterApi";
import "../../styles/recruiter-dashboard.css";
import "../../styles/recruiter.css";
const STATUS_LABELS = {
    PUBLISHED: "Published",
    DRAFT: "Draft",
    CLOSED: "Closed",
};

const getDisplayName = (user) =>
    user?.name ||
    user?.fullName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Recruiter";

const getInitials = (name) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "R";

const formatDate = (value) => {
    if (!value) return "No deadline";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "No deadline";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
};

const formatRelativeDate = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86_400_000);

    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;

    return formatDate(value);
};

const getErrorMessage = (error) => {
    const data = error?.response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof error?.message === "string") return error.message;

    return "We couldn't load your recruiter workspace.";
};

const getJobsFromResponse = (data) => {
    if (Array.isArray(data)) return data;

    return (
        data?.content ??
        data?.jobs ??
        data?.data ??
        []
    );
};

function StatCard({
                      icon: Icon,
                      label,
                      value,
                      description,
                      tone = "purple",
                  }) {
    return (
        <article className={`rd-stat-card rd-stat-${tone}`}>
            <div className="rd-stat-icon">
                <Icon size={18} strokeWidth={2.2} />
            </div>

            <div className="rd-stat-copy">
                <span>{label}</span>
                <strong>{value}</strong>
                <small>{description}</small>
            </div>
        </article>
    );
}

function StatusBadge({ status }) {
    const normalized = String(status || "UNKNOWN").toUpperCase();

    return (
        <span
            className={`rd-status rd-status-${normalized.toLowerCase()}`}
        >
            <span />
            {STATUS_LABELS[normalized] || normalized.replaceAll("_", " ")}
        </span>
    );
}

function RecruiterDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const displayName = getDisplayName(user);
    const initials = getInitials(displayName);

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const loadJobs = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const data = await getMyJobs();
            const records = getJobsFromResponse(data);

            setJobs(Array.isArray(records) ? records : []);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const stats = useMemo(() => {
        const published = jobs.filter(
            (job) => String(job.status).toUpperCase() === "PUBLISHED"
        ).length;

        const draft = jobs.filter(
            (job) => String(job.status).toUpperCase() === "DRAFT"
        ).length;

        const closed = jobs.filter(
            (job) => String(job.status).toUpperCase() === "CLOSED"
        ).length;

        return {
            total: jobs.length,
            published,
            draft,
            closed,
        };
    }, [jobs]);

    const recentJobs = useMemo(() => {
        return [...jobs]
            .sort((a, b) => {
                const dateA = new Date(
                    a.createdAt ??
                    a.updatedAt ??
                    a.applicationDeadline ??
                    0
                ).getTime();

                const dateB = new Date(
                    b.createdAt ??
                    b.updatedAt ??
                    b.applicationDeadline ??
                    0
                ).getTime();

                return dateB - dateA;
            })
            .slice(0, 5);
    }, [jobs]);

    const upcomingDeadlines = useMemo(() => {
        const now = Date.now();

        return jobs
            .filter((job) => {
                if (!job.applicationDeadline) return false;

                const deadline = new Date(job.applicationDeadline).getTime();

                return (
                    !Number.isNaN(deadline) &&
                    deadline >= now &&
                    String(job.status).toUpperCase() === "PUBLISHED"
                );
            })
            .sort(
                (a, b) =>
                    new Date(a.applicationDeadline).getTime() -
                    new Date(b.applicationDeadline).getTime()
            )
            .slice(0, 4);
    }, [jobs]);

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    return (
        <main className="rd-page">
            <div className="rd-container">

                {/* HERO */}
                <section className="rd-hero">
                    <div className="rd-hero-content">
                        <div className="rd-eyebrow">
                            <span />
                            RECRUITER COMMAND CENTER
                        </div>

                        <h1>
                            Welcome back,{" "}
                            <span>{displayName}</span>
                        </h1>

                        <p>
                            Manage your openings, monitor your hiring
                            workspace, and connect with campus talent.
                        </p>

                        <div className="rd-hero-actions">
                            <button
                                type="button"
                                className="rd-primary-button"
                                onClick={() =>
                                    navigate("/recruiter/jobs/new")
                                }
                            >
                                <Plus size={17} />
                                Post a new job
                            </button>

                            <button
                                type="button"
                                className="rd-secondary-button"
                                onClick={() =>
                                    navigate("/recruiter/jobs")
                                }
                            >
                                Manage postings
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="rd-hero-profile">
                        <div className="rd-profile-avatar">
                            {initials}
                        </div>

                        <div>
                            <span>Signed in as</span>
                            <strong>{displayName}</strong>
                            <small>
                                {user?.email || "Recruiter account"}
                            </small>
                        </div>
                    </div>
                </section>

                {/* ERROR */}
                {error && (
                    <div className="rd-alert" role="alert">
                        <div>
                            <strong>Couldn't load workspace data</strong>
                            <span>{error}</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => loadJobs(true)}
                            disabled={refreshing}
                        >
                            <RefreshCw
                                size={14}
                                className={
                                    refreshing ? "rd-spin" : ""
                                }
                            />
                            Try again
                        </button>
                    </div>
                )}

                {/* STATS */}
                <section className="rd-stats">
                    <StatCard
                        icon={BriefcaseBusiness}
                        label="Total openings"
                        value={loading ? "—" : stats.total}
                        description="Jobs in your workspace"
                        tone="purple"
                    />

                    <StatCard
                        icon={CircleCheck}
                        label="Published"
                        value={loading ? "—" : stats.published}
                        description="Currently visible to students"
                        tone="green"
                    />

                    <StatCard
                        icon={FileText}
                        label="Drafts"
                        value={loading ? "—" : stats.draft}
                        description="Openings waiting to publish"
                        tone="amber"
                    />

                    <StatCard
                        icon={XCircle}
                        label="Closed"
                        value={loading ? "—" : stats.closed}
                        description="No longer accepting candidates"
                        tone="slate"
                    />
                </section>

                {/* MAIN GRID */}
                <section className="rd-main-grid">

                    {/* RECENT JOBS */}
                    <div className="rd-panel rd-jobs-panel">
                        <div className="rd-panel-heading">
                            <div>
                                <span className="rd-section-kicker">
                                    WORKSPACE
                                </span>
                                <h2>Your job postings</h2>
                                <p>
                                    Quickly jump into your latest
                                    recruitment activity.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="rd-refresh-button"
                                onClick={() => loadJobs(true)}
                                disabled={loading || refreshing}
                                aria-label="Refresh job postings"
                            >
                                <RefreshCw
                                    size={15}
                                    className={
                                        refreshing ? "rd-spin" : ""
                                    }
                                />
                            </button>
                        </div>

                        {loading ? (
                            <div className="rd-skeleton-list">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        className="rd-job-skeleton"
                                        key={item}
                                    />
                                ))}
                            </div>
                        ) : recentJobs.length === 0 ? (
                            <div className="rd-empty">
                                <div className="rd-empty-icon">
                                    <BriefcaseBusiness size={22} />
                                </div>

                                <h3>No job postings yet</h3>

                                <p>
                                    Create your first opening and start
                                    building your campus talent pipeline.
                                </p>

                                <button
                                    type="button"
                                    className="rd-primary-button"
                                    onClick={() =>
                                        navigate("/recruiter/jobs/new")
                                    }
                                >
                                    <Plus size={16} />
                                    Create opening
                                </button>
                            </div>
                        ) : (
                            <div className="rd-job-list">
                                {recentJobs.map((job) => (
                                    <article
                                        className="rd-job-row"
                                        key={job.id}
                                    >
                                        <div className="rd-job-mark">
                                            {String(
                                                job.title || "J"
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="rd-job-info">
                                            <div className="rd-job-title-line">
                                                <h3>
                                                    {job.title ||
                                                        "Untitled opening"}
                                                </h3>

                                                <StatusBadge
                                                    status={job.status}
                                                />
                                            </div>

                                            <div className="rd-job-meta">
                                                <span>
                                                    {job.location ||
                                                        "Location not specified"}
                                                </span>

                                                {job.workMode && (
                                                    <>
                                                        <i />
                                                        <span>
                                                            {job.workMode}
                                                        </span>
                                                    </>
                                                )}

                                                {job.jobType && (
                                                    <>
                                                        <i />
                                                        <span>
                                                            {job.jobType}
                                                        </span>
                                                    </>
                                                )}
                                            </div>

                                            <span className="rd-job-updated">
                                                {job.updatedAt ||
                                                job.createdAt
                                                    ? `Updated ${formatRelativeDate(
                                                        job.updatedAt ??
                                                        job.createdAt
                                                    )}`
                                                    : "Recently created"}
                                            </span>
                                        </div>

                                        <Link
                                            className="rd-job-open"
                                            to={`/recruiter/jobs/${job.id}/applicants`}
                                        >
                                            Applicants
                                            <ChevronRight size={15} />
                                        </Link>
                                    </article>
                                ))}
                            </div>
                        )}

                        {!loading && jobs.length > 0 && (
                            <div className="rd-panel-footer">
                                <Link to="/recruiter/jobs">
                                    View all job postings
                                    <ChevronRight size={15} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* SIDE PANEL */}
                    <div className="rd-side-column">

                        {/* DEADLINES */}
                        <div className="rd-panel rd-deadline-panel">
                            <div className="rd-panel-heading rd-compact-heading">
                                <div>
                                    <span className="rd-section-kicker">
                                        ATTENTION
                                    </span>
                                    <h2>Upcoming deadlines</h2>
                                </div>

                                <Clock3 size={17} />
                            </div>

                            {loading ? (
                                <div className="rd-mini-skeletons">
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            ) : upcomingDeadlines.length === 0 ? (
                                <div className="rd-mini-empty">
                                    <CircleCheck size={19} />
                                    <span>
                                        No upcoming deadlines need
                                        attention.
                                    </span>
                                </div>
                            ) : (
                                <div className="rd-deadline-list">
                                    {upcomingDeadlines.map((job) => (
                                        <Link
                                            to={`/recruiter/jobs/${job.id}/applicants`}
                                            className="rd-deadline-item"
                                            key={job.id}
                                        >
                                            <div>
                                                <strong>
                                                    {job.title}
                                                </strong>
                                                <span>
                                                    Deadline{" "}
                                                    {formatDate(
                                                        job.applicationDeadline
                                                    )}
                                                </span>
                                            </div>

                                            <ChevronRight size={15} />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* QUICK ACTIONS */}
                        <div className="rd-panel rd-quick-panel">
                            <div className="rd-panel-heading rd-compact-heading">
                                <div>
                                    <span className="rd-section-kicker">
                                        QUICK ACTIONS
                                    </span>
                                    <h2>Keep moving</h2>
                                </div>
                            </div>

                            <div className="rd-quick-list">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/recruiter/jobs/new")
                                    }
                                >
                                    <span className="rd-quick-icon rd-purple">
                                        <Plus size={16} />
                                    </span>
                                    <span>
                                        <strong>Create job</strong>
                                        <small>
                                            Publish a new opportunity
                                        </small>
                                    </span>
                                    <ChevronRight size={15} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate("/recruiter/jobs")
                                    }
                                >
                                    <span className="rd-quick-icon rd-blue">
                                        <BriefcaseBusiness size={16} />
                                    </span>
                                    <span>
                                        <strong>Manage jobs</strong>
                                        <small>
                                            Review all your openings
                                        </small>
                                    </span>
                                    <ChevronRight size={15} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/recruiter/notifications"
                                        )
                                    }
                                >
                                    <span className="rd-quick-icon rd-green">
                                        <Users size={16} />
                                    </span>
                                    <span>
                                        <strong>Notifications</strong>
                                        <small>
                                            Check recruitment updates
                                        </small>
                                    </span>
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <footer className="rd-footer">
                    <span>
                        <strong>CampusOS</strong>
                        <i />
                        Recruiter workspace
                    </span>

                    <button
                        type="button"
                        onClick={handleLogout}
                    >
                        Sign out
                    </button>
                </footer>
            </div>
        </main>
    );
}

export default RecruiterDashboard;