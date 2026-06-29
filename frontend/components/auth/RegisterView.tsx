/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Register View
Purpose     : Renders and coordinates Register View UI behavior
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
import { LockKeyhole, Mail, UserRound } from "lucide-react"

import { API_URL } from "@/app/shared/api"
import { useAuthModalStore } from "@/store/authModalStore"

import { AuthBrandHeader, AuthDivider, AuthGoogleButton, AuthInput, AuthPrimaryButton } from "./AuthParts"
import { AuthFooter } from "./AuthFooter"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function RegisterView() {
  const { identifier, setIdentifier, setStep, setView } = useAuthModalStore()
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  function continueWithRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!fullName.trim()) {
      setError("Enter your full name.")
      return
    }
    if (!identifier.trim()) {
      setError("Enter your email or phone number.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }
    window.sessionStorage.setItem("pinesphere_pending_auth_full_name", fullName.trim())
    window.sessionStorage.setItem("pinesphere_pending_auth_password", password)
    window.sessionStorage.setItem("pinesphere_pending_auth_confirm_password", confirmPassword)
    setError("")
    setStep("otp")
  }

  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <form onSubmit={continueWithRegistration} className="flex flex-col">
      <AuthBrandHeader
        title="Create your account"
        subtitle={<>Already registered? <button type="button" onClick={() => setView("login")} className="font-black text-[#2563EB] hover:underline">Login</button></>}
      />

      <div className="mt-6 space-y-3">
        <AuthInput
          label="Full Name"
          icon={UserRound}
          id="auth-name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          placeholder="Dencil Jaushmy"
          error={!fullName.trim() && error.toLowerCase().includes("full") ? error : undefined}
        />
        <AuthInput
          label="Email / Phone Number"
          icon={Mail}
          id="auth-register-identifier"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          autoComplete="username"
          placeholder="student@pinesphere.com"
          error={!identifier.trim() && error.toLowerCase().includes("email") ? error : undefined}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <AuthInput
            label="Password"
            icon={LockKeyhole}
            id="auth-register-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            error={error.toLowerCase().includes("password") && !error.toLowerCase().includes("match") ? error : undefined}
          />
          <AuthInput
            label="Confirm"
            icon={LockKeyhole}
            id="auth-register-confirm"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Repeat password"
            error={error.toLowerCase().includes("match") ? error : undefined}
          />
        </div>
      </div>

      {error && !error.toLowerCase().includes("full") && !error.toLowerCase().includes("email") && !error.toLowerCase().includes("password") && !error.toLowerCase().includes("match") ? (
        <p className="mt-3 rounded-xl border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-bold text-[#dc2626]">{error}</p>
      ) : null}

      <AuthPrimaryButton type="submit" className="mt-5">
        CREATE ACCOUNT
      </AuthPrimaryButton>

      <AuthDivider />
      <AuthGoogleButton label="Sign up with Google" onClick={() => { window.location.href = `${API_URL}/api/v1/auth/google/login` }} />
      <AuthFooter />
    </form>
  )
}
