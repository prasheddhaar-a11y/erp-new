/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Auth Modal
Purpose     : Renders and coordinates Auth Modal UI behavior
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

import { useEffect, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useAuthModalStore } from "@/store/authModalStore"

import { ForgotPasswordView } from "./ForgotPasswordView"
import { LoginView } from "./LoginView"
import { OtpView } from "./OtpView"
import { PasswordView } from "./PasswordView"
import { RegisterView } from "./RegisterView"
import { SetPasswordView } from "./SetPasswordView"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function useIsMobile() {
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)")
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener("change", update)
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => query.removeEventListener("change", update)
  }, [])

  return isMobile
}

function AuthStepContent() {
  const { step, view, closeModal, setView } = useAuthModalStore()

  if (step === "password") return <PasswordView />
  if (step === "otp") return <OtpView />
  if (step === "forgot") return <ForgotPasswordView />
  if (step === "set-password") return <SetPasswordView />
  if (step === "success") {
    return (
      <div className="flex min-h-full flex-col px-1 py-2">
        <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--pinesphere-green-light)] text-xl font-black text-[var(--pinesphere-green)]">
          P
        </div>
        <h2 className="text-3xl font-black tracking-normal text-[#071129]">Success</h2>
        <p className="mt-3 text-sm leading-6 text-[#64748b]">
          Your account details were accepted. Continue to login to complete authentication.
        </p>
        <Button
          type="button"
          onClick={() => setView("login")}
          className="mt-8 h-12 w-full rounded-xl bg-[#071129] text-base font-black text-white shadow-[0_12px_24px_rgba(7,17,41,0.18)] hover:bg-[#0f2a1d]"
        >
          LOGIN
        </Button>
        <Button type="button" variant="ghost" onClick={closeModal} className="mt-3">
          Close
        </Button>
      </div>
    )
  }
  return view === "register" ? <RegisterView /> : <LoginView />
}

export function AuthModal() {
  const { isOpen, closeModal } = useAuthModalStore()
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
        <DrawerContent className="max-h-[90vh] overflow-hidden border-[#dce8d4] bg-[#f8faf7] px-3 pb-4 pt-3">
          <DrawerTitle className="sr-only">Authentication</DrawerTitle>
          <DrawerDescription className="sr-only">
            Login or create an account.
          </DrawerDescription>
          <div className="mx-auto w-[min(480px,95vw)] max-h-[86vh] overflow-hidden rounded-[22px] border border-white/80 bg-white p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <AuthStepContent />
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) closeModal() }}>
      <DialogContent
        className="w-[min(480px,95vw)] max-w-none max-h-[90vh] overflow-hidden rounded-[22px] border border-white/80 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.22)] duration-200 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-bottom-2"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Authentication</DialogTitle>
        <DialogDescription className="sr-only">
          Login or create an account.
        </DialogDescription>
        <div className="relative max-h-[90vh] min-w-0 overflow-hidden bg-white">
          <div className="relative p-4 sm:p-5">
            <AuthStepContent />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
