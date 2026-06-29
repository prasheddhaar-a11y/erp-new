/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Student Attendance Page
Purpose     : Read-only attendance summary for the current student.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { apiRequest, getStoredSessionValue, storeSessionValue } from "@/lib/api"

type StudentProfile = {
  id?: string | null
  student_id?: string | null
  display_code?: string | null
  full_name?: string | null
  email?: string | null
}

type AttendanceSummary = {
  student_id: string
  total_sessions: number
  present: number
  late: number
  absent: number
  attendance_percentage: number
}

const brandGreen = "var(--pinesphere-green)"

function readCachedProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null

  const raw =
    window.localStorage.getItem("pinesphere_profile") ??
    window.sessionStorage.getItem("pinesphere_profile") ??
    window.localStorage.getItem("pinesphere_user") ??
    window.sessionStorage.getItem("pinesphere_user")

  if (!raw) return null

  try {
    return JSON.parse(raw) as StudentProfile
  } catch {
    return null
  }
}

function getStudentId(profile: StudentProfile | null): string | null {
  return profile?.student_id ?? profile?.id ?? profile?.display_code ?? null
}

function getAttendanceStatus(percentage: number) {
  if (percentage >= 85) {
    return {
      label: "Good Attendance",
      description: "You are maintaining a healthy attendance record.",
      color: brandGreen,
      bg: "#ecfdf5",
      border: "#bbf7d0",
      icon: CheckCircle2,
    }
  }

  if (percentage >= 75) {
    return {
      label: "Needs Improvement",
      description: "You are close to the minimum expected attendance range.",
      color: "#ca8a04",
      bg: "#fffbeb",
      border: "#fde68a",
      icon: TrendingUp,
    }
  }

  return {
    label: "Low Attendance Warning",
    description: "Your attendance is below the expected threshold.",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: AlertCircle,
  }
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, value))
}

