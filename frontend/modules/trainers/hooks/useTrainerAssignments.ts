"use client"

import { useCallback, useEffect, useState } from "react"

import { getTrainerAssignments } from "../services/trainerAssignmentService"
import type { TrainerAssignmentsApiResponse } from "../types"

export interface UseTrainerAssignmentsResult {
  data: TrainerAssignmentsApiResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTrainerAssignments(): UseTrainerAssignmentsResult {
  const [data, setData] = useState<TrainerAssignmentsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerAssignments()
      setData(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load trainer assignments.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
