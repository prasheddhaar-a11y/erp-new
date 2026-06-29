"use client"

import { GitBranch } from "lucide-react"

export function TrainerAssignmentGithubPanel() {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EAFE] text-[#7C3AED]">
          <GitBranch size={18} />
        </span>
        <div>
          <h3 className="text-base font-black text-[#0F172A]">GitHub Repository Integration</h3>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">
            GitHub repository linking will be available after project workflow implementation.
          </p>
        </div>
      </div>
    </section>
  )
}
