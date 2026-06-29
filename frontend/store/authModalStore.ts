/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Auth Modal Store
Purpose     : Provides Auth Modal Store frontend logic and shared types
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

import { create } from "zustand"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export type AuthView = "login" | "register"
export type AuthStep = "identifier" | "password" | "otp" | "forgot" | "set-password" | "success"

interface AuthModalStore {
  isOpen: boolean
  view: AuthView
  step: AuthStep
  identifier: string
  openModal: (view?: AuthView) => void
  closeModal: () => void
  setView: (view: AuthView) => void
  setStep: (step: AuthStep) => void
  setIdentifier: (val: string) => void
}

/* =====================================================
   SECTION: STATE MANAGEMENT
   PURPOSE:
   This section stores temporary UI data such as loading, errors, filters, and form values.
   State changes here control what the user sees on the screen.
===================================================== */

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isOpen: false,
  view: "login",
  step: "identifier",
  identifier: "",
  openModal: (view = "login") => set({ isOpen: true, view, step: "identifier" }),
  closeModal: () => set({ isOpen: false, step: "identifier", identifier: "" }),
  setView: (view) => set({ view, step: "identifier" }),
  setStep: (step) => set({ step }),
  setIdentifier: (identifier) => set({ identifier }),
}))
