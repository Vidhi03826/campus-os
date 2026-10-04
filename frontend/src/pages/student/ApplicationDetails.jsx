import { useEffect, useState } from "react";
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    UserRound,
    XCircle,
} from "lucide-react";

import { Link, useParams } from "react-router-dom";

import {
    getMyApplication,
    getApplicationHistory,
    withdrawApplication,
} from "../../api/applicationApi";

function formatStatus(value) {
    if (!value) {
        return "Applied";
    }

    return String(value)
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function ApplicationDetails() {
    const { applicationId } = useParams();

    const [application, setApplication] =
        useState(null);

    const [history, setHistory] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [withdrawing, setWithdrawing] =
        useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [
                applicationData,
                historyData,
            ] = await Promise.all([
                getMyApplication(applicationId),
                getApplicationHistory(applicationId),
            ]);

            setApplication(applicationData);

            setHistory(
                Array.isArray(historyData)
                    ? historyData
                    : []
            );
        } catch (err) {
            console.error(
                "Failed to load application:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load application details."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [applicationId]);

    const handleWithdraw = async () => {
        const confirmed =
            window.confirm(
                "Are you sure you want to withdraw this application?"
            );

        if (!confirmed) {
            return;
        }

        try {
            setWithdrawing(true);

            await withdrawApplication(
                applicationId
            );

            await loadData();
        } catch (err) {
            console.error(
                "Withdraw failed:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Unable to withdraw this application."
            );
        } finally {
            setWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <div className="application-detail-loading">
                <div className="application-skeleton" />
                <div className="application-skeleton tall" />
            </div>
        );
    }

    if (error || !application) {
        return (
            <div className="applications-empty">

                <XCircle size={30} />

                <h2>
                    Application unavailable
                </h2>

                <p>
                    {error ||
                        "This application could not be found."}
                </p>

                <Link
                    to="/student/applications"
                    className="primary-button"
                >
                    Back to applications
                </Link>

            </div>
        );
    }

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

    return (
        <div className="application-details-page">

            <Link
                to="/student/applications"
                className="back-link"
            >
                <ArrowLeft size={16} />
                Back to applications
            </Link>

            <section className="application-detail-hero">

                <div className="application-company-icon large">
                    {company
                        .charAt(0)
                        .toUpperCase()}
                </div>

                <div>
                    <span className="eyebrow">
                        APPLICATION #{application.id}
                    </span>

                    <h1>
                        {title}
                    </h1>

                    <p>
                        {company}
                    </p>
                </div>

                <div className="application-detail-status">
                    {formatStatus(status)}
                </div>

            </section>

            <div className="application-detail-grid">

                <main className="surface-card">

                    <div className="card-header">

                        <div>
                            <span className="eyebrow">
                                APPLICATION JOURNEY
                            </span>

                            <h3>
                                Status history
                            </h3>
                        </div>

                    </div>

                    <div className="timeline">

                        {history.length === 0 ? (
                            <div className="timeline-empty">
                                Application submitted successfully.
                                No additional status changes yet.
                            </div>
                        ) : (
                            history.map(
                                (item, index) => {

                                    const historyStatus =
                                        item.status ||
                                        item.newStatus ||
                                        item.toStatus ||
                                        "UPDATED";

                                    const changedAt =
                                        item.changedAt ||
                                        item.createdAt;

                                    return (
                                        <div
                                            className="timeline-item"
                                            key={
                                                item.id ||
                                                `${historyStatus}-${index}`
                                            }
                                        >

                                            <div className="timeline-marker">
                                                <CheckCircle2 size={16} />
                                            </div>

                                            <div className="timeline-content">

                                                <div>
                                                    <strong>
                                                        {formatStatus(
                                                            historyStatus
                                                        )}
                                                    </strong>

                                                    {changedAt && (
                                                        <span>
                                                            {new Date(
                                                                changedAt
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </span>
                                                    )}
                                                </div>

                                                {(item.note ||
                                                    item.message ||
                                                    item.reason) && (
                                                    <p>
                                                        {item.note ||
                                                            item.message ||
                                                            item.reason}
                                                    </p>
                                                )}

                                            </div>

                                        </div>
                                    );
                                }
                            )
                        )}

                    </div>

                </main>

                <aside className="application-detail-sidebar">

                    <div className="surface-card">

                        <span className="eyebrow">
                            APPLICATION INFO
                        </span>

                        <div className="application-info-row">
                            <CalendarDays size={16} />

                            <div>
                                <span>
                                    Applied
                                </span>

                                <strong>
                                    {application.appliedAt ||
                                    application.createdAt
                                        ? new Date(
                                            application.appliedAt ||
                                            application.createdAt
                                        ).toLocaleDateString(
                                            "en-IN"
                                        )
                                        : "Recently"}
                                </strong>
                            </div>
                        </div>

                        <div className="application-info-row">
                            <BriefcaseBusiness size={16} />

                            <div>
                                <span>
                                    Current status
                                </span>

                                <strong>
                                    {formatStatus(status)}
                                </strong>
                            </div>
                        </div>

                        <div className="application-info-row">
                            <UserRound size={16} />

                            <div>
                                <span>
                                    Candidate
                                </span>

                                <strong>
                                    {application.studentName ||
                                        "You"}
                                </strong>
                            </div>
                        </div>

                        {status !== "WITHDRAWN" && (
                            <button
                                className="withdraw-button"
                                onClick={
                                    handleWithdraw
                                }
                                disabled={
                                    withdrawing
                                }
                            >
                                <XCircle size={16} />

                                {withdrawing
                                    ? "Withdrawing..."
                                    : "Withdraw application"}
                            </button>
                        )}

                    </div>

                </aside>

            </div>

        </div>
    );
}

export default ApplicationDetails;