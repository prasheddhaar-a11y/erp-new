/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Forgot Password View
Purpose     : Renders and coordinates Forgot Password View UI behavior
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

import { FormEvent, useState } from "react"
import { KeyRound, LockKeyhole, Mail } from "lucide-react"

import { API_URL } from "@/app/shared/api"
import { useAuthModalStore } from "@/store/authModalStore"

import { AuthBrandHeader, AuthInput, AuthPrimaryButton } from "./AuthParts"
import { parseAuthError } from "./session"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function ForgotPasswordView() {
  const { identifier, setIdentifier, setStep } = useAuthModalStore()
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [otp, setOtp] = useState("")
  const [resetToken, setResetToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [logoutOtherDevices, setLogoutOtherDevices] = useState(true)
  const [status, setStatus] = useState("Enter your email or phone number to reset your password.")
  const [busy, setBusy] = useState(false)

  async function startReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!identifier.trim()) return setStatus("Enter your email or phone number.")
    setBusy(true)
    try {
      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      const response = await fetch(`${API_URL}/api/v1/auth/password-reset/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier.trim() }),
      })
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      if (!response.ok) throw new Error(await parseAuthError(response))
      const data = await response.json() as { message?: string }
      setStatus(data.message ?? "OTP sent.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start password reset.")
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/password-reset/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier.trim(), otp: otp.trim() }),
      })
      if (!response.ok) throw new Error(await parseAuthError(response))
      const data = await response.json() as { reset_token: string; message?: string }
      setResetToken(data.reset_token)
      setStatus(data.message ?? "Set a new password.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OTP verification failed.")
    } finally {
      setBusy(false)
    }
  }

  async function completeReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/password-reset/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: password,
          confirm_password: confirmPassword,
          logout_other_devices: logoutOtherDevices,
        }),
      })
      if (!response.ok) throw new Error(await parseAuthError(response))
      setStatus("Password reset. You can log in now.")
      window.setTimeout(() => setStep("identifier"), 700)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset failed.")
    } finally {
      setBusy(false)
    }
  }

  const handler = resetToken ? completeReset : status.toLowerCase().includes("otp") ? verifyOtp : startReset

  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <form onSubmit={handler} className="flex flex-col">
      <AuthBrandHeader title="Reset password" subtitle={status} />

      <div className="mt-6 space-y-3">
        {!resetToken ? (
          <>
            <AuthInput label="Email / Phone Number" icon={Mail} value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="admin@pinesphere.com" />
            {status.toLowerCase().includes("otp") ? <AuthInput label="OTP" icon={KeyRound} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter 6-digit code" inputMode="numeric" /> : null}
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <AuthInput label="New password" icon={LockKeyhole} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Min. 8 characters" />
              <AuthInput label="Confirm" icon={LockKeyhole} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" />
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#475569]">
              <input type="checkbox" checked={logoutOtherDevices} onChange={(event) => setLogoutOtherDevices(event.target.checked)} className="h-4 w-4 rounded border-[#cbd5e1] accent-[var(--pinesphere-green)]" />
              Log out of other devices
            </label>
          </>
        )}
      </div>

      <AuthPrimaryButton type="submit" disabled={busy} className="mt-5">
        {busy ? "WORKING..." : "CONTINUE"}
      </AuthPrimaryButton>
    </form>
  )
}
