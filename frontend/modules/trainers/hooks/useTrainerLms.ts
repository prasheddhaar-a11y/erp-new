"use client"

import { useCallback, useEffect, useState } from "react"

import { getTrainerCourses } from "../services/trainerLmsService"
import type { TrainerLmsCourse, TrainerLmsApiResponse } from "../types"

export interface UseTrainerLmsResult {
  /** Trainer-owned course list. */
  courses: TrainerLmsCourse[]
  /** True during the initial fetch. */
  loading: boolean
  /** Page-level fetch error. */
  error: string | null
  /** Full API response envelope — used by the page for summary KPIs and flags. */
  data: TrainerLmsApiResponse | null
  /** Refetch courses from the API. */
  refresh: () => Promise<void>
}

/**
 * Drives TrainerLmsPage (/trainer/lms).
 *
 * Fetches the trainer's course list and summary KPIs.
 * Lesson management, material uploads, and course selection all live
 * on the course detail page (/trainer/lms/[courseId]) and are handled
 * by useTrainerLmsCourse.
 */
export function useTrainerLms(): UseTrainerLmsResult {
  const [courses, setCourses] = useState<TrainerLmsCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<TrainerLmsApiResponse | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await getTrainerCourses()
      setData(response)
      setCourses(response.courses)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load LMS.")
      setCourses([])
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    courses,
    loading,
    error,
    data,
    refresh,
  }
}