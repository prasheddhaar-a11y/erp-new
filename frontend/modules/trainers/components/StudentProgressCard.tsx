"use client"

import { BarChart3, FolderKanban } from "lucide-react"
import type { TrainerStudent } from "../types"

function formatValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`
}

export function StudentProgressCard({ student }: { student: TrainerStudent | null }) {
  const hasProgress = student?.skill_progress !== null && student?.skill_progress !== undefined
  const hasProjects =
    student?.projects_completed !== null && student?.projects_completed !== undefined

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-[#CFE8DF] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F6F0] text-[#0B7A5A]">
            <BarChart3 size={20} />
          </span>
          <div>
            <h3 className="text-sm font-black text-[#0F172A]">Skill Progress</h3>
          </div>
        </div>

        {hasProgress ? (
          <div className="mt-5 space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-black text-[#475569]">
                <span>Progress</span>
                <span>{formatValue(student?.skill_progress, "%")}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#EEF6F2]">
                <div
                  className="h-full rounded-full bg-[#0B7A5A]"
                  style={{ width: `${Math.min(Math.max(student?.skill_progress ?? 0, 0), 100)}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#F8FAF8] p-3">
                <p className="text-xs font-bold text-[#64748B]">Completed modules</p>
                <p className="mt-1 font-black text-[#0F172A]">
                  {formatValue(student?.completed_modules)}
                </p>
              </div>
              <div className="rounded-lg bg-[#F8FAF8] p-3">
                <p className="text-xs font-bold text-[#64748B]">Remaining modules</p>
                <p className="mt-1 font-black text-[#0F172A]">
                  {formatValue(student?.remaining_modules)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg bg-[#F8FAF8] p-5 text-center">
            <BarChart3 size={20} className="mb-2 text-[#94A3B8]" />
            <p className="text-sm font-bold text-[#64748B]">No skill progress recorded yet.</p>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-[#D7E4FF] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EAF1FF] text-[#2563EB]">
            <FolderKanban size={20} />
          </span>
          <div>
            <h3 className="text-sm font-black text-[#0F172A]">Projects</h3>
          </div>
        </div>

        {hasProjects ? (
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-[#F8FAF8] p-3">
              <p className="text-xs font-bold text-[#64748B]">Completed</p>
              <p className="mt-1 font-black text-[#0F172A]">
                {formatValue(student?.projects_completed)}
              </p>
            </div>
            <div className="rounded-lg bg-[#F8FAF8] p-3">
              <p className="text-xs font-bold text-[#64748B]">Pending</p>
              <p className="mt-1 font-black text-[#0F172A]">
                {formatValue(student?.pending_projects)}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg bg-[#F8FAF8] p-5 text-center">
            <FolderKanban size={20} className="mb-2 text-[#94A3B8]" />
            <p className="text-sm font-bold text-[#64748B]">No projects recorded yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}