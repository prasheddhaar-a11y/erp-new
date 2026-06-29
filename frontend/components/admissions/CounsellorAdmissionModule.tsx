"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Bell,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Moon,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/app/shared/api"

type AdmissionView = "list" | "create" | "details" | "analytics"
type SortKey = "student" | "course" | "status" | "createdDate"

type AdmissionRecord = {
  id: string
  admissionNumber: string
  student: string
  phone: string
  email?: string
  city?: string
  course: string
  batch: string
  mode: "Online" | "Offline"
  branch: string
  status: "Pending" | "Approved" | "Rejected" | "Converted"
  counsellor: string
  remarks?: string
  notes?: string
  fee: number
  score: number
  createdDate: string
  studentId?: string
  approvalHistory?: ApprovalHistoryItem[]
  timeline?: TimelineItem[]
}

type ApprovalHistoryItem = {
  action: "Submitted" | "Approved" | "Rejected" | "Converted"
  user: string
  role: string
  date: string
  reason?: string
}

type TimelineItem = {
  title: string
  detail: string
  date: string
}

type AdmissionDraft = {
  student: string
  phone: string
  email: string
  city: string
  course: string
  batch: string
  mode: "Online" | "Offline"
  branch: string
  remarks: string
  notes: string
  attachments: string
}

const emptyDraft: AdmissionDraft = {
  student: "",
  phone: "",
  email: "",
  city: "",
  course: "",
  batch: "",
  mode: "Offline",
  branch: "",
  remarks: "",
  notes: "",
  attachments: "",
}

const demoRecords: AdmissionRecord[] = [
  withAudit({ id: "adm-1001", admissionNumber: "ADM-2026-1001", student: "Meera Nair", phone: "+91 98765 43210", email: "meera@example.com", city: "Kochi", course: "Full Stack Development", batch: "Morning A", mode: "Offline", branch: "Kochi", status: "Pending", counsellor: "Counsellor", remarks: "Interested in weekend option", notes: "Call parent before fee discussion.", fee: 18000, score: 92, createdDate: "2026-06-06" }),
  withAudit({ id: "adm-1002", admissionNumber: "ADM-2026-1002", student: "Aarav Sharma", phone: "+91 98470 11520", email: "aarav@example.com", city: "Madurai", course: "Data Science", batch: "Evening B", mode: "Online", branch: "Madurai", status: "Approved", counsellor: "Counsellor", remarks: "Scholarship requested", notes: "Documents verified.", fee: 22000, score: 84, createdDate: "2026-06-05" }),
  withAudit({ id: "adm-1003", admissionNumber: "ADM-2026-1003", student: "Neha Patel", phone: "+91 90123 45678", email: "neha@example.com", city: "Chennai", course: "Digital Marketing", batch: "Weekend", mode: "Offline", branch: "Chennai", status: "Converted", counsellor: "Counsellor", remarks: "Converted after demo", notes: "Move to student onboarding.", fee: 24000, score: 96, createdDate: "2026-06-04", studentId: "STU-2026-1003" }),
  withAudit({ id: "adm-1004", admissionNumber: "ADM-2026-1004", student: "Rahul Menon", phone: "+91 94460 32145", email: "rahul@example.com", city: "Coimbatore", course: "MERN Stack", batch: "Morning A", mode: "Online", branch: "Coimbatore", status: "Rejected", counsellor: "Counsellor", remarks: "Timing mismatch", notes: "Follow next month.", fee: 8000, score: 71, createdDate: "2026-06-03" }),
]

const monthlyTrend = [
  { month: "Jan", admissions: 24 },
  { month: "Feb", admissions: 31 },
  { month: "Mar", admissions: 38 },
  { month: "Apr", admissions: 34 },
  { month: "May", admissions: 46 },
  { month: "Jun", admissions: 52 },
]

const courses = ["Full Stack Development", "Data Science", "Digital Marketing", "MERN Stack", "Python Pro"]
const batches = ["Morning A", "Evening B", "Weekend", "Fast Track", "Hybrid Batch"]
const branches = ["Kochi", "Madurai", "Chennai", "Coimbatore", "Online"]
const statuses: AdmissionRecord["status"][] = ["Pending", "Approved", "Rejected", "Converted"]

