import type { Metadata } from "next"
import { CalendarDays } from "lucide-react"

export const metadata: Metadata = {
  title: "Calendar | Trainer Portal – Pinesphere ERP",
  description: "View your class schedule and upcoming events.",
}

export default function TrainerCalendarPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Calendar</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">
            View your class schedule, sessions, and upcoming events.
          </p>
        </div>
      </section>

      <section className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8DDD7] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#E8F6F0]">
          <CalendarDays size={36} className="text-[#0B7A5A]" />
        </div>
        <h3 className="mt-5 text-xl font-black text-[#0F172A]">Calendar</h3>
        <p className="mt-2 max-w-sm text-center text-sm font-semibold text-[#64748B]">
          Calendar will be connected in Phase 6.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#CFE8DF] bg-[#E8F6F0] px-4 py-1.5 text-xs font-black text-[#0B7A5A]">
          Coming in Phase 6
        </span>
      </section>
    </div>
  )
}
