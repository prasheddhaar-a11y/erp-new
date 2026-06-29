"use client"

import { Download, Eye, IdCard, Layers3, Pencil, Plus, Search, UserRound } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { BranchAdminSelect } from "./BranchAdminSelect"
import { assignStudentBatch, createStudent, getBatches, getStudentProfile, getStudents, updateStudent, type BatchRecord } from "@/lib/api/branchAdmin"
import { getBatchOptions, getCourseOptions, getStatusOptions, type BatchOption, type CourseOption, type StatusOption } from "@/lib/api/branchAdminOptions"
import { resolveBranchScope } from "@/lib/api/branchAdminData"

type StudentRow = {
  branch_id: string
  id: string
  full_name: string
  email: string
  phone?: string | null
  course_enrolled?: string | null
  batch_name?: string | null
  student_status?: string | null
  is_active?: boolean
  role?: string
  display_code?: string | null
  attendance_percent?: number
  fees_paid?: number
  fees_pending?: number
  parent_name?: string | null
  parent_phone?: string | null
}

type StudentForm = {
  full_name: string
  email: string
  phone: string
  course_enrolled: string
  batch_name: string
  student_status: string
}

type StudentProfile = StudentRow & {
  attendance_summary?: { attendance_percent?: number; last_present?: string; total_records?: number }
  fee_summary?: { paid?: number; pending?: number }
  lms_progress?: { average_progress?: number; active_enrollments?: number }
  enrollments?: Array<{ course?: string; batch_name?: string; status?: string; progress_percent?: number }>
  invoices?: Array<{ invoice_number?: string; pending_amount?: number; status?: string }>
}

const defaultStudentScope = resolveBranchScope()

const emptyForm: StudentForm = {
  full_name: "",
  email: "",
  phone: "",
  course_enrolled: "",
  batch_name: "",
  student_status: "active",
}

function normalizeStudent(row: StudentRow): StudentRow {
  return {
    ...row,
    course_enrolled: row.course_enrolled || "Pending",
    batch_name: row.batch_name || "Pending",
    student_status: row.student_status || (row.is_active === false ? "inactive" : "active"),
  }
}

