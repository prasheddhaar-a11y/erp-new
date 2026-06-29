"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  LineChart as LineChartIcon,
  Moon,
  PieChart as PieChartIcon,
  RefreshCw,
  Search,
  Sun,
  Table2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { API_URL, apiRequest, getStoredSessionValue } from "@/app/shared/api"

type KpiTone = "blue" | "green" | "purple" | "orange" | "red"

type ReportFilters = {
  startDate: string
  endDate: string
  course: string
  branch: string
  counsellor: string
}

type ReportKpi = { label: string; value: string | number; tone: KpiTone }
type ReportListItem = { label: string; value: number }
type ReportCourseRow = { course: string; students: number; avg_progress: number; status: string }
type ReportLeadRow = { id: string; student_name: string; phone: string; course: string; source: string; status: string; branch: string; counsellor: string; next_follow_up: string | null; created_at: string | null }
type ReportStudentRow = { id: string; student_name: string; course: string; batch: string; status: string; attendance: number }

type ReportsDashboard = {
  generated_at: string
  filters: ReportFilters
  kpis: ReportKpi[]
  charts: {
    lead_analytics: ReportListItem[]
    lead_sources: ReportListItem[]
    follow_up_analytics: ReportListItem[]
    follow_up_channels: ReportListItem[]
    student_analytics: ReportListItem[]
    course_performance: ReportCourseRow[]
    monthly_trends: Array<{ month: string; leads: number; admissions: number; students: number }>
    conversion_funnel: Array<{ stage: string; value: number }>
    top_performing_courses: ReportCourseRow[]
  }
  tables: {
    leads: ReportLeadRow[]
    followups: Array<{ studentName: string; course: string; followUpAt: string; communicationType: string; priority: string; status: string; leadStatus: string }>
    students: ReportStudentRow[]
    courses: ReportCourseRow[]
  }
  metrics: {
    conversion_rate: number
    attendance_rate: number
    placement_ready_students: number
    active_students: number
    monthly_admissions: number
    counsellor_score: number
  }
}

const defaultFilters: ReportFilters = {
  startDate: "",
  endDate: "",
  course: "",
  branch: "",
  counsellor: "",
}

