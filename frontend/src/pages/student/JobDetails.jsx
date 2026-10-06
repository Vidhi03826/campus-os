import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    Clock3,
    ExternalLink,
    MapPin,
    Share2,
    Sparkles,
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
import { useToast } from "../../context/ToastContext";
import "../../styles/student-job-details.css";

function formatEnum(value) {
    if (!value) {
        return "Not specified";
    }

    return String(value)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSalary(min, max) {
    if (min == null && max == null) {
        return "Not disclosed";
    }

    const format = (value) => {
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
        }

        if (value >= 100000) {
            return `₹${(value / 100000).toFixed(1)}L`;
        }

        if (value >= 1000) {
            return `₹${Math.round(value / 1000)}K`;
        }

        return `₹${value}`;
    };

    if (min != null && max != null) {
        return `${format(min)} – ${format(max)}`;
    }

    if (min != null) {
        return `From ${format(min)}`;
    }

    return `Up to ${format(max)}`;
}

function formatDate(value) {
    if (!value) {
        return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not specified";
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function formatRelativeDate(value) {
    if (!value) {
        return "Recently posted";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently posted";
    }

    const diff = Date.now() - date.getTime();
    const day = 24 * 60 * 60 * 1000;

    if (diff < day) {
        return "Posted today";
    }

    if (diff < 2 * day) {
        return "Posted yesterday";
    }

    if (diff < 7 * day) {
        return `Posted ${Math.floor(diff / day)} days ago`;
    }

    return `Posted on ${formatDate(value)}`;
}

function getCompanyName(job) {
    return (
        job.companyName ||
        job.company?.name ||
        "Company"
    );
}

function getCompanyInitials(name) {
    if (!name) {
        return "C";
    }

    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) => word.charAt(0).toUpperCase())
        .join("");
}

