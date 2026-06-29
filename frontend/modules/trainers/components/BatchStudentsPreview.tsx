"use client"

import { GraduationCap, Mail, Phone } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchStudentsPreviewProps {
  data: TrainerBatchDetailsResponse
}

function EnrollmentBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const map: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    inactive: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
    completed: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    dropped: { bg: "#FEF2F2", text: "#EF4444", border: "#FBD1D1" },
  }
  const style = map[s] ?? { bg: "#F1F5F9", text: "#475569", border: "#D0DFDA" }
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {status}
    </span>
  )
}

export function BatchStudentsPreview({ data }: BatchStudentsPreviewProps) {
  const students = data.students

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-center justify-between border-b border-[#F1F5F9] px-6 py-4">
        <div className="flex items-center gap-2">
          <GraduationCap size={16} className="text-[#0B7A5A]" />
          <p className="text-sm font-black text-[#0F172A]">Student Roster</p>
        </div>
        <span className="rounded border border-[#CFE8DF] bg-[#E8F6F0] px-2.5 py-1 text-xs font-black text-[#0B7A5A]">
          {students.length} student{students.length !== 1 ? "s" : ""}
        </span>
      </div>

      {students.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
          <GraduationCap size={32} className="mb-3 text-[#94A3B8]" />
          <p className="text-sm font-black text-[#475569]">No students enrolled in this batch yet.</p>
          <p className="mt-1 text-xs font-semibold text-[#94A3B8]">
            Students are enrolled via the Branch Admin portal.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#F1F5F9] bg-[#F8FAF8]">
                <th className="px-6 py-3 text-xs font-black uppercase tracking-wider text-[#94A3B8]">
                  Student
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-[#94A3B8]">
                  Contact
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-[#94A3B8]">
                  Attendance
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-[#94A3B8]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {students.map((student) => {
                const rate = student.attendance_rate
                const rateColor =
                  rate == null
                    ? "#94A3B8"
                    : rate >= 75
                    ? "#0B7A5A"
                    : rate >= 50
                    ? "#F97316"
                    : "#EF4444"

                return (
                  <tr
                    key={student.id}
                    className="transition hover:bg-[#F8FAF8]"
                  >
                    {/* Name + code */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-sm font-black text-[#0B7A5A]">
                          {student.full_name.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-black text-[#0F172A]">
                            {student.full_name}
                          </p>
                          {student.display_code && (
                            <p className="font-mono text-xs font-semibold text-[#94A3B8]">
                              {student.display_code}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]">
                          <Mail size={11} className="shrink-0" />
                          <span className="truncate max-w-[180px]">{student.email}</span>
                        </p>
                        {student.phone && (
                          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#475569]">
                            <Phone size={11} className="shrink-0" />
                            {student.phone}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Attendance rate */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F1F5F9]">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${Math.min(rate ?? 0, 100)}%`,
                              background: rateColor,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-black"
                          style={{ color: rateColor }}
                        >
                          {rate != null ? `${rate}%` : "—"}
                        </span>
                      </div>
                    </td>

                    {/* Enrollment status */}
                    <td className="px-4 py-3">
                      <EnrollmentBadge status={student.enrollment_status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}