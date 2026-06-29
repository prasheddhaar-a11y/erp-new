"use client"

import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  TestTube2,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"

import { getStoredSession } from "@/app/shared/auth"
import { ChartCard, LineChart } from "@/components/role-dashboard"
import { useTrainerDashboard } from "@/modules/trainers/hooks/useTrainerDashboard"
import type { TrainerDashboardV1Response, TrainerDashboardResponse } from "@/modules/trainers/types"

/**
 * True when the backend returned the structured v1 shape.
 * Discriminated by the presence of 'attendance_summary' which is unique to v1.
 * The legacy shape uses 'attendance' (a flat object with rate/present/total).
 */
function isV1(data: TrainerDashboardV1Response | TrainerDashboardResponse): data is TrainerDashboardV1Response {
  return (
    data !== null &&
    typeof data === "object" &&
    "attendance_summary" in data
  )
}

/* ─── Local sub-components ───────────────────────────────────────────────── */

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string
  value: string
  helper: string
  tone: "green" | "blue" | "purple" | "orange" | "red"
}) {
  const palette = {
    green: { bg: "#E8F6F0", text: "#0B7A5A", border: "#CFE8DF" },
    blue: { bg: "#EAF1FF", text: "#2563EB", border: "#D7E4FF" },
    purple: { bg: "#F3EAFE", text: "#7C3AED", border: "#E8D8FB" },
    orange: { bg: "#FFF3E8", text: "#F97316", border: "#FEDFC2" },
    red: { bg: "#FFF0F0", text: "#EF4444", border: "#FBD1D1" },
  } as const
  const p = palette[tone]

  return (
    <div
      className="min-h-[100px] rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]"
      style={{ borderColor: p.border }}
    >
      <h3 className="truncate text-sm font-black text-[#0F172A]">{label}</h3>
      <p className="mt-2 text-2xl font-black text-[#020617]">{value}</p>
      <p className="mt-1.5 text-xs font-semibold leading-5 text-[#475569]">{helper}</p>
      <div className="mt-2 h-1 w-8 rounded-full" style={{ backgroundColor: p.text }} />
    </div>
  )
}

