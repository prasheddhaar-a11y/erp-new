"use client"

import {
  AlertTriangle,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileDown,
  RotateCcw,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { getAttendanceDefaulters, getAttendanceRecords } from "@/lib/api/branchAdmin"
import { resolveBranchScope } from "@/lib/api/branchAdminData"
import {
  fetchBranchAttendance,
  getMockBranchAttendance,
  mockBranchAttendance,
  type AttendanceAlert,
  type BranchAttendanceDashboard,
type TrainerCompliance,
} from "@/lib/api/branchAdminAttendance"

function withFallbackArray<T>(items: T[] | undefined, fallback: T[]) {
  return items?.length ? items : fallback
}

function normalizeAttendanceData(response: Partial<BranchAttendanceDashboard>, fallback: BranchAttendanceDashboard): BranchAttendanceDashboard {
  return {
    branch_id: response.branch_id ?? fallback.branch_id,
    kpis: {
      ...fallback.kpis,
      ...response.kpis,
    },
    trend: withFallbackArray(response.trend, fallback.trend),
    batches: withFallbackArray(response.batches, fallback.batches),
    trainers: withFallbackArray(response.trainers, fallback.trainers),
    alerts: withFallbackArray(response.alerts, fallback.alerts),
    risk_students: withFallbackArray(response.risk_students, fallback.risk_students),
    heatmap: withFallbackArray(response.heatmap, fallback.heatmap),
    activity: withFallbackArray(response.activity, fallback.activity),
  }
}

export function BranchAdminAttendancePage() {
  const session = useMemo(() => readBranchAdminSession(), [])
  const branch = useMemo(() => session?.branch ?? resolveBranchScope(), [session])
  const scopedMockAttendance = useMemo(() => getMockBranchAttendance(branch), [branch])
  const [data, setData] = useState<BranchAttendanceDashboard>(() => scopedMockAttendance)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [records, setRecords] = useState<Array<Record<string, unknown>>>([])
  const [recordsOpen, setRecordsOpen] = useState(false)
  const [defaulters, setDefaulters] = useState<BranchAttendanceDashboard["risk_students"]>([])
  const [defaultersOpen, setDefaultersOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState("")
  const [toast, setToast] = useState("")
  const recordsRef = useRef<HTMLDivElement | null>(null)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  useEffect(() => {
    let cancelled = false
    if (!session) {
      setLoading(false)
      return
    }

    fetchBranchAttendance()
      .then((response) => {
        if (!cancelled) {
          setData(normalizeAttendanceData({ ...response, branch_id: response.branch_id || branch.branch_id }, scopedMockAttendance))
          setError("")
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setData({ ...scopedMockAttendance, branch_id: branch.branch_id })
          setError(`Live API unavailable: ${err.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [branch, scopedMockAttendance, session])

  const trendData = data.trend ?? []
  const batchData = data.batches ?? []
  const trainerData = data.trainers ?? []
  const alertData = data.alerts ?? []
  const riskStudentData = data.risk_students ?? []
  const heatmapData = data.heatmap ?? []
  const activityData = data.activity ?? []
  const maxTrend = Math.max(...trendData.map((item) => item.rate), 100)
  const minTrend = Math.min(...trendData.map((item) => item.rate), 0)
  const averageBatch = Math.round(batchData.reduce((sum, item) => sum + item.attendance_rate, 0) / Math.max(batchData.length, 1))

  const kpis = [
    { label: "Today's Attendance %", value: `${data.kpis.today_attendance_rate}%`, helper: "+2.4% vs yesterday", icon: CalendarCheck2, tone: "green" },
    { label: "Present Students", value: data.kpis.present_students, helper: "Marked present", icon: UserCheck, tone: "blue" },
    { label: "Absent Students", value: data.kpis.absent_students, helper: "Needs follow-up", icon: UserX, tone: "red" },
    { label: "Late Check-ins", value: data.kpis.late_checkins, helper: "After grace window", icon: Clock3, tone: "orange" },
    { label: "Attendance Compliance", value: `${data.kpis.attendance_compliance}%`, helper: "Trainer submissions", icon: CheckCircle2, tone: "purple" },
  ]

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Attendance Dashboard</h2>
          <p className="mt-1 text-sm font-semibold text-[#475569]">Monitor batch attendance, trainer compliance, and student risk for {branch.branch_name}.</p>
        </div>
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-3 py-2 text-xs font-black text-[#0B7A5A] shadow-sm">
          {branch.branch_name}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>

      {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <CompactTrendChart data={trendData} min={minTrend} max={maxTrend} />
        <BatchPerformance batches={batchData} average={averageBatch} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <TrainerComplianceTable trainers={trainerData} loading={loading} />
        <AttendanceAlerts alerts={alertData} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <RiskStudentsTable students={riskStudentData} />
        <AttendanceHeatmap heatmap={heatmapData} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <QuickActions loading={actionLoading} onView={async () => {
          setActionLoading("View Attendance")
          try {
            const rows = await getAttendanceRecords()
            setRecords(rows)
            setRecordsOpen(true)
            window.setTimeout(() => recordsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
            showToast("Attendance records loaded.")
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Live API unavailable")
          } finally {
            setActionLoading("")
          }
        }} onExport={async (monthly) => {
          setActionLoading(monthly ? "Download Monthly Report" : "Export Report")
          try {
            const rows = records.length ? records : await getAttendanceRecords()
            if (!rows.length) {
              showToast("No attendance data to export.")
              return
            }
            downloadCsv(monthly ? "attendance_monthly_report.csv" : "branch_attendance.csv", ["Student", "Session", "Status", "Marked At", "Method"], rows.map((row) => [
              String(row.student ?? ""),
              String(row.session ?? ""),
              String(row.status ?? ""),
              String(row.marked_at ?? ""),
              String(row.method ?? ""),
            ]))
            showToast("Export downloaded successfully.")
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Live API unavailable")
          } finally {
            setActionLoading("")
          }
        }} onDefaulters={async () => {
          setActionLoading("Review Defaulters")
          try {
            const rows = await getAttendanceDefaulters()
            setDefaulters(rows.filter((row) => row.attendance_rate < 75))
            setDefaultersOpen(true)
            showToast("Defaulters loaded.")
          } catch (err) {
            showToast(err instanceof Error ? err.message : "Live API unavailable")
          } finally {
            setActionLoading("")
          }
        }} />
        <ActivityFeed items={activityData} />
      </section>
      {recordsOpen ? <AttendanceRecordsPanel refEl={recordsRef} rows={records} onClose={() => setRecordsOpen(false)} /> : null}
      {defaultersOpen ? <DefaultersModal rows={defaulters} onClose={() => setDefaultersOpen(false)} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

function toneStyles(tone: string) {
  if (tone === "green") return ["#E8F6F0", "#0B7A5A", "#CFE8DF"]
  if (tone === "blue") return ["#EAF1FF", "#2563EB", "#D7E4FF"]
  if (tone === "red") return ["#FFF0F0", "#EF4444", "#FBD1D1"]
  if (tone === "orange") return ["#FFF3E8", "#F97316", "#FEDFC2"]
  return ["#F3EAFE", "#7C3AED", "#E8D8FB"]
}

function KpiCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string | number; helper: string; icon: typeof Users; tone: string }) {
  const styles = toneStyles(tone)
  return (
    <div className="min-h-[100px] rounded-lg border bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]" style={{ borderColor: styles[2] }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase text-[#64748B]">{label}</p>
          <p className="mt-1.5 text-2xl font-black text-[#020617]">{value}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: styles[0], color: styles[1] }}>
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-2 truncate text-xs font-bold text-[#475569]">{helper}</p>
    </div>
  )
}

function CompactTrendChart({ data, min, max }: { data: BranchAttendanceDashboard["trend"]; min: number; max: number }) {
  const points = useMemo(() => {
    return data.map((item, index) => {
      const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100
      const y = 100 - ((item.rate - min) / Math.max(max - min, 1)) * 86 - 7
      return `${x},${y}`
    }).join(" ")
  }, [data, max, min])

  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#071B4A]">Attendance Trend Chart</h3>
        <span className="text-xs font-bold text-[#64748B]">Last 30 Days</span>
      </div>
      <div className="h-44 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          <polyline points={points} fill="none" stroke="#0B7A5A" strokeWidth="2.6" vectorEffect="non-scaling-stroke" />
          <line x1="0" x2="100" y1="82" y2="82" stroke="#F97316" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-bold text-[#64748B]">
        <span>Day 1</span>
        <span className="text-[#0B7A5A]">Target 80%</span>
        <span>Day 30</span>
      </div>
    </section>
  )
}

function BatchPerformance({ batches, average }: { batches: BranchAttendanceDashboard["batches"]; average: number }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#071B4A]">Batch Performance</h3>
        <span className="rounded bg-[#E8F6F0] px-2 py-1 text-xs font-black text-[#0B7A5A]">Avg {average}%</span>
      </div>
      <div className="space-y-3">
        {batches.map((batch) => (
          <div key={batch.batch}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs font-black text-[#071B4A]">{batch.batch}</p>
                <p className="truncate text-[11px] font-semibold text-[#64748B]">{batch.course} · {batch.students} students</p>
              </div>
              <span className={`text-xs font-black ${batch.attendance_rate < 80 ? "text-[#EF4444]" : "text-[#0B7A5A]"}`}>{batch.attendance_rate}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#EDF3F1]">
              <div className={`h-2 rounded-full ${batch.attendance_rate < 80 ? "bg-[#EF4444]" : "bg-[#0B7A5A]"}`} style={{ width: `${batch.attendance_rate}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function TrainerComplianceTable({ trainers, loading }: { trainers: TrainerCompliance[]; loading: boolean }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#E3ECE8] p-4">
        <h3 className="text-sm font-black text-[#071B4A]">Trainer Compliance Table</h3>
        {loading ? <span className="text-xs font-bold text-[#64748B]">Loading...</span> : null}
      </div>
      <div className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_0.75fr] bg-[#F8FAF8] px-4 py-2 text-[11px] font-black uppercase text-[#64748B]">
        <span>Trainer</span>
        <span>Classes</span>
        <span>Submitted</span>
        <span>Status</span>
      </div>
      {trainers.map((trainer, index) => (
        <div key={`${trainer.trainer}-${trainer.classes_assigned}-${trainer.attendance_submitted}-${index}`} className="grid grid-cols-[minmax(0,1.4fr)_0.7fr_0.8fr_0.75fr] items-center border-t border-[#EDF3F1] px-4 py-3 text-sm">
          <span className="truncate font-black text-[#071B4A]">{trainer.trainer}</span>
          <span className="font-bold text-[#475569]">{trainer.classes_assigned}</span>
          <span className="font-bold text-[#475569]">{trainer.attendance_submitted}</span>
          <StatusBadge label={trainer.status} />
        </div>
      ))}
    </section>
  )
}

function AttendanceAlerts({ alerts }: { alerts: AttendanceAlert[] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-3 text-sm font-black text-[#071B4A]">Attendance Alerts</h3>
      <div className="grid gap-2">
        {alerts.map((alert, index) => (
          <div key={`${alert.title}-${alert.detail}-${index}`} className="flex items-start gap-3 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
            <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${alert.severity === "Critical" ? "bg-[#FFF0F0] text-[#EF4444]" : "bg-[#FFF3E8] text-[#F97316]"}`}>
              <AlertTriangle size={16} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#071B4A]">{alert.title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#64748B]">{alert.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RiskStudentsTable({ students }: { students: BranchAttendanceDashboard["risk_students"] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="border-b border-[#E3ECE8] p-4">
        <h3 className="text-sm font-black text-[#071B4A]">Attendance Risk Students</h3>
      </div>
      <div className="grid grid-cols-[minmax(0,1.2fr)_1fr_0.9fr_0.7fr_0.85fr_0.7fr] bg-[#F8FAF8] px-4 py-2 text-[11px] font-black uppercase text-[#64748B]">
        {["Student", "Course", "Batch", "Attendance %", "Last Present", "Risk Level"].map((head) => <span key={head}>{head}</span>)}
      </div>
      {students.map((student, index) => (
        <div key={`${student.student}-${student.batch}-${student.course}-${index}`} className="grid grid-cols-[minmax(0,1.2fr)_1fr_0.9fr_0.7fr_0.85fr_0.7fr] items-center border-t border-[#EDF3F1] px-4 py-3 text-sm">
          <span className="truncate font-black text-[#071B4A]">{student.student}</span>
          <span className="truncate font-semibold text-[#475569]">{student.course}</span>
          <span className="truncate font-semibold text-[#475569]">{student.batch}</span>
          <span className="font-black text-[#EF4444]">{student.attendance_rate}%</span>
          <span className="font-semibold text-[#475569]">{student.last_present}</span>
          <StatusBadge label={student.risk_level} />
        </div>
      ))}
    </section>
  )
}

function AttendanceHeatmap({ heatmap }: { heatmap: BranchAttendanceDashboard["heatmap"] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-3 text-sm font-black text-[#071B4A]">Attendance Heatmap</h3>
      <div className="grid grid-cols-3 gap-2">
        {heatmap.map((cell) => (
          <div key={`${cell.day}-${cell.slot}`} className="rounded-lg p-2 text-center text-xs font-black text-white" style={{ backgroundColor: heatColor(cell.rate) }}>
            <p>{cell.day}</p>
            <p className="mt-0.5 text-[10px] font-bold opacity-90">{cell.slot}</p>
            <p className="mt-1">{cell.rate}%</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function heatColor(rate: number) {
  if (rate >= 90) return "#0B7A5A"
  if (rate >= 82) return "#2563EB"
  if (rate >= 78) return "#F97316"
  return "#EF4444"
}

function QuickActions({ loading, onView, onExport, onDefaulters }: { loading: string; onView: () => void; onExport: (monthly: boolean) => void; onDefaulters: () => void }) {
  const actions = [
    { label: "View Attendance", icon: Eye, onClick: onView },
    { label: "Export Report", icon: Download, onClick: () => onExport(false) },
    { label: "Download Monthly Report", icon: FileDown, onClick: () => onExport(true) },
    { label: "Review Defaulters", icon: RotateCcw, onClick: onDefaulters },
  ]
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-3 text-sm font-black text-[#071B4A]">Quick Actions</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <button key={action.label} type="button" onClick={action.onClick} disabled={loading === action.label} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-xs font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:bg-white disabled:opacity-60">
              <Icon size={16} className="text-[#0B7A5A]" />
              {loading === action.label ? "Loading..." : action.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function AttendanceRecordsPanel({ refEl, rows, onClose }: { refEl: React.RefObject<HTMLDivElement | null>; rows: Array<Record<string, unknown>>; onClose: () => void }) {
  return (
    <section ref={refEl} className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black text-[#071B4A]">Attendance Records</h3>
        <button type="button" onClick={onClose} className="h-8 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
      </div>
      <div className="grid grid-cols-[1fr_1fr_0.7fr_1fr] bg-[#F8FAF8] px-3 py-2 text-[11px] font-black uppercase text-[#64748B]">
        <span>Student</span><span>Session</span><span>Status</span><span>Marked At</span>
      </div>
      {rows.map((row, index) => (
        <div key={`${row.id ?? index}`} className="grid grid-cols-[1fr_1fr_0.7fr_1fr] border-t border-[#EDF3F1] px-3 py-2 text-sm font-semibold text-[#475569]">
          <span className="truncate">{String(row.student ?? "")}</span>
          <span className="truncate">{String(row.session ?? "")}</span>
          <span>{String(row.status ?? "")}</span>
          <span className="truncate">{String(row.marked_at ?? "")}</span>
        </div>
      ))}
      {!rows.length ? <p className="py-8 text-center text-sm font-bold text-[#64748B]">No attendance records found.</p> : null}
    </section>
  )
}

function DefaultersModal({ rows, onClose }: { rows: BranchAttendanceDashboard["risk_students"]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-[#071B4A]">Attendance Defaulters</h3>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
        </div>
        <div className="grid gap-2">
          {rows.map((student, index) => (
            <div key={`${student.student}-${student.batch}-${index}`} className="grid grid-cols-[1fr_1fr_80px] rounded-lg border border-[#EDF3F1] p-3 text-sm">
              <span className="font-black text-[#071B4A]">{student.student}</span>
              <span className="font-semibold text-[#475569]">{student.batch}</span>
              <span className="font-black text-[#EF4444]">{student.attendance_rate}%</span>
            </div>
          ))}
          {!rows.length ? <p className="py-8 text-center text-sm font-bold text-[#64748B]">No students below 75% attendance.</p> : null}
        </div>
      </section>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white shadow-xl">{message}</div>
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function ActivityFeed({ items }: { items: BranchAttendanceDashboard["activity"] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-3 text-sm font-black text-[#071B4A]">Recent Attendance Activity</h3>
      <div className="grid gap-2">
        {items.map((item, index) => (
          <div key={`${item.title}-${item.detail}-${item.time}-${index}`} className="flex items-center gap-3 rounded-lg border border-[#EDF3F1] p-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
              <TrendingUp size={15} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#071B4A]">{item.title}</p>
              <p className="truncate text-xs font-semibold text-[#64748B]">{item.detail}</p>
            </div>
            <span className="shrink-0 text-xs font-bold text-[#64748B]">{item.time}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function StatusBadge({ label }: { label: string }) {
  const style = label === "Compliant" || label === "Low"
    ? "bg-[#E0F3E9] text-[#0B7A5A]"
    : label === "At Risk" || label === "High"
      ? "bg-[#FFF0F0] text-[#EF4444]"
      : "bg-[#FFF0DC] text-[#F97316]"
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-[11px] font-black ${style}`}>{label}</span>
}
