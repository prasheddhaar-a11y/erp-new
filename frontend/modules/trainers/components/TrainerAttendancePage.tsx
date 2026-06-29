/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendancePage.tsx
 * Purpose     : Main /trainer/attendance landing page.
 *               Shows KPI summary, session filters, session table, and
 *               a New Session modal. Uses useTrainerAttendanceSessions.
 */

"use client"

import { useCallback, useMemo, useState } from "react"
import { RefreshCw, Plus, X, CalendarDays, Users, Clock } from "lucide-react"

import { useTrainerBatches } from "../hooks/useTrainerBatches"
import { useTrainerLms } from "../hooks/useTrainerLms"
import { useTrainerAttendanceSessions } from "../hooks/useTrainerAttendanceSessions"
import { TrainerAttendanceSessionsTable } from "./TrainerAttendanceSessionsTable"
import type { TrainerAttendanceSessionCreateBody } from "../services/trainerAttendanceService"
import type { TrainerBatch, TrainerLmsCourse } from "../types"

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  accent?: "green" | "amber" | "neutral"
}

function KpiCard({ label, value, icon, accent = "neutral" }: KpiCardProps) {
  const accentMap = {
    green: {
      icon: "bg-[#E8F6F0] text-[#0B7A5A]",
      value: "text-[#0B7A5A]",
    },
    amber: {
      icon: "bg-[#FFF7ED] text-[#C2410C]",
      value: "text-[#C2410C]",
    },
    neutral: {
      icon: "bg-[#F1F5F9] text-[#475569]",
      value: "text-[#020617]",
    },
  }
  const colours = accentMap[accent]

  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-5 py-5 flex items-center gap-4">
      <span className={`flex-shrink-0 rounded-lg p-2.5 ${colours.icon}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          {label}
        </p>
        <p className={`mt-0.5 text-2xl font-black tabular-nums ${colours.value}`}>
          {value}
        </p>
      </div>
    </div>
  )
}

// ─── New Session Modal ────────────────────────────────────────────────────────

interface NewSessionModalProps {
  open: boolean
  creating: boolean
  createError: string | null
  batches: TrainerBatch[]
  batchesLoading: boolean
  batchesError: string | null
  courses: TrainerLmsCourse[]
  coursesLoading: boolean
  coursesError: string | null
  onClose: () => void
  onSubmit: (body: TrainerAttendanceSessionCreateBody) => Promise<boolean>
}

function NewSessionModal({
  open,
  creating,
  createError,
  batches,
  batchesLoading,
  batchesError,
  courses,
  coursesLoading,
  coursesError,
  onClose,
  onSubmit,
}: NewSessionModalProps) {
  const today = new Date().toISOString().split("T")[0]

  const [title, setTitle] = useState("")
  const [sessionDate, setSessionDate] = useState(today)
  const [batchId, setBatchId] = useState("")
  const [courseId, setCourseId] = useState("")
  const [fieldError, setFieldError] = useState<string | null>(null)

  const selectedBatch = useMemo(
    () => batches.find((batch) => batch.id === batchId) ?? null,
    [batchId, batches],
  )
  const linkedCourseId = selectedBatch?.course_id?.trim() ?? ""
  const courseSelectionLocked = Boolean(linkedCourseId)
  const selectedBatchCourseTitle = selectedBatch?.course?.trim() ?? ""
  const linkedCourseInList = linkedCourseId
    ? courses.some((course) => course.id === linkedCourseId)
    : true

  const handleClose = useCallback(() => {
    setTitle("")
    setSessionDate(today)
    setBatchId("")
    setCourseId("")
    setFieldError(null)
    onClose()
  }, [onClose, today])

  const handleBatchChange = useCallback((nextBatchId: string) => {
    const batch = batches.find((item) => item.id === nextBatchId) ?? null
    const nextCourseId = batch?.course_id?.trim() ?? ""
    setBatchId(nextBatchId)
    setCourseId(nextCourseId)
    setFieldError(null)
  }, [batches])

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) {
      setFieldError("Session title is required.")
      return
    }
    if (!sessionDate) {
      setFieldError("Session date is required.")
      return
    }
    if (!batchId.trim()) {
      setFieldError("Batch is required.")
      return
    }
    setFieldError(null)

    const ok = await onSubmit({
      title: title.trim(),
      session_date: sessionDate,
      batch_id: batchId.trim(),
      course_id: courseId.trim() || null,
    })

    if (ok) handleClose()
  }, [title, sessionDate, batchId, courseId, onSubmit, handleClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E2EEE9] bg-white shadow-[0_24px_48px_rgba(15,23,42,0.12)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2EEE9] px-6 py-4">
          <h2 className="text-base font-black text-[#020617] tracking-tight">
            New Attendance Session
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#475569] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Session Title <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Week 3 – Python Fundamentals"
              className="w-full rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] placeholder-[#94A3B8] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Session Date <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
            />
          </div>

          {/* Batch */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Batch <span className="text-[#DC2626]">*</span>
            </label>
            <select
              value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              disabled={batchesLoading || creating}
              className="w-full rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] placeholder-[#94A3B8] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
            >
              <option value="">
                {batchesLoading ? "Loading batches..." : "Select batch"}
              </option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course (optional) */}
          <div>
            <label className="block text-xs font-semibold text-[#475569] mb-1.5">
              Course{" "}
              <span className="text-[#94A3B8] font-normal">(optional)</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={coursesLoading || creating || courseSelectionLocked}
              className="w-full rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] placeholder-[#94A3B8] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition disabled:bg-[#F8FAFC] disabled:text-[#64748B]"
            >
              <option value="">
                {coursesLoading ? "Loading courses..." : "Select course"}
              </option>
              {courseSelectionLocked && !linkedCourseInList && (
                <option value={linkedCourseId}>
                  {selectedBatchCourseTitle || "Linked course"}
                </option>
              )}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>

          {/* Errors */}
          {(fieldError ?? createError ?? batchesError ?? coursesError) && (
            <p className="rounded-lg bg-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#B91C1C]">
              {fieldError ?? createError ?? batchesError ?? coursesError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#E2EEE9] px-6 py-4">
          <button
            onClick={handleClose}
            disabled={creating}
            className="rounded-lg border border-[#C8DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B7A5A] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#096649] transition-colors disabled:opacity-60"
          >
            {creating ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create Session"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  batchId: string
  dateFrom: string
  dateTo: string
  onBatchChange: (v: string) => void
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  onApply: () => void
  onClear: () => void
}

function FilterBar({
  batchId,
  dateFrom,
  dateTo,
  onBatchChange,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
}: FilterBarProps) {
  const hasFilters = batchId || dateFrom || dateTo

  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-5 py-4">
      <div className="flex flex-wrap items-end gap-3">
        {/* Batch ID */}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-semibold text-[#475569]">Batch ID</label>
          <input
            type="text"
            value={batchId}
            onChange={(e) => onBatchChange(e.target.value)}
            placeholder="Filter by batch"
            className="rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] placeholder-[#94A3B8] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
          />
        </div>

        {/* Date From */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-semibold text-[#475569]">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
          />
        </div>

        {/* Date To */}
        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-xs font-semibold text-[#475569]">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pb-0.5">
          <button
            onClick={onApply}
            className="rounded-lg bg-[#0B7A5A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#096649] transition-colors"
          >
            Apply
          </button>
          {hasFilters && (
            <button
              onClick={onClear}
              className="rounded-lg border border-[#C8DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TrainerAttendancePage() {
  const { data, loading, error, creating, createError, refresh, setParams, createSession } =
    useTrainerAttendanceSessions()
  const {
    batches,
    loading: batchesLoading,
    error: batchesError,
  } = useTrainerBatches()
  const {
    courses,
    loading: coursesLoading,
    error: coursesError,
  } = useTrainerLms()

  // Filter state (uncommitted until Apply)
  const [batchIdInput, setBatchIdInput] = useState("")
  const [dateFromInput, setDateFromInput] = useState("")
  const [dateToInput, setDateToInput] = useState("")

  // Modal
  const [modalOpen, setModalOpen] = useState(false)

  // ── Derived values ──────────────────────────────────────────────────────────

  const summary = data?.summary
  const sessions = data?.sessions ?? []

  const updatedAt = data?.updated_at
    ? new Date(data.updated_at).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleApplyFilters = useCallback(() => {
    setParams({
      batch_id: batchIdInput.trim() || undefined,
      date_from: dateFromInput || undefined,
      date_to: dateToInput || undefined,
    })
  }, [batchIdInput, dateFromInput, dateToInput, setParams])

  const handleClearFilters = useCallback(() => {
    setBatchIdInput("")
    setDateFromInput("")
    setDateToInput("")
    setParams({})
  }, [setParams])

  const handleCreateSession = useCallback(
    async (body: TrainerAttendanceSessionCreateBody) => {
      return createSession(body)
    },
    [createSession]
  )

  // ── KPI display helpers ─────────────────────────────────────────────────────

  const totalSessionsValue = loading ? "—" : (summary?.total_sessions ?? 0)

  const todayRateValue =
    loading
      ? "—"
      : summary?.today_attendance_rate !== null &&
        summary?.today_attendance_rate !== undefined
      ? `${Math.round(summary.today_attendance_rate)}%`
      : "—"

  const pendingValue = loading ? "—" : (summary?.pending_sessions ?? 0)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-normal text-[#020617]">
            Attendance
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-[#475569]">
            Track and manage attendance for your assigned batches.
          </p>
          {updatedAt && (
            <p className="mt-1 text-xs text-[#94A3B8]">
              Last updated at {updatedAt}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3.5 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
            aria-label="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B7A5A] px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#096649] transition-colors"
          >
            <Plus size={14} />
            New Session
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Sessions"
          value={totalSessionsValue}
          icon={<CalendarDays size={18} />}
          accent="neutral"
        />
        <KpiCard
          label="Today's Attendance"
          value={todayRateValue}
          icon={<Users size={18} />}
          accent="green"
        />
        <KpiCard
          label="Pending Sessions"
          value={pendingValue}
          icon={<Clock size={18} />}
          accent={
            typeof pendingValue === "number" && pendingValue > 0
              ? "amber"
              : "neutral"
          }
        />
      </div>

      {/* ── Filters ── */}
      <FilterBar
        batchId={batchIdInput}
        dateFrom={dateFromInput}
        dateTo={dateToInput}
        onBatchChange={setBatchIdInput}
        onDateFromChange={setDateFromInput}
        onDateToChange={setDateToInput}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* ── Sessions Table ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#020617]">
            Sessions
            {!loading && sessions.length > 0 && (
              <span className="ml-2 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-xs font-semibold text-[#0B7A5A]">
                {sessions.length}
              </span>
            )}
          </h2>
        </div>

        <TrainerAttendanceSessionsTable
          sessions={sessions}
          loading={loading}
          error={error}
          readOnly={false}
          onRetry={refresh}
        />
      </div>

      {/* ── New Session Modal ── */}
      <NewSessionModal
        open={modalOpen}
        creating={creating}
        createError={createError}
        batches={batches ?? []}
        batchesLoading={batchesLoading}
        batchesError={batchesError}
        courses={courses}
        coursesLoading={coursesLoading}
        coursesError={coursesError}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateSession}
      />
    </div>
  )
}
