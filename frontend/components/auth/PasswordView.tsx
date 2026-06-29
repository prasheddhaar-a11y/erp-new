/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Password View
Purpose     : Renders and coordinates Password View UI behavior
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
import { LockKeyhole } from "lucide-react"

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

export function PasswordView() {
  const { identifier, setStep } = useAuthModalStore()
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [status, setStatus] = useState("")
  const [busy, setBusy] = useState(false)

  async function loginWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!password) {
      setStatus("Enter your password.")
      return
    }
    setBusy(true)
    setStatus("")
    try {
      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier.trim(), password, remember_me: rememberMe }),
      })
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      if (!response.ok) throw new Error(await parseAuthError(response))
      await persistAuthSession(await response.json(), rememberMe)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to log in.")
    } finally {
      setBusy(false)
    }
  }

  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <form onSubmit={loginWithPassword} className="flex flex-col">
      <AuthBrandHeader title="Welcome back" subtitle={identifier} />

      <div className="mt-6">
        <AuthInput
          label="Password"
          icon={LockKeyhole}
          id="auth-password-step"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="Enter your password"
          error={status.toLowerCase().includes("password") ? status : undefined}
        />
      </div>
      {status && !status.toLowerCase().includes("password") ? <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-bold text-[#dc2626]">{status}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold">
        <label className="flex items-center gap-2 text-[#475569]">
          <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-[#cbd5e1] accent-[var(--pinesphere-green)]" />
          Remember me
        </label>
        <button type="button" onClick={() => setStep("forgot")} className="text-[#2563EB] hover:underline">
          Forgot password?
        </button>
      </div>

      <AuthPrimaryButton type="submit" disabled={busy} className="mt-5">
        {busy ? "SIGNING IN..." : "LOGIN"}
      </AuthPrimaryButton>
      <button type="button" onClick={() => setStep("otp")} className="mt-3 text-center text-xs font-black text-[var(--pinesphere-green)] hover:underline">
        Login with OTP instead
      </button>
    </form>
  )
}
