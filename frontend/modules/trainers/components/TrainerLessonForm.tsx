"use client"

import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import type { TrainerLmsLesson, TrainerLmsLessonCreate, TrainerLmsLessonUpdate } from "../types"

interface FormState {
  title: string
  summary: string
  content: string
  sort_order: string
  video_url: string
  pdf_url: string
  assignment_url: string
}

function getLessonContent(lesson: TrainerLmsLesson | null | undefined): string | null {
  if (!lesson || !("content" in lesson)) return null
  const content = (lesson as TrainerLmsLesson & { content?: string | null }).content
  return typeof content === "string" && content.trim() ? content : null
}

function emptyFormState(): FormState {
  return {
    title: "",
    summary: "",
    content: "",
    sort_order: "1",
    video_url: "",
    pdf_url: "",
    assignment_url: "",
  }
}

function toFormState(lesson: TrainerLmsLesson | null | undefined): FormState {
  if (!lesson) return emptyFormState()

  return {
    title: lesson.title,
    summary: lesson.summary ?? "",
    content: getLessonContent(lesson) ?? "",
    sort_order: String(lesson.sort_order ?? 1),
    video_url: lesson.video_url ?? "",
    pdf_url: lesson.pdf_url ?? "",
    assignment_url: lesson.assignment_url ?? "",
  }
}

function buildCreatePayload(form: FormState): TrainerLmsLessonCreate {
  const sortOrder = parseInt(form.sort_order, 10)
  const payload: TrainerLmsLessonCreate = {
    title: form.title.trim(),
    summary: form.summary.trim() || null,
    content: form.content.trim() || null,
    sort_order: !isNaN(sortOrder) ? sortOrder : 1,
  }

  const videoUrl = form.video_url.trim()
  const pdfUrl = form.pdf_url.trim()
  const assignmentUrl = form.assignment_url.trim()

  if (videoUrl) payload.video_url = videoUrl
  if (pdfUrl) payload.pdf_url = pdfUrl
  if (assignmentUrl) payload.assignment_url = assignmentUrl

  return payload
}

function buildUpdatePayload(form: FormState, original: TrainerLmsLesson): TrainerLmsLessonUpdate {
  const patch: TrainerLmsLessonUpdate = {}

  const title = form.title.trim()
  if (title !== original.title) patch.title = title

  const summary = form.summary.trim() || null
  if (summary !== original.summary) patch.summary = summary

  const content = form.content.trim() || null
  if (content !== getLessonContent(original)) patch.content = content

  const sortOrder = parseInt(form.sort_order, 10)
  if (!isNaN(sortOrder) && sortOrder !== original.sort_order) patch.sort_order = sortOrder

  return patch
}

interface LabeledFieldProps {
  label: string
  htmlFor: string
  required?: boolean
  children: React.ReactNode
}

function LabeledField({ label, htmlFor, required, children }: LabeledFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-xs font-black text-[#475569]">
        {label}
        {required && <span className="ml-0.5 text-[#EF4444]">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  "w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#0B7A5A]/15 disabled:opacity-50"

export function TrainerLessonForm({
  lesson = null,
  onCreate,
  onSave,
  onClose,
}: {
  lesson?: TrainerLmsLesson | null
  onCreate?: (payload: TrainerLmsLessonCreate) => Promise<void>
  onSave?: (lessonId: string, payload: TrainerLmsLessonUpdate) => Promise<void>
  onClose: () => void
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(lesson))
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const isEditMode = Boolean(lesson)

  // Reset form when the lesson prop changes (e.g. user picks a different lesson to edit)
  useEffect(() => {
    setForm(toFormState(lesson))
    setFormError(null)
  }, [lesson?.id])

  // Focus title on open
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) {
      setFormError("Title is required.")
      titleRef.current?.focus()
      return
    }

    const sortOrder = parseInt(form.sort_order, 10)
    if (isNaN(sortOrder) || sortOrder < 1) {
      setFormError("Sort order must be 1 or higher.")
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      if (lesson) {
        if (!onSave) throw new Error("Lesson update is not available.")
        const payload = buildUpdatePayload(form, lesson)
        if (Object.keys(payload).length === 0) {
          onClose()
          return
        }
        await onSave(lesson.id, payload)
      } else {
        if (!onCreate) throw new Error("Lesson creation is not available.")
        await onCreate(buildCreatePayload(form))
      }
      onClose()
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to save lesson.")
    } finally {
      setSaving(false)
    }
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Panel */}
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#E3ECE8] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#E3ECE8] bg-white px-6 py-4">
          <div>
            <h2 className="text-base font-black text-[#0F172A]">
              {isEditMode ? "Edit Lesson" : "Create Lesson"}
            </h2>
            <p className="mt-0.5 max-w-xs truncate text-xs font-semibold text-[#64748B]">
              {isEditMode ? lesson?.title : "Add lesson details first. Materials can be uploaded after saving."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E3ECE8] text-[#64748B] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5 px-6 py-5">
            {/* Title */}
            <LabeledField label="Title" htmlFor="lesson-title" required>
              <input
                ref={titleRef}
                id="lesson-title"
                type="text"
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Lesson title"
                disabled={saving}
                maxLength={255}
              />
            </LabeledField>

            {/* Summary */}
            <LabeledField label="Summary" htmlFor="lesson-summary">
              <textarea
                id="lesson-summary"
                className={`${inputClass} min-h-[80px] resize-y`}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
                placeholder="Short description of this lesson"
                disabled={saving}
                rows={3}
              />
            </LabeledField>

            {/* Content */}
            <LabeledField label="Content" htmlFor="lesson-content">
              <textarea
                id="lesson-content"
                className={`${inputClass} min-h-[120px] resize-y`}
                value={form.content}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Lesson notes, instructions, or overview"
                disabled={saving}
                rows={5}
              />
            </LabeledField>

            {/* Sort order */}
            <LabeledField label="Sort Order" htmlFor="lesson-sort-order">
              <input
                id="lesson-sort-order"
                type="number"
                min={1}
                className={inputClass}
                value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
                disabled={saving}
              />
            </LabeledField>

            {/* Error */}
            {formError && (
              <p className="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2.5 text-sm font-semibold text-[#B91C1C]">
                {formError}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-[#E3ECE8] bg-white px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#475569] transition hover:border-[#94A3B8] hover:bg-[#F8FAFC] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0B7A5A] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#096747] disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : isEditMode ? (
                "Save Changes"
              ) : (
                "Create Lesson"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
