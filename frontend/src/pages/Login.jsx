import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, GraduationCap, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import "../styles/auth-experience.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [email, setEmail] = useState(location.state?.email || "");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const currentUser = await login(email, password);
            if (currentUser.role === "STUDENT") navigate("/student/dashboard");
            else if (currentUser.role === "RECRUITER") navigate("/recruiter/dashboard");
            else if (currentUser.role === "ADMIN") navigate("/admin/dashboard");
            else setError("Unknown user role.");
        } catch (err) {
            console.error("Login failed:", err);
            setError(err.response?.data?.message || "Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <div className="auth-orb auth-orb-one" />
            <div className="auth-orb auth-orb-two" />
            <section className="auth-shell auth-login-shell">
                <aside className="auth-story-panel">
                    <Link to="/login" className="auth-brand"><span className="auth-brand-mark">C</span><span>CampusOS</span><i>CAREER ECOSYSTEM</i></Link>
                    <div className="auth-story-content">
                        <span className="auth-eyebrow"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</span>
                        <h1>Make your<br />next move <em>matter.</em></h1>
                        <p>One connected space to discover opportunities, meet talent and move careers forward.</p>
                        <div className="auth-feature-stack">
                            <div><span className="auth-feature-icon"><GraduationCap size={18}/></span><span><b>For ambitious students</b><small>Find opportunities built around your goals.</small></span></div>
                            <div><span className="auth-feature-icon"><BriefcaseBusiness size={18}/></span><span><b>For forward-thinking teams</b><small>Discover and connect with emerging talent.</small></span></div>
                        </div>
                    </div>
                    <div className="auth-story-footer"><ShieldCheck size={15}/> A focused workspace for your career journey</div>
                    <div className="auth-art-card"><div className="auth-art-top"><span>CAREER MOMENTUM</span><span className="auth-live-dot">● LIVE</span></div><div className="auth-art-bars"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="auth-art-bottom"><b>Discover. Connect. Grow.</b><span>YOUR FUTURE, IN MOTION</span></div></div>
                </aside>
                <section className="auth-form-panel">
                    <div className="auth-mobile-brand"><span className="auth-brand-mark">C</span><b>CampusOS</b></div>
                    <div className="auth-form-heading"><span className="auth-step-label">WELCOME BACK</span><h2>Sign in to your<br/><em>workspace.</em></h2><p>Pick up where your next opportunity begins.</p></div>
                    {location.state?.registered && <div className="auth-success" role="status"><ShieldCheck size={17}/> Account created successfully. You can now sign in.</div>}
                    {error && <div className="auth-error" role="alert">{error}</div>}
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <label htmlFor="login-email">Email address</label>
                        <div className="auth-input-wrap"><Mail size={17}/><input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/></div>
                        <div className="auth-label-line"><label htmlFor="login-password">Password</label></div>
                        <div className="auth-input-wrap"><LockKeyhole size={17}/><input id="login-password" type={showPassword?"text":"password"} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" required/><button className="auth-visibility" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Hide password":"Show password"}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>
                        <button className="auth-submit" type="submit" disabled={loading}>{loading?"Signing you in…":"Sign in to CampusOS"}<ArrowRight size={17}/></button>
                    </form>
                    <p className="auth-switch">New to CampusOS? <Link to="/register">Create an account <ArrowRight size={14}/></Link></p>
                    <div className="auth-trust"><span><ShieldCheck size={14}/> Secure sign in</span><span>STUDENT · RECRUITER · ADMIN</span></div>
                </section>
            </section>
        </main>
    );
}
