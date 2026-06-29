"use client"

import { AlertTriangle, ShieldCheck } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentRiskAlerts({ data }: Props) {
  const risk = data.risk_alerts

  const statusMap: Record<string, { bg: string; text: string; border: string; label: string }> = {
    low: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF", label: "Low Risk" },
    medium: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2", label: "Medium Risk" },
    high: { bg: "#FEF2F2", text: "#EF4444", border: "#FBD1D1", label: "High Risk" },
    at_risk: { bg: "#FEF2F2", text: "#EF4444", border: "#FBD1D1", label: "At Risk" },
    unknown: { bg: "#F1F5F9", text: "#64748B", border: "#D0DFDA", label: "Not Assessed" },
  }
  const style = statusMap[risk.risk_status] ?? statusMap.unknown

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">Risk Alerts</p>
        <AlertTriangle size={16} className="text-[#EF4444]" />
      </div>

      <div
        className="mb-4 flex items-center gap-2 rounded-lg border p-3"
        style={{ background: style.bg, borderColor: style.border }}
      >
        <ShieldCheck size={16} style={{ color: style.text }} />
        <span className="text-sm font-black" style={{ color: style.text }}>
          {style.label}
        </span>
      </div>

      {risk.alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs font-bold text-[#64748B]">No risk alerts for this student.</p>
        </div>
      ) : (
        <ul className="max-h-[120px] space-y-1.5 overflow-y-auto pr-1">
          {risk.alerts.map((alert, i) => (
            <li
              key={i}
              className="flex items-start gap-2 rounded border border-[#FBD1D1] bg-[#FEF2F2] px-3 py-2 text-xs font-semibold text-[#B91C1C]"
            >
              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
              {alert}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}