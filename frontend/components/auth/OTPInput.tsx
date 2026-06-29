/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : O T P Input
Purpose     : Renders and coordinates O T P Input UI behavior
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

import { useRef } from "react"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type OTPInputProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function OTPInput({ value, onChange, disabled }: OTPInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: 6 }, (_, index) => value[index] ?? "")

  function updateDigit(index: number, nextValue: string) {
    const digit = nextValue.replace(/\D/g, "").slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = digit
    onChange(nextDigits.join(""))
    if (digit && index < 5) refs.current[index + 1]?.focus()
  }

  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node }}
          value={digit}
          disabled={disabled}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`OTP digit ${index + 1}`}
          maxLength={1}
          onChange={(event) => updateDigit(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index] && index > 0) refs.current[index - 1]?.focus()
          }}
          onPaste={(event) => {
            event.preventDefault()
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
            if (pasted) {
              onChange(pasted)
              refs.current[Math.min(pasted.length, 6) - 1]?.focus()
            }
          }}
          className="h-11 min-w-0 rounded-xl border border-[#d6e1dc] bg-white text-center text-base font-black text-[var(--pinesphere-navy)] shadow-inner outline-none transition focus:border-[var(--pinesphere-green)] focus:ring-2 focus:ring-[rgba(11,122,90,0.18)] disabled:bg-[#f8fafc]"
        />
      ))}
    </div>
  )
}
