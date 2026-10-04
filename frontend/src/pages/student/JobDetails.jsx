import { useEffect, useState } from "react";
import {
    ArrowLeft,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    MapPin,
    Share2,
    X,
} from "lucide-react";

import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getJobById,
    saveJob,
    unsaveJob,
} from "../../api/studentApi";

import { applyToJob } from "../../api/applicationApi";

function formatEnum(value) {
    if (!value) {
        return "Not specified";
    }

    return value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSalary(min, max) {
    if (min == null && max == null) {
        return "Not disclosed";
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

function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const [job, setJob] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    const [showApplyModal, setShowApplyModal] =
        useState(false);

    const [applying, setApplying] = useState(false);

    const [applicationSuccess, setApplicationSuccess] =
        useState(false);

    const [actionMessage, setActionMessage] =
        useState("");

    useEffect(() => {
        const loadJob = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getJobById(jobId);

                setJob(data);

                setSaved(
                    data.saved ??
                    data.isSaved ??
                    false
                );
            } catch (err) {
                console.error(
                    "GET /api/jobs/{jobId} failed:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load this opportunity."
                );
            } finally {
                setLoading(false);
            }
        };

        loadJob();
    }, [jobId]);

    const handleSave = async () => {
        if (!job || saving) {
            return;
        }

        try {
            setSaving(true);
            setActionMessage("");

            if (saved) {
                await unsaveJob(job.id);
                setSaved(false);
                setActionMessage("Job removed from saved jobs.");
            } else {
                await saveJob(job.id);
                setSaved(true);
                setActionMessage("Job saved successfully.");
            }
        } catch (err) {
            console.error(
                "Failed to update saved job:",
                err
            );

            setActionMessage(
                err.response?.data?.message ||
                "Unable to update saved job."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleShare = async () => {
        try {
            await navigator.clipboard.writeText(
                window.location.href
            );

            setActionMessage(
                "Job link copied to clipboard."
            );
        } catch {
            setActionMessage(
                "Unable to copy the job link."
            );
        }
    };

    const handleApply = async () => {
        if (!job || applying) {
            return;
        }

        try {
            setApplying(true);

            await applyToJob(job.id);

            setShowApplyModal(false);
            setApplicationSuccess(true);
        } catch (err) {
            console.error(
                "Application failed:",
                err
            );

            setShowApplyModal(false);

            setActionMessage(
                err.response?.data?.message ||
                "Unable to submit your application."
            );
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="job-details-loading">
                <div className="job-details-skeleton hero" />
                <div className="job-details-skeleton body" />
            </div>
        );
    }

    if (error || !job) {
        return (
            <div className="job-details-error">
                <div className="jobs-empty-icon">
                    <BriefcaseBusiness size={25} />
                </div>

                <h2>
                    Opportunity unavailable
                </h2>

                <p>
                    {error ||
                        "This job could not be found."}
                </p>

                <Link
                    to="/student/jobs"
                    className="primary-button"
                >
                    Back to jobs
                </Link>
            </div>
        );
    }

    const companyName =
        job.companyName ||
        job.company?.name ||
        "Company";

    return (
        <>
            <div className="job-details-page">

                <button
                    className="back-link"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                    Back to opportunities
                </button>

                <section className="job-details-header">

                    <div className="job-details-company-logo">
                        {companyName
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="job-details-heading">

                        <span className="eyebrow">
                            {companyName}
                        </span>

                        <h1>
                            {job.title}
                        </h1>

                        <div className="job-details-meta">

                            <span>
                                <Building2 size={15} />
                                {companyName}
                            </span>

                            <span>
                                <MapPin size={15} />
                                {job.location || "Remote"}
                            </span>

                            <span>
                                <BriefcaseBusiness size={15} />
                                {formatEnum(job.jobType)}
                            </span>

                            <span>
                                <Clock3 size={15} />
                                {formatEnum(job.workMode)}
                            </span>

                        </div>
                    </div>

                    <div className="job-details-actions">

                        <button
                            className={`outline-action ${
                                saved ? "saved" : ""
                            }`}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Bookmark
                                size={17}
                                fill={
                                    saved
                                        ? "currentColor"
                                        : "none"
                                }
                            />

                            {saving
                                ? "Saving..."
                                : saved
                                    ? "Saved"
                                    : "Save"}
                        </button>

                        <button
                            className="outline-action"
                            onClick={handleShare}
                        >
                            <Share2 size={17} />
                            Share
                        </button>

                        <button
                            className="primary-button job-apply-button"
                            onClick={() =>
                                setShowApplyModal(true)
                            }
                        >
                            Apply now
                        </button>

                    </div>
                </section>

                {actionMessage && (
                    <div className="action-toast">
                        <CheckCircle2 size={16} />
                        <span>{actionMessage}</span>
                    </div>
                )}

                <div className="job-details-layout">

                    <main className="job-details-main">

                        <section className="job-info-grid">

                            <div className="job-info-box">
                                <span>
                                    Salary
                                </span>

                                <strong>
                                    {formatSalary(
                                        job.salaryMin,
                                        job.salaryMax
                                    )}
                                </strong>
                            </div>

                            <div className="job-info-box">
                                <span>
                                    Experience
                                </span>

                                <strong>
                                    {job.experienceMin}
                                    {" – "}
                                    {job.experienceMax}
                                    {" years"}
                                </strong>
                            </div>

                            <div className="job-info-box">
                                <span>
                                    Work mode
                                </span>

                                <strong>
                                    {formatEnum(job.workMode)}
                                </strong>
                            </div>

                            <div className="job-info-box">
                                <span>
                                    Deadline
                                </span>

                                <strong>
                                    <CalendarDays size={14} />

                                    {job.applicationDeadline
                                        ? new Date(
                                            job.applicationDeadline
                                        ).toLocaleDateString(
                                            "en-IN"
                                        )
                                        : "Not specified"}
                                </strong>
                            </div>

                        </section>

                        <section className="details-surface">

                            <div className="details-section">

                                <span className="eyebrow">
                                    ROLE OVERVIEW
                                </span>

                                <h2>
                                    About this opportunity
                                </h2>

                                <p className="job-description">
                                    {job.description ||
                                        "No description provided."}
                                </p>

                            </div>

                        </section>

                    </main>

                    <aside className="job-details-side">

                        <div className="details-surface">

                            <div className="side-heading">

                                <CalendarDays size={18} />

                                <div>
                                    <span className="eyebrow">
                                        APPLICATION
                                    </span>

                                    <h3>
                                        Ready to apply?
                                    </h3>
                                </div>

                            </div>

                            <p className="side-copy">
                                Review the opportunity and submit
                                your application when you're ready.
                            </p>

                            <div className="application-check">
                                <CheckCircle2 size={16} />
                                Profile can be reviewed by recruiters
                            </div>

                            <div className="application-check">
                                <CheckCircle2 size={16} />
                                Your current resume will be used
                            </div>

                            <button
                                className="primary-button full-width"
                                onClick={() =>
                                    setShowApplyModal(true)
                                }
                            >
                                Apply to this role
                            </button>

                        </div>

                    </aside>
                </div>
            </div>

            {showApplyModal && (
                <div
                    className="modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowApplyModal(false);
                        }
                    }}
                >
                    <div className="apply-modal">

                        <button
                            className="modal-close"
                            onClick={() =>
                                setShowApplyModal(false)
                            }
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="apply-modal-icon">
                            <BriefcaseBusiness size={23} />
                        </div>

                        <span className="eyebrow">
                            APPLICATION
                        </span>

                        <h2>
                            Ready to apply?
                        </h2>

                        <p>
                            You're applying for
                            <strong>
                                {" "}
                                {job.title}
                            </strong>{" "}
                            at
                            <strong>
                                {" "}
                                {companyName}
                            </strong>.
                        </p>

                        <div className="apply-check">
                            <CheckCircle2 size={17} />
                            Submit your current profile
                        </div>

                        <div className="apply-check">
                            <CheckCircle2 size={17} />
                            Submit your current resume
                        </div>

                        <div className="modal-actions">
                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setShowApplyModal(false)
                                }
                            >
                                Cancel
                            </button>

                            <button
                                className="primary-button"
                                onClick={handleApply}
                                disabled={applying}
                            >
                                {applying
                                    ? "Submitting..."
                                    : "Confirm application"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {applicationSuccess && (
                <div className="modal-backdrop">

                    <div className="success-modal">

                        <div className="success-icon">
                            <CheckCircle2 size={31} />
                        </div>

                        <span className="eyebrow">
                            APPLICATION SENT
                        </span>

                        <h2>
                            You're officially in.
                        </h2>

                        <p>
                            Your application for{" "}
                            <strong>
                                {job.title}
                            </strong>{" "}
                            has been submitted successfully.
                        </p>

                        <div className="modal-actions">
                            <Link
                                to="/student/applications"
                                className="primary-button"
                                onClick={() =>
                                    setApplicationSuccess(false)
                                }
                            >
                                View applications
                            </Link>

                            <button
                                className="secondary-button"
                                onClick={() =>
                                    setApplicationSuccess(false)
                                }
                            >
                                Continue browsing
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </>
    );
}

export default JobDetails;