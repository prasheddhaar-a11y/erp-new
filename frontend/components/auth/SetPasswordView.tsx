/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Set Password View
Purpose     : Renders and coordinates Set Password View UI behavior
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

import { AuthBrandHeader, AuthInput, AuthPrimaryButton } from "./AuthParts"
import { parseAuthError, persistAuthSession } from "./session"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function SetPasswordView() {
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState("Create a secure password for your Pinesphere account.")
  const [busy, setBusy] = useState(false)

  async function continueWithPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setStatus("Passwords do not match.")
      return
    }
    const registrationToken = window.sessionStorage.getItem("pinesphere_pending_registration_token") ?? ""
    if (!registrationToken) {
      setStatus("Registration token is missing. Please verify OTP again.")
      return
    }
    setBusy(true)
    try {
      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      const response = await fetch(`${API_URL}/api/v1/auth/register/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registration_token: registrationToken,
          password,
          confirm_password: confirmPassword,
          remember_me: true,
        }),
      })
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      if (!response.ok) throw new Error(await parseAuthError(response))
      window.sessionStorage.removeItem("pinesphere_pending_registration_token")
      window.sessionStorage.removeItem("pinesphere_pending_auth_full_name")
      await persistAuthSession(await response.json(), true)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Account could not be created.")
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
    <form onSubmit={continueWithPassword} className="flex flex-col">
      <AuthBrandHeader title="Set password" subtitle={status} />

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <AuthInput label="Password" icon={LockKeyhole} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Min. 8 characters" />
        <AuthInput label="Confirm" icon={LockKeyhole} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repeat password" />
      </div>

      <AuthPrimaryButton type="submit" disabled={busy} className="mt-5">
        {busy ? "CREATING..." : "CREATE ACCOUNT"}
      </AuthPrimaryButton>
    </form>
  )
}
