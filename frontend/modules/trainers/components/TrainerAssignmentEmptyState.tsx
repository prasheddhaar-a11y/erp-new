"use client"

import { ClipboardList } from "lucide-react"

export function TrainerAssignmentEmptyState() {
  return (
    <section className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
        <ClipboardList size={30} />
      </div>
      <h3 className="mt-5 text-lg font-black text-[#0F172A]">No assignments yet</h3>
      <p className="mt-2 max-w-md text-sm font-semibold text-[#64748B]">
        Assignments for your assigned batches and courses will appear here.
      </p>
    </section>
  )
}
