"use client"

import { Sparkles } from "lucide-react"
import type { TrainerStudentDetailsResponse } from "../types"

interface Props {
  data: TrainerStudentDetailsResponse
}

export function TrainerStudentAIInsights({ data }: Props) {
  const ai = data.ai_insights
  const pending = ai.status === "awaiting_analytics_api" || !ai.summary

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="mb-4 flex items-center justify-between border-b border-[#F1F5F9] pb-3">
        <p className="text-sm font-black text-[#0F172A]">AI Learning Insights</p>
        <Sparkles size={16} className="text-[#7C3AED]" />
      </div>

      {pending ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3EAFE]">
            <Sparkles size={20} className="text-[#7C3AED]" />
          </div>
          <p className="text-sm font-bold text-[#475569]">No AI insights available yet.</p>
          <p className="mt-1 text-xs font-semibold text-[#94A3B8]">
            Insights will appear once the student has sufficient activity data.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ai.summary && (
            <p className="rounded-lg border border-[#E8D8FB] bg-[#F3EAFE] p-3 text-xs font-semibold leading-relaxed text-[#5B21B6]">
              {ai.summary}
            </p>
          )}

          {ai.recommendations.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-wider text-[#64748B]">
                Recommendations
              </p>
              <ul className="space-y-1.5">
                {ai.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs font-semibold text-[#334155]"
                  >
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E8D8FB] text-[10px] font-black text-[#7C3AED]">
                      {i + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}