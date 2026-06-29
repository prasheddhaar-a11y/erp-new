"use client"

import { BookOpen, Percent, Eye } from "lucide-react"
import type { TrainerBatch } from "../types"

import { useRouter } from 'next/navigation';

interface TrainerBatchCardProps {
  batch: TrainerBatch
}

export function TrainerBatchCard({ batch }: TrainerBatchCardProps) {
  const router = useRouter();
  // Utilization calculation
  const capacity = batch.capacity || 30
  const enrolled = batch.students || 0
  const utilization = Math.min(Math.round((enrolled / capacity) * 100), 100)

  // Attendance rate styling
  const rate = batch.attendance_rate
  const rateColor =
    rate === null
      ? "bg-gray-100 text-gray-600 border-gray-200"
      : rate >= 85
      ? "bg-[#E8F6F0] text-[#0B7A5A] border-[#CFE8DF]"
      : rate >= 75
      ? "bg-[#FFF3E8] text-[#F97316] border-[#FEDFC2]"
      : "bg-[#FFF0F0] text-[#EF4444] border-[#FBD1D1]"

  // Status Badge styling
  const statusColor =
    batch.status.toLowerCase() === "active"
      ? "bg-[#E8F6F0] text-[#0B7A5A] border-[#CFE8DF]"
      : "bg-gray-100 text-gray-600 border-gray-200"

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition duration-200 hover:border-[#0B7A5A] hover:shadow-[0_12px_32px_rgba(15,23,42,0.065)]">
      <div>
        {/* Badges bar */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
            {batch.mode}
          </span>
          <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusColor}`}>
            {batch.status}
          </span>
        </div>

        {/* Title and Course */}
        <h3 className="mt-3 text-lg font-black leading-snug text-[#0F172A] group-hover:text-[#0B7A5A]">
          {batch.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
          <BookOpen size={13} className="shrink-0" />
          <span className="truncate">{batch.course}</span>
        </div>

        {/* Utilization Progress */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-[#64748B]">Class Utilization</span>
            <span className="font-black text-[#0F172A]">
              {enrolled} / {capacity} ({utilization}%)
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#F1F5F9]">
            <div
              className="h-full rounded-full bg-[#0B7A5A] transition-all duration-300"
              style={{ width: `${utilization}%` }}
            />
          </div>
        </div>
      </div>

      {/* Footer Details */}
      <div className="mt-5 border-t border-[#F1F5F9] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-black ${rateColor}`}>
              <Percent size={12} />
              <span>{rate !== null ? `${rate}% Attendance` : "No Sessions"}</span>
            </div>
            {batch.schedule !== "Schedule pending" && (
              <span className="inline-flex items-center gap-1 rounded bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#475569]">
                {batch.schedule}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push(`/trainer/batches/${batch.id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-black text-[#0B7A5A] hover:text-[#096349] transition outline-none"
          >
            <Eye size={14} />
            <span>View Details</span>
          </button>
        </div>

        {/* Source Flag Indicator */}
        {batch.source === "config" && (
          <p className="mt-3 text-[10px] font-semibold text-[#F97316]">
            * Configuration pending student assignments by admin.
          </p>
        )}
      </div>
    </div>
  )
}
