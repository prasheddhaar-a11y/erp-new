"use client"

import Image from "next/image"
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import {
  Award,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

type StudentStatus = "Active" | "On Hold" | "Placement Ready" | "Inactive"

type StudentRecord = {
  id: string
  studentId: string
  name: string
  course: string
  batch: string
  joiningDate: string
  attendance: number
  status: StudentStatus
  phone: string
  email: string
  city: string
  branch: string
  guardian: string
  feeDue: string
  projects: number
  certificates: number
  nextFollowUp: string
  timeline: Array<{ id: string; title: string; detail: string; time: string }>
}

const students: StudentRecord[] = [
  {
    id: "stu-1001",
    studentId: "PS/26/001",
    name: "Aarav Menon",
    course: "Full Stack Development",
    batch: "FS-Weekend-01",
    joiningDate: "03 Jun 2026",
    attendance: 96,
    status: "Placement Ready",
    phone: "+91 98765 43210",
    email: "aarav.menon@example.com",
    city: "Kochi",
    branch: "Pinesphere Kochi",
    guardian: "Rajesh Menon",
    feeDue: "0",
    projects: 4,
    certificates: 3,
    nextFollowUp: "Today, 04:30 PM",
    timeline: [
      { id: "aarav-project", title: "Project submitted", detail: "E-commerce capstone completed and reviewed.", time: "2h ago" },
      { id: "aarav-attendance", title: "Attendance updated", detail: "Weekly attendance recorded at 96%.", time: "Yesterday" },
      { id: "aarav-note", title: "Counsellor note", detail: "Ready for placement mock interview.", time: "3 days ago" },
    ],
  },
  {
    id: "stu-1002",
    studentId: "PS/26/004",
    name: "Nandini R",
    course: "Data Science",
    batch: "DS-Morning-03",
    joiningDate: "15 May 2026",
    attendance: 89,
    status: "Active",
    phone: "+91 91234 56780",
    email: "nandini.r@example.com",
    city: "Chennai",
    branch: "Pinesphere Chennai",
    guardian: "Ravi Kumar",
    feeDue: "18,000",
    projects: 2,
    certificates: 2,
    nextFollowUp: "Tomorrow, 11:00 AM",
    timeline: [
      { id: "nandini-assignment", title: "Assignment reviewed", detail: "Statistics assignment needs one revision.", time: "1h ago" },
      { id: "nandini-fees", title: "Fee reminder", detail: "Partial payment reminder sent.", time: "Yesterday" },
      { id: "nandini-progress", title: "Progress note", detail: "On track with the current batch.", time: "4 days ago" },
    ],
  },
  {
    id: "stu-1003",
    studentId: "PS/26/007",
    name: "Imran Ali",
    course: "UI/UX Design",
    batch: "UX-Evening-02",
    joiningDate: "28 Apr 2026",
    attendance: 78,
    status: "On Hold",
    phone: "+91 90123 45678",
    email: "imran.ali@example.com",
    city: "Coimbatore",
    branch: "Pinesphere Coimbatore",
    guardian: "Sameena Ali",
    feeDue: "24,000",
    projects: 1,
    certificates: 1,
    nextFollowUp: "Friday, 02:00 PM",
    timeline: [
      { id: "imran-call", title: "Counsellor call", detail: "Course continuity discussed.", time: "Today" },
      { id: "imran-certificate", title: "Certificate issued", detail: "UI basics certificate shared.", time: "2 days ago" },
      { id: "imran-leave", title: "Leave update", detail: "Temporary pause requested by student.", time: "1 week ago" },
    ],
  },
]

const kpis: Array<{ label: string; value: string; icon: LucideIcon; color: string }> = [
  { label: "Total Students", value: "248", icon: Users, color: "#0F766E" },
  { label: "Active Students", value: "214", icon: CheckCircle2, color: "#16A34A" },
  { label: "New Students This Month", value: "38", icon: Sparkles, color: "#7C3AED" },
  { label: "Course-Wise Students", value: "12", icon: BookOpen, color: "#2563EB" },
  { label: "Placement Ready Students", value: "54", icon: BriefcaseBusiness, color: "#EA580C" },
]

const statusLabels: Record<StudentStatus, string> = {
  Active: "Active",
  "On Hold": "Temporarily Paused",
  "Placement Ready": "Placement Ready",
  Inactive: "Inactive",
}

const statusHelp: Record<StudentStatus, string> = {
  Active: "Currently studying and attending classes.",
  "On Hold": "Temporarily paused by request, fees, timing, or follow-up issue.",
  "Placement Ready": "Ready for placement and interview support.",
  Inactive: "Not currently active in counsellor follow-up or classes.",
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[24px] border border-[#DCE7E2] bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
      <div className="mb-4">
        <h2 className="text-[18px] font-black text-[#071B4A]">{title}</h2>
        <p className="mt-1 text-sm font-semibold text-[#60708C]">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function StatusBadge({ status }: { status: StudentStatus }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-black",
        status === "Placement Ready" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "Active" && "border-sky-200 bg-sky-50 text-sky-700",
        status === "On Hold" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "Inactive" && "border-slate-200 bg-slate-50 text-slate-600"
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export function CounsellorStudentsModule() {
  const [records, setRecords] = useState<StudentRecord[]>(students)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"All" | StudentStatus>("All")
  const [selectedId, setSelectedId] = useState(students[0].id)
  const [showAddStudent, setShowAddStudent] = useState(false)
  const detailRef = useRef<HTMLDivElement | null>(null)
  const [newStudent, setNewStudent] = useState({
    name: "",
    phone: "",
    email: "",
    course: "Full Stack Development",
    batch: "",
    city: "",
    branch: "",
    guardian: "",
  })

  const selected = records.find((student) => student.id === selectedId) ?? records[0]

  const filteredStudents = useMemo(() => {
    const text = query.trim().toLowerCase()
    return records.filter((student) => {
      const searchable = `${student.studentId} ${student.name} ${student.course} ${student.batch} ${student.city} ${student.branch}`.toLowerCase()
      return (!text || searchable.includes(text)) && (status === "All" || student.status === status)
    })
  }, [query, records, status])

  function handleFieldChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target
    setNewStudent((current) => ({ ...current, [name]: value }))
  }

  function handleCreateStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const studentId = `PS/26/${String(records.length + 1).padStart(3, "0")}`
    const created: StudentRecord = {
      id: `stu-${Date.now()}`,
      studentId,
      name: newStudent.name.trim(),
      course: newStudent.course.trim(),
      batch: newStudent.batch.trim() || "New Batch",
      joiningDate: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date()),
      attendance: 100,
      status: "Active",
      phone: newStudent.phone.trim(),
      email: newStudent.email.trim(),
      city: newStudent.city.trim(),
      branch: newStudent.branch.trim() || "Pinesphere Branch",
      guardian: newStudent.guardian.trim() || "Not added",
      feeDue: "0",
      projects: 0,
      certificates: 0,
      nextFollowUp: "Today, 05:00 PM",
      timeline: [
        {
          id: `created-${Date.now()}`,
          title: "Student created",
          detail: "Counsellor added the student from the Student Management page.",
          time: "Just now",
        },
      ],
    }

    setRecords((current) => [created, ...current])
    setSelectedId(created.id)
    setShowAddStudent(false)
    setNewStudent({
      name: "",
      phone: "",
      email: "",
      course: "Full Stack Development",
      batch: "",
      city: "",
      branch: "",
      guardian: "",
    })
  }

  function handleViewDetail(id: string) {
    setSelectedId(id)
    window.requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  function updateStudentStatus(nextStatus: StudentStatus) {
    setRecords((current) => current.map((student) => (
      student.id === selected.id
        ? {
            ...student,
            status: nextStatus,
            timeline: [
              {
                id: `status-${Date.now()}`,
                title: "Status updated",
                detail: `Counsellor changed status to ${statusLabels[nextStatus]}.`,
                time: "Just now",
              },
              ...student.timeline,
            ],
          }
        : student
    )))
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <section className="overflow-hidden rounded-[28px] border border-[#DCE7E2] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <GraduationCap size={14} />
              Counsellor Student Management
            </div>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-[#071B4A]">
              Student Management
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#60708C]">
              Track active students, course progress, attendance health, fees, projects, certificates, and communication history from one counsellor workspace.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">96%</p>
                <p className="text-xs font-bold text-[#60708C]">Top attendance</p>
              </div>
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">54</p>
                <p className="text-xs font-bold text-[#60708C]">Placement ready</p>
              </div>
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">12</p>
                <p className="text-xs font-bold text-[#60708C]">Course groups</p>
              </div>
            </div>
          </div>

          <div className="relative min-h-[280px] min-w-0 bg-[#063D36] p-6 text-white">
            <Image src="/pinesphere-hero.png" alt="Student workspace" fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover opacity-20" priority />
            <div className="relative z-10 flex h-full flex-col justify-end gap-4">
              <div className="rounded-[24px] border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-black uppercase text-emerald-100">Student spotlight</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-[22px] border border-white/30 bg-white/10">
                    <Image src="/pinesphere-hero.png" alt="Student profile" width={96} height={96} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xl font-black">Aarav Menon</p>
                    <p className="text-sm font-semibold text-emerald-50">Placement ready this week</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                  <p className="text-2xl font-black">96%</p>
                  <p className="text-xs text-emerald-50">Attendance</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                  <p className="text-2xl font-black">4</p>
                  <p className="text-xs text-emerald-50">Projects</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur">
                  <p className="text-2xl font-black">3</p>
                  <p className="text-xs text-emerald-50">Certificates</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kpis.map((metric) => {
          const Icon = metric.icon
          return (
            <article key={metric.label} className="rounded-[22px] border border-[#DCE7E2] bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-[#60708C]">{metric.label}</p>
                  <p className="mt-2 text-3xl font-black text-[#071B4A]">{metric.value}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${metric.color}16`, color: metric.color }}>
                  <Icon size={22} />
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <section className="grid min-w-0 gap-6">
        <Panel title="Student list" subtitle="Student ID, course, batch, joining date, attendance, and status.">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA0BA]" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-12 w-full rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] pl-11 pr-4 text-sm font-bold outline-none transition focus:border-[#0B7A5A]"
                placeholder="Search students..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["All", "Active", "On Hold", "Placement Ready", "Inactive"] as const).map((item) => (
                <button
                  key={item}
                  onClick={() => setStatus(item)}
                  className={cx(
                    "rounded-full border px-4 py-2 text-sm font-black transition",
                    status === item ? "border-[#0B7A5A] bg-[#0B7A5A] text-white" : "border-[#DCE7E2] bg-white text-[#40516F]"
                  )}
                  >
                    {item === "All" ? "All" : statusLabels[item]}
                  </button>
              ))}
              <button
                type="button"
                onClick={() => setShowAddStudent(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[#0B7A5A] bg-[#0B7A5A] px-4 py-2 text-sm font-black text-white shadow-[0_10px_18px_rgba(11,122,90,0.18)] transition hover:bg-[#095d45]"
              >
                <UserPlus size={16} />
                New Student
              </button>
            </div>
          </div>

          <div className="max-w-full overflow-x-auto rounded-[22px] border border-[#DCE7E2]">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-[#F7FBFA] text-[#8EA0BA]">
                <tr>
                  <th className="px-4 py-3 font-black">Student ID</th>
                  <th className="px-4 py-3 font-black">Student Name</th>
                  <th className="px-4 py-3 font-black">Course</th>
                  <th className="px-4 py-3 font-black">Batch</th>
                  <th className="px-4 py-3 font-black">Joining Date</th>
                  <th className="px-4 py-3 font-black">Attendance</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-t border-[#E7EFEA]">
                    <td className="px-4 py-4 font-black text-[#071B4A]">{student.studentId}</td>
                    <td className="px-4 py-4">
                      <p className="font-black text-[#071B4A]">{student.name}</p>
                      <p className="text-xs font-bold text-[#8EA0BA]">{student.city}</p>
                    </td>
                    <td className="px-4 py-4 font-bold text-[#40516F]">{student.course}</td>
                    <td className="px-4 py-4 font-bold text-[#40516F]">{student.batch}</td>
                    <td className="px-4 py-4 font-bold text-[#40516F]">{student.joiningDate}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-[#E7EFEA]">
                          <div className="h-full rounded-full bg-[#0B7A5A]" style={{ width: `${student.attendance}%` }} />
                        </div>
                        <span className="font-black text-[#071B4A]">{student.attendance}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={student.status} /></td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleViewDetail(student.id)}
                        className="rounded-full border border-[#DCE7E2] px-4 py-2 text-xs font-black text-[#40516F] transition hover:border-[#0B7A5A] hover:text-[#0B7A5A]"
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div ref={detailRef} className="grid min-w-0 scroll-mt-6 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Panel title="Student detail" subtitle="Profile, academic records, attendance, fee summary, and history.">
            <div className="overflow-hidden rounded-[24px] border border-[#DCE7E2]">
              <div className="relative h-52">
                <Image src="/pinesphere-hero.png" alt="Student detail cover" fill sizes="(min-width: 1280px) 50vw, 100vw" className="object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,27,74,0.08),rgba(7,27,74,0.72))]" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4 text-white">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[22px] border border-white/30">
                      <Image src="/pinesphere-hero.png" alt="Student avatar" width={96} height={96} className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-2xl font-black">{selected.name}</p>
                      <p className="truncate text-sm font-semibold text-white/90">{selected.studentId} - {selected.course}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge status={selected.status} />
                    <select
                      value={selected.status}
                      onChange={(event) => updateStudentStatus(event.target.value as StudentStatus)}
                      className="h-9 rounded-full border border-white/30 bg-white/95 px-3 text-xs font-black text-[#071B4A] outline-none"
                    >
                      {(["Active", "On Hold", "Placement Ready", "Inactive"] as StudentStatus[]).map((item) => (
                        <option key={item} value={item}>{statusLabels[item]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-xs font-black uppercase text-[#8EA0BA]">Profile information</p>
                  <div className="grid gap-2 text-sm font-bold text-[#40516F]">
                    <p className="flex items-center gap-2"><Phone size={16} className="text-[#0B7A5A]" /> {selected.phone}</p>
                    <p className="flex items-center gap-2"><Mail size={16} className="text-[#0B7A5A]" /> {selected.email}</p>
                    <p>Branch: {selected.branch}</p>
                    <p>Guardian: {selected.guardian}</p>
                    <p>Status meaning: {statusHelp[selected.status]}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-[#8EA0BA]">Academic snapshot</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-[#F7FBFA] p-3">
                      <p className="font-bold text-[#8EA0BA]">Batch</p>
                      <p className="mt-1 font-black text-[#071B4A]">{selected.batch}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F7FBFA] p-3">
                      <p className="font-bold text-[#8EA0BA]">Joining</p>
                      <p className="mt-1 font-black text-[#071B4A]">{selected.joiningDate}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F7FBFA] p-3">
                      <p className="font-bold text-[#8EA0BA]">Projects</p>
                      <p className="mt-1 font-black text-[#071B4A]">{selected.projects}</p>
                    </div>
                    <div className="rounded-2xl bg-[#F7FBFA] p-3">
                      <p className="font-bold text-[#8EA0BA]">Certificates</p>
                      <p className="mt-1 font-black text-[#071B4A]">{selected.certificates}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Attendance, fees, and activity" subtitle="Counsellor operating summary.">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-[#F7FBFA] p-4">
                <CalendarDays size={18} className="text-[#0B7A5A]" />
                <p className="mt-3 text-3xl font-black text-[#071B4A]">{selected.attendance}%</p>
                <p className="text-xs font-bold text-[#60708C]">Attendance</p>
              </div>
              <div className="rounded-2xl bg-[#F7FBFA] p-4">
                <ShieldCheck size={18} className="text-[#0B7A5A]" />
                <p className="mt-3 text-3xl font-black text-[#071B4A]">INR {selected.feeDue}</p>
                <p className="text-xs font-bold text-[#60708C]">Fee due</p>
              </div>
              <div className="rounded-2xl bg-[#F7FBFA] p-4">
                <Clock3 size={18} className="text-[#EA580C]" />
                <p className="mt-3 text-lg font-black text-[#071B4A]">{selected.nextFollowUp}</p>
                <p className="text-xs font-bold text-[#60708C]">Next follow-up</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {selected.timeline.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#E7EFEA] bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-[#071B4A]">{item.title}</p>
                    <span className="text-xs font-bold text-[#8EA0BA]">{item.time}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[#60708C]">{item.detail}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      {showAddStudent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B4A]/55 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[28px] border border-[#DCE7E2] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#E7EFEA] px-6 py-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7A5A]">Counsellor intake</p>
                <h3 className="mt-1 text-2xl font-black text-[#071B4A]">Add Student</h3>
                <p className="mt-1 text-sm font-semibold text-[#60708C]">Create a new student profile from this counsellor page.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStudent(false)}
                className="rounded-full border border-[#DCE7E2] px-4 py-2 text-sm font-black text-[#40516F]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="grid gap-4 px-6 py-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Student Name *
                <input name="name" value={newStudent.name} onChange={handleFieldChange} required className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Phone Number *
                <input name="phone" value={newStudent.phone} onChange={handleFieldChange} required className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Email Address *
                <input name="email" type="email" value={newStudent.email} onChange={handleFieldChange} required className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Course *
                <select name="course" value={newStudent.course} onChange={handleFieldChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]">
                  <option>Full Stack Development</option>
                  <option>Data Science</option>
                  <option>UI/UX Design</option>
                  <option>Digital Marketing</option>
                  <option>Python Pro</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Batch
                <input name="batch" value={newStudent.batch} onChange={handleFieldChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                City
                <input name="city" value={newStudent.city} onChange={handleFieldChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A]">
                Branch
                <input name="branch" value={newStudent.branch} onChange={handleFieldChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>
              <label className="grid gap-2 text-sm font-black text-[#071B4A] md:col-span-2">
                Guardian Name
                <input name="guardian" value={newStudent.guardian} onChange={handleFieldChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]" />
              </label>

              <div className="flex items-center justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="rounded-full border border-[#DCE7E2] px-5 py-3 text-sm font-black text-[#40516F]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white shadow-[0_12px_20px_rgba(11,122,90,0.18)]"
                >
                  <Plus size={16} />
                  Create Student
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

    </div>
  )
}
