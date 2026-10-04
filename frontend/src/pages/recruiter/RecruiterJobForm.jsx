
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createJob, getMyJobs, updateJob } from "../../api/recruiterApi";
import "../../styles/recruiter.css";

const initialForm = {
    title: "",
    description: "",
    location: "",
    jobType: "INTERNSHIP",
    workMode: "REMOTE",
    experienceMin: "0",
    experienceMax: "1",
    salaryMin: "",
    salaryMax: "",
    applicationDeadline: "",
};

const toLocalDateTime = (value) => {
    if (!value) return "";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const localDate = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000
    );

    return localDate.toISOString().slice(0, 16);
};

const getErrorMessage = (error) => {
    const data = error.response?.data;

    if (typeof data?.message === "string") return data.message;
    if (typeof data?.detail === "string") return data.detail;

    if (data?.errors && typeof data.errors === "object") {
        return Object.values(data.errors).join(" ");
    }

    return "Something went wrong. Please check the form and try again.";
};

export default function RecruiterJobForm() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(jobId);

    const [form, setForm] = useState(initialForm);
    const [loadingJob, setLoadingJob] = useState(isEditing);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!isEditing) return;

        let cancelled = false;

        const loadJob = async () => {
            setLoadingJob(true);
            setError("");

            try {
                const data = await getMyJobs();
                const jobs = Array.isArray(data) ? data : data?.content ?? [];
                const job = jobs.find((item) => String(item.id) === String(jobId));

                if (!job) {
                    throw new Error(
                        "This job could not be found in your recruiter listings."
                    );
                }

                if (cancelled) return;

                setForm({
                    title: job.title ?? "",
                    description: job.description ?? "",
                    location: job.location ?? "",
                    jobType: job.jobType ?? "INTERNSHIP",
                    workMode: job.workMode ?? "REMOTE",
                    experienceMin: job.experienceMin ?? "",
                    experienceMax: job.experienceMax ?? "",
                    salaryMin: job.salaryMin ?? "",
                    salaryMax: job.salaryMax ?? "",
                    applicationDeadline: toLocalDateTime(job.applicationDeadline),
                });
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message ||
                        getErrorMessage(err) ||
                        "Unable to load this job."
                    );
                }
            } finally {
                if (!cancelled) setLoadingJob(false);
            }
        };

        loadJob();

        return () => {
            cancelled = true;
        };
    }, [isEditing, jobId]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        const experienceMin =
            form.experienceMin === "" ? null : Number(form.experienceMin);
        const experienceMax =
            form.experienceMax === "" ? null : Number(form.experienceMax);
        const salaryMin = form.salaryMin === "" ? null : Number(form.salaryMin);
        const salaryMax = form.salaryMax === "" ? null : Number(form.salaryMax);

        if (
            experienceMin !== null &&
            experienceMax !== null &&
            experienceMin > experienceMax
        ) {
            setError("Minimum experience cannot exceed maximum experience.");
            return;
        }

        if (
            salaryMin !== null &&
            salaryMax !== null &&
            salaryMin > salaryMax
        ) {
            setError("Minimum salary cannot exceed maximum salary.");
            return;
        }

        if (
            (experienceMin !== null && experienceMin < 0) ||
            (experienceMax !== null && experienceMax < 0)
        ) {
            setError("Experience cannot be negative.");
            return;
        }

        if (
            (salaryMin !== null && salaryMin < 0) ||
            (salaryMax !== null && salaryMax < 0)
        ) {
            setError("Salary cannot be negative.");
            return;
        }

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            location: form.location.trim() || null,
            jobType: form.jobType,
            workMode: form.workMode,
            experienceMin,
            experienceMax,
            salaryMin,
            salaryMax,
            applicationDeadline: form.applicationDeadline
                ? new Date(form.applicationDeadline).toISOString()
                : null,
        };

        setSubmitting(true);

        try {
            if (isEditing) {
                await updateJob(jobId, payload);
            } else {
                await createJob(payload);
            }

            navigate("/recruiter/jobs", {
                replace: true,
                state: {
                    message: isEditing
                        ? "Job listing updated successfully."
                        : "Job listing created successfully.",
                },
            });
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingJob) {
        return (
            <main className="recruiter-page">
                <div className="recruiter-form-loading">
                    <div className="recruiter-job-skeleton" />
                    <div className="recruiter-job-skeleton" />
                </div>
            </main>
        );
    }

    return (
        <main className="recruiter-page">
            <div className="recruiter-form-back">
                <Link to="/recruiter/jobs">← Back to my jobs</Link>
            </div>

            <section className="recruiter-form-heading">
                <span className="recruiter-eyebrow">JOB MANAGEMENT</span>
                <h1>{isEditing ? "Edit job listing" : "Create a new opportunity"}</h1>
                <p>
                    {isEditing
                        ? "Keep the role details accurate and up to date."
                        : "Share a clear, complete opportunity with potential candidates."}
                </p>
            </section>

            {error && (
                <div className="recruiter-alert recruiter-alert--error" role="alert">
                    {error}
                </div>
            )}

            <form className="recruiter-form" onSubmit={handleSubmit}>
                <section className="recruiter-form-section">
                    <div className="recruiter-form-section-heading">
                        <span className="recruiter-form-step">01</span>
                        <div>
                            <h2>Role details</h2>
                            <p>Tell candidates what the opportunity is about.</p>
                        </div>
                    </div>

                    <div className="recruiter-form-grid">
                        <div className="recruiter-field recruiter-field--full">
                            <label htmlFor="title">Job title <span>*</span></label>
                            <input
                                id="title"
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                maxLength={200}
                                placeholder="e.g. Java Backend Developer Intern"
                                required
                            />
                            <small>{form.title.length}/200 characters</small>
                        </div>

                        <div className="recruiter-field recruiter-field--full">
                            <label htmlFor="description">Job description <span>*</span></label>
                            <textarea
                                id="description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                maxLength={10000}
                                rows={8}
                                placeholder="Describe the role, responsibilities, and what the candidate will work on..."
                                required
                            />
                            <small>{form.description.length}/10,000 characters</small>
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="location">Location</label>
                            <input
                                id="location"
                                name="location"
                                value={form.location}
                                onChange={handleChange}
                                maxLength={200}
                                placeholder="e.g. Indore, Madhya Pradesh"
                            />
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="applicationDeadline">Application deadline</label>
                            <input
                                id="applicationDeadline"
                                name="applicationDeadline"
                                type="datetime-local"
                                value={form.applicationDeadline}
                                onChange={handleChange}
                            />
                            <small>Leave blank if there is no deadline.</small>
                        </div>
                    </div>
                </section>

                <section className="recruiter-form-section">
                    <div className="recruiter-form-section-heading">
                        <span className="recruiter-form-step">02</span>
                        <div>
                            <h2>Employment details</h2>
                            <p>Set the work arrangement and employment type.</p>
                        </div>
                    </div>

                    <div className="recruiter-form-grid">
                        <div className="recruiter-field">
                            <label htmlFor="jobType">Job type <span>*</span></label>
                            <select
                                id="jobType"
                                name="jobType"
                                value={form.jobType}
                                onChange={handleChange}
                                required
                            >
                                <option value="INTERNSHIP">Internship</option>
                                <option value="FULL_TIME">Full-time</option>
                                <option value="PART_TIME">Part-time</option>
                                <option value="CONTRACT">Contract</option>
                            </select>
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="workMode">Work mode <span>*</span></label>
                            <select
                                id="workMode"
                                name="workMode"
                                value={form.workMode}
                                onChange={handleChange}
                                required
                            >
                                <option value="REMOTE">Remote</option>
                                <option value="HYBRID">Hybrid</option>
                                <option value="ONSITE">On-site</option>
                            </select>
                        </div>
                    </div>
                </section>

                <section className="recruiter-form-section">
                    <div className="recruiter-form-section-heading">
                        <span className="recruiter-form-step">03</span>
                        <div>
                            <h2>Experience and compensation</h2>
                            <p>These fields are optional, but help candidates understand the role.</p>
                        </div>
                    </div>

                    <div className="recruiter-form-grid">
                        <div className="recruiter-field">
                            <label htmlFor="experienceMin">Minimum experience (years)</label>
                            <input
                                id="experienceMin"
                                name="experienceMin"
                                type="number"
                                min="0"
                                step="1"
                                value={form.experienceMin}
                                onChange={handleChange}
                                placeholder="0"
                            />
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="experienceMax">Maximum experience (years)</label>
                            <input
                                id="experienceMax"
                                name="experienceMax"
                                type="number"
                                min="0"
                                step="1"
                                value={form.experienceMax}
                                onChange={handleChange}
                                placeholder="1"
                            />
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="salaryMin">Minimum salary (₹)</label>
                            <input
                                id="salaryMin"
                                name="salaryMin"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.salaryMin}
                                onChange={handleChange}
                                placeholder="e.g. 10000"
                            />
                        </div>

                        <div className="recruiter-field">
                            <label htmlFor="salaryMax">Maximum salary (₹)</label>
                            <input
                                id="salaryMax"
                                name="salaryMax"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.salaryMax}
                                onChange={handleChange}
                                placeholder="e.g. 15000"
                            />
                        </div>
                    </div>
                </section>

                <div className="recruiter-form-footer">
                    <Link to="/recruiter/jobs" className="recruiter-action-button">
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        className="recruiter-primary-button"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Saving..."
                            : isEditing
                                ? "Save changes"
                                : "Create job listing"}
                    </button>
                </div>
            </form>
        </main>
    );
}
