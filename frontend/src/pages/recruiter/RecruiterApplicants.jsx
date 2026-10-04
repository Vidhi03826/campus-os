
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    getApplicantsForJob,
    updateApplicationStatus,
} from "../../api/applicationApi";
import "../../styles/recruiter-applicants.css";

const STATUS_OPTIONS = {
    APPLIED: ["UNDER_REVIEW", "REJECTED"],
    UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
    SHORTLISTED: ["INTERVIEW", "REJECTED"],
    INTERVIEW: ["SELECTED", "REJECTED"],
    SELECTED: [],
    REJECTED: [],
    WITHDRAWN: [],
};

const STATUS_LABELS = {
    APPLIED: "Applied",
    UNDER_REVIEW: "Under review",
    SHORTLISTED: "Shortlisted",
    INTERVIEW: "Interview",
    SELECTED: "Selected",
    REJECTED: "Rejected",
    WITHDRAWN: "Withdrawn",
};

const getErrorMessage = (error) => {
    const data = error?.response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;
    if (typeof error?.message === "string") return error.message;

    return "Something went wrong. Please try again.";
};

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

const getInitials = (name) => {
    if (!name) return "A";

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
};

export default function RecruiterApplicants() {
    const { jobId } = useParams();

    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadApplicants = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const data = await getApplicantsForJob(jobId);
            const records = Array.isArray(data)
                ? data
                : data?.content ?? [];

            setApplicants(records);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [jobId]);

    useEffect(() => {
        loadApplicants();
    }, [loadApplicants]);

    const counts = useMemo(() => {
        const result = {
            total: applicants.length,
            APPLIED: 0,
            UNDER_REVIEW: 0,
            SHORTLISTED: 0,
            INTERVIEW: 0,
            SELECTED: 0,
            REJECTED: 0,
            WITHDRAWN: 0,
        };

        applicants.forEach((application) => {
            if (Object.hasOwn(result, application.status)) {
                result[application.status] += 1;
            }
        });

        return result;
    }, [applicants]);

    const filteredApplicants = useMemo(() => {
        const query = search.trim().toLowerCase();

        return applicants.filter((application) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                application.status === statusFilter;

            const searchableText = [
                application.id,
                application.jobTitle,
                application.companyName,
                application.applicantName,
                application.applicantEmail,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return matchesStatus &&
                (!query || searchableText.includes(query));
        });
    }, [applicants, search, statusFilter]);

    const handleStatusChange = async (application, nextStatus) => {
        if (!nextStatus || nextStatus === application.status) return;

        const confirmed = window.confirm(
            `Change application #${application.id} to ${
                STATUS_LABELS[nextStatus] ?? nextStatus
            }?`
        );

        if (!confirmed) return;

        setUpdatingId(application.id);
        setError("");
        setSuccess("");

        try {
            const updated = await updateApplicationStatus(
                application.id,
                nextStatus
            );

            setApplicants((current) =>
                current.map((item) =>
                    item.id === application.id
                        ? { ...item, ...updated }
                        : item
                )
            );

            setSuccess(
                `Application #${application.id} updated successfully.`
            );
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <main className="ra-page">
            <div className="ra-container">
                <div className="ra-breadcrumb">
                    <Link to="/recruiter/jobs">My jobs</Link>
                    <span>/</span>
                    <span>Applicants</span>
                </div>

                <header className="ra-header">
                    <div>
                        <div className="ra-eyebrow">
                            RECRUITMENT WORKSPACE
                        </div>
                        <h1>Applicants</h1>
                        <p>
                            Review applications, track progress, and
                            manage each candidate's application status.
                        </p>
                        <div className="ra-job-reference">
                            Job ID: <strong>#{jobId}</strong>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="ra-secondary-button"
                        onClick={() => loadApplicants(true)}
                        disabled={loading || refreshing}
                    >
                        {refreshing ? "Refreshing..." : "↻ Refresh"}
                    </button>
                </header>

                {error && (
                    <div className="ra-alert ra-alert-error" role="alert">
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => loadApplicants(true)}
                        >
                            Retry
                        </button>
                    </div>
                )}

                {success && (
                    <div className="ra-alert ra-alert-success" role="status">
                        <span>{success}</span>
                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="ra-stats-grid">
                    <article className="ra-stat-card ra-stat-primary">
                        <span className="ra-stat-label">Total applicants</span>
                        <strong>{counts.total}</strong>
                        <span className="ra-stat-footnote">
                            Applications received
                        </span>
                    </article>

                    <article className="ra-stat-card">
                        <span className="ra-stat-label">New applications</span>
                        <strong>{counts.APPLIED}</strong>
                        <span className="ra-stat-footnote">Awaiting review</span>
                    </article>

                    <article className="ra-stat-card">
                        <span className="ra-stat-label">In progress</span>
                        <strong>
                            {counts.UNDER_REVIEW +
                                counts.SHORTLISTED +
                                counts.INTERVIEW}
                        </strong>
                        <span className="ra-stat-footnote">
                            Review to interview
                        </span>
                    </article>

                    <article className="ra-stat-card">
                        <span className="ra-stat-label">Selected</span>
                        <strong>{counts.SELECTED}</strong>
                        <span className="ra-stat-footnote">
                            Successful candidates
                        </span>
                    </article>
                </section>

                <section className="ra-panel">
                    <div className="ra-panel-header">
                        <div>
                            <h2>Application pipeline</h2>
                            <p>
                                Search applications and update their progress.
                            </p>
                        </div>
                        <span className="ra-result-count">
                            {filteredApplicants.length} result
                            {filteredApplicants.length !== 1 ? "s" : ""}
                        </span>
                    </div>

                    <div className="ra-toolbar">
                        <label className="ra-search">
                            <span aria-hidden="true">⌕</span>
                            <input
                                type="search"
                                placeholder="Search by applicant, email, or ID..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                            />
                        </label>

                        <select
                            className="ra-status-filter"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            aria-label="Filter applications by status"
                        >
                            <option value="ALL">All statuses</option>
                            {Object.entries(STATUS_LABELS).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    {loading ? (
                        <div className="ra-state">
                            <div className="ra-spinner" />
                            <h3>Loading applicants</h3>
                            <p>Fetching the latest applications...</p>
                        </div>
                    ) : error && applicants.length === 0 ? (
                        <div className="ra-state">
                            <div className="ra-state-icon">!</div>
                            <h3>Could not load applicants</h3>
                            <p>Check your connection and try again.</p>
                            <button
                                type="button"
                                className="ra-primary-button"
                                onClick={() => loadApplicants()}
                            >
                                Try again
                            </button>
                        </div>
                    ) : filteredApplicants.length === 0 ? (
                        <div className="ra-state">
                            <div className="ra-state-icon">↗</div>
                            <h3>
                                {applicants.length === 0
                                    ? "No applications yet"
                                    : "No matching applications"}
                            </h3>
                            <p>
                                {applicants.length === 0
                                    ? "Applications for this job will appear here when students apply."
                                    : "Try a different search term or status filter."}
                            </p>
                            {(search || statusFilter !== "ALL") && (
                                <button
                                    type="button"
                                    className="ra-secondary-button"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("ALL");
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="ra-table-wrap">
                                <table className="ra-table">
                                    <thead>
                                    <tr>
                                        <th>Applicant</th>
                                        <th>Application</th>
                                        <th>Applied on</th>
                                        <th>Status</th>
                                        <th>Update status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredApplicants.map((application) => {
                                        const status =
                                            application.status ?? "APPLIED";
                                        const nextStatuses =
                                            STATUS_OPTIONS[status] ?? [];

                                        const applicantName =
                                            application.applicantName ||
                                            `Applicant #${application.id}`;

                                        return (
                                            <tr key={application.id}>
                                                <td>
                                                    <div className="ra-applicant-cell">
                                                        <div className="ra-avatar">
                                                            {getInitials(
                                                                application.applicantName
                                                            )}
                                                        </div>
                                                        <div className="ra-applicant-info">
                                                            <strong>
                                                                {applicantName}
                                                            </strong>
                                                            <span>
                                                                    {application.applicantEmail ||
                                                                        "Candidate profile details unavailable"}
                                                                </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                        <span className="ra-id">
                                                            #{application.id}
                                                        </span>
                                                </td>
                                                <td>
                                                    {formatDate(
                                                        application.appliedAt
                                                    )}
                                                </td>
                                                <td>
                                                        <span
                                                            className={`ra-status-badge ra-status-${status.toLowerCase()}`}
                                                        >
                                                            {STATUS_LABELS[status] ??
                                                                status.replaceAll(
                                                                    "_",
                                                                    " "
                                                                )}
                                                        </span>
                                                </td>
                                                <td>
                                                    {nextStatuses.length > 0 ? (
                                                        <select
                                                            className="ra-action-select"
                                                            value=""
                                                            disabled={
                                                                updatingId ===
                                                                application.id
                                                            }
                                                            onChange={(event) =>
                                                                handleStatusChange(
                                                                    application,
                                                                    event.target.value
                                                                )
                                                            }
                                                            aria-label={`Update status for application ${application.id}`}
                                                        >
                                                            <option value="">
                                                                {updatingId ===
                                                                application.id
                                                                    ? "Updating..."
                                                                    : "Change status"}
                                                            </option>
                                                            {nextStatuses.map(
                                                                (nextStatus) => (
                                                                    <option
                                                                        key={nextStatus}
                                                                        value={nextStatus}
                                                                    >
                                                                        {STATUS_LABELS[
                                                                            nextStatus
                                                                            ]}
                                                                    </option>
                                                                )
                                                            )}
                                                        </select>
                                                    ) : (
                                                        <span className="ra-terminal-label">
                                                                No further actions
                                                            </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ra-mobile-list">
                                {filteredApplicants.map((application) => {
                                    const status =
                                        application.status ?? "APPLIED";
                                    const nextStatuses =
                                        STATUS_OPTIONS[status] ?? [];

                                    return (
                                        <article
                                            className="ra-mobile-card"
                                            key={application.id}
                                        >
                                            <div className="ra-mobile-card-top">
                                                <div className="ra-applicant-cell">
                                                    <div className="ra-avatar">
                                                        {getInitials(
                                                            application.applicantName
                                                        )}
                                                    </div>
                                                    <div className="ra-applicant-info">
                                                        <strong>
                                                            {application.applicantName ||
                                                                `Applicant #${application.id}`}
                                                        </strong>
                                                        <span>
                                                            {application.applicantEmail ||
                                                                `Application #${application.id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span
                                                    className={`ra-status-badge ra-status-${status.toLowerCase()}`}
                                                >
                                                    {STATUS_LABELS[status] ??
                                                        status}
                                                </span>
                                            </div>

                                            <div className="ra-mobile-meta">
                                                <span>Applied</span>
                                                <strong>
                                                    {formatDate(
                                                        application.appliedAt
                                                    )}
                                                </strong>
                                            </div>

                                            {nextStatuses.length > 0 && (
                                                <select
                                                    className="ra-action-select ra-mobile-action"
                                                    value=""
                                                    disabled={
                                                        updatingId ===
                                                        application.id
                                                    }
                                                    onChange={(event) =>
                                                        handleStatusChange(
                                                            application,
                                                            event.target.value
                                                        )
                                                    }
                                                    aria-label={`Update status for application ${application.id}`}
                                                >
                                                    <option value="">
                                                        Change status
                                                    </option>
                                                    {nextStatuses.map(
                                                        (nextStatus) => (
                                                            <option
                                                                key={nextStatus}
                                                                value={nextStatus}
                                                            >
                                                                {STATUS_LABELS[
                                                                    nextStatus
                                                                    ]}
                                                            </option>
                                                        )
                                                    )}
                                                </select>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </section>

                <footer className="ra-footer">
                    <span>
                        CampusOS · Recruiter workspace
                    </span>
                    <Link to="/recruiter/jobs">← Back to my jobs</Link>
                </footer>
            </div>
        </main>
    );
}
