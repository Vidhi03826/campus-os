
import { useCallback, useEffect, useState } from "react";
import {
    getMyNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "../../api/notificationApi";
import "../../styles/student-notifications.css";

const getErrorMessage = (error) =>
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    "Something went wrong. Please try again.";

const formatDate = (value) => {
    if (!value) return "Date unavailable";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getNotificationIcon = (type) => {
    const icons = {
        APPLICATION_SUBMITTED: "✉",
        APPLICATION_STATUS_CHANGED: "↗",
    };

    return icons[type] || "🔔";
};
const isRecruiter = role === "RECRUITER";

const pageCopy = isRecruiter
    ? {
        eyebrow: "YOUR CAMPUSOS HIRING ACTIVITY",
        title: "Notifications",
        subtitle:
            "Stay up to date with candidate applications and hiring activity.",
        summary:
            "Application updates and recruitment activity will appear here.",
        emptyTitle: "No notifications yet",
        emptyDescription:
            "Candidate applications and hiring updates will appear here.",
    }
    : {
        eyebrow: "YOUR CAMPUSOS UPDATES",
        title: "Notifications",
        subtitle:
            "Stay up to date with your applications and important activity.",
        summary:
            "Application updates and hiring activity will appear here.",
        emptyTitle: "No notifications yet",
        emptyDescription:
            "When there is activity on your applications, you'll see it here.",
    };
export default function StudentNotifications({ role = "STUDENT" }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [filter, setFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [markingAll, setMarkingAll] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadNotifications = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [notificationData, unreadData] = await Promise.all([
                getMyNotifications(page, 10),
                getUnreadNotificationCount(),
            ]);

            const records = Array.isArray(notificationData)
                ? notificationData
                : notificationData?.content ??
                notificationData?.items ??
                notificationData?.data ??
                notificationData?.notifications ??
                [];

            setNotifications(Array.isArray(records) ? records : []);

            const pages = Number(notificationData?.totalPages);
            setTotalPages(
                Number.isFinite(pages) && pages > 0 ? pages : 1
            );

            const count = Number(
                typeof unreadData === "number"
                    ? unreadData
                    : unreadData?.count ?? unreadData?.unreadCount ?? 0
            );

            setUnreadCount(Number.isFinite(count) ? count : 0);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    const handleMarkRead = async (notification) => {
        if (notification.read || busyId === notification.id) return;

        setBusyId(notification.id);
        setError("");
        setSuccess("");

        try {
            await markNotificationAsRead(notification.id);

            setNotifications((current) =>
                current.map((item) =>
                    item.id === notification.id
                        ? { ...item, read: true }
                        : item
                )
            );

            setUnreadCount((count) => Math.max(0, count - 1));
            setSuccess("Notification marked as read.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusyId(null);
        }
    };

    const handleMarkAllRead = async () => {
        if (unreadCount === 0 || markingAll) return;

        setMarkingAll(true);
        setError("");
        setSuccess("");

        try {
            await markAllNotificationsAsRead();

            setNotifications((current) =>
                current.map((item) => ({ ...item, read: true }))
            );

            setUnreadCount(0);
            setSuccess("All notifications marked as read.");
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setMarkingAll(false);
        }
    };

    const visibleNotifications = notifications.filter((notification) => {
        if (filter === "UNREAD") return !notification.read;
        if (filter === "READ") return notification.read;
        return true;
    });

    return (
        <main className="sn-page">
            <div className="sn-container">
                <header className="sn-header">
                    <div>
                        <p className="sn-eyebrow">
                            {pageCopy.eyebrow}
                        </p>
                        <h1>Notifications</h1>
                        <p className="sn-subtitle">
                            {pageCopy.subtitle}
                        </p>
                    </div>

                    <div className="sn-header-actions">
                        <span className="sn-unread-count">
                            {unreadCount} unread
                        </span>
                        <button
                            type="button"
                            className="sn-secondary-button"
                            onClick={loadNotifications}
                            disabled={loading}
                        >
                            {loading ? "Refreshing..." : "↻ Refresh"}
                        </button>
                    </div>
                </header>

                <section className="sn-summary">
                    <div className="sn-summary-icon">🔔</div>
                    <div>
                        <strong>
                            {unreadCount === 0
                                ? "You're all caught up!"
                                : `You have ${unreadCount} unread ${
                                    unreadCount === 1
                                        ? "notification"
                                        : "notifications"
                                }`}
                        </strong>
                        <p>
                            {pageCopy.summary}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="sn-mark-all"
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0 || markingAll}
                    >
                        {markingAll ? "Updating..." : "Mark all as read"}
                    </button>
                </section>

                {error && (
                    <div className="sn-alert sn-error" role="alert">
                        {error}
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            ×
                        </button>
                    </div>
                )}

                {success && (
                    <div className="sn-alert sn-success" role="status">
                        {success}
                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                            aria-label="Dismiss message"
                        >
                            ×
                        </button>
                    </div>
                )}

                <section className="sn-panel">
                    <div className="sn-panel-header">
                        <div>
                            <h2>Recent activity</h2>
                            <p>Your latest notifications, newest first.</p>
                        </div>

                        <label className="sn-filter-label">
                            <span className="sn-sr-only">Filter notifications</span>
                            <select
                                value={filter}
                                onChange={(event) => setFilter(event.target.value)}
                            >
                                <option value="ALL">All notifications</option>
                                <option value="UNREAD">Unread only</option>
                                <option value="READ">Read only</option>
                            </select>
                        </label>
                    </div>

                    {loading ? (
                        <div className="sn-state">
                            <div className="sn-spinner" />
                            <strong>Loading notifications...</strong>
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="sn-state">
                            <div className="sn-empty-icon">♧</div>
                            <h3>
                                {notifications.length === 0
                                    ? "No notifications yet"
                                    : "No notifications match this filter"}
                            </h3>
                            <p>
                                {notifications.length === 0
                                    ? "When there is activity on your applications, you'll see it here."
                                    : "Try selecting a different filter."}
                            </p>
                        </div>
                    ) : (
                        <div className="sn-list">
                            {visibleNotifications.map((notification) => (
                                <article
                                    key={notification.id}
                                    className={`sn-item ${
                                        notification.read ? "is-read" : "is-unread"
                                    }`}
                                >
                                    <div className="sn-item-icon">
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    <div className="sn-item-content">
                                        <div className="sn-item-heading">
                                            <h3>{notification.title}</h3>
                                            {!notification.read && (
                                                <span className="sn-new-dot">
                                                    New
                                                </span>
                                            )}
                                        </div>

                                        <p>{notification.message}</p>
                                        <time dateTime={notification.createdAt}>
                                            {formatDate(notification.createdAt)}
                                        </time>
                                    </div>

                                    {!notification.read && (
                                        <button
                                            type="button"
                                            className="sn-read-button"
                                            disabled={busyId === notification.id}
                                            onClick={() =>
                                                handleMarkRead(notification)
                                            }
                                        >
                                            {busyId === notification.id
                                                ? "Updating..."
                                                : "Mark as read"}
                                        </button>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}

                    {!loading && totalPages > 1 && (
                        <div className="sn-pagination">
                            <button
                                type="button"
                                disabled={page === 0}
                                onClick={() => setPage((current) => current - 1)}
                            >
                                ← Previous
                            </button>
                            <span>
                                Page {page + 1} of {totalPages}
                            </span>
                            <button
                                type="button"
                                disabled={page + 1 >= totalPages}
                                onClick={() => setPage((current) => current + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
