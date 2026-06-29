"use client"

import { CalendarCheck2, CheckCircle2, XCircle } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchAttendanceSummaryProps {
  data: TrainerBatchDetailsResponse
}

export function BatchAttendanceSummary({ data }: BatchAttendanceSummaryProps) {
  const att = data.attendance_summary
  const rate = att.average_rate

  const rateColor =
    rate == null ? "#94A3B8" : rate >= 75 ? "#0B7A5A" : rate >= 50 ? "#F97316" : "#EF4444"
  const rateBg =
    rate == null ? "#F1F5F9" : rate >= 75 ? "#E8F6F0" : rate >= 50 ? "#FFF3E8" : "#FEF2F2"

  const hasData = att.submitted_sessions > 0 || att.pending_sessions > 0 || rate != null

  return (
    <div className="flex min-h-[220px] flex-col justify-between rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div>
        <div className="mb-3 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <p className="text-sm font-black text-[#0F172A]">Attendance Summary</p>
          <CalendarCheck2 size={16} className="text-[#0B7A5A]" />
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CalendarCheck2 size={24} className="mb-2 text-[#94A3B8]" />
            <p className="text-xs font-bold text-[#64748B]">No attendance recorded yet.</p>
            <p className="mt-1 text-[11px] font-semibold text-[#94A3B8]">
              Records will appear once sessions are submitted.
            </p>
          </div>
        ) : (
          <>
            {/* Rate ring */}
            <div
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-4"
              style={{ borderColor: rateColor, background: rateBg }}
            >
              <span className="text-xl font-black" style={{ color: rateColor }}>
                {rate != null ? `${rate}%` : "—"}
              </span>
            </div>

            {/* Sub-stats */}
            <div className="space-y-2">
              <StatRow
                icon={<CheckCircle2 size={13} className="text-[#0B7A5A]" />}
                label="Submitted Sessions"
                value={att.submitted_sessions}
              />
              <StatRow
                icon={<XCircle size={13} className="text-[#F97316]" />}
                label="Pending Sessions"
                value={att.pending_sessions}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 font-semibold text-[#64748B]">
        {icon}
        {label}
      </span>
      <span className="font-black text-[#0F172A]">{value}</span>
    </div>
  )
}