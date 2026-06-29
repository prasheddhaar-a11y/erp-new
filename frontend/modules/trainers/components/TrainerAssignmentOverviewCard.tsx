"use client"

import { BookOpen, CalendarClock, FileText, GraduationCap, Trophy, Users } from "lucide-react"

import type { TrainerAssignment } from "../types"

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

function marksLabel(value: number | null | undefined) {
  return value === null || value === undefined ? "Not connected yet" : String(value)
}

function DetailItem({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof BookOpen
}) {
  return (
    <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-3">
      <Icon size={15} className="text-[#0B7A5A]" />
      <p className="mt-2 text-[11px] font-black uppercase tracking-wider text-[#64748B]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#0F172A]">{value}</p>
    </div>
  )
}

export function TrainerAssignmentOverviewCard({
  assignment,
}: {
  assignment: TrainerAssignment
}) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
          <FileText size={18} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#0F172A]">{assignment.title}</h3>
          <p className="mt-1 text-sm font-semibold leading-6 text-[#64748B]">
            {assignment.description ?? assignment.content ?? "No description provided."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Course" value={assignment.course ?? "Course not connected"} icon={BookOpen} />
        <DetailItem label="Batch" value={assignment.batch ?? "Batch not connected"} icon={Users} />
        <DetailItem label="Due Date" value={dateLabel(assignment.due_date)} icon={CalendarClock} />
        <DetailItem label="Max Marks" value={marksLabel(assignment.max_marks)} icon={Trophy} />
        <DetailItem label="Status" value={assignment.status} icon={GraduationCap} />
      </div>
    </section>
  )
}
