
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../api/authApi";
import {
    getMyStudentProfile,
    createStudentProfile,
    updateStudentProfile,
    getResumeMetadata,
} from "../../api/studentApi";
import "../../styles/student-profile.css";

const initialForm = {
    college: "",
    degree: "B.Tech",
    branch: "",
    graduationYear: 2028,
    bio: "",
};

function getInitials(name = "") {
    return (
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("") || "ST"
    );
}

function Icon({ name, size = 20 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": true,
    };

    const paths = {
        user: (
            <>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
            </>
        ),
        academic: (
            <>
                <path d="m2 10 10-5 10 5-10 5-10-5Z" />
                <path d="M6 12v5c3.5 3 8.5 3 12 0v-5" />
                <path d="M22 10v6" />
            </>
        ),
        file: (
            <>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6M8 13h8M8 17h8" />
            </>
        ),
        check: <path d="m5 12 4 4L19 6" />,
        arrow: <path d="M7 17 17 7M7 7h10v10" />,
        sparkles: (
            <>
                <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
                <path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" />
            </>
        ),
    };

    return <svg {...common}>{paths[name] || paths.user}</svg>;
}

function LoadingProfile() {
    return (
        <main className="student-profile-page">
            <div className="sp-skeleton sp-skeleton-heading" />
            <div className="sp-layout">
                <div className="sp-skeleton sp-skeleton-card" />
                <div className="sp-skeleton sp-skeleton-card sp-skeleton-side" />
            </div>
        </main>
    );
}

