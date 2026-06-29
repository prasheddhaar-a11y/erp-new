/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : trainerService.ts
 * Purpose     : Trainer API service layer.
 *               getTrainerDashboard() tries GET /api/v1/trainer/dashboard first.
 *               Only if the backend returns 404 (endpoint not yet deployed) does
 *               it fall back to the legacy GET /api/trainer/dashboard.
 *               Auth failures (401 / 403) are NOT caught – they propagate to
 *               the caller as proper errors.
 */

import { API_URL, getStoredSessionValue, refreshStoredAccessToken, clearStoredSession } from "@/lib/api"
import type { TrainerBatch, TrainerDashboardResponse, TrainerDashboardV1Response } from "../types"

/** Combined type: v1 shape is preferred; legacy shape is the fallback. */
export type TrainerDashboard = TrainerDashboardV1Response | TrainerDashboardResponse

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function fetchWithAuth(endpoint: string): Promise<Response> {
  const token = getStoredSessionValue("pinesphere_access_token")
  if (!token) {
    clearStoredSession()
    throw new Error("Please log in again.")
  }

  const makeRequest = (bearerToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })

  let response = await makeRequest(token)

  // Auto-refresh on 401 then retry once
  if (response.status === 401) {
    const refreshed = await refreshStoredAccessToken()
    if (refreshed) {
      response = await makeRequest(refreshed)
    }
  }

  return response
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * Fetch the trainer dashboard.
 *
 * Strategy:
 *  1. Call GET /api/v1/trainer/dashboard (structured v1 shape).
 *  2. If the server returns 404, fall back to GET /api/trainer/dashboard
 *     (legacy role_dashboards shape).
 *  3. Any other non-ok status (401, 403, 500 …) throws immediately.
 */
export async function getTrainerDashboard(): Promise<TrainerDashboard> {
  // ── Attempt v1 endpoint ───────────────────────────────────────────────────
  const v1Response = await fetchWithAuth("/api/v1/trainer/dashboard")

  if (v1Response.ok) {
    return v1Response.json() as Promise<TrainerDashboardV1Response>
  }

  // ── 404 only: fall back to legacy endpoint ────────────────────────────────
  if (v1Response.status === 404) {
    const legacyResponse = await fetchWithAuth("/api/trainer/dashboard")
    if (legacyResponse.ok) {
      return legacyResponse.json() as Promise<TrainerDashboardResponse>
    }

    // Legacy endpoint also failed
    let message = `${legacyResponse.status} ${legacyResponse.statusText}`
    try {
      const data = await legacyResponse.json()
      if (typeof data.detail === "string") message = data.detail
    } catch { /* ignore parse error */ }

    if (legacyResponse.status === 401) clearStoredSession()
    throw new Error(message)
  }

  // ── Any other v1 error: propagate immediately ─────────────────────────────
  let errorMessage = `${v1Response.status} ${v1Response.statusText}`
  try {
    const data = await v1Response.json()
    if (typeof data.detail === "string") errorMessage = data.detail
  } catch { /* ignore parse error */ }

  if (v1Response.status === 401) clearStoredSession()
  throw new Error(errorMessage)
}

// ─── Batches ──────────────────────────────────────────────────────────────────

/**
 * Fetch the trainer's assigned batches.
 *
 * Strategy:
 *  1. Call GET /api/v1/trainer/batches.
 *  2. Any non-ok status throws immediately.
 */
export async function getTrainerBatches(): Promise<TrainerBatch[]> {
  const response = await fetchWithAuth("/api/v1/trainer/batches")
  if (response.ok) {
    return response.json() as Promise<TrainerBatch[]>
  }

  let errorMessage = `${response.status} ${response.statusText}`
  try {
    const data = await response.json()
    if (typeof data.detail === "string") errorMessage = data.detail
  } catch { /* ignore parse error */ }

  if (response.status === 401) clearStoredSession()
  throw new Error(errorMessage)
}
