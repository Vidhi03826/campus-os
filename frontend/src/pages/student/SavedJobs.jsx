import { useEffect, useState } from "react";
import {
    Bookmark,
    BriefcaseBusiness,
    ChevronRight,
    MapPin,
    Trash2,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    getSavedJobs,
    unsaveJob,
} from "../../api/studentApi";

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

function SavedJobs() {
    const [jobs, setJobs] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [removingId, setRemovingId] = useState(null);

    const loadSavedJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getSavedJobs();

            const list = Array.isArray(data)
                ? data
                : data?.content ||
                data?.jobs ||
                [];

            setJobs(list);
        } catch (err) {
            console.error(
                "Failed to load saved jobs:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load your saved jobs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSavedJobs();
    }, []);

    const handleRemove = async (jobId) => {
        try {
            setRemovingId(jobId);

            await unsaveJob(jobId);

            setJobs((currentJobs) =>
                currentJobs.filter(
                    (job) => job.id !== jobId
                )
            );
        } catch (err) {
            console.error(
                "Failed to remove saved job:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to remove this saved job."
            );
        } finally {
            setRemovingId(null);
        }
    };

    if (loading) {
        return (
            <div className="saved-jobs-page">
                <div className="saved-jobs-loading-header" />

                <div className="saved-jobs-loading-grid">
                    {Array.from({ length: 4 }).map(
                        (_, index) => (
                            <div
                                className="saved-job-skeleton"
                                key={index}
                            />
                        )
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="saved-jobs-page">

            {/* HEADER */}
            <section className="saved-jobs-header">

                <div>
                    <span className="eyebrow">
                        YOUR SHORTLIST
                    </span>

                    <h1>
                        Saved opportunities
                    </h1>

                    <p>
                        Keep interesting roles close and
                        revisit them when you're ready to apply.
                    </p>
                </div>

                <div className="saved-jobs-count">
                    <Bookmark size={17} />

                    <div>
                        <strong>
                            {jobs.length}
                        </strong>

                        <span>
                            saved
                        </span>
                    </div>
                </div>

            </section>

            {/* ERROR */}
            {error && (
                <div className="saved-jobs-alert">
                    <span>{error}</span>

                    <button
                        onClick={loadSavedJobs}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* EMPTY */}
            {!error && jobs.length === 0 && (
                <div className="saved-jobs-empty">

                    <div className="saved-jobs-empty-icon">
                        <Bookmark size={26} />
                    </div>

                    <span className="eyebrow">
                        NO SHORTLISTS YET
                    </span>

                    <h2>
                        Save roles you want to revisit
                    </h2>

                    <p>
                        Use the bookmark icon on any opportunity
                        to build your personal shortlist.
                    </p>

                    <Link
                        to="/student/jobs"
                        className="primary-button"
                    >
                        <BriefcaseBusiness size={16} />
                        Explore opportunities
                        <ChevronRight size={15} />
                    </Link>

                </div>
            )}

            {/* LIST */}
            {!error && jobs.length > 0 && (
                <div className="saved-jobs-list">

                    {jobs.map((job) => {

                        const company =
                            job.companyName ||
                            job.company?.name ||
                            "Company";

                        return (
                            <article
                                className="saved-job-card"
                                key={job.id}
                            >

                                <div className="saved-job-logo">
                                    {company
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <div className="saved-job-main">

                                    <span className="eyebrow">
                                        {company}
                                    </span>

                                    <Link
                                        to={`/student/jobs/${job.id}`}
                                        className="saved-job-title"
                                    >
                                        {job.title}
                                    </Link>

                                    <div className="saved-job-meta">

                                        <span>
                                            <MapPin size={13} />
                                            {job.location ||
                                                "Remote"}
                                        </span>

                                        <span>
                                            <BriefcaseBusiness
                                                size={13}
                                            />
                                            {formatEnum(
                                                job.jobType
                                            )}
                                        </span>

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
                                                {" "}
                                                yrs
                                            </span>
                                        )}

                                        {job.salaryMin != null ||
                                        job.salaryMax != null ? (
                                            <span>
                                                {formatSalary(
                                                    job.salaryMin,
                                                    job.salaryMax
                                                )}
                                            </span>
                                        ) : (
                                            <span>
                                                Salary not disclosed
                                            </span>
                                        )}

                                    </div>

                                </div>

                                <div className="saved-job-actions">

                                    <Link
                                        to={`/student/jobs/${job.id}`}
                                        className="saved-view-button"
                                    >
                                        View
                                        <ChevronRight
                                            size={14}
                                        />
                                    </Link>

                                    <button
                                        className="saved-remove-button"
                                        onClick={() =>
                                            handleRemove(
                                                job.id
                                            )
                                        }
                                        disabled={
                                            removingId ===
                                            job.id
                                        }
                                        aria-label={`Remove ${job.title} from saved jobs`}
                                    >
                                        <Trash2 size={16} />
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

export default SavedJobs;