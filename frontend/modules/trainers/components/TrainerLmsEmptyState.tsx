"use client"

import { BookOpen } from "lucide-react"

export function TrainerLmsEmptyState({
  message = "Trainer-owned courses will appear here after Trainer LMS API is connected.",
}: {
  message?: string
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-white p-6 text-center shadow-[0_8px_24px_rgba(15,23,42,0.03)]">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
        <BookOpen size={28} />
      </div>
      <h3 className="mt-4 text-lg font-black text-[#0F172A]">No trainer courses found</h3>
      <p className="mt-1.5 max-w-sm text-sm font-semibold text-[#64748B]">{message}</p>
    </div>
  )
}
