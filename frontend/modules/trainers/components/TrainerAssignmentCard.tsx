"use client"

import { BookOpen, CalendarClock, Eye, Users } from "lucide-react"

import type { TrainerAssignment } from "../types"

function countLabel(value: number | null) {
  return value === null ? "Not connected yet" : String(value)
}

function dateLabel(value: string | null) {
  if (!value) return "No due date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

export function TrainerAssignmentCard({
  assignment,
  onViewDetails,
}: {
  assignment: TrainerAssignment
  onViewDetails: (assignment: TrainerAssignment) => void
}) {
  const statusColor =
    assignment.status.toLowerCase() === "published"
      ? "border-[#CFE8DF] bg-[#E8F6F0] text-[#0B7A5A]"
      : "border-[#E3ECE8] bg-[#F8FAF8] text-[#64748B]"

  return (
    <article className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-[#0F172A]">{assignment.title}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#64748B]">
            <CalendarClock size={14} className="shrink-0" />
            <span>{dateLabel(assignment.due_date)}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-black uppercase ${statusColor}`}>
          {assignment.status}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-3">
          <Users size={14} className="text-[#0B7A5A]" />
          <p className="mt-1 text-xs font-black text-[#0F172A]">
            {assignment.batch ?? "Batch not connected"}
          </p>
          <p className="text-[11px] font-bold text-[#64748B]">Batch</p>
        </div>
        <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-3">
          <BookOpen size={14} className="text-[#2563EB]" />
          <p className="mt-1 text-xs font-black text-[#0F172A]">
            {assignment.course ?? "Course not connected"}
          </p>
          <p className="text-[11px] font-bold text-[#64748B]">Course</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-black text-[#475569]">
        <span className="rounded-lg border border-[#E3ECE8] bg-white px-3 py-1.5">
          Submitted: {countLabel(assignment.submitted)}
        </span>
        <span className="rounded-lg border border-[#E3ECE8] bg-white px-3 py-1.5">
          Pending: {countLabel(assignment.pending)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onViewDetails(assignment)}
        className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-3 text-xs font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none"
      >
        <Eye size={14} />
        <span>View Details</span>
      </button>
    </article>
  )
}
