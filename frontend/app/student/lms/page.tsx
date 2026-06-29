/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : My Courses (LMS)
Purpose     : Inner content for /student/lms.
              The portal shell (navbar, sidebar, layout)
              is provided by ../layout.tsx — this file
              renders only the scrollable LMS content.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
===================================================== */

import { Award, BookOpen, ChevronRight, Play } from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { apiRequest, getStoredSessionValue } from "@/lib/api"

/* =====================================================
   SECTION: CONSTANTS
===================================================== */

const brandGreen      = "var(--pinesphere-green)"
const brandGreenLight = "var(--pinesphere-green-light)"

type StudentLmsCourseListItem = {
  id: string
  title: string
  description: string
  duration: string | null
  difficulty_level: string
  status: string
  trainer: string | null
  trainer_initials: string | null
  total_lessons: number
  completed_lessons: number
  progress_percent: number
  material_count: number
  video_count: number
}

type StudentCourse = {
  id: string
  title: string
  track: string | null
  trainer: string | null
  trainerInitials: string | null
  progress: number
  completedLessons: number
  totalLessons: number
  nextClass: string | null
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  accent: string
  materialCount: number
  videoCount: number
}

const studentLmsCoursesEndpoint = "/lms/student/courses"

function normalizeDifficulty(value: string): StudentCourse["difficulty"] {
  if (value === "Intermediate" || value === "Advanced") return value
  return "Beginner"
}

function mapCourse(item: StudentLmsCourseListItem): StudentCourse {
  return {
    id: item.id,
    title: item.title,
    track: item.duration,
    trainer: item.trainer,
    trainerInitials: item.trainer_initials,
    progress: item.progress_percent,
    completedLessons: item.completed_lessons,
    totalLessons: item.total_lessons,
    nextClass: null,
    difficulty: normalizeDifficulty(item.difficulty_level),
    accent: brandGreen,
    materialCount: item.material_count,
    videoCount: item.video_count,
  }
}

async function loadStudentLmsCourses(): Promise<StudentCourse[]> {
  const accessToken = getStoredSessionValue("pinesphere_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  const courses = await apiRequest<StudentLmsCourseListItem[]>(
    studentLmsCoursesEndpoint,
    accessToken,
  )

  return courses.map(mapCourse)
}

/* =====================================================
   SECTION: HELPER COMPONENTS
===================================================== */

