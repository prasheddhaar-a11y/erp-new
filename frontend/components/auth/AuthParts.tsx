/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Auth Parts
Purpose     : Renders and coordinates Auth Parts UI behavior
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

import { Eye, EyeOff, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function GoogleMark() {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.1 3.2v2.7h3.4c2-1.8 3.4-4.5 3.4-7.9z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.8l-3.4-2.7c-.9.6-2.2 1-3.9 1-3 0-5.5-2-6.4-4.7H2.1v2.8C3.9 20.4 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.6 13.8c-.2-.6-.4-1.2-.4-1.8s.1-1.3.4-1.8V7.4H2.1C1.4 8.8 1 10.4 1 12s.4 3.2 1.1 4.6l3.5-2.8z" />
      <path fill="#EA4335" d="M12 5.5c1.6 0 3.1.6 4.2 1.7l3.1-3.1C17.5 2.2 15 1 12 1 7.7 1 3.9 3.6 2.1 7.4l3.5 2.8c.9-2.7 3.4-4.7 6.4-4.7z" />
    </svg>
  )
}

export function AuthBrandHeader({
  eyebrow = "Pinesphere ERP",
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle: ReactNode
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--pinesphere-navy)] text-base font-black text-white shadow-[0_12px_22px_rgba(7,27,74,0.18)] ring-4 ring-[var(--pinesphere-green-light)]">
        P
      </div>
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--pinesphere-green)]">{eyebrow}</p>
      <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#071129]">{title}</h2>
      <p className="mt-1.5 text-sm font-semibold leading-5 text-[#64748b]">{subtitle}</p>
    </div>
  )
}

export function AuthInput({
  label,
  icon: Icon,
  error,
  type = "text",
  ...props
}: React.ComponentProps<"input"> & {
  label: string
  icon: LucideIcon
  error?: string
}) {
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === "password"

  return (
    <label className="block text-sm font-black text-[#1e293b]">
      {label}
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#64748b]" />
        <Input
          {...props}
          type={isPassword && showPassword ? "text" : type}
          aria-invalid={Boolean(error)}
          className={`h-10 max-w-full rounded-xl border-[#d6e1dc] bg-white pl-10 pr-10 text-sm font-bold text-[var(--pinesphere-navy)] shadow-inner transition placeholder:text-[#94a3b8] focus-visible:border-[var(--pinesphere-green)] focus-visible:ring-[rgba(11,122,90,0.18)] ${error ? "border-[#ef4444] ring-2 ring-[#fecaca]" : ""} ${props.className ?? ""}`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] transition hover:text-[#071129]"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
      {error ? <span className="mt-1.5 block text-xs font-bold text-[#dc2626]">{error}</span> : null}
    </label>
  )
}

export function AuthPrimaryButton({ className = "", ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      className={`h-10 w-full rounded-xl bg-[#071129] text-sm font-black tracking-wide text-white shadow-[0_12px_22px_rgba(7,17,41,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0f2a1d] disabled:hover:translate-y-0 ${className}`}
    />
  )
}

export function AuthGoogleButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className="h-10 w-full rounded-xl border-[#d6e1dc] bg-white text-sm font-black text-[#334155] shadow-sm transition hover:-translate-y-0.5 hover:border-[#2563EB] hover:bg-[#f8fbff]"
    >
      <GoogleMark />
      {label}
    </Button>
  )
}

export function AuthDivider() {
  return (
    <div className="my-4 flex items-center gap-3 text-[#2563EB]">
      <div className="h-px flex-1 bg-[#dbe5df]" />
      <span className="text-xs font-black">or</span>
      <div className="h-px flex-1 bg-[#dbe5df]" />
    </div>
  )
}
