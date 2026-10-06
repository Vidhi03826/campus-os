import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 3500;

export const useToast = () => {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const removeToast = useCallback((id) => {
        setToasts((current) =>
            current.filter((toast) => toast.id !== id)
        );

        const timer = timers.current.get(id);

        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const showToast = useCallback(
        ({
             type = "info",
             title = "",
             message = "",
             duration = DEFAULT_DURATION,
         }) => {
            const id = `${Date.now()}-${Math.random()}`;

            setToasts((current) => [
                ...current,
                {
                    id,
                    type,
                    title,
                    message,
                },
            ]);

            const timer = setTimeout(() => {
                removeToast(id);
            }, duration);

            timers.current.set(id, timer);

            return id;
        },
        [removeToast]
    );

    useEffect(() => {
        return () => {
            timers.current.forEach((timer) => clearTimeout(timer));
            timers.current.clear();
        };
    }, []);

    const success = useCallback(
        (message, title = "Success") =>
            showToast({
                type: "success",
                title,
                message,
            }),
        [showToast]
    );

    const error = useCallback(
        (message, title = "Something went wrong") =>
            showToast({
                type: "error",
                title,
                message,
            }),
        [showToast]
    );

    const warning = useCallback(
        (message, title = "Please note") =>
            showToast({
                type: "warning",
                title,
                message,
            }),
        [showToast]
    );

    const info = useCallback(
        (message, title = "Heads up") =>
            showToast({
                type: "info",
                title,
                message,
            }),
        [showToast]
    );

    return {
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        removeToast,
    };
};