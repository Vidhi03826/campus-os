import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BookOpen, GraduationCap, Sparkles, UserRound, AlertCircle, CheckCircle2 } from "lucide-react";
import { createStudentProfile, getMyStudentProfile } from "../../api/studentProfileApi";
import "../../styles/student-profile-setup.css";

function StudentProfileSetup() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ college: "", degree: "B.Tech", branch: "", graduationYear: "", bio: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(true);

    useEffect(() => {
        let active = true;
        const checkProfile = async () => {
            try {
                await getMyStudentProfile();
                if (active) navigate("/student/dashboard", { replace: true });
            } catch (err) {
                if (!active) return;
                if (err?.response?.status === 404) setCheckingProfile(false);
                else {
                    setError(err?.response?.data?.message || "Unable to check your student profile. Please try again.");
                    setCheckingProfile(false);
                }
            }
        };
        checkProfile();
        return () => { active = false; };
    }, [navigate]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        if (!form.college.trim()) {
            setError("College / University is required.");
            return;
        }
        setLoading(true);
        try {
            await createStudentProfile({
                college: form.college.trim(),
                degree: form.degree.trim() || null,
                branch: form.branch.trim() || null,
                graduationYear: form.graduationYear ? Number(form.graduationYear) : null,
                bio: form.bio.trim() || null,
            });
            navigate("/student/dashboard", { replace: true });
        } catch (err) {
            setError(err?.response?.data?.message || "Could not save your profile. Please check your details and try again.");
        } finally {
            setLoading(false);
        }
    };

    if (checkingProfile) {
        return (
            <main className="profile-setup-page profile-setup-loading">
                <div className="profile-setup-orb profile-setup-orb-one" />
                <div className="profile-setup-loading-card">
                    <span className="profile-setup-loader" />
                    <h1>Preparing your CampusOS profile</h1>
                    <p>Checking your student details securely...</p>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-setup-page">
            <div className="profile-setup-orb profile-setup-orb-one" />
            <div className="profile-setup-orb profile-setup-orb-two" />
            <div className="profile-setup-shell">
                <section className="profile-setup-intro">
                    <div className="profile-setup-brand"><span className="profile-setup-brand-mark"><GraduationCap size={21} /></span><span>CampusOS</span><span className="profile-setup-brand-divider" /> <small>STUDENT SPACE</small></div>
                    <div className="profile-setup-intro-content">
                        <span className="profile-setup-kicker"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</span>
                        <h1>Build your<br /><span>career identity.</span></h1>
                        <p>A few academic details help CampusOS connect you with opportunities that match your journey.</p>
                        <div className="profile-setup-benefits">
                            <div><span><BookOpen size={17} /></span><p><strong>Showcase your academics</strong><small>Give recruiters useful context about your education.</small></p></div>
                            <div><span><UserRound size={17} /></span><p><strong>Make your profile yours</strong><small>Add a short introduction that sounds like you.</small></p></div>
                        </div>
                    </div>
                    <div className="profile-setup-footnote">A better profile. More relevant opportunities.</div>
                </section>

                <section className="profile-setup-form-panel">
                    <div className="profile-setup-form-heading">
                        <span className="profile-setup-step">STEP 01 <span>OF 01</span></span>
                        <h2>Complete your student profile</h2>
                        <p>Enter your real academic details to continue using CampusOS.</p>
                    </div>

                    {error && <div className="profile-setup-alert" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}

                    <form className="profile-setup-form" onSubmit={handleSubmit}>
                        <div className="profile-setup-field profile-setup-field-wide">
                            <label htmlFor="college">College / University <span>*</span></label>
                            <input id="college" name="college" value={form.college} onChange={handleChange} maxLength={200} autoComplete="organization" placeholder="e.g. Your college or university" required />
                            <small>Use the official name of your institution.</small>
                        </div>
                        <div className="profile-setup-field">
                            <label htmlFor="degree">Degree</label>
                            <input id="degree" name="degree" value={form.degree} onChange={handleChange} maxLength={100} placeholder="e.g. B.Tech" />
                        </div>
                        <div className="profile-setup-field">
                            <label htmlFor="branch">Branch / Specialization</label>
                            <input id="branch" name="branch" value={form.branch} onChange={handleChange} maxLength={100} placeholder="e.g. Information Technology" />
                        </div>
                        <div className="profile-setup-field profile-setup-field-wide">
                            <label htmlFor="graduationYear">Expected graduation year</label>
                            <input id="graduationYear" name="graduationYear" type="number" min="2000" max="2100" value={form.graduationYear} onChange={handleChange} placeholder="e.g. 2028" />
                        </div>
                        <div className="profile-setup-field profile-setup-field-wide">
                            <div className="profile-setup-label-row"><label htmlFor="bio">A little about you</label><span>OPTIONAL</span></div>
                            <textarea id="bio" name="bio" value={form.bio} onChange={handleChange} maxLength={5000} rows={4} placeholder="Share your interests, strengths, or what you're excited to learn..." />
                            <small>{form.bio.length}/5000 characters</small>
                        </div>
                        <div className="profile-setup-form-footer">
                            <div className="profile-setup-privacy"><CheckCircle2 size={15} /><span>Your information stays within your CampusOS profile.</span></div>
                            <button type="submit" disabled={loading}>{loading ? "Saving profile..." : "Save and continue"}<ArrowRight size={17} /></button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default StudentProfileSetup;
