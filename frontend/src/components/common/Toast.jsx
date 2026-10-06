import {
    CheckCircle2,
    Info,
    TriangleAlert,
    X,
    XCircle,
} from "lucide-react";

const ICONS = {
    success: CheckCircle2,
    error: XCircle,
    warning: TriangleAlert,
    info: Info,
};

const Toast = ({ toast, onClose }) => {
    if (!toast) return null;

    const Icon = ICONS[toast.type] || Info;

    return (
        <div
            className={`toast toast-${toast.type || "info"}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon">
                <Icon size={20} />
            </div>

            <div className="toast-content">
                {toast.title && <strong>{toast.title}</strong>}

                {toast.message && <p>{toast.message}</p>}
            </div>

            <button
                type="button"
                className="toast-close"
                onClick={onClose}
                aria-label="Close notification"
            >
                <X size={17} />
            </button>
        </div>
    );
};

export default Toast;