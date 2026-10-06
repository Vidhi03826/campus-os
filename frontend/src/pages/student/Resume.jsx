import { useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    CheckCircle2,
    Download,
    FileCheck2,
    FileText,
    RefreshCw,
    ShieldCheck,
    Trash2,
    Upload,
} from "lucide-react";
import { useToast } from "../../context/ToastContext";
import {
    deleteResume,
    downloadResume,
    getResumeMetadata,
    uploadResume,
} from "../../api/studentApi";

function formatFileSize(bytes) {
    if (!bytes) {
        return "Unknown size";
    }

    if (bytes < 1024) {
        return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Resume() {
    const inputRef = useRef(null);
    const { success: showSuccess, error: showError } = useToast();
    const [resume, setResume] = useState(null);

    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const [dragActive, setDragActive] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadResume = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getResumeMetadata();
            setResume(data);
        } catch (err) {
            if (err?.response?.status === 404) {
                setResume(null);
            } else {
                console.error("Failed to load resume:", err);

                setError(
                    err?.response?.data?.message ||
                    "Unable to load your resume."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadResume();
    }, []);

    const validateFile = (file) => {
        if (!file) {
            return "Please select a file.";
        }

        const isPdf =
            file.type === "application/pdf" ||
            file.name?.toLowerCase().endsWith(".pdf");

        if (!isPdf) {
            return "Only PDF resumes are allowed.";
        }

        const maxSize = 5 * 1024 * 1024;

        if (file.size > maxSize) {
            return "Resume must be 5 MB or smaller.";
        }

        return "";
    };

    const handleFile = async (file) => {
        const validationError = validateFile(file);

        if (validationError) {
            setError(validationError);
            setSuccess("");
            return;
        }

        try {
            setUploading(true);
            setError("");
            setSuccess("");

            const data = await uploadResume(file);

            setResume(data);

            setSuccess(
                "Resume uploaded successfully. Your profile is now application-ready."
            );
            showSuccess(
                "Resume uploaded successfully. Your profile is now application-ready.",
                "Resume uploaded"
            );
        } catch (err) {
            console.error("Resume upload failed:", err);

            setError(
                err?.response?.data?.message ||
                "Unable to upload resume."
            );
            showError(
                err?.response?.data?.message ||
                "Unable to upload resume."
            );
        } finally {
            setUploading(false);
        }
    };

    const handleInputChange = async (event) => {
        const file = event.target.files?.[0];

        await handleFile(file);

        event.target.value = "";
    };

    const handleDrop = async (event) => {
        event.preventDefault();

        setDragActive(false);

        const file = event.dataTransfer.files?.[0];

        await handleFile(file);
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            "Delete your current resume?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeleting(true);
            setError("");
            setSuccess("");

            await deleteResume();

            setResume(null);

            setSuccess("Resume deleted successfully.");

            showSuccess(
                "Resume deleted successfully.",
                "Resume deleted"
            );
        } catch (err) {
            console.error("Resume deletion failed:", err);

            const message =
                err?.response?.data?.message ||
                "Unable to delete your resume.";

            setError(message);
            showError(message);
        } finally {
            setDeleting(false);
        }
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);
            setError("");

            const response = await downloadResume();

            const blob = new Blob([response.data], {
                type:
                    response.headers?.["content-type"] ||
                    "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);

            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = resume?.fileName || "Resume.pdf";

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();

            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Resume download failed:", err);

            const message =
                err?.response?.data?.message ||
                "Unable to download your resume.";

            setError(message);
            showError(message);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="resume-page">
                <div className="resume-header-skeleton" />
                <div className="resume-content-skeleton" />
                <div className="resume-content-skeleton resume-content-skeleton-small" />
            </div>
        );
    }

    return (
        <div className="resume-page">
            {/* HEADER */}
            <section className="resume-page-header">
                <div>
                    <span className="eyebrow">
                        CAREER DOCUMENTS
                    </span>

                    <h1>Your resume</h1>

                    <p>
                        Keep a recruiter-ready version available
                        for every opportunity you pursue.
                    </p>
                </div>

                {resume && (
                    <div className="resume-ready-badge">
                        <CheckCircle2 size={16} />
                        Resume ready
                    </div>
                )}
            </section>

            {/* ALERTS */}
            {error && (
                <div className="resume-alert error" role="alert">
                    <AlertCircle size={17} />

                    <span>{error}</span>

                    <button
                        onClick={loadResume}
                        aria-label="Retry loading resume"
                        title="Retry"
                    >
                        <RefreshCw size={15} />
                    </button>
                </div>
            )}

            {success && (
                <div className="resume-alert success" role="status">
                    <CheckCircle2 size={17} />

                    <span>{success}</span>
                </div>
            )}

            {/* CURRENT RESUME */}
            {resume ? (
                <>
                    <section className="resume-file-card">
                        <div className="resume-file-icon">
                            <FileCheck2 size={27} />
                        </div>

                        <div className="resume-file-info">
                            <div className="resume-file-label">
                                <span className="eyebrow">
                                    CURRENT RESUME
                                </span>

                                <span className="resume-pdf-pill">
                                    PDF
                                </span>
                            </div>

                            <h2>
                                {resume.fileName || "Resume.pdf"}
                            </h2>

                            <div className="resume-file-meta">
                                <span>
                                    {formatFileSize(
                                        resume.fileSize
                                    )}
                                </span>

                                {resume.updatedAt && (
                                    <span>
                                        Updated{" "}
                                        {new Date(
                                            resume.updatedAt
                                        ).toLocaleDateString(
                                            "en-IN"
                                        )}
                                    </span>
                                )}

                                <span className="resume-secure-meta">
                                    <ShieldCheck size={12} />
                                    Securely stored
                                </span>
                            </div>
                        </div>

                        <div className="resume-file-actions">
                            <button
                                className="secondary-button"
                                onClick={handleDownload}
                                disabled={downloading}
                            >
                                <Download size={16} />

                                {downloading
                                    ? "Downloading..."
                                    : "Download"}
                            </button>

                            <button
                                className="danger-outline-button"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                <Trash2 size={16} />

                                {deleting
                                    ? "Deleting..."
                                    : "Delete"}
                            </button>
                        </div>
                    </section>

                    {/* REPLACE */}
                    <section className="resume-replace-section">
                        <div className="resume-replace-icon">
                            <RefreshCw size={18} />
                        </div>

                        <div>
                            <span className="eyebrow">
                                KEEP IT FRESH
                            </span>

                            <h2>
                                Replace your current resume
                            </h2>

                            <p>
                                Uploading a new PDF will replace
                                the existing resume associated
                                with your profile.
                            </p>
                        </div>

                        <button
                            className="secondary-button"
                            onClick={() =>
                                inputRef.current?.click()
                            }
                            disabled={uploading}
                        >
                            <Upload size={16} />

                            {uploading
                                ? "Uploading..."
                                : "Upload new version"}
                        </button>

                        <input
                            ref={inputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={handleInputChange}
                            hidden
                        />
                    </section>
                </>
            ) : (
                /* EMPTY / UPLOAD */
                <section
                    className={`resume-dropzone ${
                        dragActive ? "drag-active" : ""
                    }`}
                    onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                    }}
                    onDragLeave={(event) => {
                        if (
                            event.currentTarget ===
                            event.target
                        ) {
                            setDragActive(false);
                        }
                    }}
                    onDrop={handleDrop}
                >
                    <div className="resume-upload-icon">
                        <Upload size={28} />
                    </div>

                    <div className="resume-dropzone-badge">
                        <FileText size={12} />
                        PDF RESUME
                    </div>

                    <h2>Upload your resume</h2>

                    <p>
                        Drag and drop your resume here, or choose
                        a PDF from your computer.
                    </p>

                    <div className="resume-upload-rules">
                        <span>PDF only</span>
                        <span>Maximum 5 MB</span>
                        <span>Secure upload</span>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() =>
                            inputRef.current?.click()
                        }
                        disabled={uploading}
                    >
                        <Upload size={17} />

                        {uploading
                            ? "Uploading..."
                            : "Choose PDF"}
                    </button>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        onChange={handleInputChange}
                        hidden
                    />
                </section>
            )}

            {/* READINESS */}
            <section className="resume-checklist">
                <div className="resume-checklist-heading">
                    <div>
                        <span className="eyebrow">
                            APPLICATION READINESS
                        </span>

                        <h2>Before you apply</h2>

                        <p>
                            A strong application starts with a
                            clean, current resume.
                        </p>
                    </div>

                    <div className="resume-checklist-icon">
                        <ShieldCheck size={21} />
                    </div>
                </div>

                <div className="resume-check-grid">
                    <div className="resume-check-item">
                        <div>
                            <CheckCircle2 size={17} />
                        </div>

                        <section>
                            <strong>
                                Keep one focused version
                            </strong>

                            <p>
                                Tailor your resume for the type
                                of role you're targeting.
                            </p>
                        </section>
                    </div>

                    <div className="resume-check-item">
                        <div>
                            <CheckCircle2 size={17} />
                        </div>

                        <section>
                            <strong>
                                Make achievements measurable
                            </strong>

                            <p>
                                Show impact with numbers,
                                outcomes and concrete results.
                            </p>
                        </section>
                    </div>

                    <div className="resume-check-item">
                        <div>
                            <CheckCircle2 size={17} />
                        </div>

                        <section>
                            <strong>
                                Keep technical skills relevant
                            </strong>

                            <p>
                                Highlight tools and technologies
                                that match the role you're pursuing.
                            </p>
                        </section>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Resume;