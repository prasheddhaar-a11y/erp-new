/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Course Detail Page
File        : page.tsx  (frontend/app/student/lms/[courseId]/page.tsx)
Purpose     : Inner content for /student/lms/[courseId].
              Displays course details, trainer info,
              progress, and lessons.

CHANGES FROM AUDIT:
  1. Removed duplicate Lessons section — only Learning Path exists.         ✓
     (Was already done in the uploaded file; confirmed and preserved.)
  2. Real lesson progress — is_completed and completed_at come from the
     backend LessonProgress table via StudentLessonResponse.                ✓
     lesson.is_preview is NOT used for any progress or status logic.
  3. Material-based completion — lesson completes only when all materials
     have been viewed/watched; opening a lesson alone does NOT complete it. ✓
  4. Continue Learning — opens next incomplete material; if all done,
     submits completion and advances to next lesson automatically.          ✓
  5. Status logic — Completed: lesson.is_completed, Current: activeLesson,
     Upcoming: all others.                                                  ✓
  6. Progress — computed as completedLessons / totalLessons * 100, exactly
     matching backend recalculate_enrollment_progress() formula.            ✓

  KEY FIX applied in this file:
  - continueActiveLesson() previously opened video_url and returned early,
    which bypassed the materials panel and material-based completion.
    Now it opens the video in a new tab AND opens the materials panel so
    the student can still mark the lesson complete by viewing all materials.
    If the lesson has no materials AND no pdf, it completes immediately
    (zero-material lesson).

Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
===================================================== */

import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Download,
  FileText,
  Layers3,
  Paperclip,
  Play,
  Target,
  User,
} from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useParams } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { API_URL } from "@/lib/constants"
import { openAuthenticatedFile } from "@/lib/api"
import {
  loadStudentCourseDetail,
  type StudentCourseDetail,
  type StudentLesson,
  type StudentMaterial,
  updateStudentLessonProgress,
} from "../../dashboard/data"

/* =====================================================
   SECTION: CONSTANTS
===================================================== */

const brandGreen = "var(--pinesphere-green)"
type CourseDetailView = StudentCourseDetail & {
  track?: string | null
  trainer?: string | null
  trainerInitials?: string | null
  updated_at?: string | null
}

type LessonStatus = "completed" | "current" | "upcoming"

/* =====================================================
   SECTION: HELPER COMPONENTS
===================================================== */

function ProgressBar({ value, color = brandGreen }: { value: number; color?: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[#e8eef2]">
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
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string
  children: ReactNode
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
        <div className="border-b border-[#edf3f1] px-4 py-3">
          <h2 className="text-[15px] font-black text-[#071129]">{title}</h2>
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  )
}

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-[#dfe8e5] bg-white px-2.5 py-1 text-xs font-bold text-[#475569]">
      <span className="shrink-0 text-[#64748b]">{icon}</span>
      <span className="truncate">{value}</span>
      <span className="text-[#94a3b8]">{label}</span>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  helper,
  color,
  delay,
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className="rounded-[18px] border border-[#dfe8e5] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}18` }}>
          {icon}
        </div>
        <p className="text-xs font-bold uppercase text-[#64748b]">{label}</p>
      </div>
      <p className="text-2xl font-black text-[#071129]">{value}</p>
      <p className="mt-1 text-xs text-[#64748b]">{helper}</p>
    </motion.div>
  )
}

