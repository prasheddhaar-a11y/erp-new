"use client"

import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  GraduationCap,
  Globe,
  LayersIcon,
  LockKeyhole,
  RefreshCw,
  Users,
} from "lucide-react"
import Link from "next/link"

import { useTrainerLmsCourse } from "../hooks/useTrainerLmsCourse"
import { TrainerLessonList } from "./TrainerLessonList"
import { TrainerMaterialUploadPanel } from "./TrainerMaterialUploadPanel"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const s = status.toLowerCase()
  if (s === "published")
    return { label: "Published", bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" }
  if (s === "draft")
    return { label: "Draft", bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" }
  if (s === "archived")
    return { label: "Archived", bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" }
  return { label: status, bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" }
}

function difficultyBadge(level: string | null) {
  if (!level) return null
  const l = level.toLowerCase()
  if (l === "beginner")
    return { label: "Beginner", bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" }
  if (l === "intermediate")
    return { label: "Intermediate", bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" }
  if (l === "advanced")
    return { label: "Advanced", bg: "#F3EAFE", text: "#7C3AED", border: "#E8D8FB" }
  return { label: level, bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" }
}

function statVal(value: number | null | undefined) {
  if (value === null || value === undefined) return "—"
  return String(value)
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof BookOpen
  label: string
  value: string
  tone: "green" | "blue" | "orange" | "purple" | "slate"
}) {
  const palette = {
    green: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    blue: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    orange: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
    purple: { bg: "#F3EAFE", text: "#7C3AED", border: "#E8D8FB" },
    slate: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  } as const
  const p = palette[tone]

  return (
    <div
      className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5"
      style={{ backgroundColor: p.bg, borderColor: p.border }}
    >
      <Icon size={15} style={{ color: p.text }} />
      <div>
        <p className="text-xs font-black" style={{ color: p.text }}>
          {value}
        </p>
        <p className="text-[10px] font-semibold text-[#64748B]">{label}</p>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-gray-200" />
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
            <div className="flex gap-2">
              <div className="h-6 w-20 rounded-full bg-gray-200" />
              <div className="h-6 w-20 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 w-28 rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="h-80 rounded-lg border border-gray-200 bg-white" />
        <div className="h-80 rounded-lg border border-gray-200 bg-white" />
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
        <h3 className="text-lg font-black text-[#991B1B]">Failed to load course</h3>
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

// ─── Not-found state ──────────────────────────────────────────────────────────

function CourseNotFound() {
  return (
    <div className="grid min-h-[400px] place-items-center rounded-xl border border-dashed border-[#C8DDD7] bg-[#F8FAF8] p-6 text-center">
      <div className="max-w-sm space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
          <BookOpen size={22} />
        </div>
        <h3 className="text-base font-black text-[#0F172A]">Course not found</h3>
        <p className="text-sm font-semibold text-[#64748B]">
          This course is no longer available or you do not have access to it.
        </p>
        <Link
          href="/trainer/lms"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
        >
          <ArrowLeft size={13} />
          Back to LMS
        </Link>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TrainerLmsCourseDetailPage({ courseId }: { courseId: string }) {
  const {
    course,
    lessons,
    materials,
    loading,
    lessonsLoading,
    materialsLoading,
    statusUpdating,
    error,
    mutationError,
    uploadError,
    connected,
    uploadApiConnected,
    refresh,
    createLesson,
    editLesson,
    deleteLesson,
    updateCourseStatus,
    uploadMaterial,
  } = useTrainerLmsCourse(courseId)

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refresh} />
  if (!course) return <CourseNotFound />

  const status = statusBadge(course.status)
  const difficulty = difficultyBadge(course.difficulty_level)
  const unassignedCourseMaterials = materials.filter((material) => material.lesson_id === null)

  return (
    <div className="space-y-6">

      {/* ── Back nav ────────────────────────────────────────────────────── */}
      <Link
        href="/trainer/lms"
        className="inline-flex items-center gap-1.5 text-xs font-black text-[#64748B] transition hover:text-[#0B7A5A]"
      >
        <ArrowLeft size={13} />
        Back to LMS
      </Link>

      {/* ── Course header card ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-[#E3ECE8] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex flex-wrap items-start justify-between gap-4">

          {/* Left: title + meta */}
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full border px-2.5 py-0.5 text-xs font-black"
                style={{
                  backgroundColor: status.bg,
                  color: status.text,
                  borderColor: status.border,
                }}
              >
                {status.label}
              </span>

              {difficulty && (
                <span
                  className="rounded-full border px-2.5 py-0.5 text-xs font-black"
                  style={{
                    backgroundColor: difficulty.bg,
                    color: difficulty.text,
                    borderColor: difficulty.border,
                  }}
                >
                  {difficulty.label}
                </span>
              )}

              {course.display_code && (
                <span className="rounded-full border border-[#E3ECE8] bg-[#F8FAFC] px-2.5 py-0.5 text-xs font-bold text-[#64748B]">
                  {course.display_code}
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-[#020617] sm:text-3xl">
              {course.title}
            </h2>

            {course.description && (
              <p className="max-w-2xl text-sm font-semibold leading-relaxed text-[#475569]">
                {course.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 pt-1">
              {course.duration && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
                  <Clock size={12} className="text-[#94A3B8]" />
                  {course.duration}
                </span>
              )}
              {course.created_at && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B]">
                  <CheckCircle2 size={12} className="text-[#94A3B8]" />
                  Created {new Date(course.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Right: status toggle + refresh */}
          <div className="flex shrink-0 items-center gap-2">
            {connected && (
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() =>
                  updateCourseStatus({
                    status: course.status.toLowerCase() === "published" ? "draft" : "published",
                  })
                }
                className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-black transition outline-none disabled:opacity-60 ${
                  course.status.toLowerCase() === "published"
                    ? "border-[#FEDFC2] bg-[#FFF3E8] text-[#F97316] hover:border-[#F97316] hover:bg-[#FEE9D0]"
                    : "border-[#CFE8DF] bg-[#E8F6F0] text-[#0B7A5A] hover:border-[#0B7A5A] hover:bg-[#D4EFE5]"
                }`}
              >
                {statusUpdating ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                ) : course.status.toLowerCase() === "published" ? (
                  <LockKeyhole size={13} />
                ) : (
                  <Globe size={13} />
                )}
                <span>
                  {statusUpdating
                    ? "Updating…"
                    : course.status.toLowerCase() === "published"
                    ? "Unpublish"
                    : "Publish"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={refresh}
              disabled={statusUpdating}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-3.5 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none disabled:opacity-60"
            >
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Stat pills ─────────────────────────────────────────────────── */}
        <div className="mt-5 flex flex-wrap gap-3">
          <StatPill
            icon={LayersIcon}
            label="Lessons"
            value={statVal(course.lesson_count)}
            tone="green"
          />
          <StatPill
            icon={FileText}
            label="Materials"
            value={statVal(course.material_count)}
            tone="blue"
          />
          <StatPill
            icon={GraduationCap}
            label="Quizzes"
            value={statVal(course.quiz_count)}
            tone="purple"
          />
          <StatPill
            icon={Users}
            label="Enrolled"
            value={statVal(course.enrolled_students)}
            tone="orange"
          />
        </div>

        {/* Mutation error */}
        {mutationError && (
          <div className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-2.5 text-sm font-semibold text-[#B91C1C]">
            {mutationError}
          </div>
        )}
      </section>

      {/* ── Main grid: lesson list + materials ──────────────────────────── */}
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <TrainerLessonList
          course={course}
          lessons={lessons}
          loading={lessonsLoading}
          connected={connected}
          materials={materials}
          materialsLoading={materialsLoading}
          uploadApiConnected={uploadApiConnected}
          uploadMaterial={uploadMaterial}
          uploadError={uploadError}
          createLesson={createLesson}
          onEditLesson={editLesson}
          onDeleteLesson={deleteLesson}
        />

        <TrainerMaterialUploadPanel
          course={course}
          uploadApiConnected={uploadApiConnected}
          materials={unassignedCourseMaterials}
          materialsLoading={materialsLoading}
          uploadMaterial={uploadMaterial}
          uploadError={uploadError}
        />
      </section>
    </div>
  )
}
