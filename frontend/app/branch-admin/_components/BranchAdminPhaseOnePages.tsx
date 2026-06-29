"use client"

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings2,
  ShieldCheck,
  Table2,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { API_URL, getStoredSessionValue } from "@/lib/api"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { changeProfilePassword, loadProfileSettings, type ProfileApiResponse } from "@/lib/api/settingsProfile"
import { readBranchAdminSession, storeBranchAdminPreferences } from "./BranchAdminShell"
import { BranchAdminSelect } from "./BranchAdminSelect"
import {
  assignTrainer,
  collectFee,
  createBatch,
  getBatches,
  getBranchSettings,
  getBranchSettingsUsers,
  getFeeReceipts,
  getFeeDefaulters,
  getFeeEmi,
  getFeeLedger,
  getFeesOverview,
  getInvoices,
  getPendingFees,
  getPayments,
  getReports,
  getStudents,
  transferBatchStudent,
  updateBatch,
  updateBranchSettings,
  updateBranchSettingsUserStatus,
  type BatchRecord,
  type BranchSettings,
  type BranchUserRecord,
  type DefaulterFeeRecord,
  type EmiRecord,
  type FeeReceiptRecord,
  type FeeLedgerRecord,
  type FeesOverview,
  type InvoiceRecord,
  type PendingFeeRecord,
  type StudentRecord,
  downloadFeeReceiptPdf,
  downloadFeeReceiptsReport,
  downloadFeeEmiReport,
  downloadFeeDefaultersReport,
  downloadPendingFeesReport,
} from "@/lib/api/branchAdmin"
import { getCourseOptions, getModeOptions, getPaymentMethodOptions, getStudentOptions, getTrainerOptions, type CourseOption, type ModeOption, type PaymentMethodOption, type TrainerOption } from "@/lib/api/branchAdminOptions"
import { resolveBranchScope } from "@/lib/api/branchAdminData"

type BatchRow = {
  batch: string
  course: string
  trainer: string
  capacity: number
  enrolled: number
  schedule: string
}

type BatchStatus = "Full" | "Scheduled" | "Active" | "Completed" | "Schedule Pending"
type BatchQuickFilter = "All" | Exclude<BatchStatus, "Completed">
type ScheduleForm = {
  days: string[]
  startTime: string
  endTime: string
  classroom: string
}
type TrainerWorkload = {
  assignedBatches: number
  studentsManaged: number
  totalCapacity: number
  occupancy: number
}

const scheduleDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const batches: BatchRow[] = [
  { batch: "FSD Morning", course: "Full Stack Development", trainer: "Meera Nair", capacity: 45, enrolled: 42, schedule: "Mon-Fri · 9:00 AM" },
  { batch: "DS Weekend", course: "Data Science", trainer: "Rahul Kumar", capacity: 40, enrolled: 36, schedule: "Sat-Sun · 10:00 AM" },
  { batch: "UX Evening", course: "UI/UX Design", trainer: "Anitha Raj", capacity: 35, enrolled: 31, schedule: "Mon-Wed-Fri · 6:00 PM" },
  { batch: "Cyber Security", course: "Cyber Security", trainer: "Vishal Menon", capacity: 30, enrolled: 24, schedule: "Tue-Thu · 7:00 PM" },
]

const reports = [
  { name: "Admissions Report", module: "Admissions", format: "PDF / Excel / CSV", updated: "Today" },
  { name: "Student Report", module: "Students", format: "PDF / Excel / CSV", updated: "Today" },
  { name: "Attendance Report", module: "Attendance", format: "PDF / Excel / CSV", updated: "Yesterday" },
  { name: "Fee Report", module: "Fees", format: "PDF / Excel / CSV", updated: "Today" },
  { name: "Batch Report", module: "Batch", format: "PDF / Excel / CSV", updated: "2 days ago" },
]

const users = [
  { name: "Meera Nair", role: "Trainer", status: "Active" },
  { name: "Rahul Kumar", role: "Trainer", status: "Active" },
  { name: "Priya Menon", role: "Counsellor", status: "Active" },
  { name: "Anitha Raj", role: "Trainer", status: "Review" },
]

function useBranchScope() {
  const session = useMemo(() => readBranchAdminSession(), [])
  return useMemo(() => session?.branch ?? resolveBranchScope(), [session])
}

