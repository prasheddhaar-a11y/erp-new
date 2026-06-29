/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : O T P Login Form
Purpose     : Renders and coordinates O T P Login Form UI behavior
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

import { FormEvent, useEffect, useState } from "react"
import { Mail } from "lucide-react"

import { API_URL } from "@/app/shared/api"
import { useAuthModalStore } from "@/store/authModalStore"

import { AuthInput, AuthPrimaryButton } from "./AuthParts"
import { OTPInput } from "./OTPInput"
import { parseAuthError, persistAuthSession } from "./session"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type OTPLoginFormProps = {
  onPasswordMode: () => void
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function OTPLoginForm({ onPasswordMode }: OTPLoginFormProps) {
  const { identifier, setIdentifier } = useAuthModalStore()
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [cooldown, setCooldown] = useState(0)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)

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

  async function sendOtp(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    if (!identifier.trim()) {
      setMessage({ type: "error", text: "Enter your email address or mobile number." })
      return
    }
    setSending(true)
    setMessage(null)
    try {
      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      const response = await fetch(`${API_URL}/api/v1/auth/otp/start`, {
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
      const data = await response.json() as { message?: string; cooldown_seconds?: number }
      setOtpSent(true)
      setOtp("")
      setCooldown(data.cooldown_seconds ?? 60)
      setMessage({ type: "success", text: data.message ?? "OTP sent successfully." })
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Could not send OTP." })
    } finally {
      setSending(false)
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (otp.length !== 6) {
      setMessage({ type: "error", text: "Enter the 6-digit OTP." })
      return
    }
    setVerifying(true)
    setMessage(null)
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: identifier.trim(), otp, remember_me: true }),
      })
      if (!response.ok) throw new Error(await parseAuthError(response))
      await persistAuthSession(await response.json(), true)
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "OTP verification failed." })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <form onSubmit={otpSent ? verifyOtp : sendOtp} className="min-w-0">
      <div className="space-y-3">
        <AuthInput
          label="Email Address or Mobile Number"
          icon={Mail}
          id="auth-otp-identifier"
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value)
            setOtpSent(false)
            setOtp("")
            setCooldown(0)
            setMessage(null)
          }}
          autoComplete="username"
          placeholder="admin@pinesphere.com"
          disabled={sending || verifying}
        />

        {otpSent ? (
          <div>
            <label className="block text-sm font-black text-[#1e293b]">
              6-digit OTP
              <div className="mt-2">
                <OTPInput value={otp} onChange={setOtp} disabled={verifying} />
              </div>
            </label>
            <div className="mt-2 flex items-center justify-between gap-3 text-xs font-bold text-[#64748b]">
              <span>{cooldown ? `Resend available in ${cooldown}s` : "You can resend OTP now."}</span>
              <button
                type="button"
                disabled={sending || verifying || cooldown > 0}
                onClick={() => void sendOtp()}
                className="font-black text-[var(--pinesphere-green)] hover:underline disabled:cursor-not-allowed disabled:text-[#94a3b8] disabled:no-underline"
              >
                Resend OTP
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {message ? (
        <p className={`mt-3 rounded-xl border px-3 py-2 text-xs font-bold ${message.type === "success" ? "border-[var(--pinesphere-green-border)] bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]" : "border-[#fecaca] bg-[#fff1f2] text-[#dc2626]"}`}>
          {message.text}
        </p>
      ) : null}

      <AuthPrimaryButton type="submit" disabled={sending || verifying} className="mt-4">
        {otpSent ? (verifying ? "VERIFYING OTP..." : "VERIFY OTP") : (sending ? "SENDING OTP..." : "SEND OTP")}
      </AuthPrimaryButton>

      <button type="button" disabled={sending || verifying} onClick={onPasswordMode} className="mt-3 w-full text-center text-xs font-black text-[#2563EB] hover:underline disabled:cursor-wait disabled:text-[#94a3b8]">
        Back to Password Login
      </button>
    </form>
  )
}
