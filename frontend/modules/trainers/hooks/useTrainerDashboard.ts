/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerDashboard.ts
 * Purpose     : React hook for fetching and caching trainer dashboard data.
 *               Uses trainerService which handles v1-first with 404 fallback.
 */

import { useCallback, useRef, useState } from "react"
import { getTrainerDashboard } from "../services/trainerService"
import type { TrainerDashboard } from "../services/trainerService"

function useLazyEffect(effect: () => void) {
  const ran = useRef<boolean | null>(null)
  if (ran.current == null) {
    ran.current = true
    effect()
  }
}

export function useTrainerDashboard() {
  const [data, setData] = useState<TrainerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerDashboard()
      setData(payload)
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to load trainer dashboard data."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger initial fetch once on mount without useEffect
  useLazyEffect(() => {
    void fetchDashboard()
  })

  return {
    data,
    loading,
    error,
    refresh: fetchDashboard,
  }
}
