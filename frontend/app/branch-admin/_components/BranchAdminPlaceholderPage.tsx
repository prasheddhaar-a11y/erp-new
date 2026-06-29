import { CalendarDays, ClipboardList } from "lucide-react"

type PlaceholderProps = {
  title: string
  description: string
}

export function BranchAdminPlaceholderPage({ title, description }: PlaceholderProps) {
  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">{title}</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">{description}</p>
        </div>
        <div className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#0F172A] shadow-sm">
          <CalendarDays size={17} className="text-[#0B7A5A]" />
          Branch scope
        </div>
      </section>

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
            <ClipboardList size={22} />
          </span>
          <div className="min-w-0">
            <h3 className="text-base font-black text-[#071B4A]">{title}</h3>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#475569]">
              This Branch Admin route is isolated under the new layout and ready for live module widgets.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
