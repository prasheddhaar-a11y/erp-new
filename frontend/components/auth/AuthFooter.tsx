/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Auth Footer
Purpose     : Renders and coordinates Auth Footer UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

// =====================================================
// IMPORTS
// =====================================================

"use client"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function AuthFooter() {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <p className="mx-auto mt-4 max-w-[22rem] px-2 text-center text-[11px] font-semibold leading-5 text-[#64748b]">
      By continuing, I accept the{" "}
      <a
        href="/terms"
        target="_blank"
        rel="noreferrer"
        className="font-black text-[#2563EB] hover:underline"
      >
        Terms & Conditions
      </a>
      ,{" "}
      <a
        href="/privacy"
        target="_blank"
        rel="noreferrer"
        className="font-black text-[#2563EB] hover:underline"
      >
        Privacy Policy
      </a>
    </p>
  )
}
