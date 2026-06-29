/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : trainerBatchService.ts
 * Purpose     : Phase 3C – Trainer Batch API service layer.
 *               Fetches GET /api/v1/trainer/batches.
 *               API now returns the full envelope:
 *                 { summary, batches, updated_at }
 *               404 is handled gracefully (empty response returned).
 */

import {
  API_URL,
  getStoredSessionValue,
  refreshStoredAccessToken,
  clearStoredSession,
} from "@/lib/api"
import type {
  TrainerBatch,
  TrainerBatchesApiResponse,
  TrainerBatchSummaryKPI,
  TrainerBatchDetailsResponse,
} from "../types"

// ─── Empty-state sentinel ─────────────────────────────────────────────────────

const EMPTY_SUMMARY: TrainerBatchSummaryKPI = {
  assigned_batches: 0,
  active_batches: 0,
  total_students: 0,
  average_attendance: null,
}

const EMPTY_RESPONSE: TrainerBatchesApiResponse = {
  summary: EMPTY_SUMMARY,
  batches: [],
  updated_at: new Date().toISOString(),
}

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

function encodePathSegment(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

// ─── Batches Service ──────────────────────────────────────────────────────────

/**
 * Fetch trainer-scoped batches (Phase 3C envelope response).
 *
 * Returns TrainerBatchesApiResponse:
 *   { summary: TrainerBatchSummaryKPI, batches: TrainerBatch[], updated_at: string }
 *
 * Returns EMPTY_RESPONSE gracefully on 404.
 * Propagates 401/403/5xx as thrown errors.
 */
export async function getTrainerBatches(): Promise<TrainerBatchesApiResponse> {
  const response = await fetchWithAuth("/api/v1/trainer/batches")

  if (response.ok) {
    const data = await response.json()

    // Validate envelope shape; fall back to empty if backend shape is unexpected
    if (
      data &&
      typeof data === "object" &&
      "batches" in data &&
      "summary" in data
    ) {
      return data as TrainerBatchesApiResponse
    }

    // Legacy flat-list fallback (should not happen after Phase 3C)
    if (Array.isArray(data)) {
      const batches = data as TrainerBatch[]
      const students = batches.reduce((s, b) => s + (b.students ?? 0), 0)
      const rates = batches
        .map((b) => b.attendance_rate)
        .filter((r): r is number => r !== null)
      return {
        summary: {
          assigned_batches: batches.length,
          active_batches: batches.filter(
            (b) => b.status.toLowerCase() === "active"
          ).length,
          total_students: students,
          average_attendance:
            rates.length > 0
              ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
              : null,
        },
        batches,
        updated_at: new Date().toISOString(),
      }
    }

    return EMPTY_RESPONSE
  }

  // Gracefully handle 404 (endpoint not yet deployed / migrating)
  if (response.status === 404) {
    return EMPTY_RESPONSE
  }

  // Surface structured error message for other failures
  let errorMessage = `${response.status} ${response.statusText}`
  try {
    const errData = await response.json()
    if (typeof errData.detail === "string") errorMessage = errData.detail
  } catch {
    /* ignore parse error */
  }

  if (response.status === 401) clearStoredSession()
  throw new Error(errorMessage)
}

/**
 * Fetch trainer-scoped batch details by ID.
 * Calls GET /api/v1/trainer/batches/{batchId}
 * Propagates auth and validation errors properly.
 */
export async function getTrainerBatchDetails(batchId: string): Promise<TrainerBatchDetailsResponse> {
  const response = await fetchWithAuth(`/api/v1/trainer/batches/${encodePathSegment(batchId)}`)

  if (response.ok) {
    const data = await response.json()
    return data as TrainerBatchDetailsResponse
  }

  // Surface structured error message for failures
  let errorMessage = `${response.status} ${response.statusText}`
  try {
    const errData = await response.json()
    if (typeof errData.detail === "string") errorMessage = errData.detail
  } catch {
    /* ignore parse error */
  }

  if (response.status === 401) clearStoredSession()
  throw new Error(errorMessage)
}