export function BranchAdminBatchPage() {
  const branch = useBranchScope()
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [users, setUsers] = useState<BranchUserRecord[]>([])
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [trainers, setTrainers] = useState<TrainerOption[]>([])
  const [modes, setModes] = useState<ModeOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [modal, setModal] = useState<"create" | "edit" | "trainer" | "transfer" | null>(null)
  const [selectedBatchKey, setSelectedBatchKey] = useState("")
  const [detailBatchKey, setDetailBatchKey] = useState("")
  const [directoryView, setDirectoryView] = useState<"table" | "card">("card")
  const [timetableView, setTimetableView] = useState("Weekly View")
  const [search, setSearch] = useState("")
  const [courseFilter, setCourseFilter] = useState("")
  const [trainerFilter, setTrainerFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"" | BatchStatus>("")
  const [modeFilter, setModeFilter] = useState("")
  const [quickFilter, setQuickFilter] = useState<BatchQuickFilter>("All")

  const filteredBatches = useMemo(() => {
    const query = search.trim().toLowerCase()
    return batches.filter((batch) => {
      const status = getBatchStatus(batch)
      const courseName = batch.course_title ?? batch.course
      const trainerName = batch.trainer
      const mode = batch.mode ?? "Offline"
      const matchesSearch = !query || batchDisplayName(batch).toLowerCase().includes(query)
      const matchesCourse = !courseFilter || batch.course_id === courseFilter || courseName === courseFilter
      const matchesTrainer = !trainerFilter || batch.trainer_id === trainerFilter || trainerName === trainerFilter
      const matchesStatus = !statusFilter || status === statusFilter
      const matchesMode = !modeFilter || mode === modeFilter
      const matchesQuickFilter = quickFilter === "All" || status === quickFilter
      return matchesSearch && matchesCourse && matchesTrainer && matchesStatus && matchesMode && matchesQuickFilter
    })
  }, [batches, courseFilter, modeFilter, quickFilter, search, statusFilter, trainerFilter])

  const batchKpis = useMemo(() => {
    const trainerAssignments = batches.filter((batch) => Boolean(batch.trainer_id || batch.trainer || batch.trainers?.length)).length
    return [
      { label: "Total Batches", value: batches.length, tone: "blue" as const, icon: Table2 },
      { label: "Active Batches", value: batches.filter((batch) => getBatchStatus(batch) === "Active").length, tone: "green" as const, icon: CheckCircle2 },
      { label: "Students Enrolled", value: batches.reduce((sum, batch) => sum + enrolledCount(batch), 0), tone: "blue" as const, icon: Users },
      { label: "Available Seats", value: batches.reduce((sum, batch) => sum + getAvailableSeats(batch), 0), tone: "green" as const, icon: ShieldCheck },
      { label: "Trainer Assignments", value: trainerAssignments, tone: "blue" as const, icon: UserCheck },
      { label: "Schedule Pending", value: batches.filter((batch) => getScheduleStatus(batch) === "Schedule Pending").length, tone: "orange" as const, icon: Clock3 },
    ]
  }, [batches])

  const statusOptions: BatchStatus[] = ["Active", "Scheduled", "Completed", "Full", "Schedule Pending"]
  const detailBatch = batches.find((batch) => batchKey(batch) === detailBatchKey)

  function clearBatchFilters() {
    setSearch("")
    setCourseFilter("")
    setTrainerFilter("")
    setStatusFilter("")
    setModeFilter("")
    setQuickFilter("All")
  }

  function openEditBatch(batch: BatchRecord) {
    setSelectedBatchKey(batchKey(batch))
    setDetailBatchKey("")
    setModal("edit")
  }

  function openAssignTrainer(batch: BatchRecord) {
    setSelectedBatchKey(batchKey(batch))
    setDetailBatchKey("")
    setModal("trainer")
  }

  function openTransferStudents(batch: BatchRecord) {
    setSelectedBatchKey(batchKey(batch))
    setDetailBatchKey("")
    setModal("transfer")
  }

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  async function loadBatchData() {
    setLoading(true)
    try {
      const rows = await getBatches()
      setBatches(rows)
      setError("")
      setLoading(false)

      const [studentRows, userRows, courseRows, trainerRows, modeRows] = await Promise.allSettled([getStudents(), getBranchSettingsUsers(), getCourseOptions(), getTrainerOptions(), getModeOptions()])
      if (studentRows.status === "fulfilled") setStudents(studentRows.value)
      if (userRows.status === "fulfilled") setUsers(userRows.value)
      if (courseRows.status === "fulfilled") setCourses(courseRows.value)
      if (trainerRows.status === "fulfilled") setTrainers(trainerRows.value)
      if (modeRows.status === "fulfilled") setModes(modeRows.value)
    } catch (err) {
      setBatches([])
      setError(`Live API unavailable: ${formatErrorMessage(err)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBatchData()
  }, [])

  return (
    <div className="space-y-4">
      <PageHeader title="Batch Management" subtitle={`Manage branch batches, trainer assignment, capacity, and timetable views for ${branch.branch_name}.`} action="Create Batch" onAction={() => setModal("create")} />
      {error ? <ApiState loading={false} error={error} /> : null}
      {loading ? <BatchSkeleton /> : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {batchKpis.map((item) => (
          <Metric key={item.label} label={item.label} value={String(item.value)} icon={item.icon} tone={item.tone} />
        ))}
      </section>
      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-grid grid-cols-2 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] p-1">
            <button type="button" onClick={() => setDirectoryView("table")} className={`h-9 rounded-md px-3 text-xs font-black transition ${directoryView === "table" ? "bg-white text-[#0B7A5A] shadow-sm" : "text-[#071B4A] hover:text-[#0B7A5A]"}`}>Table View</button>
            <button type="button" onClick={() => setDirectoryView("card")} className={`h-9 rounded-md px-3 text-xs font-black transition ${directoryView === "card" ? "bg-[#0B7A5A] text-white shadow-sm" : "text-[#071B4A] hover:text-[#0B7A5A]"}`}>Card View</button>
          </div>
          <button type="button" onClick={clearBatchFilters} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:text-[#0B7A5A]">Clear Filters</button>
        </div>
        <div className="grid gap-3 xl:grid-cols-[1.2fr_repeat(4,minmax(130px,0.65fr))]">
          <label className="grid gap-1 text-xs font-black uppercase text-[#64748B]">
            Search Batch Name
            <span className="flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-3 text-sm font-bold text-[#071B4A]">
              <Search size={16} className="text-[#0B7A5A]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Batch Name" className="min-w-0 flex-1 bg-transparent text-sm font-bold text-[#071B4A] outline-none placeholder:text-[#94A3B8]" />
            </span>
          </label>
          <BranchAdminSelect label="Course" value={courseFilter} onChange={setCourseFilter} placeholder="Course: All" clearable options={courses.map((item) => ({ label: item.label, value: item.id }))} loading={loading && !courses.length} />
          <BranchAdminSelect label="Trainer" value={trainerFilter} onChange={setTrainerFilter} placeholder="Trainer: All" clearable options={trainers.map((item) => ({ label: item.label, value: item.id }))} loading={loading && !trainers.length} />
          <BranchAdminSelect label="Status" value={statusFilter} onChange={(value) => setStatusFilter(value as "" | BatchStatus)} placeholder="Status: All" clearable options={statusOptions.map((item) => ({ label: item, value: item }))} />
          <BranchAdminSelect label="Mode" value={modeFilter} onChange={setModeFilter} placeholder="Mode: All" clearable options={(modes.length ? modes.map((item) => ({ label: item.label, value: item.value })) : ["Online", "Offline", "Hybrid"].map((item) => ({ label: item, value: item })))} loading={loading && !modes.length} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["All", "Active", "Scheduled", "Full", "Schedule Pending"] as BatchQuickFilter[]).map((item) => (
            <button key={item} type="button" onClick={() => setQuickFilter(item)} className={`h-9 rounded-lg border px-3 text-xs font-black transition ${quickFilter === item ? "border-[#0B7A5A] bg-[#E8F6F0] text-[#0B7A5A]" : "border-[#DDE9E4] bg-[#FBFDFC] text-[#071B4A] hover:border-[#0B7A5A]"}`}>
              {item}
            </button>
          ))}
        </div>
      </section>
      {directoryView === "card" ? (
        <BatchCardGrid
          batches={filteredBatches}
          hasBatches={Boolean(batches.length)}
          loading={loading}
          onView={(batch) => setDetailBatchKey(batchKey(batch))}
          onEdit={openEditBatch}
          onAssignTrainer={openAssignTrainer}
          onTransferStudents={openTransferStudents}
          onClearFilters={clearBatchFilters}
          onCreate={() => setModal("create")}
        />
      ) : (
        <BatchCompactList
          batches={filteredBatches}
          hasBatches={Boolean(batches.length)}
          loading={loading}
          onView={(batch) => setDetailBatchKey(batchKey(batch))}
          onEdit={openEditBatch}
          onAssignTrainer={openAssignTrainer}
          onTransferStudents={openTransferStudents}
          onClearFilters={clearBatchFilters}
          onCreate={() => setModal("create")}
        />
      )}
      <BatchTimetablePanel viewMode={timetableView} onViewModeChange={setTimetableView} />
      <QuickStrip actions={["Edit Batch", "Assign Trainer", "Transfer Students", "Export Timetable"]} onAction={(action) => {
        if (action === "Edit Batch") setModal("edit")
        if (action === "Assign Trainer") setModal("trainer")
        if (action === "Transfer Students") setModal("transfer")
        if (action === "Export Timetable") {
          if (!batches.length) return showToast("No timetable data to export.")
          downloadCsv("branch_timetable.csv", ["Batch", "Course", "Trainer", "Capacity", "Enrolled", "Schedule", "Mode"], batches.map((batch) => [batchDisplayName(batch), batch.course_title ?? batch.course, batch.trainer, batch.capacity, batch.enrolled, batch.schedule, batch.mode || "Offline"]))
          showToast("Export downloaded successfully.")
        }
      }} />
      {modal === "create" ? <BatchFormModal title="Create Batch" courses={courses} trainers={trainers} modes={modes} onClose={() => setModal(null)} onSave={async (payload) => { await createBatch(payload); await loadBatchData(); setModal(null); showToast("Batch saved successfully.") }} /> : null}
      {modal === "edit" ? <BatchEditModal batches={batches} courses={courses} trainers={trainers} modes={modes} initialBatchKey={selectedBatchKey} onClose={() => setModal(null)} onSave={async (batch, payload) => { await updateBatch(batch, payload); await loadBatchData(); setModal(null); showToast("Batch updated successfully.") }} /> : null}
      {modal === "trainer" ? <AssignTrainerModal batches={batches} trainers={trainers} initialBatchKey={selectedBatchKey} onClose={() => setModal(null)} onSave={async (payload) => { await assignTrainer(payload); await loadBatchData(); setModal(null); showToast("Trainer assigned successfully.") }} /> : null}
      {modal === "transfer" ? <TransferStudentModal batches={batches} students={students} initialBatchKey={selectedBatchKey} onClose={() => setModal(null)} onSave={async (source, payload) => { await transferBatchStudent(source, payload); await loadBatchData(); setModal(null); showToast("Student transferred successfully.") }} /> : null}
      {detailBatch ? <BatchDetailDrawer batch={detailBatch} onClose={() => setDetailBatchKey("")} onEdit={() => openEditBatch(detailBatch)} onAssignTrainer={() => openAssignTrainer(detailBatch)} onManageStudents={() => openTransferStudents(detailBatch)} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

export function BranchAdminReportsPage() {
  const branch = useBranchScope()
  const [module, setModule] = useState("All")
  const [course, setCourse] = useState("")
  const [batch, setBatch] = useState("")
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [reportRows, setReportRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const filtered = useMemo(() => module === "All" ? reports : reports.filter((report) => report.module === module), [module])

  useEffect(() => {
    const reportType = module === "All" ? "students" : module.toLowerCase()
    setLoading(true)
    Promise.all([getReports(reportType === "batch" ? "batches" : reportType), getCourseOptions(), getBatches()])
      .then(([payload, courseRows, batchRows]) => {
        setReportRows(Array.isArray(payload.rows) ? payload.rows as Record<string, unknown>[] : [])
        setCourses(courseRows)
        setBatches(batchRows)
        setError("")
      })
      .catch((err: Error) => {
        setReportRows([])
        setError(`Live API unavailable: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [module])

  return (
    <div className="space-y-4">
      <PageHeader title="Reports" subtitle={`Generate admissions, student, attendance, fee, and batch reports for ${branch.branch_name}.`} action="Export Report" />
      <ApiState loading={loading} error={error} />
      <section className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px_auto]">
        <BranchAdminSelect label="Module" value={module} onChange={setModule} options={["All", "Admissions", "Students", "Attendance", "Fees", "Batch"].map((item) => ({ label: item, value: item }))} />
        <input type="date" className="h-11 rounded-lg border border-[#DDE9E4] bg-white px-3 text-sm font-black text-[#071B4A]" />
        <BranchAdminSelect label="Course" value={course} onChange={setCourse} placeholder="Course: All" clearable options={courses.map((item) => ({ label: item.label, value: item.id }))} loading={loading && !courses.length} />
        <BranchAdminSelect label="Batch" value={batch} onChange={setBatch} placeholder="Batch: All" clearable options={batches.map((item) => ({ label: item.batch_name, value: item.batch_name }))} loading={loading && !batches.length} />
        <button type="button" className="h-11 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white">Apply</button>
      </section>
      <DataPanel title="Report Library" headings={["Report", "Module", "Export", "Updated", "Actions"]}>
        {filtered.map((report) => (
          <tr key={report.name} className="border-b border-[#EDF3F1] last:border-b-0">
            <td className="px-3 py-3 font-black text-[#071B4A]">{report.name}</td>
            <td className="px-3 py-3 font-semibold text-[#475569]">{report.module}</td>
            <td className="px-3 py-3 font-semibold text-[#475569]">{report.format}</td>
            <td className="px-3 py-3 font-semibold text-[#475569]">{reportRows.length} rows</td>
            <td className="px-3 py-3">
              <div className="flex flex-wrap gap-2">
                <SmallButton icon={FileText} label="PDF" />
                <SmallButton icon={FileSpreadsheet} label="Excel" />
                <SmallButton icon={Download} label="CSV" />
              </div>
            </td>
          </tr>
        ))}
      </DataPanel>
    </div>
  )
}

export function BranchAdminSettingsPage() {
  const branch = useBranchScope()
  const router = useRouter()
  const searchParams = useSearchParams()
  const session = useMemo(() => readBranchAdminSession(), [])
  const [profile, setProfile] = useState<ProfileApiResponse | null>(null)
  const [settings, setSettings] = useState<BranchSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [savingPassword, setSavingPassword] = useState(false)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const tabParam = searchParams.get("tab")
  const activeTab = tabParam === "password" || tabParam === "preferences" || tabParam === "profile" ? tabParam : "profile"

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  function changeTab(tab: "profile" | "password" | "preferences") {
    router.push(`/branch-admin/settings?tab=${tab}`)
  }

  async function loadSettings() {
    setLoading(true)
    try {
      const [payload, profilePayload] = await Promise.all([
        getBranchSettings(),
        loadProfileSettings(),
      ])
      setSettings(payload)
      setProfile(profilePayload.profile)
      storeBranchAdminPreferences(payload.preferences ?? {})
      setError("")
    } catch (err) {
      setSettings(null)
      setError(err instanceof Error ? `Live API unavailable: ${err.message}` : "Live API unavailable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  async function savePassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showToast("Enter current password, new password, and confirmation.")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("New password and confirm password must match.")
      return
    }
    setSavingPassword(true)
    try {
      await changeProfilePassword(passwordForm)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      showToast("Password saved successfully.")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Password could not be saved.")
    } finally {
      setSavingPassword(false)
    }
  }

  async function saveAccountPreferences(preferences: Record<string, string>) {
    setSavingPreferences(true)
    try {
      const saved = await updateBranchSettings({ preferences: { ...(settings?.preferences ?? {}), ...preferences } })
      setSettings(saved)
      storeBranchAdminPreferences({ ...(saved.preferences ?? {}), ...preferences })
      showToast("Preferences saved successfully.")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Preferences could not be saved.")
    } finally {
      setSavingPreferences(false)
    }
  }

  const user = profile ? { ...session?.user, ...profile } : session?.user
  const branchInfo = settings?.branch
  const profileRecord = user as Record<string, unknown> | undefined
  const profileRows: Array<[string, unknown]> = [
    ["Full Name", user?.full_name],
    ["Username", user?.email?.split("@")[0]],
    ["Email", user?.email],
    ["Phone", user?.phone],
    ["Role", "Branch Admin"],
    ["Gender", profileRecord?.gender],
    ["Date of Birth", profileRecord?.date_of_birth],
  ]
  const branchRows: Array<[string, unknown]> = [
    ["Branch Name", branchInfo?.name ?? settings?.branch_name ?? branch.branch_name],
    ["Branch Code", branchInfo?.code ?? branch.branch_code],
    ["City", branchInfo?.city ?? branch.city],
    ["Admin ID", user?.display_code ?? user?.id],
  ]
  const contactRows: Array<[string, unknown]> = [
    ["Email", user?.email],
    ["Phone", user?.phone],
  ]
  const preferences = useMemo(() => ({
    theme_preference: settings?.preferences.theme_preference ?? "System",
    notification_preference: settings?.preferences.notification_preference ?? "Both",
    dashboard_preference: settings?.preferences.dashboard_preference ?? "Detailed",
    language_preference: settings?.preferences.language_preference ?? "English",
  }), [settings?.preferences.dashboard_preference, settings?.preferences.language_preference, settings?.preferences.notification_preference, settings?.preferences.theme_preference])

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B7A5A]">Account Settings</p>
        <h2 className="mt-1 text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Settings</h2>
      </section>
      <ApiState loading={loading} error={error} />

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-2 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="grid gap-2 sm:grid-cols-3">
          <SettingsTabButton icon={UserRound} label="Profile" active={activeTab === "profile"} onClick={() => changeTab("profile")} />
          <SettingsTabButton icon={KeyRound} label="Change Password" active={activeTab === "password"} onClick={() => changeTab("password")} />
          <SettingsTabButton icon={Settings2} label="Preferences" active={activeTab === "preferences"} onClick={() => changeTab("preferences")} />
        </div>
      </section>

      {!loading && activeTab === "profile" ? (
        <section className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
          <CompactPanel title="Profile Photo">
            <div className="grid justify-items-center gap-3 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-5 text-center">
              {user?.profile_photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profile_photo} alt={user.full_name} className="h-24 w-24 rounded-full object-cover ring-2 ring-[#CFE8DF]" />
              ) : (
                <span className="grid h-24 w-24 place-items-center rounded-full bg-[#E8F6F0] text-2xl font-black text-[#0B7A5A] ring-2 ring-[#CFE8DF]">{initialsFor(user?.full_name, user?.email)}</span>
              )}
              <div>
                <p className="text-sm font-black text-[#071B4A]">{user?.full_name ?? "Branch Admin"}</p>
                <p className="mt-1 text-xs font-bold text-[#64748B]">{formatSettingValue(branchRows[0][1] ?? branch.branch_name)}</p>
              </div>
            </div>
          </CompactPanel>
          <div className="grid gap-4">
            <ProfileSection title="Personal Details" rows={profileRows} />
            <ProfileSection title="Branch/Admin Details" rows={branchRows} />
            <ProfileSection title="Contact Details" rows={contactRows} />
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "password" ? (
        <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <h3 className="text-base font-black text-[#071B4A]">Change Password</h3>
          <div className="mt-4 grid gap-3 md:max-w-xl">
            <TextField label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} />
            <TextField label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} />
            <TextField label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} />
            <div className="flex justify-end">
              <button type="button" onClick={() => void savePassword()} disabled={savingPassword} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{savingPassword ? "Saving..." : "Save Password"}</button>
            </div>
          </div>
        </section>
      ) : null}

      {!loading && activeTab === "preferences" ? (
        <BranchAdminAccountPreferences preferences={preferences} saving={savingPreferences} onSave={saveAccountPreferences} />
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

function SettingsTabButton({ icon: Icon, label, active, onClick }: { icon: typeof Users; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-black transition ${active ? "bg-[#0B7A5A] text-white shadow-[0_8px_18px_rgba(11,122,90,0.2)]" : "bg-[#FBFDFC] text-[#071B4A] hover:bg-[#E8F6F0] hover:text-[#0B7A5A]"}`}>
      <Icon size={17} />
      {label}
    </button>
  )
}

function ProfileSection({ title, rows }: { title: string; rows: Array<[string, unknown]> }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="text-sm font-black text-[#071B4A]">{title}</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="min-w-0 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
            <p className="text-[11px] font-black uppercase text-[#64748B]">{label}</p>
            <p className="mt-1 truncate text-sm font-black text-[#071B4A]">{formatSettingValue(value)}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function BranchAdminAccountPreferences({ preferences, saving, onSave }: { preferences: Record<string, string>; saving: boolean; onSave: (preferences: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState(preferences)

  useEffect(() => {
    setForm(preferences)
  }, [preferences])

  function updatePreference(key: string, value: string) {
    const next = { ...form, [key]: value }
    setForm(next)
    storeBranchAdminPreferences(next)
    if (key === "theme_preference") void onSave(next)
  }

  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="text-base font-black text-[#071B4A]">Preferences</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SelectField label="Theme Preference" value={form.theme_preference} options={["Light", "Dark", "System"]} onChange={(value) => updatePreference("theme_preference", value)} />
        <SelectField label="Dashboard Preference" value={form.dashboard_preference} options={["Compact", "Detailed", "Analytics Focus"]} onChange={(value) => updatePreference("dashboard_preference", value)} />
        <SelectField label="Notification Preference" value={form.notification_preference} options={["Email", "In-app", "Both", "None"]} onChange={(value) => updatePreference("notification_preference", value)} />
        <SelectField label="Language Preference" value={form.language_preference} options={["English"]} onChange={(value) => updatePreference("language_preference", value)} />
      </div>
      <div className="mt-5 flex justify-end">
        <button type="button" onClick={() => void onSave(form)} disabled={saving} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : "Save Preferences"}</button>
      </div>
    </section>
  )
}

function initialsFor(name?: string | null, email?: string | null) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (email ?? "BA").slice(0, 2).toUpperCase()
}

function formatSettingValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "string") {
    const date = new Date(value)
    return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : value
  }
  return String(value)
}

function PageHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction?: () => void }) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">{title}</h2>
        <p className="mt-1.5 text-sm font-semibold text-[#475569]">{subtitle}</p>
      </div>
      <button type="button" onClick={onAction} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.24)]">
        <Plus size={17} />
        {action}
      </button>
    </section>
  )
}

function ApiState({ loading, error }: { loading: boolean; error: string }) {
  if (error) {
    return <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div>
  }
  if (loading) {
    return <div className="rounded-lg border border-[#DDE9E4] bg-white px-4 py-3 text-sm font-black text-[#64748B]">Loading live data...</div>
  }
  return null
}

function EmptyTableRow({ columns, label }: { columns: number; label: string }) {
  return (
    <tr>
      <td colSpan={columns} className="px-3 py-8 text-center text-sm font-bold text-[#64748B]">{label}</td>
    </tr>
  )
}

function Metric({ label, value, icon: Icon, tone = "green" }: { label: string; value: string; icon: LucideIcon; tone?: "green" | "blue" | "orange" | "red" | "gray" }) {
  const toneStyle = metricToneStyle(tone)
  return (
    <div className={`rounded-lg border bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${toneStyle.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase text-[#64748B]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#020617]">{value}</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneStyle.icon}`}>
          <Icon size={19} />
        </span>
      </div>
    </div>
  )
}

function metricToneStyle(tone: "green" | "blue" | "orange" | "red" | "gray") {
  if (tone === "blue") return { card: "border-[#BFDBFE]", icon: "bg-[#EFF6FF] text-[#2563EB]" }
  if (tone === "orange") return { card: "border-[#FED7AA]", icon: "bg-[#FFF7ED] text-[#F97316]" }
  if (tone === "red") return { card: "border-[#FECACA]", icon: "bg-[#FEF2F2] text-[#DC2626]" }
  if (tone === "gray") return { card: "border-[#E2E8F0]", icon: "bg-[#F8FAFC] text-[#64748B]" }
  return { card: "border-[#CFE8DF]", icon: "bg-[#E8F6F0] text-[#0B7A5A]" }
}

function BatchSkeleton() {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="h-[92px] animate-pulse rounded-lg border border-[#E3ECE8] bg-white p-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
          <div className="h-3 w-24 rounded bg-[#E8F0ED]" />
          <div className="mt-4 h-7 w-14 rounded bg-[#E8F0ED]" />
        </div>
      ))}
      <p className="sm:col-span-2 xl:col-span-6 rounded-lg border border-[#DDE9E4] bg-white px-4 py-3 text-sm font-black text-[#64748B]">Loading batches...</p>
    </section>
  )
}

