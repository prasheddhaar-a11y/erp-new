"use client"

import { GraduationCap } from "lucide-react"

export function TrainerBatchEmptyState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
        <GraduationCap size={28} />
      </div>
      <h3 className="mt-4 text-lg font-black text-[#0F172A]">No batches assigned</h3>
      <p className="mt-1.5 max-w-sm text-sm font-semibold text-[#64748B]">
        Assigned batches will appear here after trainer-batch integration.
      </p>
    </div>
  )
}
