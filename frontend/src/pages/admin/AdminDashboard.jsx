
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAdminAnalytics,
    getPendingRecruiters,
    verifyRecruiter,
    rejectRecruiter,
    getAdminJobs,
    closeAdminJob,
    getAdminUsers,
    activateAdminUser,
    deactivateAdminUser,
    unlockAdminUser,
} from "../../api/adminApi";
import "./AdminDashboard.css";

const menu = [
    { id: "overview", icon: "◫", label: "Overview" },
    { id: "recruiters", icon: "♙", label: "Recruiter approvals" },
    { id: "jobs", icon: "▤", label: "Job management" },
    { id: "users", icon: "♧", label: "User management" },
];

const number = (value) => Number(value ?? 0).toLocaleString();

function AdminDashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [section, setSection] = useState("overview");
    const [analytics, setAnalytics] = useState(null);
    const [recruiters, setRecruiters] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState("");
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [search, setSearch] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [stats, pending] = await Promise.all([
                getAdminAnalytics(),
                getPendingRecruiters(),
            ]);
            setAnalytics(stats);
            setRecruiters(pending);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not load admin data. Please refresh or sign in again."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const loadSection = async (id) => {
        setSection(id);
        setSearch("");
        setNotice("");
        setError("");
        if (id === "jobs" && jobs.length === 0) {
            setLoading(true);
            try {
                setJobs(await getAdminJobs());
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load jobs.");
            } finally {
                setLoading(false);
            }
        }
        if (id === "users" && users.length === 0) {
            setLoading(true);
            try {
                setUsers(await getAdminUsers());
            } catch (err) {
                setError(err.response?.data?.message || "Unable to load users.");
            } finally {
                setLoading(false);
            }
        }
    };

    const actOnRecruiter = async (item, action) => {
        const key = `recruiter-${item.recruiterProfileId}`;
        setBusy(key);
        setError("");
        setNotice("");
        try {
            if (action === "verify") {
                await verifyRecruiter(item.recruiterProfileId);
                setNotice(`${item.companyName} has been verified.`);
            } else {
                await rejectRecruiter(item.recruiterProfileId);
                setNotice(`${item.companyName} has been rejected.`);
            }
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Recruiter action failed.");
        } finally {
            setBusy("");
        }
    };

    const actOnJob = async (job, action) => {
        setBusy(`job-${job.id}`);
        setError("");
        setNotice("");
        try {
            const { closeAdminJob, archiveAdminJob } = await import("../../api/adminApi");
            if (action === "close") await closeAdminJob(job.id);
            else await archiveAdminJob(job.id);
            setJobs(await getAdminJobs());
            setNotice(`Job "${job.title}" updated.`);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || "Job action failed.");
        } finally {
            setBusy("");
        }
    };

    const actOnUser = async (item, action) => {
        setBusy(`user-${item.id}`);
        setError("");
        setNotice("");
        try {
            if (action === "unlock") {
                await unlockAdminUser(item.id);
            } else if (item.active) {
                await deactivateAdminUser(item.id);
            } else {
                await activateAdminUser(item.id);
            }
            setUsers(await getAdminUsers());
            setNotice("User updated successfully.");
        } catch (err) {
            setError(err.response?.data?.message || "User action failed.");
        } finally {
            setBusy("");
        }
    };

    const logout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const filtered = (items, fields) =>
        items.filter((item) =>
            fields.some((field) =>
                String(item[field] ?? "").toLowerCase().includes(search.toLowerCase())
            )
        );

    const statCards = [
        { label: "Total students", value: analytics?.totalStudents, icon: "♙", color: "blue" },
        { label: "Total recruiters", value: analytics?.totalRecruiters, icon: "♧", color: "violet" },
        { label: "Pending approvals", value: analytics?.totalRecruitersPending, icon: "◷", color: "amber" },
        { label: "Published jobs", value: analytics?.publishedJobs, icon: "▤", color: "green" },
    ];

    // These visualizations use current API totals only; they do not imply historical trends.
    const studentCount = Number(analytics?.totalStudents ?? 0);
    const recruiterCount = Number(analytics?.totalRecruiters ?? 0);
    const publishedCount = Number(analytics?.publishedJobs ?? 0);
    const draftCount = Number(analytics?.draftJobs ?? 0);
    const closedCount = Number(analytics?.closedJobs ?? 0);
    const applicationStages = [
        { label: "Applied", value: Number(analytics?.appliedApplications ?? 0), color: "applied" },
        { label: "Under review", value: Number(analytics?.underReviewApplications ?? 0), color: "review" },
        { label: "Shortlisted", value: Number(analytics?.shortlistedApplications ?? 0), color: "shortlisted" },
        { label: "Interview", value: Number(analytics?.interviewApplications ?? 0), color: "interview" },
        { label: "Selected", value: Number(analytics?.selectedApplications ?? 0), color: "selected" },
        { label: "Rejected", value: Number(analytics?.rejectedApplications ?? 0), color: "rejected" },
        { label: "Withdrawn", value: Number(analytics?.withdrawnApplications ?? 0), color: "withdrawn" },
    ];
    const applicationTotal = Number(analytics?.totalApplications ?? 0);
    const userTotal = studentCount + recruiterCount;
    const jobTotal = publishedCount + draftCount + closedCount;
    const percent = (value, total) => total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <div className="admin-brand-mark">C</div>
                    <div>
                        <strong>CampusOS</strong>
                        <span>ADMIN CONSOLE</span>
                    </div>
                </div>

                <p className="admin-menu-label">WORKSPACE</p>
                <nav className="admin-nav">
                    {menu.map((item) => (
                        <button
                            key={item.id}
                            className={section === item.id ? "admin-nav-item active" : "admin-nav-item"}
                            onClick={() => loadSection(item.id)}
                        >
                            <span className="admin-nav-icon">{item.icon}</span>
                            {item.label}
                            {item.id === "recruiters" && analytics?.totalRecruitersPending > 0 && (
                                <span className="admin-nav-count">{analytics.totalRecruitersPending}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-bottom">
                    <div className="admin-security-note">
                        <span>✦</span>
                        <div><strong>Platform control</strong><p>Manage your campus hiring ecosystem.</p></div>
                    </div>
                    <button className="admin-logout" onClick={logout}>↗ <span>Sign out</span></button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="admin-breadcrumb">CampusOS <span>/</span> Administration</div>
                    <div className="admin-top-user">
                        <div className="admin-avatar">{(user?.name || "A").charAt(0).toUpperCase()}</div>
                        <div><strong>{user?.name || "Administrator"}</strong><span>Platform admin</span></div>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="admin-page-heading">
                        <div>
                            <p className="admin-eyebrow">CONTROL CENTER / 2026</p>
                            <h1>{menu.find((item) => item.id === section)?.label || "Overview"}</h1>
                            <p className="admin-subtitle">Monitor activity and manage your CampusOS platform.</p>
                        </div>
                        <button className="admin-refresh" onClick={loadData}>↻ <span>Refresh data</span></button>
                    </div>

                    {error && <div className="admin-alert error">{error}</div>}
                    {notice && <div className="admin-alert success">{notice}</div>}

                    {loading && <div className="admin-loading"><span className="admin-spinner" /> Loading live platform data…</div>}

                    {!loading && section === "overview" && (
                        <>
                            <section className="admin-stats-grid">
                                {statCards.map((card) => (
                                    <article className="admin-stat-card" key={card.label}>
                                        <div className={`admin-stat-icon ${card.color}`}>{card.icon}</div>
                                        <p>{card.label}</p>
                                        <strong>{number(card.value)}</strong>
                                        <span className="admin-stat-foot">Live database count</span>
                                    </article>
                                ))}
                            </section>

                            <section className="admin-visual-grid" aria-label="Platform composition charts">
                                <article className="admin-panel admin-chart-panel">
                                    <div className="admin-panel-heading">
                                        <div><h2>Community composition</h2><p>Current registered account distribution</p></div>
                                        <span className="admin-chart-caption">{number(userTotal)} accounts</span>
                                    </div>
                                    <div className="admin-chart-content">
                                        <div className="admin-donut-wrap">
                                            <div className="admin-donut" style={{ "--student-share": `${percent(studentCount, userTotal)}%` }} role="img" aria-label={`${percent(studentCount, userTotal)} percent students and ${percent(recruiterCount, userTotal)} percent recruiters`}>
                                                <div className="admin-donut-center"><strong>{number(userTotal)}</strong><span>ACCOUNTS</span></div>
                                            </div>
                                        </div>
                                        <div className="admin-chart-legend">
                                            <div><span className="admin-legend-dot students"/><span>Students</span><strong>{number(studentCount)}</strong><small>{percent(studentCount, userTotal)}%</small></div>
                                            <div><span className="admin-legend-dot recruiters"/><span>Recruiters</span><strong>{number(recruiterCount)}</strong><small>{percent(recruiterCount, userTotal)}%</small></div>
                                        </div>
                                    </div>
                                </article>
                                <article className="admin-panel admin-chart-panel">
                                    <div className="admin-panel-heading">
                                        <div><h2>Job status distribution</h2><p>Current job inventory by status</p></div>
                                        <span className="admin-chart-caption">{number(jobTotal)} jobs</span>
                                    </div>
                                    <div className="admin-job-bars">
                                        {[
                                            { label: "Published", value: publishedCount, color: "published" },
                                            { label: "Draft", value: draftCount, color: "draft" },
                                            { label: "Closed", value: closedCount, color: "closed" },
                                        ].map((item) => (
                                            <div className="admin-job-bar-row" key={item.label}>
                                                <div className="admin-job-bar-label"><span>{item.label}</span><strong>{number(item.value)}</strong></div>
                                                <div className="admin-job-bar-track"><span className={item.color} style={{ width: `${percent(item.value, jobTotal)}%` }}/></div>
                                            </div>
                                        ))}
                                        <p className="admin-chart-footnote">Based on current platform totals returned by the admin analytics API.</p>
                                    </div>
                                </article>
                                <article className="admin-panel admin-chart-panel admin-application-chart">
                                    <div className="admin-panel-heading">
                                        <div><h2>Application pipeline</h2><p>Current application distribution across recruitment stages</p></div>
                                        <span className="admin-chart-caption">{number(applicationTotal)} applications</span>
                                    </div>
                                    <div className="admin-application-bars">
                                        {applicationStages.map((item) => (
                                            <div className="admin-application-row" key={item.label}>
                                                <div className="admin-application-label"><span>{item.label}</span><strong>{number(item.value)}</strong><small>{percent(item.value, applicationTotal)}%</small></div>
                                                <div className="admin-application-track"><span className={item.color} style={{ width: `${percent(item.value, applicationTotal)}%` }} /></div>
                                            </div>
                                        ))}
                                        <p className="admin-chart-footnote">Current totals from the admin analytics API; these are not historical or time-series trends.</p>
                                    </div>
                                </article>
                            </section>

                            <section className="admin-overview-grid">
                                <article className="admin-panel admin-activity-panel">
                                    <div className="admin-panel-heading">
                                        <div><h2>Recruiter approvals</h2><p>Review companies waiting for verification</p></div>
                                        <button className="admin-text-button" onClick={() => loadSection("recruiters")}>View all →</button>
                                    </div>
                                    {recruiters.length === 0 ? (
                                        <div className="admin-empty"><span>✓</span><strong>You're all caught up</strong><p>No pending recruiter approvals.</p></div>
                                    ) : recruiters.slice(0, 5).map((item) => (
                                        <div className="admin-recruiter-row" key={item.recruiterProfileId}>
                                            <div className="admin-company-avatar">{(item.companyName || "C").charAt(0).toUpperCase()}</div>
                                            <div className="admin-row-primary"><strong>{item.companyName}</strong><span>{item.recruiterName} · {item.designation || "Recruiter"}</span></div>
                                            <span className="admin-status pending">Pending</span>
                                        </div>
                                    ))}
                                </article>

                                <article className="admin-panel admin-platform-panel">
                                    <div className="admin-panel-heading"><div><h2>Platform snapshot</h2><p>Current ecosystem activity</p></div><span className="admin-live-dot">LIVE</span></div>
                                    {[
                                        ["Total users", analytics?.totalUsers],
                                        ["Total jobs", analytics?.totalJobs],
                                        ["Applications", analytics?.totalApplications],
                                        ["Draft jobs", analytics?.draftJobs],
                                        ["Closed jobs", analytics?.closedJobs],
                                    ].map(([label, value]) => (
                                        <div className="admin-metric-row" key={label}><span>{label}</span><strong>{number(value)}</strong></div>
                                    ))}
                                </article>
                            </section>
                        </>
                    )}

                    {!loading && section === "recruiters" && (
                        <section className="admin-panel">
                            <div className="admin-panel-heading admin-table-heading">
                                <div><h2>Pending recruiter approvals</h2><p>Verify the company details before approving access to job publishing.</p></div>
                                <span className="admin-count-pill">{recruiters.length} pending</span>
                            </div>
                            <div className="admin-search-wrap"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, recruiter or email…" /></div>
                            <div className="admin-table-scroll"><table className="admin-table">
                                <thead><tr><th>COMPANY / RECRUITER</th><th>DESIGNATION</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                                <tbody>
                                {filtered(recruiters, ["companyName", "recruiterName", "recruiterEmail"]).map((item) => (
                                    <tr key={item.recruiterProfileId}>
                                        <td><strong>{item.companyName}</strong><span className="admin-cell-sub">{item.recruiterName}<br />{item.recruiterEmail}</span></td>
                                        <td>{item.designation || "—"}</td><td><span className="admin-status pending">Pending</span></td>
                                        <td><div className="admin-action-group">
                                            <button className="admin-button approve" disabled={!!busy} onClick={() => actOnRecruiter(item, "verify")}>{busy === `recruiter-${item.recruiterProfileId}` ? "Working…" : "✓ Verify"}</button>
                                            <button className="admin-button reject" disabled={!!busy} onClick={() => actOnRecruiter(item, "reject")}>Reject</button>
                                        </div></td>
                                    </tr>
                                ))}
                                {filtered(recruiters, ["companyName", "recruiterName", "recruiterEmail"]).length === 0 && <tr><td colSpan="4" className="admin-no-results">No pending recruiters found.</td></tr>}
                                </tbody>
                            </table></div>
                        </section>
                    )}

                    {!loading && section === "jobs" && (
                        <section className="admin-panel">
                            <div className="admin-panel-heading admin-table-heading"><div><h2>Job management</h2><p>Review job listings and moderate their status.</p></div><span className="admin-count-pill">{jobs.length} jobs</span></div>
                            <div className="admin-search-wrap"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search job title, company or status…" /></div>
                            <div className="admin-table-scroll"><table className="admin-table">
                                <thead><tr><th>JOB / COMPANY</th><th>LOCATION</th><th>TYPE</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
                                <tbody>{filtered(jobs, ["title", "companyName", "status", "location"]).map((job) => (
                                    <tr key={job.id}><td><strong>{job.title}</strong><span className="admin-cell-sub">{job.companyName}</span></td><td>{job.location || "—"}</td><td>{job.jobType || "—"}</td><td><span className={`admin-status ${(job.status || "").toLowerCase()}`}>{job.status}</span></td><td><div className="admin-action-group">
                                        {job.status !== "CLOSED" && job.status !== "ARCHIVED" && <button className="admin-button reject" disabled={!!busy} onClick={() => actOnJob(job, "close")}>Close</button>}
                                        {job.status !== "ARCHIVED" && <button className="admin-button neutral" disabled={!!busy} onClick={() => actOnJob(job, "archive")}>Archive</button>}
                                    </div></td></tr>
                                ))}{jobs.length === 0 && <tr><td colSpan="5" className="admin-no-results">No jobs have been posted yet.</td></tr>}</tbody>
                            </table></div>
                        </section>
                    )}

                    {!loading && section === "users" && (
                        <section className="admin-panel">
                            <div className="admin-panel-heading admin-table-heading"><div><h2>User management</h2><p>Manage platform access and locked accounts.</p></div><span className="admin-count-pill">{users.length} users</span></div>
                            <div className="admin-search-wrap"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email or role…" /></div>
                            <div className="admin-table-scroll"><table className="admin-table">
                                <thead><tr><th>USER</th><th>ROLE</th><th>ACCOUNT</th><th>ACTIONS</th></tr></thead>
                                <tbody>{filtered(users, ["name", "email", "role"]).map((item) => (
                                    <tr key={item.id}><td><strong>{item.name}</strong><span className="admin-cell-sub">{item.email}</span></td><td><span className="admin-role">{item.role}</span></td><td><span className={`admin-status ${item.active ? "verified" : "rejected"}`}>{item.active ? "Active" : "Inactive"}</span>{item.accountLocked && <span className="admin-status pending"> Locked</span>}</td><td><div className="admin-action-group">
                                        <button className="admin-button neutral" disabled={!!busy || item.role === "ADMIN" && item.id === user?.id} onClick={() => actOnUser(item, item.active ? "deactivate" : "activate")}>{item.active ? "Deactivate" : "Activate"}</button>
                                        {item.accountLocked && <button className="admin-button approve" disabled={!!busy} onClick={() => actOnUser(item, "unlock")}>Unlock</button>}
                                    </div></td></tr>
                                ))}{users.length === 0 && <tr><td colSpan="4" className="admin-no-results">No users found.</td></tr>}</tbody>
                            </table></div>
                        </section>
                    )}
                </div>
            </main>
        </div>
    );
}

export default AdminDashboard;