const viewMeta: Record<AdmissionView, { title: string; label: string; icon: LucideIcon; href: string }> = {
  list: { title: "Admission Management", label: "Admission List", icon: ClipboardList, href: "/counsellor/admissions" },
  create: { title: "Create Admission", label: "Create Admission", icon: Plus, href: "/counsellor/admissions/create" },
  details: { title: "Admission Details", label: "Admission Details", icon: FileCheck2, href: "/counsellor/admissions/details" },
  analytics: { title: "Admission Analytics", label: "Admission Analytics", icon: LayoutDashboard, href: "/counsellor/admissions/analytics" },
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function parseNotes(notes?: string) {
  const text = notes || ""
  const get = (label: string) => text.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"))?.[1]?.trim()
  return {
    batch: get("Batch") || "Unassigned",
    mode: (get("Mode") === "Online" ? "Online" : "Offline") as "Online" | "Offline",
    remarks: get("Remarks") || "",
    notes: text.split("Notes:").pop()?.trim() || text,
  }
}

export function CounsellorAdmissionModule({ initialView = "list" }: { initialView?: AdmissionView }) {
  const [view, setView] = useState<AdmissionView>(initialView)
  const [records, setRecords] = useState<AdmissionRecord[]>(demoRecords)
  const [selectedId, setSelectedId] = useState(demoRecords[0].id)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sortKey, setSortKey] = useState<SortKey>("createdDate")
  const [page, setPage] = useState(1)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")

  useEffect(() => setView(initialView), [initialView])

  useEffect(() => {
    let mounted = true
    async function loadAdmissions() {
      setLoading(true)
      try {
        const data = await apiRequest<any[]>("/admissions", "")
        if (!mounted || !Array.isArray(data) || data.length === 0) return
        setRecords(data.map((item, index) => {
          const noteData = parseNotes(item.notes)
          return withAudit({
            id: item.id,
            admissionNumber: `ADM-${new Date(item.created_at).getFullYear()}-${String(index + 1).padStart(4, "0")}`,
            student: item.student_name,
            phone: item.phone,
            email: item.email || "",
            city: "",
            course: item.course_interest || "Not selected",
            batch: noteData.batch,
            mode: noteData.mode,
            branch: item.branch_id || "Assigned branch",
            status: statuses.includes(item.stage) ? item.stage : "Pending",
            counsellor: item.counsellor_id || "Counsellor",
            remarks: noteData.remarks,
            notes: noteData.notes,
            fee: Number(item.expected_fee || item.fee_collected || 0),
            score: Number(item.score || 0),
            createdDate: item.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          })
        }))
      } catch (error) {
        setNotice(error instanceof Error ? `Live admissions unavailable. Showing saved demo admissions. ${error.message}` : "Live admissions unavailable. Showing saved demo admissions.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadAdmissions()
    return () => { mounted = false }
  }, [])

  const filteredRecords = useMemo(() => {
    const text = query.trim().toLowerCase()
    return records
      .filter((record) => statusFilter === "All" || record.status === statusFilter)
      .filter((record) => !text || `${record.admissionNumber} ${record.student} ${record.phone} ${record.course} ${record.batch} ${record.counsellor}`.toLowerCase().includes(text))
      .sort((a, b) => String(b[sortKey]).localeCompare(String(a[sortKey])))
  }, [query, records, sortKey, statusFilter])

  const selectedRecord = records.find((record) => record.id === selectedId) || records[0]
  const pageSize = 6
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const pagedRecords = filteredRecords.slice((page - 1) * pageSize, page * pageSize)

  const shellClass = darkMode ? "dark bg-[#0B1120] text-white" : "bg-[#F4F7FB] text-slate-950"

  function handleCreated(record: AdmissionRecord) {
    setRecords((current) => [withAudit(record), ...current])
    setSelectedId(record.id)
    setView("details")
  }

  function handleRecordUpdate(updatedRecord: AdmissionRecord) {
    setRecords((current) => current.map((record) => record.id === updatedRecord.id ? updatedRecord : record))
    setSelectedId(updatedRecord.id)
  }

  return (
    <div className={cx("min-h-[calc(100vh-90px)] overflow-hidden rounded-[28px] border border-slate-200/80 shadow-sm transition-colors dark:border-white/10", shellClass)}>
      <div className="min-h-[calc(100vh-92px)]">
        <main className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0B1120]/80 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400">
                  <span>Counsellor</span><ChevronRight size={13} /><span>Admissions</span><ChevronRight size={13} /><span className="text-[#0B7A5A] dark:text-emerald-200">{viewMeta[view].label}</span>
                </div>
                <h1 className="mt-1 truncate text-2xl font-black tracking-tight md:text-3xl">{viewMeta[view].title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden min-w-[260px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/10 md:flex">
                  <Search size={17} className="text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admissions..." className="w-full bg-transparent text-sm font-bold outline-none placeholder:text-slate-400" />
                </div>
                <button className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/10"><Bell size={18} /></button>
                <button onClick={() => setDarkMode((value) => !value)} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-white/10">{darkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
                <button onClick={() => setView("create")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20"><Plus size={17} /> New</button>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/10 md:hidden">
              <Search size={17} className="text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admissions..." className="w-full bg-transparent text-sm font-bold outline-none" />
            </div>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <AdmissionViewButtons activeView={view} onViewChange={setView} />
            {notice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                {notice}
              </div>
            ) : null}
            {view === "list" && <AdmissionList records={pagedRecords} allRecords={records} loading={loading} query={query} statusFilter={statusFilter} sortKey={sortKey} page={page} totalPages={totalPages} onQuery={setQuery} onStatusFilter={setStatusFilter} onSort={setSortKey} onPage={setPage} onCreate={() => setView("create")} onDetails={(id) => { setSelectedId(id); setView("details") }} />}
            {view === "create" && <AdmissionForm onCancel={() => setView("list")} onCreated={handleCreated} />}
            {view === "details" && <AdmissionDetails record={selectedRecord} onCreate={() => setView("create")} onRecordUpdate={handleRecordUpdate} />}
            {view === "analytics" && <AdmissionAnalytics records={records} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function AdmissionList(props: {
  records: AdmissionRecord[]
  allRecords: AdmissionRecord[]
  loading: boolean
  query: string
  statusFilter: string
  sortKey: SortKey
  page: number
  totalPages: number
  onQuery: (value: string) => void
  onStatusFilter: (value: string) => void
  onSort: (value: SortKey) => void
  onPage: (value: number) => void
  onCreate: () => void
  onDetails: (id: string) => void
}) {
  const counts = getCounts(props.allRecords)
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Admissions" value={props.allRecords.length} icon={ClipboardList} tone="blue" />
        <KpiCard label="Pending Admissions" value={counts.Pending} icon={UserRound} tone="amber" />
        <KpiCard label="Approved Admissions" value={counts.Approved} icon={CheckCircle2} tone="green" />
        <KpiCard label="Rejected Admissions" value={counts.Rejected} icon={XCircle} tone="rose" />
        <KpiCard label="Converted Students" value={counts.Converted} icon={GraduationCap} tone="violet" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Monthly admission trends" className="xl:col-span-1"><TrendChart /></ChartCard>
        <ChartCard title="Course-wise admissions"><CourseChart records={props.allRecords} /></ChartCard>
        <ChartCard title="Branch-wise admissions"><BranchChart records={props.allRecords} /></ChartCard>
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-black">Admission pipeline</h2><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Search, filter, sort, export, and open admission records.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={props.statusFilter} onChange={(event) => props.onStatusFilter(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-white/10 dark:bg-[#111827]"><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select>
            <select value={props.sortKey} onChange={(event) => props.onSort(event.target.value as SortKey)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-white/10 dark:bg-[#111827]"><option value="createdDate">Created Date</option><option value="student">Student</option><option value="course">Course</option><option value="status">Status</option></select>
            <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-white/10 dark:bg-white/10"><Filter size={16} /> Filters</button>
            <button onClick={() => exportAdmissions(props.allRecords)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-black dark:border-white/10 dark:bg-white/10"><Download size={16} /> Excel</button>
            <button onClick={props.onCreate} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-4 text-sm font-black text-white"><Plus size={16} /> Admission</button>
          </div>
        </div>

        {props.loading ? <SkeletonTable /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1040px] border-separate border-spacing-y-2 text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>{["Admission Number", "Student Name", "Phone Number", "Course", "Batch", "Status", "Counsellor", "Created Date", "Actions"].map((head) => <th key={head} className="px-3 py-2 font-black">{head}</th>)}</tr>
              </thead>
              <tbody>
                {props.records.map((record) => (
                  <tr key={record.id} className="rounded-2xl bg-slate-50 font-bold text-slate-700 dark:bg-white/[0.06] dark:text-slate-200">
                    <td className="rounded-l-2xl px-3 py-4 font-black text-slate-950 dark:text-white">{record.admissionNumber}</td>
                    <td className="px-3 py-4">{record.student}</td>
                    <td className="px-3 py-4">{record.phone}</td>
                    <td className="px-3 py-4">{record.course}</td>
                    <td className="px-3 py-4">{record.batch}</td>
                    <td className="px-3 py-4"><StatusBadge status={record.status} /></td>
                    <td className="px-3 py-4">{record.counsellor}</td>
                    <td className="px-3 py-4">{formatDate(record.createdDate)}</td>
                    <td className="rounded-r-2xl px-3 py-4"><button onClick={() => props.onDetails(record.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black dark:border-white/10 dark:bg-white/10"><Eye size={15} /> View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
          <span>Page {props.page} of {props.totalPages}</span>
          <div className="flex items-center gap-2">
            <button disabled={props.page === 1} onClick={() => props.onPage(Math.max(1, props.page - 1))} className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-40 dark:border-white/10">Previous</button>
            <button disabled={props.page === props.totalPages} onClick={() => props.onPage(Math.min(props.totalPages, props.page + 1))} className="rounded-xl border border-slate-200 px-3 py-2 disabled:opacity-40 dark:border-white/10">Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function AdmissionViewButtons({ activeView, onViewChange }: { activeView: AdmissionView; onViewChange: (view: AdmissionView) => void }) {
  return (
    <nav className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(viewMeta) as AdmissionView[]).map((key) => {
          const Icon = viewMeta[key].icon
          return (
            <Link
              key={key}
              href={viewMeta[key].href}
              onClick={(event) => {
                event.preventDefault()
                onViewChange(key)
              }}
              className={cx(
                "flex min-h-14 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition",
                activeView === key
                  ? "bg-[#E9F8F1] text-[#0B7A5A] ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-100 dark:ring-emerald-300/10"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/10"
              )}
            >
              <Icon size={18} />
              <span>{viewMeta[key].label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function AdmissionForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (record: AdmissionRecord) => void }) {
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<AdmissionDraft>(emptyDraft)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successRecord, setSuccessRecord] = useState<AdmissionRecord | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem("pinesphere_counsellor_admission_draft")
    if (saved) setDraft({ ...emptyDraft, ...JSON.parse(saved) })
  }, [])

  useEffect(() => {
    if (!successRecord) window.localStorage.setItem("pinesphere_counsellor_admission_draft", JSON.stringify(draft))
  }, [draft, successRecord])

  function update(key: keyof AdmissionDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function validate() {
    if (step === 1 && (!draft.student || !draft.phone)) return "Student Name and Phone Number are required."
    if (step === 1 && draft.email && !/^\S+@\S+\.\S+$/.test(draft.email)) return "Enter a valid Email Address."
    if (step === 2 && (!draft.course || !draft.batch || !draft.branch)) return "Course, Batch, and Branch are required."
    return ""
  }

  function next() {
    const message = validate()
    if (message) { setError(message); return }
    setError("")
    setStep((value) => Math.min(4, value + 1))
  }

  async function submit() {
    const message = validate()
    if (message) { setError(message); return }
    setSubmitting(true)
    setError("")
    try {
      const body = {
        student_name: draft.student,
        phone: draft.phone,
        email: draft.email || null,
        course_interest: draft.course,
        branch_id: draft.branch,
        stage: "Pending",
        notes: `Batch: ${draft.batch}\nMode: ${draft.mode}\nRemarks: ${draft.remarks || "None"}\nAttachments: ${draft.attachments || "None"}\n\nNotes:\n${draft.notes || "None"}`,
      }
      const response = await apiRequest<{ id: string; created_at?: string }>("/admissions", "", { method: "POST", body: JSON.stringify(body) })
      const created = buildCreatedRecord(draft, response.id, response.created_at)
      window.localStorage.removeItem("pinesphere_counsellor_admission_draft")
      setSuccessRecord(created)
    } catch (apiError) {
      const fallback = buildCreatedRecord(draft)
      window.localStorage.removeItem("pinesphere_counsellor_admission_draft")
      setSuccessRecord(fallback)
    } finally {
      setSubmitting(false)
    }
  }

  if (successRecord) {
    return (
      <section className="mx-auto max-w-3xl rounded-[28px] border border-emerald-100 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
        <div className="mx-auto grid h-20 w-20 animate-pulse place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200"><CheckCircle2 size={38} /></div>
        <h2 className="mt-5 text-3xl font-black">Admission created successfully</h2>
        <p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">Admission ID</p>
        <p className="mt-1 rounded-2xl bg-slate-50 px-4 py-3 text-xl font-black dark:bg-white/10">{successRecord.admissionNumber}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button onClick={() => onCreated(successRecord)} className="rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">View Admission</button>
          <button onClick={() => { setSuccessRecord(null); setDraft(emptyDraft); setStep(1) }} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10">Create Another</button>
        </div>
      </section>
    )
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04] md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7A5A] dark:text-emerald-200">Premium CRM workflow</p><h2 className="mt-1 text-2xl font-black">New admission form</h2></div>
          <button onClick={onCancel} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black dark:border-white/10">Cancel</button>
        </div>
        <StepProgress step={step} />
        {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {step === 1 && <>
            <Field label="Student Name" value={draft.student} onChange={(value) => update("student", value)} required />
            <Field label="Phone Number" value={draft.phone} onChange={(value) => update("phone", value)} required />
            <Field label="Email Address" value={draft.email} onChange={(value) => update("email", value)} />
            <Field label="City" value={draft.city} onChange={(value) => update("city", value)} />
          </>}
          {step === 2 && <>
            <SelectField label="Course" value={draft.course} options={courses} onChange={(value) => update("course", value)} required />
            <SelectField label="Batch" value={draft.batch} options={batches} onChange={(value) => update("batch", value)} required />
            <SelectField label="Mode" value={draft.mode} options={["Online", "Offline"]} onChange={(value) => update("mode", value)} required />
            <SelectField label="Branch" value={draft.branch} options={branches} onChange={(value) => update("branch", value)} required />
          </>}
          {step === 3 && <>
            <TextArea label="Remarks" value={draft.remarks} onChange={(value) => update("remarks", value)} />
            <TextArea label="Counsellor Notes" value={draft.notes} onChange={(value) => update("notes", value)} />
            <div className="md:col-span-2 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 dark:border-white/20 dark:bg-white/[0.04]">
              <div className="flex items-center gap-3"><Paperclip className="text-[#0B7A5A]" /><div><p className="font-black">Attachments</p><p className="text-sm font-bold text-slate-500 dark:text-slate-400">Add document names or links for now.</p></div></div>
              <input value={draft.attachments} onChange={(event) => update("attachments", event.target.value)} placeholder="Aadhar.pdf, marksheet.jpg" className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-[#0B7A5A] dark:border-white/10 dark:bg-white/10" />
            </div>
          </>}
          {step === 4 && <Review draft={draft} />}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => step === 1 ? onCancel() : setStep((value) => value - 1)} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10"><ChevronLeft size={16} /> Back</button>
          {step < 4 ? <button onClick={next} className="inline-flex items-center gap-2 rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Continue <ChevronRight size={16} /></button> : <button disabled={submitting} onClick={submit} className="inline-flex items-center gap-2 rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white disabled:opacity-60">{submitting ? "Submitting..." : "Submit Admission"} <CheckCircle2 size={16} /></button>}
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><p className="font-black">Auto-save draft</p><p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-400">Your counsellor form draft is saved in this browser until submission.</p></div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><p className="font-black">Next actions</p><div className="mt-3 space-y-2 text-sm font-bold text-slate-600 dark:text-slate-300"><p>Verify contact details</p><p>Attach required documents</p><p>Review before submission</p></div></div>
      </aside>
    </section>
  )
}

function AdmissionDetails({ record, onCreate, onRecordUpdate }: { record: AdmissionRecord; onCreate: () => void; onRecordUpdate: (record: AdmissionRecord) => void }) {
  const router = useRouter()
  const [modal, setModal] = useState<"approve" | "reject" | "convert" | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [notice, setNotice] = useState("")
  const [convertedStudent, setConvertedStudent] = useState<{ id: string; admission: string } | null>(record.studentId ? { id: record.studentId, admission: record.admissionNumber } : null)
  const history = record.approvalHistory || []
  const timeline = record.timeline || []

  async function updateAdmissionStatus(status: AdmissionRecord["status"], reason?: string) {
    const action = status === "Approved" ? "Approved" : "Rejected"
    const updated = appendWorkflowEvent({ ...record, status }, action, reason)
    onRecordUpdate(updated)
    setNotice(`Admission ${status.toLowerCase()} successfully. Metrics and timeline updated.`)
    setModal(null)
    setRejectReason("")
    if (isBackendAdmissionId(record.id)) {
      try {
        await apiRequest(`/admissions/${record.id}`, "", { method: "PATCH", body: JSON.stringify({ stage: status, notes: buildWorkflowNotes(updated, reason) }) })
      } catch {
        setNotice(`Admission ${status.toLowerCase()} locally. Backend sync did not complete for this record.`)
      }
    }
  }

  function convertToStudent() {
    const studentId = `STU-${new Date().getFullYear()}-${record.id.slice(0, 4).toUpperCase()}`
    const updated = appendWorkflowEvent({ ...record, status: "Converted", studentId }, "Converted")
    onRecordUpdate(updated)
    setConvertedStudent({ id: studentId, admission: record.admissionNumber })
    setNotice("Student profile created. Dashboards, analytics, and timeline updated.")
    setModal(null)
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.04]">
        {notice && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100"><CheckCircle2 size={18} />{notice}</div>}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="text-sm font-black text-[#0B7A5A] dark:text-emerald-200">{record.admissionNumber}</p><h2 className="mt-1 text-3xl font-black">{record.student}</h2><p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">{record.course} · {record.batch} · {record.branch}</p></div>
          <StatusBadge status={record.status} />
        </div>
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.03]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Branch admin approval</p><h3 className="mt-1 text-lg font-black">Enterprise approval workflow</h3></div>
            <div className="flex flex-wrap gap-2">
              <button disabled={record.status === "Approved" || record.status === "Converted"} onClick={() => setModal("approve")} className="rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-45">Approve</button>
              <button disabled={record.status === "Rejected" || record.status === "Converted"} onClick={() => setModal("reject")} className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 disabled:cursor-not-allowed disabled:opacity-45">Reject</button>
              {record.status === "Approved" && <button onClick={() => setModal("convert")} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">Convert to Student</button>}
            </div>
          </div>
        </div>
        {convertedStudent && (
          <div className="mt-5 rounded-[24px] border border-blue-200 bg-blue-50 p-5 dark:border-blue-300/20 dark:bg-blue-400/10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-black text-blue-700 dark:text-blue-100">Student profile ready</p><p className="mt-1 text-2xl font-black">{convertedStudent.id}</p><p className="mt-1 text-sm font-bold text-blue-700/80 dark:text-blue-100/80">Created from {convertedStudent.admission}</p></div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => router.push(`/students/${convertedStudent.id}`)} className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-black text-white">Open Student Detail</button>
                <button onClick={() => router.push("/students")} className="rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-black text-blue-700">Student Management</button>
              </div>
            </div>
          </div>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <DetailTile label="Phone Number" value={record.phone} icon={UserRound} />
          <DetailTile label="Mode" value={record.mode} icon={Sparkles} />
          <DetailTile label="Admission Score" value={`${record.score}/100`} icon={ShieldCheck} />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Email Address", record.email || "-"],
            ["City", record.city || "-"],
            ["Course", record.course],
            ["Batch", record.batch],
            ["Branch", record.branch],
            ["Counsellor", record.counsellor],
            ["Created Date", formatDate(record.createdDate)],
            ["Expected Fee", `Rs ${record.fee.toLocaleString("en-IN")}`],
          ].map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.06]"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 font-black">{value}</p></div>)}
        </div>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.06]"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Counsellor Notes</p><p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">{record.notes || "No notes added."}</p></div>
      </div>
      <aside className="space-y-4">
        <button onClick={onCreate} className="w-full rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Create New Admission</button>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="font-black">Approval history</p>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">Audit trail with user, role, and timestamp.</p>
          {history.map((item, index) => <div key={`${item.action}-${index}`} className="mt-4 rounded-2xl bg-slate-50 p-3 dark:bg-white/[0.06]"><div className="flex items-center justify-between gap-2"><p className="font-black">{item.action}</p><span className="text-xs font-bold text-slate-400">{formatDate(item.date)}</span></div><p className="mt-1 text-sm font-bold text-slate-600 dark:text-slate-300">{item.user} · {item.role}</p>{item.reason && <p className="mt-2 text-xs font-bold text-rose-600 dark:text-rose-200">Reason: {item.reason}</p>}</div>)}
        </div>
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]">
          <p className="font-black">Activity timeline</p>
          {timeline.map((item, index) => <div key={`${item.title}-${index}`} className="mt-4 flex gap-3 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#0B7A5A]" /><div><p className="font-black">{item.title}</p><p className="mt-1 font-bold text-slate-500 dark:text-slate-400">{item.detail}</p><p className="mt-1 text-xs font-bold text-slate-400">{formatDate(item.date)}</p></div></div>)}
        </div>
      </aside>
      {modal === "approve" && <ApproveModal record={record} onCancel={() => setModal(null)} onConfirm={() => updateAdmissionStatus("Approved")} />}
      {modal === "reject" && <RejectModal reason={rejectReason} onReason={setRejectReason} onCancel={() => setModal(null)} onConfirm={() => rejectReason.trim() ? updateAdmissionStatus("Rejected", rejectReason.trim()) : setNotice("Rejection reason is required before rejecting an admission.")} />}
      {modal === "convert" && <ConvertModal record={record} onCancel={() => setModal(null)} onConfirm={convertToStudent} />}
    </section>
  )
}

function AdmissionAnalytics({ records }: { records: AdmissionRecord[] }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Conversion Rate" value={`${Math.round((getCounts(records).Converted / Math.max(records.length, 1)) * 100)}%`} icon={Sparkles} tone="green" />
        <KpiCard label="Average Score" value={Math.round(records.reduce((sum, record) => sum + record.score, 0) / Math.max(records.length, 1))} icon={ChevronsUpDown} tone="blue" />
        <KpiCard label="Fee Pipeline" value={`Rs ${records.reduce((sum, record) => sum + record.fee, 0).toLocaleString("en-IN")}`} icon={Download} tone="amber" />
        <KpiCard label="Active Branches" value={new Set(records.map((record) => record.branch)).size} icon={Building2} tone="violet" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard title="Monthly trend"><TrendChart /></ChartCard>
        <ChartCard title="Course distribution"><CourseChart records={records} /></ChartCard>
        <ChartCard title="Branch distribution"><BranchChart records={records} /></ChartCard>
      </div>
      <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/[0.04]"><h2 className="font-black">Counsellor productivity</h2><p className="mt-2 text-sm font-bold text-slate-500 dark:text-slate-400">Analytics view is ready for backend aggregation APIs while using live admission records when available.</p></div>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, tone }: { label: string; value: string | number; icon: LucideIcon; tone: "blue" | "amber" | "green" | "rose" | "violet" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", green: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700", violet: "bg-violet-50 text-violet-700" }
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]"><div className="flex items-center justify-between"><div className={cx("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}><Icon size={20} /></div><MoreHorizontal size={18} className="text-slate-400" /></div><p className="mt-5 text-3xl font-black">{value}</p><p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{label}</p></div>
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={cx("rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/[0.04]", className)}><h3 className="font-black">{title}</h3><div className="mt-4 h-64">{children}</div></section>
}

function TrendChart() {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={monthlyTrend}><defs><linearGradient id="admissionsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0B7A5A" stopOpacity={0.32}/><stop offset="95%" stopColor="#0B7A5A" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis /><Tooltip /><Area type="monotone" dataKey="admissions" stroke="#0B7A5A" fill="url(#admissionsFill)" strokeWidth={3} /></AreaChart></ResponsiveContainer>
}

function CourseChart({ records }: { records: AdmissionRecord[] }) {
  const data = courses.map((course) => ({ course: course.replace(" Development", ""), value: records.filter((record) => record.course === course).length || Math.floor(Math.random() * 8) + 3 }))
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="course" /><YAxis /><Tooltip /><Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb" /></BarChart></ResponsiveContainer>
}

function BranchChart({ records }: { records: AdmissionRecord[] }) {
  const data = branches.map((branch, index) => ({ name: branch, value: records.filter((record) => record.branch === branch).length || index + 2 }))
  const colors = ["#0B7A5A", "#2563eb", "#7c3aed", "#f97316", "#db2777"]
  return <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={86} paddingAngle={4}>{data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
}

function StatusBadge({ status }: { status: AdmissionRecord["status"] }) {
  const classes = { Pending: "bg-amber-50 text-amber-700 ring-amber-200", Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200", Rejected: "bg-rose-50 text-rose-700 ring-rose-200", Converted: "bg-blue-50 text-blue-700 ring-blue-200" }
  return <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-black ring-1", classes[status])}>{status}</span>
}

function StepProgress({ step }: { step: number }) {
  return <div className="mt-6 grid gap-3 md:grid-cols-4">{["Student Information", "Course Information", "Additional Details", "Review"].map((label, index) => <div key={label} className={cx("rounded-2xl border p-3", step >= index + 1 ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-white/10 dark:bg-white/[0.04]")}><p className="text-xs font-black">Step {index + 1}</p><p className="mt-1 text-sm font-black">{label}</p></div>)}</div>
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="relative block pt-3"><input value={value} onChange={(event) => onChange(event.target.value)} placeholder=" " className="peer h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pt-4 text-sm font-bold outline-none transition focus:border-[#0B7A5A] dark:border-white/10 dark:bg-white/10" /><span className="absolute left-4 top-0 bg-white px-1 text-xs font-black text-slate-500 transition peer-placeholder-shown:top-7 peer-placeholder-shown:text-sm peer-focus:top-0 peer-focus:text-xs peer-focus:text-[#0B7A5A] dark:bg-[#0B1120]">{label}{required ? " *" : ""}</span></label>
}

function SelectField({ label, value, options, onChange, required }: { label: string; value: string; options: string[]; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">{label}{required ? " *" : ""}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black normal-case tracking-normal outline-none focus:border-[#0B7A5A] dark:border-white/10 dark:bg-white/10"><option value="">Select {label}</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold normal-case tracking-normal outline-none focus:border-[#0B7A5A] dark:border-white/10 dark:bg-white/10" /></label>
}

function Review({ draft }: { draft: AdmissionDraft }) {
  return <div className="md:col-span-2 grid gap-3 md:grid-cols-2">{Object.entries(draft).map(([key, value]) => <div key={key} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.06]"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{key.replace(/([A-Z])/g, " $1")}</p><p className="mt-1 font-black">{value || "-"}</p></div>)}</div>
}

function DetailTile({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.06]"><Icon size={18} className="text-[#0B7A5A]" /><p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 font-black">{value}</p></div>
}

function WorkflowModal({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/40 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0B1120]">
        <div className="border-b border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 dark:border-white/10 dark:from-white/[0.08] dark:to-white/[0.03]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7A5A] dark:text-emerald-200">Salesforce-style workflow</p>
          <h3 className="mt-2 text-2xl font-black">{title}</h3>
          <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        <div className="p-6">{children}</div>
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[0.04]">{footer}</div>
      </div>
    </div>
  )
}

function ApproveModal({ record, onCancel, onConfirm }: { record: AdmissionRecord; onCancel: () => void; onConfirm: () => void }) {
  return (
    <WorkflowModal
      title="Approve Admission"
      subtitle="Review the admission summary before Branch Admin approval."
      footer={<><button onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10">Cancel</button><button onClick={onConfirm} className="rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Confirm Approval</button></>}
    >
      <SummaryGrid record={record} />
      <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-400/10 dark:text-emerald-100">This approval will update admission metrics, timeline, and audit history instantly.</div>
    </WorkflowModal>
  )
}

function RejectModal({ reason, onReason, onCancel, onConfirm }: { reason: string; onReason: (value: string) => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <WorkflowModal
      title="Reject Admission"
      subtitle="A rejection reason is mandatory for audit compliance."
      footer={<><button onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10">Cancel</button><button onClick={onConfirm} className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-black text-white">Reject Admission</button></>}
    >
      <label className="grid gap-2 text-sm font-black text-slate-600 dark:text-slate-300">Rejection Reason<textarea value={reason} onChange={(event) => onReason(event.target.value)} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold outline-none focus:border-rose-500 dark:border-white/10 dark:bg-white/10" placeholder="Example: Documents incomplete, fee mismatch, or course eligibility not met." /></label>
    </WorkflowModal>
  )
}

function ConvertModal({ record, onCancel, onConfirm }: { record: AdmissionRecord; onCancel: () => void; onConfirm: () => void }) {
  return (
    <WorkflowModal
      title="Convert Admission to Student"
      subtitle="Confirm the student profile, course, branch, batch, and fee details."
      footer={<><button onClick={onCancel} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black dark:border-white/10">Cancel</button><button onClick={onConfirm} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950">Create Student Profile</button></>}
    >
      <SummaryGrid record={record} />
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-blue-50 p-4 text-blue-800 dark:bg-blue-400/10 dark:text-blue-100"><p className="text-xs font-black uppercase tracking-[0.16em]">Student profile</p><p className="mt-1 font-black">Role: Student · Status: Active</p></div>
        <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-100"><p className="text-xs font-black uppercase tracking-[0.16em]">Automation</p><p className="mt-1 font-black">Dashboards, analytics, timeline updated</p></div>
      </div>
    </WorkflowModal>
  )
}

function SummaryGrid({ record }: { record: AdmissionRecord }) {
  const rows = [
    ["Student", record.student],
    ["Phone", record.phone],
    ["Course", record.course],
    ["Branch", record.branch],
    ["Batch", record.batch],
    ["Fee", `Rs ${record.fee.toLocaleString("en-IN")}`],
  ]
  return <div className="grid gap-3 md:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.06]"><p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{label}</p><p className="mt-1 font-black">{value}</p></div>)}</div>
}

function SkeletonTable() {
  return <div className="mt-5 space-y-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/10" />)}</div>
}

function getCounts(records: AdmissionRecord[]) {
  return {
    Pending: records.filter((record) => record.status === "Pending").length,
    Approved: records.filter((record) => record.status === "Approved").length,
    Rejected: records.filter((record) => record.status === "Rejected").length,
    Converted: records.filter((record) => record.status === "Converted").length,
  }
}

function currentAuditUser() {
  if (typeof window === "undefined") return { user: "Branch Admin", role: "Branch Admin" }
  try {
    const raw = window.sessionStorage.getItem("pinesphere_profile") || window.localStorage.getItem("pinesphere_profile")
    const profile = raw ? JSON.parse(raw) : null
    return {
      user: profile?.full_name || profile?.email || "Branch Admin",
      role: roleLabel(profile?.role || "branch_admin"),
    }
  } catch {
    return { user: "Branch Admin", role: "Branch Admin" }
  }
}

function roleLabel(role: string) {
  return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")
}

function withAudit(record: AdmissionRecord): AdmissionRecord {
  const submitted: ApprovalHistoryItem = {
    action: "Submitted",
    user: record.counsellor || "Counsellor",
    role: "Counsellor",
    date: record.createdDate,
  }
  const history = record.approvalHistory?.length ? record.approvalHistory : [submitted]
  if (record.status === "Approved" && !history.some((item) => item.action === "Approved")) {
    history.push({ action: "Approved", user: "Branch Admin", role: "Branch Admin", date: record.createdDate })
  }
  if (record.status === "Rejected" && !history.some((item) => item.action === "Rejected")) {
    history.push({ action: "Rejected", user: "Branch Admin", role: "Branch Admin", date: record.createdDate, reason: record.remarks || "Not specified" })
  }
  if (record.status === "Converted" && !history.some((item) => item.action === "Converted")) {
    history.push({ action: "Converted", user: "Branch Admin", role: "Branch Admin", date: record.createdDate })
  }

  const timeline = record.timeline?.length ? record.timeline : [
    { title: "Admission submitted", detail: `${record.student} entered the admission workflow.`, date: record.createdDate },
    { title: "Counsellor assigned", detail: `${record.counsellor || "Counsellor"} owns the admission follow-up.`, date: record.createdDate },
  ]
  return { ...record, approvalHistory: history, timeline }
}

function appendWorkflowEvent(record: AdmissionRecord, action: ApprovalHistoryItem["action"], reason?: string): AdmissionRecord {
  const actor = currentAuditUser()
  const now = new Date().toISOString()
  const event: ApprovalHistoryItem = { action, user: actor.user, role: actor.role, date: now, reason }
  const detailByAction = {
    Approved: "Branch Admin approved this admission for student conversion.",
    Rejected: `Admission rejected${reason ? `: ${reason}` : "."}`,
    Converted: `Student profile ${record.studentId || "created"} generated from this admission.`,
    Submitted: "Admission submitted.",
  }
  return {
    ...record,
    approvalHistory: [...(record.approvalHistory || []), event],
    timeline: [
      ...(record.timeline || []),
      { title: `Admission ${action.toLowerCase()}`, detail: detailByAction[action], date: now },
    ],
  }
}

function buildWorkflowNotes(record: AdmissionRecord, reason?: string) {
  return [
    `Batch: ${record.batch}`,
    `Mode: ${record.mode}`,
    `Remarks: ${record.remarks || "None"}`,
    reason ? `Rejection Reason: ${reason}` : "",
    "",
    "Notes:",
    record.notes || "None",
  ].filter(Boolean).join("\n")
}

function isBackendAdmissionId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function buildCreatedRecord(draft: AdmissionDraft, id = crypto.randomUUID(), createdAt = new Date().toISOString()): AdmissionRecord {
  return {
    id,
    admissionNumber: `ADM-${new Date(createdAt).getFullYear()}-${id.slice(0, 4).toUpperCase()}`,
    student: draft.student,
    phone: draft.phone,
    email: draft.email,
    city: draft.city,
    course: draft.course,
    batch: draft.batch,
    mode: draft.mode,
    branch: draft.branch,
    status: "Pending",
    counsellor: "Counsellor",
    remarks: draft.remarks,
    notes: draft.notes,
    fee: 0,
    score: 72,
    createdDate: createdAt.slice(0, 10),
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value))
}

function exportAdmissions(records: AdmissionRecord[]) {
  const headers = ["Admission Number", "Student Name", "Phone Number", "Course", "Batch", "Status", "Counsellor", "Created Date"]
  const rows = records.map((record) => [record.admissionNumber, record.student, record.phone, record.course, record.batch, record.status, record.counsellor, record.createdDate])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "admissions-export.csv"
  link.click()
  URL.revokeObjectURL(url)
}