export function BranchAdminStudentsPage() {
  const session = useMemo(() => readBranchAdminSession(), [])
  const branch = useMemo(() => session?.branch ?? defaultStudentScope, [session])
  const [students, setStudents] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [course, setCourse] = useState("all")
  const [batch, setBatch] = useState("all")
  const [status, setStatus] = useState("all")
  const [viewing, setViewing] = useState<StudentProfile | null>(null)
  const [editing, setEditing] = useState<StudentRow | null>(null)
  const [assigning, setAssigning] = useState<StudentRow | null>(null)
  const [idCard, setIdCard] = useState<StudentRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [courseOptions, setCourseOptions] = useState<CourseOption[]>([])
  const [batchOptions, setBatchOptions] = useState<BatchOption[]>([])
  const [studentStatusOptions, setStudentStatusOptions] = useState<StatusOption[]>([])
  const [toast, setToast] = useState("")

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
    async function loadStudents() {
      setLoading(true)
      try {
        const userStudents = await getStudents()
        const nextStudents = userStudents
          .filter((row) => !row.role || row.role === "student")
          .map((row) => ({ ...row, branch_id: row.branch_id || branch.branch_id }))
          .map(normalizeStudent)

        if (!cancelled) {
          setStudents(nextStudents)
          setNotice("")
          setLoading(false)
        }

        const [branchBatchResult, courseResult, optionBatchResult, statusResult] = await Promise.allSettled([getBatches(), getCourseOptions(), getBatchOptions(), getStatusOptions("students")])
        if (!cancelled) {
          if (branchBatchResult.status === "fulfilled") setBatches(branchBatchResult.value)
          if (courseResult.status === "fulfilled") setCourseOptions(courseResult.value)
          if (optionBatchResult.status === "fulfilled") setBatchOptions(optionBatchResult.value)
          if (statusResult.status === "fulfilled") setStudentStatusOptions(statusResult.value)
        }
      } catch {
        if (!cancelled) {
          setStudents([])
          setNotice("Live API unavailable")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadStudents()
    return () => {
      cancelled = true
    }
  }, [branch, session])

  const courses = useMemo(() => courseOptions.map((item) => item.title || item.label), [courseOptions])
  const batchNames = useMemo(() => Array.from(new Set((batchOptions.length ? batchOptions : batches).map((item) => item.batch_name || item.batch).filter(Boolean))), [batchOptions, batches])
  const statuses = useMemo(() => {
    const liveStatuses = studentStatusOptions.map((item) => item.value).filter(Boolean)
    return liveStatuses.length ? liveStatuses : Array.from(new Set(students.map((student) => (student.student_status || "active").toLowerCase())))
  }, [studentStatusOptions, students])

  const filteredStudents = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return students.filter((student) => {
      const matchesSearch = !needle || [student.full_name, student.email, student.phone, student.course_enrolled, student.batch_name].some((value) => String(value ?? "").toLowerCase().includes(needle))
      const matchesCourse = course === "all" || student.course_enrolled === course
      const matchesBatch = batch === "all" || student.batch_name === batch
      const normalizedStatus = (student.student_status || "active").toLowerCase()
      const matchesStatus = status === "all" || normalizedStatus === status
      return matchesSearch && matchesCourse && matchesBatch && matchesStatus
    })
  }, [batch, course, query, status, students])

  const totalStudents = students.length
  const activeStudents = students.filter((student) => student.is_active !== false && (student.student_status || "active").toLowerCase() === "active").length
  const newAdmissions = students.filter((student) => (student.student_status || "").toLowerCase() === "new" || student.id.includes("BA-STU")).length
  const pendingBatch = students.filter((student) => !student.batch_name || student.batch_name === "Pending").length

  function upsertLocalStudent(student: StudentRow) {
    setStudents((current) => {
      const exists = current.some((row) => row.id === student.id)
      return exists ? current.map((row) => row.id === student.id ? student : row) : [student, ...current]
    })
  }

  async function openStudentProfile(student: StudentRow) {
    setViewing(normalizeStudent(student))
    try {
      const profile = await getStudentProfile(student.id)
      setViewing(normalizeStudent({ ...student, ...profile }) as StudentProfile)
      showToast("Student profile loaded.")
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Live API unavailable")
    }
  }

  function exportStudents() {
    if (!filteredStudents.length) {
      showToast("No student data to export.")
      return
    }
    downloadCsv("branch_students.csv", ["Student Name", "Email", "Phone", "Course", "Batch", "Status", "Branch"], filteredStudents.map((student) => [
      student.full_name,
      student.email,
      student.phone || "",
      student.course_enrolled || "",
      student.batch_name || "",
      student.student_status || "",
      branch.branch_name,
    ]))
    showToast("Export downloaded successfully.")
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Student Management</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">Directory, profiles, batch assignment, attendance, and fee summaries for {branch.branch_name}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportStudents} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#071B4A]">
            <Download size={17} />
            Export
          </button>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.24)]">
            <Plus size={17} />
            Create Student
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Students" value={totalStudents} />
        <KpiCard label="Active Students" value={activeStudents} />
        <KpiCard label="New Admissions" value={newAdmissions} />
        <KpiCard label="Pending Batch Assignment" value={pendingBatch} />
      </section>

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_160px]">
          <label className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search students" className="h-11 w-full rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] pl-10 pr-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:bg-white" />
          </label>
          <FilterSelect value={course} onChange={setCourse} options={courses} label="Course" />
          <FilterSelect value={batch} onChange={setBatch} options={batchNames} label="Batch" />
          <FilterSelect value={status} onChange={setStatus} options={statuses} label="Status" />
        </div>
        {notice ? <div className="mt-3 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{notice}</div> : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="overflow-hidden">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#F8FAF8] text-xs uppercase text-[#475569]">
              <tr>
                {["Student Name", "Email", "Phone", "Course", "Batch", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="border-b border-[#E3ECE8] px-4 py-3 font-black">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-[#EDF3F1] last:border-b-0">
                  <td className="truncate px-4 py-3 font-black text-[#071B4A]">{student.full_name}</td>
                  <td className="truncate px-4 py-3 font-semibold text-[#475569]">{student.email}</td>
                  <td className="truncate px-4 py-3 font-semibold text-[#475569]">{student.phone || "Pending"}</td>
                  <td className="truncate px-4 py-3 font-semibold text-[#475569]">{student.course_enrolled || "Pending"}</td>
                  <td className="truncate px-4 py-3 font-semibold text-[#475569]">{student.batch_name || "Pending"}</td>
                  <td className="px-4 py-3"><StatusBadge status={student.student_status || "active"} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => openStudentProfile(student)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#0B7A5A]">
                        <Eye size={15} />
                        View
                      </button>
                      <button type="button" onClick={() => setEditing(student)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                        <Pencil size={15} />
                        Edit
                      </button>
                      <button type="button" onClick={() => setAssigning(student)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                        <Layers3 size={15} />
                        Assign Batch
                      </button>
                      <button type="button" onClick={() => setIdCard(student)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                        <IdCard size={15} />
                        ID Card
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filteredStudents.length ? (
          <div className="grid min-h-36 place-items-center px-4 py-8 text-center text-sm font-bold text-[#64748B]">
            {loading ? "Loading students..." : "No students match the selected filters."}
          </div>
        ) : null}
      </section>

      {viewing ? <StudentDetailModal student={viewing} onClose={() => setViewing(null)} /> : null}
      {editing ? <StudentFormModal mode="edit" student={editing} courses={courseOptions} batches={batchOptions} statuses={studentStatusOptions} onClose={() => setEditing(null)} onSaved={(student) => { upsertLocalStudent(student); showToast("Student updated successfully.") }} /> : null}
      {assigning ? <AssignBatchModal student={assigning} batches={batchOptions} onClose={() => setAssigning(null)} onSaved={(student) => { upsertLocalStudent(student); setAssigning(null); showToast("Batch assigned successfully.") }} /> : null}
      {idCard ? <IdCardModal student={idCard} branchName={branch.branch_name} onClose={() => setIdCard(null)} /> : null}
      {creating ? <StudentFormModal mode="create" courses={courseOptions} batches={batchOptions} statuses={studentStatusOptions} onClose={() => setCreating(false)} onSaved={(student) => { upsertLocalStudent(student); showToast("Student saved successfully.") }} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-h-[112px] rounded-lg border border-[#CFE8DF] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[#0F172A]">{label}</h3>
          <p className="mt-2 text-2xl font-black text-[#020617]">{value.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-xs font-semibold text-[#475569]">Branch scope</p>
        </div>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
          <UserRound size={21} />
        </span>
      </div>
    </div>
  )
}

function FilterSelect({ value, onChange, options, label }: { value: string; onChange: (value: string) => void; options: string[]; label: string }) {
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

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const active = normalized === "active" || normalized === "new"
  return (
    <span className={`inline-flex rounded px-2 py-1 text-[11px] font-black ${active ? "bg-[#E0F3E9] text-[#0B7A5A]" : normalized === "pending" ? "bg-[#FFF0DC] text-[#F97316]" : "bg-[#F1F5F9] text-[#475569]"}`}>
      {status}
    </span>
  )
}

function StudentDetailModal({ student, onClose }: { student: StudentProfile; onClose: () => void }) {
  const attendance = student.attendance_summary
  const fees = student.fee_summary
  const lms = student.lms_progress
  const detailGroups = [
    {
      title: "Personal Information",
      rows: [["Student Name", student.full_name], ["Email", student.email], ["Phone", student.phone || "Pending"], ["Status", student.student_status || "active"]],
    },
    {
      title: "Parent Information",
      rows: [["Parent Name", String((student as Record<string, unknown>).parent_name ?? "Pending")], ["Parent Phone", String((student as Record<string, unknown>).parent_phone ?? "Pending")]],
    },
    {
      title: "Course Information",
      rows: [["Course", student.course_enrolled || student.enrollments?.[0]?.course || "Pending"], ["Batch", student.batch_name || student.enrollments?.[0]?.batch_name || "Pending"], ["LMS Progress", `${Math.round(lms?.average_progress ?? 0)}%`]],
    },
    {
      title: "Attendance Summary",
      rows: [["Attendance", `${Math.round(attendance?.attendance_percent ?? student.attendance_percent ?? 0)}%`], ["Last Present", formatDisplayValue(attendance?.last_present)], ["Records", String(attendance?.total_records ?? 0)]],
    },
    {
      title: "Fee Summary",
      rows: [["Paid", `Rs ${Math.round(fees?.paid ?? 0).toLocaleString("en-IN")}`], ["Pending", `Rs ${Math.round(fees?.pending ?? student.fees_pending ?? 0).toLocaleString("en-IN")}`], ["Invoices", String(student.invoices?.length ?? 0)]],
    },
  ]
  return (
    <Modal title="View Student" onClose={onClose}>
      <div className="grid gap-3 text-sm">
        {detailGroups.map((group) => (
          <section key={group.title} className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3">
            <h4 className="text-xs font-black uppercase text-[#0B7A5A]">{group.title}</h4>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {group.rows.map(([label, value]) => (
                <div key={`${group.title}-${label}`} className="min-w-0">
                  <p className="text-[11px] font-black uppercase text-[#64748B]">{label}</p>
                  <p className="mt-1 truncate font-black text-[#071B4A]">{value}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  )
}

function AssignBatchModal({ student, batches, onClose, onSaved }: { student: StudentRow; batches: BatchOption[]; onClose: () => void; onSaved: (student: StudentRow) => void }) {
  const [batch, setBatch] = useState(student.batch_name && student.batch_name !== "Pending" ? student.batch_name : batches[0]?.batch_name ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function save() {
    if (!batch) return
    setSaving(true)
    setError("")
    try {
      const saved = await assignStudentBatch(student.id, { batch_name: batch })
      onSaved(normalizeStudent({ ...student, ...saved, batch_name: batch }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live API unavailable")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Assign Batch" onClose={onClose}>
      <div className="grid gap-3">
        <p className="text-sm font-bold text-[#475569]">{student.full_name}</p>
        <BranchAdminSelect
          label="Batch"
          value={batch}
          onChange={setBatch}
          placeholder={batches.length ? "Select batch" : "No batches available"}
          options={batches.map((item) => ({ label: item.label ?? item.batch_name, value: item.batch_name }))}
        />
        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={save} disabled={saving || !batch} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:opacity-60">{saving ? "Saving..." : "Save Batch"}</button>
        </div>
      </div>
    </Modal>
  )
}

function IdCardModal({ student, branchName, onClose }: { student: StudentRow; branchName: string; onClose: () => void }) {
  return (
    <Modal title="Student ID Card" onClose={onClose}>
      <div className="mx-auto max-w-sm rounded-lg border border-[#0B7A5A] bg-[#FBFDFC] p-5 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6F0] text-xl font-black text-[#0B7A5A]">
          {student.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <h3 className="mt-3 text-lg font-black text-[#071B4A]">{student.full_name}</h3>
        <p className="text-xs font-bold text-[#64748B]">{student.display_code || student.id}</p>
        <div className="mt-4 grid gap-2 text-left text-sm">
          <p><span className="font-black text-[#071B4A]">Course:</span> {student.course_enrolled || "Pending"}</p>
          <p><span className="font-black text-[#071B4A]">Batch:</span> {student.batch_name || "Pending"}</p>
          <p><span className="font-black text-[#071B4A]">Branch:</span> {branchName}</p>
        </div>
        <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded border border-dashed border-[#0B7A5A] bg-white text-[10px] font-black text-[#0B7A5A]">QR</div>
      </div>
      <div className="mt-4 flex justify-end">
        <button type="button" onClick={() => window.print()} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white">Print</button>
      </div>
    </Modal>
  )
}

function StudentFormModal({ mode, student, courses, batches, statuses, onClose, onSaved }: { mode: "create" | "edit"; student?: StudentRow; courses: CourseOption[]; batches: BatchOption[]; statuses: StatusOption[]; onClose: () => void; onSaved: (student: StudentRow) => void }) {
  const [form, setForm] = useState<StudentForm>({
    ...emptyForm,
    full_name: student?.full_name ?? "",
    email: student?.email ?? "",
    phone: student?.phone ?? "",
    course_enrolled: student?.course_enrolled ?? "",
    batch_name: student?.batch_name ?? "",
    student_status: student?.student_status ?? "active",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function saveStudent() {
    setSaving(true)
    setError("")
    const session = readBranchAdminSession()
    const localStudent: StudentRow = normalizeStudent({
      id: student?.id ?? `BA-STU-${Date.now()}`,
      branch_id: session?.branch.branch_id ?? defaultStudentScope.branch_id,
      ...form,
      is_active: form.student_status !== "inactive",
      role: "student",
    })

    try {
      if (session) {
        const saved = mode === "edit" && student?.id
          ? await updateStudent(student.id, { ...form, role: "student", branch_id: session.branch.branch_id })
          : await createStudent({ ...form, role: "student", branch_id: session.branch.branch_id })
        onSaved(normalizeStudent({ ...localStudent, ...saved }))
      } else {
        onSaved(localStudent)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? `Live API unavailable: ${err.message}` : "Live API unavailable")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === "edit" ? "Edit Student" : "Create Student"} onClose={onClose}>
      <div className="grid gap-3">
        <TextField label="Student Name" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} />
        <TextField label="Email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} />
        <TextField label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
        <BranchAdminSelect label="Course" value={form.course_enrolled} placeholder={courses.length ? "Select course" : "No courses available"} options={courses.map((item) => ({ label: item.label, value: item.title }))} onChange={(value) => setForm((current) => ({ ...current, course_enrolled: value }))} />
        <BranchAdminSelect label="Batch" value={form.batch_name} placeholder="Select batch" options={batches.map((item) => ({ label: item.label ?? item.batch_name, value: item.batch_name }))} onChange={(value) => setForm((current) => ({ ...current, batch_name: value }))} />
        <BranchAdminSelect label="Status" value={form.student_status} placeholder="Select status" options={(statuses.length ? statuses.map((item) => ({ label: item.label, value: item.value })) : ["active", "pending", "inactive"].map((item) => ({ label: item, value: item })))} onChange={(value) => setForm((current) => ({ ...current, student_status: value }))} />
        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={saveStudent} disabled={saving || !form.full_name || !form.email} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white shadow-xl">{message}</div>
}

function formatDisplayValue(value?: string) {
  if (!value) return "Pending"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-semibold normal-case text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:bg-white" />
    </label>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#071B4A]">{title}</h3>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
        </div>
        {children}
      </section>
    </div>
  )
}
