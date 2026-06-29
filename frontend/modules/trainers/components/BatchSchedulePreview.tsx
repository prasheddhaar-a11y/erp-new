"use client"

import { CalendarDays, Clock } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchSchedulePreviewProps {
  data: TrainerBatchDetailsResponse
}

export function BatchSchedulePreview({ data }: BatchSchedulePreviewProps) {
  const slots = Array.isArray(data.schedule) ? data.schedule : []

  return (
    <div className="flex min-h-[220px] flex-col rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-3 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">Schedule</p>
        <span className="rounded border border-[#D7E4FF] bg-[#EAF1FF] px-2 py-0.5 text-xs font-semibold text-blue-600">
          {slots.length} slot{slots.length !== 1 ? "s" : ""}
        </span>
      </div>

      {slots.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
          <CalendarDays className="mb-2 text-[#94A3B8]" size={24} />
          <p className="text-xs font-bold text-[#64748B]">No schedule configured.</p>
          <p className="mt-1 text-[11px] font-semibold text-[#94A3B8]">
            Schedule slots will appear once set up for this batch.
          </p>
        </div>
      ) : (
        <ul className="mt-2 max-h-[130px] space-y-2 overflow-y-auto pr-1">
          {slots.map((slot, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg border border-[#F1F5F9] bg-[#F8FAF8] px-3 py-2 text-xs"
            >
              <Clock size={12} className="shrink-0 text-[#0B7A5A]" />
              <span className="truncate font-bold text-[#0F172A]">{slot}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}