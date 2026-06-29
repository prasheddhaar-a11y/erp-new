"use client"

import { Brain, ShieldAlert } from "lucide-react"

export function StudentRiskCard() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-[#E8D8FB] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3EAFE] text-[#7C3AED]">
            <Brain size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#7C3AED]">S.No 33</p>
            <h3 className="text-sm font-black text-[#0F172A]">AI Learning Analytics Insights</h3>
          </div>
        </div>
        <p className="mt-5 rounded-lg bg-[#F8FAF8] p-4 text-sm font-semibold text-[#64748B]">
          AI Learning Analytics will be connected after student analytics APIs are available.
        </p>
      </div>

      <div className="rounded-lg border border-[#FEDFC2] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF3E8] text-[#F97316]">
            <ShieldAlert size={20} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#F97316]">S.No 126</p>
            <h3 className="text-sm font-black text-[#0F172A]">Student Performance Alert Engine</h3>
          </div>
        </div>
        <p className="mt-5 rounded-lg bg-[#F8FAF8] p-4 text-sm font-semibold text-[#64748B]">
          Performance Alert Engine will be connected after risk analysis APIs are available.
        </p>
      </div>
    </section>
  )
}
