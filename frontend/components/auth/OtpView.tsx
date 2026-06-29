/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Otp View
Purpose     : Renders and coordinates Otp View UI behavior
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

import { FormEvent, useEffect, useRef, useState } from "react"
import { KeyRound } from "lucide-react"

import { API_URL } from "@/app/shared/api"
import { useAuthModalStore } from "@/store/authModalStore"

import { AuthBrandHeader, AuthInput, AuthPrimaryButton } from "./AuthParts"
import { parseAuthError, persistAuthSession } from "./session"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function OtpView() {
  const { identifier, view, setStep } = useAuthModalStore()
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [status, setStatus] = useState("Sending OTP...")
  const [busy, setBusy] = useState(false)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    void requestOtp()
  }, [])

  useEffect(() => {
    if (!cooldown) return
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(value - 1, 0)), 1000)
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => window.clearTimeout(timer)
  }, [cooldown])

  async function requestOtp() {
    if (!identifier.trim()) {
      setStatus("Enter your email or phone number first.")
      setStep("identifier")
      return
    }
    setBusy(true)
    setStatus("Sending OTP...")
    try {
      const fullName = window.sessionStorage.getItem("pinesphere_pending_auth_full_name") ?? ""
      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      const response = await fetch(view === "register" ? `${API_URL}/api/v1/auth/register/start` : `${API_URL}/api/v1/auth/otp/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(view === "register" ? { login: identifier.trim(), full_name: fullName } : { login: identifier.trim() }),
      })
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      if (!response.ok) throw new Error(await parseAuthError(response))
      const data = await response.json() as { message?: string; cooldown_seconds?: number }
      setCooldown(data.cooldown_seconds ?? 60)
      setStatus(data.message ?? "OTP sent.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send OTP.")
    } finally {
      setBusy(false)
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!otp.trim()) {
      setStatus("Enter the OTP.")
      return
    }
    setBusy(true)
    try {
      const response = await fetch(view === "register" ? `${API_URL}/api/v1/auth/register/verify-otp` : `${API_URL}/api/v1/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(view === "register" ? { login: identifier.trim(), otp: otp.trim() } : { login: identifier.trim(), otp: otp.trim(), remember_me: true }),
      })
      if (!response.ok) throw new Error(await parseAuthError(response))
      if (view === "register") {
        const data = await response.json() as { registration_token: string }
        const pendingPassword = window.sessionStorage.getItem("pinesphere_pending_auth_password") ?? ""
        const pendingConfirmPassword = window.sessionStorage.getItem("pinesphere_pending_auth_confirm_password") ?? ""
        if (pendingPassword && pendingConfirmPassword) {
          setStatus("Creating your account...")
          const completeResponse = await fetch(`${API_URL}/api/v1/auth/register/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              registration_token: data.registration_token,
              password: pendingPassword,
              confirm_password: pendingConfirmPassword,
              remember_me: true,
            }),
          })
          if (!completeResponse.ok) throw new Error(await parseAuthError(completeResponse))
          window.sessionStorage.removeItem("pinesphere_pending_registration_token")
          window.sessionStorage.removeItem("pinesphere_pending_auth_full_name")
          window.sessionStorage.removeItem("pinesphere_pending_auth_password")
          window.sessionStorage.removeItem("pinesphere_pending_auth_confirm_password")
          await persistAuthSession(await completeResponse.json(), true)
          return
        }
        window.sessionStorage.setItem("pinesphere_pending_registration_token", data.registration_token)
        setStep("set-password")
        return
      }
      await persistAuthSession(await response.json(), true)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "OTP verification failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={verifyOtp} className="flex flex-col">
      <AuthBrandHeader title="Verify OTP" subtitle={identifier} />

      <div className="mt-6">
        <AuthInput
          label="One-time password"
          icon={KeyRound}
          id="auth-otp"
          inputMode="numeric"
          value={otp}
          onChange={(event) => setOtp(event.target.value)}
          placeholder="Enter 6-digit code"
        />
      </div>
      <p className="mt-3 rounded-xl bg-[#f8faf7] px-3 py-2 text-xs font-bold text-[#64748b]">{status}</p>

      <AuthPrimaryButton type="submit" disabled={busy} className="mt-5">
        {busy ? "VERIFYING..." : "CONTINUE"}
      </AuthPrimaryButton>

      <button
        type="button"
        disabled={busy || cooldown > 0}
        onClick={() => void requestOtp()}
        className="mt-3 text-center text-xs font-black text-[var(--pinesphere-green)] hover:underline disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:no-underline"
      >
        Resend OTP{cooldown ? ` (${cooldown}s)` : ""}
      </button>
    </form>
  )
}
