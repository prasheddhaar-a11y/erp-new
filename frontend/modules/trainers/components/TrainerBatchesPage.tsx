"use client"

import {
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react"
import { useMemo, useState } from "react"

import { useTrainerBatches } from "../hooks/useTrainerBatches"
import type { TrainerBatch } from "../types"
import { TrainerBatchCard } from "./TrainerBatchCard"
import { TrainerBatchEmptyState } from "./TrainerBatchEmptyState"
import { TrainerBatchTable } from "./TrainerBatchTable"

/* ─── Local Components ────────────────────────────────────────────────────── */

function kpiValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`
}

function KPICard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: "green" | "blue" | "purple" | "orange"
}) {
  const palette = {
    green: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    blue: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    purple: { bg: "#F3EAFE", text: "#7C3AED", border: "#E8D8FB" },
    orange: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
  } as const
  const p = palette[tone]

  return (
    <div
      className="min-h-[110px] rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)] transition hover:shadow-[0_12px_32px_rgba(15,23,42,0.055)]"
      style={{ borderColor: p.border }}
    >
      <h3 className="truncate text-sm font-black text-[#475569]">{label}</h3>
      <p className="mt-2 text-2xl font-black text-[#020617]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#64748B]">{helper}</p>
      <div className="mt-3 h-1 w-8 rounded-full" style={{ backgroundColor: p.text }} />
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-24 rounded bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="h-14 w-full rounded-lg bg-gray-200" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[400px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
          <span className="text-2xl font-black">!</span>
        </div>
        <h3 className="text-lg font-black text-[#991B1B]">Failed to load batches</h3>
        <p className="text-sm font-semibold text-[#B91C1C]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#DC2626]"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

export function TrainerBatchesPage() {
  const { batches, summary, loading, error, refresh } = useTrainerBatches()

  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid")

  const uniqueCourses = useMemo(() => {
    if (!batches) return []
    return Array.from(new Set(batches.map((b) => b.course))).sort()
  }, [batches])

  const filteredBatches = useMemo(() => {
    if (!batches) return []
    return batches.filter((batch) => {
      const matchesSearch =
        batch.name.toLowerCase().includes(search.toLowerCase()) ||
        batch.course.toLowerCase().includes(search.toLowerCase())
      const matchesCourse = courseFilter === "All" || batch.course === courseFilter
      const matchesStatus =
        statusFilter === "All" ||
        batch.status.toLowerCase() === statusFilter.toLowerCase()
      return matchesSearch && matchesCourse && matchesStatus
    })
  }, [batches, search, courseFilter, statusFilter])

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refresh} />

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">My Batches</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">
            Monitor assigned student rosters, schedules, and metrics.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none"
        >
          <RefreshCw size={14} className="shrink-0" />
          <span>Refresh</span>
        </button>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          label="Assigned Batches"
          value={kpiValue(summary?.assigned_batches)}
          helper="Total batches assigned"
          tone="green"
        />
        <KPICard
          label="Active Batches"
          value={kpiValue(summary?.active_batches)}
          helper="Batches currently in progress"
          tone="orange"
        />
        <KPICard
          label="Total Students"
          value={kpiValue(summary?.total_students)}
          helper="Active enrolled student count"
          tone="blue"
        />
        <KPICard
          label="Average Attendance"
          value={kpiValue(summary?.average_attendance, "%")}
          helper="Avg. compliance rate"
          tone="purple"
        />
      </section>

      {/* Filter bar */}
      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.025)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-[240px] flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search by batch or course..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-[#D0DFDA] bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-[#0F172A] placeholder-[#94A3B8] outline-none transition focus:border-[#0B7A5A] focus:ring-1 focus:ring-[#0B7A5A]"
              />
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#64748B]" />
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="rounded-lg border border-[#D0DFDA] bg-white px-3 py-2 text-sm font-semibold text-[#334155] outline-none transition focus:border-[#0B7A5A]"
              >
                <option value="All">All Courses</option>
                {uniqueCourses.map((course) => (
                  <option key={course} value={course}>
                    {course}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[#D0DFDA] bg-white px-3 py-2 text-sm font-semibold text-[#334155] outline-none transition focus:border-[#0B7A5A]"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-[#D0DFDA] p-1 bg-white">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded p-1.5 transition ${viewMode === "grid" ? "bg-[#E8F6F0] text-[#0B7A5A]" : "text-[#64748B] hover:text-[#0B7A5A]"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded p-1.5 transition ${viewMode === "table" ? "bg-[#E8F6F0] text-[#0B7A5A]" : "text-[#64748B] hover:text-[#0B7A5A]"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Content */}
      {filteredBatches.length > 0 ? (
        viewMode === "grid" ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch) => (
              <TrainerBatchCard key={batch.id} batch={batch} />
            ))}
          </section>
        ) : (
          <section>
            <TrainerBatchTable batches={filteredBatches} />
          </section>
        )
      ) : (
        <TrainerBatchEmptyState />
      )}
    </div>
  )
}