import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BriefcaseBusiness,
    Check,
    ChevronDown,
    ChevronRight,
    Clock3,
    ExternalLink,
    FileCheck2,
    RefreshCw,
    Search,
    X,
    XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
    getMyApplications,
    getApplicationHistory,
    withdrawApplication,
} from "../../api/applicationApi";

import "../../styles/student-applications.css";

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

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const formatDateTime = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getId = (application) =>
    application?.id ?? application?.applicationId;

const getJobId = (application) =>
    application?.jobId ?? application?.job?.id;

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

const getAppliedDate = (application) =>
    application?.appliedAt ??
    application?.createdAt ??
    application?.applicationDate;

const getList = (data, keys = []) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
        if (Array.isArray(data?.[key])) {
            return data[key];
        }
    }

    return [];
};

const getHistoryList = (data) => {
    if (Array.isArray(data)) return data;

    return (
        data?.content ||
        data?.history ||
        data?.items ||
        data?.data ||
        []
    );
};

const statusOrder = [
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
];

const isCompletedStatus = (status) =>
    ["SELECTED", "REJECTED", "WITHDRAWN"].includes(
        normalizeStatus(status)
    );

function StatusIcon({ status }) {
    const normalized = normalizeStatus(status);

    if (normalized === "SELECTED") {
        return <Check size={14} />;
    }

    if (normalized === "REJECTED") {
        return <XCircle size={14} />;
    }

    if (normalized === "WITHDRAWN") {
        return <X size={14} />;
    }

    return <Clock3 size={14} />;
}

