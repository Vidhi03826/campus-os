import Toast from "./Toast";

const ToastContainer = ({ toasts, removeToast }) => {
    if (!toasts?.length) return null;

    return (
        <div className="toast-container" aria-label="Notifications">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    toast={toast}
                    onClose={() => removeToast(toast.id)}
                />
            ))}
        </div>
    );
};

export default ToastContainer;