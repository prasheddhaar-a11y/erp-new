"use client"

import { cn } from "@/lib/utils"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Flag,
  GripVertical,
  LayoutGrid,
  Link2,
  List,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  UserCheck,
  X,
} from "lucide-react"
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "Low" | "Medium" | "High" | "Urgent"
type Category = "Call" | "Follow-up" | "Demo" | "Admin" | "Other"
type TaskStatus = "pending" | "in_progress" | "completed" | "overdue"
type LinkedType = "lead" | "student" | "none"

type Task = {
  id: string
  title: string
  description?: string
  due_date?: string
  priority: Priority
  category: Category
  status: TaskStatus
  linked_type: LinkedType
  linked_id?: string
  linked_name?: string
  assigned_to?: string
  assignee_name?: string
  created_by?: string
  branch_id?: string
  reminder_at?: string
  created_at: string
  updated_at: string
}

type KPIs = {
  pending: number
  in_progress: number
  completed: number
  overdue: number
  due_today: number
  total: number
}

type FormState = {
  title: string
  description: string
  due_date: string
  priority: Priority
  category: Category
  status: TaskStatus
  linked_type: LinkedType
  linked_name: string
  reminder_at: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"]
const CATEGORIES: Category[] = ["Call", "Follow-up", "Demo", "Admin", "Other"]
const STATUSES: TaskStatus[] = ["pending", "in_progress", "completed", "overdue"]

const PRIORITY_STYLES: Record<Priority, { bg: string; text: string; border: string }> = {
  Low:    { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Medium: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  High:   { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA" },
  Urgent: { bg: "#FDF4FF", text: "#9333EA", border: "#E9D5FF" },
}

const STATUS_STYLES: Record<TaskStatus, { bg: string; text: string; border: string; label: string }> = {
  pending:     { bg: "#EFF6FF", text: "#2563EB", border: "#BFDBFE", label: "Pending" },
  in_progress: { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA", label: "In Progress" },
  completed:   { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0", label: "Completed" },
  overdue:     { bg: "#FEF2F2", text: "#DC2626", border: "#FECACA", label: "Overdue" },
}

const KANBAN_COLUMNS: { key: TaskStatus; label: string; color: string; headerBg: string }[] = [
  { key: "pending",     label: "Pending",     color: "#2563EB", headerBg: "#EFF6FF" },
  { key: "in_progress", label: "In Progress", color: "#C2410C", headerBg: "#FFF7ED" },
  { key: "completed",   label: "Completed",   color: "#15803D", headerBg: "#F0FDF4" },
  { key: "overdue",     label: "Overdue",     color: "#DC2626", headerBg: "#FEF2F2" },
]

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  due_date: "",
  priority: "Medium",
  category: "Admin",
  status: "pending",
  linked_type: "none",
  linked_name: "",
  reminder_at: "",
}

// ─── API helpers ─────────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === "undefined") return ""
  try {
    const raw = localStorage.getItem("pinesphere_session") || sessionStorage.getItem("pinesphere_session")
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed?.accessToken ?? parsed?.access_token ?? ""
    }
    return localStorage.getItem("pinesphere_access_token") || sessionStorage.getItem("pinesphere_access_token") || ""
  } catch {
    return ""
  }
}

const BASE = "http://localhost:8000"

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.detail ?? `Request failed: ${res.status}`)
  }
  return res.json()
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: Priority }) {
  const s = PRIORITY_STYLES[priority]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-black" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      <Flag size={10} />
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-black" style={{ background: s.bg, color: s.text, borderColor: s.border }}>
      {s.label}
    </span>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 text-[11px] font-black text-[#475569]">
      <Tag size={10} />
      {category}
    </span>
  )
}

