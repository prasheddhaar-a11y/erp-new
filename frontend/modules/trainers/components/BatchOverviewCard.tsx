"use client"

import { BookOpen, Building2, CalendarDays, Clock, Hash, Layers, Users } from "lucide-react"
import type { TrainerBatchDetailsResponse } from "../types"

interface BatchOverviewCardProps {
  data: TrainerBatchDetailsResponse
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const map: Record<string, { bg: string; text: string; border: string }> = {
    active: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    inactive: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
    completed: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    archived: { bg: "#F1F5F9", text: "#475569", border: "#D0DFDA" },
  }
  const style = map[s] ?? map.archived
  return (
    <span
      className="inline-flex items-center rounded px-2.5 py-1 text-xs font-black uppercase tracking-wider"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {status}
    </span>
  )
}

function ModeBadge({ mode }: { mode: string }) {
  const m = mode.toLowerCase()
  const map: Record<string, { bg: string; text: string; border: string }> = {
    online: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    offline: { bg: "#F3EAFE", text: "#7C3AED", border: "#E8D8FB" },
    hybrid: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
  }
  const style = map[m] ?? { bg: "#F1F5F9", text: "#475569", border: "#D0DFDA" }
  return (
    <span
      className="inline-flex items-center rounded px-2.5 py-1 text-xs font-black uppercase tracking-wider"
      style={{ background: style.bg, color: style.text, border: `1px solid ${style.border}` }}
    >
      {mode}
    </span>
  )
}

export function BatchOverviewCard({ data }: BatchOverviewCardProps) {
  const scheduleSlots = Array.isArray(data.schedule) ? data.schedule : []

  return (
    <div className="rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      {/* Top accent bar */}
      <div className="h-1.5 w-full rounded-t-xl bg-gradient-to-r from-[#0B7A5A] to-[#2563EB]" />

      <div className="p-6">
        {/* Title row */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black text-[#020617]">{data.name}</h3>
              <StatusBadge status={data.status} />
              <ModeBadge mode={data.mode} />
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#475569]">
              <BookOpen size={14} className="shrink-0 text-[#0B7A5A]" />
              {data.course}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-xs font-semibold text-[#94A3B8]">Batch Code</span>
            <span className="rounded border border-[#E3ECE8] bg-[#F8FAF8] px-3 py-1 font-mono text-sm font-black text-[#0F172A]">
              {data.code || "—"}
            </span>
          </div>
        </div>

        {/* Metadata grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaItem
            icon={<Building2 size={15} />}
            label="Branch"
            value={data.branch || "—"}
          />
          <MetaItem
            icon={<Users size={15} />}
            label="Enrolled Students"
            value={
              data.capacity != null
                ? `${data.students.length} / ${data.capacity}`
                : `${data.students.length} enrolled`
            }
          />
          <MetaItem
            icon={<Layers size={15} />}
            label="Delivery Mode"
            value={data.mode}
          />
          <MetaItem
            icon={<Hash size={15} />}
            label="Status"
            value={data.status}
          />
        </div>

        {/* Schedule slots */}
        {scheduleSlots.length > 0 && (
          <div className="mt-5 border-t border-[#F1F5F9] pt-5">
            <p className="mb-2.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#64748B]">
              <CalendarDays size={13} />
              Schedule Slots
            </p>
            <div className="flex flex-wrap gap-2">
              {scheduleSlots.map((slot, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7E4FF] bg-[#EAF1FF] px-3 py-1.5 text-xs font-bold text-[#2563EB]"
                >
                  <Clock size={11} />
                  {slot}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-[#F1F5F9] bg-[#F8FAF8] p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8]">
        <span className="text-[#0B7A5A]">{icon}</span>
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-black text-[#0F172A]">{value}</p>
    </div>
  )
}