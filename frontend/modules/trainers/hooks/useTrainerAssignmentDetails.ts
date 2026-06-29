"use client"

import { useCallback, useEffect, useState } from "react"

import {
  getTrainerAssignmentDetails,
  getTrainerAssignmentSubmissions,
} from "../services/trainerAssignmentService"
import type { TrainerAssignment, TrainerAssignmentSubmission } from "../types"

export interface UseTrainerAssignmentDetailsResult {
  assignment: TrainerAssignment | null
  submissions: TrainerAssignmentSubmission[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useTrainerAssignmentDetails(
  assignmentId: string
): UseTrainerAssignmentDetailsResult {
  const [assignment, setAssignment] = useState<TrainerAssignment | null>(null)
  const [submissions, setSubmissions] = useState<TrainerAssignmentSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!assignmentId) {
      setAssignment(null)
      setSubmissions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const [assignmentPayload, submissionPayload] = await Promise.all([
        getTrainerAssignmentDetails(assignmentId),
        getTrainerAssignmentSubmissions(assignmentId),
      ])
      setAssignment(assignmentPayload)
      setSubmissions(submissionPayload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load assignment details.")
    } finally {
      setLoading(false)
    }
  }, [assignmentId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { assignment, submissions, loading, error, refresh }
}
