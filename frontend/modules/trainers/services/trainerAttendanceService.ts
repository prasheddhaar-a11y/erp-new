/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : trainerAttendanceService.ts
 * Purpose     : Trainer Attendance API service layer.
 */

import {
  API_URL,
  clearStoredSession,
  getStoredSessionValue,
  refreshStoredAccessToken,
} from "@/lib/api"

import type {
  TrainerAttendanceHistoryItem,
  TrainerAttendanceMarkRecord,
  TrainerAttendanceSession,
  TrainerAttendanceSessionDetail,
  TrainerAttendanceSummary,
} from "../types"

export interface TrainerAttendanceSessionsApiResponse {
  summary: TrainerAttendanceSummary
  sessions: TrainerAttendanceSession[]
  total: number
  page: number
  limit: number
  updated_at: string
}

export interface TrainerAttendanceHistoryApiResponse {
  sessions: TrainerAttendanceHistoryItem[]
  total: number
  page: number
  page_size: number
  updated_at: string
}

export interface TrainerAttendanceMarkResponse {
  saved: number
}

export interface TrainerAttendanceSessionsParams {
  batch_id?: string
  date_from?: string
  date_to?: string
}

export interface TrainerAttendanceHistoryParams {
  batch_id?: string
  course_id?: string
  date_from?: string
  date_to?: string
  page?: number
  page_size?: number
}

export interface TrainerAttendanceSessionCreateBody {
  title: string
  session_date: string
  batch_id?: string | null
  course_id?: string | null
}

const EMPTY_SUMMARY: TrainerAttendanceSummary = {
  total_sessions: 0,
  today_attendance_rate: null,
  pending_sessions: 0,
}

const EMPTY_SESSIONS_RESPONSE: TrainerAttendanceSessionsApiResponse = {
  summary: EMPTY_SUMMARY,
  sessions: [],
  total: 0,
  page: 1,
  limit: 20,
  updated_at: new Date().toISOString(),
}

const EMPTY_HISTORY_RESPONSE: TrainerAttendanceHistoryApiResponse = {
  sessions: [],
  total: 0,
  page: 1,
  page_size: 20,
  updated_at: new Date().toISOString(),
}

async function fetchWithAuth(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  const token = getStoredSessionValue("pinesphere_access_token")

  if (!token) {
    clearStoredSession()
    throw new Error("Please log in again.")
  }

  const makeRequest = (bearerToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
        Authorization: `Bearer ${bearerToken}`,
      },
    })

  let response = await makeRequest(token)

  if (response.status === 401) {
    const refreshed = await refreshStoredAccessToken()
    if (refreshed) {
      response = await makeRequest(refreshed)
    }
  }

  return response
}

function buildQueryString(
  params: Record<string, string | number | undefined | null>
): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  )

  if (entries.length === 0) return ""

  return (
    "?" +
    entries
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join("&")
  )
}

function encodePathSegment(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

async function extractErrorMessage(response: Response): Promise<string> {
  let message = `${response.status} ${response.statusText}`

  try {
    const errData = await response.json()
    if (typeof errData.detail === "string") {
      message = errData.detail
    }
  } catch {
    // keep fallback message
  }

  return message
}

export async function fetchTrainerAttendanceSessions(
  params?: TrainerAttendanceSessionsParams
): Promise<TrainerAttendanceSessionsApiResponse> {
  const qs = buildQueryString({
    batch_id: params?.batch_id,
    date_from: params?.date_from,
    date_to: params?.date_to,
  })

  const response = await fetchWithAuth(
    `/api/v1/trainer/attendance/sessions${qs}`
  )

  if (response.ok) {
    const data = await response.json()

    if (data && typeof data === "object" && "sessions" in data) {
      const sessions = Array.isArray(data.sessions)
        ? (data.sessions as TrainerAttendanceSession[])
        : []

      return {
        summary: (data.summary as TrainerAttendanceSummary) ?? EMPTY_SUMMARY,
        sessions,
        total: Number(data.total ?? sessions.length),
        page: Number(data.page ?? 1),
        limit: Number(data.limit ?? data.page_size ?? sessions.length),
        updated_at:
          typeof data.updated_at === "string"
            ? data.updated_at
            : new Date().toISOString(),
      }
    }

    return EMPTY_SESSIONS_RESPONSE
  }

  if (response.status === 404) return EMPTY_SESSIONS_RESPONSE

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}

export async function createTrainerAttendanceSession(
  body: TrainerAttendanceSessionCreateBody
): Promise<TrainerAttendanceSession> {
  const response = await fetchWithAuth("/api/v1/trainer/attendance/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  })

  if (response.ok) {
    const data = await response.json()
    return data as TrainerAttendanceSession
  }

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}

export async function fetchTrainerAttendanceSession(
  sessionId: string
): Promise<TrainerAttendanceSessionDetail> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/attendance/sessions/${encodePathSegment(sessionId)}`
  )

  if (response.ok) {
    const data = await response.json()
    return data as TrainerAttendanceSessionDetail
  }

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}

export async function fetchTrainerAttendanceSessionStudents(
  sessionId: string
): Promise<TrainerAttendanceSessionDetail> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/attendance/sessions/${encodePathSegment(
      sessionId
    )}/students`
  )

  if (response.ok) {
    const data = await response.json()
    return data as TrainerAttendanceSessionDetail
  }

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}

export async function markTrainerAttendance(
  sessionId: string,
  records: TrainerAttendanceMarkRecord[]
): Promise<TrainerAttendanceMarkResponse> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/attendance/sessions/${encodePathSegment(sessionId)}/mark`,
    {
      method: "POST",
      body: JSON.stringify({ records }),
    }
  )

  if (response.ok) {
    const data = await response.json()

    return {
      saved: Number(data?.saved ?? records.length),
    }
  }

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}

export async function fetchTrainerAttendanceHistory(
  params?: TrainerAttendanceHistoryParams
): Promise<TrainerAttendanceHistoryApiResponse> {
  const qs = buildQueryString({
    batch_id: params?.batch_id,
    course_id: params?.course_id,
    date_from: params?.date_from,
    date_to: params?.date_to,
    page: params?.page,
    page_size: params?.page_size,
  })

  const response = await fetchWithAuth(
    `/api/v1/trainer/attendance/history${qs}`
  )

  if (response.ok) {
    const data = await response.json()

    if (data && typeof data === "object" && "sessions" in data) {
      return data as TrainerAttendanceHistoryApiResponse
    }

    return EMPTY_HISTORY_RESPONSE
  }

  if (response.status === 404) return EMPTY_HISTORY_RESPONSE

  const message = await extractErrorMessage(response)
  if (response.status === 401) clearStoredSession()

  throw new Error(message)
}