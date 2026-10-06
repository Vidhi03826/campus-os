import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Mail,
    RefreshCw,
    Search,
    UserRound,
    Users,
    XCircle,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
    getApplicantsForJob,
    updateApplicationStatus,
} from "../../api/applicationApi";
import "../../styles/recruiter.css";

const STATUS_OPTIONS = [
    "ALL",
    "APPLIED",
    "UNDER_REVIEW",
    "SHORTLISTED",
    "INTERVIEW",
    "SELECTED",
    "REJECTED",
    "WITHDRAWN",
];

const STATUS_FLOW = {
    APPLIED: ["UNDER_REVIEW", "REJECTED"],
    UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
    SHORTLISTED: ["INTERVIEW", "REJECTED"],
    INTERVIEW: ["SELECTED", "REJECTED"],
};

const statusLabel = (status) =>
    String(status || "")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const statusClass = (status) => {
    switch (status) {
        case "APPLIED":
            return "status-applied";
        case "UNDER_REVIEW":
            return "status-review";
        case "SHORTLISTED":
            return "status-shortlisted";
        case "INTERVIEW":
            return "status-interview";
        case "SELECTED":
            return "status-selected";
        case "REJECTED":
            return "status-rejected";
        case "WITHDRAWN":
            return "status-withdrawn";
        default:
            return "";
    }
};

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

const extractApplicants = (data) => {
    if (Array.isArray(data)) return data;

    return (
        data?.content ??
        data?.items ??
        data?.applications ??
        data?.data ??
        []
    );
};

