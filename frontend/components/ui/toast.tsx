/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Toast
Purpose     : Renders and coordinates Toast UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client";


/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import * as React from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps extends Toast {
  onClose: (id: string) => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ id, message, type, duration = 5000, onClose }, ref) => {
    React.useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => onClose(id), duration);
        /* =====================================================
           SECTION: UI RENDERING
           PURPOSE:
           This section returns the visual layout shown to the user.
           It combines data, state, and components into the final screen.
        ===================================================== */

        return () => clearTimeout(timer);
      }
    }, [id, duration, onClose]);

    const bgColor = {
      success: "bg-[var(--pinesphere-green-light)] border-[var(--pinesphere-green-border)] dark:bg-[rgba(11,122,90,0.18)] dark:border-[var(--pinesphere-green)]",
      error: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      info: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      warning: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
    };

    const textColor = {
      success: "text-[var(--pinesphere-navy)] dark:text-[var(--pinesphere-green-light)]",
      error: "text-red-900 dark:text-red-100",
      info: "text-blue-900 dark:text-blue-100",
      warning: "text-amber-900 dark:text-amber-100",
    };

    const iconColor = {
      success: "text-[var(--pinesphere-green)] dark:text-[var(--pinesphere-green-border)]",
      error: "text-red-600 dark:text-red-400",
      info: "text-blue-600 dark:text-blue-400",
      warning: "text-amber-600 dark:text-amber-400",
    };

    const Icon =
      type === "success" ? CheckCircle : type === "error" ? AlertCircle : type === "warning" ? AlertCircle : Info;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 rounded-lg border p-3 px-4 py-3 text-sm font-medium animate-in fade-in slide-in-from-right-full duration-200",
          bgColor[type],
          textColor[type]
        )}
      >
        <Icon className={cn("h-5 w-5 flex-shrink-0", iconColor[type])} />
        <span className="flex-1">{message}</span>
        <button
          onClick={() => onClose(id)}
          className="ml-2 inline-flex flex-shrink-0 text-current opacity-70 transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);

Toast.displayName = "Toast";

export interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (message: string, type: ToastType = "info", duration = 5000) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev, toast]);
      return id;
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    /* =====================================================
       SECTION: ERROR HANDLING
       PURPOSE:
       This section handles expected failures and converts them into useful responses.
       Good error handling keeps the app stable when something goes wrong.
    ===================================================== */

    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
