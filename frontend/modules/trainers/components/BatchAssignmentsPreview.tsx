"use client"

import { ClipboardList, Calendar } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchAssignmentsPreviewProps {
  data: TrainerBatchDetailsResponse
}

export function BatchAssignmentsPreview({ data }: BatchAssignmentsPreviewProps) {
  const assignments = data.assignments

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)] flex flex-col justify-between min-h-[220px]">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-[#F1F5F9] pb-3">
          <p className="text-sm font-black text-[#0F172A]">Recent Coursework</p>
          <span className="text-xs font-semibold text-blue-600 border border-[#D7E4FF] bg-[#EAF1FF] px-2 py-0.5 rounded">
            Assignments
          </span>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <ClipboardList className="text-[#94A3B8] mb-2" size={24} />
            <p className="text-xs font-bold text-[#64748B]">No assignments available.</p>
            <p className="mt-1 text-[11px] font-semibold text-[#94A3B8]">
              Assignments will appear here once created for this batch.
            </p>
          </div>
        ) : (
          <ul className="mt-2 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {assignments.map((asm) => (
              <li key={asm.id} className="flex items-center justify-between rounded border border-[#F1F5F9] bg-[#F8FAF8] p-2 text-xs">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#0F172A]">{asm.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-[#64748B]">
                    <Calendar size={10} />
                    <span>Due: {asm.due_at ? new Date(asm.due_at).toLocaleDateString("en-IN") : "No due date"}</span>
                  </p>
                </div>
                <span className="shrink-0 font-black text-[#0B7A5A] ml-2">
                  {asm.max_marks} marks
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}