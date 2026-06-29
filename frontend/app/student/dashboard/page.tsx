/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Student Dashboard
Purpose     : Inner content for /student/dashboard.
              The portal shell (navbar, sidebar, layout)
              is provided by ../layout.tsx — this file
              renders only the scrollable page content.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
===================================================== */

import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Flame,
  Play,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react"
import { motion } from "framer-motion"
import Link from "next/link"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

import { getProfileInitials, type ProfileDropdownUser } from "@/components/profile/ProfileAvatarDropdown"
import { loadStudentDashboardData, type StudentDashboardData } from "./data"

/* =====================================================
   SECTION: CONSTANTS
===================================================== */

const brandGreen = "var(--pinesphere-green)"
const brandNavy  = "var(--pinesphere-navy)"

/* =====================================================
   SECTION: PROFILE HELPERS
===================================================== */

function readCachedProfile(): ProfileDropdownUser | null {
  if (typeof window === "undefined") return null
  const raw =
    window.localStorage.getItem("pinesphere_profile") ??
    window.sessionStorage.getItem("pinesphere_profile") ??
    window.localStorage.getItem("pinesphere_user") ??
    window.sessionStorage.getItem("pinesphere_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProfileDropdownUser
  } catch {
    return null
  }
}

/* =====================================================
   SECTION: HELPER COMPONENTS
===================================================== */

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