export default function StudentApplications() {
    const { success: showSuccess, error: showError } = useToast();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const [expandedId, setExpandedId] = useState(null);
    const [history, setHistory] = useState({});
    const [historyLoadingId, setHistoryLoadingId] =
        useState(null);

    const [withdrawingId, setWithdrawingId] =
        useState(null);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const loadApplications = useCallback(
        async (isRefresh = false) => {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            try {
                const data = await getMyApplications();

                const list = getList(data, [
                    "content",
                    "applications",
                    "data",
                    "items",
                ]);

                setApplications(list);
            } catch (err) {
                console.error(
                    "Unable to load applications:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Couldn't load your applications. Please try again."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const counts = useMemo(() => {
        return {
            total: applications.length,

            active: applications.filter((app) =>
                [
                    "APPLIED",
                    "UNDER_REVIEW",
                    "SHORTLISTED",
                    "INTERVIEW",
                ].includes(normalizeStatus(app.status))
            ).length,

            selected: applications.filter(
                (app) =>
                    normalizeStatus(app.status) ===
                    "SELECTED"
            ).length,

            rejected: applications.filter(
                (app) =>
                    normalizeStatus(app.status) ===
                    "REJECTED"
            ).length,
        };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        const query = search.trim().toLowerCase();

        return applications.filter((application) => {
            const status = normalizeStatus(
                application.status
            );

            const matchesFilter =
                filter === "ALL" ||
                status === filter;

            const matchesSearch =
                !query ||
                getJobTitle(application)
                    .toLowerCase()
                    .includes(query) ||
                getCompany(application)
                    .toLowerCase()
                    .includes(query) ||
                String(getId(application) || "")
                    .toLowerCase()
                    .includes(query);

            return matchesFilter && matchesSearch;
        });
    }, [applications, filter, search]);

    const toggleHistory = async (application) => {
        const id = getId(application);

        if (!id) return;

        if (String(expandedId) === String(id)) {
            setExpandedId(null);
            return;
        }

        setExpandedId(id);
        setMessage("");

        if (history[id]) {
            return;
        }

        try {
            setHistoryLoadingId(id);

            const data =
                await getApplicationHistory(id);

            setHistory((current) => ({
                ...current,
                [id]: getHistoryList(data),
            }));
        } catch (err) {
            console.error(
                "Unable to load application history:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load application history."
            );
        } finally {
            setHistoryLoadingId(null);
        }
    };

    const handleWithdraw = async (application) => {
        const id = getId(application);

        if (!id) return;

        const confirmed = window.confirm(
            `Withdraw your application for "${getJobTitle(
                application
            )}"?`
        );

        if (!confirmed) return;

        try {
            setWithdrawingId(id);
            setError("");
            setMessage("");

            const updated =
                await withdrawApplication(id);

            setApplications((current) =>
                current.map((item) =>
                    String(getId(item)) === String(id)
                        ? {
                            ...item,
                            ...(updated || {}),
                            status: "WITHDRAWN",
                        }
                        : item
                )
            );

            setMessage(
                "Application withdrawn successfully."

            );
            showSuccess(
                "Your application has been withdrawn.",
                "Application withdrawn"
            );
        } catch (err) {
            const message =
                err.response?.data?.message ||
                "Unable to withdraw this application. Please try again.";

            setError(message);
            showError(message);
        } finally {
            setWithdrawingId(null);
        }
    };

    if (loading) {
        return (
            <div className="student-applications-page">

                <div className="sa-loading-heading">
                    <div />
                    <div />
                    <div />
                </div>

                <div className="sa-loading-stats">
                    {Array.from({ length: 4 }).map(
                        (_, index) => (
                            <div
                                className="sa-stat-skeleton"
                                key={index}
                            />
                        )
                    )}
                </div>

                <div className="sa-loading-list">
                    {Array.from({ length: 4 }).map(
                        (_, index) => (
                            <div
                                className="sa-application-skeleton"
                                key={index}
                            />
                        )
                    )}
                </div>

            </div>
        );
    }

    return (
        <div className="student-applications-page">

            {/* HEADER */}
            <section className="sa-page-header">

                <div>
                    <span className="eyebrow">
                        APPLICATION TRACKER
                    </span>

                    <h1>My applications</h1>

                    <p>
                        Keep track of every opportunity
                        you've applied to and where you stand.
                    </p>
                </div>

                <button
                    type="button"
                    className="sa-refresh-button"
                    onClick={() =>
                        loadApplications(true)
                    }
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={16}
                        className={
                            refreshing
                                ? "sa-spin"
                                : ""
                        }
                    />
                    Refresh
                </button>

            </section>

            {/* STATS */}
            <section className="sa-stats-grid">

                <div className="sa-stat-card">
                    <div className="sa-stat-icon">
                        <BriefcaseBusiness size={18} />
                    </div>

                    <div>
                        <span>Total applications</span>
                        <strong>{counts.total}</strong>
                    </div>
                </div>

                <div className="sa-stat-card">
                    <div className="sa-stat-icon sa-stat-icon--blue">
                        <Clock3 size={18} />
                    </div>

                    <div>
                        <span>In progress</span>
                        <strong>{counts.active}</strong>
                    </div>
                </div>

                <div className="sa-stat-card">
                    <div className="sa-stat-icon sa-stat-icon--green">
                        <Check size={18} />
                    </div>

                    <div>
                        <span>Selected</span>
                        <strong>{counts.selected}</strong>
                    </div>
                </div>

                <div className="sa-stat-card">
                    <div className="sa-stat-icon sa-stat-icon--red">
                        <XCircle size={18} />
                    </div>

                    <div>
                        <span>Not selected</span>
                        <strong>{counts.rejected}</strong>
                    </div>
                </div>

            </section>

            {/* ALERTS */}
            {error && (
                <div className="sa-alert sa-alert--error">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {message && (
                <div className="sa-alert sa-alert--success">
                    <Check size={16} />
                    <span>{message}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setMessage("")
                        }
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* TOOLBAR */}
            <section className="sa-toolbar">

                <div className="sa-search">

                    <Search size={17} />

                    <input
                        type="text"
                        placeholder="Search jobs or companies..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            aria-label="Clear search"
                        >
                            <X size={15} />
                        </button>
                    )}

                </div>

                <div className="sa-filters">

                    {[
                        ["ALL", "All"],
                        ["APPLIED", "Applied"],
                        ["UNDER_REVIEW", "Under review"],
                        ["SHORTLISTED", "Shortlisted"],
                        ["INTERVIEW", "Interview"],
                        ["SELECTED", "Selected"],
                        ["REJECTED", "Rejected"],
                        ["WITHDRAWN", "Withdrawn"],
                    ].map(([value, label]) => (
                        <button
                            type="button"
                            key={value}
                            className={
                                filter === value
                                    ? "sa-filter active"
                                    : "sa-filter"
                            }
                            onClick={() =>
                                setFilter(value)
                            }
                        >
                            {label}
                        </button>
                    ))}

                </div>

            </section>

            {/* RESULTS */}
            <div className="sa-results-heading">
                <span>
                    Showing{" "}
                    <strong>
                        {filteredApplications.length}
                    </strong>{" "}
                    {filteredApplications.length === 1
                        ? "application"
                        : "applications"}
                </span>

                {(search || filter !== "ALL") && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearch("");
                            setFilter("ALL");
                        }}
                    >
                        Clear filters
                    </button>
                )}
            </div>

            {/* EMPTY */}
            {filteredApplications.length === 0 && (
                <div className="sa-state">

                    <div className="sa-empty-icon">
                        <FileCheck2 size={26} />
                    </div>

                    <span className="eyebrow">
                        {applications.length === 0
                            ? "NO APPLICATIONS"
                            : "NO MATCHES"}
                    </span>

                    <h2>
                        {applications.length === 0
                            ? "Your application journey starts here"
                            : "No matching applications"}
                    </h2>

                    <p>
                        {applications.length === 0
                            ? "Apply to opportunities you're interested in and track every update from one place."
                            : "Try another search term or status filter."}
                    </p>

                    {applications.length === 0 && (
                        <Link
                            to="/student/jobs"
                            className="sa-primary-button"
                        >
                            <BriefcaseBusiness size={16} />
                            Explore opportunities
                            <ChevronRight size={16} />
                        </Link>
                    )}

                </div>
            )}

            {/* APPLICATION LIST */}
            {filteredApplications.length > 0 && (
                <div className="sa-list">

                    {filteredApplications.map(
                        (application) => {
                            const id = getId(application);
                            const jobId =
                                getJobId(application);
                            const status =
                                normalizeStatus(
                                    application.status
                                );

                            const canWithdraw = [
                                "APPLIED",
                                "UNDER_REVIEW",
                                "SHORTLISTED",
                            ].includes(status);

                            const isExpanded =
                                String(expandedId) ===
                                String(id);

                            const historyItems =
                                history[id] || [];

                            return (
                                <article
                                    className="sa-application"
                                    key={
                                        id ??
                                        `${getJobTitle(
                                            application
                                        )}-${getCompany(
                                            application
                                        )}`
                                    }
                                >

                                    {/* MAIN */}
                                    <div className="sa-application-main">

                                        <div className="sa-company-icon">
                                            {getCompany(
                                                application
                                            )
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="sa-application-info">

                                            <div className="sa-company-name">
                                                {getCompany(
                                                    application
                                                )}
                                            </div>

                                            <h2>
                                                {getJobTitle(
                                                    application
                                                )}
                                            </h2>

                                            <div className="sa-meta">
                                                <span>
                                                    Applied{" "}
                                                    {formatDate(
                                                        getAppliedDate(
                                                            application
                                                        )
                                                    )}
                                                </span>

                                                <span>
                                                    Application #
                                                    {id ?? "—"}
                                                </span>
                                            </div>

                                        </div>

                                        <div className="sa-status-area">

                                            <span
                                                className={`sa-status sa-status--${status.toLowerCase()}`}
                                            >
                                                <StatusIcon
                                                    status={
                                                        status
                                                    }
                                                />
                                                {formatStatus(
                                                    status
                                                )}
                                            </span>

                                            {jobId && (
                                                <Link
                                                    to={`/student/jobs/${jobId}`}
                                                    className="sa-job-link"
                                                >
                                                    View job
                                                    <ExternalLink
                                                        size={13}
                                                    />
                                                </Link>
                                            )}

                                        </div>

                                    </div>

                                    {/* PROGRESS */}
                                    <div className="sa-progress">

                                        {statusOrder.map(
                                            (
                                                step,
                                                index
                                            ) => {
                                                const currentIndex =
                                                    statusOrder.indexOf(
                                                        status
                                                    );

                                                const reached =
                                                    currentIndex >=
                                                    0 &&
                                                    index <=
                                                    currentIndex;

                                                const rejected =
                                                    status ===
                                                    "REJECTED" &&
                                                    index === 0;

                                                return (
                                                    <div
                                                        className={`sa-progress-step ${
                                                            reached
                                                                ? "completed"
                                                                : ""
                                                        } ${
                                                            rejected
                                                                ? "rejected"
                                                                : ""
                                                        }`}
                                                        key={
                                                            step
                                                        }
                                                    >
                                                        <div className="sa-progress-dot">
                                                            {reached && (
                                                                <Check
                                                                    size={
                                                                        11
                                                                    }
                                                                />
                                                            )}
                                                        </div>

                                                        <span>
                                                            {formatStatus(
                                                                step
                                                            )}
                                                        </span>

                                                        {index <
                                                            statusOrder.length -
                                                            1 && (
                                                                <div
                                                                    className={
                                                                        reached &&
                                                                        index <
                                                                        currentIndex
                                                                            ? "sa-progress-line completed"
                                                                            : "sa-progress-line"
                                                                    }
                                                                />
                                                            )}
                                                    </div>
                                                );
                                            }
                                        )}

                                    </div>

                                    {/* ACTIONS */}
                                    <div className="sa-application-actions">

                                        <button
                                            type="button"
                                            className="sa-history-button"
                                            onClick={() =>
                                                toggleHistory(
                                                    application
                                                )
                                            }
                                        >
                                            {isExpanded
                                                ? "Hide status history"
                                                : "View status history"}
                                            <ChevronDown
                                                size={15}
                                                className={
                                                    isExpanded
                                                        ? "sa-chevron-open"
                                                        : ""
                                                }
                                            />
                                        </button>

                                        {canWithdraw && (
                                            <button
                                                type="button"
                                                className="sa-withdraw-button"
                                                disabled={
                                                    withdrawingId !==
                                                    null
                                                }
                                                onClick={() =>
                                                    handleWithdraw(
                                                        application
                                                    )
                                                }
                                            >
                                                {withdrawingId ===
                                                id ? (
                                                    <>
                                                        <RefreshCw
                                                            size={
                                                                14
                                                            }
                                                            className="sa-spin"
                                                        />
                                                        Withdrawing...
                                                    </>
                                                ) : (
                                                    <>
                                                        Withdraw
                                                        application
                                                    </>
                                                )}
                                            </button>
                                        )}

                                    </div>

                                    {/* HISTORY */}
                                    {isExpanded && (
                                        <div className="sa-history">

                                            <div className="sa-history-heading">
                                                <div>
                                                    <strong>
                                                        Application
                                                        activity
                                                    </strong>
                                                    <span>
                                                        Latest updates
                                                        on this
                                                        application
                                                    </span>
                                                </div>
                                            </div>

                                            {historyLoadingId ===
                                            id ? (
                                                <div className="sa-history-loading">
                                                    <RefreshCw
                                                        size={16}
                                                        className="sa-spin"
                                                    />
                                                    Loading
                                                    history...
                                                </div>
                                            ) : historyItems.length ===
                                            0 ? (
                                                <div className="sa-history-empty">
                                                    No status history
                                                    available yet.
                                                </div>
                                            ) : (
                                                <div className="sa-history-list">
                                                    {historyItems.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => {
                                                            const itemStatus =
                                                                normalizeStatus(
                                                                    item?.status ??
                                                                    item?.toStatus ??
                                                                    item?.newStatus ??
                                                                    "UPDATED"
                                                                );

                                                            return (
                                                                <div
                                                                    className="sa-history-item"
                                                                    key={
                                                                        item?.id ??
                                                                        `${itemStatus}-${index}`
                                                                    }
                                                                >
                                                                    <div className="sa-history-dot">
                                                                        <Check
                                                                            size={
                                                                                11
                                                                            }
                                                                        />
                                                                    </div>

                                                                    <div className="sa-history-content">
                                                                        <strong>
                                                                            {formatStatus(
                                                                                itemStatus
                                                                            )}
                                                                        </strong>

                                                                        <span>
                                                                            {formatDateTime(
                                                                                item?.createdAt ??
                                                                                item?.updatedAt ??
                                                                                item?.timestamp ??
                                                                                item?.changedAt
                                                                            )}
                                                                        </span>

                                                                        {(item?.message ||
                                                                            item?.note ||
                                                                            item?.remarks) && (
                                                                            <p>
                                                                                {item.message ||
                                                                                    item.note ||
                                                                                    item.remarks}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            )}

                                        </div>
                                    )}

                                    {/* TERMINAL STATUS */}
                                    {isCompletedStatus(
                                        status
                                    ) && (
                                        <div
                                            className={`sa-terminal-note sa-terminal-note--${status.toLowerCase()}`}
                                        >
                                            <StatusIcon
                                                status={status}
                                            />

                                            <span>
                                                {status ===
                                                "SELECTED"
                                                    ? "Congratulations! You were selected for this opportunity."
                                                    : status ===
                                                    "REJECTED"
                                                        ? "This application is no longer active."
                                                        : "You withdrew this application."}
                                            </span>
                                        </div>
                                    )}

                                </article>
                            );
                        }
                    )}

                </div>
            )}

        </div>
    );
}