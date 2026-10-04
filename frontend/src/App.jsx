
import {
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import Login from "./pages/Login.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AppShell from "./components/layout/AppShell.jsx";

// Student pages
import StudentDashboard from "./pages/student/StudentDashboard.jsx";
import Jobs from "./pages/student/Jobs.jsx";
import JobDetails from "./pages/student/JobDetails.jsx";
import SavedJobs from "./pages/student/SavedJobs.jsx";
import Applications from "./pages/student/Applications.jsx";
import ApplicationDetails from "./pages/student/ApplicationDetails.jsx";
import Profile from "./pages/student/Profile.jsx";
import Resume from "./pages/student/Resume.jsx";
import RecruiterApplicants from "./pages/recruiter/RecruiterApplicants";
// Recruiter pages
import RecruiterDashboard from "./pages/recruiter/RecruiterDashboard.jsx";
import RecruiterJobs from "./pages/recruiter/RecruiterJobs.jsx";
import RecruiterJobForm from "./pages/recruiter/RecruiterJobForm.jsx";
import RecruiterApplicants from "./pages/recruiter/RecruiterApplicants";
// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";

// Existing styles
import "./styles/student-profile.css";
import "./styles/student-dashboard.css";
import "./styles/student-saved-jobs.css";

function PlaceholderPage({ title }) {
    return (
        <div className="surface-card placeholder-page">
            <span className="eyebrow">CAMPUSOS</span>
            <h2>{title}</h2>
            <p>This workspace is coming next.</p>
        </div>
    );
}

function App() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />

            {/* Student workspace */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["STUDENT"]} />
                }
            >
                <Route element={<AppShell />}>
                    <Route
                        path="/student/dashboard"
                        element={<StudentDashboard />}
                    />

                    <Route
                        path="/student/jobs"
                        element={<Jobs />}
                    />

                    <Route
                        path="/student/jobs/:jobId"
                        element={<JobDetails />}
                    />

                    <Route
                        path="/student/saved-jobs"
                        element={<SavedJobs />}
                    />

                    <Route
                        path="/student/applications"
                        element={<Applications />}
                    />

                    <Route
                        path="/student/applications/:applicationId"
                        element={<ApplicationDetails />}
                    />

                    <Route
                        path="/student/profile"
                        element={<Profile />}
                    />

                    <Route
                        path="/student/resume"
                        element={<Resume />}
                    />

                    <Route
                        path="/student/notifications"
                        element={
                            <PlaceholderPage title="Notifications" />
                        }
                    />
                </Route>
            </Route>

            {/* Recruiter workspace */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["RECRUITER"]} />
                }
            >
                <Route element={<AppShell />}>
                    <Route
                        path="/recruiter/dashboard"
                        element={<RecruiterDashboard />}
                    />

                    <Route
                        path="/recruiter/jobs"
                        element={<RecruiterJobs />}
                    />

                    <Route
                        path="/recruiter/jobs/new"
                        element={<RecruiterJobForm />}
                    />

                    <Route
                        path="/recruiter/jobs/:jobId/edit"
                        element={<RecruiterJobForm />}
                    />
                    <Route
                        path="/recruiter/jobs/:jobId/applicants"
                        element={<RecruiterApplicants />}
                    />
                    </Route>

                <Route
                    path="/recruiter/jobs/:jobId/applicants"
                    element={<RecruiterApplicants />}
                />
            </Route>

            {/* Admin workspace */}
            <Route
                element={
                    <ProtectedRoute allowedRoles={["ADMIN"]} />
                }
            >
                <Route element={<AppShell />}>
                    <Route
                        path="/admin/dashboard"
                        element={<AdminDashboard />}
                    />
                </Route>
            </Route>

            {/* Unknown routes */}
            <Route
                path="*"
                element={<Navigate to="/login" replace />}
            />
        </Routes>
    );
}

export default App;
