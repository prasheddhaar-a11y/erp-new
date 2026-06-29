"use client"

import { Eye } from "lucide-react"

import type { TrainerStudent } from "../types"

function dataMetric(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "-" : `${value}${suffix}`
}

function textValue(value: string | null | undefined) {
  return value && value.trim() ? value : "-"
}

function riskLabel(value: string | null | undefined) {
  if (!value || value === "unknown") return "Not assessed"
  return value.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function TrainerStudentsTable({
  students,
  onViewProfile,
}: {
  students: TrainerStudent[]
  onViewProfile: (student: TrainerStudent) => void
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E3ECE8] bg-[#F8FAF8] text-xs font-black uppercase tracking-wider text-[#475569]">
              <th className="px-5 py-4">Student Name</th>
              <th className="px-5 py-4">Batch</th>
              <th className="px-5 py-4">Course</th>
              <th className="px-5 py-4">Skill Progress</th>
              <th className="px-5 py-4">Projects Completed</th>
              <th className="px-5 py-4">Attendance</th>
              <th className="px-5 py-4">Risk Status</th>
              <th className="px-5 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {students.map((student) => (
              <tr key={student.id} className="transition hover:bg-[#F8FAF8]">
                <td className="px-5 py-4">
                  <div>
                    <p className="font-black text-[#0F172A]">{student.full_name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748B]">
                      {student.email || student.display_code || "-"}
                    </p>
                  </div>
                </td>
                <td className="px-5 py-4 font-semibold text-[#475569]">
                  {textValue(student.batch_name)}
                </td>
                <td className="px-5 py-4 font-semibold text-[#475569]">
                  {textValue(student.course)}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded border border-[#CFE8DF] bg-[#E8F6F0] px-2.5 py-1 text-xs font-black text-[#0B7A5A]">
                    {dataMetric(student.skill_progress, "%")}
                  </span>
                </td>
                <td className="px-5 py-4 font-black text-[#0F172A]">
                  {dataMetric(student.projects_completed)}
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded border border-[#D7E4FF] bg-[#EAF1FF] px-2.5 py-1 text-xs font-black text-[#2563EB]">
                    {dataMetric(student.attendance_rate, "%")}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1 text-xs font-black text-[#64748B]">
                    {riskLabel(student.risk_status)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewProfile(student)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D0DFDA] bg-white px-3 py-1.5 text-xs font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
                  >
                    <Eye size={14} />
                    <span>View Profile</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}