function QuickActionGrid({
  title,
  actions,
}: {
  title: string
  actions: Array<{ label: string; href: string }>
}) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <p className="mb-3 text-sm font-black text-[#0F172A]">{title}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {actions.map((action) => (
          <a
            key={action.label}
            href={action.href}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] px-2 py-3 text-center text-xs font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] hover:text-[#0B7A5A]"
          >
            {action.label}
          </a>
        ))}
      </div>
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-4 w-96 rounded bg-gray-200" />
        </div>
        <div className="h-12 w-48 rounded bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-28 rounded-lg border border-gray-200 bg-white" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1.05fr]">
        <div className="h-80 rounded-lg border border-gray-200 bg-white animate-pulse" />
        <div className="h-80 rounded-lg border border-gray-200 bg-white animate-pulse" />
        <div className="h-80 rounded-lg border border-gray-200 bg-white animate-pulse" />
      </div>
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isAuthError =
    message.toLowerCase().includes("401") ||
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("log in")
  const isPermissionError =
    message.toLowerCase().includes("403") ||
    message.toLowerCase().includes("permission") ||
    message.toLowerCase().includes("insufficient")

  const displayMessage = isAuthError
    ? "Your session has expired. Please log in again."
    : isPermissionError
    ? "You do not have permission to access the Trainer Dashboard. Please contact your administrator."
    : message

  return (
    <div className="grid min-h-[400px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
          <span className="text-2xl font-black">{isPermissionError ? "🔒" : "!"}</span>
        </div>
        <h3 className="text-lg font-black text-[#991B1B]">
          {isPermissionError ? "Access Denied" : isAuthError ? "Session Expired" : "Failed to load dashboard"}
        </h3>
        <p className="text-sm font-semibold text-[#B91C1C]">{displayMessage}</p>
        {!isPermissionError && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#DC2626]"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function TrainerDashboardPage() {
  const { data, loading, error, refresh } = useTrainerDashboard()
  const [userName] = useState(() => {
    if (typeof window === "undefined") return "Anitha Trainer"
    const session = getStoredSession()
    return session?.user?.full_name || "Anitha Trainer"
  })

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

  const metrics = useMemo(() => {
    if (!data) return []

    if (isV1(data)) {
      // ─── v1 shape ─────────────────────────────────────────────────────────
      const m = data.metrics
      return [
        {
          key: "batches",
          label: "Total Batches",
          value: m.total_batches != null ? String(m.total_batches) : "—",
          helper: m.total_batches != null ? `${m.total_batches} active batch(es)` : "No batches assigned yet",
          tone: "green" as const,
        },
        {
          key: "students",
          label: "Total Students",
          value: String(m.total_students),
          helper: m.total_students > 0 ? "Students in assigned courses" : "No students enrolled yet",
          tone: "blue" as const,
        },
        {
          key: "classes",
          label: "Classes Today",
          // classes_today is an int (0 = no sessions today, null = data unavailable)
          value: m.classes_today != null ? String(m.classes_today) : "—",
          helper:
            m.classes_today === 0
              ? "No sessions scheduled today"
              : m.classes_today != null
              ? `${m.classes_today} session(s) scheduled today`
              : "No session data available",
          tone: "orange" as const,
        },
        {
          key: "attendance",
          label: "Attendance Today",
          value: m.attendance_today != null ? `${m.attendance_today}%` : "—",
          helper: m.attendance_today != null ? `${m.attendance_today}% attendance today` : "No attendance data yet",
          tone: "purple" as const,
        },
        {
          key: "tasks",
          label: "Pending Tasks",
          value: m.pending_tasks != null ? String(m.pending_tasks) : "—",
          helper: m.pending_tasks ? "Open trainer tasks" : "No pending tasks",
          tone: "green" as const,
        },
      ]
    }

    // ─── Legacy shape ──────────────────────────────────────────────────────
    const studentMetric = (data as TrainerDashboardResponse).metrics.find(
      (m) => m.key === "enrollments" || m.key === "students"
    )
    const attendanceMetric = (data as TrainerDashboardResponse).metrics.find((m) => m.key === "attendance")

    const studentsValue = studentMetric ? studentMetric.value : "0"
    const studentsHelper =
      Number(studentsValue) > 0
        ? "Students in assigned courses"
        : "No assigned students yet"

    const attendanceValue = attendanceMetric ? attendanceMetric.value : "0%"
    const attendanceHelper = attendanceMetric
      ? attendanceMetric.helper
      : "No attendance data available"

    return [
      {
        key: "batches",
        label: "Total Batches",
        value: "0",
        helper: "No assigned batches yet",
        tone: "green" as const,
      },
      {
        key: "students",
        label: "Total Students",
        value: studentsValue,
        helper: studentsHelper,
        tone: "blue" as const,
      },
      {
        key: "classes",
        label: "Classes Today",
        value: "0",
        helper: "No sessions scheduled today",
        tone: "orange" as const,
      },
      {
        key: "attendance",
        label: "Attendance Today",
        value: attendanceValue,
        helper: attendanceHelper,
        tone: "purple" as const,
      },
      {
        key: "tasks",
        label: "Pending Tasks",
        value: "0",
        helper: "No pending tasks",
        tone: "green" as const,
      },
    ]
  }, [data])

  const chartSeries = useMemo(() => {
    if (!data) return []
    if (isV1(data)) {
      return data.attendance_summary.weekly_series.map((s) => ({
        label: s.label,
        current: s.rate,
      }))
    }
    if (!(data as TrainerDashboardResponse).attendance?.series) return []
    return (data as TrainerDashboardResponse).attendance.series.map((s) => ({
      label: s.label,
      current: s.rate,
    }))
  }, [data])

  /** Today’s attendance sessions (v1 only). Empty array = no sessions today. */
  const todayClasses = useMemo(() => {
    if (!data || !isV1(data)) return null // null = data not available (legacy or no data)
    return data.today_classes // [] = real zero sessions
  }, [data])

  const assignedBatches = useMemo(() => {
    if (!data || !isV1(data)) return []
    return data.assigned_batches
  }, [data])

  const recentAssignments = useMemo(() => {
    if (!data || !isV1(data)) return []
    return data.recent_assignments
  }, [data])

  const recentTests = useMemo(() => {
    if (!data || !isV1(data)) return []
    return data.recent_test_results
  }, [data])

  const pendingTasks = useMemo(() => {
    if (!data || !isV1(data)) return []
    return data.pending_tasks
  }, [data])

  const quickActions = [
    { label: "Mark Attendance", href: "/trainer/attendance" },
    { label: "Create Assignment", href: "/trainer/assignments" },
    { label: "Create Test", href: "/trainer/tests" },
    { label: "Upload Material", href: "/trainer/lms" },
    { label: "View Calendar", href: "/trainer/calendar" },
  ]

  if (loading) {
    return <DashboardSkeleton />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  return (
    <div className="space-y-5">
      {/* Welcome header */}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
            Welcome back, {userName}!
          </h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">
            Here&apos;s an overview of your classes and activities today.
          </p>
        </div>
        <div className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#0F172A] shadow-sm">
          <CalendarDays size={17} className="text-[#0B7A5A]" />
          {today}
        </div>
      </section>

      {/* Metric cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            helper={metric.helper}
            tone={metric.tone}
          />
        ))}
      </section>


      {/* Row 1: Today's classes | Attendance chart | My batches */}
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1.05fr]">
        {/* Today's Classes */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">Today&apos;s Classes</p>
            {todayClasses === null ? (
              <span className="text-xs font-semibold text-[#64748B]">Schedule API pending</span>
            ) : (
              <span className="text-xs font-semibold text-[#0B7A5A]">{todayClasses.length} session(s)</span>
            )}
          </div>
          {todayClasses === null || todayClasses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <CalendarDays size={28} className="text-[#94A3B8] mb-2" />
              <p className="text-xs font-bold text-[#64748B]">
                {todayClasses === null
                  ? "No class schedule data available."
                  : "No sessions scheduled for today."}
              </p>
              <p className="text-[10px] font-semibold text-[#94A3B8] mt-0.5">
                {todayClasses === null
                  ? "Classes Today connects via Attendance Sessions."
                  : "Sessions will appear here once created."}
              </p>
            </div>
          ) : (
            <ul className="flex-1 space-y-2 overflow-y-auto">
              {todayClasses.map((cls) => (
                <li
                  key={cls.id}
                  className="flex items-center justify-between rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[#0F172A]">{cls.title}</p>
                    <p className="text-[10px] font-semibold text-[#64748B]">
                      {cls.total_records} student(s)
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
                      cls.attendance_rate != null
                        ? "bg-[#E8F6F0] text-[#0B7A5A]"
                        : "bg-[#F1F5F9] text-[#64748B]"
                    }`}
                  >
                    {cls.attendance_rate != null ? `${cls.attendance_rate}%` : "Pending"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Live Attendance Overview Chart */}
        <ChartCard
          title="Attendance Overview (This Week)"
          href="/trainer/attendance"
          linkLabel="View report"
        >
          <LineChart data={chartSeries} suffix="%" />
        </ChartCard>

        {/* My Batches */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">My Batches</p>
            <span className="text-xs font-semibold text-[#0B7A5A]">{assignedBatches.length} batch(es)</span>
          </div>
          {assignedBatches.length ? (
            <ul className="flex-1 space-y-2 overflow-y-auto">
              {assignedBatches.map((batch) => (
                <li key={batch.id} className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-[#0F172A]">{batch.title}</p>
                    <span className="shrink-0 text-[10px] font-black text-[#0B7A5A]">{batch.student_count} students</span>
                  </div>
                  <p className="mt-1 truncate text-[10px] font-semibold text-[#64748B]">
                    {batch.course || "Course unavailable"} - {batch.status}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <Users size={28} className="text-[#0B7A5A] mb-2" />
              <p className="text-xs font-bold text-[#64748B]">No assigned batches yet.</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#94A3B8]">Batches appear after students are enrolled in your courses.</p>
            </div>
          )}
        </section>
      </section>

      {/* Row 2: Assignments | Test results | Pending tasks */}
      <section className="grid gap-4 xl:grid-cols-3">
        {/* Recent Assignments */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">Recent Assignments</p>
            <span className="text-xs font-semibold text-[#0B7A5A]">{recentAssignments.length} item(s)</span>
          </div>
          {recentAssignments.length ? (
            <ul className="flex-1 space-y-2 overflow-y-auto">
              {recentAssignments.map((assignment) => (
                <li key={assignment.id} className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] px-3 py-2.5">
                  <p className="truncate text-xs font-black text-[#0F172A]">{assignment.title}</p>
                  <p className="mt-1 text-[10px] font-semibold text-[#64748B]">
                    Due: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString("en-IN") : "No due date"} - {assignment.max_marks} marks
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <ClipboardList size={28} className="text-[#0B7A5A] mb-2" />
              <p className="text-xs font-bold text-[#64748B]">No assignments yet.</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#94A3B8]">Assignment lessons from your courses will appear here.</p>
            </div>
          )}
        </section>

        {/* Recent Test Results */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">Recent Test Results</p>
            <span className="text-xs font-semibold text-[#0B7A5A]">{recentTests.length} quiz(es)</span>
          </div>
          {recentTests.length ? (
            <ul className="flex-1 space-y-2 overflow-y-auto">
              {recentTests.map((test) => (
                <li key={test.id} className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] px-3 py-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-xs font-black text-[#0F172A]">{test.title}</p>
                    <span className="shrink-0 text-[10px] font-black text-[#7C3AED]">{test.status}</span>
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-[#64748B]">
                    {test.total_marks} marks - pass {test.passing_score}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
              <TestTube2 size={28} className="text-[#0B7A5A] mb-2" />
              <p className="text-xs font-bold text-[#64748B]">No quiz records yet.</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#94A3B8]">Quizzes from your courses will appear here.</p>
            </div>
          )}
        </section>

        {/* Pending Tasks placeholder */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">Pending Tasks</p>
            <span className="text-xs font-semibold text-[#64748B]">Tasks API pending</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <CheckSquare size={28} className="text-[#94A3B8] mb-2" />
            <p className="text-xs font-bold text-[#64748B]">No pending tasks found.</p>
            <p className="text-[10px] font-semibold text-[#94A3B8] mt-0.5">Tasks will connect in Phase 6.</p>
          </div>
        </section>
      </section>

      {/* Row 3: Course progress | Quick actions */}
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        {/* Course progress placeholder */}
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between min-h-[200px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-[#0F172A]">Course Progress Overview</p>
            <span className="text-xs font-semibold text-[#0B7A5A]">Phase 5</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
            <BookOpen size={28} className="text-[#0B7A5A] mb-2" />
            <p className="text-xs font-bold text-[#64748B]">Trainer LMS will be connected in Phase 5.</p>
          </div>
        </section>

        {/* Quick Actions Grid */}
        <QuickActionGrid title="Quick Actions" actions={quickActions} />
      </section>
    </div>
  )
}
