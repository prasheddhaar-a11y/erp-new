"use client"

import { CalendarClock, Eye } from "lucide-react"

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

export function TrainerAssignmentTable({
  assignments,
  onViewDetails,
}: {
  assignments: TrainerAssignment[]
  onViewDetails: (assignment: TrainerAssignment) => void
}) {
  return (
    <div className="hidden w-full overflow-hidden rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)] lg:block">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E3ECE8] bg-[#F8FAF8] text-xs font-black uppercase tracking-wider text-[#475569]">
              <th className="px-6 py-4">Assignment</th>
              <th className="px-6 py-4">Batch</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Submitted</th>
              <th className="px-6 py-4">Pending</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {assignments.map((assignment) => {
              const statusColor =
                assignment.status.toLowerCase() === "published"
                  ? "border-[#CFE8DF] bg-[#E8F6F0] text-[#0B7A5A]"
                  : "border-[#E3ECE8] bg-[#F8FAF8] text-[#64748B]"

              return (
                <tr key={assignment.id} className="transition duration-150 hover:bg-[#F8FAF8]">
                  <td className="px-6 py-4">
                    <span className="font-black text-[#0F172A]">{assignment.title}</span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#475569]">
                    {assignment.batch ?? "Batch not connected"}
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#475569]">
                    {assignment.course ?? "Course not connected"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569]">
                      <CalendarClock size={14} className="text-[#94A3B8]" />
                      {dateLabel(assignment.due_date)}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-[#0F172A]">
                    {countLabel(assignment.submitted)}
                  </td>
                  <td className="px-6 py-4 font-black text-[#0F172A]">
                    {countLabel(assignment.pending)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${statusColor}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onViewDetails(assignment)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D0DFDA] bg-white px-3 py-1.5 text-xs font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none"
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                    </button>
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
