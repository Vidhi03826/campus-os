
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    getMyJobs,
    publishJob,
    closeJob,
} from "../../api/recruiterApi";
import "../../styles/recruiter.css";

const statusClass = (status) =>
    `recruiter-status recruiter-status--${String(status || "unknown").toLowerCase()}`;

const formatSalary = (min, max) => {
    if (min == null && max == null) return "Salary not specified";

    const format = (value) =>
        new Intl.NumberFormat("en-IN", {
            maximumFractionDigits: 0,
        }).format(Number(value));

    if (min != null && max != null) {
        return `₹${format(min)} – ₹${format(max)}`;
    }

    return min != null ? `From ₹${format(min)}` : `Up to ₹${format(max)}`;
};

const formatDate = (value) => {
    if (!value) return "No deadline";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? "No deadline"
        : date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
};

export default function RecruiterJobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [busyJobId, setBusyJobId] = useState(null);
    const [notice, setNotice] = useState("");

    const loadJobs = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const data = await getMyJobs();
            setJobs(Array.isArray(data) ? data : data?.content ?? []);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "We couldn't load your job listings. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    const filteredJobs = useMemo(() => {
        const query = search.trim().toLowerCase();

        return jobs.filter((job) => {
            const matchesSearch =
                !query ||
                [job.title, job.location, job.jobType, job.workMode]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(query));

            const matchesStatus =
                statusFilter === "ALL" || job.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [jobs, search, statusFilter]);

    const counts = useMemo(() => {
        const countStatus = (status) =>
            jobs.filter((job) => job.status === status).length;

        return {
            total: jobs.length,
            published: countStatus("PUBLISHED"),
            draft: countStatus("DRAFT"),
            closed: countStatus("CLOSED"),
        };
    }, [jobs]);

    const handleAction = async (job, action) => {
        const actionLabel = action === "publish" ? "publish" : "close";

        if (
            !window.confirm(
                `Are you sure you want to ${actionLabel} "${job.title}"?`
            )
        ) {
            return;
        }

        setBusyJobId(job.id);
        setNotice("");
        setError("");

        try {
            if (action === "publish") {
                await publishJob(job.id);
            } else {
                await closeJob(job.id);
            }

            setNotice(
                action === "publish"
                    ? "Job published successfully."
                    : "Job closed successfully."
            );

            await loadJobs();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                `Unable to ${actionLabel} this job. Check its status and try again.`
            );
        } finally {
            setBusyJobId(null);
        }
    };

    return (
        <main className="recruiter-page">
            <section className="recruiter-page-heading">
                <div>
                    <span className="recruiter-eyebrow">RECRUITER WORKSPACE</span>
                    <h1>My job listings</h1>
                    <p>Manage opportunities and keep your hiring pipeline moving.</p>
                </div>

                <Link to="/recruiter/jobs/new" className="recruiter-primary-button">
                    <span aria-hidden="true">＋</span> Create a job
                </Link>
            </section>

            <section className="recruiter-stats-grid" aria-label="Job listing summary">
                <article className="recruiter-stat-card">
                    <span className="recruiter-stat-icon">▤</span>
                    <span className="recruiter-stat-label">Total listings</span>
                    <strong>{counts.total}</strong>
                    <span className="recruiter-stat-footnote">Across all statuses</span>
                </article>

                <article className="recruiter-stat-card">
                    <span className="recruiter-stat-icon recruiter-stat-icon--green">↗</span>
                    <span className="recruiter-stat-label">Published</span>
                    <strong>{counts.published}</strong>
                    <span className="recruiter-stat-footnote">Visible to candidates</span>
                </article>

                <article className="recruiter-stat-card">
                    <span className="recruiter-stat-icon recruiter-stat-icon--amber">◷</span>
                    <span className="recruiter-stat-label">Drafts</span>
                    <strong>{counts.draft}</strong>
                    <span className="recruiter-stat-footnote">Not yet published</span>
                </article>

                <article className="recruiter-stat-card">
                    <span className="recruiter-stat-icon recruiter-stat-icon--slate">✓</span>
                    <span className="recruiter-stat-label">Closed</span>
                    <strong>{counts.closed}</strong>
                    <span className="recruiter-stat-footnote">No longer accepting applications</span>
                </article>
            </section>

            <section className="recruiter-listing-panel">
                <div className="recruiter-listing-toolbar">
                    <div>
                        <h2>Your opportunities</h2>
                        <p>Review and manage every job you've created.</p>
                    </div>

                    <label className="recruiter-search">
                        <span aria-hidden="true">⌕</span>
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search jobs or location"
                            aria-label="Search jobs or location"
                        />
                    </label>
                </div>

                <div className="recruiter-filter-row" aria-label="Filter jobs by status">
                    {["ALL", "DRAFT", "PUBLISHED", "CLOSED"].map((status) => (
                        <button
                            key={status}
                            type="button"
                            className={`recruiter-filter-chip ${
                                statusFilter === status ? "is-active" : ""
                            }`}
                            onClick={() => setStatusFilter(status)}
                            aria-pressed={statusFilter === status}
                        >
                            {status === "ALL"
                                ? "All jobs"
                                : status.charAt(0) + status.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>

                {notice && (
                    <div className="recruiter-alert recruiter-alert--success" role="status">
                        {notice}
                    </div>
                )}

                {error && (
                    <div className="recruiter-alert recruiter-alert--error" role="alert">
                        {error}
                        <button type="button" onClick={loadJobs}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <div className="recruiter-job-list">
                        {[1, 2, 3].map((item) => (
                            <div className="recruiter-job-skeleton" key={item} />
                        ))}
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="recruiter-empty-state">
                        <div className="recruiter-empty-icon">▤</div>
                        <h3>{jobs.length ? "No matching jobs" : "Your next hire starts here"}</h3>
                        <p>
                            {jobs.length
                                ? "Try changing the search term or status filter."
                                : "Create your first job listing to start receiving applications."}
                        </p>
                        {jobs.length === 0 && (
                            <Link
                                to="/recruiter/jobs/new"
                                className="recruiter-primary-button"
                            >
                                Create your first job
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="recruiter-job-list">
                        {filteredJobs.map((job) => (
                            <article className="recruiter-job-card" key={job.id}>
                                <div className="recruiter-job-main">
                                    <div className="recruiter-job-symbol" aria-hidden="true">
                                        {(job.title || "J").trim().charAt(0).toUpperCase()}
                                    </div>

                                    <div className="recruiter-job-content">
                                        <div className="recruiter-job-title-row">
                                            <h3>{job.title}</h3>
                                            <span className={statusClass(job.status)}>
                        {job.status || "UNKNOWN"}
                      </span>
                                        </div>

                                        <div className="recruiter-job-meta">
                                            {job.location || "Location not specified"}
                                            <span>·</span>
                                            {String(job.jobType || "").replaceAll("_", " ")}
                                            <span>·</span>
                                            {job.workMode || "Work mode not specified"}
                                        </div>

                                        <div className="recruiter-job-secondary">
                                            <span>{formatSalary(job.salaryMin, job.salaryMax)}</span>
                                            <span>Deadline: {formatDate(job.applicationDeadline)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="recruiter-job-actions">
                                    {job.status === "DRAFT" && (
                                        <button
                                            type="button"
                                            className="recruiter-action-button recruiter-action-button--primary"
                                            disabled={busyJobId === job.id}
                                            onClick={() => handleAction(job, "publish")}
                                        >
                                            {busyJobId === job.id ? "Working..." : "Publish"}
                                        </button>
                                    )}

                                    {job.status === "PUBLISHED" && (
                                        <button
                                            type="button"
                                            className="recruiter-action-button"
                                            disabled={busyJobId === job.id}
                                            onClick={() => handleAction(job, "close")}
                                        >
                                            {busyJobId === job.id ? "Working..." : "Close job"}
                                        </button>
                                    )}

                                    {(job.status === "DRAFT" || job.status === "PUBLISHED") && (
                                        <Link
                                            to={`/recruiter/jobs/${job.id}/edit`}
                                            className="recruiter-action-button"
                                        >
                                            Edit
                                        </Link>
                                    )}
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {!loading && filteredJobs.length > 0 && (
                    <div className="recruiter-listing-footer">
                        Showing {filteredJobs.length} of {jobs.length} listings
                    </div>
                )}
            </section>
        </main>
    );
}
