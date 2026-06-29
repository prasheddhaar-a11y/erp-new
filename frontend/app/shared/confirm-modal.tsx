/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Confirm Modal
Purpose     : Renders and coordinates Confirm Modal UI behavior
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

import { ConfirmationDialog } from "../../components/ui/confirmation-dialog";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type ConfirmActionModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy?: boolean;
  danger?: boolean;
};

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function ConfirmActionModal({
  title,
  message,
  confirmLabel,
  onCancel,
  onConfirm,
  busy = false,
  danger = true,
}: ConfirmActionModalProps) {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <ConfirmationDialog
      isOpen
      title={title}
      message={message}
      confirmText={confirmLabel}
      onCancel={onCancel}
      onConfirm={onConfirm}
      isLoading={busy}
      isDangerous={danger}
    />
  );
}