export default function RecruiterApplicants() {
    const { jobId } = useParams();
    const { success: showSuccess, error: showError } = useToast();
    const [applicants, setApplicants] = useState([]);
    const [jobTitle, setJobTitle] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadApplicants = useCallback(
        async (showRefresh = false) => {
            if (!jobId) return;

            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const data = await getApplicantsForJob(jobId);
                const list = extractApplicants(data);

                setApplicants(list);

                if (data?.jobTitle) {
                    setJobTitle(data.jobTitle);
                } else if (list.length > 0) {
                    setJobTitle(
                        list[0]?.jobTitle ||
                        list[0]?.job?.title ||
                        ""
                    );
                }
            } catch (err) {
                console.error("Failed to load applicants:", err);

                setError(
                    err?.response?.data?.message ||
                    err?.response?.data?.detail ||
                    "Unable to load applicants right now."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [jobId]
    );

    useEffect(() => {
        loadApplicants();
    }, [loadApplicants]);

    const counts = useMemo(() => {
        const result = {
            ALL: applicants.length,
            APPLIED: 0,
            UNDER_REVIEW: 0,
            SHORTLISTED: 0,
            INTERVIEW: 0,
            SELECTED: 0,
            REJECTED: 0,
            WITHDRAWN: 0,
        };

        applicants.forEach((applicant) => {
            const status = applicant?.status;

            if (status && result[status] !== undefined) {
                result[status]++;
            }
        });

        return result;
    }, [applicants]);

    const filteredApplicants = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return applicants.filter((applicant) => {
            const matchesStatus =
                selectedStatus === "ALL" ||
                applicant?.status === selectedStatus;

            if (!matchesStatus) return false;

            if (!query) return true;

            const searchableText = [
                applicant?.studentName,
                applicant?.studentEmail,
                applicant?.name,
                applicant?.email,
                applicant?.student?.name,
                applicant?.student?.email,
                applicant?.jobTitle,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [applicants, searchTerm, selectedStatus]);

    const handleStatusChange = async (applicationId, nextStatus) => {
        if (!applicationId || !nextStatus) return;

        const applicant = applicants.find((item) => {
            const itemId = item?.applicationId ?? item?.id;
            return String(itemId) === String(applicationId);
        });

        if (!applicant) return;

        const currentStatus = String(
            applicant?.status || "APPLIED"
        ).toUpperCase();

        if (
            nextStatus === currentStatus ||
            !(STATUS_FLOW[currentStatus] ?? []).includes(nextStatus)
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Move this application from ${statusLabel(
                currentStatus
            )} to ${statusLabel(nextStatus)}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingId(applicationId);
            setError("");
            setSuccess("");

            const updated = await updateApplicationStatus(
                applicationId,
                nextStatus
            );

            setApplicants((current) =>
                current.map((item) => {
                    const itemId =
                        item?.applicationId ?? item?.id;

                    return String(itemId) === String(applicationId)
                        ? {
                            ...item,
                            ...(updated || {}),
                            status:
                                updated?.status ||
                                nextStatus,
                        }
                        : item;
                })
            );

            setSelectedApplicant((current) => {
                if (!current) return current;

                const currentId =
                    current?.applicationId ?? current?.id;

                return String(currentId) === String(applicationId)
                    ? {
                        ...current,
                        ...(updated || {}),
                        status:
                            updated?.status ||
                            nextStatus,
                    }
                    : current;
            });

            const message = `Application moved to ${statusLabel(
                nextStatus
            )}.`;

            setSuccess(message);

            showSuccess(
                "Application status updated successfully.",
                "Status updated"
            );
        } catch (err) {
            console.error(
                "Failed to update application:",
                err
            );

            const message =
                err?.response?.data?.message ||
                err?.response?.data?.detail ||
                "Unable to update application status.";

            setError(message);
            showError(message);
        } finally {
            setUpdatingId(null);
        }
    };
    const getApplicantName = (applicant) =>
        applicant?.studentName ||
        applicant?.name ||
        applicant?.student?.name ||
        "Unnamed applicant";

    const getApplicantEmail = (applicant) =>
        applicant?.studentEmail ||
        applicant?.email ||
        applicant?.student?.email ||
        "No email available";

    const getApplicationId = (applicant) =>
        applicant?.applicationId ||
        applicant?.id;

    return (
        <div className="recruiter-page">
            <div className="recruiter-container">
                {/* HEADER */}
                <div className="ra-header">
                    <div>
                        <Link
                            to="/recruiter/jobs"
                            className="ra-back-link"
                        >
                            <ArrowLeft size={16} />
                            Back to jobs
                        </Link>

                        <div className="ra-title-row">
                            <div className="ra-title-icon">
                                <Users size={24} />
                            </div>

                            <div>
                                <h1>
                                    {jobTitle
                                        ? `${jobTitle} — Applicants`
                                        : "Applicants"}
                                </h1>

                                <p>
                                    Review candidates, manage
                                    applications and move
                                    shortlisted talent through
                                    your hiring pipeline.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="recruiter-secondary-button"
                        onClick={() => loadApplicants(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "ra-spin"
                                    : ""
                            }
                        />
                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                {/* ALERTS */}
                {error && (
                    <div className="recruiter-alert recruiter-alert-error">
                        <XCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="recruiter-alert recruiter-alert-success">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {/* PIPELINE STATS */}
                {!loading && (
                    <div className="ra-pipeline">
                        <div className="ra-pipeline-card ra-pipeline-total">
                            <div className="ra-pipeline-icon">
                                <Users size={18} />
                            </div>
                            <div>
                                <span>Total applicants</span>
                                <strong>{counts.ALL}</strong>
                            </div>
                        </div>

                        <div className="ra-pipeline-card">
                            <div className="ra-pipeline-icon">
                                <Clock3 size={18} />
                            </div>
                            <div>
                                <span>Under review</span>
                                <strong>
                                    {counts.UNDER_REVIEW}
                                </strong>
                            </div>
                        </div>

                        <div className="ra-pipeline-card">
                            <div className="ra-pipeline-icon">
                                <BriefcaseBusiness size={18} />
                            </div>
                            <div>
                                <span>Shortlisted</span>
                                <strong>
                                    {counts.SHORTLISTED}
                                </strong>
                            </div>
                        </div>

                        <div className="ra-pipeline-card">
                            <div className="ra-pipeline-icon">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <span>Selected</span>
                                <strong>
                                    {counts.SELECTED}
                                </strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* FILTER TOOLBAR */}
                <section className="ra-toolbar">
                    <div className="ra-search">
                        <Search size={18} />
                        <input
                            type="search"
                            placeholder="Search by candidate name or email..."
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="ra-filter-scroll">
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`ra-filter ${
                                    selectedStatus === status
                                        ? "active"
                                        : ""
                                }`}
                                onClick={() =>
                                    setSelectedStatus(status)
                                }
                            >
                                {status === "ALL"
                                    ? "All"
                                    : statusLabel(status)}

                                <span>
                                    {counts[status] ?? 0}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* RESULTS */}
                <section className="ra-content">
                    <div className="ra-results-header">
                        <div>
                            <h2>Candidate pipeline</h2>
                            <p>
                                Showing{" "}
                                <strong>
                                    {filteredApplicants.length}
                                </strong>{" "}
                                of{" "}
                                <strong>
                                    {applicants.length}
                                </strong>{" "}
                                applications
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="ra-list">
                            {[1, 2, 3, 4].map((item) => (
                                <div
                                    key={item}
                                    className="ra-card ra-skeleton-card"
                                >
                                    <div className="ra-skeleton ra-avatar-skeleton" />
                                    <div className="ra-skeleton-content">
                                        <div className="ra-skeleton ra-line-lg" />
                                        <div className="ra-skeleton ra-line-md" />
                                        <div className="ra-skeleton ra-line-sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredApplicants.length === 0 ? (
                        <div className="ra-empty">
                            <div className="ra-empty-icon">
                                <Users size={28} />
                            </div>

                            <h3>
                                {applicants.length === 0
                                    ? "No applicants yet"
                                    : "No matching applicants"}
                            </h3>

                            <p>
                                {applicants.length === 0
                                    ? "Applications for this role will appear here once students apply."
                                    : "Try changing your search or status filter."}
                            </p>

                            {(searchTerm ||
                                selectedStatus !== "ALL") && (
                                <button
                                    type="button"
                                    className="recruiter-secondary-button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedStatus(
                                            "ALL"
                                        );
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="ra-list">
                            {filteredApplicants.map(
                                (applicant) => {
                                    const applicationId =
                                        getApplicationId(
                                            applicant
                                        );
                                    const name =
                                        getApplicantName(
                                            applicant
                                        );
                                    const email =
                                        getApplicantEmail(
                                            applicant
                                        );
                                    const status =
                                        applicant?.status;

                                    const availableTransitions =
                                        STATUS_FLOW[
                                            status
                                            ] || [];

                                    const initials = name
                                        .split(" ")
                                        .filter(Boolean)
                                        .slice(0, 2)
                                        .map((part) =>
                                            part[0]?.toUpperCase()
                                        )
                                        .join("");

                                    return (
                                        <article
                                            key={
                                                applicationId ||
                                                `${email}-${name}`
                                            }
                                            className={`ra-card ${
                                                selectedApplicant?.applicationId ===
                                                applicationId
                                                    ? "selected"
                                                    : ""
                                            }`}
                                        >
                                            <div className="ra-card-main">
                                                <div className="ra-avatar">
                                                    {initials ||
                                                        "?"}
                                                </div>

                                                <div className="ra-applicant-info">
                                                    <div className="ra-name-row">
                                                        <h3>
                                                            {
                                                                name
                                                            }
                                                        </h3>

                                                        <span
                                                            className={`ra-status ${statusClass(
                                                                status
                                                            )}`}
                                                        >
                                                            {statusLabel(
                                                                status
                                                            )}
                                                        </span>
                                                    </div>

                                                    <a
                                                        href={`mailto:${email}`}
                                                        className="ra-email"
                                                    >
                                                        <Mail
                                                            size={
                                                                15
                                                            }
                                                        />
                                                        {email}
                                                    </a>

                                                    <div className="ra-meta">
                                                        <span>
                                                            Applied{" "}
                                                            {formatDate(
                                                                applicant?.appliedAt
                                                            )}
                                                        </span>

                                                        {applicant?.updatedAt && (
                                                            <span>
                                                                Updated{" "}
                                                                {formatDate(
                                                                    applicant.updatedAt
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className="ra-view-button"
                                                    onClick={() =>
                                                        setSelectedApplicant(
                                                            applicant
                                                        )
                                                    }
                                                >
                                                    View
                                                </button>
                                            </div>

                                            {availableTransitions.length >
                                                0 && (
                                                    <div className="ra-card-footer">
                                                        <div className="ra-action-label">
                                                            Move application
                                                        </div>

                                                        <div className="ra-status-actions">
                                                            {availableTransitions.map(
                                                                (
                                                                    nextStatus
                                                                ) => (
                                                                    <button
                                                                        key={
                                                                            nextStatus
                                                                        }
                                                                        type="button"
                                                                        className={`ra-action-button ${statusClass(
                                                                            nextStatus
                                                                        )}`}
                                                                        disabled={
                                                                            updatingId ===
                                                                            applicationId
                                                                        }
                                                                        onClick={() =>
                                                                            handleStatusChange(
                                                                                applicationId,
                                                                                nextStatus
                                                                            )
                                                                        }
                                                                    >
                                                                        {updatingId ===
                                                                        applicationId
                                                                            ? "Updating..."
                                                                            : statusLabel(
                                                                                nextStatus
                                                                            )}

                                                                        <ChevronDown
                                                                            size={
                                                                                14
                                                                            }
                                                                        />
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                        </article>
                                    );
                                }
                            )}
                        </div>
                    )}
                </section>

                {/* DETAIL DRAWER */}
                {selectedApplicant && (
                    <div
                        className="ra-drawer-backdrop"
                        onClick={() =>
                            setSelectedApplicant(null)
                        }
                    >
                        <aside
                            className="ra-drawer"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >
                            <div className="ra-drawer-header">
                                <div>
                                    <span>
                                        Candidate profile
                                    </span>
                                    <h2>
                                        {getApplicantName(
                                            selectedApplicant
                                        )}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    className="ra-drawer-close"
                                    onClick={() =>
                                        setSelectedApplicant(
                                            null
                                        )
                                    }
                                >
                                    <XCircle size={21} />
                                </button>
                            </div>

                            <div className="ra-drawer-body">
                                <div className="ra-profile-hero">
                                    <div className="ra-avatar ra-avatar-large">
                                        {getApplicantName(
                                            selectedApplicant
                                        )
                                            .split(" ")
                                            .filter(Boolean)
                                            .slice(0, 2)
                                            .map((part) =>
                                                part[0]?.toUpperCase()
                                            )
                                            .join("")}
                                    </div>

                                    <div>
                                        <h3>
                                            {getApplicantName(
                                                selectedApplicant
                                            )}
                                        </h3>

                                        <a
                                            href={`mailto:${getApplicantEmail(
                                                selectedApplicant
                                            )}`}
                                        >
                                            {getApplicantEmail(
                                                selectedApplicant
                                            )}
                                        </a>
                                    </div>
                                </div>

                                <div className="ra-detail-section">
                                    <span className="ra-detail-label">
                                        Application status
                                    </span>

                                    <div
                                        className={`ra-status large ${statusClass(
                                            selectedApplicant.status
                                        )}`}
                                    >
                                        {statusLabel(
                                            selectedApplicant.status
                                        )}
                                    </div>
                                </div>

                                <div className="ra-detail-grid">
                                    <div>
                                        <span>
                                            Application ID
                                        </span>
                                        <strong>
                                            #
                                            {getApplicationId(
                                                selectedApplicant
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Applied on
                                        </span>
                                        <strong>
                                            {formatDate(
                                                selectedApplicant.appliedAt
                                            )}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Job</span>
                                        <strong>
                                            {selectedApplicant.jobTitle ||
                                                jobTitle ||
                                                "—"}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>Company</span>
                                        <strong>
                                            {selectedApplicant.companyName ||
                                                "Your company"}
                                        </strong>
                                    </div>
                                </div>

                                <div className="ra-drawer-actions">
                                    <a
                                        href={`mailto:${getApplicantEmail(
                                            selectedApplicant
                                        )}`}
                                        className="recruiter-primary-button"
                                    >
                                        <Mail size={16} />
                                        Contact candidate
                                    </a>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}