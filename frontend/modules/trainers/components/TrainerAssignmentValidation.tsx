"use client"

import { AlertCircle } from "lucide-react"

import type { TrainerAssignmentFormValues } from "../types"

export type TrainerAssignmentFormErrors = Partial<
  Record<keyof TrainerAssignmentFormValues, string>
>

export function validateTrainerAssignmentForm(
  values: TrainerAssignmentFormValues
): TrainerAssignmentFormErrors {
  const errors: TrainerAssignmentFormErrors = {}
  if (!values.title.trim()) errors.title = "Assignment title is required."
  if (!values.course_id) errors.course_id = "Course is required."
  if (!values.batch_name.trim()) errors.batch_name = "Batch is required."
  if (!values.due_at) errors.due_at = "Due date is required."
  const marks = Number(values.max_marks)
  if (!Number.isFinite(marks) || marks <= 0) {
    errors.max_marks = "Max marks must be greater than 0."
  }
  return errors
}

export function TrainerAssignmentFieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-bold text-[#B91C1C]">{message}</p>
}

export function TrainerAssignmentErrorBanner({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
