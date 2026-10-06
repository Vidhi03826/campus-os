import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    BarChart3,
    Bell,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Search,
    Settings,
    ShieldCheck,
    UserCircle,
    Users,
    X,
} from "lucide-react";

import {
    NavLink,
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";
import { getUnreadNotificationCount } from "../../api/notificationApi";

const navigation = {
    STUDENT: [
        {
            label: "Overview",
            path: "/student/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Discover Jobs",
            path: "/student/jobs",
            icon: BriefcaseBusiness,
        },
        {
            label: "Saved Jobs",
            path: "/student/saved-jobs",
            icon: Bookmark,
        },
        {
            label: "Applications",
            path: "/student/applications",
            icon: FileText,
        },
        {
            label: "Profile",
            path: "/student/profile",
            icon: UserCircle,
        },
        {
            label: "Notifications",
            path: "/student/notifications",
            icon: Bell,
        },
    ],

    RECRUITER: [
        {
            label: "Overview",
            path: "/recruiter/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Jobs",
            path: "/recruiter/jobs",
            icon: BriefcaseBusiness,
        },
        {
            label: "Create Job",
            path: "/recruiter/jobs/new",
            icon: FileText,
        },
        {
            label: "Applicants",
            path: "/recruiter/jobs",
            icon: Users,
        },
        {
            label: "Company",
            path: "/recruiter/company",
            icon: Building2,
        },
        {
            label: "Notifications",
            path: "/recruiter/notifications",
            icon: Bell,
        },
    ],

    ADMIN: [
        {
            label: "Overview",
            path: "/admin/dashboard",
            icon: LayoutDashboard,
        },
        {
            label: "Users",
            path: "/admin/users",
            icon: Users,
        },
        {
            label: "Recruiters",
            path: "/admin/recruiters",
            icon: ShieldCheck,
        },
        {
            label: "Jobs",
            path: "/admin/jobs",
            icon: BriefcaseBusiness,
        },
        {
            label: "Analytics",
            path: "/admin/analytics",
            icon: BarChart3,
        },
        {
            label: "Activity",
            path: "/admin/activity",
            icon: Activity,
        },
        {
            label: "Settings",
            path: "/admin/settings",
            icon: Settings,
        },
    ],
};

const roleLabels = {
    STUDENT: "Student",
    RECRUITER: "Recruiter",
    ADMIN: "Administrator",
};

function getInitials(name = "") {
    const initials = name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");

    return initials || "U";
}

function getPageTitle(pathname, links) {
    const exactMatch = links.find(
        (item) => pathname === item.path
    );

    if (exactMatch) {
        return exactMatch.label;
    }

    if (
        pathname.startsWith("/student/jobs/") &&
        pathname !== "/student/jobs"
    ) {
        return "Job Details";
    }

    if (
        pathname.startsWith("/student/applications/")
    ) {
        return "Application Details";
    }

    if (
        pathname.startsWith("/recruiter/jobs/") &&
        pathname.endsWith("/edit")
    ) {
        return "Edit Job";
    }

    if (
        pathname.startsWith("/recruiter/jobs/") &&
        pathname.endsWith("/applicants")
    ) {
        return "Applicants";
    }

    if (pathname === "/recruiter/jobs/new") {
        return "Create Job";
    }

    return "Workspace";
}

function AppShell() {
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [searchFocused, setSearchFocused] = useState(false);

    const links = navigation[user?.role] ?? [];

    const currentPage = useMemo(
        () =>
            getPageTitle(
                location.pathname,
                links
            ),
        [location.pathname, links]
    );

    const initials = getInitials(user?.name);

    const roleLabel =
        roleLabels[user?.role] ||
        user?.role ||
        "User";

    /*
     * Notification count
     */
    useEffect(() => {
        let cancelled = false;

        const loadUnreadCount = async () => {
            if (!user?.role) {
                setUnreadCount(0);
                return;
            }

            try {
                const count =
                    await getUnreadNotificationCount();

                if (cancelled) return;

                const parsed = Number(
                    typeof count === "object"
                        ? count?.count ??
                        count?.unreadCount ??
                        0
                        : count
                );

                setUnreadCount(
                    Number.isFinite(parsed) &&
                    parsed > 0
                        ? parsed
                        : 0
                );
            } catch (error) {
                console.error(
                    "Unable to load notification count:",
                    error
                );

                if (!cancelled) {
                    setUnreadCount(0);
                }
            }
        };

        loadUnreadCount();

        /*
         * Refresh the count periodically so the shell
         * stays useful even when a notification is
         * generated while the user is on another page.
         */
        const interval = window.setInterval(
            loadUnreadCount,
            30000
        );

        return () => {
            cancelled = true;
            window.clearInterval(interval);
        };
    }, [user?.role]);

    /*
     * Close mobile navigation when route changes.
     */
    useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    /*
     * Close sidebar with Escape.
     */
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                sidebarOpen
            ) {
                setSidebarOpen(false);
            }
        };

        window.addEventListener(
            "keydown",
            handleKeyDown
        );

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [sidebarOpen]);

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", {
                replace: true,
            });
        }
    };

    const handleNotificationClick = () => {
        if (user?.role === "STUDENT") {
            navigate("/student/notifications");
        } else if (user?.role === "RECRUITER") {
            navigate("/recruiter/notifications");
        } else if (user?.role === "ADMIN") {
            navigate("/admin/activity");
        }
    };

    const handleSearchKeyDown = (event) => {
        if (event.key === "Escape") {
            event.currentTarget.blur();
            return;
        }

        if (
            event.key === "Enter" &&
            event.currentTarget.value.trim()
        ) {
            if (user?.role === "STUDENT") {
                navigate("/student/jobs");
            } else if (
                user?.role === "RECRUITER"
            ) {
                navigate("/recruiter/jobs");
            }
        }
    };

    return (
        <div className="app-shell">
            {/* Mobile backdrop */}
            {sidebarOpen && (
                <button
                    type="button"
                    className="mobile-backdrop"
                    onClick={() =>
                        setSidebarOpen(false)
                    }
                    aria-label="Close navigation"
                />
            )}

            {/* ================================================= */}
            {/* SIDEBAR */}
            {/* ================================================= */}

            <aside
                className={`sidebar ${
                    sidebarOpen
                        ? "sidebar-open"
                        : ""
                }`}
            >
                <div className="sidebar-header">
                    <button
                        type="button"
                        className="brand"
                        onClick={() => {
                            if (
                                user?.role ===
                                "STUDENT"
                            ) {
                                navigate(
                                    "/student/dashboard"
                                );
                            } else if (
                                user?.role ===
                                "RECRUITER"
                            ) {
                                navigate(
                                    "/recruiter/dashboard"
                                );
                            } else if (
                                user?.role === "ADMIN"
                            ) {
                                navigate(
                                    "/admin/dashboard"
                                );
                            }
                        }}
                        aria-label="Go to dashboard"
                    >
                        <div className="brand-mark">
                            C
                        </div>

                        <div>
                            <div className="brand-name">
                                CampusOS
                            </div>

                            <div className="brand-subtitle">
                                Career workspace
                            </div>
                        </div>
                    </button>

                    <button
                        type="button"
                        className="icon-button mobile-close"
                        onClick={() =>
                            setSidebarOpen(false)
                        }
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-section-label">
                    Workspace
                </div>

                <nav
                    className="sidebar-nav"
                    aria-label="Main navigation"
                >
                    {links.map((item) => {
                        const Icon = item.icon;

                        const isNotification =
                            item.label ===
                            "Notifications";

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={
                                    item.path ===
                                    "/recruiter/jobs" ||
                                    item.path ===
                                    "/student/jobs"
                                }
                                onClick={() =>
                                    setSidebarOpen(
                                        false
                                    )
                                }
                                className={({
                                                isActive,
                                            }) =>
                                    `nav-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >
                                <span className="nav-link-icon">
                                    <Icon
                                        size={19}
                                        strokeWidth={2}
                                    />

                                    {isNotification &&
                                        unreadCount >
                                        0 && (
                                            <span className="nav-link-dot" />
                                        )}
                                </span>

                                <span>
                                    {item.label}
                                </span>

                                {isNotification &&
                                    unreadCount >
                                    0 && (
                                        <span className="nav-unread-count">
                                            {unreadCount >
                                            99
                                                ? "99+"
                                                : unreadCount}
                                        </span>
                                    )}
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-tip">
                        <div className="sidebar-tip-icon">
                            ✦
                        </div>

                        <div>
                            <strong>
                                Keep building
                            </strong>

                            <p>
                                Your next opportunity
                                can start here.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            {/* ================================================= */}
            {/* MAIN CONTENT */}
            {/* ================================================= */}

            <div className="app-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            type="button"
                            className="icon-button mobile-menu"
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                            aria-label="Open navigation"
                        >
                            <Menu size={21} />
                        </button>

                        <div className="topbar-heading">
                            <div className="breadcrumb">
                                <span className="breadcrumb-root">
                                    CampusOS
                                </span>

                                <span className="breadcrumb-separator">
                                    /
                                </span>

                                <strong>
                                    {currentPage}
                                </strong>
                            </div>
                        </div>
                    </div>

                    <div className="topbar-right">
                        {/* Search */}
                        <div
                            className={`topbar-search ${
                                searchFocused
                                    ? "focused"
                                    : ""
                            }`}
                        >
                            <Search size={17} />

                            <input
                                type="text"
                                placeholder="Search your workspace..."
                                aria-label="Search your workspace"
                                onFocus={() =>
                                    setSearchFocused(
                                        true
                                    )
                                }
                                onBlur={() =>
                                    setSearchFocused(
                                        false
                                    )
                                }
                                onKeyDown={
                                    handleSearchKeyDown
                                }
                            />

                            <kbd>
                                <span>⌘</span>
                                K
                            </kbd>
                        </div>

                        {/* Notifications */}
                        <button
                            type="button"
                            className={`notification-button ${
                                unreadCount > 0
                                    ? "has-unread"
                                    : ""
                            }`}
                            onClick={
                                handleNotificationClick
                            }
                            aria-label={
                                unreadCount > 0
                                    ? `${unreadCount} unread notifications`
                                    : "Notifications"
                            }
                        >
                            <Bell size={19} />

                            {unreadCount > 0 && (
                                <span className="notification-badge">
                                    {unreadCount >
                                    99
                                        ? "99+"
                                        : unreadCount}
                                </span>
                            )}
                        </button>

                        <div className="topbar-divider" />

                        {/* User */}
                        <button
                            type="button"
                            className="user-menu"
                            onClick={() => {
                                if (
                                    user?.role ===
                                    "STUDENT"
                                ) {
                                    navigate(
                                        "/student/profile"
                                    );
                                }
                            }}
                        >
                            <div className="avatar">
                                {initials}
                            </div>

                            <div className="user-meta">
                                <strong>
                                    {user?.name ||
                                        "User"}
                                </strong>

                                <span>
                                    {roleLabel}
                                </span>
                            </div>
                        </button>
                    </div>
                </header>

                <main className="page-container">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AppShell;