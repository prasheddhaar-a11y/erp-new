/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendanceSessionsTable.tsx
 * Purpose     : Renders the attendance session list with loading, error,
 *               and empty states. Each row has a "Mark" action that links
 *               to /trainer/attendance/mark?session_id={id}.
 *               Used by TrainerAttendancePage and TrainerAttendanceHistoryPage.
 */

"use client"

import Link from "next/link"

import type { TrainerAttendanceSession } from "../types"

type TrainerAttendanceTableSession = Pick<
  TrainerAttendanceSession,
  | "id"
  | "title"
  | "session_date"
  | "batch_name"
  | "course_name"
  | "status"
  | "present_count"
  | "absent_count"
  | "late_count"
  | "attendance_rate"
> & {
  total_students?: number
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrainerAttendanceSessionsTableProps {
  sessions: TrainerAttendanceTableSession[]
  loading: boolean
  error: string | null
  /** Hide the Mark action — used by the history page */
  readOnly?: boolean
  onRetry?: () => void
  /** Primary text shown when the sessions list is empty */
  emptyMessage?: string
  /** Secondary text shown when the sessions list is empty */
  emptySubMessage?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

function AttendanceRateBadge({ rate }: { rate: number | null }) {
  if (rate === null) {
    return (
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold bg-[#F1F5F9] text-[#94A3B8]">
        —
      </span>
    )
  }

  const pct = Math.round(rate)
  let colorClass = "bg-[#DCFCE7] text-[#15803D]"
  if (pct < 75) colorClass = "bg-[#FEF9C3] text-[#854D0E]"
  if (pct < 50) colorClass = "bg-[#FEE2E2] text-[#B91C1C]"

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${colorClass}`}
    >
      {pct}%
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isSubmitted = status === "submitted"
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
        isSubmitted
          ? "bg-[#E8F6F0] text-[#0B7A5A]"
          : "bg-[#FEF9C3] text-[#854D0E]"
      }`}
    >
      {isSubmitted ? "Submitted" : "Pending"}
    </span>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E2EEE9]">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-[#E2EEE9] animate-pulse" style={{ width: i === 1 ? "80%" : "60%" }} />
        </td>
      ))}
    </tr>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrainerAttendanceSessionsTable({
  sessions,
  loading,
  error,
  readOnly = false,
  onRetry,
  emptyMessage = "No attendance sessions yet.",
  emptySubMessage = "Create a session to start marking attendance.",
}: TrainerAttendanceSessionsTableProps) {
  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[#B91C1C] mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-4 py-2 text-sm font-semibold text-[#0B7A5A] hover:bg-[#E8F6F0] transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {/* ── Head ── */}
          <thead>
            <tr className="border-b border-[#E2EEE9] bg-[#F8FAF9]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569]">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569]">
                Batch / Course
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Present
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Absent
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Late
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Status
              </th>
              {!readOnly && (
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[#475569]">
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* ── Body ── */}
          <tbody>
            {/* Loading */}
            {loading &&
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

            {/* Empty */}
            {!loading && sessions.length === 0 && (
              <tr>
                <td
                  colSpan={readOnly ? 8 : 9}
                  className="px-6 py-14 text-center"
                >
                  <p className="text-sm font-semibold text-[#475569]">
                    {emptyMessage}
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {emptySubMessage}
                  </p>
                </td>
              </tr>
            )}

            {/* Rows */}
            {!loading &&
              sessions.map((session) => (
                <tr
                  key={session.id}
                  className="border-b border-[#E2EEE9] last:border-0 hover:bg-[#F8FAF9] transition-colors"
                >
                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-[#020617] font-medium">
                    {session.session_date
                      ? formatDate(session.session_date)
                      : "—"}
                  </td>

                  {/* Title */}
                  <td className="px-4 py-3 text-[#020617] font-medium max-w-[200px]">
                    <span className="line-clamp-1">{session.title}</span>
                  </td>

                  {/* Batch / Course */}
                  <td className="px-4 py-3 text-[#475569] max-w-[180px]">
                    <div className="line-clamp-1">
                      {session.batch_name ?? "—"}
                    </div>
                    {session.course_name && (
                      <div className="text-xs text-[#94A3B8] line-clamp-1">
                        {session.course_name}
                      </div>
                    )}
                  </td>

                  {/* Present */}
                  <td className="px-4 py-3 text-center font-semibold text-[#15803D]">
                    {session.present_count}
                  </td>

                  {/* Absent */}
                  <td className="px-4 py-3 text-center font-semibold text-[#B91C1C]">
                    {session.absent_count}
                  </td>

                  {/* Late */}
                  <td className="px-4 py-3 text-center font-semibold text-[#854D0E]">
                    {session.late_count}
                  </td>

                  {/* Rate */}
                  <td className="px-4 py-3 text-center">
                    <AttendanceRateBadge rate={session.attendance_rate} />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={session.status} />
                  </td>

                  {/* Action */}
                  {!readOnly && (
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/trainer/attendance/mark?session_id=${session.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#0B7A5A] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#095e45] transition-colors whitespace-nowrap"
                      >
                        Mark
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
