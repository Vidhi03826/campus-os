import { useEffect, useMemo, useState } from "react";
import {
    Bookmark,
    BriefcaseBusiness,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Filter,
    MapPin,
    RotateCcw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    getJobs,
    saveJob,
    unsaveJob,
} from "../../api/studentApi";

import "../../styles/student-jobs.css";

const PAGE_SIZE = 9;

const JOB_TYPES = [
    { value: "FULL_TIME", label: "Full time" },
    { value: "PART_TIME", label: "Part time" },
    { value: "INTERNSHIP", label: "Internship" },
];

const WORK_MODES = [
    { value: "REMOTE", label: "Remote" },
    { value: "HYBRID", label: "Hybrid" },
    { value: "ONSITE", label: "On-site" },
];

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

function formatPostedDate(value) {
    if (!value) {
        return "Recently posted";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Recently posted";
    }

    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days <= 0) {
        return "Posted today";
    }

    if (days === 1) {
        return "Posted yesterday";
    }

    if (days < 7) {
        return `Posted ${days} days ago`;
    }

    if (days < 30) {
        return `Posted ${Math.floor(days / 7)} weeks ago`;
    }

    return `Posted ${Math.floor(days / 30)} months ago`;
}

function formatDeadline(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function getInitials(name) {
    if (!name) {
        return "C";
    }

    const words = String(name)
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        fallback
    );
}

function JobCard({ job, onSave, savingId }) {
    const companyName =
        job.companyName ||
        job.company?.name ||
        "Company";

    const saved =
        job.saved ??
        job.isSaved ??
        false;

    const deadline = formatDeadline(
        job.applicationDeadline ||
        job.deadline
    );

    const postedAt =
        job.createdAt ||
        job.publishedAt ||
        job.updatedAt;

    const isSaving = savingId === job.id;

    return (
        <article className="sj-job-card">
            <div className="sj-job-card-head">
                <div className="sj-company-avatar">
                    {getInitials(companyName)}
                </div>

                <button
                    type="button"
                    className={`sj-save-button ${
                        saved ? "is-saved" : ""
                    }`}
                    onClick={() => onSave(job)}
                    disabled={isSaving}
                    aria-label={
                        saved
                            ? `Remove ${job.title} from saved jobs`
                            : `Save ${job.title}`
                    }
                    title={
                        saved
                            ? "Remove from saved jobs"
                            : "Save job"
                    }
                >
                    <Bookmark
                        size={18}
                        strokeWidth={2}
                        fill={saved ? "currentColor" : "none"}
                    />
                </button>
            </div>

            <div className="sj-job-card-body">
                <span className="sj-company-name">
                    {companyName}
                </span>

                <Link
                    to={`/student/jobs/${job.id}`}
                    className="sj-job-title"
                >
                    {job.title || "Untitled opportunity"}
                </Link>

                <div className="sj-job-meta">
                    <span>
                        <MapPin size={14} />
                        {job.location || "Remote"}
                    </span>

                    <span>
                        <BriefcaseBusiness size={14} />
                        {formatEnum(job.jobType)}
                    </span>
                </div>

                <div className="sj-job-tags">
                    {job.workMode && (
                        <span className="sj-tag">
                            {formatEnum(job.workMode)}
                        </span>
                    )}

                    {job.experienceMin != null && (
                        <span className="sj-tag">
                            {job.experienceMin}
                            {job.experienceMax != null
                                ? `–${job.experienceMax}`
                                : "+"}{" "}
                            yrs
                        </span>
                    )}

                    {job.experienceMax == null &&
                        job.experienceMin == null && (
                            <span className="sj-tag">
                                All experience levels
                            </span>
                        )}
                </div>
            </div>

            <div className="sj-job-card-footer">
                <div className="sj-job-footer-info">
                    <strong>
                        {formatSalary(
                            job.salaryMin,
                            job.salaryMax
                        )}
                    </strong>

                    <span>
                        <Clock3 size={12} />
                        {formatPostedDate(postedAt)}
                    </span>
                </div>

                <Link
                    to={`/student/jobs/${job.id}`}
                    className="sj-view-button"
                >
                    View role
                    <ChevronRight size={16} />
                </Link>
            </div>

            {deadline && (
                <div className="sj-deadline">
                    <span>Apply by</span>
                    <strong>{deadline}</strong>
                </div>
            )}
        </article>
    );
}

