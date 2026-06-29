/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerAttendanceSessions.ts
 * Purpose     : Fetches and manages trainer attendance session list.
 *               Wraps fetchTrainerAttendanceSessions and createTrainerAttendanceSession
 *               from trainerAttendanceService.
 */

"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createTrainerAttendanceSession,
  fetchTrainerAttendanceSessions,
  type TrainerAttendanceSessionCreateBody,
  type TrainerAttendanceSessionsApiResponse,
  type TrainerAttendanceSessionsParams,
} from "../services/trainerAttendanceService"

// ─── State shape ──────────────────────────────────────────────────────────────

interface UseTrainerAttendanceSessionsState {
  data: TrainerAttendanceSessionsApiResponse | null
  loading: boolean
  error: string | null
  creating: boolean
  createError: string | null
}

interface UseTrainerAttendanceSessionsReturn
  extends UseTrainerAttendanceSessionsState {
  refresh: () => void
  setParams: (params: TrainerAttendanceSessionsParams) => void
  createSession: (body: TrainerAttendanceSessionCreateBody) => Promise<boolean>
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainerAttendanceSessions(
  initialParams?: TrainerAttendanceSessionsParams
): UseTrainerAttendanceSessionsReturn {
  const [params, setParams] = useState<TrainerAttendanceSessionsParams>(
    initialParams ?? {}
  )
  const [data, setData] = useState<TrainerAttendanceSessionsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchTrainerAttendanceSessions(params)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load sessions.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [params, refreshTick])

  const refresh = useCallback(() => {
    setRefreshTick((t) => t + 1)
  }, [])

  /**
   * Create a new attendance session.
   * Returns true on success (caller can navigate or refresh).
   * Returns false on failure (createError is set).
   */
  const createSession = useCallback(
    async (body: TrainerAttendanceSessionCreateBody): Promise<boolean> => {
      setCreating(true)
      setCreateError(null)
      try {
        await createTrainerAttendanceSession(body)
        setRefreshTick((t) => t + 1)
        return true
      } catch (err) {
        setCreateError(
          err instanceof Error ? err.message : "Failed to create session."
        )
        return false
      } finally {
        setCreating(false)
      }
    },
    []
  )

  return {
    data,
    loading,
    error,
    creating,
    createError,
    refresh,
    setParams,
    createSession,
  }
}