function ProgressBar({ value, color = brandGreen }: { value: number; color?: string }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-[#e8eef2]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampPercent(value)}%` }}
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

function MetricCard({
  icon,
  label,
  value,
  color,
  delay,
}: {
  icon: ReactNode
  label: string
  value: string | number
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
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
          {icon}
        </span>
        <p className="text-xs font-bold uppercase text-[#64748b]">{label}</p>
      </div>
      <p className="text-2xl font-black text-[#071129]">{value}</p>
    </motion.div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[54vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#dfe8e5] bg-white px-8 py-7 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
        <Loader2 size={30} className="animate-spin" style={{ color: brandGreen }} />
        <p className="text-sm font-black text-[#071129]">Loading attendance...</p>
        <p className="text-xs font-semibold text-[#64748b]">Fetching your latest summary</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-[#fecaca]">
      <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
          <AlertCircle size={24} />
        </span>
        <div>
          <p className="text-sm font-black text-[#dc2626]">Failed to load attendance</p>
          <p className="mt-1 max-w-md text-xs font-semibold text-[#991b1b]">{message}</p>
        </div>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
          <CalendarCheck2 size={24} />
        </span>
        <div>
          <p className="text-sm font-black text-[#071129]">No attendance data</p>
          <p className="mt-1 max-w-md text-xs font-semibold text-[#64748b]">
            Attendance records will appear here after your trainer marks a session.
          </p>
        </div>
      </div>
    </Card>
  )
}

async function resolveCurrentStudentId(): Promise<string> {
  const cachedProfile = readCachedProfile()
  const cachedStudentId = getStudentId(cachedProfile)
  if (cachedStudentId) return cachedStudentId

  const accessToken = getStoredSessionValue("pinesphere_access_token")
  if (!accessToken) throw new Error("You are not signed in. Please log in again.")

  const freshProfile = await apiRequest<StudentProfile>("/profile/me", accessToken)
  const rememberMe = Boolean(window.localStorage.getItem("pinesphere_access_token"))
  storeSessionValue("pinesphere_profile", JSON.stringify(freshProfile), rememberMe)

  const freshStudentId = getStudentId(freshProfile)
  if (!freshStudentId) throw new Error("Student ID was not found in your profile.")

  return freshStudentId
}

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadAttendance() {
      try {
        const accessToken = getStoredSessionValue("pinesphere_access_token")
        if (!accessToken) throw new Error("You are not signed in. Please log in again.")

        const studentId = await resolveCurrentStudentId()
        const attendance = await apiRequest<AttendanceSummary>(
          `/attendance/students/${encodeURIComponent(studentId)}/summary`,
          accessToken,
        )

        if (!cancelled) {
          setSummary(attendance)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setSummary(null)
          setError(err instanceof Error ? err.message : "Failed to load attendance summary.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadAttendance()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingState />

  return (
    <div className="space-y-4 pb-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
      >
        <div
          className="relative flex min-h-36 flex-col justify-center px-5 py-6"
          style={{ background: `linear-gradient(135deg, ${brandGreen}, #111827)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%)]" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-white/75">Student Portal</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Attendance</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/78">
              Review your attendance summary across marked class sessions.
            </p>
          </div>
        </div>
      </motion.div>

      {error ? (
        <ErrorState message={error} />
      ) : !summary || summary.total_sessions <= 0 ? (
        <EmptyState />
      ) : (
        <AttendanceContent summary={summary} />
      )}
    </div>
  )
}

function AttendanceContent({ summary }: { summary: AttendanceSummary }) {
  const percentage = clampPercent(summary.attendance_percentage)
  const roundedPercentage = Math.round(percentage)
  const status = getAttendanceStatus(percentage)
  const StatusIcon = status.icon

  return (
    <div className="space-y-4">
      <Card className="border-[#8bd8c7] shadow-[0_18px_38px_rgba(0,135,103,0.13)]" bodyClassName="p-5">
        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center justify-center">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full"
              style={{ background: `conic-gradient(${status.color} ${percentage * 3.6}deg, #e8eef2 0deg)` }}
            >
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="text-3xl font-black text-[#071129]">{roundedPercentage}%</span>
                <span className="text-[11px] font-black uppercase tracking-wide text-[#64748b]">Attendance</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#64748b]">Overall Attendance</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-black"
                  style={{ backgroundColor: status.bg, borderColor: status.border, color: status.color }}
                >
                  <StatusIcon size={16} />
                  {status.label}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">{status.description}</p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#475569]">Attendance Progress</span>
                <span className="text-xs font-black" style={{ color: status.color }}>
                  {roundedPercentage}%
                </span>
              </div>
              <ProgressBar value={percentage} color={status.color} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard
          icon={<CalendarCheck2 size={18} style={{ color: "#2563eb" }} />}
          label="Total Sessions"
          value={summary.total_sessions}
          color="#2563eb"
          delay={0.05}
        />
        <MetricCard
          icon={<CheckCircle2 size={18} style={{ color: brandGreen }} />}
          label="Present"
          value={summary.present}
          color="#008767"
          delay={0.1}
        />
        <MetricCard
          icon={<Clock3 size={18} style={{ color: "#ca8a04" }} />}
          label="Late"
          value={summary.late}
          color="#ca8a04"
          delay={0.15}
        />
        <MetricCard
          icon={<XCircle size={18} style={{ color: "#dc2626" }} />}
          label="Absent"
          value={summary.absent}
          color="#dc2626"
          delay={0.2}
        />
      </div>

      <Card title="Attendance Breakdown" bodyClassName="p-4">
        <div className="space-y-3">
          <BreakdownRow label="Present" value={summary.present} total={summary.total_sessions} color={brandGreen} />
          <BreakdownRow label="Late" value={summary.late} total={summary.total_sessions} color="#ca8a04" />
          <BreakdownRow label="Absent" value={summary.absent} total={summary.total_sessions} color="#dc2626" />
        </div>
      </Card>
    </div>
  )
}

function BreakdownRow({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="grid gap-2 rounded-xl border border-[#edf3f1] bg-[#f8fafc] p-3 sm:grid-cols-[140px_minmax(0,1fr)_80px] sm:items-center">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-black text-[#071129]">{label}</span>
      </div>
      <ProgressBar value={percent} color={color} />
      <p className="text-left text-sm font-black text-[#64748b] sm:text-right">
        {value} ({percent}%)
      </p>
    </div>
  )
}