function ProgressBar({ value, color = brandGreen }: { value: number; color?: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#e8eef2]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

function Card({
  title,
  children,
  action,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${className}`}
    >
      {title ? (
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#edf3f1] px-4 py-3">
          <h2 className="text-[15px] font-black text-[#071129]">{title}</h2>
          {action}
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  )
}

/* =====================================================
   SECTION: COURSE CARD
===================================================== */

function CourseCard({ course }: { course: StudentCourse }) {
  const difficultyStyle: Record<string, string> = {
    Beginner:     "bg-[#dcfce7] text-[#166534]",
    Intermediate: "bg-[#ede9fe] text-[#5b21b6]",
    Advanced:     "bg-[#ffedd5] text-[#9a3412]",
  }

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="overflow-hidden rounded-[16px] border border-[#dfe8e5] bg-white shadow-sm"
    >
      {/* Accent banner */}
      <div
        className="relative h-24"
        style={{ background: `linear-gradient(135deg, ${course.accent}, #111827)` }}
      >
        <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/80">
          AI
        </div>

        {/* Progress badge */}
        <span className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#071129] text-xs font-black text-white">
          {course.progress}%
        </span>

        {/* Status and Difficulty badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {/* Status badge */}
          <span className="rounded-full px-2 py-0.5 text-[10px] font-black inline-block w-fit"
            style={{
              backgroundColor: course.progress === 100 ? '#dcfce7' : course.progress === 0 ? '#fef3c7' : '#dbeafe',
              color: course.progress === 100 ? '#166534' : course.progress === 0 ? '#92400e' : '#0c4a6e'
            }}
          >
            {course.progress === 100 ? 'Completed' : course.progress === 0 ? 'Not Started' : 'In Progress'}
          </span>
          
          {/* Difficulty badge */}
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-black ${difficultyStyle[course.difficulty] ?? "bg-gray-100 text-gray-700"}`}
          >
            {course.difficulty}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <h3 className="truncate text-sm font-black text-[#071129]">{course.title}</h3>

        {course.track && (
          <p className="mt-0.5 text-[11px] font-semibold text-[#64748b]">{course.track}</p>
        )}

        {course.trainer && (
          <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#475569]">
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px]"
              style={{ backgroundColor: brandGreenLight, color: brandGreen }}
            >
              {course.trainerInitials}
            </span>
            {course.trainer}
          </p>
        )}

        <div className="mt-3">
          <ProgressBar value={course.progress} color={course.accent} />
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#475569]">
          <span>
            {course.completedLessons} / {course.totalLessons} Lessons
          </span>
          <span className="font-black" style={{ color: course.accent }}>
            {course.progress}%
          </span>
        </div>

        {course.nextClass && (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#475569]">
            <Play size={12} />
            Next: {course.nextClass}
          </p>
        )}

        <Link href={`/student/lms/${course.id}`}>
          <button
            type="button"
            className="mt-3 h-9 w-full rounded-[10px] border text-xs font-black transition hover:-translate-y-0.5"
            style={{ borderColor: course.accent, color: course.accent }}
          >
            Continue Learning
          </button>
        </Link>
      </div>
    </motion.article>
  )
}

/* =====================================================
   SECTION: PAGE COMPONENT
   PURPOSE:
   Renders LMS content only — no shell.
   Shell is provided by frontend/app/student/layout.tsx.
===================================================== */

export default function StudentLmsPage() {
  /* ── State ── */
  const [courses, setCourses] = useState<StudentCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  /* ── Data fetch — reuses same dashboard API ── */
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loadStudentLmsCourses()
      .then((result) => { if (!cancelled) setCourses(result) })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load courses.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [])

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-[#dfe8e5]"
            style={{ borderTopColor: brandGreen }}
          />
          <p className="text-sm font-bold text-[#475569]">Loading your courses…</p>
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-sm rounded-[18px] border border-[#fecaca] bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-black text-[#dc2626]">Something went wrong</p>
          <p className="mt-1 text-xs text-[#64748b]">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 h-9 rounded-[10px] bg-[#071129] px-4 text-xs font-black text-white"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }


  /* ── Render ── */
  return (
    <div className="space-y-6 pb-5">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-[13px]"
            style={{ backgroundColor: brandGreenLight }}
          >
            <BookOpen size={20} style={{ color: brandGreen }} />
          </span>
          <div>
            <h1 className="text-xl font-black text-[#071129]">My Courses</h1>
            <p className="text-xs font-semibold text-[#64748b]">
              {courses.length} enrolled course{courses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Continue Learning Section - only show if there are in-progress courses */}
      {courses.some(c => c.progress > 0 && c.progress < 100) && (
        <>
          <Card
            title="Continue Learning"
            action={
              <span className="flex items-center gap-1 text-xs font-black" style={{ color: brandGreen }}>
                Recent <ChevronRight size={14} />
              </span>
            }
            bodyClassName="p-3"
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses
                .filter(c => c.progress > 0 && c.progress < 100)
                .slice(0, 3)
                .map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
            </div>
          </Card>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[#e8eef2] via-[#dfe8e5] to-[#e8eef2]" />
        </>
      )}

      {/* Empty state */}
      {courses.length === 0 ? (
        <Card bodyClassName="p-10">
          <div className="flex flex-col items-center gap-3 text-center">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: brandGreenLight }}
            >
              <Award size={28} style={{ color: brandGreen }} />
            </span>
            <p className="text-sm font-black text-[#071129]">No enrolled courses found.</p>
            <p className="text-xs font-semibold text-[#64748b]">
              Contact your coordinator to get enrolled in a course.
            </p>
          </div>
        </Card>
      ) : (
        /* Course grid */
        <Card
          title="Enrolled Courses"
          action={
            <span
              className="flex items-center gap-1 text-xs font-black"
              style={{ color: brandGreen }}
            >
              {courses.length} Course{courses.length !== 1 ? "s" : ""}
              <ChevronRight size={14} />
            </span>
          }
          bodyClassName="p-3"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </Card>
      )}

    </div>
  )
}