function DataPanel({ title, headings, children }: { title: string; headings: string[]; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="border-b border-[#E3ECE8] p-4">
        <h3 className="text-sm font-black text-[#071B4A]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-[#F8FAF8] text-xs uppercase text-[#475569]">
            <tr>{headings.map((heading) => <th key={heading} className="px-3 py-3 font-black">{heading}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  )
}

function BatchCardGrid({ batches, hasBatches, loading, onView, onEdit, onAssignTrainer, onTransferStudents, onClearFilters, onCreate }: { batches: BatchRecord[]; hasBatches: boolean; loading: boolean; onView: (batch: BatchRecord) => void; onEdit: (batch: BatchRecord) => void; onAssignTrainer: (batch: BatchRecord) => void; onTransferStudents: (batch: BatchRecord) => void; onClearFilters: () => void; onCreate: () => void }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#071B4A]">Batch Directory</h3>
          <p className="mt-1 text-xs font-bold text-[#64748B]">{batches.length} visible batch{batches.length === 1 ? "" : "es"}</p>
        </div>
        <span className="rounded-lg bg-[#E8F6F0] px-3 py-1.5 text-xs font-black text-[#0B7A5A]">Card View</span>
      </div>
      {loading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-56 animate-pulse rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-4">
              <div className="h-4 w-36 rounded bg-[#E8F0ED]" />
              <div className="mt-4 h-3 w-48 rounded bg-[#E8F0ED]" />
              <div className="mt-8 h-2 rounded bg-[#E8F0ED]" />
            </div>
          ))}
        </div>
      ) : batches.length ? (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {batches.map((batch) => (
            <BatchCard key={batchKey(batch)} batch={batch} onView={() => onView(batch)} onEdit={() => onEdit(batch)} onAssignTrainer={() => onAssignTrainer(batch)} onTransferStudents={() => onTransferStudents(batch)} />
          ))}
        </div>
      ) : (
        <BatchDirectoryEmpty label={hasBatches ? "No batches match your filters." : "No batches created yet."} actionLabel={hasBatches ? "Clear filters" : "Create your first batch"} onAction={hasBatches ? onClearFilters : onCreate} />
      )}
    </section>
  )
}

