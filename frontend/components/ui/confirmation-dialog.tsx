/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Confirmation Dialog
Purpose     : Renders and coordinates Confirmation Dialog UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmationDialog = React.forwardRef<HTMLDivElement, ConfirmationDialogProps>(
  (
    {
      isOpen,
      title,
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
      isDangerous = false,
      isLoading = false,
      onConfirm,
      onCancel,
    },
    ref
  ) => {
    /* =====================================================
       SECTION: STATE MANAGEMENT
       PURPOSE:
       This section stores temporary UI data such as loading, errors, filters, and form values.
       State changes here control what the user sees on the screen.
    ===================================================== */

    const [isLoading_, setIsLoading] = React.useState(false);

    if (!isOpen) return null;

    /* =====================================================
       SECTION: EVENT HANDLERS
       PURPOSE:
       This section responds to user actions such as clicks, typing, and form submission.
       Handlers connect interface events to state updates or API calls.
    ===================================================== */

    /* =====================================================
       SECTION: HELPER FUNCTIONS
       PURPOSE:
       This section contains small reusable utilities used by the file.
       Helpers keep repeated logic in one clear place.
    ===================================================== */

    const handleConfirm = async () => {
      setIsLoading(true);
      try {
        await onConfirm();
      } finally {
        setIsLoading(false);
      }
    };

    const loading = isLoading || isLoading_;

    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black/50 animate-in fade-in"
          onClick={onCancel}
        />

        {/* Dialog */}
        <div
          ref={ref}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-lg border border-border bg-background shadow-lg",
            "animate-in fade-in zoom-in-95 duration-200"
          )}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              {isDangerous && (
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-6">{message}</p>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button
                variant={isDangerous ? "destructive" : "default"}
                size="sm"
                onClick={handleConfirm}
                disabled={loading}
              >
                {isLoading_ ? "Loading..." : confirmText}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }
);

ConfirmationDialog.displayName = "ConfirmationDialog";

export { ConfirmationDialog };

/**
 * Hook for managing confirmation dialog state
 */
export function useConfirmationDialog() {
  const [state, setState] = React.useState<ConfirmationDialogProps & { isOpen: boolean }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
  });

  const openDialog = (config: Omit<ConfirmationDialogProps, "isOpen" | "onCancel"> & { onCancel?: () => void }) => {
    return new Promise<boolean>((resolve) => {
      setState({
        isOpen: true,
        ...config,
        onConfirm: async () => {
          await config.onConfirm();
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          config.onCancel?.();
          setState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const closeDialog = () => {
    state.onCancel();
  };

  return { ...state, openDialog, closeDialog };
}
