/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendanceHistoryPage.tsx
 * Purpose     : Main /trainer/attendance/history page component.
 *               Shows summary KPI cards, filters, a read-only session table,
 *               and pagination controls. Uses useTrainerAttendanceHistory.
 */

"use client"

import { useCallback, useState, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
  Users,
} from "lucide-react"

import { useTrainerAttendanceHistory } from "../hooks/useTrainerAttendanceHistory"
import { TrainerAttendanceSessionsTable } from "./TrainerAttendanceSessionsTable"

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string
  value: string | number
  icon: ReactNode
  accent?: "green" | "neutral"
}

function KpiCard({ label, value, icon, accent = "neutral" }: KpiCardProps) {
  const accentMap = {
    green: {
      icon: "bg-[#E8F6F0] text-[#0B7A5A]",
      value: "text-[#0B7A5A]",
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

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  batchId: string
  courseId: string
  dateFrom: string
  dateTo: string
  onBatchChange: (v: string) => void
  onCourseChange: (v: string) => void
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
  onApply: () => void
  onClear: () => void
}

function FilterBar({
  batchId,
  courseId,
  dateFrom,
  dateTo,
  onBatchChange,
  onCourseChange,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
}: FilterBarProps) {
  const hasFilters =
    batchId.trim() !== "" ||
    courseId.trim() !== "" ||
    dateFrom !== "" ||
    dateTo !== ""

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-5 py-4">
      {/* Batch */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs font-semibold text-[#475569]">Batch</label>
        <input
          type="text"
          value={batchId}
          onChange={(e) => onBatchChange(e.target.value)}
          placeholder="Filter by batch"
          className="rounded-lg border border-[#C8DDD7] bg-white px-3 py-2 text-sm text-[#020617] placeholder-[#94A3B8] focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 transition"
        />
      </div>

      {/* Course */}
      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs font-semibold text-[#475569]">Course</label>
        <input
          type="text"
          value={courseId}
          onChange={(e) => onCourseChange(e.target.value)}
          placeholder="Filter by course"
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
          className="rounded-lg bg-[#0B7A5A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#096649] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
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
  )
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

interface PaginationProps {
  page: number
  totalPages: number
  totalItems: number
  pageSize: number
  loading: boolean
  onPrev: () => void
  onNext: () => void
}

function PaginationControls({
  page,
  totalPages,
  totalItems,
  pageSize,
  loading,
  onPrev,
  onNext,
}: PaginationProps) {
  if (totalPages <= 1 && totalItems === 0) return null

  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-5 py-3">
      {/* Info */}
      <p className="text-xs font-medium text-[#475569]">
        {totalItems === 0 ? (
          "No results"
        ) : (
          <>
            Showing{" "}
            <span className="font-bold text-[#020617]">
              {start}–{end}
            </span>{" "}
            of{" "}
            <span className="font-bold text-[#020617]">{totalItems}</span>{" "}
            session{totalItems !== 1 ? "s" : ""}
          </>
        )}
      </p>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1 || loading}
          aria-label="Previous page"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
        >
          <ChevronLeft size={13} />
          Prev
        </button>

        <span className="rounded-lg border border-[#E2EEE9] bg-[#F8FDFB] px-3 py-1.5 text-xs font-bold tabular-nums text-[#020617]">
          {page} / {Math.max(totalPages, 1)}
        </span>

        <button
          onClick={onNext}
          disabled={page >= totalPages || loading}
          aria-label="Next page"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
        >
          Next
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  )
}

// ─── KPI Skeleton ─────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-5 py-5 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-[#E2EEE9] animate-pulse flex-shrink-0" />
      <div className="space-y-2 min-w-0">
        <div className="h-3 w-24 rounded bg-[#E2EEE9] animate-pulse" />
        <div className="h-6 w-16 rounded bg-[#E2EEE9] animate-pulse" />
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TrainerAttendanceHistoryPage() {
  const {
    data,
    loading,
    error,
    setPage,
    setParams,
    refresh,
  } = useTrainerAttendanceHistory()

  // Filter local state (uncommitted until Apply)
  const [batchIdInput, setBatchIdInput] = useState("")
  const [courseIdInput, setCourseIdInput] = useState("")
  const [dateFromInput, setDateFromInput] = useState("")
  const [dateToInput, setDateToInput] = useState("")

  // ── Derived ────────────────────────────────────────────────────────────────

  const sessions = data?.sessions ?? []
  const totalItems = data?.total ?? 0
  const pageSize = data?.page_size ?? 20
  // `page` lives on the response envelope, not the hook return value
  const page = data?.page ?? 1
  // total_pages is not returned by the API — derive it
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / pageSize) : 1

  // KPI values sourced from API fields that actually exist on the response type
  const totalSessionsValue = loading ? "—" : totalItems

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleApply = useCallback(() => {
    setPage(1)
    setParams({
      batch_id: batchIdInput.trim() || undefined,
      course_id: courseIdInput.trim() || undefined,
      date_from: dateFromInput || undefined,
      date_to: dateToInput || undefined,
    })
  }, [batchIdInput, courseIdInput, dateFromInput, dateToInput, setPage, setParams])

  const handleClear = useCallback(() => {
    setBatchIdInput("")
    setCourseIdInput("")
    setDateFromInput("")
    setDateToInput("")
    setPage(1)
    setParams({})
  }, [setPage, setParams])

  const handlePrev = useCallback(() => {
    setPage(Math.max(1, page - 1))
  }, [setPage, page])

  const handleNext = useCallback(() => {
    setPage(Math.min(totalPages, page + 1))
  }, [setPage, page, totalPages])

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">

      {/* ── Back link ── */}
      <Link
        href="/trainer/attendance"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#475569] hover:text-[#0B7A5A] transition-colors"
      >
        <ArrowLeft size={14} />
        Back to Attendance
      </Link>

      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-normal text-[#020617]">
            Attendance History
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-[#475569]">
            Review past attendance sessions across all your batches.
          </p>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3.5 py-2 text-sm font-semibold text-[#475569] hover:bg-[#F1F5F9] transition-colors disabled:opacity-50"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <KpiSkeleton />
            <KpiSkeleton />
            <KpiSkeleton />
          </>
        ) : (
          <>
            <KpiCard
              label="Total Sessions"
              value={totalSessionsValue}
              icon={<CalendarDays size={18} />}
              accent="neutral"
            />
            <KpiCard
              label="Total Records"
              value={
                sessions.reduce(
                  (sum, s) => sum + (s.total_students ?? 0),
                  0
                )
              }
              icon={<ClipboardList size={18} />}
              accent="neutral"
            />
            <KpiCard
              label="Overall Attendance Rate"
              value={(() => {
                const totalStudents = sessions.reduce(
                  (sum, s) => sum + (s.total_students ?? 0),
                  0
                )
                const totalPresent = sessions.reduce(
                  (sum, s) =>
                    sum + (s.present_count ?? 0) + (s.late_count ?? 0),
                  0
                )
                if (totalStudents === 0) return "—"
                return `${Math.round((totalPresent / totalStudents) * 100)}%`
              })()}
              icon={<Users size={18} />}
              accent="green"
            />
          </>
        )}
      </div>

      {/* ── Filters ── */}
      <FilterBar
        batchId={batchIdInput}
        courseId={courseIdInput}
        dateFrom={dateFromInput}
        dateTo={dateToInput}
        onBatchChange={setBatchIdInput}
        onCourseChange={setCourseIdInput}
        onDateFromChange={setDateFromInput}
        onDateToChange={setDateToInput}
        onApply={handleApply}
        onClear={handleClear}
      />

      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-[#020617]">
          Sessions
          {!loading && totalItems > 0 && (
            <span className="ml-2 rounded-full bg-[#E8F6F0] px-2 py-0.5 text-xs font-semibold text-[#0B7A5A]">
              {totalItems}
            </span>
          )}
        </h2>
      </div>

      {/* ── Sessions Table (read-only) ── */}
      <TrainerAttendanceSessionsTable
        sessions={sessions}
        loading={loading}
        error={error}
        readOnly
        onRetry={refresh}
        emptyMessage="No attendance history found."
        emptySubMessage="Completed sessions will appear here once attendance has been marked."
      />

      {/* ── Pagination ── */}
      {!error && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          loading={loading}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  )
}