/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : useTrainerBatches.ts
 * Purpose     : React hook for fetching and caching trainer batches data.
 *               Phase 3C – returns the full envelope (summary + batches).
 */

import { useCallback, useRef, useState } from "react"
import { getTrainerBatches } from "../services/trainerBatchService"
import type { TrainerBatch, TrainerBatchesApiResponse, TrainerBatchSummaryKPI } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useLazyEffect(effect: () => void) {
  const ran = useRef<boolean | null>(null)
  if (ran.current == null) {
    ran.current = true
    effect()
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UseTrainerBatchesResult {
  /** Full batch list from API */
  batches: TrainerBatch[] | null
  /** Aggregate summary KPIs from API */
  summary: TrainerBatchSummaryKPI | null
  /** ISO timestamp of last successful fetch */
  updatedAt: string | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTrainerBatches(): UseTrainerBatchesResult {
  const [data, setData] = useState<TrainerBatchesApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = await getTrainerBatches()
      setData(payload)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load training batches."
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Trigger once on first render without useEffect
  useLazyEffect(() => {
    void fetchBatches()
  })

  return {
    batches: data?.batches ?? null,
    summary: data?.summary ?? null,
    updatedAt: data?.updated_at ?? null,
    loading,
    error,
    refresh: fetchBatches,
  }
}
