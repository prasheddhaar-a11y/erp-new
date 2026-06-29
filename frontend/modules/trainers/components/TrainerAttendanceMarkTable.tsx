/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerAttendanceMarkTable.tsx
 * Purpose     : Student attendance marking table.
 *               Renders each student with Present / Late / Absent toggle buttons
 *               and an inline remarks input. Exposes markAllPresent action.
 *               Used exclusively by TrainerAttendanceMarkPage.
 */

"use client"

import { CheckCircle2, Clock3, XCircle, UserRound } from "lucide-react"
import type { StudentMarkEntry } from "../hooks/useTrainerAttendanceMark"

// ─── Props ────────────────────────────────────────────────────────────────────

interface TrainerAttendanceMarkTableProps {
  marks: Record<string, StudentMarkEntry>
  submitting: boolean
  onSetStatus: (studentId: string, status: "present" | "absent" | "late") => void
  onSetRemarks: (studentId: string, remarks: string) => void
  onMarkAllPresent: () => void
}

// ─── Status config ─────────────────────────────────────────────────────────────

type AttendanceStatus = "present" | "late" | "absent" | "unmarked"

const STATUS_CONFIG: Record<
  Exclude<AttendanceStatus, "unmarked">,
  {
    label: string
    icon: React.ReactNode
    activeClass: string
    inactiveClass: string
  }
> = {
  present: {
    label: "Present",
    icon: <CheckCircle2 size={13} />,
    activeClass:
      "bg-[#E8F6F0] text-[#0B7A5A] border-[#0B7A5A] ring-1 ring-[#0B7A5A]/30",
    inactiveClass:
      "border-[#E2EEE9] bg-white text-[#94A3B8] hover:bg-[#F0FBF6] hover:text-[#0B7A5A] hover:border-[#C8DDD7]",
  },
  late: {
    label: "Late",
    icon: <Clock3 size={13} />,
    activeClass:
      "bg-[#FFF7ED] text-[#C2410C] border-[#C2410C] ring-1 ring-[#C2410C]/30",
    inactiveClass:
      "border-[#E2EEE9] bg-white text-[#94A3B8] hover:bg-[#FFF7ED] hover:text-[#C2410C] hover:border-[#FED7AA]",
  },
  absent: {
    label: "Absent",
    icon: <XCircle size={13} />,
    activeClass:
      "bg-[#FEF2F2] text-[#B91C1C] border-[#B91C1C] ring-1 ring-[#B91C1C]/30",
    inactiveClass:
      "border-[#E2EEE9] bg-white text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#B91C1C] hover:border-[#FECACA]",
  },
}

// ─── Unmarked pill ─────────────────────────────────────────────────────────────

function UnmarkedPill() {
  return (
    <span className="inline-flex items-center rounded-full border border-[#E2EEE9] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
      Unmarked
    </span>
  )
}

// ─── Status toggle group ───────────────────────────────────────────────────────

interface StatusToggleProps {
  studentId: string
  current: AttendanceStatus
  disabled: boolean
  onSetStatus: (studentId: string, status: "present" | "absent" | "late") => void
}

