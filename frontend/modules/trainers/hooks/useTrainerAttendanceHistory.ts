/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerAttendanceHistory.ts
 * Purpose     : Fetches paginated trainer attendance history.
 *               Wraps fetchTrainerAttendanceHistory from trainerAttendanceService.
 */

"use client"

import { useCallback, useEffect, useState } from "react"

import {
  fetchTrainerAttendanceHistory,
  type TrainerAttendanceHistoryApiResponse,
  type TrainerAttendanceHistoryParams,
} from "../services/trainerAttendanceService"

// ─── State shape ──────────────────────────────────────────────────────────────

interface UseTrainerAttendanceHistoryState {
  data: TrainerAttendanceHistoryApiResponse | null
  loading: boolean
  error: string | null
}

interface UseTrainerAttendanceHistoryReturn
  extends UseTrainerAttendanceHistoryState {
  refresh: () => void
  setParams: (params: TrainerAttendanceHistoryParams) => void
  setPage: (page: number) => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTrainerAttendanceHistory(
  initialParams?: TrainerAttendanceHistoryParams
): UseTrainerAttendanceHistoryReturn {
  const [params, setParamsState] = useState<TrainerAttendanceHistoryParams>(
    initialParams ?? {}
  )
  const [data, setData] = useState<TrainerAttendanceHistoryApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchTrainerAttendanceHistory(params)
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Failed to load attendance history."
          )
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
   * Replace all filter params. Resets to page 1 unless the caller
   * explicitly includes a page value in the new params.
   */
  const setParams = useCallback((next: TrainerAttendanceHistoryParams) => {
    setParamsState((prev) => ({
      page_size: prev.page_size,
      ...next,
      page: next.page ?? 1,
    }))
  }, [])

  /**
   * Navigate to a specific page without touching other filters.
   */
  const setPage = useCallback((page: number) => {
    setParamsState((prev) => ({ ...prev, page }))
  }, [])

  return {
    data,
    loading,
    error,
    refresh,
    setParams,
    setPage,
  }
}