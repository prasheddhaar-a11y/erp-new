"use client"

import { Download, Eye, IdCard, Layers3, Pencil, Plus, Search, UserRound } from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { BranchAdminSelect } from "./BranchAdminSelect"
import { 
  getBranchUsers, 
  getBranchUser, 
  createBranchUser, 
  updateBranchUser, 
  assignBranchUser, 
  updateBranchUserStatus, 
  exportBranchUsers,
  getRoleOptions,
  getCourseOptions,
  getBatchOptions,
  type BranchUserRecord,
  type OptionRecord
} from "@/lib/api/branchAdminUsers"
import { resolveBranchScope } from "@/lib/api/branchAdminData"

const defaultScope = resolveBranchScope()

type UserForm = {
  full_name: string
  email: string
  phone: string
  role: string
  password?: string
  status: string
  course_enrolled?: string
  batch_name?: string
  specialization?: string
  target_course?: string
  permission_type?: string
}

const emptyForm: UserForm = {
  full_name: "",
  email: "",
  phone: "",
  role: "student",
  password: "",
  status: "active",
  course_enrolled: "",
  batch_name: "",
  specialization: "",
  target_course: "",
  permission_type: "Standard"
}

export function BranchAdminUsersPage() {
  const session = useMemo(() => readBranchAdminSession(), [])
  const branch = useMemo(() => session?.branch ?? defaultScope, [session])
  const [users, setUsers] = useState<BranchUserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [query, setQuery] = useState("")
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [course, setCourse] = useState("all")
  const [batch, setBatch] = useState("all")
  
  const [viewing, setViewing] = useState<BranchUserRecord | null>(null)
  const [editing, setEditing] = useState<BranchUserRecord | null>(null)
  const [assigning, setAssigning] = useState<BranchUserRecord | null>(null)
  const [idCard, setIdCard] = useState<BranchUserRecord | null>(null)
  const [creating, setCreating] = useState(false)
  const [courses, setCourses] = useState<OptionRecord[]>([])
  const [batches, setBatches] = useState<OptionRecord[]>([])
  const [roles, setRoles] = useState<OptionRecord[]>([])
  const [toast, setToast] = useState("")

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const allUsers = await getBranchUsers()
      setUsers(allUsers)
      setNotice("")
      setLoading(false)

      const [courseResult, batchResult, roleResult] = await Promise.allSettled([
        getCourseOptions(),
        getBatchOptions(),
        getRoleOptions()
      ])

      if (courseResult.status === "fulfilled") setCourses(courseResult.value)
      if (batchResult.status === "fulfilled") setBatches(batchResult.value)
      if (roleResult.status === "fulfilled") {
        setRoles(roleResult.value)
      } else {
        setRoles([
          { id: "student", value: "student", label: "Student" },
          { id: "trainer", value: "trainer", label: "Trainer" },
          { id: "counsellor", value: "counsellor", label: "Counsellor" },
          { id: "finance", value: "finance", label: "Finance" }
        ])
      }
    } catch (err) {
      setUsers([])
      setNotice("Live API unavailable")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    loadData()
  }, [branch, session])

  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return users.filter((u) => {
      const matchesSearch = !needle || [u.full_name, u.email, u.phone, u.course_enrolled, u.batch_name].some((value) => String(value ?? "").toLowerCase().includes(needle))
      
      const matchesRole = role === "all" || u.role.toLowerCase() === role.toLowerCase()
      
      const userStatus = u.is_active ? "active" : "inactive"
      const matchesStatus = status === "all" || userStatus === status
      
      const matchesCourse = course === "all" || u.course_enrolled === course
      const matchesBatch = batch === "all" || u.batch_name === batch
      
      return matchesSearch && matchesRole && matchesStatus && matchesCourse && matchesBatch
    })
  }, [batch, course, query, role, status, users])

  // Top KPI Card Summaries
  const totalUsers = users.length
  const studentsCount = users.filter((u) => u.role === "student").length
  const trainersCount = users.filter((u) => u.role === "trainer").length
  const counsellorsCount = users.filter((u) => u.role === "counsellor").length
  const financeCount = users.filter((u) => u.role === "finance").length
  const inactiveCount = users.filter((u) => !u.is_active).length

  const courseNames = useMemo(() => courses.map((item) => item.label), [courses])
  const batchNames = useMemo(() => Array.from(new Set(batches.map((item) => String(item.value || item.batch_name || item.label || "")).filter(Boolean))), [batches])

  async function handleToggleStatus(u: BranchUserRecord) {
    if (u.id === session?.user.id) {
      showToast("Cannot deactivate yourself.")
      return
    }
    if (u.role === "super_admin") {
      showToast("Cannot deactivate a Super Admin.")
      return
    }
    
    const nextStatus = !u.is_active
    try {
      await updateBranchUserStatus(u.id, nextStatus)
      setUsers(curr => curr.map(item => item.id === u.id ? { ...item, is_active: nextStatus, status: nextStatus ? "active" : "inactive" } : item))
      showToast(`User ${nextStatus ? "activated" : "deactivated"} successfully.`)
    } catch (err) {
      showToast("Failed to update status.")
    }
  }

  async function handleExport() {
    if (!filteredUsers.length) {
      showToast("No user data to export.")
      return
    }
    try {
      const blob = await exportBranchUsers({
        search: query || undefined,
        role: role !== "all" ? role : undefined,
        status: status !== "all" ? status : undefined,
        course_id: course !== "all" ? courses.find(c => c.label === course)?.id : undefined,
        batch_name: batch !== "all" ? batch : undefined
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "branch_users.csv"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast("Export downloaded successfully.")
    } catch (err) {
      showToast("Failed to export users.")
    }
  }

  async function openUserProfile(user: BranchUserRecord) {
    setViewing(user)
    try {
      const profile = await getBranchUser(user.id)
      setViewing(profile)
      showToast("User profile loaded.")
    } catch (err) {
      showToast("Live API unavailable")
    }
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">Users Management</h2>
          <p className="mt-1.5 text-sm font-semibold text-[#475569]">Manage branch students, trainers, counsellors, and finance users for {branch.branch_name}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#071B4A]">
            <Download size={17} />
            Export CSV
          </button>
          <button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.24)]">
            <Plus size={17} />
            Create User
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Total Users" value={totalUsers} color="bg-[#E8F6F0] text-[#0B7A5A]" />
        <KpiCard label="Students" value={studentsCount} color="bg-[#EBF3FE] text-[#1D4ED8]" />
        <KpiCard label="Trainers" value={trainersCount} color="bg-[#FDF2F8] text-[#DB2777]" />
        <KpiCard label="Counsellors" value={counsellorsCount} color="bg-[#FEF3C7] text-[#D97706]" />
        <KpiCard label="Finance Users" value={financeCount} color="bg-[#ECE9FE] text-[#6D28D9]" />
        <KpiCard label="Inactive Users" value={inactiveCount} color="bg-[#F1F5F9] text-[#475569]" />
      </section>

      <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(200px,1fr)_160px_160px_160px_160px]">
          <label className="relative min-w-0">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users by name, email, phone" className="h-11 w-full rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] pl-10 pr-3 text-sm font-semibold text-[#0F172A] outline-none transition focus:border-[#0B7A5A] focus:bg-white" />
          </label>
          <FilterSelect value={role} onChange={setRole} options={roles.map(r => r.label)} label="Role" />
          <FilterSelect value={status} onChange={setStatus} options={["Active", "Inactive"]} label="Status" />
          <FilterSelect value={course} onChange={setCourse} options={courseNames} label="Course" />
          <FilterSelect value={batch} onChange={setBatch} options={batchNames} label="Batch" />
        </div>
        {notice ? <div className="mt-3 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{notice}</div> : null}
      </section>

      <section className="overflow-hidden rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-sm">
            <thead className="bg-[#F8FAF8] text-xs uppercase text-[#475569]">
              <tr>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[15%]">User Name</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[18%]">Email</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[12%]">Phone</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[10%]">Role</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[18%]">Course / Specialization</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[12%]">Batch / Assigned</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[10%]">Status</th>
                <th className="border-b border-[#E3ECE8] px-4 py-3 font-black w-[25%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const roleLabel = u.role.replace("_", " ").toUpperCase()
                const isActive = u.is_active !== false
                const displayStatus = u.role === "student" ? (u.student_status || (isActive ? "active" : "inactive")) : (isActive ? "active" : "inactive")
                return (
                  <tr key={u.id} className="border-b border-[#EDF3F1] last:border-b-0">
                    <td className="truncate px-4 py-3 font-black text-[#071B4A]">{u.full_name}</td>
                    <td className="truncate px-4 py-3 font-semibold text-[#475569]">{u.email}</td>
                    <td className="truncate px-4 py-3 font-semibold text-[#475569]">{u.phone || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        u.role === "student" ? "bg-blue-100 text-blue-800" :
                        u.role === "trainer" ? "bg-pink-100 text-pink-800" :
                        u.role === "counsellor" ? "bg-amber-100 text-amber-800" :
                        "bg-purple-100 text-purple-800"
                      }`}>
                        {roleLabel}
                      </span>
                    </td>
                    <td className="truncate px-4 py-3 font-semibold text-[#475569]">{u.course_enrolled || "N/A"}</td>
                    <td className="truncate px-4 py-3 font-semibold text-[#475569]">{u.batch_name || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded px-2 py-1 text-[11px] font-black ${isActive ? "bg-[#E0F3E9] text-[#0B7A5A]" : "bg-[#F1F5F9] text-[#475569]"}`}>
                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => openUserProfile(u)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#0B7A5A]">
                          <Eye size={15} />
                          View
                        </button>
                        <button type="button" onClick={() => setEditing(u)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                          <Pencil size={15} />
                          Edit
                        </button>
                        <button type="button" onClick={() => setAssigning(u)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                          <Layers3 size={15} />
                          Assign
                        </button>
                        <button type="button" onClick={() => handleToggleStatus(u)} className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-black ${isActive ? "border-red-200 text-red-600 hover:bg-red-50" : "border-emerald-200 text-[#0B7A5A] hover:bg-emerald-50"}`}>
                          {isActive ? "Deactivate" : "Activate"}
                        </button>
                        {u.role === "student" && (
                          <button type="button" onClick={() => setIdCard(u)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">
                            <IdCard size={15} />
                            ID Card
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {!filteredUsers.length ? (
          <div className="grid min-h-36 place-items-center px-4 py-8 text-center text-sm font-bold text-[#64748B]">
            {loading ? "Loading users..." : "No users match the selected filters."}
          </div>
        ) : null}
      </section>

      {viewing ? <UserDetailModal user={viewing} onClose={() => setViewing(null)} /> : null}
      {editing ? (
        <UserFormModal 
          mode="edit" 
          user={editing} 
          courses={courses} 
          batches={batches} 
          roles={roles} 
          onClose={() => setEditing(null)} 
          onSaved={() => { loadData(); showToast("User updated successfully.") }} 
        />
      ) : null}
      {assigning ? (
        <AssignModal 
          user={assigning} 
          courses={courses}
          batches={batches} 
          onClose={() => setAssigning(null)} 
          onSaved={() => { loadData(); setAssigning(null); showToast("Fields assigned successfully.") }} 
        />
      ) : null}
      {idCard ? <IdCardModal student={idCard} branchName={branch.branch_name} onClose={() => setIdCard(null)} /> : null}
      {creating ? (
        <UserFormModal 
          mode="create" 
          courses={courses} 
          batches={batches} 
          roles={roles} 
          onClose={() => setCreating(false)} 
          onSaved={() => { loadData(); showToast("User created successfully.") }} 
        />
      ) : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="min-h-[112px] rounded-lg border border-[#CFE8DF] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-xs font-black text-[#0F172A]">{label}</h3>
          <p className="mt-2 text-2xl font-black text-[#020617]">{value.toLocaleString("en-IN")}</p>
          <p className="mt-2 text-[10px] font-semibold text-[#475569]">Branch scope</p>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}>
          <UserRound size={18} />
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

function UserDetailModal({ user, onClose }: { user: BranchUserRecord; onClose: () => void }) {
  const roleLabel = user.role.replace("_", " ").toUpperCase()
  
  const detailGroups: Array<{ title: string; rows: Array<[string, string]> }> = [
    {
      title: "Personal Information",
      rows: [
        ["Full Name", user.full_name], 
        ["Email", user.email], 
        ["Phone", user.phone || "N/A"], 
        ["Role", roleLabel],
        ["Branch Name", user.branch_name],
        ["Status", user.is_active ? "Active" : "Inactive"],
        ["Display ID", user.display_code || user.id],
        ["Created Date", formatDisplayValue(user.created_at)]
      ],
    }
  ]

  if (user.role === "student") {
    const lms = user.lms_progress
    detailGroups.push({
      title: "Student Specific Details",
      rows: [
        ["Course", user.course_enrolled || "Pending"],
        ["Batch", user.batch_name || "Pending"],
        ["Attendance", `${Math.round(user.attendance_percent ?? 0)}%`],
        ["Fee Status", user.fee_status || "PENDING"],
        ["Status", user.student_status || (user.is_active ? "active" : "inactive")],
        ["LMS Progress", `${Math.round(lms?.average_progress ?? 0)}% (Active Courses: ${lms?.active_enrollments ?? 0})`]
      ]
    })
  } else if (user.role === "trainer") {
    detailGroups.push({
      title: "Trainer Specific Details",
      rows: [
        ["Specialization", user.specialization || "General"],
        ["Assigned Batches", user.assigned_batches || "None"],
        ["Weekly Classes", String(user.weekly_classes ?? 0)],
        ["Workload Status", user.workload_status || "Balanced"]
      ]
    })
  } else if (user.role === "counsellor") {
    detailGroups.push({
      title: "Counsellor Specific Details",
      rows: [
        ["Target Course Category", user.course_enrolled || "General Counselling"],
        ["Assigned Leads", String(user.assigned_leads ?? 0)],
        ["Admissions Converted", String(user.admissions_converted ?? 0)],
        ["Pending Follow-Ups", String(user.follow_up_count ?? 0)]
      ]
    })
  } else if (user.role === "finance") {
    detailGroups.push({
      title: "Finance Specific Details",
      rows: [
        ["Finance Access Type", user.course_enrolled || "Branch Finance"],
        ["Fee Records Handled", String(user.fee_records_handled ?? 0)],
        ["Receipts Generated", String(user.receipts_generated ?? 0)]
      ]
    })
  }

  return (
    <Modal title="View User Profile" onClose={onClose}>
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

function UserFormModal({ 
  mode, 
  user, 
  courses, 
  batches, 
  roles, 
  onClose, 
  onSaved 
}: { 
  mode: "create" | "edit"
  user?: BranchUserRecord
  courses: OptionRecord[]
  batches: OptionRecord[]
  roles: OptionRecord[]
  onClose: () => void
  onSaved: () => void 
}) {
  const [form, setForm] = useState<UserForm>({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    role: user?.role ?? "student",
    password: "",
    status: user?.is_active === false ? "inactive" : "active",
    course_enrolled: user?.course_enrolled ?? "",
    batch_name: user?.batch_name ?? "",
    specialization: user?.specialization ?? user?.course_enrolled ?? "",
    target_course: user?.course_enrolled ?? "",
    permission_type: user?.course_enrolled ?? "Standard"
  })
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    setSaving(true)
    setError("")
    
    // Prepare payload
    const payload: Partial<BranchUserRecord> & Record<string, unknown> = {
      full_name: form.full_name,
      phone: form.phone,
      role: form.role,
      status: form.status,
      is_active: form.status === "active"
    }

    if (mode === "create") {
      payload.email = form.email
      payload.password = form.password
    }

    // Add role specific fields
    if (form.role === "student") {
      payload.course_enrolled = form.course_enrolled
      payload.batch_name = form.batch_name
      // Try to find course_id
      const selectedCourse = courses.find(c => c.label === form.course_enrolled)
      if (selectedCourse) {
        payload.course_id = selectedCourse.id
      }
    } else if (form.role === "trainer") {
      payload.specialization = form.specialization
      payload.course_enrolled = form.specialization
      payload.batch_name = form.batch_name
    } else if (form.role === "counsellor") {
      payload.target_course = form.target_course
      payload.course_enrolled = form.target_course
    } else if (form.role === "finance") {
      payload.permission_type = form.permission_type
      payload.course_enrolled = form.permission_type
    }

    try {
      if (mode === "edit" && user?.id) {
        await updateBranchUser(user.id, payload)
      } else {
        await createBranchUser(payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live API unavailable")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={mode === "edit" ? "Edit User" : "Create User"} onClose={onClose}>
      <div className="grid gap-3">
        <TextField label="Full Name" value={form.full_name} onChange={(value) => setForm(curr => ({ ...curr, full_name: value }))} />
        
        {mode === "create" ? (
          <>
            <TextField label="Email" value={form.email} onChange={(value) => setForm(curr => ({ ...curr, email: value }))} />
            <TextField label="Password" value={form.password || ""} onChange={(value) => setForm(curr => ({ ...curr, password: value }))} />
          </>
        ) : (
          <div className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
            Email (Read Only)
            <div className="h-11 rounded-lg border border-[#DDE9E4] bg-slate-50 px-3 text-sm font-semibold normal-case text-[#64748B] flex items-center">{form.email}</div>
          </div>
        )}

        <TextField label="Phone" value={form.phone} onChange={(value) => setForm(curr => ({ ...curr, phone: value }))} />
        
        {mode === "create" ? (
          <BranchAdminSelect 
            label="Role" 
            value={form.role} 
            placeholder="Select Role" 
            options={roles.map(r => ({ label: r.label, value: r.value }))} 
            onChange={(value) => setForm(curr => ({ ...curr, role: value }))} 
          />
        ) : (
          <div className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
            Role
            <div className="h-11 rounded-lg border border-[#DDE9E4] bg-slate-50 px-3 text-sm font-semibold normal-case text-[#64748B] flex items-center">{form.role.toUpperCase()}</div>
          </div>
        )}

        <BranchAdminSelect 
          label="Status" 
          value={form.status} 
          placeholder="Select Status" 
          options={[{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }]} 
          onChange={(value) => setForm(curr => ({ ...curr, status: value }))} 
        />

        {/* Conditional Role Fields */}
        {form.role === "student" && (
          <>
            <BranchAdminSelect 
              label="Course" 
              value={form.course_enrolled || ""} 
              placeholder="Select Enrolled Course" 
              options={courses.map(c => ({ label: c.label, value: c.label }))} 
              onChange={(value) => setForm(curr => ({ ...curr, course_enrolled: value }))} 
            />
            <BranchAdminSelect 
              label="Batch" 
              value={form.batch_name || ""} 
              placeholder="Select Batch" 
              options={batches.map(b => ({ label: b.label, value: b.value }))} 
              onChange={(value) => setForm(curr => ({ ...curr, batch_name: value }))} 
            />
          </>
        )}

        {form.role === "trainer" && (
          <>
            <TextField label="Trainer Specialization" value={form.specialization || ""} onChange={(value) => setForm(curr => ({ ...curr, specialization: value }))} />
            <BranchAdminSelect 
              label="Assigned Batch" 
              value={form.batch_name || ""} 
              placeholder="Select Batch" 
              options={batches.map(b => ({ label: b.label, value: b.value }))} 
              onChange={(value) => setForm(curr => ({ ...curr, batch_name: value }))} 
            />
          </>
        )}

        {form.role === "counsellor" && (
          <TextField label="Target Course Category" value={form.target_course || ""} onChange={(value) => setForm(curr => ({ ...curr, target_course: value }))} />
        )}

        {form.role === "finance" && (
          <BranchAdminSelect 
            label="Finance Permission Type" 
            value={form.permission_type || "Standard"} 
            placeholder="Select Permission Level" 
            options={[{ label: "Standard (Receipts & Invoices)", value: "Standard" }, { label: "Admin Finance", value: "Admin Finance" }, { label: "Audit Only", value: "Audit Only" }]} 
            onChange={(value) => setForm(curr => ({ ...curr, permission_type: value }))} 
          />
        )}

        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !form.full_name || !form.email} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function AssignModal({ 
  user, 
  courses,
  batches, 
  onClose, 
  onSaved 
}: { 
  user: BranchUserRecord
  courses: OptionRecord[]
  batches: OptionRecord[]
  onClose: () => void
  onSaved: () => void 
}) {
  const [course, setCourse] = useState(user.course_enrolled || "")
  const [batch, setBatch] = useState(user.batch_name && user.batch_name !== "Pending" && user.batch_name !== "N/A" ? user.batch_name : "")
  const [weeklyClasses, setWeeklyClasses] = useState(String(user.weekly_classes ?? 0))
  const [workloadStatus, setWorkloadStatus] = useState(user.workload_status || "Balanced")
  const [permissionType, setPermissionType] = useState(user.course_enrolled || "Standard")
  const [targetCourse, setTargetCourse] = useState(user.course_enrolled || "")
  
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleAssign() {
    setSaving(true)
    setError("")
    
    const payload: Record<string, string | number | boolean | null | undefined> = {}
    
    if (user.role === "student") {
      payload.course = course
      payload.batch = batch
      const selectedCourse = courses.find(c => c.label === course)
      if (selectedCourse) {
        payload.course_id = selectedCourse.id
      }
    } else if (user.role === "trainer") {
      payload.course = course
      payload.batch = batch
      payload.weekly_classes = Number(weeklyClasses)
      payload.workload_status = workloadStatus
    } else if (user.role === "counsellor") {
      payload.target_course = targetCourse
    } else if (user.role === "finance") {
      payload.permission_type = permissionType
    }

    try {
      await assignBranchUser(user.id, payload)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Live API unavailable")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title={`Assign Options - ${user.full_name}`} onClose={onClose}>
      <div className="grid gap-3">
        {user.role === "student" && (
          <>
            <BranchAdminSelect 
              label="Course" 
              value={course} 
              placeholder="Select Course" 
              options={courses.map(c => ({ label: c.label, value: c.label }))} 
              onChange={setCourse} 
            />
            <BranchAdminSelect 
              label="Batch" 
              value={batch} 
              placeholder="Select Batch" 
              options={batches.map(b => ({ label: b.label, value: b.value }))} 
              onChange={setBatch} 
            />
          </>
        )}

        {user.role === "trainer" && (
          <>
            <BranchAdminSelect 
              label="Course Specialization" 
              value={course} 
              placeholder="Select Specialization Course" 
              options={courses.map(c => ({ label: c.label, value: c.label }))} 
              onChange={setCourse} 
            />
            <BranchAdminSelect 
              label="Assign Batch" 
              value={batch} 
              placeholder="Select Batch" 
              options={batches.map(b => ({ label: b.label, value: b.value }))} 
              onChange={setBatch} 
            />
            <TextField label="Weekly Classes" value={weeklyClasses} onChange={setWeeklyClasses} />
            <BranchAdminSelect 
              label="Workload Status" 
              value={workloadStatus} 
              placeholder="Select Workload Status" 
              options={[{ label: "Balanced", value: "Balanced" }, { label: "High Workload", value: "High" }, { label: "Underutilized", value: "Underutilized" }]} 
              onChange={setWorkloadStatus} 
            />
          </>
        )}

        {user.role === "counsellor" && (
          <TextField label="Assign Target Course Category" value={targetCourse} onChange={setTargetCourse} />
        )}

        {user.role === "finance" && (
          <BranchAdminSelect 
            label="Assign Permission Level" 
            value={permissionType} 
            placeholder="Select Level" 
            options={[{ label: "Standard (Receipts & Invoices)", value: "Standard" }, { label: "Admin Finance", value: "Admin Finance" }, { label: "Audit Only", value: "Audit Only" }]} 
            onChange={setPermissionType} 
          />
        )}

        {error ? <p className="text-xs font-bold text-[#9A3412]">{error}</p> : null}
        
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="button" onClick={handleAssign} disabled={saving} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white">
            {saving ? "Saving..." : "Save Assignment"}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function IdCardModal({ student, branchName, onClose }: { student: BranchUserRecord; branchName: string; onClose: () => void }) {
  const initials = student.full_name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <Modal title="Student ID Card" onClose={onClose}>
      <div className="mx-auto max-w-sm rounded-lg border border-[#0B7A5A] bg-[#FBFDFC] p-5 text-center shadow-lg">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F6F0] text-xl font-black text-[#0B7A5A]">
          {initials}
        </div>
        <h3 className="mt-3 text-lg font-black text-[#071B4A]">{student.full_name}</h3>
        <p className="text-xs font-bold text-[#64748B]">{student.display_code || student.id}</p>
        
        <div className="mt-4 grid gap-2 text-left text-sm border-t border-b border-dashed border-[#CFE8DF] py-3 my-3">
          <p><span className="font-black text-[#071B4A]">Role:</span> STUDENT</p>
          <p><span className="font-black text-[#071B4A]">Course:</span> {student.course_enrolled || "Pending"}</p>
          <p><span className="font-black text-[#071B4A]">Batch:</span> {student.batch_name || "Pending"}</p>
          <p><span className="font-black text-[#071B4A]">Branch:</span> {branchName}</p>
        </div>
        
        <div className="mx-auto mt-4 grid h-24 w-24 place-items-center rounded border border-dashed border-[#0B7A5A] bg-white text-[10px] font-black text-[#0B7A5A]">
          QR Code Placeholder
        </div>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Close</button>
        <button type="button" onClick={() => window.print()} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-md">Print Card</button>
      </div>
    </Modal>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white shadow-xl animate-bounce">{message}</div>
}

function formatDisplayValue(value?: string) {
  if (!value) return "Pending"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4 overflow-y-auto">
      <section className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl my-8">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#EDF3F1] pb-3">
          <h3 className="text-lg font-black text-[#071B4A]">{title}</h3>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A] hover:bg-slate-50">Close</button>
        </div>
        {children}
      </section>
    </div>
  )
}