function BatchCard({ batch, onView, onEdit, onAssignTrainer, onTransferStudents }: { batch: BatchRecord; onView: () => void; onEdit: () => void; onAssignTrainer: () => void; onTransferStudents: () => void }) {
  const capacity = positiveNumber(batch.capacity)
  const occupancy = getOccupancyPercentage(batch)
  return (
    <article role="button" tabIndex={0} onClick={onView} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onView() }} className="rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] p-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.035)] transition hover:border-[#B9D8CF] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#BFE6D8]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-base font-black text-[#071B4A]">{batchDisplayName(batch)}</h4>
          <p className="mt-1 truncate text-xs font-bold uppercase text-[#64748B]">{(batch.course_title ?? batch.course) || "Course not assigned"}</p>
        </div>
        <BatchStatusBadge status={getBatchStatus(batch)} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <BatchInfoTile label="Trainer" value={batch.trainer || "Unassigned"} />
        <BatchInfoTile label="Students Enrolled" value={String(enrolledCount(batch))} />
        <BatchInfoTile label="Capacity" value={capacity ? String(capacity) : "-"} />
        <BatchInfoTile label="Occupancy" value={`${occupancy}%`} />
        {batch.mode ? <BatchInfoTile label="Mode" value={batch.mode} /> : null}
      </div>

      <div className="mt-4 rounded-lg border border-[#EDF3F1] bg-white p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-black uppercase text-[#64748B]">{formatCapacityCount(batch)}</span>
          <span className="text-xs font-black text-[#0B7A5A]">{occupancy}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E8F0ED]">
          <span className={`block h-full rounded-full ${occupancy >= 100 ? "bg-[#DC2626]" : occupancy >= 85 ? "bg-[#F97316]" : "bg-[#0B7A5A]"}`} style={{ width: `${occupancy}%` }} />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[#EDF3F1] bg-white p-3">
        <p className="text-[11px] font-black uppercase text-[#64748B]">Schedule Summary</p>
        <ScheduleSummary batch={batch} />
        <p className="mt-0.5 text-xs font-bold text-[#64748B]">{getScheduleStatus(batch)}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
        <SmallButton icon={FileText} label="View Details" onClick={onView} />
        <SmallButton icon={Pencil} label="Edit Batch" onClick={onEdit} />
        <SmallButton icon={UserPlus} label="Assign Trainer" onClick={onAssignTrainer} />
        <SmallButton icon={Users} label="Transfer Students" onClick={onTransferStudents} />
      </div>
    </article>
  )
}