function normalizeList(value) {
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }

    if (typeof value === "string") {
        return value
            .split(/\r?\n|•|;/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
}

function getJobSkills(job) {
    return normalizeList(
        job.skills ||
        job.requiredSkills ||
        job.skillSet ||
        job.technologies
    );
}

function getResponsibilities(job) {
    return normalizeList(
        job.responsibilities ||
        job.responsibility
    );
}

function getRequirements(job) {
    return normalizeList(
        job.requirements ||
        job.qualifications ||
        job.eligibility
    );
}

function getExperienceText(job) {
    const min = job.experienceMin;
    const max = job.experienceMax;

    if (min == null && max == null) {
        return "Not specified";
    }

    if (min != null && max != null) {
        if (min === max) {
            return `${min} years`;
        }

        return `${min} – ${max} years`;
    }

    if (min != null) {
        return `${min}+ years`;
    }

    return `Up to ${max} years`;
}

function DetailSkeleton() {
    return (
        <div className="job-details-shell">
            <div className="job-details-loading">
                <div className="jd-skeleton-back" />

                <div className="jd-skeleton-hero">
                    <div className="jd-skeleton-avatar" />

                    <div className="jd-skeleton-heading">
                        <div className="jd-skeleton-line tiny" />
                        <div className="jd-skeleton-line large" />
                        <div className="jd-skeleton-line medium" />
                    </div>

                    <div className="jd-skeleton-actions">
                        <div />
                        <div />
                    </div>
                </div>

                <div className="jd-skeleton-layout">
                    <div className="jd-skeleton-main">
                        <div className="jd-skeleton-info-grid">
                            {Array.from({
                                length: 4,
                            }).map((_, index) => (
                                <div key={index} />
                            ))}
                        </div>

                        <div className="jd-skeleton-content">
                            <div className="jd-skeleton-line medium" />
                            <div className="jd-skeleton-line full" />
                            <div className="jd-skeleton-line full" />
                            <div className="jd-skeleton-line long" />
                            <div className="jd-skeleton-line full" />
                        </div>
                    </div>

                    <div className="jd-skeleton-side" />
                </div>
            </div>
        </div>
    );
}

function JobDetails() {
    const { jobId } = useParams();
    const navigate = useNavigate();

    const { success, error: showError, info } = useToast();

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

    const companyName = useMemo(
        () => getJobSkills(job || {}),
        [job]
    );

    const responsibilities = useMemo(
        () => getResponsibilities(job || {}),
        [job]
    );

    const requirements = useMemo(
        () => getRequirements(job || {}),
        [job]
    );

    useEffect(() => {
        let active = true;

        const loadJob = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getJobById(jobId);

                if (!active) {
                    return;
                }

                setJob(data);

                setSaved(
                    Boolean(
                        data?.saved ??
                        data?.isSaved ??
                        false
                    )
                );
            } catch (err) {
                if (!active) {
                    return;
                }

                console.error(
                    "GET /api/jobs/{jobId} failed:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to load this opportunity."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadJob();

        return () => {
            active = false;
        };
    }, [jobId]);



    const handleSave = async () => {
        if (!job || saving) {
            return;
        }

        try {
            setSaving(true);

            if (saved) {
                await unsaveJob(job.id);

                setSaved(false);
                success("Removed from your saved jobs.", "Job unsaved");;
            } else {
                await saveJob(job.id);

                setSaved(true);
                success("Added to your saved jobs.", "Job saved");
            }
        } catch (err) {
            console.error(
                "Failed to update saved job:",
                err
            );

            showError(
                err.response?.data?.message ||
                "Unable to update saved job."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleShare = async () => {
        try {
            if (
                navigator.share &&
                job?.title
            ) {
                await navigator.share({
                    title: job.title,
                    text: `Check out this opportunity at ${companyName}.`,
                    url: window.location.href,
                });

                return;
            }

            await navigator.clipboard.writeText(
                window.location.href
            );

            success("Job link copied to clipboard.", "Link copied");
        } catch (err) {
            if (err?.name === "AbortError") {
                return;
            }

            showError("Unable to share this opportunity.");
        }
    };

    const handleApply = async () => {
        if (!job || applying) {
            return;
        }

        try {
            setApplying(true);

            await applyToJob(job.id);

            success(
                "Your application has been submitted successfully.",
                "Application submitted"
            );
        } catch (err) {
            console.error(
                "Application failed:",
                err
            );

            setShowApplyModal(false);

            const message =
                err.response?.data?.message ||
                "Unable to submit your application.";

            if (
                message.toLowerCase().includes("already") ||
                message.toLowerCase().includes("applied")
            ) {
                info(message, "Already applied");
            } else {
                showError(message);
            }
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return <DetailSkeleton />;
    }

    if (error || !job) {
        return (
            <div className="job-details-shell">
                <div className="job-details-error">
                    <div className="jd-error-icon">
                        <BriefcaseBusiness size={25} />
                    </div>

                    <span className="jd-eyebrow">
                        OPPORTUNITY UNAVAILABLE
                    </span>

                    <h2>
                        We couldn't load this role
                    </h2>

                    <p>
                        {error ||
                            "This opportunity could not be found or is no longer available."}
                    </p>

                    <div className="jd-error-actions">
                        <button
                            type="button"
                            className="jd-primary-button"
                            onClick={() =>
                                navigate("/student/jobs")
                            }
                        >
                            <ArrowLeft size={16} />
                            Back to opportunities
                        </button>

                        <button
                            type="button"
                            className="jd-secondary-button"
                            onClick={() =>
                                window.location.reload()
                            }
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const postedDate =
        job.createdAt ||
        job.postedAt ||
        job.createdDate;

    const deadline =
        job.applicationDeadline ||
        job.deadline ||
        job.lastDateToApply;

    const isExpired =
        deadline &&
        new Date(deadline).getTime() <
        Date.now();

    return (
        <div className="job-details-shell">
            <div className="job-details-page">
                {/* =================================================
                    BACK
                   ================================================= */}

                <button
                    type="button"
                    className="jd-back-button"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                    Back to opportunities
                </button>

                {/* =================================================
                    HERO
                   ================================================= */}

                <section className="jd-hero">
                    <div className="jd-company-avatar">
                        {getCompanyInitials(companyName)}
                    </div>

                    <div className="jd-hero-content">
                        <div className="jd-company-label">
                            {companyName}
                        </div>

                        <h1>{job.title}</h1>

                        <div className="jd-hero-meta">
                            <span>
                                <MapPin size={15} />
                                {job.location ||
                                    "Remote"}
                            </span>

                            <span>
                                <BriefcaseBusiness
                                    size={15}
                                />
                                {formatEnum(
                                    job.jobType
                                )}
                            </span>

                            <span>
                                <Clock3 size={15} />
                                {formatEnum(
                                    job.workMode
                                )}
                            </span>

                            <span>
                                <CalendarDays size={15} />
                                {formatRelativeDate(
                                    postedDate
                                )}
                            </span>
                        </div>
                    </div>

                    <div className="jd-hero-actions">
                        <button
                            type="button"
                            className={`jd-icon-action ${
                                saved
                                    ? "is-saved"
                                    : ""
                            }`}
                            onClick={handleSave}
                            disabled={saving}
                            title={
                                saved
                                    ? "Remove from saved"
                                    : "Save opportunity"
                            }
                            aria-label={
                                saved
                                    ? "Remove from saved"
                                    : "Save opportunity"
                            }
                        >
                            <Bookmark
                                size={18}
                                fill={
                                    saved
                                        ? "currentColor"
                                        : "none"
                                }
                            />
                        </button>

                        <button
                            type="button"
                            className="jd-icon-action"
                            onClick={handleShare}
                            title="Share opportunity"
                            aria-label="Share opportunity"
                        >
                            <Share2 size={18} />
                        </button>

                        <button
                            type="button"
                            className="jd-hero-apply"
                            onClick={() =>
                                setShowApplyModal(true)
                            }
                            disabled={Boolean(
                                isExpired
                            )}
                        >
                            {isExpired
                                ? "Applications closed"
                                : "Apply now"}
                        </button>
                    </div>
                </section>


                {/* =================================================
                    MAIN LAYOUT
                   ================================================= */}

                <div className="jd-layout">
                    <main className="jd-main">
                        {/* KEY FACTS */}

                        <section className="jd-facts">
                            <div className="jd-fact">
                                <span>Salary</span>
                                <strong>
                                    {formatSalary(
                                        job.salaryMin,
                                        job.salaryMax
                                    )}
                                </strong>
                            </div>

                            <div className="jd-fact">
                                <span>Experience</span>
                                <strong>
                                    {getExperienceText(
                                        job
                                    )}
                                </strong>
                            </div>

                            <div className="jd-fact">
                                <span>Work mode</span>
                                <strong>
                                    {formatEnum(
                                        job.workMode
                                    )}
                                </strong>
                            </div>

                            <div className="jd-fact">
                                <span>Application deadline</span>
                                <strong
                                    className={
                                        isExpired
                                            ? "expired"
                                            : ""
                                    }
                                >
                                    {deadline
                                        ? formatDate(
                                            deadline
                                        )
                                        : "Not specified"}
                                </strong>
                            </div>
                        </section>

                        {/* ABOUT */}

                        <section className="jd-section">
                            <div className="jd-section-heading">
                                <span className="jd-eyebrow">
                                    ROLE OVERVIEW
                                </span>

                                <h2>
                                    About the opportunity
                                </h2>
                            </div>

                            <div className="jd-description">
                                {job.description ? (
                                    String(
                                        job.description
                                    )
                                        .split(/\n+/)
                                        .map(
                                            (
                                                paragraph,
                                                index
                                            ) => (
                                                <p
                                                    key={
                                                        index
                                                    }
                                                >
                                                    {
                                                        paragraph
                                                    }
                                                </p>
                                            )
                                        )
                                ) : (
                                    <p className="jd-muted">
                                        No detailed
                                        description has
                                        been provided for
                                        this opportunity.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* RESPONSIBILITIES */}

                        {responsibilities.length > 0 && (
                            <section className="jd-section">
                                <div className="jd-section-heading">
                                    <span className="jd-eyebrow">
                                        WHAT YOU'LL DO
                                    </span>

                                    <h2>
                                        Responsibilities
                                    </h2>
                                </div>

                                <ul className="jd-bullet-list">
                                    {responsibilities.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <li
                                                key={
                                                    `${item}-${index}`
                                                }
                                            >
                                                <span>
                                                    <Check
                                                        size={
                                                            13
                                                        }
                                                    />
                                                </span>

                                                <p>
                                                    {item}
                                                </p>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </section>
                        )}

                        {/* REQUIREMENTS */}

                        {requirements.length > 0 && (
                            <section className="jd-section">
                                <div className="jd-section-heading">
                                    <span className="jd-eyebrow">
                                        WHAT WE'RE LOOKING FOR
                                    </span>

                                    <h2>
                                        Requirements
                                    </h2>
                                </div>

                                <ul className="jd-bullet-list">
                                    {requirements.map(
                                        (
                                            item,
                                            index
                                        ) => (
                                            <li
                                                key={
                                                    `${item}-${index}`
                                                }
                                            >
                                                <span>
                                                    <Check
                                                        size={
                                                            13
                                                        }
                                                    />
                                                </span>

                                                <p>
                                                    {item}
                                                </p>
                                            </li>
                                        )
                                    )}
                                </ul>
                            </section>
                        )}

                        {/* SKILLS */}

                        {skills.length > 0 && (
                            <section className="jd-section">
                                <div className="jd-section-heading">
                                    <span className="jd-eyebrow">
                                        SKILLS & TECHNOLOGIES
                                    </span>

                                    <h2>
                                        What you'll work with
                                    </h2>
                                </div>

                                <div className="jd-skills">
                                    {skills.map(
                                        (
                                            skill,
                                            index
                                        ) => (
                                            <span
                                                key={`${skill}-${index}`}
                                            >
                                                {skill}
                                            </span>
                                        )
                                    )}
                                </div>
                            </section>
                        )}
                    </main>

                    {/* =================================================
                        SIDEBAR
                       ================================================= */}

                    <aside className="jd-sidebar">
                        <section className="jd-apply-card">
                            <div className="jd-apply-card-icon">
                                <Sparkles size={19} />
                            </div>

                            <span className="jd-eyebrow">
                                YOUR NEXT MOVE
                            </span>

                            <h3>
                                Ready to take the shot?
                            </h3>

                            <p>
                                Your profile and current
                                resume will be available
                                to the recruiter when you
                                apply.
                            </p>

                            <button
                                type="button"
                                className="jd-sidebar-apply"
                                onClick={() =>
                                    setShowApplyModal(
                                        true
                                    )
                                }
                                disabled={Boolean(
                                    isExpired
                                )}
                            >
                                {isExpired
                                    ? "Applications closed"
                                    : "Apply to this role"}
                            </button>

                            <div className="jd-trust-item">
                                <CheckCircle2 size={15} />
                                <span>
                                    Profile can be reviewed
                                    by recruiters
                                </span>
                            </div>

                            <div className="jd-trust-item">
                                <CheckCircle2 size={15} />
                                <span>
                                    Your current resume will
                                    be used
                                </span>
                            </div>
                        </section>

                        <section className="jd-company-card">
                            <div className="jd-company-card-avatar">
                                {getCompanyInitials(
                                    companyName
                                )}
                            </div>

                            <div>
                                <span className="jd-eyebrow">
                                    COMPANY
                                </span>

                                <h3>{companyName}</h3>
                            </div>

                            {job.company?.description && (
                                <p>
                                    {
                                        job.company
                                            .description
                                    }
                                </p>
                            )}

                            {job.company?.website && (
                                <a
                                    href={
                                        job.company.website
                                    }
                                    target="_blank"
                                    rel="noreferrer"
                                    className="jd-company-link"
                                >
                                    Visit company
                                    <ExternalLink
                                        size={13}
                                    />
                                </a>
                            )}
                        </section>

                        <section className="jd-sidebar-meta">
                            <div>
                                <MapPin size={16} />
                                <div>
                                    <span>Location</span>
                                    <strong>
                                        {job.location ||
                                            "Remote"}
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <BriefcaseBusiness
                                    size={16}
                                />
                                <div>
                                    <span>Job type</span>
                                    <strong>
                                        {formatEnum(
                                            job.jobType
                                        )}
                                    </strong>
                                </div>
                            </div>

                            <div>
                                <CalendarDays size={16} />
                                <div>
                                    <span>Posted</span>
                                    <strong>
                                        {formatDate(
                                            postedDate
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </section>

                        <Link
                            to="/student/jobs"
                            className="jd-browse-link"
                        >
                            <ArrowLeft size={14} />
                            Explore more opportunities
                        </Link>
                    </aside>
                </div>
            </div>

            {/* =====================================================
                APPLY MODAL
               ===================================================== */}

            {showApplyModal && (
                <div
                    className="jd-modal-backdrop"
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setShowApplyModal(false);
                        }
                    }}
                >
                    <div
                        className="jd-apply-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="apply-modal-title"
                    >
                        <button
                            type="button"
                            className="jd-modal-close"
                            onClick={() =>
                                setShowApplyModal(
                                    false
                                )
                            }
                            aria-label="Close application dialog"
                        >
                            <X size={18} />
                        </button>

                        <div className="jd-modal-icon">
                            <BriefcaseBusiness
                                size={23}
                            />
                        </div>

                        <span className="jd-eyebrow">
                            APPLICATION
                        </span>

                        <h2 id="apply-modal-title">
                            Ready to apply?
                        </h2>

                        <p className="jd-modal-intro">
                            You're applying for{" "}
                            <strong>{job.title}</strong>{" "}
                            at{" "}
                            <strong>{companyName}</strong>.
                        </p>

                        <div className="jd-modal-check">
                            <CheckCircle2 size={17} />
                            <span>
                                Submit your current profile
                            </span>
                        </div>

                        <div className="jd-modal-check">
                            <CheckCircle2 size={17} />
                            <span>
                                Submit your current resume
                            </span>
                        </div>

                        <div className="jd-modal-note">
                            Make sure your profile and resume
                            are up to date before submitting.
                        </div>

                        <div className="jd-modal-actions">
                            <button
                                type="button"
                                className="jd-secondary-button"
                                onClick={() =>
                                    setShowApplyModal(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="jd-primary-button"
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

            {/* =====================================================
                SUCCESS MODAL
               ===================================================== */}

            {applicationSuccess && (
                <div className="jd-modal-backdrop">
                    <div
                        className="jd-success-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="success-title"
                    >
                        <div className="jd-success-icon">
                            <CheckCircle2 size={31} />
                        </div>

                        <span className="jd-eyebrow">
                            APPLICATION SENT
                        </span>

                        <h2 id="success-title">
                            You're officially in.
                        </h2>

                        <p>
                            Your application for{" "}
                            <strong>{job.title}</strong>{" "}
                            has been submitted successfully.
                        </p>

                        <div className="jd-success-status">
                            <span>
                                <Check size={14} />
                            </span>

                            Application status
                            <strong>Applied</strong>
                        </div>

                        <div className="jd-modal-actions">
                            <Link
                                to="/student/applications"
                                className="jd-primary-button"
                                onClick={() =>
                                    setApplicationSuccess(
                                        false
                                    )
                                }
                            >
                                View application
                            </Link>

                            <button
                                type="button"
                                className="jd-secondary-button"
                                onClick={() =>
                                    setApplicationSuccess(
                                        false
                                    )
                                }
                            >
                                Continue browsing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default JobDetails;