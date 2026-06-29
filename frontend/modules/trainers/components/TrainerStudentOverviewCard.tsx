"use client"

import { Mail, Phone, ShieldCheck, User } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface TrainerStudentOverviewCardProps {
  data: TrainerStudentDetailsResponse
}

function RiskBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const map: Record<string, { bg: string; text: string; border: string }> = {
    low: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    medium: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
    high: { bg: "#FEF2F2", text: "#EF4444", border: "#FBD1D1" },
    at_risk: { bg: "#FEF2F2", text: "#EF4444", border: "#FBD1D1" },
    unknown: { bg: "#F1F5F9", text: "#64748B", border: "#D0DFDA" },
  }
  const style = map[s] ?? map.unknown
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-black uppercase tracking-wider"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      <ShieldCheck size={11} />
      Risk: {status.replace("_", " ")}
    </span>
  )
}

export function TrainerStudentOverviewCard({ data }: TrainerStudentOverviewCardProps) {
  const initials = data.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="h-1.5 w-full rounded-t-xl bg-gradient-to-r from-[#0B7A5A] to-[#7C3AED]" />

      <div className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-[#E8F6F0] bg-[#DFF5E8] text-2xl font-black text-[#0B7A5A]">
            {initials}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-[#020617]">{data.full_name}</h3>
              <RiskBadge status={data.risk_alerts.risk_status} />
            </div>
            {data.display_code && (
              <p className="mt-0.5 font-mono text-sm font-semibold text-[#94A3B8]">
                {data.display_code}
              </p>
            )}

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-[#475569]">
                <Mail size={13} className="text-[#0B7A5A]" />
                {data.email}
              </p>
              {data.phone && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-[#475569]">
                  <Phone size={13} className="text-[#0B7A5A]" />
                  {data.phone}
                </p>
              )}
            </div>
          </div>

          {/* Batch/Course panel */}
          <div className="shrink-0 rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-4 min-w-[200px]">
            <div className="space-y-2 text-xs">
              <div>
                <p className="font-semibold text-[#94A3B8]">Batch</p>
                <p className="font-black text-[#0F172A]">{data.batch.name || "—"}</p>
              </div>
              <div>
                <p className="font-semibold text-[#94A3B8]">Course</p>
                <p className="font-black text-[#0F172A]">{data.course.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}