function formatDueDate(due?: string): string {
  if (!due) return "No due date"
  const d = new Date(due)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return "Due Today"
  if (diff === 1) return "Due Tomorrow"
  if (diff === -1) return "Yesterday"
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff} days`
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

function dueDateColor(due?: string, status?: TaskStatus): string {
  if (status === "completed") return "#15803D"
  if (!due) return "#64748B"
  const d = new Date(due)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return "#DC2626"
  if (diff === 0) return "#C2410C"
  if (diff <= 2) return "#CA8A04"
  return "#64748B"
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────

function KPICards({ kpis }: { kpis: KPIs }) {
  const cards = [
    { label: "Pending Tasks",   value: kpis.pending,   icon: Clock,        color: "#2563EB", bg: "#EFF6FF" },
    { label: "In Progress",     value: kpis.in_progress, icon: Loader2,    color: "#C2410C", bg: "#FFF7ED" },
    { label: "Completed Tasks", value: kpis.completed, icon: CheckCircle2, color: "#15803D", bg: "#F0FDF4" },
    { label: "Overdue Tasks",   value: kpis.overdue,   icon: AlertCircle,  color: "#DC2626", bg: "#FEF2F2" },
    { label: "Due Today",       value: kpis.due_today, icon: Calendar,     color: "#7C3AED", bg: "#F5F3FF" },
  ]
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <article key={card.label} className="rounded-[22px] border border-[#DCE7E2] bg-white p-5 shadow-[0_12px_24px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#60708C]">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-[#071B4A]">{card.value}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: card.bg, color: card.color }}>
                <Icon size={22} />
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

// ─── Table View ──────────────────────────────────────────────────────────────

function TableView({
  tasks,
  onEdit,
  onDelete,
  onComplete,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}) {
  if (tasks.length === 0) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[22px] border border-dashed border-[#DCE7E2] bg-[#F7FBFA]">
        <CheckCircle2 size={36} className="text-[#B0C4BA]" />
        <p className="text-sm font-black text-[#8EA0BA]">No tasks found</p>
        <p className="text-xs font-semibold text-[#B0C4BA]">Create a new task to get started</p>
      </div>
    )
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-[22px] border border-[#DCE7E2]">
      <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
        <thead className="bg-[#F7FBFA] text-[#8EA0BA]">
          <tr>
            <th className="px-4 py-3 font-black">Task</th>
            <th className="px-4 py-3 font-black">Category</th>
            <th className="px-4 py-3 font-black">Priority</th>
            <th className="px-4 py-3 font-black">Status</th>
            <th className="px-4 py-3 font-black">Due Date</th>
            <th className="px-4 py-3 font-black">Linked To</th>
            <th className="px-4 py-3 font-black">Assigned</th>
            <th className="px-4 py-3 font-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-t border-[#E7EFEA] transition hover:bg-[#FAFCFB]">
              <td className="px-4 py-4">
                <p className="max-w-[220px] truncate font-black text-[#071B4A]">{task.title}</p>
                {task.description && (
                  <p className="mt-0.5 max-w-[220px] truncate text-xs font-semibold text-[#8EA0BA]">{task.description}</p>
                )}
              </td>
              <td className="px-4 py-4"><CategoryBadge category={task.category} /></td>
              <td className="px-4 py-4"><PriorityBadge priority={task.priority} /></td>
              <td className="px-4 py-4"><StatusBadge status={task.status} /></td>
              <td className="px-4 py-4">
                <span className="text-xs font-bold" style={{ color: dueDateColor(task.due_date, task.status) }}>
                  {formatDueDate(task.due_date)}
                </span>
              </td>
              <td className="px-4 py-4">
                {task.linked_name ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#40516F]">
                    <Link2 size={12} className="text-[#0B7A5A]" />
                    {task.linked_name}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#B0C4BA]">—</span>
                )}
              </td>
              <td className="px-4 py-4">
                {task.assignee_name ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#40516F]">
                    <UserCheck size={12} className="text-[#0B7A5A]" />
                    {task.assignee_name}
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-[#B0C4BA]">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {task.status !== "completed" && (
                    <button
                      onClick={() => onComplete(task.id)}
                      title="Mark complete"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D] transition hover:bg-[#DCF5E7]"
                    >
                      <CheckCircle2 size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => onEdit(task)}
                    title="Edit"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#DCE7E2] bg-white text-[#40516F] transition hover:border-[#0B7A5A] hover:text-[#0B7A5A]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    title="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] transition hover:bg-[#FEE2E2]"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Kanban Card ─────────────────────────────────────────────────────────────

function KanbanCard({
  task,
  onEdit,
  onDelete,
  onComplete,
  onDragStart,
}: {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onDragStart: (task: Task) => void
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      className="group cursor-grab rounded-[18px] border border-[#DCE7E2] bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:shadow-[0_8px_20px_rgba(15,23,42,0.10)] active:cursor-grabbing active:opacity-70"
    >
      {/* Drag handle + actions */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <GripVertical size={15} className="mt-0.5 shrink-0 text-[#C8D4C1]" />
        <div className="flex items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
          {task.status !== "completed" && (
            <button onClick={() => onComplete(task.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F0FDF4] text-[#15803D]">
              <CheckCircle2 size={12} />
            </button>
          )}
          <button onClick={() => onEdit(task)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F7FBFA] text-[#40516F]">
            <Pencil size={11} />
          </button>
          <button onClick={() => onDelete(task.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
            <Trash2 size={11} />
          </button>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-black leading-snug text-[#071B4A]">{task.title}</p>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs font-semibold text-[#8EA0BA]">{task.description}</p>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <PriorityBadge priority={task.priority} />
        <CategoryBadge category={task.category} />
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#F0F4F2] pt-3">
        <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: dueDateColor(task.due_date, task.status) }}>
          <Clock size={11} />
          {formatDueDate(task.due_date)}
        </span>
        {task.linked_name && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-[#60708C]">
            <Link2 size={11} />
            {task.linked_name}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Kanban View ─────────────────────────────────────────────────────────────

function KanbanView({
  tasks,
  onEdit,
  onDelete,
  onComplete,
  onStatusChange,
}: {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
}) {
  const dragTask = useRef<Task | null>(null)
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null)

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { pending: [], in_progress: [], completed: [], overdue: [] }
    tasks.forEach((t) => { map[t.status]?.push(t) })
    return map
  }, [tasks])

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {KANBAN_COLUMNS.map((col) => (
        <div
          key={col.key}
          onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key) }}
          onDragLeave={() => setDragOverCol(null)}
          onDrop={() => {
            if (dragTask.current && dragTask.current.status !== col.key) {
              onStatusChange(dragTask.current.id, col.key)
            }
            dragTask.current = null
            setDragOverCol(null)
          }}
          className={cn(
            "min-h-[400px] rounded-[22px] border-2 p-4 transition-all",
            dragOverCol === col.key
              ? "border-dashed scale-[1.01] shadow-md"
              : "border-transparent bg-[#F7FBFA]"
          )}
          style={dragOverCol === col.key ? { borderColor: col.color, background: col.headerBg } : {}}
        >
          {/* Column header */}
          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.color }} />
              <span className="text-sm font-black text-[#071B4A]">{col.label}</span>
            </div>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: col.color }}>
              {grouped[col.key].length}
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            {grouped[col.key].map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onComplete={onComplete}
                onDragStart={(t) => { dragTask.current = t }}
              />
            ))}
            {grouped[col.key].length === 0 && (
              <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-[#DCE7E2] text-center">
                <p className="text-xs font-bold text-[#B0C4BA]">Drop tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

function TaskModal({
  editTask,
  onClose,
  onSave,
  saving,
}: {
  editTask: Task | null
  onClose: () => void
  onSave: (form: FormState) => void
  saving: boolean
}) {
  const isEdit = editTask !== null
  const [form, setForm] = useState<FormState>(() => {
    if (!editTask) return EMPTY_FORM
    return {
      title: editTask.title,
      description: editTask.description ?? "",
      due_date: editTask.due_date ? editTask.due_date.substring(0, 16) : "",
      priority: editTask.priority,
      category: editTask.category,
      status: editTask.status,
      linked_type: editTask.linked_type,
      linked_name: editTask.linked_name ?? "",
      reminder_at: editTask.reminder_at ? editTask.reminder_at.substring(0, 16) : "",
    }
  })

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071B4A]/55 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[28px] border border-[#DCE7E2] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.25)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E7EFEA] px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7A5A]">
              {isEdit ? "Edit Task" : "New Task"}
            </p>
            <h3 className="mt-1 text-2xl font-black text-[#071B4A]">
              {isEdit ? "Update Task" : "Create Task"}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[#60708C]">
              {isEdit ? "Modify task details below." : "Fill in the details to create a new task."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DCE7E2] text-[#40516F] transition hover:bg-[#F7FBFA]"
          >
            <X size={17} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4 px-6 py-6 md:grid-cols-2">
          {/* Title */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A] md:col-span-2">
            Task Title *
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Follow up with Aarav Menon"
              className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none transition focus:border-[#0B7A5A]"
            />
          </label>

          {/* Description */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A] md:col-span-2">
            Description
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional notes or details..."
              className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 py-3 text-sm font-bold outline-none transition focus:border-[#0B7A5A] resize-none"
            />
          </label>

          {/* Priority */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Priority
            <select name="priority" value={form.priority} onChange={handleChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]">
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </label>

          {/* Category */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Category
            <select name="category" value={form.category} onChange={handleChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]">
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>

          {/* Status */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Status
            <select name="status" value={form.status} onChange={handleChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]">
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>
          </label>

          {/* Due Date */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Due Date
            <input
              type="datetime-local"
              name="due_date"
              value={form.due_date}
              onChange={handleChange}
              className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]"
            />
          </label>

          {/* Linked Type */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Link To
            <select name="linked_type" value={form.linked_type} onChange={handleChange} className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]">
              <option value="none">None</option>
              <option value="lead">Lead</option>
              <option value="student">Student</option>
            </select>
          </label>

          {/* Linked Name */}
          {form.linked_type !== "none" && (
            <label className="grid gap-2 text-sm font-black text-[#071B4A]">
              {form.linked_type === "lead" ? "Lead Name" : "Student Name"}
              <input
                name="linked_name"
                value={form.linked_name}
                onChange={handleChange}
                placeholder={form.linked_type === "lead" ? "e.g. Aarav Menon" : "e.g. Nandini R"}
                className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]"
              />
            </label>
          )}

          {/* Reminder */}
          <label className="grid gap-2 text-sm font-black text-[#071B4A]">
            Reminder At
            <input
              type="datetime-local"
              name="reminder_at"
              value={form.reminder_at}
              onChange={handleChange}
              className="h-12 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-4 text-sm font-bold outline-none focus:border-[#0B7A5A]"
            />
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#DCE7E2] px-5 py-3 text-sm font-black text-[#40516F] transition hover:bg-[#F7FBFA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white shadow-[0_12px_20px_rgba(11,122,90,0.18)] transition hover:bg-[#095d45] disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {isEdit ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export function CounsellorTasksModule() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [kpis, setKpis] = useState<KPIs>({ pending: 0, in_progress: 0, completed: 0, overdue: 0, due_today: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [view, setView] = useState<"table" | "kanban">("table")
  const [query, setQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "all">("all")
  const [filterPriority, setFilterPriority] = useState<Priority | "all">("all")
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // ── Load data ─────────────────────────────────────────────────────────────
  async function loadAll() {
    try {
      setLoading(true)
      const [taskList, kpiData] = await Promise.all([
        apiFetch<Task[]>("/tasks"),
        apiFetch<KPIs>("/tasks/kpis"),
      ])
      setTasks(taskList)
      setKpis(kpiData)
      setError("")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load tasks"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── Create / Update ───────────────────────────────────────────────────────
  async function handleSave(form: FormState) {
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        due_date: form.due_date || undefined,
        priority: form.priority,
        category: form.category,
        status: form.status,
        linked_type: form.linked_type,
        linked_name: form.linked_name || undefined,
        reminder_at: form.reminder_at || undefined,
      }
      if (editTask) {
        await apiFetch(`/tasks/${editTask.id}`, { method: "PATCH", body: JSON.stringify(payload) })
        showToast("Task updated successfully")
      } else {
        await apiFetch("/tasks", { method: "POST", body: JSON.stringify(payload) })
        showToast("Task created successfully")
      }
      setShowModal(false)
      setEditTask(null)
      await loadAll()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save task"
      showToast(msg, "error")
    } finally {
      setSaving(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Delete this task? This cannot be undone.")) return
    try {
      await apiFetch(`/tasks/${id}`, { method: "DELETE" })
      showToast("Task deleted")
      await loadAll()
    } catch {
      showToast("Failed to delete task", "error")
    }
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  async function handleComplete(id: string) {
    try {
      await apiFetch(`/tasks/${id}/complete`, { method: "PATCH" })
      showToast("Task marked as completed")
      await loadAll()
    } catch {
      showToast("Failed to update task", "error")
    }
  }

  // ── Kanban drag drop status change ────────────────────────────────────────
  async function handleStatusChange(taskId: string, newStatus: TaskStatus) {
    try {
      await apiFetch(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) })
      await loadAll()
    } catch {
      showToast("Failed to move task", "error")
    }
  }

  // ── Edit open ─────────────────────────────────────────────────────────────
  function openEdit(task: Task) {
    setEditTask(task)
    setShowModal(true)
  }

  function openCreate() {
    setEditTask(null)
    setShowModal(true)
  }

  // ── Filtered tasks ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return tasks.filter((t) => {
      const searchable = `${t.title} ${t.description ?? ""} ${t.linked_name ?? ""} ${t.category} ${t.priority}`.toLowerCase()
      const matchText = !text || searchable.includes(text)
      const matchStatus = filterStatus === "all" || t.status === filterStatus
      const matchPriority = filterPriority === "all" || t.priority === filterPriority
      return matchText && matchStatus && matchPriority
    })
  }, [tasks, query, filterStatus, filterPriority])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">

      {/* Toast */}
      {toast && (
        <div className={cn(
          "fixed right-6 top-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-black shadow-xl transition-all",
          toast.type === "success"
            ? "border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]"
            : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
        )}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Hero Header */}
      <section className="overflow-hidden rounded-[28px] border border-[#DCE7E2] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
          <div className="min-w-0 p-6 lg:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <CheckCircle2 size={14} />
              Counsellor Task Management
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-[#071B4A]">Task Management</h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#60708C]">
              Manage your daily tasks, follow-ups, demos, and admin work from one place. Track priorities, due dates, and progress with Table and Kanban views.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">{kpis.total}</p>
                <p className="text-xs font-bold text-[#60708C]">Total tasks</p>
              </div>
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">{kpis.due_today}</p>
                <p className="text-xs font-bold text-[#60708C]">Due today</p>
              </div>
              <div className="rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] p-4">
                <p className="text-2xl font-black text-[#071B4A]">{kpis.overdue}</p>
                <p className="text-xs font-bold text-[#60708C]">Overdue</p>
              </div>
            </div>
          </div>

          {/* Dark panel */}
          <div className="relative min-h-[240px] bg-[#063D36] p-6 text-white">
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-emerald-200">Quick Summary</p>
                <div className="mt-4 space-y-3">
                  {KANBAN_COLUMNS.map((col) => {
                    const count = col.key === "pending" ? kpis.pending
                      : col.key === "in_progress" ? kpis.in_progress
                      : col.key === "completed" ? kpis.completed
                      : kpis.overdue
                    return (
                      <div key={col.key} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/10 px-4 py-2">
                        <span className="text-sm font-bold text-white/90">{col.label}</span>
                        <span className="text-lg font-black text-white">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <KPICards kpis={kpis} />

      {/* Main Content */}
      <section className="min-w-0 rounded-[24px] border border-[#DCE7E2] bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]">

        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black text-[#071B4A]">Task List</h2>
            {/* View Toggle */}
            <div className="flex items-center rounded-xl border border-[#DCE7E2] bg-[#F7FBFA] p-1">
              <button
                onClick={() => setView("table")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                  view === "table" ? "bg-[#0B7A5A] text-white shadow-sm" : "text-[#40516F] hover:text-[#0B7A5A]"
                )}
              >
                <List size={14} /> Table
              </button>
              <button
                onClick={() => setView("kanban")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition",
                  view === "kanban" ? "bg-[#0B7A5A] text-white shadow-sm" : "text-[#40516F] hover:text-[#0B7A5A]"
                )}
              >
                <LayoutGrid size={14} /> Kanban
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8EA0BA]" size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search tasks..."
                className="h-10 w-full rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] pl-10 pr-4 text-sm font-bold outline-none transition focus:border-[#0B7A5A] lg:w-56"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "all")}
              className="h-10 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-3 text-sm font-bold outline-none focus:border-[#0B7A5A]"
            >
              <option value="all">All Status</option>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLES[s].label}</option>)}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | "all")}
              className="h-10 rounded-2xl border border-[#DCE7E2] bg-[#F7FBFA] px-3 text-sm font-bold outline-none focus:border-[#0B7A5A]"
            >
              <option value="all">All Priority</option>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>

            {/* New Task button */}
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-full bg-[#0B7A5A] px-4 py-2.5 text-sm font-black text-white shadow-[0_10px_18px_rgba(11,122,90,0.18)] transition hover:bg-[#095d45]"
            >
              <Plus size={16} />
              New Task
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-black text-[#DC2626]">
            <AlertCircle size={16} />
            {error} — showing offline mode. Tasks will load when backend is connected.
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={32} className="animate-spin text-[#0B7A5A]" />
              <p className="text-sm font-black text-[#60708C]">Loading tasks...</p>
            </div>
          </div>
        ) : (
          <>
            {view === "table" ? (
              <TableView
                tasks={filtered}
                onEdit={openEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
              />
            ) : (
              <KanbanView
                tasks={filtered}
                onEdit={openEdit}
                onDelete={handleDelete}
                onComplete={handleComplete}
                onStatusChange={handleStatusChange}
              />
            )}
          </>
        )}
      </section>

      {/* Modal */}
      {showModal && (
        <TaskModal
          editTask={editTask}
          onClose={() => { setShowModal(false); setEditTask(null) }}
          onSave={handleSave}
          saving={saving}
        />
      )}
    </div>
  )
}