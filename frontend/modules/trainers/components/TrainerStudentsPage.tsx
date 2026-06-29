"use client"

import {
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  FolderKanban,
  RefreshCw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { useTrainerStudents } from "../hooks/useTrainerStudents"
import type { TrainerStudent } from "../types"
import { TrainerStudentEmptyState } from "./TrainerStudentEmptyState"
import { TrainerStudentsTable } from "./TrainerStudentsTable"

const EMPTY_STUDENTS: TrainerStudent[] = []

function kpiValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "-" : `${value}${suffix}`
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function KPICard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  helper: string
  icon: typeof BarChart3
  tone: "green" | "blue" | "purple" | "orange" | "red"
}) {
  const palette = {
    green: { border: "#CFE8DF", accent: "#0B7A5A" },
    blue: { border: "#D7E4FF", accent: "#2563EB" },
    purple: { border: "#E8D8FB", accent: "#7C3AED" },
    orange: { border: "#FEDFC2", accent: "#F97316" },
    red: { border: "#FBD1D1", accent: "#EF4444" },
  } as const
  const p = palette[tone]

  return (
    <div
      className="min-h-[104px] rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.035)]"
      style={{ borderColor: p.border }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-black uppercase tracking-wider text-[#64748B]">
            {label}
          </h3>
          <p className={`mt-2 font-black text-[#020617] ${value === "-" ? "text-sm" : "text-2xl"}`}>
            {value}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F8FAF8]" style={{ color: p.accent }}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-semibold text-[#64748B]">{helper}</p>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-60 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-36 rounded bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="h-26 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="h-16 rounded-lg bg-gray-200" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-80 rounded-xl border border-gray-200 bg-white" />
        <div className="h-80 rounded-xl border border-gray-200 bg-white" />
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
        <h3 className="text-lg font-black text-[#991B1B]">Failed to load assigned students</h3>
        <p className="text-sm font-semibold text-[#B91C1C]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white transition hover:bg-[#DC2626]"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      </div>
    </div>
  )
}

export function TrainerStudentsPage() {
  const { data, loading, error, refresh } = useTrainerStudents()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [batchFilter, setBatchFilter] = useState("All")
  const [courseFilter, setCourseFilter] = useState("All")
  const [riskFilter, setRiskFilter] = useState("All")

  const students = data?.students ?? EMPTY_STUDENTS
  const summary = data?.summary

  const batchOptions = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.batch_name)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [students]
  )

  const courseOptions = useMemo(
    () =>
      Array.from(
        new Set(
          students
            .map((student) => student.course)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [students]
  )

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.full_name.toLowerCase().includes(query) ||
        student.email.toLowerCase().includes(query) ||
        (student.display_code ?? "").toLowerCase().includes(query) ||
        (student.batch_name ?? "").toLowerCase().includes(query) ||
        (student.course ?? "").toLowerCase().includes(query)
      const matchesBatch = batchFilter === "All" || student.batch_name === batchFilter
      const matchesCourse = courseFilter === "All" || student.course === courseFilter
      const matchesRisk =
        riskFilter === "All" ||
        student.risk_status.toLowerCase() === riskFilter.toLowerCase()
      return matchesSearch && matchesBatch && matchesCourse && matchesRisk
    })
  }, [batchFilter, courseFilter, riskFilter, search, students])

  const openProfile = (student: TrainerStudent) => {
    router.push(`/trainer/students/${encodeURIComponent(student.id)}`)
  }

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refresh} />

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
            Assigned Students
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">
            View students assigned to your batches and courses.
          </p>
          <p className="mt-1 text-xs font-bold text-[#64748B]">
            Last updated: {formatUpdatedAt(data?.updated_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KPICard label="Assigned Students" value={kpiValue(summary?.total_students)} helper="Trainer-scoped roster" icon={BookOpenCheck} tone="green" />
        <KPICard label="Active Students" value={kpiValue(summary?.active_students)} helper="Currently active learners" icon={CalendarClock} tone="blue" />
        <KPICard label="Average Skill Progress" value={kpiValue(summary?.average_progress, "%")} helper="Based on LMS lesson progress" icon={BarChart3} tone="purple" />
        <KPICard label="At-Risk Students" value={kpiValue(summary?.at_risk_students)} helper="No risk data available" icon={ShieldAlert} tone="red" />
        <KPICard label="Projects Completed" value={kpiValue(summary?.projects_completed)} helper="No project submissions yet" icon={FolderKanban} tone="orange" />
      </section>

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.025)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Search student"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-11 w-full rounded-lg border border-[#D0DFDA] bg-white pl-10 pr-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A]"
              />
            </div>
            <SlidersHorizontal className="h-4 w-4 text-[#64748B]" />
            <select value={batchFilter} onChange={(event) => setBatchFilter(event.target.value)} className="h-11 rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#0B7A5A]">
              <option value="All">All Batches</option>
              {batchOptions.map((batch) => (
                <option key={batch} value={batch}>{batch}</option>
              ))}
            </select>
            <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className="h-11 rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#0B7A5A]">
              <option value="All">All Courses</option>
              {courseOptions.map((course) => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
            <select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value)} className="h-11 rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#334155] outline-none focus:border-[#0B7A5A]">
              <option value="All">All Risk Statuses</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>
        </div>
      </section>

      {filteredStudents.length ? (
        <TrainerStudentsTable students={filteredStudents} onViewProfile={openProfile} />
      ) : (
        <TrainerStudentEmptyState />
      )}
    </div>
  )
}