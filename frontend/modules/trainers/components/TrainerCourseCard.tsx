"use client"

import { BookOpen, FileText, Users } from "lucide-react"

import type { TrainerLmsCourse } from "../types"

function metric(value: number | null, fallback = "Not connected yet") {
  return value === null ? fallback : String(value)
}

export function TrainerCourseCard({
  course,
  active,
  onSelect,
}: {
  course: TrainerLmsCourse
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-lg border bg-white p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:border-[#0B7A5A] hover:shadow-[0_12px_32px_rgba(15,23,42,0.055)] ${
        active ? "border-[#0B7A5A] ring-2 ring-[#CFE8DF]" : "border-[#E3ECE8]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black text-[#0F172A]">{course.title}</p>
          <p className="mt-1 truncate text-xs font-bold text-[#64748B]">
            {course.display_code ?? course.difficulty_level ?? "Course details pending"}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#CFE8DF] bg-[#E8F6F0] px-2.5 py-1 text-[11px] font-black uppercase text-[#0B7A5A]">
          {course.status}
        </span>
      </div>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[#475569]">
        {course.description ?? "Course description not connected yet."}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-2">
          <BookOpen size={14} className="text-[#0B7A5A]" />
          <p className="mt-1 text-xs font-black text-[#0F172A]">{metric(course.lesson_count)}</p>
          <p className="text-[11px] font-bold text-[#64748B]">Lessons</p>
        </div>
        <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-2">
          <FileText size={14} className="text-[#2563EB]" />
          <p className="mt-1 text-xs font-black text-[#0F172A]">{metric(course.material_count)}</p>
          <p className="text-[11px] font-bold text-[#64748B]">Materials</p>
        </div>
        <div className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-2">
          <Users size={14} className="text-[#F97316]" />
          <p className="mt-1 text-xs font-black text-[#0F172A]">{metric(course.enrolled_students)}</p>
          <p className="text-[11px] font-bold text-[#64748B]">Students</p>
        </div>
      </div>
    </button>
  )
}
