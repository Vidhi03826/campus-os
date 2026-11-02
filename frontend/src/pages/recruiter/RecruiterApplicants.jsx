import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    Download,
    FileText,
    GraduationCap,
    Mail,
    RefreshCw,
    Search,
    Users,
    XCircle,
} from "lucide-react";

import { useToast } from "../../context/ToastContext";
import {
    downloadCandidateResume,
    getApplicantsForJob,
    getCandidateProfile,
    updateApplicationStatus,
} from "../../api/applicationApi";

import "../../styles/recruiter.css";
import "../../styles/recruiter-applicants.css";
import "../../styles/recruiter-candidate-review.css";

// Open Gmail's browser-based compose window so Contact Candidate works even
// when the computer has no default mail app configured.
const gmailComposeUrl = (email, subject = "", body = "") => {
    const params = new URLSearchParams({ view: "cm", fs: "1", to: email });
    if (subject) params.set("su", subject);
    if (body) params.set("body", body);
    return `https://mail.google.com/mail/?${params.toString()}`;
};

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
    SELECTED: [],
    REJECTED: [],
    WITHDRAWN: [],
};

const statusLabel = (status) =>
    String(status || "")
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

const statusClass = (status) => {
    switch (String(status || "").toUpperCase()) {
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
    if (Number.isNaN(date.getTime())) return "—";

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

const getApplicationId = (application) =>
    application?.applicationId ?? application?.id ?? null;

const getApplicantName = (application) =>
    application?.studentName ??
    application?.applicantName ??
    application?.name ??
    application?.student?.name ??
    "Unnamed applicant";

const getApplicantEmail = (application) =>
    application?.studentEmail ??
    application?.applicantEmail ??
    application?.email ??
    application?.student?.email ??
    "";

const getInitials = (name = "") =>
    name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

const getErrorMessage = (error, fallback) =>
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback;

export default function RecruiterApplicants() {
    const { jobId } = useParams();
    const { success: showSuccess, error: showError } = useToast();

    const [applicants, setApplicants] = useState([]);
    const [jobTitle, setJobTitle] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedApplicant, setSelectedApplicant] = useState(null);

    const [candidateProfile, setCandidateProfile] = useState(null);
    const [candidateProfileLoading, setCandidateProfileLoading] = useState(false);
    const [candidateProfileError, setCandidateProfileError] = useState("");
    const [resumeDownloading, setResumeDownloading] = useState(false);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [updatingId, setUpdatingId] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadApplicants = useCallback(
        async (showRefresh = false) => {
            if (!jobId) {
                setLoading(false);
                setError("Job ID is missing from this page URL.");
                return;
            }

            try {
                if (showRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");
                setSuccess("");

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
                    getErrorMessage(
                        err,
                        "Unable to load applicants right now."
                    )
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
            const status = String(applicant?.status || "").toUpperCase();
            if (Object.prototype.hasOwnProperty.call(result, status)) {
                result[status] += 1;
            }
        });

        return result;
    }, [applicants]);

    const filteredApplicants = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return applicants.filter((applicant) => {
            const status = String(applicant?.status || "").toUpperCase();
            const matchesStatus =
                selectedStatus === "ALL" || status === selectedStatus;

            if (!matchesStatus) return false;
            if (!query) return true;

            const searchableText = [
                getApplicantName(applicant),
                getApplicantEmail(applicant),
                applicant?.jobTitle,
                applicant?.companyName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(query);
        });
    }, [applicants, searchTerm, selectedStatus]);

    const handleStatusChange = async (applicationId, nextStatus) => {
        if (!applicationId || !nextStatus) return;

        const applicant = applicants.find(
            (item) =>
                String(getApplicationId(item)) === String(applicationId)
        );

        if (!applicant) return;

        const currentStatus = String(applicant.status || "APPLIED").toUpperCase();

        if (
            nextStatus === currentStatus ||
            !(STATUS_FLOW[currentStatus] || []).includes(nextStatus)
        ) {
            return;
        }

        const confirmed = window.confirm(
            `Move this application from ${statusLabel(currentStatus)} to ${statusLabel(nextStatus)}?`
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

            const finalStatus = updated?.status || nextStatus;

            setApplicants((current) =>
                current.map((item) =>
                    String(getApplicationId(item)) === String(applicationId)
                        ? { ...item, ...(updated || {}), status: finalStatus }
                        : item
                )
            );

            setSelectedApplicant((current) => {
                if (
                    !current ||
                    String(getApplicationId(current)) !== String(applicationId)
                ) {
                    return current;
                }

                return { ...current, ...(updated || {}), status: finalStatus };
            });

            const message = `Application moved to ${statusLabel(finalStatus)}.`;
            setSuccess(message);
            showSuccess(message, "Status updated");
        } catch (err) {
            console.error("Failed to update application:", err);
            const message = getErrorMessage(
                err,
                "Unable to update application status."
            );
            setError(message);
            showError(message);
        } finally {
            setUpdatingId(null);
        }
    };

    const selectedApplicationId = selectedApplicant
        ? getApplicationId(selectedApplicant)
        : null;

    useEffect(() => {
        let cancelled = false;

        if (!selectedApplicationId) {
            setCandidateProfile(null);
            setCandidateProfileError("");
            setCandidateProfileLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setCandidateProfile(null);
        setCandidateProfileError("");
        setCandidateProfileLoading(true);

        getCandidateProfile(selectedApplicationId)
            .then((data) => {
                if (!cancelled) setCandidateProfile(data);
            })
            .catch((err) => {
                if (!cancelled) {
                    setCandidateProfileError(
                        getErrorMessage(
                            err,
                            "Unable to load this candidate's profile."
                        )
                    );
                }
            })
            .finally(() => {
                if (!cancelled) setCandidateProfileLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [selectedApplicationId]);

    const handleDownloadCandidateResume = async () => {
        if (!selectedApplicationId) return;

        try {
            setResumeDownloading(true);

            const response = await downloadCandidateResume(
                selectedApplicationId
            );

            const blob = response.data;
            const disposition =
                response.headers?.["content-disposition"] || "";
            const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
            const fallbackName = `${getApplicantName(selectedApplicant)
                .replace(/[^\w.-]+/g, "_")}_resume.pdf`;
            const filename = filenameMatch?.[1] || fallbackName;

            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");

            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        } catch (err) {
            console.error("Candidate resume download failed:", err);
            showError(
                err?.response?.status === 404
                    ? "This candidate has not uploaded a resume."
                    : getErrorMessage(
                        err,
                        "Unable to download the candidate's resume."
                    )
            );
        } finally {
            setResumeDownloading(false);
        }
    };

    const openDecisionEmail = (outcome) => {
        if (!selectedApplicant) return;

        const email = getApplicantEmail(selectedApplicant);
        if (!email) {
            showError("This candidate does not have an email address.");
            return;
        }

        const name = getApplicantName(selectedApplicant);
        const title =
            selectedApplicant.jobTitle ||
            selectedApplicant.job?.title ||
            jobTitle ||
            "the advertised role";
        const company =
            selectedApplicant.companyName ||
            selectedApplicant.job?.companyName ||
            "the recruitment team";
        const isSelected = outcome === "SELECTED";

        const subject = isSelected
            ? `Round 1 Result: Selected - ${title}`
            : `Round 1 Result: Not Selected - ${title}`;

        const body = isSelected
            ? `Hi ${name},

Thank you for applying for ${title} at ${company}.

We are pleased to inform you that you have been selected in Round 1 of our recruitment process.

We will share the details of the next round with you shortly.

Congratulations, and thank you for your interest.

Regards,
${company} Recruitment Team`
            : `Hi ${name},

Thank you for applying for ${title} at ${company} and for the time you invested in our recruitment process.

After reviewing your application, we regret to inform you that you have not been selected to proceed beyond Round 1.

We appreciate your interest and wish you the very best in your future endeavors.

Regards,
${company} Recruitment Team`;

        const composeUrl = gmailComposeUrl(email, subject, body);
        window.open(composeUrl, "_blank", "noopener,noreferrer");
    };

    const closeCandidateDrawer = () => {
        setSelectedApplicant(null);
        setCandidateProfile(null);
        setCandidateProfileError("");
    };

    return (
        <div className="recruiter-page">
            <div className="recruiter-container">
                <header className="ra-header">
                    <div>
                        <Link to="/recruiter/jobs" className="ra-back-link">
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
                                    Review candidate profiles, assess resumes,
                                    and move applicants through your hiring pipeline.
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
                            className={refreshing ? "ra-spin" : ""}
                        />
                        {refreshing ? "Refreshing..." : "Refresh"}
                    </button>
                </header>

                {error && (
                    <div className="recruiter-alert recruiter-alert-error" role="alert">
                        <XCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="recruiter-alert recruiter-alert-success" role="status">
                        <CheckCircle2 size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {!loading && (
                    <section className="ra-pipeline" aria-label="Applicant statistics">
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
                                <strong>{counts.UNDER_REVIEW}</strong>
                            </div>
                        </div>

                        <div className="ra-pipeline-card">
                            <div className="ra-pipeline-icon">
                                <BriefcaseBusiness size={18} />
                            </div>
                            <div>
                                <span>Shortlisted</span>
                                <strong>{counts.SHORTLISTED}</strong>
                            </div>
                        </div>

                        <div className="ra-pipeline-card">
                            <div className="ra-pipeline-icon">
                                <CheckCircle2 size={18} />
                            </div>
                            <div>
                                <span>Selected</span>
                                <strong>{counts.SELECTED}</strong>
                            </div>
                        </div>
                    </section>
                )}

                <section className="ra-toolbar" aria-label="Applicant filters">
                    <div className="ra-search">
                        <Search size={18} />
                        <input
                            type="search"
                            aria-label="Search candidates"
                            placeholder="Search by candidate name or email..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <div className="ra-filter-scroll">
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`ra-filter ${selectedStatus === status ? "active" : ""}`}
                                aria-pressed={selectedStatus === status}
                                onClick={() => setSelectedStatus(status)}
                            >
                                {status === "ALL" ? "All" : statusLabel(status)}
                                <span>{counts[status] ?? 0}</span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="ra-content">
                    <div className="ra-results-header">
                        <div>
                            <h2>Candidate pipeline</h2>
                            <p>
                                Showing <strong>{filteredApplicants.length}</strong> of{" "}
                                <strong>{applicants.length}</strong> applications
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="ra-list" aria-label="Loading applicants">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="ra-card ra-skeleton-card">
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
                                    ? "Applications for this role will appear here when students apply."
                                    : "Try changing your search term or status filter."}
                            </p>

                            {(searchTerm || selectedStatus !== "ALL") && (
                                <button
                                    type="button"
                                    className="recruiter-secondary-button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSelectedStatus("ALL");
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="ra-list">
                            {filteredApplicants.map((applicant) => {
                                const applicationId = getApplicationId(applicant);
                                const name = getApplicantName(applicant);
                                const email = getApplicantEmail(applicant);
                                const status = String(applicant?.status || "APPLIED").toUpperCase();
                                const availableTransitions = STATUS_FLOW[status] || [];

                                return (
                                    <article
                                        key={applicationId ?? `${email}-${name}`}
                                        className={`ra-card ${
                                            String(getApplicationId(selectedApplicant)) === String(applicationId) &&
                                            selectedApplicant
                                                ? "selected"
                                                : ""
                                        }`}
                                    >
                                        <div className="ra-card-main">
                                            <div className="ra-avatar">{getInitials(name)}</div>

                                            <div className="ra-applicant-info">
                                                <div className="ra-name-row">
                                                    <h3>{name}</h3>
                                                    <span className={`ra-status ${statusClass(status)}`}>
                                                        {statusLabel(status)}
                                                    </span>
                                                </div>

                                                {email ? (
                                                    <a href={gmailComposeUrl(email)} target="_blank" rel="noreferrer" className="ra-email">
                                                        <Mail size={15} />
                                                        {email}
                                                    </a>
                                                ) : (
                                                    <span className="ra-email">No email available</span>
                                                )}

                                                <div className="ra-meta">
                                                    <span>
                                                        Applied {formatDate(applicant?.appliedAt)}
                                                    </span>
                                                    {applicant?.updatedAt && (
                                                        <span>
                                                            Updated {formatDate(applicant.updatedAt)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="ra-view-button"
                                                onClick={() => setSelectedApplicant(applicant)}
                                                aria-label={`View ${name}'s candidate profile`}
                                            >
                                                View profile
                                            </button>
                                        </div>

                                        {availableTransitions.length > 0 && (
                                            <div className="ra-card-footer">
                                                <div className="ra-action-label">
                                                    Move application
                                                </div>
                                                <div className="ra-status-actions">
                                                    {availableTransitions.map((nextStatus) => (
                                                        <button
                                                            key={nextStatus}
                                                            type="button"
                                                            className={`ra-action-button ${statusClass(nextStatus)}`}
                                                            disabled={updatingId === applicationId}
                                                            onClick={() =>
                                                                handleStatusChange(applicationId, nextStatus)
                                                            }
                                                        >
                                                            {updatingId === applicationId
                                                                ? "Updating..."
                                                                : statusLabel(nextStatus)}
                                                            <ChevronDown size={14} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>

                {selectedApplicant && (
                    <div
                        className="ra-drawer-backdrop"
                        onClick={closeCandidateDrawer}
                        role="presentation"
                    >
                        <aside
                            className="ra-drawer"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="ra-candidate-drawer-title"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="ra-drawer-header">
                                <div>
                                    <span>Candidate review</span>
                                    <h2 id="ra-candidate-drawer-title">
                                        {getApplicantName(selectedApplicant)}
                                    </h2>
                                </div>
                                <button
                                    type="button"
                                    className="ra-drawer-close"
                                    onClick={closeCandidateDrawer}
                                    aria-label="Close candidate profile"
                                >
                                    <XCircle size={21} />
                                </button>
                            </div>

                            <div className="ra-drawer-body">
                                <div className="ra-profile-hero">
                                    <div className="ra-avatar ra-avatar-large">
                                        {getInitials(getApplicantName(selectedApplicant))}
                                    </div>
                                    <div>
                                        <h3>{getApplicantName(selectedApplicant)}</h3>
                                        {getApplicantEmail(selectedApplicant) ? (
                                            <a href={gmailComposeUrl(getApplicantEmail(selectedApplicant))} target="_blank" rel="noreferrer">
                                                {getApplicantEmail(selectedApplicant)}
                                            </a>
                                        ) : (
                                            <span className="ra-candidate-muted">
                                                No email available
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="ra-detail-section">
                                    <span className="ra-detail-label">Application status</span>
                                    <div
                                        className={`ra-status large ${statusClass(selectedApplicant.status)}`}
                                    >
                                        {statusLabel(selectedApplicant.status)}
                                    </div>
                                </div>

                                <div className="ra-detail-grid">
                                    <div>
                                        <span>Application ID</span>
                                        <strong>#{getApplicationId(selectedApplicant) ?? "—"}</strong>
                                    </div>
                                    <div>
                                        <span>
                                            <CalendarDays size={13} /> Applied on
                                        </span>
                                        <strong>{formatDate(selectedApplicant.appliedAt)}</strong>
                                    </div>
                                    <div>
                                        <span>Job</span>
                                        <strong>
                                            {selectedApplicant.jobTitle ||
                                                selectedApplicant.job?.title ||
                                                jobTitle ||
                                                "—"}
                                        </strong>
                                    </div>
                                    <div>
                                        <span>Company</span>
                                        <strong>
                                            {selectedApplicant.companyName ||
                                                selectedApplicant.job?.companyName ||
                                                "Your company"}
                                        </strong>
                                    </div>
                                </div>

                                <section className="ra-candidate-academics">
                                    <h3>
                                        <GraduationCap size={18} />
                                        Academic profile
                                    </h3>

                                    {candidateProfileLoading ? (
                                        <p className="ra-candidate-muted">
                                            Loading candidate profile...
                                        </p>
                                    ) : candidateProfileError ? (
                                        <p className="ra-candidate-error" role="alert">
                                            {candidateProfileError}
                                        </p>
                                    ) : candidateProfile ? (
                                        <>
                                            <div className="ra-candidate-field">
                                                <span>College / University</span>
                                                <strong>{candidateProfile.college || "Not provided"}</strong>
                                            </div>
                                            <div className="ra-candidate-field">
                                                <span>Degree</span>
                                                <strong>{candidateProfile.degree || "Not provided"}</strong>
                                            </div>
                                            <div className="ra-candidate-field">
                                                <span>Branch / specialization</span>
                                                <strong>{candidateProfile.branch || "Not provided"}</strong>
                                            </div>
                                            <div className="ra-candidate-field">
                                                <span>Graduation year</span>
                                                <strong>{candidateProfile.graduationYear || "Not provided"}</strong>
                                            </div>
                                            <div className="ra-candidate-bio">
                                                <span>About the candidate</span>
                                                <p>{candidateProfile.bio || "No introduction provided."}</p>
                                            </div>
                                            <div className="ra-candidate-skills">
                                                <span>Skills</span>
                                                <div className="ra-skill-list">
                                                    {candidateProfile.skills?.length ? (
                                                        candidateProfile.skills.map((skill) => (
                                                            <span key={skill.id ?? skill.name}>
                                                                {skill.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <p>No skills added yet.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <p className="ra-candidate-muted">
                                            Candidate profile details are not available.
                                        </p>
                                    )}
                                </section>

                                <section className="ra-candidate-resume">
                                    <div>
                                        <h3>
                                            <FileText size={18} />
                                            Candidate resume
                                        </h3>
                                        <p>
                                            Download the candidate's uploaded PDF to review
                                            experience, projects and qualifications.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="ra-resume-download"
                                        onClick={handleDownloadCandidateResume}
                                        disabled={resumeDownloading}
                                    >
                                        <Download size={16} />
                                        {resumeDownloading
                                            ? "Preparing download..."
                                            : "Download resume"}
                                    </button>
                                </section>

                                <div className="ra-drawer-actions">
                                    {getApplicantEmail(selectedApplicant) ? (
                                        <a
                                            href={gmailComposeUrl(getApplicantEmail(selectedApplicant))}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="recruiter-primary-button"
                                        >
                                            <Mail size={16} />
                                            Contact candidate
                                        </a>
                                    ) : (
                                        <button
                                            type="button"
                                            className="recruiter-primary-button"
                                            disabled
                                        >
                                            <Mail size={16} />
                                            Email unavailable
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        className="ra-email-selected"
                                        onClick={() => openDecisionEmail("SELECTED")}
                                        disabled={!getApplicantEmail(selectedApplicant)}
                                    >
                                        <CheckCircle2 size={16} />
                                        Draft Round 1 Selection Email
                                    </button>

                                    <button
                                        type="button"
                                        className="ra-email-rejected"
                                        onClick={() => openDecisionEmail("REJECTED")}
                                        disabled={!getApplicantEmail(selectedApplicant)}
                                    >
                                        <XCircle size={16} />
                                        Draft Round 1 Rejection Email
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </div>
    );
}
