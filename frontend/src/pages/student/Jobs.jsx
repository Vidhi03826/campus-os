import { useEffect, useState } from "react";
import {
    Bookmark,
    BriefcaseBusiness,
    ChevronLeft,
    ChevronRight,
    Clock3,
    MapPin,
    Search,
    SlidersHorizontal,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    getJobs,
    saveJob,
    unsaveJob,
} from "../../api/studentApi";

function formatJobType(value) {
    if (!value) {
        return "Full Time";
    }

    return value
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

function JobCard({ job, onSave }) {
    const companyName =
        job.companyName ||
        job.company?.name ||
        "Company";

    const saved =
        job.saved ??
        job.isSaved ??
        false;

    return (
        <article className="job-card">
            <div className="job-card-top">
                <div className="company-logo">
                    {companyName
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <button
                    className={`save-job-button ${
                        saved ? "saved" : ""
                    }`}
                    onClick={() => onSave(job)}
                    aria-label={
                        saved
                            ? "Remove saved job"
                            : "Save job"
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
            </div>

            <div className="job-card-content">
                <div className="job-company">
                    {companyName}
                </div>

                <h3>
                    {job.title}
                </h3>

                <div className="job-meta">
                    <span>
                        <MapPin size={14} />
                        {job.location || "Remote"}
                    </span>

                    <span>
                        <BriefcaseBusiness size={14} />
                        {formatJobType(job.jobType)}
                    </span>
                </div>

                <div className="job-tags">
                    {job.workMode && (
                        <span className="job-tag">
                            {formatJobType(job.workMode)}
                        </span>
                    )}

                    {job.experienceMin != null && (
                        <span className="job-tag">
                            {job.experienceMin}+
                            {" "}
                            yrs
                        </span>
                    )}
                </div>
            </div>

            <div className="job-card-footer">
                <div>
                    <strong>
                        {formatSalary(
                            job.salaryMin,
                            job.salaryMax
                        )}
                    </strong>

                    <span>
                        <Clock3 size={12} />
                        Recently posted
                    </span>
                </div>

                <Link
                    to={`/student/jobs/${job.id}`}
                    className="view-job-button"
                >
                    View details
                </Link>
            </div>
        </article>
    );
}

function Jobs() {
    const [jobs, setJobs] = useState([]);

    const [search, setSearch] = useState("");
    const [location, setLocation] = useState("");
    const [jobType, setJobType] = useState("");
    const [workMode, setWorkMode] = useState("");
    const [sort, setSort] = useState("createdAt,desc");

    const [page, setPage] = useState(0);

    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadJobs = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getJobs({
                keyword: search || undefined,
                location: location || undefined,
                jobType: jobType || undefined,
                workMode: workMode || undefined,
                page,
                size: 9,
                sort,
            });

            const content =
                response.content ??
                response.jobs ??
                response;

            const jobList = Array.isArray(content)
                ? content
                : [];

            setJobs(jobList);

            setTotalPages(
                response.totalPages ??
                1
            );

            setTotalElements(
                response.totalElements ??
                jobList.length
            );
        } catch (err) {
            console.error(
                "Failed to load jobs:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load opportunities right now."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, [page, sort]);

    const handleSearch = async (event) => {
        event.preventDefault();

        setPage(0);

        /*
         * Search should use the latest input values.
         * Calling directly here avoids relying on the old page state.
         */
        try {
            setLoading(true);
            setError("");

            const response = await getJobs({
                keyword: search || undefined,
                location: location || undefined,
                jobType: jobType || undefined,
                workMode: workMode || undefined,
                page: 0,
                size: 9,
                sort,
            });

            const content =
                response.content ??
                response.jobs ??
                response;

            const jobList = Array.isArray(content)
                ? content
                : [];

            setJobs(jobList);

            setTotalPages(
                response.totalPages ??
                1
            );

            setTotalElements(
                response.totalElements ??
                jobList.length
            );
        } catch (err) {
            console.error(
                "Search jobs failed:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to search jobs right now."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (job) => {
        const jobId = job.id;

        const currentlySaved =
            job.saved ??
            job.isSaved ??
            false;

        try {
            if (currentlySaved) {
                await unsaveJob(jobId);
            } else {
                await saveJob(jobId);
            }

            setJobs((currentJobs) =>
                currentJobs.map((currentJob) => {
                    if (currentJob.id !== jobId) {
                        return currentJob;
                    }

                    return {
                        ...currentJob,
                        saved: !currentlySaved,
                        isSaved: !currentlySaved,
                    };
                })
            );
        } catch (err) {
            console.error(
                "Failed to update saved job:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to update saved job."
            );
        }
    };

    return (
        <div className="jobs-page">

            <section className="jobs-header">
                <div>
                    <span className="eyebrow">
                        OPPORTUNITY DISCOVERY
                    </span>

                    <h1>
                        Find your next opportunity
                    </h1>

                    <p>
                        Search roles, discover companies and
                        keep track of opportunities worth pursuing.
                    </p>
                </div>

                <div className="jobs-count">
                    <strong>
                        {totalElements}
                    </strong>

                    <span>
                        opportunities
                    </span>
                </div>
            </section>

            <form
                className="job-search-panel"
                onSubmit={handleSearch}
            >
                <div className="job-search-field">
                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search jobs, skills or companies..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />
                </div>

                <input
                    className="job-filter-input"
                    placeholder="Location"
                    value={location}
                    onChange={(e) =>
                        setLocation(e.target.value)
                    }
                />

                <select
                    className="job-filter-select"
                    value={jobType}
                    onChange={(e) => {
                        setJobType(e.target.value);
                        setPage(0);
                    }}
                >
                    <option value="">
                        All job types
                    </option>

                    <option value="FULL_TIME">
                        Full time
                    </option>

                    <option value="PART_TIME">
                        Part time
                    </option>

                    <option value="INTERNSHIP">
                        Internship
                    </option>
                </select>

                <select
                    className="job-filter-select"
                    value={workMode}
                    onChange={(e) => {
                        setWorkMode(e.target.value);
                        setPage(0);
                    }}
                >
                    <option value="">
                        All work modes
                    </option>

                    <option value="REMOTE">
                        Remote
                    </option>

                    <option value="HYBRID">
                        Hybrid
                    </option>

                    <option value="ONSITE">
                        On-site
                    </option>
                </select>

                <button
                    type="submit"
                    className="primary-button"
                >
                    Search
                </button>
            </form>

            <div className="jobs-toolbar">
                <div className="jobs-toolbar-left">
                    <SlidersHorizontal size={16} />

                    <span>
                        Refine your search
                    </span>
                </div>

                <select
                    className="sort-select"
                    value={sort}
                    onChange={(e) => {
                        setSort(e.target.value);
                        setPage(0);
                    }}
                >
                    <option value="createdAt,desc">
                        Newest first
                    </option>

                    <option value="createdAt,asc">
                        Oldest first
                    </option>

                    <option value="title,asc">
                        Title A–Z
                    </option>
                </select>
            </div>

            {error && (
                <div className="jobs-message error">
                    <span>{error}</span>

                    <button onClick={loadJobs}>
                        Retry
                    </button>
                </div>
            )}

            {loading && (
                <div className="job-grid">
                    {Array.from({ length: 6 }).map(
                        (_, index) => (
                            <div
                                className="job-skeleton"
                                key={index}
                            />
                        )
                    )}
                </div>
            )}

            {!loading &&
                !error &&
                jobs.length === 0 && (
                    <div className="jobs-empty">
                        <div className="jobs-empty-icon">
                            <BriefcaseBusiness size={26} />
                        </div>

                        <h3>
                            No matching opportunities
                        </h3>

                        <p>
                            Try adjusting your search or filters.
                        </p>
                    </div>
                )}

            {!loading &&
                !error &&
                jobs.length > 0 && (
                    <>
                        <div className="job-grid">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onSave={handleSave}
                                />
                            ))}
                        </div>

                        <div className="pagination">
                            <button
                                disabled={page === 0}
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current - 1
                                    )
                                }
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <span>
                                Page {page + 1}
                                {totalPages > 0 &&
                                    ` of ${totalPages}`}
                            </span>

                            <button
                                disabled={
                                    totalPages > 0 &&
                                    page >= totalPages - 1
                                }
                                onClick={() =>
                                    setPage(
                                        (current) =>
                                            current + 1
                                    )
                                }
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </>
                )}
        </div>
    );
}

export default Jobs;