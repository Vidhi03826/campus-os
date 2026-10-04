// import { useAuth } from "../auth/AuthContext";
// const StudentDashboard = () => {
//
//     const {
//         user,
//         logout,
//     } = useAuth();
//
//     return (
//         <div className="dashboard">
//
//             <h1>CampusOS</h1>
//
//             <h2>Student Dashboard</h2>
//
//             <div className="dashboard-card">
//
//                 <h3>
//                     Welcome, {user?.name}
//                 </h3>
//
//                 <p>
//                     Email: {user?.email}
//                 </p>
//
//                 <p>
//                     Role: {user?.role}
//                 </p>
//
//             </div>
//
//             <button
//                 className="logout-button"
//                 onClick={logout}
//             >
//                 Logout
//             </button>
//
//         </div>
//     );
// };
//
// export default StudentDashboard;