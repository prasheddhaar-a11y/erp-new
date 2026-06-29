"use client"

import { Eye, GraduationCap, Mail, Phone } from "lucide-react"
import type { TrainerStudent } from "../types"

function valueOrDash(value: string | null | undefined) {
  return value && value.trim() ? value : "—"
}

export function TrainerStudentCard({
  student,
  onViewProfile,
}: {
  student: TrainerStudent
  onViewProfile: (student: TrainerStudent) => void
}) {
  return (
    <article className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-[#0B7A5A] hover:shadow-[0_12px_32px_rgba(15,23,42,0.055)]">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
          <GraduationCap size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-black text-[#0F172A]">
            {student.full_name}
          </h3>
          <p className="mt-1 truncate text-xs font-bold text-[#64748B]">
            {student.display_code || "No student code"}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs font-semibold text-[#64748B]">
        <p className="flex items-center gap-2">
          <Mail size={13} className="shrink-0" />
          <span className="truncate">{student.email || "No email on record"}</span>
        </p>
        <p className="flex items-center gap-2">
          <Phone size={13} className="shrink-0" />
          <span className="truncate">{student.phone || "No phone on record"}</span>
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg bg-[#F8FAF8] p-3">
          <p className="font-bold text-[#64748B]">Batch</p>
          <p className="mt-1 truncate font-black text-[#0F172A]">
            {valueOrDash(student.batch_name)}
          </p>
        </div>
        <div className="rounded-lg bg-[#F8FAF8] p-3">
          <p className="font-bold text-[#64748B]">Course</p>
          <p className="mt-1 truncate font-black text-[#0F172A]">
            {valueOrDash(student.course)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onViewProfile(student)}
        className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
      >
        <Eye size={15} />
        <span>View Profile</span>
      </button>
    </article>
  )
}