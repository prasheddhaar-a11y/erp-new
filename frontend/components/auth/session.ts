/* =====================================================
PINESPHERE ERP
Module      : Authentication Module
Component   : Session
Purpose     : Provides Session frontend logic and shared types
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

import { API_URL, clearStoredSession, storeSessionValue } from "@/app/shared/api"
import { getRoleDashboardPath, normalizeUserRole } from "@/lib/auth"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type AuthProfile = {
  id: string
  email: string
  full_name: string
  role: string
  role_abbreviation?: string
  is_active: boolean
  phone?: string | null
}

type TokenResponse = {
  access_token: string
  refresh_token: string
  user?: AuthProfile
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export async function parseAuthError(response: Response) {
  try {
    const data = await response.json()
    return typeof data.detail === "string" ? data.detail : "Request failed"
  } catch {
    return "Request failed"
  }
}

export async function persistAuthSession(data: TokenResponse, rememberMe = true) {
  const profile = data.user ?? await fetchProfile(data.access_token)
  const normalizedRole = normalizeUserRole(profile.role) ?? normalizeUserRole(profile.role_abbreviation) ?? "public"
  const normalizedProfile = { ...profile, role: normalizedRole }
  clearStoredSession()
  storeSessionValue("pinesphere_access_token", data.access_token, rememberMe)
  storeSessionValue("pinesphere_refresh_token", data.refresh_token, rememberMe)
  storeSessionValue("pinesphere_profile", JSON.stringify(normalizedProfile), rememberMe)
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem("pinesphere_user", JSON.stringify(normalizedProfile))
  storage.setItem("pinesphere_remember_me", String(rememberMe))
  window.location.href = getRoleDashboardPath(normalizedRole)
}

async function fetchProfile(accessToken: string) {
  /* =====================================================
     SECTION: API CALLS
     PURPOSE:
     This section talks to backend or server endpoints.
     It sends requests, receives responses, and prepares data for the UI.
  ===================================================== */

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  /* =====================================================
     SECTION: ERROR HANDLING
     PURPOSE:
     This section handles expected failures and converts them into useful responses.
     Good error handling keeps the app stable when something goes wrong.
  ===================================================== */

  if (!response.ok) throw new Error(await parseAuthError(response))
  return response.json() as Promise<AuthProfile>
}
