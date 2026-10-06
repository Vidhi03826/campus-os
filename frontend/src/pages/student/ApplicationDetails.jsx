import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    FileText,
    MapPin,
    RefreshCw,
    RotateCcw,
    XCircle,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    getMyApplication,
    getApplicationHistory,
} from "../../api/applicationApi";

import "../../styles/application-details.css";

const STATUS_FLOW = [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
];

const normalizeStatus = (status) =>
    String(status || "APPLIED")
        .trim()
        .toUpperCase()
        .replace(/[\s-]+/g, "_");

const formatStatus = (status = "APPLIED") =>
    normalizeStatus(status)
        .split("_")
        .map(
            (word) =>
                word.charAt(0) +
                word.slice(1).toLowerCase()
        )
        .join(" ");

const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
};

const getList = (data, keys = []) => {
    if (Array.isArray(data)) {
        return data;
    }

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
};

const getJobTitle = (application) =>
    application?.jobTitle ??
    application?.job?.title ??
    application?.job?.jobTitle ??
    "Job application";

const getCompany = (application) =>
    application?.companyName ??
    application?.company?.name ??
    application?.job?.companyName ??
    application?.job?.company?.name ??
    "Company";

const getJobId = (application) =>
    application?.jobId ??
    application?.job?.id;

const getApplicationId = (application) =>
    application?.applicationId ??
    application?.id;

const getAppliedDate = (application) =>
    application?.appliedAt ??
    application?.createdAt ??
    application?.applicationDate;

const getUpdatedDate = (application) =>
    application?.updatedAt ??
    application?.lastUpdatedAt ??
    getAppliedDate(application);

const getFlowIndex = (status) => {
    const normalized = normalizeStatus(status);

    if (
        ["SELECTED", "ACCEPTED", "HIRED"].includes(
            normalized
        )
    ) {
        return STATUS_FLOW.length - 1;
    }

    if (normalized === "REVIEWING") {
        return 1;
    }

    const index = STATUS_FLOW.indexOf(normalized);

    return index >= 0 ? index : 0;
};

function CompanyAvatar({ company }) {
    const initials = company
        ? company
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map((word) =>
                word.charAt(0).toUpperCase()
            )
            .join("")
        : "C";

    return (
        <div className="ad-company-avatar">
            {initials}
        </div>
    );
}

function StatusBadge({ status }) {
    const normalized = normalizeStatus(status);

    let tone = "progress";

    if (
        ["SELECTED", "ACCEPTED", "HIRED"].includes(
            normalized
        )
    ) {
        tone = "success";
    } else if (normalized === "REJECTED") {
        tone = "danger";
    } else if (normalized === "WITHDRAWN") {
        tone = "neutral";
    } else if (normalized === "INTERVIEW") {
        tone = "purple";
    } else if (normalized === "SHORTLISTED") {
        tone = "blue";
    }

    return (
        <span
            className={`ad-status ad-status--${tone}`}
        >
            <span />
            {formatStatus(normalized)}
        </span>
    );
}

function ProgressTimeline({ status }) {
    const normalized = normalizeStatus(status);

    if (
        normalized === "REJECTED" ||
        normalized === "WITHDRAWN"
    ) {
        return (
            <div
                className={`ad-terminal ad-terminal--${normalized.toLowerCase()}`}
            >
                {normalized === "REJECTED" ? (
                    <XCircle size={19} />
                ) : (
                    <RotateCcw size={19} />
                )}

                <div>
                    <strong>
                        {normalized === "REJECTED"
                            ? "Application not selected"
                            : "Application withdrawn"}
                    </strong>

                    <span>
                        {normalized === "REJECTED"
                            ? "This application has reached its final stage."
                            : "You withdrew this application before the hiring process was completed."}
                    </span>
                </div>
            </div>
        );
    }

    const currentIndex =
        getFlowIndex(normalized);

    return (
        <div className="ad-timeline">
            {STATUS_FLOW.map((step, index) => {
                const completed =
                    index < currentIndex;

                const current =
                    index === currentIndex;

                return (
                    <div
                        className="ad-timeline-step-wrap"
                        key={step}
                    >
                        <div
                            className={`ad-timeline-step ${
                                completed
                                    ? "completed"
                                    : ""
                            } ${
                                current
                                    ? "current"
                                    : ""
                            }`}
                        >
                            <div className="ad-step-circle">
                                {completed ? (
                                    <Check size={14} />
                                ) : (
                                    index + 1
                                )}
                            </div>

                            <strong>
                                {formatStatus(
                                    step
                                )}
                            </strong>

                            <span>
                                {completed
                                    ? "Completed"
                                    : current
                                        ? "Current stage"
                                        : "Upcoming"}
                            </span>
                        </div>

                        {index <
                            STATUS_FLOW.length - 1 && (
                                <div
                                    className={`ad-timeline-line ${
                                        index <
                                        currentIndex
                                            ? "completed"
                                            : ""
                                    }`}
                                />
                            )}
                    </div>
                );
            })}
        </div>
    );
}

