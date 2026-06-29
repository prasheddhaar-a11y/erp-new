/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerBatchDetails.ts
 * Purpose     : React hook for fetching trainer batch detail data.
 *               Calls GET /api/v1/trainer/batches/{batchId}
 */

import { useCallback, useRef, useState } from "react"
import { getTrainerBatchDetails } from "../services/trainerBatchService"
import type { TrainerBatchDetailsResponse } from "../types"

function useLazyEffect(effect: () => void) {
  const ran = useRef<boolean | null>(null)
  if (ran.current == null) {
    ran.current = true
    effect()
  }
}

export function useTrainerBatchDetails(batchId: string) {
  const [data, setData] = useState<TrainerBatchDetailsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDetails = useCallback(async () => {
    if (!batchId) {
      setError("Batch ID is missing.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerBatchDetails(batchId)
      setData(payload)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load batch details."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [batchId])

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