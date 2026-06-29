"use client"

import {
  ArrowDown,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Layers3,
  RotateCcw,
  Search,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { BranchAdminSelect, type BranchAdminSelectOption } from "./BranchAdminSelect"
import { approveAdmission as approveAdmissionApi, assignAdmissionBatch, getAdmissionOptions, rejectAdmission as rejectAdmissionApi, type AdmissionOptions } from "@/lib/api/branchAdmin"
import { resolveBranchScope } from "@/lib/api/branchAdminData"
import {
  fetchBranchAdmissions,
  type AdmissionRecord,
  type AdmissionStatus,
} from "@/lib/api/branchAdminAdmissions"

type RejectState = { admission: AdmissionRecord; reason: string }
type BatchState = { admission: AdmissionRecord; course_id: string; course: string; batch: string; trainer_id: string; trainer: string; timing: string }

const statusOptions: AdmissionStatus[] = ["New", "Pending", "Approved", "Rejected", "Student Created", "Batch Assigned"]
const rejectReasons = ["Duplicate Admission", "Invalid Information", "Other"]

export function BranchAdminAdmissionsPage() {
  const session = useMemo(() => readBranchAdminSession(), [])
  const branch = useMemo(() => session?.branch ?? resolveBranchScope(), [session])
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [course, setCourse] = useState("all")
  const [batch, setBatch] = useState("all")
  const [status, setStatus] = useState("all")
  const [counsellor, setCounsellor] = useState("all")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selected, setSelected] = useState<AdmissionRecord | null>(null)
  const [approval, setApproval] = useState<AdmissionRecord | null>(null)
  const [rejecting, setRejecting] = useState<RejectState | null>(null)
  const [assigning, setAssigning] = useState<BatchState | null>(null)

  const [options, setOptions] = useState<AdmissionOptions>({ courses: [], batches: [], trainers: [] })

  const loadAdmissions = useCallback(async () => {
    if (!session) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const records = await fetchBranchAdmissions()
      setAdmissions(records.map((record) => ({ ...record, branch_id: record.branch_id || branch.branch_id })))
      setError("")
      setLoading(false)

      const admissionOptions = await getAdmissionOptions().catch(() => null)
      if (admissionOptions) setOptions(admissionOptions)
    } catch (err) {
      setAdmissions([])
      setError(`Live API unavailable: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }, [branch.branch_id, session])

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }

    loadAdmissions().then(() => undefined)
  }, [loadAdmissions, session])

  const courses = useMemo(() => Array.from(new Set(admissions.map((item) => item.course))), [admissions])
  const batches = useMemo(() => Array.from(new Set(admissions.map((item) => item.batch))), [admissions])
  const counsellors = useMemo(() => Array.from(new Set(admissions.map((item) => item.counsellor))), [admissions])
  const courseFilterOptions = useMemo(() => Array.from(new Set(options.courses.map((item) => item.title).filter(Boolean))), [options.courses])
  const batchFilterOptions = useMemo(() => Array.from(new Set(options.batches.map((item) => item.batch_name || item.batch).filter(Boolean))), [options.batches])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return admissions.filter((item) => {
      const matchesSearch = !needle || [item.application_id, item.student_name, item.phone, item.email].some((value) => value.toLowerCase().includes(needle))
      const matchesCourse = course === "all" || item.course === course
      const matchesBatch = batch === "all" || item.batch === batch
      const matchesStatus = status === "all" || item.admission_status === status
      const matchesCounsellor = counsellor === "all" || item.counsellor === counsellor
      const date = new Date(item.application_date).getTime()
      const matchesFrom = !fromDate || date >= new Date(fromDate).getTime()
      const matchesTo = !toDate || date <= new Date(toDate).getTime()
      return matchesSearch && matchesCourse && matchesBatch && matchesStatus && matchesCounsellor && matchesFrom && matchesTo
    })
  }, [admissions, batch, course, counsellor, fromDate, search, status, toDate])

  const kpis = useMemo(() => {
    const total = admissions.length
    const pending = admissions.filter((item) => item.admission_status === "Pending").length
    const approved = admissions.filter(isConvertedAdmission).length
    const rejected = admissions.filter((item) => item.admission_status === "Rejected").length
    const created = admissions.filter((item) => item.admission_status === "Student Created" || item.admission_status === "Batch Assigned").length
    const conversion = total ? Math.round((approved / total) * 100) : 0
    return [
      { label: "Total Applications", value: total, trend: "Live", icon: FileText, tone: "green" },
      { label: "Pending Approval", value: pending, trend: "Live", icon: ShieldCheck, tone: "orange" },
      { label: "Approved Admissions", value: approved, trend: "Live", icon: CheckCircle2, tone: "blue" },
      { label: "Rejected Admissions", value: rejected, trend: "Live", icon: XCircle, tone: "red" },
      { label: "Conversion Rate", value: `${conversion}%`, trend: "Live", icon: BarChart3, tone: "purple" },
      { label: "Student Created", value: created, trend: "Live", icon: UserCheck, tone: "green" },
    ]
  }, [admissions])

  const funnel = useMemo(() => {
    const applications = admissions.length
    const approved = admissions.filter(isConvertedAdmission).length
    const created = admissions.filter((item) => item.admission_status === "Student Created" || item.admission_status === "Batch Assigned").length
    return [
      { label: "Applications", count: applications, color: "#0B7A5A" },
      { label: "Admissions Approved", count: approved, color: "#7C3AED" },
      { label: "Students Created", count: created, color: "#F97316" },
    ]
  }, [admissions])

  const recentAdmissions = useMemo(() => [...admissions].sort((a, b) => b.application_date.localeCompare(a.application_date)).slice(0, 10), [admissions])
  const counsellorPerformance = useMemo(() => {
    return counsellors.map((name) => {
      const rows = admissions.filter((item) => item.counsellor === name)
      const approved = rows.filter(isConvertedAdmission).length
      return { name, applications: rows.length, approved, conversion: rows.length ? Math.round((approved / rows.length) * 100) : 0 }
    })
  }, [admissions, counsellors])

  const thisWeek = admissions.filter((item) => new Date(item.application_date).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000).length
  const monthKey = new Date().toISOString().slice(0, 7)
  const thisMonth = admissions.filter((item) => item.application_date.startsWith(monthKey)).length
  const studentsCreated = admissions.filter((item) => item.admission_status === "Student Created" || item.admission_status === "Batch Assigned").length
  const pendingReviews = admissions.filter((item) => item.admission_status === "Pending").length

  function resetFilters() {
    setSearch("")
    setCourse("all")
    setBatch("all")
    setStatus("all")
    setCounsellor("all")
    setFromDate("")
    setToDate("")
  }

  async function approveAdmission(admission: AdmissionRecord) {
    if (isApprovedAdmission(admission)) {
      setNotice(`${admission.student_name} is already ${admission.admission_status}.`)
      setApproval(null)
      return
    }
    try {
      const saved = await approveAdmissionApi(admission.id)
      setAdmissions((current) => current.map((item) => item.id === admission.id ? { ...admission, ...saved.admission, student_id: saved.student.id } : item))
      setNotice("Admission approved successfully. Student profile has been created.")
      setApproval(null)
      setSelected(null)
      await loadAdmissions()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Live API unavailable")
    }
  }

  async function rejectAdmission() {
    if (!rejecting?.reason) return
    try {
      const saved = await rejectAdmissionApi(rejecting.admission.id, rejecting.reason)
      setAdmissions((current) => current.map((item) => item.id === saved.id ? saved : item))
      setNotice("Admission rejected.")
      setRejecting(null)
      await loadAdmissions()
    } catch (err) {
      setNotice(err instanceof Error ? `Live API unavailable: ${err.message}` : "Live API unavailable")
    }
  }

  async function saveBatchAssignment() {
    if (!assigning) return
    try {
      const saved = await assignAdmissionBatch(assigning.admission.id, {
        course_id: assigning.course_id,
        course: assigning.course,
        batch_name: assigning.batch,
        trainer_id: assigning.trainer_id,
        trainer: assigning.trainer,
        timing: assigning.timing,
      })
      setAdmissions((current) => current.map((item) => item.id === assigning.admission.id ? saved.admission : item))
      setNotice("Batch assigned successfully.")
      setAssigning(null)
      await loadAdmissions()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Live API unavailable")
    }
  }


  function beginApproval(admission: AdmissionRecord) {
    if (isApprovedAdmission(admission)) {
      setNotice(`${admission.student_name} is already ${admission.admission_status}.`)
      return
    }
    setApproval(admission)
  }

  function exportAdmissions() {
    const headers = ["Application ID", "Student Name", "Phone", "Email", "Course", "Batch", "Counsellor", "Application Date", "Admission Status"]
    const rows = filtered.map((item) => [item.application_id, item.student_name, item.phone, item.email, item.course, item.batch, item.counsellor, item.application_date, item.admission_status])
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const link = document.createElement("a")
    link.href = url
    link.download = "branch-admissions.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Admissions Management</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">Track admissions, approvals, onboarding, and student conversion for {branch.branch_name}.</p>
        </div>
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-4 py-3 text-sm font-black text-[#0B7A5A] shadow-sm">
          {branch.branch_name}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map((item) => <KpiCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <FunnelCard funnel={funnel} />
        <BranchMetrics thisWeek={thisWeek} thisMonth={thisMonth} studentsCreated={studentsCreated} pendingReviews={pendingReviews} />
      </section>

      <section className="flex flex-wrap gap-3 rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <ActionButton icon={CheckCircle2} label="Approve Admission" onClick={() => filtered[0] && beginApproval(filtered[0])} />

        <ActionButton icon={Layers3} label="Assign Batch" onClick={() => {
          const admission = filtered.find(isConvertedAdmission)
          if (admission) setAssigning(createBatchState(admission))
        }} />
        <ActionButton icon={Download} label="Export Admissions" onClick={exportAdmissions} />
      </section>

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_140px_170px_150px_150px_150px_auto]">
          <label className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search Student" className="h-11 w-full rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] pl-10 pr-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:bg-white" />
          </label>
          <Filter value={course} onChange={setCourse} label="Course" options={courseFilterOptions.length ? courseFilterOptions : courses} />
          <Filter value={batch} onChange={setBatch} label="Batch" options={batchFilterOptions.length ? batchFilterOptions : batches} />
          <Filter value={status} onChange={setStatus} label="Status" options={statusOptions} />
          <Filter value={counsellor} onChange={setCounsellor} label="Counsellor" options={counsellors} />
          <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-black text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
          <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-black text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
          <button type="button" onClick={resetFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#DDE9E4] px-3 text-sm font-black text-[#071B4A]">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>
        {error ? <div className="mt-3 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        {notice ? <div className="mt-3 rounded-lg border border-[#CFE8DF] bg-[#E8F6F0] px-4 py-3 text-xs font-bold text-[#0B7A5A]">{notice}</div> : null}
      </section>

      <AdmissionsTable
        admissions={filtered}
        loading={loading}
        onView={setSelected}
        onApprove={beginApproval}
        onReject={(admission) => setRejecting({ admission, reason: "" })}
        onAssign={(admission) => setAssigning(createBatchState(admission))}
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <RecentAdmissions records={recentAdmissions} />
        <CounsellorLeaderboard rows={counsellorPerformance} />
      </section>

      {selected ? <ReviewDrawer admission={selected} onClose={() => setSelected(null)} onApprove={() => beginApproval(selected)} onReject={() => setRejecting({ admission: selected, reason: "" })} onAssign={() => setAssigning(createBatchState(selected))} /> : null}
      {approval ? <ConfirmModal title="Approve Admission" detail={`Approve ${approval.student_name}, create a student record, generate Student ID, and activate the profile?`} confirmLabel={isApprovedAdmission(approval) ? approval.admission_status : "Approve"} onCancel={() => setApproval(null)} onConfirm={() => approveAdmission(approval)} /> : null}
      {rejecting ? <RejectModal state={rejecting} setState={setRejecting} onCancel={() => setRejecting(null)} onConfirm={rejectAdmission} /> : null}
      {assigning ? <BatchModal state={assigning} setState={setAssigning} options={options} onCancel={() => setAssigning(null)} onConfirm={saveBatchAssignment} /> : null}
    </div>
  )
}

function createBatchState(admission: AdmissionRecord): BatchState {
  return {
    admission,
    course_id: "",
    course: admission.course,
    batch: admission.batch === "Pending" ? "" : admission.batch,
    trainer_id: "",
    trainer: admission.trainer ?? "",
    timing: admission.timing ?? "",
  }
}

function KpiCard({ label, value, trend, icon: Icon, tone }: { label: string; value: number | string; trend: string; icon: typeof FileText; tone: string }) {
  const styles = tone === "green" ? ["#E8F6F0", "#0B7A5A", "#CFE8DF"] : tone === "blue" ? ["#EAF1FF", "#2563EB", "#D7E4FF"] : tone === "purple" ? ["#F3EAFE", "#7C3AED", "#E8D8FB"] : tone === "red" ? ["#FFF0F0", "#EF4444", "#FBD1D1"] : ["#FFF3E8", "#F97316", "#FEDFC2"]
  return (
    <div className="min-h-[126px] rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition duration-200 hover:-translate-y-0.5" style={{ borderColor: styles[2] }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase text-[#64748B]">{label}</p>
          <p className="mt-2 text-2xl font-black text-[#020617]">{value}</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: styles[0], color: styles[1] }}>
          <Icon size={21} />
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-black" style={{ color: styles[1] }}>
        <ArrowUpRight size={15} />
        Live database
      </div>
    </div>
  )
}

function FunnelCard({ funnel }: { funnel: Array<{ label: string; count: number; color: string }> }) {
  const max = Math.max(...funnel.map((item) => item.count), 1)
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#071B4A]">Admission Funnel</h3>
        <span className="text-xs font-bold text-[#64748B]">Bottleneck view</span>
      </div>
      <div className="grid gap-3">
        {funnel.map((stage, index) => {
          const previous = index === 0 ? stage.count : funnel[index - 1].count
          const conversion = previous ? Math.round((stage.count / previous) * 100) : 0
          const width = Math.max(30, (stage.count / max) * 100)
          return (
            <div key={stage.label}>
              <div className="grid grid-cols-[130px_minmax(0,1fr)_74px] items-center gap-3">
                <span className="truncate text-xs font-black text-[#071B4A]">{stage.label}</span>
                <div className="h-10 rounded-lg bg-[#EEF4F1]">
                  <div className="flex h-10 items-center justify-center rounded-lg text-xs font-black text-white transition-all duration-500" style={{ width: `${width}%`, backgroundColor: stage.color }}>
                    {stage.count}
                  </div>
                </div>
                <span className="text-right text-xs font-black text-[#475569]">{conversion}%</span>
              </div>
              {index < funnel.length - 1 ? <ArrowDown size={15} className="ml-[58px] mt-1 text-[#94A3B8]" /> : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function BranchMetrics({ thisWeek, thisMonth, studentsCreated, pendingReviews }: { thisWeek: number; thisMonth: number; studentsCreated: number; pendingReviews: number }) {
  const metrics = [
    ["Admissions This Week", thisWeek],
    ["Admissions This Month", thisMonth],
    ["Students Created", studentsCreated],
    ["Pending Reviews", pendingReviews],
  ]
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-4 text-sm font-black text-[#071B4A]">Branch Metrics</h3>
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3">
            <p className="text-xs font-bold text-[#64748B]">{label}</p>
            <p className="mt-2 text-xl font-black text-[#071B4A]">{value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ActionButton({ icon: Icon, label, badge, onClick }: { icon: typeof FileText; label: string; badge?: number; onClick: () => void }) {
  const badgeTone = badge === undefined ? "" : badge === 0 ? "bg-[#E0F3E9] text-[#0B7A5A]" : badge <= 10 ? "bg-[#FFF0DC] text-[#F97316]" : "bg-[#FFF0F0] text-[#EF4444]"
  return (
    <button type="button" onClick={onClick} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-4 text-sm font-black text-[#071B4A] transition hover:border-[#0B7A5A] hover:bg-white">
      <Icon size={17} className="text-[#0B7A5A]" />
      {label}
      {badge !== undefined ? <span className={`rounded px-2 py-0.5 text-[11px] ${badgeTone}`}>{badge}</span> : null}
    </button>
  )
}

function Filter({ value, onChange, label, options }: { value: string; onChange: (value: string) => void; label: string; options: string[] }) {
  return (
    <BranchAdminSelect
      label={label}
      value={value === "all" ? "" : value}
      onChange={(next) => onChange(next || "all")}
      placeholder={`${label}: All`}
      clearable={value !== "all"}
      options={options.map((option, index) => ({ label: option, value: option || `option-${index}` }))}
    />
  )
}

function AdmissionsTable({ admissions, loading, onView, onApprove, onReject, onAssign }: { admissions: AdmissionRecord[]; loading: boolean; onView: (admission: AdmissionRecord) => void; onApprove: (admission: AdmissionRecord) => void; onReject: (admission: AdmissionRecord) => void; onAssign: (admission: AdmissionRecord) => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <div className="hidden bg-[#F8FAF8] text-[11px] font-black uppercase text-[#475569] xl:grid xl:grid-cols-[1.05fr_1.1fr_1fr_0.95fr_0.9fr_1fr_0.85fr_54px]">
        {["Application ID", "Student Name", "Course", "Admission Status", "Batch Status", "Assigned Trainer", "Last Updated", "Actions"].map((heading) => (
          <div key={heading} className="border-b border-[#E3ECE8] px-3 py-3">{heading}</div>
        ))}
      </div>
      <div className="divide-y divide-[#EDF3F1]">
        {admissions.map((item) => (
          <div key={item.id} className="grid gap-3 p-4 transition hover:bg-[#FBFDFC] xl:grid-cols-[1.05fr_1.1fr_1fr_0.95fr_0.9fr_1fr_0.85fr_54px] xl:items-center xl:gap-0 xl:p-0">
            <Cell label="Application ID" value={item.application_id} strong />
            <Cell label="Student Name" value={item.student_name} strong />
            <Cell label="Course" value={item.course} />
            <div className="xl:px-3 xl:py-3"><StatusBadge label={item.admission_status} /></div>
            <Cell label="Batch Status" value={item.batch_status ?? (item.batch === "Pending" ? "Pending" : "Assigned")} />
            <Cell label="Assigned Trainer" value={item.assigned_trainer ?? item.trainer ?? "Not Assigned"} />
            <Cell label="Last Updated" value={formatShortDate(item.last_updated ?? item.application_date)} />
            <ActionMenu admission={item} onView={onView} onApprove={onApprove} onReject={onReject} onAssign={onAssign} />
          </div>
        ))}
      </div>
      {!admissions.length ? (
        <div className="grid min-h-36 place-items-center px-4 py-8 text-center text-sm font-bold text-[#64748B]">
          {loading ? "Loading admissions..." : "No admissions match the selected filters."}
        </div>
      ) : null}
    </section>
  )
}

function Cell({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0 xl:px-3 xl:py-3">
      <p className="text-[11px] font-black uppercase text-[#94A3B8] xl:hidden">{label}</p>
      <p className={`truncate text-sm ${strong ? "font-black text-[#071B4A]" : "font-semibold text-[#475569]"}`}>{value}</p>
    </div>
  )
}

function ActionMenu({ admission, onView, onApprove, onReject, onAssign }: { admission: AdmissionRecord; onView: (admission: AdmissionRecord) => void; onApprove: (admission: AdmissionRecord) => void; onReject: (admission: AdmissionRecord) => void; onAssign: (admission: AdmissionRecord) => void }) {
  const [open, setOpen] = useState(false)
  const approved = isApprovedAdmission(admission)
  return (
    <div className="relative xl:px-3 xl:py-3">
      <button type="button" onClick={() => setOpen((current) => !current)} className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A] xl:w-9 xl:px-0">
        <span className="xl:hidden">Actions</span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <div className="absolute right-0 z-10 mt-2 w-48 rounded-lg border border-[#E3ECE8] bg-white p-1 shadow-xl">
          <MenuButton icon={Eye} label="View" onClick={() => { onView(admission); setOpen(false) }} />
          <MenuButton icon={CheckCircle2} label={approved ? admission.admission_status : "Approve"} disabled={approved} onClick={() => { onApprove(admission); setOpen(false) }} />
          <MenuButton icon={XCircle} label="Reject" onClick={() => { onReject(admission); setOpen(false) }} />
          <MenuButton icon={Layers3} label="Assign Batch" onClick={() => { onAssign(admission); setOpen(false) }} />
        </div>
      ) : null}
    </div>
  )
}

function MenuButton({ icon: Icon, label, onClick, disabled = false }: { icon: typeof FileText; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-black text-[#071B4A] hover:bg-[#E8F6F0] disabled:cursor-not-allowed disabled:opacity-60">
      <Icon size={15} className="text-[#0B7A5A]" />
      {label}
    </button>
  )
}

function isApprovedAdmission(admission: AdmissionRecord) {
  return admission.admission_status === "Approved" || admission.admission_status === "Student Created" || admission.admission_status === "Batch Assigned"
}

function isConvertedAdmission(admission: AdmissionRecord) {
  return admission.admission_status === "Approved" || admission.admission_status === "Student Created" || admission.admission_status === "Batch Assigned"
}

function formatShortDate(value: string) {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function StatusBadge({ label }: { label: string }) {
  const tone = label === "Approved" || label === "Student Created" || label === "Batch Assigned"
    ? "bg-[#E0F3E9] text-[#0B7A5A]"
    : label === "Rejected"
      ? "bg-[#FFF0F0] text-[#EF4444]"
      : "bg-[#FFF0DC] text-[#F97316]"
  return <span className={`inline-flex rounded px-2 py-1 text-[11px] font-black ${tone}`}>{label}</span>
}

function RecentAdmissions({ records }: { records: AdmissionRecord[] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-4 text-sm font-black text-[#071B4A]">Recent Admissions</h3>
      <div className="space-y-3">
        {records.map((item) => (
          <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-lg border border-[#EDF3F1] p-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#071B4A]">{item.student_name}</p>
              <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">{item.course} · {item.application_date}</p>
            </div>
            <StatusBadge label={item.admission_status} />
          </div>
        ))}
      </div>
    </section>
  )
}

function CounsellorLeaderboard({ rows }: { rows: Array<{ name: string; applications: number; approved: number; conversion: number }> }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <h3 className="mb-4 text-sm font-black text-[#071B4A]">Counsellor Performance</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[minmax(0,1fr)_78px_70px_82px] items-center gap-2 rounded-lg bg-[#FBFDFC] p-3 text-sm">
            <p className="truncate font-black text-[#071B4A]">{row.name}</p>
            <p className="text-right font-bold text-[#475569]">{row.applications}</p>
            <p className="text-right font-bold text-[#475569]">{row.approved}</p>
            <p className="text-right font-black text-[#0B7A5A]">{row.conversion}%</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function ReviewDrawer({ admission, onClose, onApprove, onReject, onAssign }: { admission: AdmissionRecord; onClose: () => void; onApprove: () => void; onReject: () => void; onAssign: () => void }) {
  const approved = isApprovedAdmission(admission)
  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/35">
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-black text-[#071B4A]">Review Admission</h3>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{admission.application_id}</p>
          </div>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
        </div>
        <div className="grid gap-3">
          <Detail label="Student Details" value={`${admission.student_name} · ${admission.phone} · ${admission.email}`} />
          <Detail label="Course Applied" value={admission.course} />
          <Detail label="Counsellor" value={admission.counsellor} />
          <Detail label="Application Date" value={admission.application_date} />
          <Detail label="Admission Status" value={admission.admission_status} />
          <Detail label="Batch" value={admission.batch !== "Pending" ? admission.batch : "Not Assigned"} />
          <Detail label="Admission Notes" value={admission.notes} />
          {approved ? <div className="rounded-lg border border-[#CFE8DF] bg-[#E8F6F0] px-3 py-2 text-xs font-black text-[#0B7A5A]">This admission is already {admission.admission_status}.</div> : null}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={onApprove} disabled={approved} className="h-10 rounded-lg bg-[#0B7A5A] text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">{approved ? admission.admission_status : "Approve"}</button>
          <button type="button" onClick={onReject} className="h-10 rounded-lg border border-[#FBD1D1] text-sm font-black text-[#EF4444]">Reject</button>
          <button type="button" onClick={onAssign} className="h-10 rounded-lg border border-[#DDE9E4] text-sm font-black text-[#071B4A]">Assign Batch</button>
        </div>
      </aside>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3">
      <p className="text-xs font-black uppercase text-[#64748B]">{label}</p>
      <p className="mt-1 text-sm font-black text-[#071B4A]">{value}</p>
    </div>
  )
}

function ConfirmModal({ title, detail, confirmLabel, onCancel, onConfirm }: { title: string; detail: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className="w-full max-w-md rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-[#071B4A]">{title}</h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#475569]">{detail}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white">{confirmLabel}</button>
        </div>
      </section>
    </div>
  )
}

function RejectModal({ state, setState, onCancel, onConfirm }: { state: RejectState; setState: (state: RejectState) => void; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className="w-full max-w-md rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-[#071B4A]">Reject Admission</h3>
        <p className="mt-2 text-sm font-semibold text-[#475569]">Reason is mandatory.</p>
        <div className="mt-4">
          <BranchAdminSelect label="Reason" value={state.reason} onChange={(reason) => setState({ ...state, reason })} placeholder="Select reason" options={rejectReasons.map((reason) => ({ label: reason, value: reason }))} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={!state.reason} className="h-10 rounded-lg bg-[#EF4444] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">Reject</button>
        </div>
      </section>
    </div>
  )
}



function BatchModal({ state, setState, options, onCancel, onConfirm }: { state: BatchState; setState: (state: BatchState) => void; options: AdmissionOptions; onCancel: () => void; onConfirm: () => void }) {
  const selectedCourse = options.courses.find((item) => item.id === state.course_id || item.title === state.course)
  const courseBatches = options.batches.filter((item) => {
    if (!selectedCourse) return true
    return item.course_id === selectedCourse.id || item.course === selectedCourse.title
  })
  const selectedBatch = courseBatches.find((item) => item.batch_name === state.batch || item.batch === state.batch)
  const timingOptions = selectedBatch?.timings ?? []
  const courseSelectOptions: BranchAdminSelectOption[] = options.courses.map((item) => ({ label: item.title, value: item.id }))
  const batchSelectOptions: BranchAdminSelectOption[] = courseBatches.map((item) => ({
    label: `${item.batch_name} | Capacity ${item.capacity} | Seats ${item.available_seats ?? 0} | ${item.mode ?? "Offline"}`,
    value: item.batch_name || item.batch,
  }))
  const trainerSelectOptions: BranchAdminSelectOption[] = options.trainers.map((item) => ({ label: item.full_name, value: item.id }))
  const timingSelectOptions: BranchAdminSelectOption[] = Array.from(new Set(timingOptions)).map((item) => ({ label: item, value: item }))
  const disabled = !state.course || !state.batch || !state.trainer || !state.timing
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className="w-full max-w-lg rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-black text-[#071B4A]">Assign Batch</h3>
        <div className="mt-4 grid gap-3">
          <BranchAdminSelect label="Course" value={selectedCourse?.id ?? state.course_id} options={courseSelectOptions} placeholder="Select course" onChange={(value) => {
            const course = options.courses.find((item) => item.id === value)
            setState({ ...state, course: course?.title ?? "", course_id: value, batch: "", timing: "" })
          }} />
          <BranchAdminSelect label="Batch" value={state.batch} options={batchSelectOptions} placeholder="Select batch" disabled={!state.course} onChange={(value) => {
            const batch = courseBatches.find((item) => item.batch_name === value || item.batch === value)
            setState({ ...state, batch: value, timing: batch?.timings?.[0] ?? "" })
          }} />
          <BranchAdminSelect label="Trainer" value={state.trainer_id} options={trainerSelectOptions} placeholder="Select trainer" onChange={(value) => {
            const trainer = options.trainers.find((item) => item.id === value)
            setState({ ...state, trainer: trainer?.full_name ?? "", trainer_id: value })
          }} />
          <BranchAdminSelect label="Timing" value={state.timing} options={timingSelectOptions} placeholder="Select timing" disabled={!state.batch} onChange={(value) => setState({ ...state, timing: value })} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={disabled} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">Save Assignment</button>
        </div>
      </section>
    </div>
  )
}
