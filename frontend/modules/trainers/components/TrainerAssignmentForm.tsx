"use client"

import { GitBranch, Loader2, Save } from "lucide-react"
import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"

import { getTrainerBatches } from "../services/trainerBatchService"
import { getTrainerCourses } from "../services/trainerLmsService"
import type {
  TrainerAssignment,
  TrainerAssignmentFormValues,
  TrainerBatch,
  TrainerLmsCourse,
} from "../types"
import {
  TrainerAssignmentErrorBanner,
  TrainerAssignmentFieldError,
  validateTrainerAssignmentForm,
  type TrainerAssignmentFormErrors,
} from "./TrainerAssignmentValidation"

const EMPTY_VALUES: TrainerAssignmentFormValues = {
  title: "",
  description: "",
  course_id: "",
  batch_name: "",
  due_at: "",
  max_marks: "",
  assignment_url: "",
  instructions: "",
}

function toLocalDateTime(value: string | null | undefined) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function valuesFromAssignment(assignment?: TrainerAssignment | null): TrainerAssignmentFormValues {
  if (!assignment) return { ...EMPTY_VALUES }
  return {
    title: assignment.title,
    description: assignment.description ?? "",
    course_id: assignment.course_id ?? "",
    batch_name: assignment.batch ?? "",
    due_at: toLocalDateTime(assignment.due_date),
    max_marks:
      assignment.max_marks === null || assignment.max_marks === undefined
        ? ""
        : String(assignment.max_marks),
    assignment_url: assignment.assignment_url ?? "",
    instructions: assignment.content ?? "",
  }
}

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <span className="text-xs font-black uppercase tracking-wider text-[#475569]">
      {children}
      {required ? <span className="text-[#B91C1C]"> *</span> : null}
    </span>
  )
}

export function TrainerAssignmentForm({
  assignment,
  mode,
  submitLabel,
  onSubmit,
}: {
  assignment?: TrainerAssignment | null
  mode: "create" | "edit"
  submitLabel: string
  onSubmit: (values: TrainerAssignmentFormValues) => Promise<void>
}) {
  const [values, setValues] = useState<TrainerAssignmentFormValues>(() =>
    valuesFromAssignment(assignment)
  )
  const [courses, setCourses] = useState<TrainerLmsCourse[]>([])
  const [batches, setBatches] = useState<TrainerBatch[]>([])
  const [errors, setErrors] = useState<TrainerAssignmentFormErrors>({})
  const [loadError, setLoadError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setValues(valuesFromAssignment(assignment))
  }, [assignment])

  useEffect(() => {
    let cancelled = false
    async function loadOptions() {
      setLoadingOptions(true)
      setLoadError(null)
      try {
        const [coursePayload, batchPayload] = await Promise.all([
          getTrainerCourses(),
          getTrainerBatches(),
        ])
        if (!cancelled) {
          setCourses(coursePayload.courses)
          setBatches(batchPayload.batches)
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : "Failed to load course and batch options.")
        }
      } finally {
        if (!cancelled) setLoadingOptions(false)
      }
    }
    void loadOptions()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredBatches = useMemo(() => {
    if (!values.course_id) return batches
    return batches.filter((batch) => batch.course_id === values.course_id)
  }, [batches, values.course_id])

  function setField(field: keyof TrainerAssignmentFormValues, value: string) {
    setValues((current) => {
      const next = { ...current, [field]: value }
      if (field === "course_id") next.batch_name = ""
      return next
    })
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateTrainerAssignmentForm(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save assignment.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div>
        <h3 className="text-base font-black text-[#0F172A]">
          {mode === "create" ? "Create Assignment" : "Edit Assignment"}
        </h3>
        <p className="mt-1 text-sm font-semibold text-[#64748B]">
          Assignments stay scoped to your assigned course and batch.
        </p>
      </div>

      <TrainerAssignmentErrorBanner message={loadError ?? submitError} />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <FieldLabel required>Assignment Title</FieldLabel>
          <input value={values.title} onChange={(event) => setField("title", event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
          <TrainerAssignmentFieldError message={errors.title} />
        </label>

        <label className="block">
          <FieldLabel required>Max Marks</FieldLabel>
          <input type="number" min="1" value={values.max_marks} onChange={(event) => setField("max_marks", event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
          <TrainerAssignmentFieldError message={errors.max_marks} />
        </label>

        <label className="block">
          <FieldLabel required>Course</FieldLabel>
          <select value={values.course_id} onChange={(event) => setField("course_id", event.target.value)} disabled={loadingOptions || mode === "edit"} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF] disabled:bg-[#F8FAF8] disabled:text-[#64748B]">
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>
          <TrainerAssignmentFieldError message={errors.course_id} />
        </label>

        <label className="block">
          <FieldLabel required>Batch</FieldLabel>
          <select value={values.batch_name} onChange={(event) => setField("batch_name", event.target.value)} disabled={loadingOptions || !values.course_id} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF] disabled:bg-[#F8FAF8] disabled:text-[#64748B]">
            <option value="">Select batch</option>
            {filteredBatches.map((batch) => (
              <option key={`${batch.course_id}:${batch.name}`} value={batch.name}>{batch.name}</option>
            ))}
          </select>
          <TrainerAssignmentFieldError message={errors.batch_name} />
        </label>

        <label className="block">
          <FieldLabel required>Due Date</FieldLabel>
          <input type="datetime-local" value={values.due_at} onChange={(event) => setField("due_at", event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
          <TrainerAssignmentFieldError message={errors.due_at} />
        </label>

        <label className="block">
          <FieldLabel>Attachment URL</FieldLabel>
          <input type="url" value={values.assignment_url} onChange={(event) => setField("assignment_url", event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] px-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
        </label>
      </div>

      <label className="block">
        <FieldLabel required>Description</FieldLabel>
        <textarea value={values.description} onChange={(event) => setField("description", event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-[#D0DFDA] px-3 py-2 text-sm font-semibold leading-6 text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
      </label>

      <label className="block">
        <FieldLabel>Instructions</FieldLabel>
        <textarea value={values.instructions} onChange={(event) => setField("instructions", event.target.value)} rows={4} className="mt-1.5 w-full rounded-lg border border-[#D0DFDA] px-3 py-2 text-sm font-semibold leading-6 text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" />
      </label>

      <section className="rounded-lg border border-dashed border-[#D0DFDA] bg-[#F8FAF8] p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#64748B]">
            <GitBranch size={16} />
          </span>
          <div>
            <h4 className="text-sm font-black text-[#0F172A]">GitHub Repository Integration</h4>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              GitHub repository linking will be available after project workflow implementation.
            </p>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" disabled={submitting || loadingOptions} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#096747] disabled:cursor-not-allowed disabled:opacity-70">
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          <span>{submitLabel}</span>
        </button>
      </div>
    </form>
  )
}
