"use client"

import { useCallback, useRef, useState } from "react"

import { getTrainerStudents } from "../services/trainerStudentService"
import type { TrainerStudentsApiResponse } from "../types"

export interface UseTrainerStudentsResult {
  data: TrainerStudentsApiResponse | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

function useLazyEffect(effect: () => void) {
  const ran = useRef<boolean | null>(null)
  if (ran.current == null) {
    ran.current = true
    effect()
  }
}

export function useTrainerStudents(): UseTrainerStudentsResult {
  const [data, setData] = useState<TrainerStudentsApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerStudents()
      setData(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assigned students.")
    } finally {
      setLoading(false)
    }
  }, [])

  useLazyEffect(() => {
    void fetchStudents()
  })

  return {
    data,
    loading,
    error,
    refresh: fetchStudents,
  }
}
