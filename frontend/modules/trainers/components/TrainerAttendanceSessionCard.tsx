/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendanceSessionCard.tsx
 * Purpose     : Displays a single attendance session as a table row or card.
 *               Shows title, date, batch/course, present/absent/late counts,
 *               attendance rate badge, status badge, and a conditional Mark button.
 *               Used by TrainerAttendanceSessionsTable (landing + history pages).
 */

"use client"

import Link from "next/link"
import type { TrainerAttendanceSession } from "../types"

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrainerAttendanceSessionCardProps {
  session: TrainerAttendanceSession
  /** When true the Mark button is hidden (history view) */
  readOnly?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSessionDate(raw: string | null | undefined): string {
  if (!raw) return "—"
  try {
    return new Date(raw).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  } catch {
    return raw
  }
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "—"
  return `${Math.round(rate)}%`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const isSubmitted = status === "submitted"
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isSubmitted
          ? "bg-[#E8F6F0] text-[#0B7A5A]"
          : "bg-[#FFF7ED] text-[#C2410C]",
      ].join(" ")}
    >
      {isSubmitted ? "Submitted" : "Pending"}
    </span>
  )
}

function RateBadge({ rate }: { rate: number | null | undefined }) {
  if (rate === null || rate === undefined) {
    return (
      <span className="text-sm font-medium text-[#94A3B8]">—</span>
    )
  }
  const colour =
    rate >= 75
      ? "text-[#0B7A5A]"
      : rate >= 50
      ? "text-[#B45309]"
      : "text-[#DC2626]"
  return (
    <span className={`text-sm font-bold tabular-nums ${colour}`}>
      {Math.round(rate)}%
    </span>
  )
}

function CountCell({
  value,
  label,
  colour,
}: {
  value: number
  label: string
  colour: string
}) {
  return (
    <span className="flex flex-col items-center leading-tight">
      <span className={`text-sm font-bold tabular-nums ${colour}`}>{value}</span>
      <span className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wide">
        {label}
      </span>
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrainerAttendanceSessionCard({
  session,
  readOnly = false,
}: TrainerAttendanceSessionCardProps) {
  const {
    id,
    title,
    session_date,
    batch_name,
    course_name,
    status,
    total_students,
    present_count,
    absent_count,
    late_count,
    attendance_rate,
  } = session

  const canMark = !readOnly && status !== "submitted"
  const markHref = `/trainer/attendance/mark?session_id=${encodeURIComponent(id)}`

  return (
    <tr className="group border-b border-[#E2EEE9] transition-colors hover:bg-[#F8FDFB]">
      {/* Date */}
      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm text-[#475569]">
        {formatSessionDate(session_date)}
      </td>

      {/* Title + batch / course */}
      <td className="py-3.5 pl-0 pr-4 sm:pr-6">
        <p className="text-sm font-semibold text-[#020617] leading-snug">
          {title || "—"}
        </p>
        <p className="mt-0.5 text-xs text-[#94A3B8] leading-snug">
          {[batch_name, course_name].filter(Boolean).join(" · ") || "—"}
        </p>
      </td>

      {/* Present / Late / Absent */}
      <td className="hidden py-3.5 px-4 sm:table-cell">
        <div className="flex items-center gap-4">
          <CountCell
            value={present_count}
            label="Present"
            colour="text-[#0B7A5A]"
          />
          <CountCell
            value={late_count}
            label="Late"
            colour="text-[#B45309]"
          />
          <CountCell
            value={absent_count}
            label="Absent"
            colour="text-[#DC2626]"
          />
        </div>
      </td>

      {/* Total students */}
      <td className="hidden py-3.5 px-4 text-center sm:table-cell">
        <span className="text-sm font-medium text-[#475569] tabular-nums">
          {total_students}
        </span>
      </td>

      {/* Attendance rate */}
      <td className="py-3.5 px-4 text-center">
        <RateBadge rate={attendance_rate} />
      </td>

      {/* Status */}
      <td className="py-3.5 px-4">
        <StatusBadge status={status} />
      </td>

      {/* Action */}
      <td className="py-3.5 pl-4 pr-4 text-right sm:pr-6">
        {canMark ? (
          <Link
            href={markHref}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B7A5A] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#096649] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
          >
            Mark
          </Link>
        ) : !readOnly ? (
          <Link
            href={markHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B7A5A] transition-colors hover:bg-[#E8F6F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]"
          >
            Review
          </Link>
        ) : null}
      </td>
    </tr>
  )
}