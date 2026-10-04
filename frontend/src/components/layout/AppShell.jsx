
import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

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

import { useAuth } from "../../auth/AuthContext";

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
            path: "/recruiter/applicants",
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

function getInitials(name = "") {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}

function AppShell() {
    const { user, logout } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);

    const links = navigation[user?.role] ?? [];

    const currentPage =
        links.find((item) => location.pathname === item.path)?.label ??
        (location.pathname === "/recruiter/jobs/new"
            ? "Create Job"
            : location.pathname.startsWith("/recruiter/jobs/") &&
            location.pathname.endsWith("/edit")
                ? "Edit Job"
                : "Workspace");

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/login", { replace: true });
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

    return (
        <div className="app-shell">
            {sidebarOpen && (
                <button
                    className="mobile-backdrop"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="Close navigation"
                />
            )}

            <aside
                className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}
            >
                <div className="sidebar-header">
                    <div className="brand">
                        <div className="brand-mark">C</div>

                        <div>
                            <div className="brand-name">CampusOS</div>
                            <div className="brand-subtitle">
                                Career workspace
                            </div>
                        </div>
                    </div>

                    <button
                        className="icon-button mobile-close"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="sidebar-section-label">
                    Workspace
                </div>

                <nav className="sidebar-nav">
                    {links.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={
                                    item.path === "/recruiter/jobs" ||
                                    item.path === "/student/jobs"
                                }
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `nav-link ${isActive ? "active" : ""}`
                                }
                            >
                                <Icon size={19} strokeWidth={2} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-tip">
                        <div className="sidebar-tip-icon">✦</div>

                        <div>
                            <strong>Keep building</strong>
                            <p>
                                Your next opportunity can start here.
                            </p>
                        </div>
                    </div>

                    <button
                        className="logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={18} />
                        <span>Sign out</span>
                    </button>
                </div>
            </aside>

            <div className="app-content">
                <header className="topbar">
                    <div className="topbar-left">
                        <button
                            className="icon-button mobile-menu"
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open navigation"
                        >
                            <Menu size={21} />
                        </button>

                        <div>
                            <div className="breadcrumb">
                                CampusOS
                                <span>/</span>
                                {currentPage}
                            </div>
                        </div>
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-search">
                            <Search size={17} />

                            <input
                                type="text"
                                placeholder="Search your workspace..."
                                aria-label="Search"
                            />

                            <kbd>⌘ K</kbd>
                        </div>

                        <button
                            className="notification-button"
                            onClick={handleNotificationClick}
                            aria-label="Notifications"
                        >
                            <Bell size={19} />
                            <span className="notification-dot" />
                        </button>

                        <div className="topbar-divider" />

                        <div className="user-menu">
                            <div className="avatar">
                                {getInitials(user?.name)}
                            </div>

                            <div className="user-meta">
                                <strong>{user?.name}</strong>
                                <span>{user?.role}</span>
                            </div>
                        </div>
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
