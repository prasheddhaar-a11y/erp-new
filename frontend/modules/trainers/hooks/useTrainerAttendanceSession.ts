/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerAttendanceSession.ts
 * Purpose     : Fetches a single attendance session and its student list.
 *               Wraps fetchTrainerAttendanceSession and
 *               fetchTrainerAttendanceSessionStudents from trainerAttendanceService.
 */

"use client"

import { useCallback, useEffect, useState } from "react"

import {
  fetchTrainerAttendanceSession,
  fetchTrainerAttendanceSessionStudents,
} from "../services/trainerAttendanceService"
import type { TrainerAttendanceSessionDetail } from "../types"

// ─── State shape ──────────────────────────────────────────────────────────────

interface UseTrainerAttendanceSessionState {
  session: TrainerAttendanceSessionDetail | null
  loading: boolean
  error: string | null
}

interface UseTrainerAttendanceSessionReturn
  extends UseTrainerAttendanceSessionState {
  refresh: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetch a single attendance session by ID.
 *
 * Attempts GET …/sessions/{sessionId}/students first (returns full session +
 * student records in one call). Falls back to GET …/sessions/{sessionId} if
 * the /students endpoint returns an error, so the session header still renders
 * even when the student sub-route is not yet wired on the backend.
 */
export function useTrainerAttendanceSession(
  sessionId: string | null | undefined
): UseTrainerAttendanceSessionReturn {
  const [session, setSession] = useState<TrainerAttendanceSessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    if (!sessionId) return

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Prefer the /students sub-route — it returns session + student records
        let result: TrainerAttendanceSessionDetail
        try {
          result = await fetchTrainerAttendanceSessionStudents(sessionId as string)
        } catch {
          // Fall back to base session endpoint if /students is not available
          result = await fetchTrainerAttendanceSession(sessionId as string)
        }
        if (!cancelled) setSession(result)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load session.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [sessionId, refreshTick])

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
  }, [])

  return { session, loading, error, refresh }
}