"use client"

import { BookOpen } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchLmsProgressProps {
  data: TrainerBatchDetailsResponse
}

export function BatchLmsProgress({ data }: BatchLmsProgressProps) {
  const lms = data.lms_progress
  const progress = lms.average_progress

  const progressColor =
    progress == null ? "#94A3B8" : progress >= 75 ? "#2563EB" : progress >= 40 ? "#F97316" : "#EF4444"
  const progressBg =
    progress == null ? "#F1F5F9" : progress >= 75 ? "#EAF1FF" : progress >= 40 ? "#FFF3E8" : "#FEF2F2"

  const hasData = lms.total_lessons > 0 || progress != null

  return (
    <div className="flex min-h-[220px] flex-col justify-between rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div>
        <div className="mb-3 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <p className="text-sm font-black text-[#0F172A]">LMS Progress</p>
          <BookOpen size={16} className="text-[#2563EB]" />
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <BookOpen size={24} className="mb-2 text-[#94A3B8]" />
            <p className="text-xs font-bold text-[#64748B]">No LMS progress available.</p>
            <p className="mt-1 text-[11px] font-semibold text-[#94A3B8]">
              Progress will appear once students begin their coursework.
            </p>
          </div>
        ) : (
          <>
            {/* Progress ring */}
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4"
              style={{ borderColor: progressColor, background: progressBg }}
            >
              <span className="text-xl font-black" style={{ color: progressColor }}>
                {progress != null ? `${progress}%` : "—"}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(progress ?? 0, 100)}%`,
                  background: progressColor,
                }}
              />
            </div>

            {/* Lesson counts */}
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#64748B]">Completed Lessons</span>
              <span className="font-black text-[#0F172A]">
                {lms.completed_lessons} / {lms.total_lessons}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}