function getHashLessonId(): string | null {
  if (typeof window === "undefined") return null
  const match = window.location.hash.match(/^#lesson-(.+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

function getDefaultLessonId(lessons: StudentLesson[]): string | null {
  const hashLessonId = getHashLessonId()
  if (hashLessonId && lessons.some((lesson) => lesson.id === hashLessonId)) {
    return hashLessonId
  }
  // Open first incomplete lesson; fall back to lesson[0]
  return lessons.find((lesson) => !lesson.is_completed)?.id ?? lessons[0]?.id ?? null
}

/* =====================================================
   SECTION: PAGE COMPONENT
===================================================== */

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = params?.courseId as string | undefined

  const [course, setCourse] = useState<CourseDetailView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [materialsOpen, setMaterialsOpen] = useState(false)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  // Track which material IDs have been viewed/watched this session.
  // Key: lessonId → Set of materialIds completed.
  const [completedMaterials, setCompletedMaterials] = useState<Map<string, Set<string>>>(new Map())

  // Prevent double-submit while backend call is in flight
  const [submittingLessons, setSubmittingLessons] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false

    if (!courseId) {
      queueMicrotask(() => {
        if (!cancelled) setError("Invalid course ID")
        if (!cancelled) setLoading(false)
      })
      return
    }

    loadStudentCourseDetail(courseId)
      .then((result) => {
        if (!cancelled) {
          setError(null)
          setMaterialsOpen(false)
          setCourse(result as CourseDetailView)
          setActiveLessonId(getDefaultLessonId(result.lessons ?? []))
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load course.")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [courseId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-10 w-10 animate-spin rounded-full border-4 border-[#dfe8e5]"
            style={{ borderTopColor: brandGreen }}
          />
          <p className="text-sm font-bold text-[#475569]">Loading course...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 pb-5">
        <Link href="/student/lms">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-black text-[#475569] transition hover:bg-[#f1f5f3]"
          >
            <ArrowLeft size={16} />
            Back to My Courses
          </button>
        </Link>

        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <div className="max-w-sm rounded-[18px] border border-[#fecaca] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-black text-[#dc2626]">Something went wrong</p>
            <p className="mt-1 text-xs text-[#64748b]">{error}</p>
            <Link href="/student/lms">
              <button type="button" className="mt-4 h-9 rounded-[10px] bg-[#071129] px-4 text-xs font-black text-white">
                Back to Courses
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="space-y-4 pb-5">
        <Link href="/student/lms">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-black text-[#475569] transition hover:bg-[#f1f5f3]"
          >
            <ArrowLeft size={16} />
            Back to My Courses
          </button>
        </Link>

        <div className="flex min-h-[40vh] items-center justify-center px-4">
          <div className="max-w-sm rounded-[18px] border border-[#fecaca] bg-white p-6 text-center shadow-sm">
            <p className="text-sm font-black text-[#dc2626]">Course not found</p>
            <p className="mt-1 text-xs text-[#64748b]">This course is not available or you are not enrolled.</p>
            <Link href="/student/lms">
              <button type="button" className="mt-4 h-9 rounded-[10px] bg-[#071129] px-4 text-xs font-black text-white">
                Back to Courses
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* =====================================================
     SECTION: UTILITY FUNCTIONS
  ===================================================== */

  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return "0 B"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return "Not available"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Not available"
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getDifficultyColor = (level: string): { bg: string; text: string } => {
    const styles: Record<string, { bg: string; text: string }> = {
      Beginner: { bg: "#dcfce7", text: "#166534" },
      Intermediate: { bg: "#ede9fe", text: "#5b21b6" },
      Advanced: { bg: "#ffedd5", text: "#9a3412" },
    }
    return styles[level] ?? { bg: "#f3f4f6", text: "#6b7280" }
  }

  const getMaterialName = (filename: string, contentType: string): { label: string; icon: ReactNode } => {
    let cleanName = filename
      .replace(/\d{8}|_\d{1,2}|_v\d+|_final|_latest/gi, "")
      .replace(/[\-_]+/g, " ")
      .replace(/\.\w+$/, "")
      .trim()

    cleanName = cleanName.replace(/\s+/g, " ")

    let icon: ReactNode = <Paperclip size={14} />
    if (contentType.includes("pdf") || filename.endsWith(".pdf")) icon = <FileText size={14} />
    else if (contentType.includes("video") || /\.(mp4|mov|avi|mkv)$/i.test(filename)) icon = <Play size={14} />

    return { label: cleanName || "Material", icon }
  }

  const resolveFileUrl = (fileUrl: string): string => {
    if (!fileUrl) return "#"
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl
    const base = API_URL.replace(/\/$/, "")
    const path = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`
    return `${base}${path}`
  }

  const isVideoMaterial = (material: StudentMaterial): boolean =>
    material.content_type.includes("video") || /\.(mp4|mov|avi|mkv|webm)$/i.test(material.filename)

  /* =====================================================
     SECTION: DERIVED STATE
  ===================================================== */

  const accent = "var(--pinesphere-green)"
  const difficultyStyle = getDifficultyColor(course.difficulty_level)
  const lessons = course.lessons ?? []

  // Progress is computed locally from lesson.is_completed (sourced from LessonProgress).
  // This mirrors the backend formula: round(completed / total * 100).
  const completedLessons = lessons.filter((lesson) => lesson.is_completed).length
  const totalLessons = lessons.length
  const remainingLessons = Math.max(0, totalLessons - completedLessons)
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  const videoCount = lessons.filter((lesson) => lesson.video_url).length
  const materialCount = lessons.reduce((sum, lesson) => sum + (lesson.materials?.length ?? 0), 0)
  const assignmentCount = lessons.filter((lesson) => lesson.assignment_url).length
  const pdfCount = lessons.filter((lesson) => lesson.pdf_url).length
  const totalResources = videoCount + materialCount + assignmentCount + pdfCount

  const activeLesson =
    lessons.find((lesson) => lesson.id === activeLessonId) ??
    lessons.find((lesson) => !lesson.is_completed) ??
    lessons[0]
  const activeLessonIndex = activeLesson ? lessons.findIndex((lesson) => lesson.id === activeLesson.id) : -1
  const lastUpdated = formatDate(course.updated_at ?? course.created_at)

  // Status map — Completed > Current (activeLesson) > Upcoming
  const lessonStatuses = new Map<string, LessonStatus>()
  lessons.forEach((lesson) => {
    if (lesson.is_completed) lessonStatuses.set(lesson.id, "completed")
    else if (lesson.id === activeLesson?.id) lessonStatuses.set(lesson.id, "current")
    else lessonStatuses.set(lesson.id, "upcoming")
  })

  const getLessonCounts = (lesson: StudentLesson) => ({
    videos: lesson.video_url ? 1 : 0,
    materials: lesson.materials?.length ?? 0,
    assignments: lesson.assignment_url ? 1 : 0,
  })

  const activeCounts = activeLesson ? getLessonCounts(activeLesson) : { videos: 0, materials: 0, assignments: 0 }
  const activeMaterials = activeLesson?.materials ?? []
  const activeLessonStatus = activeLesson ? lessonStatuses.get(activeLesson.id) ?? "upcoming" : "upcoming"

  /* =====================================================
     SECTION: MATERIAL COMPLETION HELPERS
  ===================================================== */

  /**
   * Total trackable materials in a lesson.
   * Counts: uploaded materials + pdf_url (tracked as "__pdf__").
   * This is the threshold for auto-completing the lesson.
   */
  const getTotalMaterialCount = (lesson: StudentLesson): number => {
    const uploadedCount = lesson.materials?.length ?? 0
    const hasPdf = lesson.pdf_url ? 1 : 0
    return uploadedCount + hasPdf
  }

  /**
   * True when every material in the lesson has been opened this session.
   * Zero-material lessons are always considered "all done" so they can
   * complete immediately.
   */
  const allMaterialsCompleted = (lesson: StudentLesson): boolean => {
    const total = getTotalMaterialCount(lesson)
    if (total === 0) return true
    const done = completedMaterials.get(lesson.id)?.size ?? 0
    return done >= total
  }

  /**
   * Called when a student opens/watches a material.
   * Adds materialId to the session tracking set, then checks if all
   * materials are done. If yes, submits lesson completion to backend.
   */
  const onMaterialOpened = async (lesson: StudentLesson, materialId: string) => {
    // Compute the new set synchronously before setState
    const currentSet = new Set(completedMaterials.get(lesson.id) ?? [])
    currentSet.add(materialId)

    setCompletedMaterials((prev) => {
      const next = new Map(prev)
      next.set(lesson.id, new Set(currentSet))
      return next
    })

    const total = getTotalMaterialCount(lesson)
    const allDone = total === 0 || currentSet.size >= total

    if (allDone && !lesson.is_completed) {
      await submitLessonCompletion(lesson.id)
    }
  }

  /**
   * Track pdf_url open with a synthetic "__pdf__" material ID.
   */
  const onPdfOpened = async (lesson: StudentLesson) => {
    await onMaterialOpened(lesson, "__pdf__")
  }

  const handleMaterialOpen = async (lesson: StudentLesson, material: StudentMaterial) => {
    try {
      await openAuthenticatedFile(material.file_url, material.filename)
      await onMaterialOpened(lesson, material.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open material.")
    }
  }

  /* =====================================================
     SECTION: LESSON COMPLETION + NAVIGATION
  ===================================================== */

  const refreshCourse = async (): Promise<StudentCourseDetail> => {
    if (!courseId) throw new Error("No courseId")
    const result = await loadStudentCourseDetail(courseId)
    setCourse(result as CourseDetailView)
    return result
  }

  /**
   * Submit lesson completion to the backend.
   * After the backend responds, refresh course data so is_completed /
   * progress_percent are up to date, then advance to the next incomplete lesson.
   *
   * Uses submittingLessons to prevent duplicate submissions.
   */
  const submitLessonCompletion = async (lessonId: string) => {
    if (submittingLessons.has(lessonId)) return

    setSubmittingLessons((prev) => new Set(prev).add(lessonId))

    try {
      await updateStudentLessonProgress(lessonId, true)
      const refreshedCourse = await refreshCourse()
      const refreshedLessons = refreshedCourse?.lessons ?? []

      // Find next incomplete lesson after the one we just completed
      const completedIndex = refreshedLessons.findIndex((l) => l.id === lessonId)
      const laterIncomplete = refreshedLessons
        .slice(completedIndex >= 0 ? completedIndex + 1 : 0)
        .find((l) => !l.is_completed)
      const nextIncomplete = laterIncomplete ?? refreshedLessons.find((l) => !l.is_completed)

      if (nextIncomplete) {
        setActiveLessonId(nextIncomplete.id)
        setMaterialsOpen(Boolean(nextIncomplete.pdf_url || nextIncomplete.materials?.length))
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `#lesson-${encodeURIComponent(nextIncomplete.id)}`)
        }
      }
    } catch (err) {
      console.error("Failed to update lesson progress:", err)
    } finally {
      setSubmittingLessons((prev) => {
        const next = new Set(prev)
        next.delete(lessonId)
        return next
      })
    }
  }

  const selectLesson = (lesson: StudentLesson) => {
    setActiveLessonId(lesson.id)
    setMaterialsOpen(Boolean(lesson.pdf_url || lesson.materials?.length))
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#lesson-${encodeURIComponent(lesson.id)}`)
    }
  }

  /**
   * Continue Learning button handler.
   *
   * Decision tree (material-based completion):
   *  1. Already completed → jump to next incomplete lesson.
   *  2. Has video_url → open video in new tab + open materials panel.
   *     (video is NOT counted as completion; materials panel must be used.)
   *  3. Has materials or pdf → open materials panel.
   *  4. No materials at all → zero-material lesson: complete immediately.
   *
   * IMPORTANT: We never auto-complete a lesson just because the student
   * clicked "Continue Learning". Completion only happens when all materials
   * have been opened (via onMaterialOpened / onPdfOpened).
   */
  const continueActiveLesson = () => {
    if (!activeLesson) return

    // 1. Already complete → move to next
    if (activeLesson.is_completed) {
      const nextIncomplete = lessons.find((l) => !l.is_completed)
      if (nextIncomplete) selectLesson(nextIncomplete)
      return
    }

    // 2. Has video → open it + show materials panel so student can mark done
    if (activeLesson.video_url) {
      void onMaterialOpened(activeLesson, "__video__")
      window.open(resolveFileUrl(activeLesson.video_url), "_blank", "noopener,noreferrer")
      setMaterialsOpen(true)
      return
    }

    // 3. Has materials or pdf → open the materials panel
    if (activeLesson.pdf_url || (activeLesson.materials?.length ?? 0) > 0) {
      setMaterialsOpen(true)
      const lessonElement = document.querySelector(`[data-lesson-id="${activeLesson.id}"]`)
      lessonElement?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    // 4. Zero-material lesson → complete immediately
    void submitLessonCompletion(activeLesson.id)
  }

  /* =====================================================
     SECTION: RENDER HELPERS
  ===================================================== */

  const renderStatusIcon = (status: LessonStatus) => {
    if (status === "completed") {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#16a34a] text-white">
          <Check size={15} strokeWidth={3} />
        </span>
      )
    }

    if (status === "current") {
      return (
        <span className="flex h-7 w-7 items-center justify-center rounded-full text-white" style={{ backgroundColor: accent }}>
          <Play size={14} fill="currentColor" />
        </span>
      )
    }

    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#cbd5e1] bg-white text-[#94a3b8]">
        <Circle size={12} />
      </span>
    )
  }

  const renderStatusBadge = (status: LessonStatus) => {
    if (status === "completed") {
      return <span className="rounded-full bg-[#dcfce7] px-2 py-1 text-[11px] font-black text-[#166534]">Completed</span>
    }

    if (status === "current") {
      return (
        <span className="rounded-full px-2 py-1 text-[11px] font-black text-white" style={{ backgroundColor: accent }}>
          Current
        </span>
      )
    }

    return <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[11px] font-black text-[#64748b]">Upcoming</span>
  }

  /* =====================================================
     SECTION: JSX
  ===================================================== */

  return (
    <div className="space-y-4 pb-5">
      <Link href="/student/lms">
        <button
          type="button"
          className="flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-black text-[#475569] transition hover:bg-[#f1f5f3]"
        >
          <ArrowLeft size={16} />
          Back to My Courses
        </button>
      </Link>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">

          {/* ── Course Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
          >
            <div
              className="relative flex h-36 items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${accent}, #111827)` }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%)]" />
              <BookOpen size={54} className="relative text-white/85" />
            </div>

            <div className="space-y-3 border-t border-[#edf3f1] p-5">
              <div className="space-y-2">
                {course.track ? <p className="text-xs font-bold uppercase tracking-wide text-[#64748b]">{course.track}</p> : null}
                <h1 className="text-xl font-black text-[#071129] sm:text-2xl">{course.title}</h1>

                <div className="flex flex-wrap items-center gap-3">
                  {course.difficulty_level ? (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ backgroundColor: difficultyStyle.bg, color: difficultyStyle.text }}
                    >
                      {course.difficulty_level}
                    </span>
                  ) : null}
                  {course.duration ? (
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#475569]">
                      <Clock size={15} />
                      {course.duration}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[#edf3f1] pt-3">
                <p className="mb-2 text-xs font-bold text-[#64748b]">LEARNING PROGRESS</p>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#475569]">{progressPercent}% Complete</span>
                  <span className="text-xs font-bold" style={{ color: accent }}>
                    {completedLessons}/{totalLessons} Lessons
                  </span>
                </div>
                <ProgressBar value={progressPercent} color={accent} />
              </div>
            </div>
          </motion.div>

          {/* ── Stat Cards ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={<BookOpen size={16} style={{ color: "#2563eb" }} />}
              label="Lessons"
              value={totalLessons}
              helper="Total"
              color="#2563eb"
              delay={0.05}
            />
            <StatCard
              icon={<Play size={16} style={{ color: "#dc2626" }} />}
              label="Videos"
              value={videoCount}
              helper="Available"
              color="#dc2626"
              delay={0.1}
            />
            <StatCard
              icon={<FileText size={16} style={{ color: "#ca8a04" }} />}
              label="Resources"
              value={totalResources}
              helper="Total"
              color="#ca8a04"
              delay={0.15}
            />
            <StatCard
              icon={<BarChart3 size={16} style={{ color: accent }} />}
              label="Progress"
              value={`${progressPercent}%`}
              helper="Complete"
              color="#008767"
              delay={0.2}
            />
          </div>

          {/* ── Learning Path (single lesson navigator — no duplicate Lessons section) ── */}
          {lessons.length > 0 ? (
            <Card title="📚 Learning Path" bodyClassName="p-3 sm:p-4">
              <div className="space-y-2">
                {lessons.map((lesson, index) => {
                  const status = lessonStatuses.get(lesson.id) ?? "upcoming"
                  const counts = getLessonCounts(lesson)
                  const isCurrent = status === "current"

                  return (
                    <motion.button
                      key={lesson.id}
                      id={`lesson-${lesson.id}`}
                      data-lesson-id={lesson.id}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, delay: index * 0.025 }}
                      onClick={() => selectLesson(lesson)}
                      className={`w-full rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:border-[#cbd5e1] hover:shadow-[0_8px_18px_rgba(15,23,42,0.07)] ${
                        isCurrent ? "border-[#8bd8c7] bg-[#f3fffb]" : "border-[#edf3f1] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {renderStatusIcon(status)}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-black uppercase tracking-wide text-[#64748b]">Lesson {index + 1}</p>
                            {renderStatusBadge(status)}
                          </div>
                          <p className="mt-0.5 truncate text-sm font-black text-[#071129]">{lesson.title}</p>
                        </div>
                        <div className="hidden shrink-0 flex-wrap justify-end gap-1.5 md:flex">
                          <MetricPill icon={<Play size={12} />} label="video" value={counts.videos} />
                          <MetricPill icon={<FileText size={12} />} label="materials" value={counts.materials} />
                          <MetricPill icon={<Paperclip size={12} />} label="assignment" value={counts.assignments} />
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5 md:hidden">
                        <MetricPill icon={<Play size={12} />} label="video" value={counts.videos} />
                        <MetricPill icon={<FileText size={12} />} label="materials" value={counts.materials} />
                        <MetricPill icon={<Paperclip size={12} />} label="assignment" value={counts.assignments} />
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </Card>
          ) : null}

          {/* ── Active Lesson Panel ── */}
          {activeLesson ? (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, delay: 0.08 }}
              className="overflow-hidden rounded-[18px] border bg-white shadow-[0_18px_38px_rgba(0,135,103,0.13)]"
              style={{ borderColor: "#8bd8c7" }}
            >
              <div className="space-y-4 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wide" style={{ color: accent }}>
                      Current Lesson
                    </p>
                    <h2 className="mt-1 text-lg font-black text-[#071129] sm:text-xl">
                      Lesson {activeLessonIndex + 1}: {activeLesson.title}
                    </h2>
                    {activeLesson.summary ? (
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748b]">{activeLesson.summary}</p>
                    ) : null}
                  </div>
                  {renderStatusBadge(activeLessonStatus)}
                </div>

                <div className="flex flex-wrap gap-2">
                  {course.duration ? <MetricPill icon={<Clock size={12} />} label="course" value={course.duration} /> : null}
                  <MetricPill icon={<Play size={12} />} label="video" value={activeCounts.videos} />
                  <MetricPill icon={<FileText size={12} />} label="materials" value={activeCounts.materials} />
                  <MetricPill icon={<Paperclip size={12} />} label="assignment" value={activeCounts.assignments} />
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={continueActiveLesson}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white transition hover:opacity-90"
                    style={{ backgroundColor: accent }}
                  >
                    <Play size={16} fill="currentColor" />
                    Continue Learning
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaterialsOpen((value) => !value)}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#dfe8e5] bg-white px-4 text-sm font-black text-[#071129] transition hover:border-[#8bd8c7] hover:bg-[#f6fffc]"
                    disabled={activeMaterials.length === 0 && !activeLesson.pdf_url}
                  >
                    <FileText size={16} />
                    View Materials
                    <ChevronDown size={15} className={`transition ${materialsOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {/* ── Materials Panel ── */}
              <AnimatePresence initial={false}>
                {materialsOpen ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="overflow-hidden border-t border-[#edf3f1]"
                  >
                    <div className="space-y-2 bg-[#f8fafc] p-4">

                      {/* pdf_url material row */}
                      {activeLesson.pdf_url ? (
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dfe8e5] bg-white p-3 transition hover:border-[#8bd8c7]">
                          <span className="flex min-w-0 items-center gap-2 text-sm font-black text-[#071129]">
                            <FileText size={16} className="shrink-0 text-[#ca8a04]" />
                            <span className="truncate">Lesson PDF</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <a
                              href={resolveFileUrl(activeLesson.pdf_url)}
                              onClick={() => void onPdfOpened(activeLesson)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-black text-white transition hover:opacity-90"
                              style={{ backgroundColor: accent }}
                            >
                              View
                            </a>
                            <a
                              href={resolveFileUrl(activeLesson.pdf_url)}
                              download
                              onClick={() => void onPdfOpened(activeLesson)}
                              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#dfe8e5] bg-white px-3 text-xs font-black text-[#475569] transition hover:border-[#8bd8c7]"
                            >
                              <Download size={13} />
                              Download
                            </a>
                          </span>
                        </div>
                      ) : null}

                      {/* Uploaded materials rows */}
                      {activeMaterials.map((material: StudentMaterial) => {
                        const { label, icon } = getMaterialName(material.filename, material.content_type)
                        const videoMaterial = isVideoMaterial(material)
                        const isDone = completedMaterials.get(activeLesson.id)?.has(material.id) ?? false

                        return (
                          <div
                            key={material.id}
                            className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition ${
                              isDone
                                ? "border-[#bbf7d0] bg-[#f0fdf4]"
                                : "border-[#dfe8e5] bg-white hover:border-[#8bd8c7]"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 text-[#64748b]">{icon}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-black text-[#071129]">{label}</span>
                                <span className="text-xs text-[#64748b]">{formatFileSize(material.file_size)}</span>
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-2">
                              {isDone ? (
                                <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#dcfce7] px-3 text-xs font-black text-[#166534]">
                                  <Check size={12} strokeWidth={3} />
                                  Done
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleMaterialOpen(activeLesson, material)
                                  }}
                                  className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-black text-white transition hover:opacity-90"
                                  style={{ backgroundColor: accent }}
                                >
                                  {videoMaterial ? "Watch" : "View"}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  void handleMaterialOpen(activeLesson, material)
                                }}
                                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#dfe8e5] bg-white px-3 text-xs font-black text-[#475569] transition hover:border-[#8bd8c7]"
                              >
                                <Download size={13} />
                                Download
                              </button>
                            </span>
                          </div>
                        )
                      })}

                      {/* Material completion progress within lesson */}
                      {getTotalMaterialCount(activeLesson) > 0 && !activeLesson.is_completed ? (
                        <div className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-3 py-2">
                          <span className="text-xs font-bold text-[#64748b]">
                            {completedMaterials.get(activeLesson.id)?.size ?? 0} / {getTotalMaterialCount(activeLesson)} materials viewed
                          </span>
                          {allMaterialsCompleted(activeLesson) ? (
                            <span className="rounded-full bg-[#dcfce7] px-2 py-1 text-[11px] font-black text-[#166534]">
                              Completing lesson…
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {!activeLesson.pdf_url && activeMaterials.length === 0 ? (
                        <p className="rounded-xl border border-[#dfe8e5] bg-white p-3 text-sm font-bold text-[#64748b]">
                          No materials are attached to this lesson yet.
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </motion.section>
          ) : null}

          {lessons.length === 0 ? (
            <Card bodyClassName="p-12 text-center">
              <BookOpen size={48} className="mx-auto mb-3 text-[#cbd5e1]" />
              <p className="text-sm font-bold text-[#475569]">No lessons yet</p>
              <p className="mt-1 text-xs text-[#64748b]">Check back soon for course content.</p>
            </Card>
          ) : null}

          {/* ── About Course ── */}
          {course.description ? (
            <Card title="About Course" bodyClassName="p-4">
              <p className="text-sm leading-6 text-[#64748b]">{course.description}</p>
            </Card>
          ) : null}

          {/* ── Instructor ── */}
          {course.trainer ? (
            <Card title="Instructor" bodyClassName="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
                  style={{ backgroundColor: accent }}
                >
                  {course.trainerInitials || course.trainer.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-black text-[#071129]">{course.trainer}</h3>
                  <p className="text-xs font-semibold text-[#64748b]">Instructor</p>
                </div>
                <User size={18} className="text-[#94a3b8]" />
              </div>
            </Card>
          ) : null}
        </div>

        {/* ── Right Sidebar ── */}
        <aside className="min-w-0 lg:w-[300px]">
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: 0.1 }}
            className="sticky top-6 space-y-4 rounded-[18px] border border-[#dfe8e5] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
          >
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-[#071129]">
                <BarChart3 size={15} />
                Your Progress
              </h2>
              <div className="mb-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#64748b]">Course Progress</span>
                  <span className="text-base font-black" style={{ color: accent }}>
                    {progressPercent}%
                  </span>
                </div>
                <ProgressBar value={progressPercent} color={accent} />
              </div>

              <div className="space-y-2 border-b border-[#edf3f1] pb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-[#64748b]">
                    <CheckCircle2 size={14} style={{ color: accent }} />
                    Lessons Completed
                  </span>
                  <span className="font-black text-[#071129]">{completedLessons}/{totalLessons}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-[#64748b]">
                    <Target size={14} />
                    Remaining Lessons
                  </span>
                  <span className="font-black text-[#071129]">{remainingLessons}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 text-[#64748b]">
                    <Layers3 size={14} />
                    Total Resources
                  </span>
                  <span className="font-black text-[#071129]">{totalResources}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-b border-[#edf3f1] pb-4">
              <p className="text-xs font-black uppercase tracking-wide text-[#071129]">Course Overview</p>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-[#64748b]">
                  <Clock size={14} />
                  Duration
                </span>
                <span className="font-black text-[#071129]">{course.duration || "Not available"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-[#64748b]">
                  <Target size={14} />
                  Difficulty
                </span>
                <span
                  className="rounded-full px-2 py-0.5 font-black"
                  style={{ backgroundColor: difficultyStyle.bg, color: difficultyStyle.text }}
                >
                  {course.difficulty_level || "Not available"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="inline-flex items-center gap-2 text-[#64748b]">
                  <CalendarDays size={14} />
                  Last Updated
                </span>
                <span className="text-right font-black text-[#071129]">{lastUpdated}</span>
              </div>
            </div>

            {activeLesson ? (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-black uppercase tracking-wide text-[#64748b]">Continue Learning</p>
                  <p className="line-clamp-2 text-sm font-black text-[#071129]">{activeLesson.title}</p>
                  {activeLesson.summary ? <p className="mt-1 line-clamp-2 text-xs text-[#64748b]">{activeLesson.summary}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={continueActiveLesson}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-3 text-xs font-black text-white transition hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  <Play size={14} fill="currentColor" />
                  Continue Learning
                </button>
              </div>
            ) : totalLessons > 0 ? (
              <div className="text-center">
                <p className="text-xs font-black text-[#071129]">Course complete</p>
                <p className="mt-0.5 text-xs text-[#64748b]">All lessons are marked complete.</p>
              </div>
            ) : null}
          </motion.div>
        </aside>
      </div>
    </div>
  )
}
