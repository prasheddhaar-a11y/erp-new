"use client"

import { CalendarClock, Eye, Inbox } from "lucide-react"

import type { TrainerAssignmentSubmission } from "../types"

function dateLabel(value: string | null) {
  if (!value) return "Not submitted"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function marksLabel(value: number | null) {
  return value === null ? "Not graded" : String(value)
}

export function TrainerAssignmentSubmissionTable({
  submissions,
}: {
  submissions: TrainerAssignmentSubmission[]
}) {
  if (submissions.length === 0) {
    return (
      <section className="rounded-lg border border-dashed border-[#D0DFDA] bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F8FAF8] text-[#64748B]">
          <Inbox size={20} />
        </span>
        <h3 className="mt-4 text-base font-black text-[#0F172A]">No submissions found</h3>
        <p className="mt-1 text-sm font-semibold text-[#64748B]">
          Submission data will appear here when the trainer-scoped backend returns records.
        </p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="border-b border-[#E3ECE8] bg-[#F8FAF8] px-5 py-4">
        <h3 className="text-base font-black text-[#0F172A]">Submissions</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E3ECE8] text-xs font-black uppercase tracking-wider text-[#475569]">
              <th className="px-5 py-4">Student</th>
              <th className="px-5 py-4">Submitted At</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Marks</th>
              <th className="px-5 py-4">Feedback Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {submissions.map((submission) => (
              <tr key={submission.id} className="transition hover:bg-[#F8FAF8]">
                <td className="px-5 py-4 font-black text-[#0F172A]">
                  {submission.student ?? "Student not connected"}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#475569]">
                    <CalendarClock size={14} className="text-[#94A3B8]" />
                    {dateLabel(submission.submitted_at)}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-[#475569]">{submission.status}</td>
                <td className="px-5 py-4 font-semibold text-[#475569]">
                  {marksLabel(submission.marks)}
                </td>
                <td className="px-5 py-4 font-semibold text-[#475569]">
                  {submission.feedback_status}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    disabled
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-3 text-xs font-black text-[#64748B] opacity-70"
                  >
                    <Eye size={14} />
                    <span>View only</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
