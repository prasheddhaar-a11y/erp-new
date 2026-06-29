"use client"

import { BookOpen } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentLmsProgress({ data }: Props) {
  const lms = data.lms_progress
  const progress = lms.average_progress
  const testAvg = lms.test_average

  const barColor =
    progress == null ? "#94A3B8" : progress >= 75 ? "#2563EB" : progress >= 40 ? "#F97316" : "#EF4444"

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">LMS Progress</p>
        <BookOpen size={16} className="text-[#2563EB]" />
      </div>

      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-semibold text-[#64748B]">Course Completion</span>
          <span className="font-black" style={{ color: barColor }}>
            {progress != null ? `${progress}%` : "-"}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
          <div
            className="h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress ?? 0, 100)}%`, background: barColor }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Lessons Done"
          value={`${lms.completed_lessons} / ${lms.total_lessons}`}
          color="#2563EB"
          bg="#EAF1FF"
          border="#D7E4FF"
        />
        <Stat
          label="Test Average"
          value={testAvg != null ? `${testAvg}%` : "-"}
          color="#7C3AED"
          bg="#F3EAFE"
          border="#E8D8FB"
        />
        <Stat
          label="Test Attempts"
          value={String(lms.test_attempts)}
          color="#0B7A5A"
          bg="#E8F6F0"
          border="#CFE8DF"
        />
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  color,
  bg,
  border,
}: {
  label: string
  value: string
  color: string
  bg: string
  border: string
}) {
  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: bg, borderColor: border }}
    >
      <p className="text-xs font-semibold text-[#64748B]">{label}</p>
      <p className="mt-1 text-lg font-black" style={{ color }}>
        {value}
      </p>
    </div>
  )
}