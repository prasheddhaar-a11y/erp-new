"use client"

import { Eye, Percent, BookOpen } from "lucide-react"
import type { TrainerBatch } from "../types"
import { useRouter } from 'next/navigation';

interface TrainerBatchTableProps {
  batches: TrainerBatch[]
}

export function TrainerBatchTable({ batches }: TrainerBatchTableProps) {
  const router = useRouter();
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E3ECE8] bg-[#F8FAF8] text-xs font-black uppercase tracking-wider text-[#475569]">
              <th className="px-6 py-4">Batch Name</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4">Attendance</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {batches.map((batch) => {
              // Utilization calculation
              const capacity = batch.capacity || 30
              const enrolled = batch.students || 0
              const utilization = Math.min(Math.round((enrolled / capacity) * 100), 100)

              // Attendance rate styling
              const rate = batch.attendance_rate
              const rateColor =
                rate === null
                  ? "text-gray-500 bg-gray-50 border-gray-100"
                  : rate >= 85
                  ? "text-[#0B7A5A] bg-[#E8F6F0] border-[#CFE8DF]"
                  : rate >= 75
                  ? "text-[#F97316] bg-[#FFF3E8] border-[#FEDFC2]"
                  : "text-[#EF4444] bg-[#FFF0F0] border-[#FBD1D1]"

              // Status badge styling
              const statusColor =
                batch.status.toLowerCase() === "active"
                  ? "text-[#0B7A5A] bg-[#E8F6F0] border-[#CFE8DF]"
                  : "text-gray-500 bg-gray-50 border-gray-100"

              return (
                <tr
                  key={batch.id}
                  className="transition duration-150 hover:bg-[#F8FAF8]"
                >
                  {/* Batch Name */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-black text-[#0F172A]">{batch.name}</span>
                      <span className="mt-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#2563EB]">
                        {batch.mode} • {batch.schedule}
                      </span>
                    </div>
                  </td>

                  {/* Course */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-semibold text-[#475569]">
                      <BookOpen size={14} className="shrink-0 text-[#94A3B8]" />
                      <span className="truncate max-w-[200px]">{batch.course}</span>
                    </div>
                  </td>

                  {/* Students */}
                  <td className="px-6 py-4">
                    <div className="flex flex-col w-[120px]">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="font-black text-[#334155]">{enrolled} / {capacity}</span>
                        <span className="text-[10px] text-[#64748B]">{utilization}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#F1F5F9]">
                        <div
                          className="h-full rounded-full bg-[#0B7A5A] transition-all duration-300"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-black ${rateColor}`}>
                      <Percent size={12} />
                      <span>{rate !== null ? `${rate}%` : "No Sessions"}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-black uppercase tracking-wider ${statusColor}`}>
                      {batch.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => router.push(`/trainer/batches/${batch.id}`)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D0DFDA] bg-white px-3 py-1.5 text-xs font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none"
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
