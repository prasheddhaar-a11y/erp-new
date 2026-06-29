/* =====================================================
PINESPHERE ERP
Module      : Profile Module
Component   : Settings Profile Service
Purpose     : Provides Settings Profile Service frontend logic and shared types
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

import { API_URL, apiRequest, getStoredSessionValue, parseRequestError, storeSessionValue } from "@/app/shared/api"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export type ProfileApiResponse = {
  id?: string
  email: string
  full_name: string
  phone?: string | null
  role?: string | null
  role_abbreviation?: string | null
  branch_id?: string | null
  franchise_id?: string | null
  profile_photo?: string | null
  is_active?: boolean
  email_verified?: boolean | null
  updated_at?: string | null
}

export type ProfileForm = {
  studentUserName: string
  username: string
  dateOfBirth: string
  gender: string
  parentName: string
  parentEmail: string
  parentContactNumber: string
  standardCourseBatch: string
  mobileNumber: string
  alternateContact: string
  email: string
  residentialAddress: string
  city: string
  state: string
  pincode: string
  permanentAddress: string
  area: string
  schoolCollegeName: string
}

export type ProfilePreferences = {
  timezone: string
  automaticTimezone: boolean
  notifications: {
    sessionReminderHour: boolean
    sessionReminderDay: boolean
    sessionStart: boolean
    promotionalCampaigns: boolean
  }
  channels: {
    whatsapp: boolean
    email: boolean
    sms: boolean
    push: boolean
  }
}

/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

const PROFILE_DETAILS_KEY = "pinesphere_profile_settings_details"
const PROFILE_PREFERENCES_KEY = "pinesphere_profile_settings_preferences"

export const emptyProfileForm: ProfileForm = {
  studentUserName: "",
  username: "",
  dateOfBirth: "",
  gender: "",
  parentName: "",
  parentEmail: "",
  parentContactNumber: "",
  standardCourseBatch: "",
  mobileNumber: "",
  alternateContact: "",
  email: "",
  residentialAddress: "",
  city: "",
  state: "",
  pincode: "",
  permanentAddress: "",
  area: "",
  schoolCollegeName: "",
}

export const defaultPreferences: ProfilePreferences = {
  timezone: "Asia/Kolkata",
  automaticTimezone: false,
  notifications: {
    sessionReminderHour: true,
    sessionReminderDay: true,
    sessionStart: true,
    promotionalCampaigns: false,
  },
  channels: {
    whatsapp: true,
    email: true,
    sms: false,
    push: true,
  },
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return { ...fallback, ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

function readLocalProfileForm() {
  if (typeof window === "undefined") return emptyProfileForm
  return safeJsonParse<ProfileForm>(window.localStorage.getItem(PROFILE_DETAILS_KEY), emptyProfileForm)
}

function writeLocalProfileForm(form: ProfileForm) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PROFILE_DETAILS_KEY, JSON.stringify(form))
}

function readLocalPreferences() {
  if (typeof window === "undefined") return defaultPreferences
  const saved = safeJsonParse<ProfilePreferences>(window.localStorage.getItem(PROFILE_PREFERENCES_KEY), defaultPreferences)
  return {
    ...defaultPreferences,
    ...saved,
    notifications: { ...defaultPreferences.notifications, ...saved.notifications },
    channels: { ...defaultPreferences.channels, ...saved.channels },
  }
}

function writeLocalPreferences(preferences: ProfilePreferences) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PROFILE_PREFERENCES_KEY, JSON.stringify(preferences))
}

function apiProfileToForm(profile: ProfileApiResponse, saved: ProfileForm): ProfileForm {
  return {
    ...saved,
    studentUserName: profile.full_name ?? saved.studentUserName,
    username: saved.username || profile.email?.split("@")[0] || "",
    mobileNumber: profile.phone ?? saved.mobileNumber,
    email: profile.email ?? saved.email,
  }
}

function cacheApiProfile(profile: ProfileApiResponse) {
  if (typeof window === "undefined") return
  const accessToken = getStoredSessionValue("pinesphere_access_token")
  const remember = window.localStorage.getItem("pinesphere_access_token") === accessToken
  storeSessionValue("pinesphere_profile", JSON.stringify(profile), remember)
}

export async function loadProfileSettings() {
  const saved = readLocalProfileForm()
  const profile = await apiRequest<ProfileApiResponse>("/profile/me", "")
  cacheApiProfile(profile)
  return {
    profile,
    form: apiProfileToForm(profile, saved),
  }
}

export async function saveProfileSettings(form: ProfileForm) {
  writeLocalProfileForm(form)

  const updated = await apiRequest<ProfileApiResponse>("/profile/me", "", {
    method: "PATCH",
    body: JSON.stringify({
      full_name: form.studentUserName.trim(),
      phone: form.mobileNumber.trim() || null,
    }),
  })

  cacheApiProfile(updated)
  writeLocalProfileForm(apiProfileToForm(updated, form))
  return updated
}

export async function changeProfilePassword(payload: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  return apiRequest<{ message?: string }>("/profile/change-password", "", {
    method: "PATCH",
    body: JSON.stringify({
      current_password: payload.currentPassword,
      new_password: payload.newPassword,
      confirm_password: payload.confirmPassword,
      logout_other_devices: true,
    }),
  })
}

export async function loadProfilePreferences() {
  try {
    return await apiRequest<ProfilePreferences>("/profile/preferences", "")
  /* =====================================================
     SECTION: ERROR HANDLING
     PURPOSE:
     This section handles expected failures and converts them into useful responses.
     Good error handling keeps the app stable when something goes wrong.
  ===================================================== */

  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (!/404|not found|method not allowed/i.test(message)) throw error
    return readLocalPreferences()
  }
}

export async function saveProfilePreferences(preferences: ProfilePreferences) {
  try {
    return await apiRequest<ProfilePreferences>("/profile/preferences", "", {
      method: "PATCH",
      body: JSON.stringify(preferences),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (!/404|not found|method not allowed/i.test(message)) throw error

    // TODO: Replace this local persistence with the backend preferences endpoint once it is available.
    writeLocalPreferences(preferences)
    return preferences
  }
}

export async function trySetAutomaticTimezone(preferences: ProfilePreferences) {
  if (typeof Intl === "undefined") return preferences
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return timezone ? { ...preferences, timezone } : preferences
}

export async function isProfilePreferencesApiAvailable() {
  const accessToken = getStoredSessionValue("pinesphere_access_token")
  if (!accessToken) return false
  const response = await fetch(`${API_URL}/profile/preferences`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).catch(() => null)
  if (!response) return false
  if (response.ok) return true
  if (response.status === 404 || response.status === 405) return false
  throw new Error(await parseRequestError(response))
}
