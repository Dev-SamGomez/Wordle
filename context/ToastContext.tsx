"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Toast = {
    id: number;
    kind: "success" | "error";
    msg: string;
};

type ToastContextType = {
    pushToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const pushToast = (toast: Omit<Toast, "id">) => {
        console.log("TOAST TRIGGERED", toast);
        const id = Date.now();

        setToasts((prev) => [...prev, { id, ...toast }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    return (
        <ToastContext.Provider value={{ pushToast }}>
            {children}

            <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`px-4 py-2 rounded font-bold text-sm shadow-2xl
            transition-all duration-300 animate-in fade-in slide-in-from-top-4
            ${t.kind === "success"
                                ? "bg-[hsl(var(--tile-correct))] text-foreground"
                                : "bg-background text-foreground"
                            }`}
                    >
                        {t.msg}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);

    if (!ctx) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return ctx;
}