function BatchCompactList({ batches, hasBatches, loading, onView, onEdit, onAssignTrainer, onTransferStudents, onClearFilters, onCreate }: { batches: BatchRecord[]; hasBatches: boolean; loading: boolean; onView: (batch: BatchRecord) => void; onEdit: (batch: BatchRecord) => void; onAssignTrainer: (batch: BatchRecord) => void; onTransferStudents: (batch: BatchRecord) => void; onClearFilters: () => void; onCreate: () => void }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-4">
        <h3 className="text-sm font-black text-[#071B4A]">Batch Directory</h3>
        <p className="mt-1 text-xs font-bold text-[#64748B]">Compact table-style view without horizontal scrolling.</p>
      </div>
      {loading ? <BatchDirectoryEmpty label="Loading batches..." /> : batches.length ? (
        <div className="grid gap-2">
          {batches.map((batch) => (
            <div key={batchKey(batch)} className="grid gap-3 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_auto] lg:items-center">
              <button type="button" onClick={() => onView(batch)} className="min-w-0 text-left">
                <p className="truncate text-sm font-black text-[#071B4A]">{batchDisplayName(batch)}</p>
                <p className="mt-1 truncate text-xs font-bold text-[#64748B]">{batch.course_title ?? batch.course}</p>
              </button>
              <p className="text-sm font-bold text-[#475569]">{batch.trainer || "Unassigned"}</p>
              <OccupancyCell batch={batch} />
              <div>
                <ScheduleSummary batch={batch} compact />
                <div className="mt-1"><BatchStatusBadge status={getBatchStatus(batch)} /></div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <SmallButton icon={FileText} label="View" onClick={() => onView(batch)} />
                <SmallButton icon={Pencil} label="Edit" onClick={() => onEdit(batch)} />
                <SmallButton icon={UserPlus} label="Assign" onClick={() => onAssignTrainer(batch)} />
                <SmallButton icon={Users} label="Students" onClick={() => onTransferStudents(batch)} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <BatchDirectoryEmpty label={hasBatches ? "No batches match your filters." : "No batches created yet."} actionLabel={hasBatches ? "Clear filters" : "Create your first batch"} onAction={hasBatches ? onClearFilters : onCreate} />
      )}
    </section>
  )
}

function BatchInfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-[#EDF3F1] bg-white p-3">
      <p className="text-[11px] font-black uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 truncate text-sm font-black text-[#071B4A]">{value}</p>
    </div>
  )
}

function ScheduleSummary({ batch, compact = false }: { batch: BatchRecord; compact?: boolean }) {
  const parts = scheduleDisplayParts(batch)
  return (
    <div className={compact ? "grid gap-0.5" : "grid gap-1"}>
      {parts.map((part, index) => (
        <p key={`${part}-${index}`} className={`${index === 0 ? "font-black text-[#071B4A]" : "font-bold text-[#475569]"} ${compact ? "text-xs" : "text-sm"}`}>{part}</p>
      ))}
    </div>
  )
}

function StructuredScheduleFields({ schedule, legacySchedule, onScheduleChange, onLegacyScheduleChange }: { schedule: ScheduleForm; legacySchedule?: string; onScheduleChange: (schedule: ScheduleForm) => void; onLegacyScheduleChange?: (value: string) => void }) {
  function toggleDay(day: string) {
    const days = schedule.days.includes(day) ? schedule.days.filter((item) => item !== day) : [...schedule.days, day]
    onScheduleChange({ ...schedule, days })
  }

  return (
    <section className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
      <p className="mb-3 text-xs font-black uppercase text-[#0B7A5A]">Schedule</p>
      <div className="grid gap-2">
        <div>
          <p className="mb-1.5 text-xs font-black uppercase text-[#64748B]">Days</p>
          <div className="flex flex-wrap gap-2">
            {scheduleDays.map((day) => (
              <button key={day} type="button" onClick={() => toggleDay(day)} className={`h-9 rounded-lg border px-3 text-xs font-black transition ${schedule.days.includes(day) ? "border-[#0B7A5A] bg-[#E8F6F0] text-[#0B7A5A]" : "border-[#DDE9E4] bg-white text-[#071B4A] hover:border-[#0B7A5A]"}`}>
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Start Time" type="time" value={schedule.startTime} onChange={(value) => onScheduleChange({ ...schedule, startTime: value })} />
          <TextField label="End Time" type="time" value={schedule.endTime} onChange={(value) => onScheduleChange({ ...schedule, endTime: value })} />
        </div>
        <TextField label="Classroom / Lab" value={schedule.classroom} onChange={(value) => onScheduleChange({ ...schedule, classroom: value })} />
        {legacySchedule !== undefined && legacySchedule ? (
          <TextField label="Legacy Schedule Fallback" value={legacySchedule} onChange={(value) => onLegacyScheduleChange?.(value)} />
        ) : null}
      </div>
    </section>
  )
}

function BatchDirectoryEmpty({ label, actionLabel, onAction }: { label: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="grid min-h-52 place-items-center rounded-lg border border-dashed border-[#CFE8DF] bg-[#FBFDFC] p-8 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
          <Table2 size={19} />
        </span>
        <p className="mt-3 text-sm font-black text-[#071B4A]">{label}</p>
        {actionLabel && onAction ? <button type="button" onClick={onAction} className="mt-3 h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.2)]">{actionLabel}</button> : null}
      </div>
    </div>
  )
}

function BatchDetailDrawer({ batch, onClose, onEdit, onAssignTrainer, onManageStudents }: { batch: BatchRecord; onClose: () => void; onEdit: () => void; onAssignTrainer: () => void; onManageStudents: () => void }) {
  const capacity = positiveNumber(batch.capacity)
  const occupancy = getOccupancyPercentage(batch)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#020617]/35">
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E3ECE8] pb-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase text-[#0B7A5A]">Batch Information</p>
            <h3 className="mt-1 truncate text-xl font-black text-[#071B4A]">{batchDisplayName(batch)}</h3>
            <div className="mt-2"><BatchStatusBadge status={getBatchStatus(batch)} /></div>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#DDE9E4] text-[#071B4A]">
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <BatchInfoTile label="Course" value={(batch.course_title ?? batch.course) || "Course not assigned"} />
          <BatchInfoTile label="Trainer" value={batch.trainer || "Unassigned"} />
          <BatchInfoTile label="Mode" value={batch.mode || "Not specified"} />
          <BatchInfoTile label="Capacity" value={capacity ? String(capacity) : "-"} />
          <BatchInfoTile label="Students Enrolled" value={String(enrolledCount(batch))} />
          <BatchInfoTile label="Available Seats" value={String(getAvailableSeats(batch))} />
          <BatchInfoTile label="Occupancy" value={`${occupancy}%`} />
        </div>

        <section className="mt-4 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black text-[#071B4A]">Occupancy</h4>
            <span className="text-sm font-black text-[#0B7A5A]">{formatCapacityCount(batch)} / {occupancy}%</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#E8F0ED]">
            <span className={`block h-full rounded-full ${occupancy >= 100 ? "bg-[#DC2626]" : occupancy >= 85 ? "bg-[#F97316]" : "bg-[#0B7A5A]"}`} style={{ width: `${occupancy}%` }} />
          </div>
        </section>

        <section className="mt-4 rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-4">
          <h4 className="text-sm font-black text-[#071B4A]">Schedule</h4>
          <div className="mt-2"><ScheduleSummary batch={batch} /></div>
          <p className="mt-1 text-xs font-bold text-[#64748B]">{getScheduleStatus(batch)}</p>
        </section>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={onEdit} className="h-10 rounded-lg border border-[#DDE9E4] px-3 text-sm font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:text-[#0B7A5A]">Edit Batch</button>
          <button type="button" onClick={onAssignTrainer} className="h-10 rounded-lg border border-[#DDE9E4] px-3 text-sm font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:text-[#0B7A5A]">Assign Trainer</button>
          <button type="button" onClick={onManageStudents} className="h-10 rounded-lg bg-[#0B7A5A] px-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.2)]">Manage Students</button>
        </div>

        <div className="mt-3 flex justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Close</button>
        </div>
      </aside>
    </div>
  )
}

function BatchTimetablePanel({ viewMode, onViewModeChange }: { viewMode: string; onViewModeChange: (value: string) => void }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#071B4A]">Timetable Overview</h3>
          <p className="mt-1 text-xs font-bold text-[#64748B]">Current timetable controls remain available for this phase.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Weekly View", "Monthly View", "Calendar View"].map((label) => (
            <button key={label} type="button" onClick={() => onViewModeChange(label)} className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-xs font-black ${viewMode === label ? "border-[#0B7A5A] bg-[#E8F6F0] text-[#0B7A5A]" : "border-[#DDE9E4] bg-[#FBFDFC] text-[#071B4A]"}`}>
              <CalendarDays size={15} className="text-[#0B7A5A]" />
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-4 text-xs font-bold text-[#64748B]">{viewMode} timetable is generated from the current branch batch directory.</div>
    </section>
  )
}

function CompactPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-3 text-sm font-black text-[#071B4A]">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function QuickStrip({ actions, onAction }: { actions: string[]; onAction?: (action: string) => void }) {
  return (
    <section className="grid gap-2 rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)] sm:grid-cols-2 xl:grid-cols-4">
      {actions.map((action) => (
        <button key={action} type="button" onClick={() => onAction?.(action)} className="h-10 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-xs font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:bg-white">
          {action}
        </button>
      ))}
    </section>
  )
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#071B4A]">{title}</h3>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white shadow-xl">{message}</div>
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-semibold normal-case text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
    </label>
  )
}

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <BranchAdminSelect
      label={label}
      value={value}
      onChange={onChange}
      placeholder="Select"
      options={options.map((option, index) => ({ label: labels?.[option] ?? option, value: option || `option-${index}` }))}
    />
  )
}

function formatErrorMessage(error: unknown) {
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again."
}

function positiveNumber(value: string | number | null | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function enrolledCount(batch: BatchRecord) {
  return Number.isFinite(Number(batch.enrolled)) ? Number(batch.enrolled) : 0
}

function normalizedBatchStatus(batch: BatchRecord) {
  return String(batch.status ?? "").trim().toLowerCase()
}

function getAvailableSeats(batch: BatchRecord) {
  if (Number.isFinite(Number(batch.available_seats))) return Math.max(0, Number(batch.available_seats))
  const capacity = positiveNumber(batch.capacity)
  if (!capacity) return 0
  return Math.max(0, capacity - enrolledCount(batch))
}

function getOccupancyPercentage(batch: BatchRecord) {
  const capacity = positiveNumber(batch.capacity)
  if (!capacity) return 0
  return Math.min(100, Math.round((enrolledCount(batch) / capacity) * 100))
}

function getScheduleStatus(batch: BatchRecord): Extract<BatchStatus, "Scheduled" | "Schedule Pending"> {
  const hasScheduleString = Boolean(batch.schedule?.trim()) && !/schedule\s*pending/i.test(batch.schedule)
  const hasScheduleJson = Boolean(batch.schedule_json && Object.keys(batch.schedule_json).length)
  const hasTimings = Boolean(batch.timings?.length)
  return hasScheduleString || hasScheduleJson || hasTimings ? "Scheduled" : "Schedule Pending"
}

function getBatchStatus(batch: BatchRecord): BatchStatus {
  const status = normalizedBatchStatus(batch)
  const capacity = positiveNumber(batch.capacity)
  if (status.includes("complete")) return "Completed"
  if (capacity && enrolledCount(batch) >= capacity) return "Full"
  if (getScheduleStatus(batch) === "Schedule Pending") return "Schedule Pending"
  if (status.includes("scheduled") || status.includes("upcoming")) return "Scheduled"
  return "Active"
}

function emptyScheduleForm(): ScheduleForm {
  return { days: [], startTime: "", endTime: "", classroom: "" }
}

function toDisplayTime(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return value
  const [hourText, minute] = value.split(":")
  const hour = Number(hourText)
  const suffix = hour >= 12 ? "PM" : "AM"
  const displayHour = hour % 12 || 12
  return `${String(displayHour).padStart(2, "0")}:${minute} ${suffix}`
}

function toTimeInputValue(value: string) {
  const trimmed = value.trim().toUpperCase()
  const amPm = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/)
  if (amPm) {
    let hour = Number(amPm[1])
    const minute = amPm[2] ?? "00"
    if (amPm[3] === "PM" && hour < 12) hour += 12
    if (amPm[3] === "AM" && hour === 12) hour = 0
    return `${String(hour).padStart(2, "0")}:${minute}`
  }
  const numeric = trimmed.match(/^(\d{1,2})(?::(\d{2}))?$/)
  if (numeric) return `${String(Number(numeric[1])).padStart(2, "0")}:${numeric[2] ?? "00"}`
  return ""
}

function formatScheduleForm(schedule: ScheduleForm) {
  const parts: string[] = []
  if (schedule.days.length) parts.push(schedule.days.join(", "))
  if (schedule.startTime && schedule.endTime) parts.push(`${toDisplayTime(schedule.startTime)} - ${toDisplayTime(schedule.endTime)}`)
  if (schedule.classroom.trim()) parts.push(schedule.classroom.trim())
  return parts.join(" | ")
}

function parseScheduleString(value?: string | null): { schedule: ScheduleForm; legacySchedule: string } {
  const original = value?.trim() ?? ""
  const empty = emptyScheduleForm()
  if (!original || /schedule\s*pending/i.test(original)) return { schedule: empty, legacySchedule: "" }

  const parts = original.split("|").map((part) => part.trim()).filter(Boolean)
  if (parts.length >= 2) {
    const days = scheduleDays.filter((day) => new RegExp(`\\b${day}\\b`, "i").test(parts[0]))
    const timeMatch = parts[1].match(/(.+?)\s*(?:-|\u2013|to)\s*(.+)/i)
    const startTime = timeMatch ? toTimeInputValue(timeMatch[1]) : ""
    const endTime = timeMatch ? toTimeInputValue(timeMatch[2]) : ""
    if (days.length || startTime || endTime) {
      return { schedule: { days, startTime, endTime, classroom: parts.slice(2).join(" | ") }, legacySchedule: "" }
    }
  }

  const days = scheduleDays.filter((day) => new RegExp(`\\b${day}\\b`, "i").test(original))
  const timeMatch = original.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*(?:-|\u2013|to)\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)/i)
  const startTime = timeMatch ? toTimeInputValue(timeMatch[1]) : ""
  const endTime = timeMatch ? toTimeInputValue(timeMatch[2]) : ""
  if (days.length && startTime && endTime) return { schedule: { days, startTime, endTime, classroom: "" }, legacySchedule: "" }

  return { schedule: empty, legacySchedule: original }
}

function formatScheduleDisplay(batch: BatchRecord) {
  if (getScheduleStatus(batch) === "Schedule Pending") return "Schedule pending"
  const parsed = parseScheduleString(batch.schedule)
  const formatted = formatScheduleForm(parsed.schedule)
  if (formatted) return formatted
  if (parsed.legacySchedule) return parsed.legacySchedule
  if (batch.timings?.length) return batch.timings.join(", ")
  return "Scheduled"
}

function scheduleDisplayParts(batch: BatchRecord) {
  if (getScheduleStatus(batch) === "Schedule Pending") return ["Schedule pending"]
  const parsed = parseScheduleString(batch.schedule)
  const parts: string[] = []
  if (parsed.schedule.days.length) parts.push(parsed.schedule.days.join(", "))
  if (parsed.schedule.startTime && parsed.schedule.endTime) parts.push(`${toDisplayTime(parsed.schedule.startTime)} - ${toDisplayTime(parsed.schedule.endTime)}`)
  if (parsed.schedule.classroom.trim()) parts.push(parsed.schedule.classroom.trim())
  if (parts.length) return parts
  if (parsed.legacySchedule) return [parsed.legacySchedule]
  if (batch.timings?.length) return batch.timings
  return ["Scheduled"]
}

function validateScheduleForm(schedule: ScheduleForm) {
  if (schedule.days.length && (!schedule.startTime || !schedule.endTime)) return "Start time and end time are required when days are selected."
  if ((schedule.startTime && !schedule.endTime) || (!schedule.startTime && schedule.endTime)) return "Start time and end time must both be filled."
  if (schedule.startTime && schedule.endTime && schedule.endTime <= schedule.startTime) return "End time must be later than start time."
  return ""
}

function formatCapacityCount(batch: BatchRecord) {
  const capacity = positiveNumber(batch.capacity)
  return capacity ? `${enrolledCount(batch)}/${capacity}` : `${enrolledCount(batch)}/-`
}

function hasCapacityAlert(batch: BatchRecord) {
  const capacity = positiveNumber(batch.capacity)
  if (!capacity) return false
  return enrolledCount(batch) / capacity > 0.85
}

function capacityStatus(batch: BatchRecord) {
  const capacity = positiveNumber(batch.capacity)
  if (!capacity) return "Capacity not set"
  const enrolled = enrolledCount(batch)
  const available = capacity - enrolled
  if (available <= 0) return "Full"
  if (enrolled / capacity > 0.85) return `${available} seats left`
  return `${available} seats available`
}

function studentDisplayName(student?: StudentRecord) {
  if (!student) return "Select a student"
  if (student.full_name?.trim()) return student.full_name.trim()
  if (student.display_code?.trim()) return student.display_code.trim()
  if (student.email?.trim()) return student.email.trim()
  return student.id ? `Student ${student.id.slice(0, 8)}` : "Student"
}

function validateBatchForm(form: { batch_name: string; course_id: string; trainer_id: string; capacity: string }, schedule?: ScheduleForm) {
  if (!form.batch_name.trim()) return "Batch name is required."
  if (!form.course_id) return "Course is required."
  if (!form.trainer_id) return "Trainer is required."
  if (!positiveNumber(form.capacity)) return "Capacity must be a positive number."
  if (schedule) {
    const scheduleError = validateScheduleForm(schedule)
    if (scheduleError) return scheduleError
  }
  return ""
}

function batchKey(batch: BatchRecord) {
  return batch.id || batch.batch_name || batch.batch
}

function batchDisplayName(batch?: BatchRecord) {
  if (!batch) return "Select a batch"
  return batch.name || batch.batch_name || batch.batch || batch.id || "Batch"
}

function batchLabels(batches: BatchRecord[]) {
  return Object.fromEntries(batches.map((batch) => [batchKey(batch), batchDisplayName(batch)]))
}

function BatchFormModal({ title, courses, trainers, modes, onClose, onSave }: { title: string; courses: CourseOption[]; trainers: TrainerOption[]; modes: ModeOption[]; onClose: () => void; onSave: (payload: Partial<BatchRecord>) => Promise<void> }) {
  const [form, setForm] = useState({ batch_name: "", course_id: courses[0]?.id ?? "", course: courses[0]?.title ?? "", trainer_id: trainers[0]?.id ?? "", trainer: trainers[0]?.full_name ?? "", capacity: "30", mode: modes[0]?.value ?? "Offline" })
  const [schedule, setSchedule] = useState<ScheduleForm>(emptyScheduleForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const validationError = validateBatchForm(form, schedule)
  async function save() {
    const nextError = validateBatchForm(form, schedule)
    if (nextError) {
      setError(nextError)
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave({ ...form, schedule: formatScheduleForm(schedule), capacity: Number(form.capacity) })
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-3">
        <TextField label="Batch Name" value={form.batch_name} onChange={(value) => setForm({ ...form, batch_name: value })} />
        <SelectField label="Course" value={form.course_id} options={courses.map((item) => item.id)} labels={Object.fromEntries(courses.map((item) => [item.id, item.label]))} onChange={(value) => { const course = courses.find((item) => item.id === value); setForm({ ...form, course_id: value, course: course?.title ?? "" }) }} />
        <SelectField label="Trainer" value={form.trainer_id} options={trainers.map((item) => item.id)} labels={Object.fromEntries(trainers.map((item) => [item.id, item.label]))} onChange={(value) => { const trainer = trainers.find((item) => item.id === value); setForm({ ...form, trainer_id: value, trainer: trainer?.full_name ?? "" }) }} />
        <TextField label="Capacity" type="number" value={form.capacity} onChange={(value) => setForm({ ...form, capacity: value })} />
        <SelectField label="Mode" value={form.mode} options={(modes.length ? modes.map((item) => item.value) : ["Online", "Offline", "Hybrid"])} labels={Object.fromEntries(modes.map((item) => [item.value, item.label]))} onChange={(value) => setForm({ ...form, mode: value })} />
        <StructuredScheduleFields schedule={schedule} onScheduleChange={setSchedule} />
        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={Boolean(validationError)} />
      </div>
    </Modal>
  )
}

function BatchEditModal({ batches, courses, trainers, modes, initialBatchKey = "", onClose, onSave }: { batches: BatchRecord[]; courses: CourseOption[]; trainers: TrainerOption[]; modes: ModeOption[]; initialBatchKey?: string; onClose: () => void; onSave: (batch: BatchRecord, payload: Partial<BatchRecord>) => Promise<void> }) {
  const initialSelection = batches.some((item) => batchKey(item) === initialBatchKey) ? initialBatchKey : batches[0] ? batchKey(batches[0]) : ""
  const [selected, setSelected] = useState(initialSelection)
  const batch = batches.find((item) => batchKey(item) === selected)
  const [courseId, setCourseId] = useState(batch?.course_id ?? courses[0]?.id ?? "")
  const [trainerId, setTrainerId] = useState(trainers.find((item) => item.full_name === batch?.trainer)?.id ?? trainers[0]?.id ?? "")
  const [capacity, setCapacity] = useState(String(batch?.capacity ?? 30))
  const initialSchedule = parseScheduleString(batch?.schedule)
  const [schedule, setSchedule] = useState<ScheduleForm>(initialSchedule.schedule)
  const [legacySchedule, setLegacySchedule] = useState(initialSchedule.legacySchedule)
  const [mode, setMode] = useState(batch?.mode ?? "Offline")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const validationError = validateBatchForm({ batch_name: batchDisplayName(batch), course_id: courseId, trainer_id: trainerId, capacity }, schedule)

  useEffect(() => {
    const nextBatch = batches.find((item) => batchKey(item) === selected)
    if (!nextBatch) return
    const nextCourseId = nextBatch.course_id ?? courses.find((item) => item.title === nextBatch.course || item.label === nextBatch.course)?.id ?? ""
    const nextTrainerId = nextBatch.trainer_id ?? trainers.find((item) => item.full_name === nextBatch.trainer || item.label === nextBatch.trainer)?.id ?? ""
    const nextSchedule = parseScheduleString(nextBatch.schedule)
    setCourseId(nextCourseId)
    setTrainerId(nextTrainerId)
    setCapacity(String(nextBatch.capacity ?? ""))
    setSchedule(nextSchedule.schedule)
    setLegacySchedule(nextSchedule.legacySchedule)
    setMode(nextBatch.mode ?? modes[0]?.value ?? "Offline")
    setError("")
  }, [batches, courses, modes, selected, trainers])

  async function save() {
    if (!batch) {
      setError("Selected batch is no longer available. Refresh the page and try again.")
      return
    }
    const nextError = validateBatchForm({ batch_name: batchDisplayName(batch), course_id: courseId, trainer_id: trainerId, capacity }, schedule)
    if (nextError) {
      setError(nextError)
      return
    }
    setSaving(true)
    setError("")
    try {
      const course = courses.find((item) => item.id === courseId)
      const trainer = trainers.find((item) => item.id === trainerId)
      const formattedSchedule = formatScheduleForm(schedule)
      await onSave(batch, { id: batch.id, name: batchDisplayName(batch), batch_name: batchDisplayName(batch), course_id: courseId, course: course?.title, trainer_id: trainerId, trainer: trainer?.full_name, capacity: Number(capacity), schedule: formattedSchedule || legacySchedule, mode })
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal title="Edit Batch" onClose={onClose}>
      <div className="grid gap-3">
        <SelectField label="Batch" value={selected} options={batches.map(batchKey)} labels={batchLabels(batches)} onChange={setSelected} />
        {batch && !batch.id ? <p className="text-xs font-bold text-[#9A3412]">Batch ID is unavailable, so this save will use the legacy batch route.</p> : null}
        <SelectField label="Course" value={courseId} options={courses.map((item) => item.id)} labels={Object.fromEntries(courses.map((item) => [item.id, item.label]))} onChange={setCourseId} />
        <SelectField label="Trainer" value={trainerId} options={trainers.map((item) => item.id)} labels={Object.fromEntries(trainers.map((item) => [item.id, item.label]))} onChange={setTrainerId} />
        <TextField label="Capacity" type="number" value={capacity} onChange={setCapacity} />
        <SelectField label="Mode" value={mode} options={(modes.length ? modes.map((item) => item.value) : ["Online", "Offline", "Hybrid"])} labels={Object.fromEntries(modes.map((item) => [item.value, item.label]))} onChange={setMode} />
        <StructuredScheduleFields schedule={schedule} legacySchedule={legacySchedule} onScheduleChange={setSchedule} onLegacyScheduleChange={setLegacySchedule} />
        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!batch || Boolean(validationError)} />
      </div>
    </Modal>
  )
}

function AssignTrainerModal({ batches, trainers, initialBatchKey = "", onClose, onSave }: { batches: BatchRecord[]; trainers: TrainerOption[]; initialBatchKey?: string; onClose: () => void; onSave: (payload: Record<string, string>) => Promise<void> }) {
  const initialSelection = batches.some((item) => batchKey(item) === initialBatchKey) ? initialBatchKey : batches[0] ? batchKey(batches[0]) : ""
  const [batch, setBatch] = useState(initialSelection)
  const selectedBatch = batches.find((item) => batchKey(item) === batch)
  const [trainerId, setTrainerId] = useState(trainers[0]?.id ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  async function save() {
    if (!selectedBatch) {
      setError("Selected batch is no longer available. Refresh the page and try again.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const trainer = trainers.find((item) => item.id === trainerId)
      await onSave({ ...(selectedBatch.id ? { batch_id: selectedBatch.id } : {}), batch_name: batchDisplayName(selectedBatch), trainer_id: trainerId, trainer: trainer?.full_name ?? "" })
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal title="Assign Trainer" onClose={onClose}>
      <div className="grid gap-3">
        <SelectField label="Batch" value={batch} options={batches.map(batchKey)} labels={batchLabels(batches)} onChange={setBatch} />
        {selectedBatch && !selectedBatch.id ? <p className="text-xs font-bold text-[#9A3412]">Batch ID is unavailable, so trainer assignment will use the legacy batch route.</p> : null}
        <SelectField label="Trainer" value={trainerId} options={trainers.map((item) => item.id)} labels={Object.fromEntries(trainers.map((item) => [item.id, item.label]))} onChange={setTrainerId} />
        <p className="text-xs font-bold text-[#64748B]">{trainers.find((item) => item.id === trainerId)?.full_name ?? "Select a trainer"}</p>
        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!selectedBatch || !trainerId} />
      </div>
    </Modal>
  )
}

function TransferStudentModal({ batches, students, initialBatchKey = "", onClose, onSave }: { batches: BatchRecord[]; students: StudentRecord[]; initialBatchKey?: string; onClose: () => void; onSave: (source: BatchRecord, payload: Record<string, string>) => Promise<void> }) {
  const initialSourceName = students.find((item) => item.batch_name)?.batch_name
  const initialSourceBatch = batches.find((item) => batchDisplayName(item) === initialSourceName) ?? batches[0]
  const initialSelection = batches.some((item) => batchKey(item) === initialBatchKey) ? initialBatchKey : initialSourceBatch ? batchKey(initialSourceBatch) : ""
  const [source, setSource] = useState(initialSelection)
  const sourceBatch = batches.find((item) => batchKey(item) === source)
  const sourceName = batchDisplayName(sourceBatch)
  const [studentId, setStudentId] = useState("")
  const student = students.find((item) => item.id === studentId)
  const [target, setTarget] = useState(batches.find((item) => batchKey(item) !== source) ? batchKey(batches.find((item) => batchKey(item) !== source) as BatchRecord) : batches[0] ? batchKey(batches[0]) : "")
  const targetBatch = batches.find((item) => batchKey(item) === target)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const hasBatchData = students.some((item) => Boolean(item.batch_name))
  const visibleStudents = hasBatchData && sourceBatch ? students.filter((item) => item.batch_name === sourceName) : students
  const studentLabels = Object.fromEntries(visibleStudents.map((item) => [item.id, studentDisplayName(item)]))
  const targetCapacity = targetBatch ? positiveNumber(targetBatch.capacity) : null
  const targetIsFull = Boolean(targetCapacity && source !== target && enrolledCount(targetBatch as BatchRecord) >= targetCapacity)
  const transferError = source === target ? "Choose a different target batch." : targetIsFull ? "Target batch is already full." : ""

  useEffect(() => {
    if (studentId && visibleStudents.some((item) => item.id === studentId)) return
    setStudentId(visibleStudents[0]?.id ?? "")
  }, [studentId, visibleStudents])

  useEffect(() => {
    if (!target || target === source) {
      const nextTarget = batches.find((item) => batchKey(item) !== source) ?? batches[0]
      setTarget(nextTarget ? batchKey(nextTarget) : "")
    }
  }, [batches, source, target])

  async function save() {
    if (!studentId || !sourceBatch || !targetBatch) {
      setError("Student, source batch, and target batch are required.")
      return
    }
    if (transferError) {
      setError(transferError)
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave(sourceBatch, { student_id: studentId, ...(targetBatch.id ? { target_batch_id: targetBatch.id } : { target_batch: batchDisplayName(targetBatch) }) })
    } catch (err) {
      setError(formatErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal title="Transfer Students" onClose={onClose}>
      <div className="grid gap-3">
        <SelectField label="Source Batch" value={source} options={batches.map(batchKey)} labels={batchLabels(batches)} onChange={setSource} />
        {sourceBatch && !sourceBatch.id ? <p className="text-xs font-bold text-[#9A3412]">Source batch ID is unavailable, so transfer will use the legacy batch route.</p> : null}
        <SelectField label="Student" value={studentId} options={visibleStudents.map((item) => item.id)} labels={studentLabels} onChange={setStudentId} />
        <p className="text-xs font-bold text-[#64748B]">
          {hasBatchData ? `${visibleStudents.length} student${visibleStudents.length === 1 ? "" : "s"} available in source batch.` : "Student batch data is unavailable from the API, so all students are shown."}
        </p>
        <p className="text-xs font-bold text-[#64748B]">{studentDisplayName(student)}</p>
        <SelectField label="Target Batch" value={target} options={batches.map(batchKey)} labels={batchLabels(batches)} onChange={setTarget} />
        {targetBatch && !targetBatch.id ? <p className="text-xs font-bold text-[#9A3412]">Target batch ID is unavailable, so transfer will use the legacy target batch name.</p> : null}
        {targetBatch ? <p className="text-xs font-bold text-[#64748B]">Target capacity: {formatCapacityCount(targetBatch)} ({capacityStatus(targetBatch)})</p> : null}
        {error || transferError ? <p className="text-xs font-bold text-[#9A3412]">{error || transferError}</p> : null}
        <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!studentId || !sourceBatch || !targetBatch || Boolean(transferError)} />
      </div>
    </Modal>
  )
}

function PreferencesModal({ title, fields, onClose, onSave }: { title: string; fields: Array<[string, string]>; onClose: () => void; onSave: (preferences: Record<string, string>) => Promise<void> }) {
  const [form, setForm] = useState(Object.fromEntries(fields))
  const [saving, setSaving] = useState(false)
  async function save() {
    setSaving(true)
    try {
      await onSave(form)
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <div className="grid gap-3">
        {Object.entries(form).map(([key, value]) => <TextField key={key} label={key.replace(/_/g, " ")} value={value} onChange={(next) => setForm({ ...form, [key]: next })} />)}
        <ModalActions onClose={onClose} onSave={save} saving={saving} />
      </div>
    </Modal>
  )
}

function UserAccessModal({ users, onClose, onToggle }: { users: BranchUserRecord[]; onClose: () => void; onToggle: (user: BranchUserRecord) => Promise<void> }) {
  return (
    <Modal title="Review User Access" onClose={onClose}>
      <div className="grid gap-2">
        {users.map((user) => (
          <div key={`${user.source}-${user.id}`} className="grid grid-cols-[1fr_140px_90px_110px] items-center gap-2 rounded-lg border border-[#EDF3F1] p-3 text-sm">
            <span className="font-black text-[#071B4A]">{user.full_name}</span>
            <span className="font-semibold text-[#475569]">{user.role_label}</span>
            <Badge label={user.status} />
            <button type="button" onClick={() => onToggle(user)} className="h-8 rounded-lg border border-[#DDE9E4] px-2 text-xs font-black text-[#071B4A]">{user.is_active ? "Deactivate" : "Activate"}</button>
          </div>
        ))}
      </div>
    </Modal>
  )
}

function ModalActions({ onClose, onSave, saving, disabled = false }: { onClose: () => void; onSave: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving || disabled} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
    </div>
  )
}

function ListBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <section className="rounded-lg border border-[#EDF3F1] p-3">
      <h4 className="mb-2 text-xs font-black uppercase text-[#0B7A5A]">{title}</h4>
      <div className="grid gap-1 text-sm font-bold text-[#475569]">{rows.length ? rows.map((row) => <p key={row}>{row}</p>) : <p>No records.</p>}</div>
    </section>
  )
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

function OccupancyCell({ batch }: { batch: BatchRecord }) {
  const percent = getOccupancyPercentage(batch)
  return (
    <div className="min-w-[92px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-[#071B4A]">{formatCapacityCount(batch)}</span>
        <span className="text-xs font-black text-[#0B7A5A]">{percent}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#E8F0ED]">
        <span className={`block h-full rounded-full ${percent >= 100 ? "bg-[#DC2626]" : percent >= 85 ? "bg-[#F97316]" : "bg-[#0B7A5A]"}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

function SmallButton({ icon: Icon, label, onClick, disabled = false }: { icon: LucideIcon; label: string; onClick?: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-2 text-xs font-black text-[#071B4A] disabled:cursor-not-allowed disabled:opacity-55">
      <Icon size={14} className="text-[#0B7A5A]" />
      {label}
    </button>
  )
}

function BatchStatusBadge({ status }: { status: BatchStatus }) {
  const style = status === "Active"
    ? "bg-[#E0F3E9] text-[#0B7A5A]"
    : status === "Scheduled"
      ? "bg-[#EFF6FF] text-[#2563EB]"
      : status === "Full"
        ? "bg-[#FEF2F2] text-[#DC2626]"
        : status === "Completed"
          ? "bg-[#F1F5F9] text-[#64748B]"
          : "bg-[#FFF7ED] text-[#F97316]"
  return <span className={`inline-flex rounded px-2 py-1 text-[11px] font-black ${style}`}>{status}</span>
}

function Badge({ label }: { label: string }) {
  const style = label === "Paid" || label === "Active"
    ? "bg-[#E0F3E9] text-[#0B7A5A]"
    : label === "Overdue" || label === "Review"
      ? "bg-[#FFF0F0] text-[#EF4444]"
      : "bg-[#FFF0DC] text-[#F97316]"
  return <span className={`inline-flex rounded px-2 py-1 text-[11px] font-black ${style}`}>{label}</span>
}
