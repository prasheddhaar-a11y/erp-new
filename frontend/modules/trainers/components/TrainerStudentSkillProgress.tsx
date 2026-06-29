"use client"

import { BarChart3 } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentSkillProgress({ data }: Props) {
  const skill = data.skill_progress
  const pct = skill.percentage

  const barColor =
    pct == null ? "#94A3B8" : pct >= 75 ? "#0B7A5A" : pct >= 40 ? "#F97316" : "#EF4444"

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">Skill Progress</p>
        <BarChart3 size={16} className="text-[#0B7A5A]" />
      </div>

      {/* Ring */}
      <div className="mb-4 flex justify-center">
        <div
          className="flex h-20 w-20 items-center justify-center rounded-full border-4"
          style={{
            borderColor: barColor,
            background: pct == null ? "#F1F5F9" : pct >= 75 ? "#E8F6F0" : pct >= 40 ? "#FFF3E8" : "#FEF2F2",
          }}
        >
          <span className="text-xl font-black" style={{ color: barColor }}>
            {pct != null ? `${pct}%` : "—"}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-[#F1F5F9]">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct ?? 0, 100)}%`, background: barColor }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[#64748B]">Modules Completed</span>
        <span className="font-black text-[#0F172A]">
          {skill.completed_modules} / {skill.total_modules}
        </span>
      </div>

      {skill.status === "not_connected" && (
        <p className="mt-4 border-t border-[#F1F5F9] pt-3 text-[11px] font-semibold italic text-[#94A3B8]">
          * Skill engine not connected yet.
        </p>
      )}
    </div>
  )
}