function StatusToggle({
  studentId,
  current,
  disabled,
  onSetStatus,
}: StatusToggleProps) {
  return (
    <div className="flex items-center gap-1.5">
      {(["present", "late", "absent"] as const).map((s) => {
        const cfg = STATUS_CONFIG[s]
        const isActive = current === s
        return (
          <button
            key={s}
            onClick={() => onSetStatus(studentId, s)}
            disabled={disabled}
            aria-pressed={isActive}
            className={[
              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold transition-all",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isActive ? cfg.activeClass : cfg.inactiveClass,
            ].join(" ")}
          >
            {cfg.icon}
            {cfg.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Skeleton row ──────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E2EEE9]">
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-[#E2EEE9] animate-pulse flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 rounded bg-[#E2EEE9] animate-pulse" />
            <div className="h-3 w-20 rounded bg-[#E2EEE9] animate-pulse" />
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="h-3.5 w-16 rounded bg-[#E2EEE9] animate-pulse" />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 rounded-md bg-[#E2EEE9] animate-pulse" />
          ))}
        </div>
      </td>
      <td className="px-4 py-3.5">
        <div className="h-8 w-full max-w-[240px] rounded-lg bg-[#E2EEE9] animate-pulse" />
      </td>
    </tr>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrainerAttendanceMarkTable({
  marks,
  submitting,
  onSetStatus,
  onSetRemarks,
  onMarkAllPresent,
}: TrainerAttendanceMarkTableProps) {
  const entries = Object.values(marks)

  const unmarkedCount = entries.filter((e) => e.status === "unmarked").length
  const presentCount = entries.filter((e) => e.status === "present").length
  const lateCount = entries.filter((e) => e.status === "late").length
  const absentCount = entries.filter((e) => e.status === "absent").length

  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">

      {/* ── Table toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2EEE9] bg-[#F8FAF9] px-5 py-3">
        {/* Counts */}
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-[#475569]">
            {entries.length} student{entries.length !== 1 ? "s" : ""}
          </span>

          {entries.length > 0 && (
            <div className="flex items-center gap-3 text-xs font-semibold">
              {presentCount > 0 && (
                <span className="text-[#0B7A5A]">{presentCount} Present</span>
              )}
              {lateCount > 0 && (
                <span className="text-[#C2410C]">{lateCount} Late</span>
              )}
              {absentCount > 0 && (
                <span className="text-[#B91C1C]">{absentCount} Absent</span>
              )}
              {unmarkedCount > 0 && (
                <span className="text-[#94A3B8]">{unmarkedCount} Unmarked</span>
              )}
            </div>
          )}
        </div>

        {/* Mark All Present */}
        {entries.length > 0 && (
          <button
            onClick={onMarkAllPresent}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C8DDD7] bg-white px-3 py-1.5 text-xs font-semibold text-[#0B7A5A] transition-colors hover:bg-[#E8F6F0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B7A5A] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle2 size={13} />
            Mark All Present
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2EEE9]">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap">
                Mark Attendance
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569]">
                Remarks
                <span className="ml-1 text-[#94A3B8] normal-case font-normal">
                  (optional)
                </span>
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Empty */}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-14 text-center">
                  <p className="text-sm font-semibold text-[#475569]">
                    No students found for this session.
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    Students are populated from the batch enrollment list when the
                    session is created.
                  </p>
                </td>
              </tr>
            )}

            {/* Rows */}
            {entries.map((entry, idx) => {
              const isEven = idx % 2 === 0
              return (
                <tr
                  key={entry.student_id}
                  className={[
                    "border-b border-[#E2EEE9] last:border-0 transition-colors",
                    isEven ? "bg-white" : "bg-[#FAFCFB]",
                    "hover:bg-[#F0FBF6]",
                  ].join(" ")}
                >
                  {/* Student info */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                        <UserRound size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#020617] leading-snug truncate max-w-[180px]">
                          {entry.full_name}
                        </p>
                        {entry.display_code && (
                          <p className="text-xs text-[#94A3B8] leading-snug font-medium">
                            {entry.display_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Current status pill */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {entry.status === "unmarked" ? (
                      <UnmarkedPill />
                    ) : (
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          entry.status === "present"
                            ? "bg-[#E8F6F0] text-[#0B7A5A]"
                            : entry.status === "late"
                            ? "bg-[#FFF7ED] text-[#C2410C]"
                            : "bg-[#FEF2F2] text-[#B91C1C]",
                        ].join(" ")}
                      >
                        {entry.status === "present" && <CheckCircle2 size={11} />}
                        {entry.status === "late" && <Clock3 size={11} />}
                        {entry.status === "absent" && <XCircle size={11} />}
                        {entry.status.charAt(0).toUpperCase() +
                          entry.status.slice(1)}
                      </span>
                    )}
                  </td>

                  {/* Toggle buttons */}
                  <td className="px-4 py-3.5">
                    <StatusToggle
                      studentId={entry.student_id}
                      current={entry.status}
                      disabled={submitting}
                      onSetStatus={onSetStatus}
                    />
                  </td>

                  {/* Remarks */}
                  <td className="px-4 py-3.5">
                    <input
                      type="text"
                      value={entry.remarks}
                      onChange={(e) =>
                        onSetRemarks(entry.student_id, e.target.value)
                      }
                      disabled={submitting}
                      placeholder="Add a note…"
                      maxLength={200}
                      className="w-full max-w-[280px] rounded-lg border border-[#E2EEE9] bg-white px-3 py-1.5 text-xs text-[#020617] placeholder-[#CBD5E1] transition focus:border-[#0B7A5A] focus:outline-none focus:ring-2 focus:ring-[#0B7A5A]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Skeleton export ───────────────────────────────────────────────────────────

export function TrainerAttendanceMarkTableSkeleton({
  rows = 5,
}: {
  rows?: number
}) {
  return (
    <div className="rounded-xl border border-[#E2EEE9] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#E2EEE9] bg-[#F8FAF9] px-5 py-3">
        <div className="h-4 w-24 rounded bg-[#E2EEE9] animate-pulse" />
        <div className="h-7 w-36 rounded-lg bg-[#E2EEE9] animate-pulse" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2EEE9]">
              {["Student", "Status", "Mark Attendance", "Remarks"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#475569] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}