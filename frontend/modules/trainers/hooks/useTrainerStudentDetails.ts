/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerStudentDetails.ts
 * Purpose     : React hook for fetching trainer student detail data.
 *               Calls GET /api/v1/trainer/students/{studentId}
 */

import { useCallback, useRef, useState } from "react"
import { getTrainerStudentDetails } from "../services/trainerStudentService"
import type { TrainerStudentDetailsResponse } from "../types"

function useLazyEffect(effect: () => void) {
  const ran = useRef<boolean | null>(null)
  if (ran.current == null) {
    ran.current = true
    effect()
  }
}

export function useTrainerStudentDetails(studentId: string) {
  const [data, setData] = useState<TrainerStudentDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!studentId) {
      setError("Student ID is missing.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerStudentDetails(studentId)
      setData(payload)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load student profile."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useLazyEffect(() => {
    void fetchDetails()
  })

  return {
    data,
    loading,
    error,
    refresh: fetchDetails,
  }
}