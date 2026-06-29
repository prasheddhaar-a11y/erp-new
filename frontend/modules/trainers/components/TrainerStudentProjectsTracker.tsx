"use client"

import { CheckCircle2, Clock, FolderKanban } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentProjectsTracker({ data }: Props) {
  const projects = data.projects
  const recent = projects.recent_projects

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">Projects Tracker</p>
        <FolderKanban size={16} className="text-[#F97316]" />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#CFE8DF] bg-[#E8F6F0] p-3 text-center">
          <p className="text-2xl font-black text-[#0B7A5A]">{projects.completed}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#475569]">Completed</p>
        </div>
        <div className="rounded-lg border border-[#FEDFC2] bg-[#FFF3E8] p-3 text-center">
          <p className="text-2xl font-black text-[#F97316]">{projects.pending}</p>
          <p className="mt-0.5 text-xs font-semibold text-[#475569]">Pending</p>
        </div>
      </div>

      {recent.length > 0 ? (
        <ul className="max-h-[100px] space-y-1.5 overflow-y-auto pr-1">
          {recent.map((proj, i) => {
            const title = typeof proj.title === "string" ? proj.title : `Project ${i + 1}`
            const status = typeof proj.status === "string" ? proj.status : "unknown"
            const done = status.toLowerCase() === "completed"
            return (
              <li
                key={i}
                className="flex items-center gap-2 rounded border border-[#F1F5F9] bg-[#F8FAF8] px-3 py-2 text-xs"
              >
                {done ? (
                  <CheckCircle2 size={12} className="shrink-0 text-[#0B7A5A]" />
                ) : (
                  <Clock size={12} className="shrink-0 text-[#F97316]" />
                )}
                <span className="truncate font-bold text-[#0F172A]">{title}</span>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-center text-xs font-semibold text-[#94A3B8]">
          No project submissions available.
        </p>
      )}
    </div>
  )
}