function JobSkeleton() {
    return (
        <div className="sj-job-skeleton">
            <div className="sj-skeleton-top">
                <div className="sj-skeleton-avatar" />
                <div className="sj-skeleton-circle" />
            </div>

            <div className="sj-skeleton-line short" />
            <div className="sj-skeleton-line title" />
            <div className="sj-skeleton-line medium" />

            <div className="sj-skeleton-tags">
                <div />
                <div />
            </div>

            <div className="sj-skeleton-footer">
                <div className="sj-skeleton-line salary" />
                <div className="sj-skeleton-button" />
            </div>
        </div>
    );
}

function FilterContent({
                           location,
                           setLocation,
                           jobType,
                           setJobType,
                           workMode,
                           setWorkMode,
                           onApply,
                           onClear,
                           mobile = false,
                       }) {
    return (
        <div className={`sj-filter-content ${
            mobile ? "mobile" : ""
        }`}>
            <div className="sj-filter-section">
                <label htmlFor={mobile ? "mobile-location" : "location"}>
                    Location
                </label>

                <div className="sj-filter-input-wrap">
                    <MapPin size={16} />

                    <input
                        id={mobile ? "mobile-location" : "location"}
                        type="text"
                        placeholder="e.g. Bangalore"
                        value={location}
                        onChange={(event) =>
                            setLocation(event.target.value)
                        }
                    />
                </div>
            </div>

            <div className="sj-filter-section">
                <span className="sj-filter-label">
                    Job type
                </span>

                <div className="sj-option-list">
                    {JOB_TYPES.map((type) => (
                        <label
                            className="sj-check-option"
                            key={type.value}
                        >
                            <input
                                type="radio"
                                name={
                                    mobile
                                        ? "mobile-job-type"
                                        : "job-type"
                                }
                                checked={
                                    jobType === type.value
                                }
                                onChange={() =>
                                    setJobType(type.value)
                                }
                            />

                            <span className="sj-custom-radio">
                                {jobType === type.value && (
                                    <span />
                                )}
                            </span>

                            <span>{type.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="sj-filter-section">
                <span className="sj-filter-label">
                    Work mode
                </span>

                <div className="sj-option-list">
                    {WORK_MODES.map((mode) => (
                        <label
                            className="sj-check-option"
                            key={mode.value}
                        >
                            <input
                                type="radio"
                                name={
                                    mobile
                                        ? "mobile-work-mode"
                                        : "work-mode"
                                }
                                checked={
                                    workMode === mode.value
                                }
                                onChange={() =>
                                    setWorkMode(mode.value)
                                }
                            />

                            <span className="sj-custom-radio">
                                {workMode === mode.value && (
                                    <span />
                                )}
                            </span>

                            <span>{mode.label}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="sj-filter-actions">
                <button
                    type="button"
                    className="sj-clear-filter-button"
                    onClick={onClear}
                >
                    <RotateCcw size={14} />
                    Clear filters
                </button>

                {mobile && (
                    <button
                        type="button"
                        className="sj-apply-filter-button"
                        onClick={onApply}
                    >
                        <Check size={16} />
                        Apply filters
                    </button>
                )}
            </div>
        </div>
    );
}

function Jobs() {
    const [jobs, setJobs] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [locationInput, setLocationInput] = useState("");
    const [jobTypeInput, setJobTypeInput] = useState("");
    const [workModeInput, setWorkModeInput] = useState("");

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

    const [savingId, setSavingId] = useState(null);
    const [showMobileFilters, setShowMobileFilters] =
        useState(false);

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
                size: PAGE_SIZE,
                sort,
            });

            const content =
                response?.content ??
                response?.jobs ??
                response?.data ??
                response;

            const jobList = Array.isArray(content)
                ? content
                : [];

            setJobs(jobList);

            setTotalPages(
                Number(response?.totalPages ?? 1)
            );

            setTotalElements(
                Number(
                    response?.totalElements ??
                    jobList.length
                )
            );
        } catch (err) {
            console.error(
                "Failed to load jobs:",
                err
            );

            setError(
                getErrorMessage(
                    err,
                    "Unable to load opportunities right now."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, [
        page,
        sort,
        search,
        location,
        jobType,
        workMode,
    ]);

    const activeFilterCount = useMemo(() => {
        return [
            location,
            jobType,
            workMode,
        ].filter(Boolean).length;
    }, [location, jobType, workMode]);

    const hasActiveFilters =
        Boolean(search) ||
        Boolean(location) ||
        Boolean(jobType) ||
        Boolean(workMode);

    const applyFilters = () => {
        setSearch(searchInput.trim());
        setLocation(locationInput.trim());
        setJobType(jobTypeInput);
        setWorkMode(workModeInput);
        setPage(0);
        setShowMobileFilters(false);
    };

    const handleSearch = (event) => {
        event.preventDefault();

        setSearch(searchInput.trim());
        setLocation(locationInput.trim());
        setJobType(jobTypeInput);
        setWorkMode(workModeInput);
        setPage(0);
    };

    const clearFilters = () => {
        setSearchInput("");
        setLocationInput("");
        setJobTypeInput("");
        setWorkModeInput("");

        setSearch("");
        setLocation("");
        setJobType("");
        setWorkMode("");

        setPage(0);
    };

    const handleSave = async (job) => {
        if (savingId === job.id) {
            return;
        }

        const currentlySaved =
            job.saved ??
            job.isSaved ??
            false;

        try {
            setSavingId(job.id);
            setError("");

            if (currentlySaved) {
                await unsaveJob(job.id);
            } else {
                await saveJob(job.id);
            }

            setJobs((currentJobs) =>
                currentJobs.map((currentJob) => {
                    if (currentJob.id !== job.id) {
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
                getErrorMessage(
                    err,
                    "Unable to update saved job."
                )
            );
        } finally {
            setSavingId(null);
        }
    };

    const handleSortChange = (event) => {
        setSort(event.target.value);
        setPage(0);
    };

    return (
        <div className="sj-page">
            <section className="sj-hero">
                <div className="sj-hero-copy">
                    <span className="sj-eyebrow">
                        OPPORTUNITY DISCOVERY
                    </span>

                    <h1>
                        Find work worth
                        <span> applying for.</span>
                    </h1>

                    <p>
                        Discover internships and jobs,
                        compare opportunities and save the
                        ones worth pursuing.
                    </p>
                </div>

                <div className="sj-hero-stat">
                    <strong>
                        {loading ? "—" : totalElements}
                    </strong>

                    <span>
                        opportunities
                    </span>
                </div>
            </section>

            <form
                className="sj-search-panel"
                onSubmit={handleSearch}
            >
                <div className="sj-search-main">
                    <Search size={20} />

                    <input
                        type="text"
                        placeholder="Search jobs, skills or companies..."
                        value={searchInput}
                        onChange={(event) =>
                            setSearchInput(
                                event.target.value
                            )
                        }
                    />
                </div>

                <div className="sj-search-location">
                    <MapPin size={18} />

                    <input
                        type="text"
                        placeholder="Location"
                        value={locationInput}
                        onChange={(event) =>
                            setLocationInput(
                                event.target.value
                            )
                        }
                    />
                </div>

                <button
                    type="submit"
                    className="sj-search-button"
                >
                    Search
                </button>
            </form>

            <div className="sj-mobile-toolbar">
                <button
                    type="button"
                    onClick={() =>
                        setShowMobileFilters(true)
                    }
                >
                    <Filter size={17} />
                    Filters

                    {activeFilterCount > 0 && (
                        <span>
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                <select
                    value={sort}
                    onChange={handleSortChange}
                    aria-label="Sort jobs"
                >
                    <option value="createdAt,desc">
                        Newest
                    </option>

                    <option value="createdAt,asc">
                        Oldest
                    </option>

                    <option value="title,asc">
                        Title A–Z
                    </option>
                </select>
            </div>

            <div className="sj-layout">
                <aside className="sj-filter-sidebar">
                    <div className="sj-filter-heading">
                        <div>
                            <SlidersHorizontal size={17} />
                            <strong>Filters</strong>
                        </div>

                        {activeFilterCount > 0 && (
                            <span>
                                {activeFilterCount}
                            </span>
                        )}
                    </div>

                    <FilterContent
                        location={locationInput}
                        setLocation={setLocationInput}
                        jobType={jobTypeInput}
                        setJobType={setJobTypeInput}
                        workMode={workModeInput}
                        setWorkMode={setWorkModeInput}
                        onApply={applyFilters}
                        onClear={clearFilters}
                    />
                </aside>

                <main className="sj-results">
                    <div className="sj-results-toolbar">
                        <div>
                            <span className="sj-results-label">
                                {loading
                                    ? "Finding opportunities..."
                                    : `${totalElements} ${
                                        totalElements === 1
                                            ? "opportunity"
                                            : "opportunities"
                                    } found`}
                            </span>

                            {hasActiveFilters && (
                                <div className="sj-active-filters">
                                    {search && (
                                        <span>
                                            Search: “{search}”
                                        </span>
                                    )}

                                    {location && (
                                        <span>
                                            {location}
                                        </span>
                                    )}

                                    {jobType && (
                                        <span>
                                            {formatEnum(jobType)}
                                        </span>
                                    )}

                                    {workMode && (
                                        <span>
                                            {formatEnum(workMode)}
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                    >
                                        Clear all
                                        <X size={13} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="sj-sort">
                            <label htmlFor="job-sort">
                                Sort by
                            </label>

                            <select
                                id="job-sort"
                                value={sort}
                                onChange={handleSortChange}
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
                    </div>

                    {error && (
                        <div className="sj-error">
                            <div>
                                <strong>
                                    Something went wrong
                                </strong>

                                <span>{error}</span>
                            </div>

                            <button
                                type="button"
                                onClick={loadJobs}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="sj-job-grid">
                            {Array.from({
                                length: 6,
                            }).map((_, index) => (
                                <JobSkeleton
                                    key={index}
                                />
                            ))}
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        jobs.length === 0 && (
                            <div className="sj-empty">
                                <div className="sj-empty-icon">
                                    <BriefcaseBusiness
                                        size={27}
                                    />
                                </div>

                                <h2>
                                    No opportunities found
                                </h2>

                                <p>
                                    We couldn't find roles
                                    matching your current
                                    search. Try broadening
                                    your filters.
                                </p>

                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                    >
                                        <RotateCcw size={15} />
                                        Clear filters
                                    </button>
                                )}
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        jobs.length > 0 && (
                            <>
                                <div className="sj-job-grid">
                                    {jobs.map((job) => (
                                        <JobCard
                                            key={job.id}
                                            job={job}
                                            onSave={handleSave}
                                            savingId={savingId}
                                        />
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="sj-pagination">
                                        <button
                                            type="button"
                                            disabled={page === 0}
                                            onClick={() =>
                                                setPage(
                                                    (current) =>
                                                        current - 1
                                                )
                                            }
                                            aria-label="Previous page"
                                        >
                                            <ChevronLeft
                                                size={18}
                                            />
                                        </button>

                                        <span>
                                            Page{" "}
                                            <strong>
                                                {page + 1}
                                            </strong>{" "}
                                            of{" "}
                                            <strong>
                                                {totalPages}
                                            </strong>
                                        </span>

                                        <button
                                            type="button"
                                            disabled={
                                                page >=
                                                totalPages - 1
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (current) =>
                                                        current + 1
                                                )
                                            }
                                            aria-label="Next page"
                                        >
                                            <ChevronRight
                                                size={18}
                                            />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                </main>
            </div>

            {showMobileFilters && (
                <div
                    className="sj-filter-overlay"
                    onClick={() =>
                        setShowMobileFilters(false)
                    }
                >
                    <aside
                        className="sj-mobile-filter-drawer"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="sj-mobile-filter-header">
                            <div>
                                <SlidersHorizontal
                                    size={18}
                                />

                                <strong>
                                    Filters
                                </strong>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowMobileFilters(
                                        false
                                    )
                                }
                                aria-label="Close filters"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <FilterContent
                            mobile
                            location={locationInput}
                            setLocation={setLocationInput}
                            jobType={jobTypeInput}
                            setJobType={setJobTypeInput}
                            workMode={workModeInput}
                            setWorkMode={setWorkModeInput}
                            onApply={applyFilters}
                            onClear={clearFilters}
                        />
                    </aside>
                </div>
            )}
        </div>
    );
}

export default Jobs;