function DetailRow({
                       icon,
                       label,
                       value,
                   }) {
    return (
        <div className="ad-detail-row">
            <div className="ad-detail-icon">
                {icon}
            </div>

            <div>
                <span>{label}</span>
                <strong>{value || "—"}</strong>
            </div>
        </div>
    );
}

function HistoryTimeline({ history }) {
    if (!history.length) {
        return (
            <div className="ad-no-history">
                <Clock3 size={18} />

                <div>
                    <strong>
                        No activity recorded yet
                    </strong>

                    <p>
                        Status updates will appear
                        here as your application
                        progresses.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ol className="ad-history-list">
            {history.map((entry, index) => {
                const status =
                    entry?.status ??
                    entry?.applicationStatus ??
                    entry?.action ??
                    "Status update";

                const description =
                    entry?.description ??
                    entry?.message ??
                    entry?.notes ??
                    "Application activity recorded.";

                const date =
                    entry?.changedAt ??
                    entry?.createdAt ??
                    entry?.updatedAt ??
                    entry?.timestamp;

                return (
                    <li
                        key={
                            entry?.id ??
                            `${status}-${index}`
                        }
                        className={
                            index ===
                            history.length - 1
                                ? "last"
                                : ""
                        }
                    >
                        <div className="ad-history-marker">
                            {index === 0 ? (
                                <CheckCircle2
                                    size={15}
                                />
                            ) : (
                                <span />
                            )}
                        </div>

                        <div className="ad-history-content">
                            <div>
                                <strong>
                                    {formatStatus(
                                        status
                                    )}
                                </strong>

                                <time>
                                    {formatDateTime(
                                        date
                                    )}
                                </time>
                            </div>

                            <p>{description}</p>
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

export default function ApplicationDetails() {
    const { applicationId } =
        useParams();

    const navigate = useNavigate();

    const [application, setApplication] =
        useState(null);

    const [history, setHistory] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [historyLoading, setHistoryLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const loadApplication = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const data =
                    await getMyApplication(
                        applicationId
                    );

                setApplication(data);

                try {
                    setHistoryLoading(true);

                    const historyData =
                        await getApplicationHistory(
                            applicationId
                        );

                    setHistory(
                        getList(historyData, [
                            "content",
                            "history",
                            "events",
                            "items",
                            "data",
                        ])
                    );
                } catch (historyError) {
                    console.error(
                        "Unable to load history:",
                        historyError
                    );

                    setHistory([]);
                } finally {
                    setHistoryLoading(false);
                }
            } catch (err) {
                console.error(
                    "Unable to load application:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Couldn't load this application. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [applicationId]
    );

    useEffect(() => {
        if (applicationId) {
            loadApplication();
        }
    }, [
        applicationId,
        loadApplication,
    ]);

    const status = useMemo(
        () =>
            normalizeStatus(
                application?.status
            ),
        [application]
    );

    const jobTitle =
        getJobTitle(application);

    const company =
        getCompany(application);

    const jobId =
        getJobId(application);

    const appliedDate =
        getAppliedDate(application);

    const updatedDate =
        getUpdatedDate(application);

    if (loading) {
        return (
            <main className="ad-page">
                <div className="ad-loading">
                    <div className="ad-loading-spinner" />

                    <strong>
                        Loading application...
                    </strong>

                    <span>
                        Fetching your application
                        details and recruitment
                        activity.
                    </span>
                </div>
            </main>
        );
    }

    if (error || !application) {
        return (
            <main className="ad-page">
                <div className="ad-error-state">
                    <div className="ad-error-icon">
                        <FileText size={25} />
                    </div>

                    <span className="ad-eyebrow">
                        APPLICATION
                    </span>

                    <h1>
                        We couldn't load this
                        application
                    </h1>

                    <p>
                        {error ||
                            "The application you're looking for could not be found."}
                    </p>

                    <div className="ad-error-actions">
                        <button
                            type="button"
                            onClick={() =>
                                loadApplication()
                            }
                            className="ad-primary-button"
                        >
                            <RefreshCw
                                size={15}
                            />
                            Try again
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/student/applications"
                                )
                            }
                            className="ad-secondary-button"
                        >
                            <ArrowLeft
                                size={15}
                            />
                            Back to applications
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="ad-page">
            {/* =================================================
                TOP BAR
               ================================================= */}

            <div className="ad-topbar">
                <button
                    type="button"
                    className="ad-back-button"
                    onClick={() =>
                        navigate(
                            "/student/applications"
                        )
                    }
                >
                    <ArrowLeft size={15} />
                    Back to applications
                </button>

                <button
                    type="button"
                    className="ad-refresh-button"
                    onClick={() =>
                        loadApplication(true)
                    }
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={14}
                        className={
                            refreshing
                                ? "ad-spin"
                                : ""
                        }
                    />

                    {refreshing
                        ? "Refreshing"
                        : "Refresh"}
                </button>
            </div>

            {/* =================================================
                HERO
               ================================================= */}

            <section className="ad-hero">
                <div className="ad-hero-main">
                    <CompanyAvatar
                        company={company}
                    />

                    <div>
                        <span className="ad-company">
                            {company}
                        </span>

                        <h1>{jobTitle}</h1>

                        <div className="ad-hero-meta">
                            {jobId && (
                                <Link
                                    to={`/student/jobs/${jobId}`}
                                >
                                    View job
                                </Link>
                            )}

                            <span>
                                Application #
                                {getApplicationId(
                                    application
                                )}
                            </span>

                            <span>
                                Applied{" "}
                                {formatDate(
                                    appliedDate
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                <StatusBadge
                    status={status}
                />
            </section>

            {/* =================================================
                STATUS PROGRESS
               ================================================= */}

            <section className="ad-section ad-progress-card">
                <div className="ad-section-heading">
                    <div>
                        <span className="ad-eyebrow">
                            RECRUITMENT JOURNEY
                        </span>

                        <h2>
                            Application progress
                        </h2>
                    </div>

                    <div className="ad-updated">
                        <Clock3 size={13} />
                        Updated{" "}
                        {formatDate(
                            updatedDate
                        )}
                    </div>
                </div>

                <ProgressTimeline
                    status={status}
                />
            </section>

            {/* =================================================
                MAIN GRID
               ================================================= */}

            <div className="ad-main-grid">
                {/* LEFT */}

                <div className="ad-main-column">
                    <section className="ad-section">
                        <div className="ad-section-heading">
                            <div>
                                <span className="ad-eyebrow">
                                    ACTIVITY
                                </span>

                                <h2>
                                    Application
                                    timeline
                                </h2>
                            </div>

                            {!historyLoading && (
                                <span className="ad-count">
                                    {history.length}{" "}
                                    updates
                                </span>
                            )}
                        </div>

                        {historyLoading ? (
                            <div className="ad-history-loading">
                                <div className="ad-loading-spinner" />
                                Loading activity...
                            </div>
                        ) : (
                            <HistoryTimeline
                                history={history}
                            />
                        )}
                    </section>

                    {/* WHAT HAPPENS NEXT */}

                    <section className="ad-next-card">
                        <div className="ad-next-icon">
                            <BriefcaseBusiness
                                size={18}
                            />
                        </div>

                        <div>
                            <span className="ad-eyebrow">
                                WHAT'S NEXT
                            </span>

                            <h3>
                                {status ===
                                "SELECTED"
                                    ? "Congratulations! 🎉"
                                    : status ===
                                    "REJECTED"
                                        ? "Keep going."
                                        : status ===
                                        "WITHDRAWN"
                                            ? "Ready for the next opportunity?"
                                            : "Stay ready for the next step."}
                            </h3>

                            <p>
                                {status ===
                                "SELECTED"
                                    ? "Your application has been selected. Keep an eye on your notifications for further communication from the recruiter."
                                    : status ===
                                    "REJECTED"
                                        ? "One application doesn't define your journey. Explore more opportunities and keep applying."
                                        : status ===
                                        "WITHDRAWN"
                                            ? "There are always more opportunities waiting for you."
                                            : "We'll keep your application status updated here whenever the recruiter moves it forward."}
                            </p>

                            {status !==
                                "SELECTED" && (
                                    <Link
                                        to="/student/jobs"
                                        className="ad-next-link"
                                    >
                                        Explore more jobs
                                    </Link>
                                )}
                        </div>
                    </section>
                </div>

                {/* RIGHT */}

                <aside className="ad-sidebar">
                    <section className="ad-section ad-info-card">
                        <div className="ad-section-heading">
                            <div>
                                <span className="ad-eyebrow">
                                    APPLICATION
                                </span>

                                <h2>
                                    Details
                                </h2>
                            </div>
                        </div>

                        <div className="ad-details">
                            <DetailRow
                                icon={
                                    <BriefcaseBusiness
                                        size={15}
                                    />
                                }
                                label="Position"
                                value={
                                    jobTitle
                                }
                            />

                            <DetailRow
                                icon={
                                    <BriefcaseBusiness
                                        size={15}
                                    />
                                }
                                label="Company"
                                value={
                                    company
                                }
                            />

                            <DetailRow
                                icon={
                                    <CalendarDays
                                        size={15}
                                    />
                                }
                                label="Applied on"
                                value={formatDate(
                                    appliedDate
                                )}
                            />

                            <DetailRow
                                icon={
                                    <Clock3
                                        size={15}
                                    />
                                }
                                label="Last updated"
                                value={formatDate(
                                    updatedDate
                                )}
                            />

                            <DetailRow
                                icon={
                                    <FileText
                                        size={15}
                                    />
                                }
                                label="Application ID"
                                value={`#${getApplicationId(
                                    application
                                )}`}
                            />
                        </div>
                    </section>

                    {/* QUICK ACTIONS */}

                    <section className="ad-section ad-actions-card">
                        <span className="ad-eyebrow">
                            QUICK ACTIONS
                        </span>

                        <div className="ad-quick-actions">
                            {jobId && (
                                <Link
                                    to={`/student/jobs/${jobId}`}
                                    className="ad-quick-action"
                                >
                                    <MapPin
                                        size={15}
                                    />

                                    <span>
                                        View job
                                    </span>
                                </Link>
                            )}

                            <Link
                                to="/student/applications"
                                className="ad-quick-action"
                            >
                                <FileText
                                    size={15}
                                />

                                <span>
                                    All applications
                                </span>
                            </Link>

                            <Link
                                to="/student/jobs"
                                className="ad-quick-action"
                            >
                                <BriefcaseBusiness
                                    size={15}
                                />

                                <span>
                                    Find more jobs
                                </span>
                            </Link>
                        </div>
                    </section>

                    {/* STATUS NOTE */}

                    <section
                        className={`ad-status-note ad-status-note--${status.toLowerCase()}`}
                    >
                        {status ===
                        "SELECTED" ? (
                            <CheckCircle2
                                size={18}
                            />
                        ) : status ===
                        "REJECTED" ? (
                            <XCircle
                                size={18}
                            />
                        ) : (
                            <Clock3
                                size={18}
                            />
                        )}

                        <div>
                            <strong>
                                {status ===
                                "SELECTED"
                                    ? "You're selected"
                                    : status ===
                                    "REJECTED"
                                        ? "Application closed"
                                        : "Application is active"}
                            </strong>

                            <span>
                                {status ===
                                "SELECTED"
                                    ? "Watch your notifications for next steps."
                                    : status ===
                                    "REJECTED"
                                        ? "You can continue exploring other opportunities."
                                        : "We'll show every status change here."}
                            </span>
                        </div>
                    </section>
                </aside>
            </div>
        </main>
    );
}