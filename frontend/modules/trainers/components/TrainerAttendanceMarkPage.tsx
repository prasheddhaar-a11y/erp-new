/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendanceMarkPage.tsx
 * Purpose     : Main /trainer/attendance/mark page component.
 */

"use client"

import { useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Users,
} from "lucide-react"

import { useTrainerAttendanceMark } from "../hooks/useTrainerAttendanceMark"
import {
  TrainerAttendanceMarkTable,
  TrainerAttendanceMarkTableSkeleton,
} from "./TrainerAttendanceMarkTable"

function formatSessionDate(raw: string | null | undefined): string {
  if (!raw) return "—"
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  } catch {
    return raw
  }
}

interface SessionHeaderProps {
  title: string
  sessionDate: string | null | undefined
  batchName: string | null | undefined
  courseName: string | null | undefined
  totalStudents: number
  status: string
}

function SessionHeader({
  title,
  sessionDate,
  batchName,
  courseName,
  totalStudents,
  status,
}: SessionHeaderProps) {
  const isSubmitted = status === "submitted"

  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black leading-snug tracking-tight text-[#020617]">
              {title}
            </h2>

            <span
              className={[
                "inline-flex flex-shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                isSubmitted
                  ? "bg-[#E8F6F0] text-[#0B7A5A]"
                  : "bg-[#FFF7ED] text-[#C2410C]",
              ].join(" ")}
            >
              {isSubmitted ? "Submitted" : "Pending"}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-[#475569]">
            {sessionDate && (
              <span className="flex items-center gap-1.5">
                <CalendarDays size={12} className="text-[#94A3B8]" />
                {formatSessionDate(sessionDate)}
              </span>
            )}

            {batchName && (
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#C8DDD7]" />
                {batchName}
              </span>
            )}

            {courseName && (
              <span className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#C8DDD7]" />
                {courseName}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-[#E2EEE9] bg-[#F8FDFB] px-3 py-2">
          <Users size={14} className="text-[#0B7A5A]" />
          <span className="text-sm font-bold tabular-nums text-[#020617]">
            {totalStudents}
          </span>
          <span className="text-xs font-medium text-[#94A3B8]">
            student{totalStudents !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  )
}

interface SuccessStateProps {
  presentCount: number
  lateCount: number
  absentCount: number
  totalCount: number
  savedCount: number | null
  message: string
}

function SuccessState({
  presentCount,
  lateCount,
  absentCount,
  totalCount,
  savedCount,
  message,
}: SuccessStateProps) {
  const rate =
    totalCount > 0
      ? Math.round(((presentCount + lateCount) / totalCount) * 100)
      : 0

  return (
    <div className="rounded-xl border border-[#C8DDD7] bg-[#F0FBF6] px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#0B7A5A]">
        <CheckCircle2 size={28} className="text-white" />
      </span>

      <h3 className="mt-4 text-lg font-black text-[#020617]">
        Attendance Saved
      </h3>

      <p className="mt-1 text-sm font-medium text-[#475569]">
        {message}
        {savedCount !== null ? ` Saved count: ${savedCount}.` : ""}
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-6">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums text-[#0B7A5A]">
            {presentCount}
          </span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Present
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums text-[#C2410C]">
            {lateCount}
          </span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Late
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums text-[#B91C1C]">
            {absentCount}
          </span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Absent
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums text-[#020617]">
            {rate}%
          </span>
          <span className="mt-0.5 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Rate
          </span>
        </div>
      </div>

      <div className="mt-8">
        <Link
          href="/trainer/attendance"
          className="inline-flex items-center gap-2 rounded-lg bg-[#0B7A5A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#096649] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
        >
          <ArrowLeft size={14} />
          Back to Sessions
        </Link>
      </div>
    </div>
  )
}

function MissingSessionId() {
  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white px-6 py-14 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <p className="text-sm font-semibold text-[#B91C1C]">
        No session ID provided.
      </p>
      <p className="mt-1 text-xs text-[#94A3B8]">
        Please select a session from the attendance list.
      </p>

      <div className="mt-6">
        <Link
          href="/trainer/attendance"
          className="inline-flex items-center gap-2 rounded-lg border border-[#C8DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#0B7A5A] transition-colors hover:bg-[#E8F6F0]"
        >
          <ArrowLeft size={14} />
          Back to Attendance
        </Link>
      </div>
    </div>
  )
}

export function TrainerAttendanceMarkPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id") ?? ""

  const {
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
  } = useTrainerAttendanceMark(sessionId)

  const handleSave = useCallback(async () => {
    await submit()
  }, [submit])

  if (!sessionId) {
    return (
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <BackLink />
        <MissingSessionId />
      </div>
    )
  }

  const entries = Object.values(marks)
  const presentCount = entries.filter((e) => e.status === "present").length
  const lateCount = entries.filter((e) => e.status === "late").length
  const absentCount = entries.filter((e) => e.status === "absent").length
  const totalCount = entries.length

  return (
    <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div>
        <BackLink />
        <div className="mt-4">
          <h1 className="text-2xl font-black tracking-normal text-[#020617]">
            Mark Attendance
          </h1>
          <p className="mt-0.5 text-sm font-semibold text-[#475569]">
            Record present, late, or absent status for each student.
          </p>
        </div>
      </div>

      {loading && <SessionHeaderSkeleton />}

      {!loading && loadError && (
        <div className="rounded-xl border border-[#E2EEE9] bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <p className="mb-3 text-sm font-semibold text-[#B91C1C]">
            {loadError}
          </p>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#0B7A5A] transition-colors hover:bg-[#E8F6F0]"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {!loading && !loadError && session && (
        <SessionHeader
          title={session.title}
          sessionDate={session.session_date}
          batchName={session.batch_name}
          courseName={session.course_name}
          totalStudents={session.total_students ?? totalCount}
          status={submitted ? "submitted" : session.status}
        />
      )}

      {submitted && (
        <SuccessState
          presentCount={presentCount}
          lateCount={lateCount}
          absentCount={absentCount}
          totalCount={totalCount}
          savedCount={savedCount}
          message={successMessage ?? "Attendance saved successfully."}
        />
      )}

      {!submitted && (
        <>
          {loading ? (
            <TrainerAttendanceMarkTableSkeleton rows={6} />
          ) : (
            <TrainerAttendanceMarkTable
              marks={marks}
              submitting={submitting}
              onSetStatus={setStatus}
              onSetRemarks={setRemarks}
              onMarkAllPresent={markAllPresent}
            />
          )}

          {submitError && (
            <div className="rounded-lg bg-[#FEE2E2] px-4 py-3 text-sm font-semibold text-[#B91C1C]">
              {submitError}
            </div>
          )}

          {!loading && !loadError && (
            <div className="flex items-center justify-end gap-3 pt-1">
              <Link
                href="/trainer/attendance"
                className="rounded-lg border border-[#C8DDD7] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F1F5F9]"
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={submitting || totalCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0B7A5A] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#096649] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Save Attendance
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/trainer/attendance"
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#475569] transition-colors hover:text-[#0B7A5A]"
    >
      <ArrowLeft size={14} />
      Back to Attendance
    </Link>
  )
}

function SessionHeaderSkeleton() {
  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-64 animate-pulse rounded bg-[#E2EEE9]" />
          <div className="flex gap-3">
            <div className="h-3.5 w-36 animate-pulse rounded bg-[#E2EEE9]" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-[#E2EEE9]" />
          </div>
        </div>

        <div className="h-9 w-28 flex-shrink-0 animate-pulse rounded-lg bg-[#E2EEE9]" />
      </div>
    </div>
  )
}