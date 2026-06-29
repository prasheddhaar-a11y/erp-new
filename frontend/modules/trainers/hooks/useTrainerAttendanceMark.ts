// frontend/modules/trainers/hooks/useTrainerAttendanceMark.ts

"use client"

import { useCallback, useEffect, useState } from "react"

import { markTrainerAttendance } from "../services/trainerAttendanceService"
import type {
  TrainerAttendanceMarkRecord,
  TrainerAttendanceSessionDetail,
  TrainerAttendanceStudentRecord,
} from "../types"
import { useTrainerAttendanceSession } from "./useTrainerAttendanceSession"

export interface StudentMarkEntry {
  student_id: string
  full_name: string
  display_code: string | null
  status: "present" | "absent" | "late" | "unmarked"
  remarks: string
}

export interface UseTrainerAttendanceMarkReturn {
  session: TrainerAttendanceSessionDetail | null
  marks: Record<string, StudentMarkEntry>
  loading: boolean
  loadError: string | null
  submitting: boolean
  submitError: string | null
  submitted: boolean
  successMessage: string | null
  savedCount: number | null
  setStatus: (
    studentId: string,
    status: "present" | "absent" | "late"
  ) => void
  setRemarks: (studentId: string, remarks: string) => void
  markAllPresent: () => void
  submit: () => Promise<void>
  refresh: () => void
}

export function useTrainerAttendanceMark(
  sessionId: string | null | undefined
): UseTrainerAttendanceMarkReturn {
  const {
    session,
    loading,
    error: loadError,
    refresh,
  } = useTrainerAttendanceSession(sessionId)

  const [marks, setMarks] = useState<Record<string, StudentMarkEntry>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState<number | null>(null)

  useEffect(() => {
    if (!session?.students) return

    setMarks(
      Object.fromEntries(
        session.students.map((s: TrainerAttendanceStudentRecord) => [
          s.student_id,
          {
            student_id: s.student_id,
            full_name: s.full_name,
            display_code: s.display_code,
            status:
              s.status === "present" ||
              s.status === "absent" ||
              s.status === "late"
                ? s.status
                : "unmarked",
            remarks: s.remarks ?? "",
          } satisfies StudentMarkEntry,
        ])
      )
    )
  }, [session])

  const clearSuccess = useCallback(() => {
    setSubmitted(false)
    setSuccessMessage(null)
    setSavedCount(null)
  }, [])

  const setStatus = useCallback(
    (studentId: string, status: "present" | "absent" | "late") => {
      clearSuccess()

      setMarks((prev) => {
        if (!prev[studentId]) return prev

        return {
          ...prev,
          [studentId]: {
            ...prev[studentId],
            status,
          },
        }
      })
    },
    [clearSuccess]
  )

  const setRemarks = useCallback(
    (studentId: string, remarks: string) => {
      clearSuccess()

      setMarks((prev) => {
        if (!prev[studentId]) return prev

        return {
          ...prev,
          [studentId]: {
            ...prev[studentId],
            remarks,
          },
        }
      })
    },
    [clearSuccess]
  )

  const markAllPresent = useCallback(() => {
    clearSuccess()

    setMarks((prev) =>
      Object.fromEntries(
        Object.entries(prev).map(([id, entry]) => [
          id,
          {
            ...entry,
            status: "present" as const,
          },
        ])
      )
    )
  }, [clearSuccess])

  const submit = useCallback(async () => {
    if (!sessionId) return
    if (submitting) return

    const entries = Object.values(marks)

    const hasUnmarked = entries.some((e) => e.status === "unmarked")
    if (hasUnmarked) {
      setSubmitError(
        "All students must be marked before saving. Please mark any remaining students."
      )
      return
    }

    const records: TrainerAttendanceMarkRecord[] = entries.map((e) => ({
      student_id: e.student_id,
      status: e.status as "present" | "absent" | "late",
      remarks: e.remarks.trim() || null,
    }))

    setSubmitting(true)
    setSubmitError(null)
    setSubmitted(false)
    setSuccessMessage(null)
    setSavedCount(null)

    try {
      const result = await markTrainerAttendance(sessionId, records)

      const saved =
        result && typeof result === "object" && "saved" in result
          ? Number((result as unknown as { saved: number }).saved)
          : records.length

      setSavedCount(Number.isFinite(saved) ? saved : records.length)
      setSubmitted(true)
      setSuccessMessage("Attendance saved successfully.")

      refresh()
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to save attendance."
      )
    } finally {
      setSubmitting(false)
    }
  }, [sessionId, marks, refresh, submitting])

  return {
    session,
    marks,
    loading,
    loadError,
    submitting,
    submitError,
    submitted,
    successMessage,
    savedCount,
    setStatus,
    setRemarks,
    markAllPresent,
    submit,
    refresh,
  }
}