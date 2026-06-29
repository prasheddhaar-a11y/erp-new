/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Login View
Purpose     : Renders and coordinates Login View UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

import { API_URL } from "@/app/shared/api"
import { useAuthModalStore } from "@/store/authModalStore"

import { AuthBrandHeader, AuthDivider, AuthGoogleButton } from "./AuthParts"
import { AuthFooter } from "./AuthFooter"
import { OTPLoginForm } from "./OTPLoginForm"
import { PasswordLoginForm } from "./PasswordLoginForm"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type LoginMode = "password" | "otp"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function LoginView() {
  const { setView } = useAuthModalStore()
  const [mode, setMode] = useState<LoginMode>("password")

  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <div className="min-w-0 overflow-hidden">
      <AuthBrandHeader
        title="Login"
        subtitle={<>or <button type="button" onClick={() => setView("register")} className="font-black text-[#2563EB] hover:underline">Create an account</button></>}
      />

      <div className="mt-5 min-h-[250px] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {mode === "password" ? (
              <PasswordLoginForm onOtpMode={() => setMode("otp")} />
            ) : (
              <OTPLoginForm onPasswordMode={() => setMode("password")} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {mode === "password" ? (
        <>
          <AuthDivider />
          <AuthGoogleButton label="Sign in with Google" onClick={() => { window.location.href = `${API_URL}/api/v1/auth/google/login` }} />
          <AuthFooter />
        </>
      ) : null}
    </div>
  )
}
