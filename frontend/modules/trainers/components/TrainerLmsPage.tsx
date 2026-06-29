"use client"

import { BookOpen, Brain, ChevronRight, FileText, Plus, RefreshCw, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { useTrainerLms } from "../hooks/useTrainerLms"
import { createTrainerCourse } from "../services/trainerLmsService"
import { TrainerLmsEmptyState } from "./TrainerLmsEmptyState"
import type { TrainerLmsCourse } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function kpiValue(value: number | null | undefined, connected: boolean) {
  if (!connected) return "—"
  if (value === null || value === undefined) return "0"
  return String(value)
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  helper,
  tone,
  icon: Icon,
}: {
  label: string
  value: string
  helper: string
  tone: "green" | "blue" | "orange" | "purple"
  icon: typeof BookOpen
}) {
  const palette = {
    green: {
      gradient: "linear-gradient(135deg, #F0FAF6 0%, #E2F5EE 100%)",
      iconBg: "#0B7A5A",
      value: "#0B7A5A",
      border: "#C6E8D9",
      shadow: "rgba(11,122,90,0.10)",
    },
    blue: {
      gradient: "linear-gradient(135deg, #EEF4FF 0%, #E0ECFF 100%)",
      iconBg: "#2563EB",
      value: "#1D4ED8",
      border: "#BFCFEE",
      shadow: "rgba(37,99,235,0.10)",
    },
    orange: {
      gradient: "linear-gradient(135deg, #FFF7ED 0%, #FFF0DC 100%)",
      iconBg: "#F97316",
      value: "#C2410C",
      border: "#FDDCB8",
      shadow: "rgba(249,115,22,0.10)",
    },
    purple: {
      gradient: "linear-gradient(135deg, #F6F0FF 0%, #EDE4FF 100%)",
      iconBg: "#7C3AED",
      value: "#6D28D9",
      border: "#D8C8F8",
      shadow: "rgba(124,58,237,0.10)",
    },
  } as const
  const p = palette[tone]

  return (
    <div
      className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
      style={{
        background: p.gradient,
        borderColor: p.border,
        boxShadow: `0 2px 8px ${p.shadow}, 0 1px 2px rgba(0,0,0,0.04)`,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#64748B]">{label}</p>
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm"
          style={{ backgroundColor: p.iconBg }}
        >
          <Icon size={16} color="#FFFFFF" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight" style={{ color: p.value }}>
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-[#94A3B8]">{helper}</p>
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const styles =
    s === "published"
      ? { bg: "#E8F6F0", text: "#0B7A5A", border: "#B6DFCF", dot: "#0B7A5A" }
      : s === "archived"
      ? { bg: "#FFF3E8", text: "#C2410C", border: "#FDDCB8", dot: "#F97316" }
      : { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1", dot: "#94A3B8" }

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider"
      style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: styles.dot }}
      />
      {s.charAt(0).toUpperCase() + s.slice(1)}
    </span>
  )
}

// ─── Mini stat ────────────────────────────────────────────────────────────────

function MiniStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof BookOpen
  value: number | null
  label: string
  color: string
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-1 rounded-lg border border-[#E8EFF5] bg-[#F8FAFC] py-3 px-2">
      <Icon size={14} style={{ color }} />
      <p className="text-base font-black text-[#0F172A]">{value ?? "—"}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">{label}</p>
    </div>
  )
}

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: TrainerLmsCourse }) {
  const router = useRouter()

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-[#E3ECE8] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#A8D5BF] hover:shadow-[0_8px_28px_rgba(11,122,90,0.10)]"
      style={{ boxShadow: "0 2px 8px rgba(15,23,42,0.05), 0 1px 2px rgba(0,0,0,0.03)" }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full"
        style={{
          background:
            course.status.toLowerCase() === "published"
              ? "linear-gradient(90deg, #0B7A5A, #34D399)"
              : "linear-gradient(90deg, #94A3B8, #CBD5E1)",
        }}
      />

      <div className="p-6">
        {/* Header row */}
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={course.status} />
          {course.display_code && (
            <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-bold text-[#64748B]">
              {course.display_code}
            </span>
          )}
          {course.difficulty_level && (
            <span className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-bold text-[#64748B]">
              {course.difficulty_level}
            </span>
          )}
        </div>

        <h3 className="mt-3 text-xl font-black tracking-tight text-[#0F172A]">
          {course.title}
        </h3>

        {course.description && (
          <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-relaxed text-[#64748B]">
            {course.description}
          </p>
        )}

        {/* Mini stats */}
        <div className="mt-5 flex gap-2">
          <MiniStat icon={BookOpen} value={course.lesson_count} label="Lessons" color="#0B7A5A" />
          <MiniStat icon={FileText} value={course.material_count} label="Materials" color="#2563EB" />
          <MiniStat icon={Users} value={course.enrolled_students} label="Students" color="#F97316" />
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={() => router.push(`/trainer/lms/${course.id}`)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#CFE8DF] bg-[#F0FAF6] py-2.5 text-sm font-black text-[#0B7A5A] transition-all duration-150 hover:border-[#0B7A5A] hover:bg-[#E2F5EE] active:scale-[0.99]"
        >
          <span>Open Course</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-7 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-9 w-20 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
        </div>
        <div className="h-10 w-24 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[116px] rounded-xl border border-gray-100 bg-gray-50" />
        ))}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-64 rounded-xl border border-gray-100 bg-white" />
        ))}
      </div>
    </div>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[400px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
          <span className="text-2xl font-black">!</span>
        </div>
        <h3 className="text-lg font-black text-[#991B1B]">Failed to load LMS</h3>
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

// ─── Main component ───────────────────────────────────────────────────────────

function CreateCourseModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const [difficulty, setDifficulty] = useState<"Beginner" | "Intermediate" | "Advanced">("Beginner")
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      setError("Course title is required.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createTrainerCourse({
        title: cleanTitle,
        description: description.trim() || null,
        duration: duration.trim() || null,
        difficulty_level: difficulty,
        status,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create course.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/45 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl border border-[#DDE9E4] bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#0F172A]">Create Course</h3>
            <p className="mt-1 text-xs font-semibold text-[#64748B]">This course will belong only to your trainer account.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#E2E8F0] px-3 py-1.5 text-xs font-black text-[#475569]">Close</button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-black text-[#0F172A]">Course Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" placeholder="Example: Python Full Stack" />
          </label>

          <label className="block">
            <span className="text-xs font-black text-[#0F172A]">Description</span>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 py-2 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" placeholder="Short course description" />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-black text-[#0F172A]">Duration</span>
              <input value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]" placeholder="12 weeks" />
            </label>
            <label className="block">
              <span className="text-xs font-black text-[#0F172A]">Difficulty</span>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-black text-[#0F172A]">Status</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-1.5 h-11 w-full rounded-lg border border-[#D0DFDA] bg-white px-3 text-sm font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A] focus:ring-2 focus:ring-[#CFE8DF]">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </label>
          </div>

          {error ? <p className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B91C1C]">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className="inline-flex h-10 items-center justify-center rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#475569] disabled:opacity-60">Cancel</button>
          <button type="submit" disabled={saving} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-sm transition hover:bg-[#096747] disabled:opacity-60">
            <Plus size={14} />
            {saving ? "Creating..." : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  )
}

export function TrainerLmsPage() {
  const { courses, loading, error, data, refresh } = useTrainerLms()
  const [createOpen, setCreateOpen] = useState(false)

  const connected = data?.connected === true
  const summary = data?.summary

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refresh} />

  return (
    <div className="space-y-7">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">LMS</h2>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            Manage trainer-owned courses, lessons, and learning materials.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] outline-none transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
          >
            <Plus size={14} />
            <span>Create Course</span>
          </button>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] outline-none transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      {/* ── KPI cards ───────────────────────────────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard
          label="My Courses"
          value={kpiValue(summary?.total_courses, connected)}
          helper="Trainer-owned course count"
          tone="green"
          icon={BookOpen}
        />
        <KPICard
          label="Total Lessons"
          value={kpiValue(summary?.total_lessons, connected)}
          helper="Lessons from trainer courses"
          tone="blue"
          icon={FileText}
        />
        <KPICard
          label="Uploaded Materials"
          value={kpiValue(summary?.total_materials, connected)}
          helper="Saved PDF and video links"
          tone="orange"
          icon={FileText}
        />
        <KPICard
          label="Quiz / AI Tools"
          value={kpiValue(summary?.quiz_tools, connected)}
          helper="Saved quizzes and tests"
          tone="purple"
          icon={Brain}
        />
      </section>

      {/* ── Course grid ─────────────────────────────────────────────────── */}
      {!connected && courses.length === 0 ? (
        <TrainerLmsEmptyState message="No trainer-owned courses found." />
      ) : (
        <section>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8]">
            My Courses · {courses.length}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}
      {createOpen ? (
        <CreateCourseModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            void refresh()
          }}
        />
      ) : null}
    </div>
  )
}
