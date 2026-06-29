"use client"

import { CalendarCheck2 } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentAttendanceSummary({ data }: Props) {
  const att = data.attendance_summary
  const rate = att.attendance_rate

  const rateColor =
    rate == null ? "#94A3B8" : rate >= 75 ? "#0B7A5A" : rate >= 50 ? "#F97316" : "#EF4444"
  const rateBg =
    rate == null ? "#F1F5F9" : rate >= 75 ? "#E8F6F0" : rate >= 50 ? "#FFF3E8" : "#FEF2F2"
  const total = att.present + att.absent + att.late

  const hasData = total > 0 || rate != null

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">Attendance Summary</p>
        <CalendarCheck2 size={16} className="text-[#0B7A5A]" />
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CalendarCheck2 size={24} className="mb-2 text-[#94A3B8]" />
          <p className="text-sm font-bold text-[#64748B]">No attendance recorded yet.</p>
          <p className="mt-1 text-xs font-semibold text-[#94A3B8]">
            Records will appear once sessions are submitted for this student.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4"
            style={{ borderColor: rateColor, background: rateBg }}
          >
            <span className="text-xl font-black" style={{ color: rateColor }}>
              {rate != null ? `${rate}%` : "—"}
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <AttRow label="Present" value={att.present} total={total} color="#0B7A5A" bg="#E8F6F0" />
            <AttRow label="Absent" value={att.absent} total={total} color="#EF4444" bg="#FEF2F2" />
            <AttRow label="Late" value={att.late} total={total} color="#F97316" bg="#FFF3E8" />
          </div>
        </div>
      )}
    </div>
  )
}

function AttRow({
  label,
  value,
  total,
  color,
  bg,
}: {
  label: string
  value: number
  total: number
  color: string
  bg: string
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#64748B]">{label}</span>
        <span className="font-black text-[#0F172A]">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: bg }}>
        <div
          className="h-1.5 rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}