export default function Profile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [resume, setResume] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    async function loadProfile() {
        setLoading(true);
        setError("");
        setMessage("");

        try {
            const userData = await getCurrentUser();
            setUser(userData);

            const results = await Promise.allSettled([
                getMyStudentProfile(),
                getResumeMetadata(),
            ]);

            const profileResult = results[0];

            if (profileResult.status === "fulfilled") {
                const data = profileResult.value;

                setProfile(data);
                setForm({
                    college: data.college || "",
                    degree: data.degree || "",
                    branch: data.branch || "",
                    graduationYear: data.graduationYear || "",
                    bio: data.bio || "",
                });
            } else if (
                profileResult.reason?.response?.status === 404
            ) {
                // A missing profile means the student can create one.
                setProfile(null);
                setForm(initialForm);
            } else {
                throw profileResult.reason;
            }

            const resumeResult = results[1];

            setResume(
                resumeResult.status === "fulfilled"
                    ? resumeResult.value
                    : null
            );
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "We couldn't load your profile. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfile();
    }, []);

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
        setMessage("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (!form.college.trim()) {
            setError("Please enter your college or university.");
            return;
        }

        const year = form.graduationYear
            ? Number(form.graduationYear)
            : null;

        if (
            year !== null &&
            (!Number.isInteger(year) || year < 2000 || year > 2100)
        ) {
            setError("Enter a valid graduation year between 2000 and 2100.");
            return;
        }

        setSaving(true);
        setError("");
        setMessage("");

        try {
            const payload = {
                college: form.college.trim(),
                degree: form.degree.trim() || null,
                branch: form.branch.trim() || null,
                graduationYear: year,
                bio: form.bio.trim() || null,
            };

            const saved = profile
                ? await updateStudentProfile(payload)
                : await createStudentProfile(payload);

            setProfile(saved);
            setForm({
                college: saved.college || "",
                degree: saved.degree || "",
                branch: saved.branch || "",
                graduationYear: saved.graduationYear || "",
                bio: saved.bio || "",
            });

            setMessage("Your student profile has been saved successfully.");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                "We couldn't save your profile. Please try again."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return <LoadingProfile />;
    }

    if (!user) {
        return (
            <main className="student-profile-page">
                <section className="sp-error-state">
                    <div className="sp-icon-tile">
                        <Icon name="user" size={25} />
                    </div>
                    <h2>Couldn't load your profile</h2>
                    <p>{error || "Please check your connection and try again."}</p>
                    <button
                        className="sp-button sp-button-primary"
                        onClick={loadProfile}
                        type="button"
                    >
                        Try again
                    </button>
                </section>
            </main>
        );
    }

    const completionFields = [
        form.college,
        form.degree,
        form.branch,
        form.graduationYear,
        form.bio,
    ];

    const completedFields = completionFields.filter(
        (value) => String(value ?? "").trim() !== ""
    ).length;

    const completion = Math.round(
        (completedFields / completionFields.length) * 100
    );

    const isComplete = completion === 100;

    return (
        <main className="student-profile-page">
            <header className="sp-page-header">
                <div>
                    <div className="sp-eyebrow">
                        <span className="sp-eyebrow-dot" />
                        STUDENT WORKSPACE
                    </div>

                    <h1>My Profile</h1>
                    <p className="sp-page-subtitle">
                        Tell your story. Build your professional presence.
                    </p>
                </div>

                <div className="sp-header-status">
                    <span
                        className={`sp-status-dot ${
                            profile ? "sp-status-dot-green" : ""
                        }`}
                    />
                    {profile ? "Profile created" : "Setup in progress"}
                </div>
            </header>

            <section className="sp-identity-card">
                <div className="sp-avatar">
                    {getInitials(user.name)}
                </div>

                <div className="sp-identity-info">
                    <h2>{user.name || "Student"}</h2>
                    <p>{user.email}</p>
                    <span className="sp-role-pill">
                        <Icon name="academic" size={14} />
                        Student
                    </span>
                </div>

                <div className="sp-identity-decoration" aria-hidden="true">
                    <Icon name="sparkles" size={46} />
                </div>
            </section>

            <section
                className="sp-progress-card"
                aria-label="Profile completion"
            >
                <div className="sp-progress-top">
                    <div>
                        <span className="sp-section-kicker">
                            YOUR PROGRESS
                        </span>
                        <h2>
                            {isComplete
                                ? "Looking good!"
                                : "Complete your profile"}
                        </h2>
                        <p>
                            {isComplete
                                ? "All profile sections have been filled in."
                                : "A little more about you helps showcase your background."}
                        </p>
                    </div>

                    <div className="sp-progress-number">
                        <strong>{completion}%</strong>
                        <span>complete</span>
                    </div>
                </div>

                <div
                    className="sp-progress-track"
                    role="progressbar"
                    aria-valuenow={completion}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Profile completion percentage"
                >
                    <div
                        className="sp-progress-fill"
                        style={{ width: `${completion}%` }}
                    />
                </div>

                <div className="sp-progress-footer">
                    <span>
                        <Icon name="check" size={15} />
                        {completedFields} of {completionFields.length} sections filled
                    </span>
                    <span>{5 - completedFields} remaining</span>
                </div>
            </section>

            {(error || message) && (
                <div
                    className={`sp-alert ${
                        error ? "sp-alert-error" : "sp-alert-success"
                    }`}
                    role={error ? "alert" : "status"}
                >
                    <span className="sp-alert-icon">
                        <Icon
                            name={error ? "user" : "check"}
                            size={19}
                        />
                    </span>

                    <p>{error || message}</p>

                    <button
                        type="button"
                        className="sp-alert-dismiss"
                        aria-label="Dismiss notification"
                        onClick={() => {
                            setError("");
                            setMessage("");
                        }}
                    >
                        ×
                    </button>
                </div>
            )}

            <div className="sp-layout">
                <section className="sp-card sp-form-card">
                    <div className="sp-card-heading">
                        <div className="sp-icon-tile">
                            <Icon name="user" size={22} />
                        </div>

                        <div>
                            <h2>
                                {profile
                                    ? "Edit your details"
                                    : "Complete your profile"}
                            </h2>
                            <p>
                                Your academic details help recruiters
                                understand your background.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="sp-form">
                        <div className="sp-field">
                            <label htmlFor="sp-college">
                                College / University
                                <span className="sp-required">*</span>
                            </label>

                            <input
                                id="sp-college"
                                name="college"
                                value={form.college}
                                onChange={handleChange}
                                maxLength={200}
                                placeholder="e.g. Jabalpur Engineering College"
                                autoComplete="organization"
                                required
                            />

                            <span className="sp-field-hint">
                                Enter the institution where you're studying.
                            </span>
                        </div>

                        <div className="sp-form-row">
                            <div className="sp-field">
                                <label htmlFor="sp-degree">Degree</label>

                                <select
                                    id="sp-degree"
                                    name="degree"
                                    value={form.degree}
                                    onChange={handleChange}
                                >
                                    <option value="">Select degree</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="B.E.">B.E.</option>
                                    <option value="B.Sc">B.Sc</option>
                                    <option value="BCA">BCA</option>
                                    <option value="M.Tech">M.Tech</option>
                                    <option value="MCA">MCA</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="sp-field">
                                <label htmlFor="sp-branch">Branch / Specialization</label>

                                <input
                                    id="sp-branch"
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleChange}
                                    maxLength={100}
                                    placeholder="e.g. Information Technology"
                                />
                            </div>
                        </div>

                        <div className="sp-field sp-year-field">
                            <label htmlFor="sp-year">Graduation year</label>

                            <input
                                id="sp-year"
                                name="graduationYear"
                                type="number"
                                min="2000"
                                max="2100"
                                step="1"
                                value={form.graduationYear}
                                onChange={handleChange}
                                placeholder="e.g. 2028"
                            />

                            <span className="sp-field-hint">
                                Your expected year of graduation.
                            </span>
                        </div>

                        <div className="sp-field">
                            <div className="sp-label-row">
                                <label htmlFor="sp-bio">About you</label>
                                <span className="sp-char-count">
                                    {form.bio.length}/5000
                                </span>
                            </div>

                            <textarea
                                id="sp-bio"
                                name="bio"
                                value={form.bio}
                                onChange={handleChange}
                                maxLength={5000}
                                rows={5}
                                placeholder="Write a short introduction about your interests, skills, and career goals..."
                            />

                            <span className="sp-field-hint">
                                Keep it personal, clear, and professional.
                            </span>
                        </div>

                        <div className="sp-form-footer">
                            <p>
                                <span className="sp-required">*</span>{" "}
                                Required field
                            </p>

                            <button
                                type="submit"
                                className="sp-button sp-button-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="sp-spinner" />
                                        Saving changes...
                                    </>
                                ) : (
                                    <>
                                        <Icon name="check" size={18} />
                                        {profile
                                            ? "Save changes"
                                            : "Create profile"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </section>

                <aside className="sp-side-column">
                    <section className="sp-card sp-resume-card">
                        <div className="sp-card-heading sp-card-heading-compact">
                            <div className="sp-icon-tile sp-resume-icon">
                                <Icon name="file" size={22} />
                            </div>

                            <div>
                                <h2>Your resume</h2>
                                <p>Keep your career documents ready.</p>
                            </div>
                        </div>

                        <div
                            className={`sp-resume-status ${
                                resume
                                    ? "sp-resume-status-ready"
                                    : "sp-resume-status-empty"
                            }`}
                        >
                            <span className="sp-resume-status-dot" />
                            {resume ? "Resume uploaded" : "No resume uploaded"}
                        </div>

                        {resume && (
                            <div className="sp-file-preview">
                                <div className="sp-file-icon">
                                    <Icon name="file" size={22} />
                                </div>

                                <div className="sp-file-info">
                                    <span>{resume.fileName || "Your resume"}</span>
                                    <small>Resume document</small>
                                </div>

                                <Icon name="check" size={18} />
                            </div>
                        )}

                        <p className="sp-resume-description">
                            {resume
                                ? "Your resume is ready to be managed. Keep it updated before applying for opportunities."
                                : "Upload your latest resume to keep your application materials ready when opportunities arise."}
                        </p>

                        <a
                            href="/student/resume"
                            className="sp-button sp-button-secondary"
                        >
                            {resume ? "Manage resume" : "Upload resume"}
                            <Icon name="arrow" size={17} />
                        </a>
                    </section>

                    <section className="sp-tip-card">
                        <div className="sp-tip-icon">
                            <Icon name="sparkles" size={21} />
                        </div>

                        <div>
                            <h3>Make a great first impression</h3>
                            <p>
                                Add accurate academic details and a concise
                                introduction to give recruiters a clearer
                                picture of who you are.
                            </p>
                        </div>
                    </section>

                    <div className="sp-privacy-note">
                        <Icon name="check" size={17} />
                        <p>
                            Your profile information is managed through your
                            CampusOS account.
                        </p>
                    </div>
                </aside>
            </div>
        </main>
    );
}