function MiniRing({
  value,
  color = brandGreen,
  label,
}: {
  value: number
  color?: string
  label?: string
}) {
  return (
    <div
      className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
      style={{ background: `conic-gradient(${color} ${value * 3.6}deg, #e5edf0 0deg)` }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white">
        <span className="text-sm font-black text-[#071129]">{label ?? `${value}%`}</span>
      </div>
    </div>
  )
}

function HeroMetric({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: LucideIcon
  value: string
  label: string
  color: string
}) {
  return (
    <div className="flex min-h-[64px] items-center gap-3 rounded-[14px] border border-white/55 bg-white/86 px-3 py-2 shadow-[0_8px_18px_rgba(15,23,42,0.08)] backdrop-blur">
      <span
        className="flex h-9 w-9 items-center justify-center rounded-[11px]"
        style={{ backgroundColor: `${color}16`, color }}
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-lg font-black text-[#071129]">{value}</p>
        <p className="text-[11px] font-bold leading-tight text-[#475569]">{label}</p>
      </div>
    </div>
  )
}

function QuickStat({
  icon: Icon,
  value,
  label,
  trend,
  color,
}: {
  icon: LucideIcon
  value: string
  label: string
  trend?: string
  color: string
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="h-[124px] rounded-[16px] border border-[#dfe8e5] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.055)]"
    >
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-[13px] text-white"
          style={{ backgroundColor: color }}
        >
          <Icon size={20} />
        </span>
        {trend ? (
          <span className="text-[11px] font-black text-[var(--pinesphere-green)]">{trend}</span>
        ) : null}
      </div>
      <p className="mt-3 text-2xl font-black text-[#071129]">{value}</p>
      <p className="text-sm font-semibold text-[#334155]">{label}</p>
    </motion.div>
  )
}

function priorityClass(priority: "High" | "Medium" | "Low") {
  if (priority === "High")   return "bg-[#fee2e2] text-[#dc2626]"
  if (priority === "Medium") return "bg-[#ffedd5] text-[#c2410c]"
  return "bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]"
}

/* =====================================================
   SECTION: PAGE COMPONENT
   PURPOSE:
   Renders dashboard content only — no shell.
   Shell is provided by frontend/app/student/layout.tsx.
===================================================== */

export default function StudentDashboardPage() {
  /* ── State ── */
  const [data, setData] = useState<StudentDashboardData | null>(null)
  const [profile, setProfile] = useState<ProfileDropdownUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /* ── Derived display values ── */
  const studentName = profile?.full_name?.trim() || ""
  const studentInitials = useMemo(
    () => getProfileInitials(studentName, profile?.email),
    [profile?.email, studentName],
  )

  /* ── Data + profile fetch ── */
  useEffect(() => {
    let alive = true
    
    // Read cached profile immediately
    queueMicrotask(() => {
      const cached = readCachedProfile()
      if (cached && alive) {
        setProfile(cached)
      }
    })

    // Load dashboard data
    loadStudentDashboardData()
      .then((result) => {
        if (alive) {
          setData(result)
          setError(null)
        }
      })
      .catch((err: unknown) => {
        if (alive) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data.")
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
      
    return () => { alive = false }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[54vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#dfe8e5] bg-white px-8 py-7 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
          <div
            className="h-9 w-9 animate-spin rounded-full border-4 border-[#dfe8e5]"
            style={{ borderTopColor: brandGreen }}
          />
          <p className="text-sm font-black text-[#071129]">Loading dashboard...</p>
          <p className="text-xs font-semibold text-[#64748b]">Fetching your latest student profile</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[54vh] items-center justify-center">
        <div className="max-w-md rounded-[18px] border border-[#fecaca] bg-white p-6 text-center shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
          <p className="text-sm font-black text-[#dc2626]">Failed to load dashboard</p>
          <p className="mt-1 text-xs font-semibold text-[#991b1b]">{error ?? "Dashboard data is unavailable."}</p>
        </div>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className="space-y-4 pb-5">

      {/* ── Hero banner ── */}
      <motion.section
        id="student-dashboard-top"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="scroll-mt-4 overflow-hidden rounded-[22px] border border-[var(--pinesphere-green-border)] bg-[var(--pinesphere-green)] shadow-[0_16px_36px_rgba(11,122,90,0.15)]"
      >
        <div
          className="grid min-h-[220px] gap-4 p-5 text-white lg:grid-cols-[minmax(0,1fr)_310px]"
          style={{ background: `linear-gradient(120deg, ${brandGreen} 0%, ${brandNavy} 122%)` }}
        >
          <div className="flex flex-col justify-center">
            <p className="text-sm font-black text-white/90">Welcome Back,</p>
            <h2 className="mt-1 text-4xl font-black leading-tight">
              {studentName || "Student"} <span className="inline-block origin-bottom animate-pulse">👋</span>
            </h2>
            <p className="mt-2 text-sm font-semibold text-white/90">
              Continue building your AI career today.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              <HeroMetric icon={Flame}         value={String(data.learningStreak)}        label="Day Streak"              color="#f97316" />
              <HeroMetric icon={CheckCircle2}  value={`${data.profileCompletion}%`}       label="Profile Complete"        color={brandGreen} />
              <HeroMetric icon={BookOpen}      value={String(data.enrolledCourseCount)}   label="Courses Enrolled"        color="#2563EB" />
              <HeroMetric icon={ClipboardList} value={String(data.assignmentsCompleted)}  label="Assignments Completed"   color="#ca8a04" />
            </div>
          </div>
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="absolute left-4 top-4 rounded-full border border-white/40 bg-white/18 px-3 py-2 text-xs font-black backdrop-blur">
              AI
            </div>
            <div className="absolute right-4 top-10 rounded-[14px] border border-white/35 bg-white/16 px-4 py-3 text-xs font-black backdrop-blur">
              ML
            </div>
            <div className="flex h-36 w-36 items-center justify-center rounded-full bg-white/18 text-white shadow-2xl backdrop-blur">
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-3xl font-black text-[var(--pinesphere-green)] shadow-xl">
                {studentInitials || "S"}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── Quick stats ── */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <QuickStat icon={BookOpen}      value={String(data.enrolledCourseCount)}        label="Enrolled Courses"      trend="View all"    color={brandGreen} />
        <QuickStat icon={Target}        value={`${data.glance.attendance}%`}            label="Attendance"            trend="This Month"  color="#2563EB" />
        <QuickStat icon={ClipboardList} value={String(data.glance.pendingTasks)}        label="Pending Assignments"   trend="View all"    color="#F59E0B" />
        <QuickStat icon={Award}         value={String(data.glance.certificatesEarned)}  label="Certificates Earned"   trend="View all"    color="#7C3AED" />
      </div>

      {/* ── Courses + Profile completion ── */}
      <div id="student-courses" className="scroll-mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card
          title="Continue Learning"
          action={
            <a href="#" className="text-xs font-black text-[var(--pinesphere-green)]">
              View all courses <ChevronRight className="inline" size={14} />
            </a>
          }
          bodyClassName="p-3"
        >
          <div className="grid gap-3 lg:grid-cols-3">
            {data.enrolledCourses.slice(0, 3).map((course) => (
              <motion.article
                key={course.id}
                whileHover={{ y: -4 }}
                className="overflow-hidden rounded-[16px] border border-[#dfe8e5] bg-white shadow-sm"
              >
                <div
                  className="relative h-24"
                  style={{ background: `linear-gradient(135deg, ${course.accent}, #111827)` }}
                >
                  <div className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/80">
                    AI
                  </div>
                  <span className="absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#071129] text-xs font-black text-white">
                    {course.progress}%
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-black">{course.title}</h3>
                  <p className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#475569]">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--pinesphere-green-light)] text-[9px] text-[var(--pinesphere-green)]">
                      {course.trainerInitials}
                    </span>
                    {course.trainer}
                  </p>
                  <div className="mt-3">
                    <ProgressBar value={course.progress} color={course.accent} />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold text-[#475569]">
                    <span>
                      {course.totalLessons > 0 ? course.totalLessons - course.remainingLessons : 0} / {course.totalLessons} Lessons
                    </span>
                    <span>{course.difficulty}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-bold text-[#475569]">
                    <Play size={12} /> Next: {course.nextClass}
                  </p>
                  <Link
                    href={`/student/lms/${course.id}`}
                    className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-[10px] border text-xs font-black transition hover:-translate-y-0.5"
                    style={{ borderColor: course.accent, color: course.accent }}
                  >
                    Continue Learning
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </Card>

        <div id="student-help" className="scroll-mt-4">
          <Card title="Profile Completion">
            <div className="flex items-center gap-4">
              <MiniRing value={data.profileCompletion} />
              <div className="min-w-0">
                <p className="text-sm font-black">Almost there!</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#64748b]">
                  Complete your profile to unlock all student features.
                </p>
              </div>
            </div>
            <Link
              href="/student/settings"
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-[12px] border border-[#cbd5e1] text-xs font-black"
            >
              Complete Profile <ChevronRight size={14} />
            </Link>
          </Card>
        </div>
      </div>

      {/* ── Assignments + Placement readiness ── */}
      <div id="student-assignments" className="scroll-mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card
          title="Assignments Due"
          action={<a href="#" className="text-xs font-black text-[#7C3AED]">View all</a>}
        >
          <div className="space-y-2">
            {data.assignmentsDue.slice(0, 5).map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-[#edf3f1] bg-[#fbfdfc] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{assignment.title}</p>
                  <p className="mt-1 text-xs font-semibold text-[#64748b]">
                    {assignment.course} · Due {assignment.due}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${priorityClass(assignment.priority)}`}
                >
                  {assignment.priority}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <div id="student-placement" className="scroll-mt-4">
          <Card title="Placement Readiness">
            <div className="grid grid-cols-2 gap-3">
              {[
                ["Resume Score",         data.placementReadiness.resumeScore,                                                                                        brandGreen],
                ["Interview Readiness",  data.placementReadiness.interviewReadiness,                                                                                 "#2563EB"],
                ["Project Completion",   Math.round((data.placementReadiness.projectsCompleted / data.placementReadiness.projectsRequired) * 100),                   "#F59E0B"],
                ["Placement Eligibility", data.placementReadiness.eligible ? 100 : 55,                                                                               "#7C3AED"],
              ].map(([label, value, color]) => (
                <div key={String(label)} className="rounded-[14px] border border-[#edf3f1] bg-[#fbfdfc] p-3">
                  <p className="text-[11px] font-bold text-[#64748b]">{label}</p>
                  <p className="mt-2 text-xl font-black">
                    {label === "Placement Eligibility"
                      ? data.placementReadiness.eligible ? "Eligible" : "Pending"
                      : `${value}%`}
                  </p>
                  <div className="mt-3">
                    <ProgressBar value={Number(value)} color={String(color)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Certificates ── */}
      <div id="student-certificates" className="scroll-mt-4">
        <Card
          title="Certificates"
          action={
            <a href="#" className="text-xs font-black text-[var(--pinesphere-green)]">
              View all
            </a>
          }
        >
          <div className="grid gap-3 md:grid-cols-2">
            {data.certificates.map((certificate) => (
              <div
                key={certificate.id}
                className="flex items-center justify-between gap-3 rounded-[14px] border border-[#edf3f1] bg-[#fbfdfc] p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-[#fef3c7] text-[#b45309]">
                    <Trophy size={19} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">{certificate.name}</p>
                    <p className="mt-1 text-xs font-semibold text-[#64748b]">
                      Issued {certificate.issueDate}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] bg-[#071129] px-3 text-xs font-black text-white"
                >
                  <Download size={14} />
                  Download
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  )
}
