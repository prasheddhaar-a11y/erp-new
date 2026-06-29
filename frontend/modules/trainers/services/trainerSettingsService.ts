/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : trainerSettingsService.ts
 * Purpose     : Trainer-scoped profile settings service.
 *               Defines a trimmed TrainerProfileForm with only trainer-relevant
 *               fields. Password function is re-exported from the shared service.
 *               saveProfilePreferences is overridden locally — the backend
 *               PATCH /profile/preferences endpoint returns 404 for trainer role
 *               (MVP decision: persist to localStorage only, no API call).
 */

import { apiRequest } from "@/lib/api"

// ─── Re-exports from shared service (role-agnostic) ──────────────────────────
// NOTE: saveProfilePreferences is intentionally NOT re-exported here.
//       The backend /profile/preferences endpoint is not available for trainers.
//       A trainer-local override below handles saves without hitting the API.

export {
  changeProfilePassword,
  defaultPreferences,
  loadProfilePreferences,
  trySetAutomaticTimezone,
  type ProfilePreferences,
} from "@/lib/api/settingsProfile"

// ─── Trainer-specific profile API response ────────────────────────────────────

export type TrainerProfileApiResponse = {
  id?: string
  email: string
  full_name: string
  phone?: string | null
  role?: string | null
  role_abbreviation?: string | null
  branch_id?: string | null
  branch_name?: string | null
  is_active?: boolean
  updated_at?: string | null
}

// ─── Trainer-specific form shape ──────────────────────────────────────────────

export type TrainerProfileForm = {
  /** Maps to full_name on the API */
  fullName: string
  username: string
  dateOfBirth: string
  gender: string
  mobileNumber: string
  alternateContact: string
  email: string
  city: string
  state: string
  pincode: string
  residentialAddress: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TRAINER_PROFILE_KEY = "pinesphere_trainer_profile_settings"
const TRAINER_PREFERENCES_KEY = "pinesphere_trainer_preferences_settings"

export const emptyTrainerProfileForm: TrainerProfileForm = {
  fullName: "",
  username: "",
  dateOfBirth: "",
  gender: "",
  mobileNumber: "",
  alternateContact: "",
  email: "",
  city: "",
  state: "",
  pincode: "",
  residentialAddress: "",
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return { ...fallback, ...JSON.parse(raw) } as T
  } catch {
    return fallback
  }
}

function readLocalTrainerForm(): TrainerProfileForm {
  if (typeof window === "undefined") return emptyTrainerProfileForm
  return safeJsonParse<TrainerProfileForm>(
    window.localStorage.getItem(TRAINER_PROFILE_KEY),
    emptyTrainerProfileForm,
  )
}

function writeLocalTrainerForm(form: TrainerProfileForm): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TRAINER_PROFILE_KEY, JSON.stringify(form))
}

function apiResponseToForm(
  profile: TrainerProfileApiResponse,
  saved: TrainerProfileForm,
): TrainerProfileForm {
  return {
    ...saved,
    fullName: profile.full_name || saved.fullName,
    username: saved.username || profile.email?.split("@")[0] || "",
    mobileNumber: profile.phone ?? saved.mobileNumber,
    email: profile.email || saved.email,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Load trainer profile settings.
 * Fetches GET /profile/me and merges the response with any locally saved form
 * values so manually entered fields (DOB, city, etc.) are preserved.
 */
export async function loadTrainerProfileSettings(): Promise<{
  profile: TrainerProfileApiResponse
  form: TrainerProfileForm
}> {
  const saved = readLocalTrainerForm()
  const profile = await apiRequest<TrainerProfileApiResponse>("/profile/me", "")
  return {
    profile,
    form: apiResponseToForm(profile, saved),
  }
}

/**
 * Save trainer profile settings.
 * Persists the full form to localStorage and sends only the API-backed fields
 * (full_name, phone) to PATCH /profile/me.
 */
export async function saveTrainerProfileSettings(
  form: TrainerProfileForm,
): Promise<TrainerProfileApiResponse> {
  writeLocalTrainerForm(form)

  const updated = await apiRequest<TrainerProfileApiResponse>("/profile/me", "", {
    method: "PATCH",
    body: JSON.stringify({
      full_name: form.fullName.trim(),
      phone: form.mobileNumber.trim() || null,
    }),
  })

  // Re-merge so any backend-normalised values replace the local copy
  writeLocalTrainerForm(apiResponseToForm(updated, form))
  return updated
}

/**
 * Save trainer preferences — localStorage only.
 *
 * MVP: PATCH /profile/preferences returns 404 for trainer role.
 * This function is a drop-in replacement for the shared saveProfilePreferences.
 * It persists to localStorage and returns the same object so the UI succeeds.
 * When the backend endpoint is ready, replace this with the shared export.
 */
export async function saveProfilePreferences(
  preferences: import("@/lib/api/settingsProfile").ProfilePreferences,
): Promise<import("@/lib/api/settingsProfile").ProfilePreferences> {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(TRAINER_PREFERENCES_KEY, JSON.stringify(preferences))
  }
  return preferences
}
