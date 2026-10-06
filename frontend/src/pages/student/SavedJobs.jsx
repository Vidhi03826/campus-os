import { useEffect, useMemo, useState } from "react";
import {
    Bookmark,
    BriefcaseBusiness,
    CalendarDays,
    ChevronRight,
    MapPin,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import {
    getSavedJobs,
    unsaveJob,
} from "../../api/studentApi";

import "../../styles/student-saved-jobs.css";

function formatEnum(value) {
    if (!value) return "Not specified";

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

    if (min != null) {
        return `From ${format(min)}`;
    }

    return `Up to ${format(max)}`;
}

function formatDate(value) {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getJobId(job) {
    return job?.id ?? job?.jobId;
}

function getCompany(job) {
    return (
        job?.companyName ||
        job?.company?.name ||
        "Company"
    );
}

function getDeadline(job) {
    return (
        job?.applicationDeadline ||
        job?.deadline ||
        job?.lastDate
    );
}

export default function SavedJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const {
        success: showSuccess,
        error: showError,
    } = useToast();
    const loadSavedJobs = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const data = await getSavedJobs();

            const list = Array.isArray(data)
                ? data
                : data?.content ||
                data?.jobs ||
                data?.data ||
                [];

            setJobs(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error("Failed to load saved jobs:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load your saved jobs."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSavedJobs();
    }, []);

    const handleRemove = async (jobId) => {
        try {
            setRemovingId(jobId);
            setError("");

            await unsaveJob(jobId);

            setJobs((current) =>
                current.filter(
                    (job) => String(getJobId(job)) !== String(jobId)
                )
            );

            showSuccess(
                "Job removed from your saved jobs.",
                "Saved job removed"
            );
        } catch (err) {
            console.error("Failed to remove saved job:", err);

            const message =
                err.response?.data?.message ||
                "Unable to remove this saved job.";

            setError(message);
            showError(message);
        } finally {
            setRemovingId(null);
        }
    };

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return jobs;

        return jobs.filter((job) => {
            const title = String(job?.title || "").toLowerCase();
            const company = getCompany(job).toLowerCase();
            const location = String(
                job?.location || ""
            ).toLowerCase();

            return (
                title.includes(query) ||
                company.includes(query) ||
                location.includes(query)
            );
        });
    }, [jobs, search]);

    if (loading) {
        return (
            <div className="saved-jobs-page">
                <div className="saved-jobs-skeleton-header">
                    <div className="saved-skeleton-line saved-skeleton-small" />
                    <div className="saved-skeleton-line saved-skeleton-title" />
                    <div className="saved-skeleton-line saved-skeleton-text" />
                </div>

                <div className="saved-jobs-skeleton-grid">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            className="saved-job-skeleton"
                            key={index}
                        >
                            <div className="saved-skeleton-circle" />
                            <div className="saved-skeleton-content">
                                <div className="saved-skeleton-line" />
                                <div className="saved-skeleton-line" />
                                <div className="saved-skeleton-line saved-skeleton-short" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="saved-jobs-page">

            {/* HEADER */}
            <section className="saved-jobs-header">

                <div className="saved-jobs-heading">

                    <span className="eyebrow">
                        YOUR SHORTLIST
                    </span>

                    <h1>Saved opportunities</h1>

                    <p>
                        Keep the roles that caught your attention
                        close by and revisit them when you're ready.
                    </p>

                </div>

                <div className="saved-jobs-header-actions">

                    <div className="saved-jobs-count">
                        <div className="saved-jobs-count-icon">
                            <Bookmark size={18} />
                        </div>

                        <div>
                            <strong>{jobs.length}</strong>
                            <span>saved roles</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="saved-refresh-button"
                        onClick={() => loadSavedJobs(true)}
                        disabled={refreshing}
                        aria-label="Refresh saved jobs"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "saved-spin"
                                    : ""
                            }
                        />
                    </button>

                </div>

            </section>

            {/* ERROR */}
            {error && (
                <div className="saved-jobs-alert">

                    <div>
                        <strong>Something went wrong</strong>
                        <span>{error}</span>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadSavedJobs()}
                    >
                        Retry
                    </button>

                </div>
            )}

            {/* TOOLBAR */}
            {jobs.length > 0 && (
                <section className="saved-jobs-toolbar">

                    <div className="saved-search">

                        <Search size={17} />

                        <input
                            type="text"
                            placeholder="Search saved jobs..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            aria-label="Search saved jobs"
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                aria-label="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}

                    </div>

                    <span className="saved-results-count">
                        {filteredJobs.length}{" "}
                        {filteredJobs.length === 1
                            ? "opportunity"
                            : "opportunities"}
                    </span>

                </section>
            )}

            {/* EMPTY */}
            {!error && jobs.length === 0 && (
                <div className="saved-jobs-empty">

                    <div className="saved-jobs-empty-icon">
                        <Bookmark size={28} />
                    </div>

                    <span className="eyebrow">
                        NO SHORTLISTS YET
                    </span>

                    <h2>
                        Your next opportunity could be here
                    </h2>

                    <p>
                        Save interesting jobs while exploring
                        opportunities and come back when you're
                        ready to apply.
                    </p>

                    <Link
                        to="/student/jobs"
                        className="saved-primary-button"
                    >
                        <BriefcaseBusiness size={16} />
                        Explore opportunities
                        <ChevronRight size={16} />
                    </Link>

                </div>
            )}

            {/* NO SEARCH RESULTS */}
            {!error &&
                jobs.length > 0 &&
                filteredJobs.length === 0 && (
                    <div className="saved-jobs-empty saved-jobs-no-results">

                        <div className="saved-jobs-empty-icon">
                            <Search size={25} />
                        </div>

                        <h2>No saved jobs found</h2>

                        <p>
                            Try searching with another job title,
                            company or location.
                        </p>

                        <button
                            type="button"
                            className="saved-secondary-button"
                            onClick={() => setSearch("")}
                        >
                            Clear search
                        </button>

                    </div>
                )}

            {/* LIST */}
            {!error && filteredJobs.length > 0 && (
                <div className="saved-jobs-list">

                    {filteredJobs.map((job) => {
                        const id = getJobId(job);
                        const company = getCompany(job);
                        const deadline = getDeadline(job);

                        return (
                            <article
                                className="saved-job-card"
                                key={id}
                            >

                                <div className="saved-job-logo">
                                    {company
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="saved-job-main">

                                    <div className="saved-job-company">
                                        {company}
                                    </div>

                                    <Link
                                        to={`/student/jobs/${id}`}
                                        className="saved-job-title"
                                    >
                                        {job.title ||
                                            "Untitled opportunity"}
                                    </Link>

                                    <div className="saved-job-meta">

                                        {job.location && (
                                            <span>
                                                <MapPin size={14} />
                                                {job.location}
                                            </span>
                                        )}

                                        {job.jobType && (
                                            <span>
                                                <BriefcaseBusiness
                                                    size={14}
                                                />
                                                {formatEnum(
                                                    job.jobType
                                                )}
                                            </span>
                                        )}

                                        {job.workMode && (
                                            <span>
                                                {formatEnum(
                                                    job.workMode
                                                )}
                                            </span>
                                        )}

                                    </div>

                                    <div className="saved-job-tags">

                                        {job.experienceMin != null && (
                                            <span>
                                                {job.experienceMin}+
                                                {" "}yrs experience
                                            </span>
                                        )}

                                        <span>
                                            {formatSalary(
                                                job.salaryMin,
                                                job.salaryMax
                                            )}
                                        </span>

                                        {deadline && (
                                            <span className="saved-deadline">
                                                <CalendarDays size={13} />
                                                Apply by{" "}
                                                {formatDate(deadline)}
                                            </span>
                                        )}

                                    </div>

                                </div>

                                <div className="saved-job-actions">

                                    <Link
                                        to={`/student/jobs/${id}`}
                                        className="saved-view-button"
                                    >
                                        View opportunity
                                        <ChevronRight size={15} />
                                    </Link>

                                    <button
                                        type="button"
                                        className="saved-remove-button"
                                        onClick={() =>
                                            handleRemove(id)
                                        }
                                        disabled={
                                            removingId === id
                                        }
                                        aria-label={`Remove ${job.title} from saved jobs`}
                                        title="Remove from saved jobs"
                                    >
                                        {removingId === id ? (
                                            <RefreshCw
                                                size={16}
                                                className="saved-spin"
                                            />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>

                                </div>

                            </article>
                        );
                    })}

                </div>
            )}

        </div>
    );
}