const fallbackDashboard: ReportsDashboard = {
  generated_at: new Date().toISOString(),
  filters: defaultFilters,
  kpis: [
    { label: "Total Leads", value: 128, tone: "blue" },
    { label: "Total Follow-Ups", value: 42, tone: "green" },
    { label: "Total Students", value: 214, tone: "purple" },
    { label: "Conversion Rate", value: "36.4%", tone: "orange" },
    { label: "Monthly Admissions", value: 28, tone: "red" },
    { label: "Counsellor Performance Score", value: 87, tone: "blue" },
  ],
  charts: {
    lead_analytics: [
      { label: "New", value: 48 },
      { label: "Contacted", value: 32 },
      { label: "Qualified", value: 18 },
      { label: "Converted", value: 12 },
      { label: "Lost", value: 8 },
    ],
    lead_sources: [
      { label: "Website", value: 26 },
      { label: "Walk-in", value: 18 },
      { label: "Referral", value: 14 },
      { label: "WhatsApp", value: 20 },
    ],
    follow_up_analytics: [
      { label: "Today", value: 12 },
      { label: "Upcoming", value: 15 },
      { label: "Completed", value: 9 },
      { label: "Overdue", value: 6 },
    ],
    follow_up_channels: [
      { label: "Call", value: 18 },
      { label: "WhatsApp", value: 14 },
      { label: "Email", value: 6 },
      { label: "SMS", value: 4 },
    ],
    student_analytics: [
      { label: "Full Stack", value: 34 },
      { label: "Data Science", value: 28 },
      { label: "UI/UX", value: 20 },
      { label: "MERN", value: 18 },
    ],
    course_performance: [
      { course: "Full Stack Development", students: 34, avg_progress: 86, status: "Strong" },
      { course: "Data Science", students: 28, avg_progress: 81, status: "Strong" },
      { course: "UI/UX Design", students: 20, avg_progress: 78, status: "Growing" },
      { course: "MERN Stack", students: 18, avg_progress: 74, status: "Growing" },
    ],
    monthly_trends: [
      { month: "Jan 2026", leads: 22, admissions: 12, students: 140 },
      { month: "Feb 2026", leads: 28, admissions: 16, students: 156 },
      { month: "Mar 2026", leads: 34, admissions: 18, students: 176 },
      { month: "Apr 2026", leads: 41, admissions: 22, students: 192 },
      { month: "May 2026", leads: 45, admissions: 26, students: 205 },
      { month: "Jun 2026", leads: 50, admissions: 28, students: 214 },
    ],
    conversion_funnel: [
      { stage: "Leads", value: 128 },
      { stage: "Contacted", value: 74 },
      { stage: "Qualified", value: 46 },
      { stage: "Admissions", value: 28 },
      { stage: "Converted", value: 12 },
    ],
    top_performing_courses: [
      { course: "Full Stack Development", students: 34, avg_progress: 86, status: "Strong" },
      { course: "Data Science", students: 28, avg_progress: 81, status: "Strong" },
      { course: "UI/UX Design", students: 20, avg_progress: 78, status: "Growing" },
      { course: "MERN Stack", students: 18, avg_progress: 74, status: "Growing" },
    ],
  },
  tables: {
    leads: [
      { id: "lead-1", student_name: "Meera Nair", phone: "+91 98765 43210", course: "Full Stack Development", source: "Website", status: "New", branch: "Kochi", counsellor: "Counsellor", next_follow_up: "2026-06-10T10:00:00", created_at: "2026-06-09T09:15:00" },
      { id: "lead-2", student_name: "Aarav Sharma", phone: "+91 98470 11520", course: "Data Science", source: "Referral", status: "Qualified", branch: "Madurai", counsellor: "Counsellor", next_follow_up: "2026-06-10T12:30:00", created_at: "2026-06-08T13:15:00" },
    ],
    followups: [
      { studentName: "Meera Nair", course: "Full Stack Development", followUpAt: "2026-06-10T10:00:00", communicationType: "Call", priority: "High", status: "today", leadStatus: "New" },
      { studentName: "Aarav Sharma", course: "Data Science", followUpAt: "2026-06-11T12:30:00", communicationType: "WhatsApp", priority: "Medium", status: "upcoming", leadStatus: "Qualified" },
    ],
    students: [
      { id: "stu-1", student_name: "Nandini R", course: "Data Science", batch: "DS-Morning-03", status: "Active", attendance: 89 },
      { id: "stu-2", student_name: "Imran Ali", course: "UI/UX Design", batch: "UX-Evening-02", status: "Placement Ready", attendance: 94 },
    ],
    courses: [
      { course: "Full Stack Development", students: 34, avg_progress: 86, status: "Strong" },
      { course: "Data Science", students: 28, avg_progress: 81, status: "Strong" },
    ],
  },
  metrics: {
    conversion_rate: 36.4,
    attendance_rate: 91.8,
    placement_ready_students: 54,
    active_students: 214,
    monthly_admissions: 28,
    counsellor_score: 87,
  },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function toneClasses(tone: KpiTone, dark: boolean) {
  const light: Record<KpiTone, { icon: string; ring: string }> = {
    blue: { icon: "bg-blue-50 text-blue-700", ring: "ring-blue-100" },
    green: { icon: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-100" },
    purple: { icon: "bg-violet-50 text-violet-700", ring: "ring-violet-100" },
    orange: { icon: "bg-amber-50 text-amber-700", ring: "ring-amber-100" },
    red: { icon: "bg-rose-50 text-rose-700", ring: "ring-rose-100" },
  }
  const darkStyles: Record<KpiTone, { icon: string; ring: string }> = {
    blue: { icon: "bg-blue-950/60 text-blue-200", ring: "ring-blue-900/60" },
    green: { icon: "bg-emerald-950/60 text-emerald-200", ring: "ring-emerald-900/60" },
    purple: { icon: "bg-violet-950/60 text-violet-200", ring: "ring-violet-900/60" },
    orange: { icon: "bg-amber-950/60 text-amber-200", ring: "ring-amber-900/60" },
    red: { icon: "bg-rose-950/60 text-rose-200", ring: "ring-rose-900/60" },
  }
  return dark ? darkStyles[tone] : light[tone]
}

function Panel({ title, subtitle, dark, children, className = "" }: { title: string; subtitle?: string; dark: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[24px] border p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]", dark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]", className)}>
      <div className="mb-4">
        <h2 className="text-[18px] font-black">{title}</h2>
        {subtitle ? <p className={cx("mt-1 text-sm font-semibold", dark ? "text-slate-300" : "text-[#60708C]")}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function KpiCard({ item, dark }: { item: ReportKpi; dark: boolean }) {
  const tone = toneClasses(item.tone, dark)
  return (
    <div className={cx("rounded-[22px] border p-4 shadow-sm transition", dark ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white", tone.ring)}>
      <div className={cx("grid h-11 w-11 place-items-center rounded-2xl", tone.icon)}>
        <BarChart3 size={19} />
      </div>
      <p className={cx("mt-4 text-3xl font-black", dark ? "text-white" : "text-[#071B4A]")}>{item.value}</p>
      <p className={cx("mt-1 text-sm font-bold", dark ? "text-slate-300" : "text-[#60708C]")}>{item.label}</p>
    </div>
  )
}

function Badge({ children, tone = "blue", dark = false }: { children: ReactNode; tone?: "blue" | "green" | "violet" | "amber" | "rose" | "slate"; dark?: boolean }) {
  const styles: Record<string, string> = {
    blue: dark ? "bg-blue-950/60 text-blue-200 ring-blue-900/60" : "bg-blue-50 text-blue-700 ring-blue-100",
    green: dark ? "bg-emerald-950/60 text-emerald-200 ring-emerald-900/60" : "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: dark ? "bg-violet-950/60 text-violet-200 ring-violet-900/60" : "bg-violet-50 text-violet-700 ring-violet-100",
    amber: dark ? "bg-amber-950/60 text-amber-200 ring-amber-900/60" : "bg-amber-50 text-amber-700 ring-amber-100",
    rose: dark ? "bg-rose-950/60 text-rose-200 ring-rose-900/60" : "bg-rose-50 text-rose-700 ring-rose-100",
    slate: dark ? "bg-slate-800 text-slate-100 ring-slate-700" : "bg-slate-100 text-slate-700 ring-slate-200",
  }
  return <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1", styles[tone])}>{children}</span>
}

export function CounsellorReportsModule() {
  const [filters, setFilters] = useState<ReportFilters>(defaultFilters)
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(defaultFilters)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [data, setData] = useState<ReportsDashboard>(fallbackDashboard)

  async function loadReports(nextFilters = filters) {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) query.set(key, value)
      })
      const payload = await apiRequest<ReportsDashboard>(`/reports/dashboard${query.toString() ? `?${query.toString()}` : ""}`, "")
      setData(payload ?? fallbackDashboard)
    } catch (error) {
      console.error("Failed to load reports dashboard", error)
      setData(fallbackDashboard)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports(defaultFilters)
  }, [])

  function applyFilters() {
    setFilters(draftFilters)
    loadReports(draftFilters)
  }

  async function handleExport(format: "csv" | "pdf" | "excel") {
    const token = getStoredSessionValue("pinesphere_access_token")
    const query = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) query.set(key, value)
    })
    const response = await fetch(`${API_URL}/reports/export/${format}${query.toString() ? `?${query.toString()}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) {
      setNotice("Export failed.")
      return
    }
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `reports.${format === "excel" ? "xlsx" : format}`
    anchor.click()
    window.URL.revokeObjectURL(url)
    setNotice(`Reports ${format.toUpperCase()} export ready.`)
  }

  const shellClass = darkMode ? "bg-slate-950 text-slate-100" : "bg-[#F8FAF8] text-[#071B4A]"
  const mutedClass = darkMode ? "text-slate-300" : "text-[#60708C]"

  const chartPalette = darkMode ? ["#60A5FA", "#34D399", "#A78BFA", "#F59E0B", "#F87171"] : ["#2563EB", "#0B7A5A", "#7C3AED", "#F59E0B", "#EF4444"]

  return (
    <div className={cx("space-y-5 p-1 md:p-0", shellClass)}>
      <section className={cx("rounded-[26px] border p-5 shadow-[0_16px_32px_rgba(15,23,42,0.06)]", darkMode ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={cx("flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]", mutedClass)}>
              <span>Counsellor</span>
              <span>&gt;</span>
              <span>Reports</span>
              <span>&gt;</span>
              <span className={darkMode ? "text-emerald-300" : "text-[#0B7A5A]"}>Analytics</span>
            </div>
            <h1 className={cx("mt-2 text-3xl font-black tracking-tight sm:text-4xl", darkMode ? "text-white" : "text-[#071B4A]")}>Reports & Analytics</h1>
            <p className={cx("mt-1 text-sm font-semibold", mutedClass)}>HubSpot-style analytics for leads, follow-ups, students, courses, conversions, and counsellor performance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDarkMode((value) => !value)} className={cx("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light" : "Dark"}
            </button>
            <button type="button" onClick={() => loadReports(filters)} className={cx("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button type="button" onClick={() => handleExport("csv")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#DCE7E2] bg-white px-4 text-sm font-black text-[#071B4A]">
              <Table2 size={16} />
              CSV
            </button>
            <button type="button" onClick={() => handleExport("excel")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#DCE7E2] bg-white px-4 text-sm font-black text-[#071B4A]">
              <Download size={16} />
              Excel
            </button>
            <button type="button" onClick={() => handleExport("pdf")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20">
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>
      </section>

      {notice ? <div className={cx("rounded-2xl border px-4 py-3 text-sm font-black", darkMode ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice}</div> : null}

      <section className={cx("rounded-[24px] border p-5 shadow-sm", darkMode ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
        <div className="grid gap-3 xl:grid-cols-[0.78fr_1.22fr] xl:items-end">
          <div className={cx("flex h-12 w-full items-center gap-2 rounded-2xl border px-3", darkMode ? "border-slate-700 bg-slate-950" : "border-[#DCE7E2] bg-white")}>
            <Search size={17} className={mutedClass} />
            <input value={draftFilters.course || ""} onChange={(event) => setDraftFilters((current) => ({ ...current, course: event.target.value }))} placeholder="Search by course..." className={cx("w-full bg-transparent text-sm font-semibold outline-none", darkMode ? "text-slate-100 placeholder:text-slate-500" : "text-[#071B4A] placeholder:text-[#8A96AA]")} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <FilterInput label="Start" value={draftFilters.startDate} onChange={(value) => setDraftFilters((current) => ({ ...current, startDate: value }))} dark={darkMode} inputType="date" />
            <FilterInput label="End" value={draftFilters.endDate} onChange={(value) => setDraftFilters((current) => ({ ...current, endDate: value }))} dark={darkMode} inputType="date" />
            <FilterInput label="Branch" value={draftFilters.branch} onChange={(value) => setDraftFilters((current) => ({ ...current, branch: value }))} dark={darkMode} />
            <FilterInput label="Counsellor" value={draftFilters.counsellor} onChange={(value) => setDraftFilters((current) => ({ ...current, counsellor: value }))} dark={darkMode} />
            <button type="button" onClick={applyFilters} className="inline-flex h-12 items-center justify-center gap-2 self-end rounded-2xl bg-[#0B7A5A] px-5 text-sm font-black text-white">
              <Filter size={16} />
              Apply
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {(loading ? fallbackDashboard.kpis : data.kpis).map((item) => (
          <KpiCard key={item.label} item={item} dark={darkMode} />
        ))}
      </div>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr_1fr]">
        <Panel title="Lead Analytics" subtitle="Pipeline breakdown and lead source insights." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.lead_analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                <Bar dataKey="value" fill="#0B7A5A" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Conversion Funnel" subtitle="From lead generation to admission conversion." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.charts.conversion_funnel} dataKey="value" nameKey="stage" innerRadius={64} outerRadius={112} paddingAngle={4}>
                  {data.charts.conversion_funnel.map((entry, index) => <Cell key={entry.stage} fill={chartPalette[index % chartPalette.length]} />)}
                </Pie>
                <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Monthly Trends" subtitle="Lead, admission, and student movement over time." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.charts.monthly_trends}>
                <defs>
                  <linearGradient id="leadGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#0B7A5A" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#0B7A5A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="month" stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                <Area type="monotone" dataKey="leads" stroke="#0B7A5A" fill="url(#leadGradient)" strokeWidth={3} />
                <Line type="monotone" dataKey="admissions" stroke="#7C3AED" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Panel title="Follow-Up Analytics" subtitle="Today's, upcoming, completed, and overdue queues." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.follow_up_analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                <Bar dataKey="value" fill="#2563EB" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Student Analytics" subtitle="Course-wise student distribution." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.charts.student_analytics}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1F2937" : "#E2E8F0"} />
                <XAxis dataKey="label" stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} />
                <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                <Bar dataKey="value" fill="#7C3AED" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Panel>

        <Panel title="Course Performance" subtitle="Top performing courses, progress, and momentum." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <div className="space-y-3">
              {data.charts.course_performance.map((course) => (
                <div key={course.course} className={cx("rounded-2xl border p-3", darkMode ? "border-slate-800 bg-slate-950" : "border-[#E6EFEA] bg-[#F9FBFA]")}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black">{course.course}</p>
                      <p className={cx("mt-1 text-xs font-semibold", mutedClass)}>{course.students} students</p>
                    </div>
                    <Badge tone={course.status === "Strong" ? "green" : "amber"} dark={darkMode}>{course.status}</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-[#0B7A5A]" style={{ width: `${Math.min(course.avg_progress, 100)}%` }} />
                  </div>
                  <p className={cx("mt-2 text-xs font-bold", mutedClass)}>Average progress {course.avg_progress}%</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.9fr_0.95fr]">
        <Panel title="Recent Leads" subtitle="Lead name, course, source, and next action." dark={darkMode}>
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: darkMode ? "#1F2937" : "#E6EFEA" }}>
            <table className="min-w-full divide-y" style={{ borderColor: darkMode ? "#1F2937" : "#E6EFEA" }}>
              <thead className={darkMode ? "bg-slate-950" : "bg-[#F7FAF8]"}>
                <tr>
                  {["Lead", "Course", "Source", "Status"].map((heading) => <th key={heading} className={cx("px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.14em]", mutedClass)}>{heading}</th>)}
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-y divide-slate-800 bg-slate-900" : "divide-y divide-[#E6EFEA] bg-white"}>
                {(loading ? fallbackDashboard.tables.leads : data.tables.leads).map((lead) => (
                  <tr key={lead.id}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-black">{lead.student_name}</p>
                      <p className={cx("text-xs font-semibold", mutedClass)}>{lead.phone}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">{lead.course}</td>
                    <td className="px-4 py-3 text-sm font-semibold">{lead.source}</td>
                    <td className="px-4 py-3"><Badge tone={lead.status === "New" ? "blue" : lead.status === "Qualified" ? "green" : "slate"} dark={darkMode}>{lead.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Lead Source Analysis" subtitle="Where counsellor opportunities are coming from." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <div className="space-y-3">
              {data.charts.lead_sources.map((source, index) => (
                <div key={source.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black">{source.label}</p>
                    <p className={cx("text-sm font-black", mutedClass)}>{source.value}</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200/70 dark:bg-slate-800">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(100, source.value * 2)}%`, background: chartPalette[index % chartPalette.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Performing Courses" subtitle="Student volume and average progress." dark={darkMode}>
          {loading ? <PanelSkeleton dark={darkMode} /> : (
            <div className="space-y-3">
              {data.charts.top_performing_courses.map((row) => (
                <div key={row.course} className={cx("rounded-2xl border p-3", darkMode ? "border-slate-800 bg-slate-950" : "border-[#E6EFEA] bg-[#F9FBFA]")}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black">{row.course}</p>
                      <p className={cx("mt-1 text-xs font-semibold", mutedClass)}>{row.students} students</p>
                    </div>
                    <Badge tone={row.status === "Strong" ? "green" : "amber"} dark={darkMode}>{row.status}</Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <TrendingUp size={15} className={darkMode ? "text-emerald-300" : "text-[#0B7A5A]"} />
                    <span className={cx("text-xs font-black", mutedClass)}>Avg progress {row.avg_progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  )
}

function FilterInput({ label, value, onChange, dark, inputType = "text" }: { label: string; value: string; onChange: (value: string) => void; dark: boolean; inputType?: "text" | "date" }) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.08em]">
      <span className={dark ? "text-slate-300" : "text-[#60708C]"}>{label}</span>
      <input
        type={inputType}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cx("h-12 rounded-2xl border px-3 text-sm font-semibold outline-none", dark ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500" : "border-[#DCE7E2] bg-white text-[#071B4A] placeholder:text-[#8A96AA]")}
        placeholder={label}
      />
    </label>
  )
}

function PanelSkeleton({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-3">
      <div className={cx("h-6 w-2/3 animate-pulse rounded-full", dark ? "bg-slate-800" : "bg-slate-200")} />
      <div className={cx("h-48 animate-pulse rounded-3xl", dark ? "bg-slate-800" : "bg-slate-100")} />
    </div>
  )
}

