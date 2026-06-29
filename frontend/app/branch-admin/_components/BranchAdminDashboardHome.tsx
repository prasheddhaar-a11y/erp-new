"use client"

import { AlertTriangle, BarChart3, CalendarDays, CreditCard, FileText, GraduationCap, Plus, ReceiptText, Users } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { BRANCH_ADMIN_PREFERENCES_EVENT, readBranchAdminPreferences } from "./BranchAdminShell"
import { getBranchDashboard, type BranchDashboard } from "@/lib/api/branchAdmin"
import { resolveBranchScope } from "@/lib/api/branchAdminData"

const actions = [
  { label: "Add Student", href: "/branch-admin/students?action=create", icon: Plus },
  { label: "Approve Admission", href: "/branch-admin/admissions?status=PENDING", icon: FileText },
  { label: "Create Batch", href: "/branch-admin/batch-management?action=create", icon: GraduationCap },
  { label: "Collect Fee", href: "/branch-admin/fees?action=collect", icon: CreditCard },
  { label: "Export Data", href: "", icon: BarChart3, export: true },
]

export function BranchAdminDashboardHome() {
  const session = useMemo(() => readBranchAdminSession(), [])
  const branch = useMemo(() => session?.branch ?? resolveBranchScope(), [session])
  const [dashboard, setDashboard] = useState<BranchDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [dashboardPreference, setDashboardPreference] = useState(() => readBranchAdminPreferences().dashboard_preference ?? "Detailed")

  useEffect(() => {
    let cancelled = false
    if (!session) {
      setLoading(false)
      return
    }
    getBranchDashboard()
      .then((payload) => {
        if (!cancelled) {
          setDashboard(payload)
          setError("")
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setDashboard(null)
          setError(`Live API unavailable: ${err.message}`)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [session])

  useEffect(() => {
    function refreshPreferences() {
      setDashboardPreference(readBranchAdminPreferences().dashboard_preference ?? "Detailed")
    }
    window.addEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, refreshPreferences)
    window.addEventListener("storage", refreshPreferences)
    return () => {
      window.removeEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, refreshPreferences)
      window.removeEventListener("storage", refreshPreferences)
    }
  }, [])

  const kpis = [
    { label: "Total Students", value: String(dashboard?.total_students ?? 0), helper: dashboard?.branch_name ?? branch.branch_name, icon: Users, href: "/branch-admin/students", tone: "green" },
    { label: "Active Students", value: String(dashboard?.active_students ?? 0), helper: "Branch active roster", icon: Users, href: "/branch-admin/students", tone: "green" },
    { label: "Active Batches", value: String(dashboard?.active_batches ?? 0), helper: "Branch-scoped batches", icon: GraduationCap, href: "/branch-admin/batch-management", tone: "blue" },
    { label: "Active Trainers", value: String(dashboard?.active_trainers ?? 0), helper: "Assigned to branch batches", icon: Users, href: "/branch-admin/batch-management", tone: "purple" },
    { label: "New Admissions", value: String(dashboard?.new_admissions ?? 0), helper: "This branch only", icon: FileText, href: "/branch-admin/admissions", tone: "blue" },
    { label: "Pending Admissions", value: String(dashboard?.pending_admissions ?? 0), helper: "Awaiting approval", icon: FileText, href: "/branch-admin/admissions?status=Pending", tone: "orange" },
    { label: "Revenue MTD", value: `Rs ${Math.round(dashboard?.fee_revenue_mtd ?? 0).toLocaleString("en-IN")}`, helper: "Collected payments", icon: CreditCard, href: "/branch-admin/fees", tone: "orange" },
    { label: "Pending Fees", value: `Rs ${Math.round(dashboard?.pending_fees ?? 0).toLocaleString("en-IN")}`, helper: "Defaulter review", icon: ReceiptText, href: "/branch-admin/fees", tone: "orange" },
  ] as const
  const admissions = dashboard?.recent_admissions ?? []
  const activity = dashboard?.recent_activity ?? []
  const alerts = dashboard?.branch_alerts ?? []
  const classes = dashboard?.upcoming_classes ?? []
  const exportDashboard = () => {
    const rows = [
      ["Metric", "Value"],
      ["Branch", dashboard?.branch_name ?? branch.branch_name],
      ["Total Students", dashboard?.total_students ?? 0],
      ["Active Students", dashboard?.active_students ?? 0],
      ["Active Batches", dashboard?.active_batches ?? 0],
      ["Active Trainers", dashboard?.active_trainers ?? 0],
      ["New Admissions", dashboard?.new_admissions ?? 0],
      ["Pending Admissions", dashboard?.pending_admissions ?? 0],
      ["Revenue MTD", dashboard?.fee_revenue_mtd ?? 0],
      ["Pending Fees", dashboard?.pending_fees ?? 0],
    ]
    downloadCsv("branch_dashboard.csv", rows)
    setToast("Dashboard export downloaded.")
  }

  const compact = dashboardPreference === "Compact"
  const analyticsFocus = dashboardPreference === "Analytics Focus"
  const pageGap = compact ? "space-y-3" : "space-y-5"
  const kpiGrid = "grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
  const kpiCardClass = "min-h-[100px] rounded-lg border bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"

  return (
    <div className={pageGap}>
      {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Branch Dashboard</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">Here&apos;s what&apos;s happening in {branch.branch_name} today.</p>
        </div>
        <div className="inline-flex h-12 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#0F172A] shadow-sm">
          <CalendarDays size={17} className="text-[#0B7A5A]" />
          07 June 2026, Sunday
        </div>
      </section>

      {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
      {loading ? <div className="rounded-lg border border-[#DDE9E4] bg-white px-4 py-3 text-sm font-black text-[#64748B]">Loading dashboard...</div> : null}

      <section className={kpiGrid}>
        {kpis.map((item) => {
          const Icon = item.icon
          const tone = item.tone === "green" ? ["#E8F6F0", "#0B7A5A", "#CFE8DF"] : item.tone === "blue" ? ["#EAF1FF", "#2563EB", "#D7E4FF"] : item.tone === "purple" ? ["#F3EAFE", "#7C3AED", "#E8D8FB"] : ["#FFF3E8", "#F97316", "#FEDFC2"]
          return (
            <Link key={item.label} href={item.href} className={kpiCardClass} style={{ borderColor: tone[2] }}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-black uppercase text-[#64748B]">{item.label}</h3>
                  <p className="mt-2 text-xl font-black text-[#020617]">{item.value}</p>
                  <p className="mt-2 truncate text-xs font-semibold text-[#475569]">{item.helper}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: tone[0], color: tone[1] }}>
                  <Icon size={19} />
                </span>
              </div>
            </Link>
          )
        })}
      </section>

      <section className={`grid ${compact ? "gap-3" : "gap-4"} ${analyticsFocus ? "xl:grid-cols-[0.6fr_0.9fr_1.2fr]" : "xl:grid-cols-[0.75fr_1fr_1fr]"}`}>
        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[#071B4A]">Key Modules</h3>
            <GraduationCap size={18} className="text-[#0B7A5A]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => {
              const Icon = action.icon
              if (action.export) {
                return (
                  <button key={action.label} type="button" onClick={exportDashboard} className="flex min-h-[74px] flex-col items-center justify-center rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3 text-center transition hover:border-[#0B7A5A] hover:bg-white">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                      <Icon size={20} />
                    </span>
                    <span className="mt-2 text-xs font-black leading-4 text-[#071B4A]">{action.label}</span>
                  </button>
                )
              }
              return (
                <Link key={action.label} href={action.href} className="flex min-h-[74px] flex-col items-center justify-center rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3 text-center transition hover:border-[#0B7A5A] hover:bg-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                    <Icon size={20} />
                  </span>
                  <span className="mt-2 text-xs font-black leading-4 text-[#071B4A]">{action.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[#071B4A]">Recent Admissions</h3>
            <Link href="/branch-admin/admissions" className="text-xs font-black text-[#0B7A5A]">View all</Link>
          </div>
          <div className="space-y-3">
            {admissions.map((student) => (
              <div key={student.id} className="flex items-center gap-3 rounded-lg border border-transparent p-1.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] text-xs font-black text-[#0B7A5A]">
                  {student.student_name.split(" ").map((part: string) => part[0]).join("")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-[#071B4A]">{student.student_name}</span>
                  <span className="mt-0.5 block truncate text-xs font-semibold text-[#64748B]">{student.course}</span>
                </span>
                <span className="shrink-0 rounded bg-[#E0F3E9] px-2 py-1 text-[11px] font-black text-[#0B7A5A]">{student.admission_status}</span>
              </div>
            ))}
            {!admissions.length && !loading ? <p className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm font-bold text-[#64748B]">No admissions found.</p> : null}
          </div>
        </div>

        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[#071B4A]">Branch Alerts</h3>
            <AlertTriangle size={18} className="text-[#F97316]" />
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.title} className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-black text-[#071B4A]">{alert.title}</p>
                  <span className="shrink-0 rounded bg-[#FFF0DC] px-2 py-1 text-[10px] font-black text-[#F97316]">{alert.severity}</span>
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{alert.detail}</p>
              </div>
            ))}
            {!alerts.length && !loading ? <p className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm font-bold text-[#64748B]">No branch alerts.</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <h3 className="mb-4 text-sm font-black text-[#071B4A]">Upcoming Classes</h3>
          <div className="grid gap-2">
            {classes.map((item) => (
              <div key={item.id ?? item.batch} className="grid grid-cols-[minmax(0,1fr)_92px_80px] items-center gap-3 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-black text-[#071B4A]">{item.batch}</p>
                  <p className="truncate text-xs font-semibold text-[#64748B]">{item.trainer}</p>
                </div>
                <p className="font-black text-[#0B7A5A]">{item.time}</p>
                <p className="text-right font-semibold text-[#475569]">{item.room}</p>
              </div>
            ))}
            {!classes.length && !loading ? <p className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm font-bold text-[#64748B]">No upcoming classes.</p> : null}
          </div>
        </div>
        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <h3 className="mb-4 text-sm font-black text-[#071B4A]">Recent Activity</h3>
          <div className="grid gap-2">
            {activity.map((item, index) => (
              <div key={`${item.module ?? "activity"}-${item.title}-${item.detail}-${item.time}-${index}`} className="flex items-center gap-3 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#0B7A5A]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-[#071B4A]">{item.title}</p>
                  <p className="truncate text-xs font-semibold text-[#64748B]">{item.detail}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-[#64748B]">{item.time}</span>
              </div>
            ))}
            {!activity.length && !loading ? <p className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm font-bold text-[#64748B]">No recent activity.</p> : null}
          </div>
        </div>
      </section>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timeout = window.setTimeout(onClose, 2600)
    return () => window.clearTimeout(timeout)
  }, [onClose])
  return (
    <div className="fixed right-5 top-5 z-50 rounded-lg border border-[#BFE3D3] bg-white px-4 py-3 text-sm font-black text-[#0B7A5A] shadow-lg">
      {message}
    </div>
  )
}

function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
