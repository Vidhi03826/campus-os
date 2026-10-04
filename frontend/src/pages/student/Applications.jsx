import { useEffect, useState } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    RotateCcw,
} from "lucide-react";

import { Link } from "react-router-dom";

import {
    getMyApplications,
} from "../../api/applicationApi";

function formatStatus(status) {
    if (!status) {
        return "Applied";
    }

    return String(status)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status) {
    return String(status || "applied")
        .toLowerCase()
        .replaceAll("_", "-");
}

function Applications() {
    const [applications, setApplications] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadApplications = async () => {
        try {
            setLoading(true);
            setError("");

            const data =
                await getMyApplications();

            const list = Array.isArray(data)
                ? data
                : data.content || [];

            setApplications(list);
        } catch (err) {
            console.error(
                "Failed to load applications:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load your applications."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadApplications();
    }, []);

    return (
        <div className="applications-page">

            <section className="applications-header">

                <div>
                    <span className="eyebrow">
                        CAREER ACTIVITY
                    </span>

                    <h1>
                        Your applications
                    </h1>

                    <p>
                        Follow every opportunity from
                        application to final decision.
                    </p>
                </div>

                <div className="application-summary">

                    <strong>
                        {applications.length}
                    </strong>

                    <span>
                        applications
                    </span>

                </div>

            </section>

            {error && (
                <div className="jobs-message error">
                    <span>{error}</span>

                    <button
                        onClick={loadApplications}
                    >
                        <RotateCcw size={14} />
                        Retry
                    </button>
                </div>
            )}

            {loading && (
                <div className="applications-list">

                    {Array.from({ length: 4 }).map(
                        (_, index) => (
                            <div
                                className="application-skeleton"
                                key={index}
                            />
                        )
                    )}

                </div>
            )}

            {!loading &&
                !error &&
                applications.length === 0 && (
                    <div className="applications-empty">

                        <div className="jobs-empty-icon">
                            <FileText size={25} />
                        </div>

                        <h2>
                            No applications yet
                        </h2>

                        <p>
                            Start exploring opportunities and
                            your application history will appear
                            here.
                        </p>

                        <Link
                            to="/student/jobs"
                            className="primary-button"
                        >
                            Explore jobs
                            <ArrowRight size={16} />
                        </Link>

                    </div>
                )}

            {!loading &&
                !error &&
                applications.length > 0 && (
                    <div className="applications-list">

                        {applications.map(
                            (application) => {

                                const title =
                                    application.jobTitle ||
                                    application.job?.title ||
                                    "Job opportunity";

                                const company =
                                    application.companyName ||
                                    application.company?.name ||
                                    "Company";

                                const status =
                                    application.status ||
                                    "APPLIED";

                                const appliedAt =
                                    application.appliedAt ||
                                    application.createdAt;

                                return (
                                    <article
                                        className="application-card"
                                        key={application.id}
                                    >

                                        <div className="application-company-icon">
                                            {company
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="application-main">

                                            <div className="application-title-row">

                                                <div>
                                                    <h2>
                                                        {title}
                                                    </h2>

                                                    <p>
                                                        {company}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`application-status ${getStatusClass(
                                                        status
                                                    )}`}
                                                >
                                                    {formatStatus(
                                                        status
                                                    )}
                                                </span>

                                            </div>

                                            <div className="application-meta">

                                                <span>
                                                    <CalendarDays size={13} />

                                                    {appliedAt
                                                        ? new Date(
                                                            appliedAt
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "Recently"}
                                                </span>

                                                <span>
                                                    <BriefcaseBusiness size={13} />

                                                    Application #
                                                    {application.id}
                                                </span>

                                            </div>

                                            <div className="application-progress">

                                                <div className="progress-step completed">
                                                    <CheckCircle2 size={15} />
                                                    Applied
                                                </div>

                                                <div className="progress-line" />

                                                <div
                                                    className={
                                                        status !== "APPLIED"
                                                            ? "progress-step completed"
                                                            : "progress-step"
                                                    }
                                                >
                                                    <Clock3 size={15} />
                                                    Review
                                                </div>

                                                <div className="progress-line" />

                                                <div
                                                    className={
                                                        [
                                                            "INTERVIEW",
                                                            "ACCEPTED",
                                                            "HIRED",
                                                            "REJECTED",
                                                        ].includes(
                                                            status
                                                        )
                                                            ? "progress-step completed"
                                                            : "progress-step"
                                                    }
                                                >
                                                    <BriefcaseBusiness size={15} />
                                                    Decision
                                                </div>

                                            </div>

                                        </div>

                                        <Link
                                            className="application-arrow"
                                            to={`/student/applications/${application.id}`}
                                            aria-label="View application"
                                        >
                                            <ArrowRight size={19} />
                                        </Link>

                                    </article>
                                );
                            }
                        )}

                    </div>
                )}

        </div>
    );
}

export default Applications;