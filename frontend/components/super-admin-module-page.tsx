"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Bot,
  ClipboardList,
  Eye,
  Filter,
  GraduationCap,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Trash2,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react"

import { apiRequest, getStoredSessionValue } from "@/app/shared/api"
import { getRoleDashboardPath, getStoredSession, type UserProfile } from "@/app/shared/auth"
import { BranchManagementPanel } from "@/app/modules/branches"
import { FranchiseOperationsPanel } from "@/app/modules/franchise"
import { HRCommandCenter } from "@/app/modules/hr"
import { ReportsAnalyticsPanel } from "@/app/modules/reports"
import { UserManagementPanel } from "@/app/modules/users"
import { RoleDashboardLayout } from "@/components/role-dashboard"
import { getRoleDashboardMock } from "@/components/role-dashboard-data"

type ModuleConfig = {
  title: string
  subtitle: string
  endpoint: string
  collectionKeys: string[]
  actions?: Array<{ label: string; href: string }>
  backendActions?: Array<{ label: string; endpoint: string; method?: "POST" | "PATCH"; body: Record<string, unknown> }>
}

const moduleConfigs: Record<string, ModuleConfig> = {
  users: {
    title: "Users",
    subtitle: "Manage user accounts, roles, branch access, and active status in one clean workspace.",
    endpoint: "/auth/users",
    collectionKeys: ["users", "items", "data"],
    backendActions: [
      { label: "Create Demo User", endpoint: "/auth/users", body: { full_name: "New Super Admin User", email: "new.user@pinesphere.local", password: "ChangeMe@123", role: "student" } },
    ],
  },
  branches: {
    title: "Branches",
    subtitle: "Track every campus, capacity signal, and operating status across the organization.",
    endpoint: "/branches",
    collectionKeys: ["branches", "items", "data"],
    backendActions: [
      { label: "Create Demo Branch", endpoint: "/branches", body: { name: "New Branch", code: "NEW", city: "City", capacity: 100, status: "active" } },
    ],
  },
  crm: {
    title: "CRM",
    subtitle: "Admissions CRM overview using live lead pipeline data.",
    endpoint: "/crm/leads",
    collectionKeys: ["leads", "items", "data"],
    actions: [
      { label: "Admissions", href: "/super-admin/crm/admissions" },
      { label: "Lead Management", href: "/super-admin/crm/lead-management" },
    ],
  },
  "crm/admissions": {
    title: "CRM - Admissions",
    subtitle: "Review admissions, conversions, and counsellor activity without leaving CRM.",
    endpoint: "/admissions",
    collectionKeys: ["admissions", "items", "data"],
    actions: [{ label: "Lead Management", href: "/super-admin/crm/lead-management" }],
  },
  "crm/lead-management": {
    title: "CRM - Lead Management",
    subtitle: "Follow every enquiry from first contact to demo, admission, and conversion.",
    endpoint: "/crm/leads",
    collectionKeys: ["leads", "items", "data"],
    actions: [{ label: "Admissions", href: "/super-admin/crm/admissions" }],
    backendActions: [
      { label: "Create Demo Lead", endpoint: "/crm/leads", body: { student_name: "New Lead", phone: "9999999999", email: "lead@pinesphere.local", course_interest: "Full Stack", source: "Super Admin" } },
    ],
  },
  students: {
    title: "Students",
    subtitle: "See student profiles, readiness, enrollment, attendance, and fee context together.",
    endpoint: "/students",
    collectionKeys: ["students", "profiles", "items", "data"],
  },
  lms: {
    title: "LMS",
    subtitle: "Courses, lessons, enrollments, quizzes, and trainer delivery records.",
    endpoint: "/lms/courses",
    collectionKeys: ["courses", "items", "data"],
    actions: [
      { label: "Batch", href: "/super-admin/lms/batch" },
      { label: "Attendance", href: "/super-admin/lms/attendance" },
    ],
    backendActions: [
      { label: "Create Demo Course", endpoint: "/lms/courses", body: { title: "New Course", description: "Created from Super Admin", difficulty_level: "Beginner", status: "draft" } },
    ],
  },
  "lms/batch": {
    title: "Batch",
    subtitle: "Batch and enrollment information sourced from LMS records.",
    endpoint: "/lms/enrollments",
    collectionKeys: ["enrollments", "batches", "items", "data"],
    actions: [{ label: "LMS", href: "/super-admin/lms" }],
  },
  "lms/attendance": {
    title: "Attendance",
    subtitle: "Monitor class sessions, attendance completion, and student participation.",
    endpoint: "/attendance/sessions",
    collectionKeys: ["sessions", "attendance_sessions", "items", "data"],
    actions: [{ label: "LMS", href: "/super-admin/lms" }],
  },
  finance: {
    title: "Finance",
    subtitle: "Finance operations overview connected to live payment and invoice data.",
    endpoint: "/finance/summary",
    collectionKeys: ["payments", "invoices", "items", "data"],
    actions: [
      { label: "Payments", href: "/super-admin/finance/payments" },
      { label: "Invoices", href: "/super-admin/finance/invoices" },
      { label: "Payroll", href: "/super-admin/finance/payroll" },
    ],
  },
  "finance/payments": {
    title: "Finance - Payments",
    subtitle: "Review collected payments, methods, and collection activity.",
    endpoint: "/finance/payments",
    collectionKeys: ["payments", "items", "data"],
    actions: [
      { label: "Invoices", href: "/super-admin/finance/invoices" },
      { label: "Payroll", href: "/super-admin/finance/payroll" },
    ],
  },
  "finance/invoices": {
    title: "Finance - Invoices",
    subtitle: "Track invoices, balances, due amounts, and collection priorities.",
    endpoint: "/finance/invoices",
    collectionKeys: ["invoices", "items", "data"],
    actions: [{ label: "Payments", href: "/super-admin/finance/payments" }],
    backendActions: [
      { label: "Create Invoice Review", endpoint: "/operations/finance/invoices", body: { title: "Invoice action from Super Admin", status: "open" } },
    ],
  },
  "finance/payroll": {
    title: "Finance - Payroll",
    subtitle: "Review payroll totals, approvals, and finance-side salary checks.",
    endpoint: "/hr/payroll",
    collectionKeys: ["payroll", "payrolls", "items", "data"],
    actions: [{ label: "Payments", href: "/super-admin/finance/payments" }],
  },
  hr: {
    title: "HR",
    subtitle: "Manage employee records, leave, payroll, and performance signals.",
    endpoint: "/hr/employees",
    collectionKeys: ["employees", "items", "data"],
    actions: [
      { label: "Payroll", href: "/super-admin/hr/payroll" },
      { label: "Leave Management", href: "/super-admin/hr/leave-management" },
      { label: "Performance", href: "/super-admin/hr/performance" },
    ],
  },
  "hr/payroll": {
    title: "HR - Payroll",
    subtitle: "Review salary cycles, employee payouts, and approval readiness.",
    endpoint: "/hr/payroll",
    collectionKeys: ["payroll", "payrolls", "items", "data"],
    actions: [
      { label: "Leave Management", href: "/super-admin/hr/leave-management" },
      { label: "Performance", href: "/super-admin/hr/performance" },
    ],
  },
  "hr/leave-management": {
    title: "HR - Leave Management",
    subtitle: "Track leave requests, approvals, balances, and follow-up needs.",
    endpoint: "/hr/leaves",
    collectionKeys: ["leave_requests", "leaves", "items", "data"],
    actions: [{ label: "Payroll", href: "/super-admin/hr/payroll" }],
    backendActions: [
      { label: "Log Leave Review", endpoint: "/operations/hr/leave-management", body: { title: "Leave review from Super Admin", status: "open" } },
    ],
  },
  "hr/performance": {
    title: "HR - Performance",
    subtitle: "Review performance notes, ratings, and improvement follow-ups.",
    endpoint: "/hr/performance",
    collectionKeys: ["performance", "reviews", "items", "data"],
    actions: [{ label: "Payroll", href: "/super-admin/hr/payroll" }],
  },
  "placement-portal": {
    title: "Placement Portal",
    subtitle: "Track placement-ready students, employer activity, and hiring outcomes.",
    endpoint: "/operations/placement",
    collectionKeys: ["records", "operations", "items", "data"],
  },
  "ai-platform": {
    title: "AI Platform",
    subtitle: "Ask operational questions and review AI-assisted business insights.",
    endpoint: "/operations/ai",
    collectionKeys: ["records", "operations", "items", "data"],
  },
  franchise: {
    title: "Franchise",
    subtitle: "Monitor franchise health, branch growth, and operating performance.",
    endpoint: "/franchise/analytics",
    collectionKeys: ["franchises", "branches", "items", "data"],
  },
  reports: {
    title: "Reports & Analytics",
    subtitle: "Compare performance, trends, and operational outcomes across teams.",
    endpoint: "/reports/dashboard",
    collectionKeys: ["reports", "analytics", "items", "data"],
    actions: [
      { label: "Analytics", href: "/super-admin/reports/analytics" },
      { label: "Branch Reports", href: "/super-admin/reports/branch-reports" },
    ],
  },
  "reports/analytics": {
    title: "Reports - Analytics",
    subtitle: "Explore organization-wide analytics, trends, and decision signals.",
    endpoint: "/reports/analytics",
    collectionKeys: ["reports", "analytics", "items", "data"],
    actions: [{ label: "Branch Reports", href: "/super-admin/reports/branch-reports" }],
  },
  "reports/branch-reports": {
    title: "Reports - Branch Reports",
    subtitle: "Compare branch performance, attendance, revenue, and operating health.",
    endpoint: "/reports/branches",
    collectionKeys: ["branches", "reports", "items", "data"],
    actions: [{ label: "Analytics", href: "/super-admin/reports/analytics" }],
  },
  security: {
    title: "Security",
    subtitle: "Review access, permissions, and important security activity.",
    endpoint: "/security/audit-logs",
    collectionKeys: ["audit_logs", "logs", "items", "data"],
  },
  settings: {
    title: "Settings",
    subtitle: "Control organization preferences and module-level configuration.",
    endpoint: "/settings/items",
    collectionKeys: ["settings", "items", "data"],
  },
}

function parseLegacyUser(): UserProfile | null {
  const raw = getStoredSessionValue("pinesphere_profile")
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as Partial<UserProfile>
    if (!profile.full_name || profile.role !== "super_admin") return null
    return {
      id: profile.id ?? "",
      email: profile.email ?? "",
      full_name: profile.full_name,
      role: "super_admin",
      role_abbreviation: profile.role_abbreviation ?? "SA",
      branch_id: profile.branch_id,
      is_active: profile.is_active ?? true,
      display_code: profile.display_code,
      phone: profile.phone,
      profile_photo: profile.profile_photo,
    }
  } catch {
    return null
  }
}

function extractRows(payload: unknown, keys: string[]) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== "object") return []
  const record = payload as Record<string, unknown>
  for (const key of keys) {
    const value = record[key]
    if (Array.isArray(value)) return value
  }
  return []
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === "") return "-"
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value)
  return JSON.stringify(value)
}

function rowTitle(row: Record<string, unknown>) {
  return formatCell(row.full_name ?? row.name ?? row.title ?? row.student_name ?? row.email ?? row.id)
}

type QuickPanelConfig = {
  title: string
  subtitle: string
  endpoints: Array<{ key: string; label: string; endpoint: string }>
  actions?: string[]
}

type FormField = {
  name: string
  label: string
  type?: "text" | "email" | "password" | "number" | "date" | "datetime-local" | "textarea" | "select"
  required?: boolean
  defaultValue?: string
  options?: Array<{ label: string; value: string }>
}

type SuperAdminActionConfig = {
  title: string
  description: string
  endpoint: string
  method: "GET" | "POST" | "PATCH"
  fields: FormField[]
  successMessage: string
  buildBody?: (values: Record<string, string>) => Record<string, unknown>
}

type InsightCard = {
  label: string
  value: string
  helper: string
  tone: "green" | "blue" | "orange" | "red"
}

function asRecordRows(rows: unknown[] | undefined) {
  return (rows ?? []).filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
}

function numericValue(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string") return Number(value.replace(/[^\d.-]/g, "")) || 0
  return 0
}

function groupRows(rows: Record<string, unknown>[], key: string, fallback = "Unknown") {
  const map = new Map<string, number>()
  for (const row of rows) {
    const label = formatCell(row[key] ?? fallback)
    map.set(label, (map.get(label) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 6)
}

function money(value: number) {
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`
}

function inferPanelKind(config: QuickPanelConfig) {
  const actionText = (config.actions ?? []).join(" ").toLowerCase()
  const title = config.title.toLowerCase()
  if (title.includes("crm") || title.includes("lead") || actionText.includes("lead")) return "crm"
  if (title.includes("student") || actionText.includes("student")) return "students"
  if (title.includes("lms") || title.includes("batch") || title.includes("attendance") || actionText.includes("course")) return "lms"
  if (title.includes("finance") || title.includes("payment") || title.includes("invoice") || actionText.includes("payment")) return "finance"
  return "standard"
}

function buildEnhancedPanelData(kind: string, data: Record<string, unknown[]>) {
  const leads = asRecordRows(data.leads)
  const admissions = asRecordRows(data.admissions)
  const users = asRecordRows(data.users)
  const students = users.filter((user) => user.role === "student" || user.student_status || user.course_enrolled)
  const enrollments = asRecordRows(data.enrollments)
  const sessions = asRecordRows(data.sessions)
  const courses = asRecordRows(data.courses)
  const invoices = asRecordRows(data.invoices)
  const payments = asRecordRows(data.payments)
  const defaulters = asRecordRows(data.defaulters)
  const paid = invoices.filter((invoice) => formatCell(invoice.status).toLowerCase() === "paid")
  const pendingInvoices = invoices.filter((invoice) => !["paid", "cancelled"].includes(formatCell(invoice.status).toLowerCase()))
  const collected = payments.reduce((sum, payment) => sum + numericValue(payment.amount), 0)
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + numericValue(invoice.amount), 0)
  const pendingAmount = invoices.reduce((sum, invoice) => sum + Math.max(0, numericValue(invoice.amount) - numericValue(invoice.paid_amount)), 0)

  if (kind === "crm") {
    return {
      kpis: [
        { label: "Total Leads", value: `${leads.length}`, helper: "Live CRM pipeline", tone: "green" },
        { label: "Open Follow-ups", value: `${leads.filter((lead) => ["new", "contacted", "follow_up", "demo_scheduled"].includes(formatCell(lead.status))).length}`, helper: "Needs counsellor action", tone: "orange" },
        { label: "Admissions", value: `${admissions.length}`, helper: "Admission records", tone: "blue" },
        { label: "Converted", value: `${leads.filter((lead) => ["converted", "enrolled"].includes(formatCell(lead.status))).length}`, helper: "Won opportunities", tone: "green" },
      ] as InsightCard[],
      primaryChart: groupRows(leads, "status", "new"),
      secondaryChart: groupRows(leads, "source", "walk-in"),
      reviewRows: leads.filter((lead) => ["new", "contacted", "follow_up", "demo_scheduled"].includes(formatCell(lead.status))).slice(0, 5),
      reviewTitle: "Lead review queue",
      reviewMeta: "Follow-up, demo, and conversion work",
    }
  }

  if (kind === "students") {
    return {
      kpis: [
        { label: "Students", value: `${students.length}`, helper: "Student user records", tone: "green" },
        { label: "Active", value: `${students.filter((student) => student.is_active !== false && formatCell(student.student_status || "active") !== "inactive").length}`, helper: "Currently learning", tone: "blue" },
        { label: "Enrollments", value: `${enrollments.length}`, helper: "Batch/course links", tone: "green" },
        { label: "Attendance Sessions", value: `${sessions.length}`, helper: "Tracked classes", tone: "orange" },
      ] as InsightCard[],
      primaryChart: groupRows(students, "course_enrolled", "Course pending"),
      secondaryChart: groupRows(students, "student_status", "active"),
      reviewRows: students.filter((student) => formatCell(student.document_status || "pending") !== "verified" || !student.course_enrolled || !student.batch_name).slice(0, 5),
      reviewTitle: "Student readiness queue",
      reviewMeta: "Documents, batch, and course completion",
    }
  }

  if (kind === "lms") {
    const published = courses.filter((course) => formatCell(course.status).toLowerCase() === "published")
    const draft = courses.filter((course) => formatCell(course.status).toLowerCase() !== "published")
    return {
      kpis: [
        { label: "Courses", value: `${courses.length}`, helper: "Course catalogue", tone: "green" },
        { label: "Published", value: `${published.length}`, helper: "Visible for learners", tone: "blue" },
        { label: "Enrollments", value: `${enrollments.length}`, helper: "Student-course links", tone: "green" },
        { label: "Sessions", value: `${sessions.length}`, helper: "Classes recorded", tone: "orange" },
      ] as InsightCard[],
      primaryChart: groupRows(courses, "difficulty_level", "Beginner"),
      secondaryChart: [
        { label: "Published", value: published.length },
        { label: "Draft", value: draft.length },
        { label: "Sessions", value: sessions.length },
      ],
      reviewRows: courses.filter((course) => formatCell(course.status).toLowerCase() !== "published" || !course.description || !course.duration).slice(0, 5),
      reviewTitle: "Course publishing queue",
      reviewMeta: "Drafts, missing details, and delivery setup",
    }
  }

  if (kind === "finance") {
    return {
      kpis: [
        { label: "Invoice Total", value: money(invoiceTotal), helper: `${invoices.length} invoices`, tone: "blue" },
        { label: "Collected", value: money(collected), helper: `${payments.length} payments`, tone: "green" },
        { label: "Pending", value: money(pendingAmount), helper: `${pendingInvoices.length} open invoices`, tone: pendingAmount ? "orange" : "green" },
        { label: "Defaulters", value: `${defaulters.length}`, helper: "Needs recovery", tone: defaulters.length ? "red" : "green" },
      ] as InsightCard[],
      primaryChart: [
        { label: "Paid", value: paid.length },
        { label: "Pending", value: pendingInvoices.length },
        { label: "Defaulters", value: defaulters.length },
      ],
      secondaryChart: groupRows(payments, "payment_method", "cash"),
      reviewRows: pendingInvoices.slice(0, 5),
      reviewTitle: "Finance recovery queue",
      reviewMeta: "Pending invoices and collection follow-up",
    }
  }

  return null
}

function MiniBarChart({ title, rows }: { title: string; rows: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...rows.map((row) => row.value))
  return (
    <div className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-4">
      <h3 className="text-sm font-black text-[#071B4A]">{title}</h3>
      <div className="mt-4 space-y-3">
        {rows.length ? rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black text-[#64748B]">
              <span className="truncate">{row.label}</span>
              <span>{row.value}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E8F6F0]">
              <div className="h-full rounded-full bg-[#0B7A5A]" style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
            </div>
          </div>
        )) : <p className="text-sm font-bold text-[#64748B]">No chart data yet.</p>}
      </div>
    </div>
  )
}

function moduleVisual(kind: string) {
  if (kind === "crm") return { icon: Users, label: "Pipeline", title: "CRM command center", accent: "#1cb0f6" }
  if (kind === "students") return { icon: GraduationCap, label: "Lifecycle", title: "Student command center", accent: "#ce82ff" }
  if (kind === "lms") return { icon: BookOpen, label: "Learning", title: "LMS command center", accent: "#58cc02" }
  if (kind === "finance") return { icon: WalletCards, label: "Collection", title: "Finance command center", accent: "#ff9600" }
  return { icon: Activity, label: "Operations", title: "Operations command center", accent: "#58cc02" }
}

function preferredColumns(kind: string, activeKey: string) {
  if (kind === "crm" && activeKey === "courses") return ["title", "difficulty_level", "duration", "status", "description"]
  if (kind === "crm" || activeKey === "leads") return ["student_name", "course_interest", "source", "status", "next_follow_up_at"]
  if (kind === "students" || activeKey === "users") return ["full_name", "course_enrolled", "batch_name", "student_status", "document_status"]
  if (kind === "lms" && activeKey === "courses") return ["title", "difficulty_level", "duration", "status", "description"]
  if (kind === "lms" && activeKey === "enrollments") return ["student_name", "course_title", "batch_name", "progress_percent", "status"]
  if (kind === "lms") return ["title", "session_date", "course_id", "status", "remarks"]
  if (kind === "finance" && activeKey === "payments") return ["amount", "payment_method", "reference_number", "paid_at", "invoice_id"]
  if (kind === "finance") return ["invoice_number", "course_name", "amount", "paid_amount", "status"]
  return []
}

function prettyColumn(column: string) {
  const labels: Record<string, string> = {
    student_name: "Student",
    course_interest: "Course",
    next_follow_up_at: "Follow-up",
    full_name: "Student",
    course_enrolled: "Course",
    batch_name: "Batch",
    student_status: "Status",
    document_status: "Documents",
    difficulty_level: "Level",
    progress_percent: "Progress",
    session_date: "Class Date",
    invoice_number: "Invoice",
    course_name: "Course",
    paid_amount: "Paid",
    payment_method: "Method",
    reference_number: "Reference",
    paid_at: "Paid Date",
  }
  return labels[column] ?? column.replaceAll("_", " ")
}

function statusTone(value: unknown) {
  const text = formatCell(value).toLowerCase()
  if (["published", "paid", "active", "converted", "verified", "present"].some((item) => text.includes(item))) return "bg-[#dff8d6] text-[#2b7a0b]"
  if (["draft", "pending", "follow", "demo"].some((item) => text.includes(item))) return "bg-[#fff4c7] text-[#9a6700]"
  if (["lost", "inactive", "overdue", "rejected", "absent"].some((item) => text.includes(item))) return "bg-[#fee2e2] text-[#b42318]"
  return "bg-[#eefbe7] text-[#3e9e00]"
}

function DirectoryCell({ column, value }: { column: string; value: unknown }) {
  const text = formatCell(value)
  if (["status", "student_status", "document_status"].includes(column)) {
    return <span className={`inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-black capitalize ${statusTone(value)}`}>{text.replaceAll("_", " ")}</span>
  }
  if (["amount", "paid_amount"].includes(column)) return <span className="font-black text-[#3e9e00]">{money(numericValue(value))}</span>
  if (column === "progress_percent") {
    const progress = Math.max(0, Math.min(100, numericValue(value)))
    return (
      <div className="flex min-w-[120px] items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ddeecf]">
          <div className="h-full rounded-full bg-[#58cc02]" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] font-black">{progress}%</span>
      </div>
    )
  }
  if (column === "description") {
    return <span className="block max-w-[340px] truncate" title={text}>{text}</span>
  }
  return <span className="truncate">{text}</span>
}

function ModuleDirectory({
  kind,
  activeKey,
  rows,
  loading,
  onAction,
  onQuickAction,
}: {
  kind: string
  activeKey: string
  rows: Record<string, unknown>[]
  loading: boolean
  onAction: (action: string) => void
  onQuickAction?: (action: SuperAdminQuickAction, row: Record<string, unknown>) => void
}) {
  const columns = preferredColumns(kind, activeKey)
  const visibleColumns = columns.length ? columns : Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 5)
  const title = kind === "crm" ? "CRM directory" : kind === "students" ? "Student directory" : kind === "lms" ? "LMS directory" : kind === "finance" ? "Finance directory" : "Operations directory"
  const subtitle = kind === "lms" ? "Course records, delivery setup, and admin actions." : "Current records with admin actions."
  const primaryAction = kind === "crm" ? "Follow up" : kind === "students" ? "Assign batch" : kind === "lms" ? "Upload lesson" : kind === "finance" ? "Record payment" : ""
  const secondaryAction = kind === "crm" ? "Schedule demo" : kind === "students" ? "Update status" : kind === "lms" ? "Publish quiz" : kind === "finance" ? "Send reminders" : ""
  const showQuickActions = Boolean(onQuickAction) && canUseQuickActions(kind, activeKey)

  return (
    <article className="rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[19px] font-black leading-tight text-[#18230f]">{title}</h3>
          <p className="mt-1 text-sm font-semibold text-[#5f6f56]">{subtitle}</p>
        </div>
        {kind === "lms" ? (
          <button type="button" onClick={() => onAction("Create course")} className="inline-flex items-center gap-2 rounded-[12px] bg-[#58cc02] px-3 py-2 text-xs font-black text-white transition hover:bg-[#3e9e00]">
            <Plus size={14} />
            Add Course
          </button>
        ) : null}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#ddeecf]">
        {loading ? (
          <div className="bg-[#f6fff0] p-4 text-sm font-black text-[#5f6f56]">Loading the latest workspace data...</div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead className="bg-[#edfbe5]">
                <tr>
                  {visibleColumns.map((column) => (
                    <th key={column} className="border-b border-[#ddeecf] px-3 py-3 text-xs font-black uppercase text-[#5f6f56]">{prettyColumn(column)}</th>
                  ))}
                  <th className="border-b border-[#ddeecf] px-3 py-3 text-right text-xs font-black uppercase text-[#5f6f56]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 60).map((row, index) => (
                  <tr key={formatCell(row.id ?? index)} className={`${index % 2 === 0 ? "bg-white" : "bg-[#f9fff5]"} align-top transition hover:bg-[#eefbe7]`}>
                    {visibleColumns.map((column) => (
                      <td key={column} className="max-w-[260px] border-b border-[#e5f2dc] px-3 py-3 font-semibold text-[#475569]">
                        <DirectoryCell column={column} value={row[column]} />
                      </td>
                    ))}
                    <td className="border-b border-[#e5f2dc] px-3 py-3">
                      <div className="flex justify-end gap-1.5">
                        {showQuickActions ? (
                          <SuperAdminQuickActionButtons row={row} onAction={(action) => onQuickAction?.(action, row)} />
                        ) : (
                          <>
                            {primaryAction ? <button type="button" onClick={() => onAction(primaryAction)} className="rounded-[10px] border border-[#ddeecf] bg-white px-2.5 py-1.5 text-[11px] font-black text-[#3e9e00]">{primaryAction}</button> : null}
                            {secondaryAction ? <button type="button" onClick={() => onAction(secondaryAction)} className="rounded-[10px] border border-[#ddeecf] bg-white px-2.5 py-1.5 text-[11px] font-black text-[#5f6f56]">{secondaryAction}</button> : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#f6fff0] p-4 text-sm font-black text-[#5f6f56]">
            {kind === "lms" ? "No courses yet. Use Add Course to create one." : "No records are available in this view yet."}
          </div>
        )}
      </div>
    </article>
  )
}

type SuperAdminQuickAction = "view" | "edit" | "toggle_status" | "generate_report" | "remove"

type SuperAdminQuickActionResult = {
  action: SuperAdminQuickAction
  title: string
  module: string
  recordTitle: string
  message: string
  operationId?: string
  row: Record<string, unknown>
}

type SuperAdminQuickActionRequest = {
  action: SuperAdminQuickAction
  module: string
  activeKey: string
  title: string
  row: Record<string, unknown>
}

function canUseQuickActions(kind: string, activeKey: string) {
  if (kind === "crm") return activeKey === "leads"
  if (kind === "students") return activeKey === "users"
  if (kind === "finance") return ["invoices", "defaulters", "payments"].includes(activeKey)
  return false
}

function SuperAdminQuickActionButtons({
  row,
  onAction,
}: {
  row: Record<string, unknown>
  onAction: (action: SuperAdminQuickAction) => void
}) {
  const actions: Array<{ key: SuperAdminQuickAction; label: string; icon: LucideIcon; className: string }> = [
    { key: "view", label: "View", icon: Eye, className: "border-[#ddeecf] bg-white text-[#5f6f56] hover:border-[#7cb342] hover:text-[#3e9e00]" },
    { key: "edit", label: "Edit", icon: Pencil, className: "border-[#ddeecf] bg-white text-[#5f6f56] hover:border-[#7cb342] hover:text-[#3e9e00]" },
    { key: "toggle_status", label: "Deactivate", icon: Power, className: "border-[#ddeecf] bg-white text-[#5f6f56] hover:border-[#7cb342] hover:text-[#3e9e00]" },
    { key: "generate_report", label: "Generate Report", icon: ClipboardList, className: "border-[#1cb0f6] bg-[#eff9ff] text-[#1cb0f6] hover:bg-white" },
    { key: "remove", label: "Remove", icon: Trash2, className: "border-[#fecaca] bg-[#fff1f2] text-[#dc2626] hover:border-[#ef4444] hover:bg-white" },
  ]

  return (
    <>
      {actions.map(({ key, label, icon: Icon, className }) => (
        <button
          key={key}
          type="button"
          title={label}
          aria-label={label}
          onClick={() => onAction(key)}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border transition ${className}`}
        >
          <Icon size={14} />
        </button>
      ))}
    </>
  )
}

function SuperAdminQuickActionResultModal({
  result,
  onClose,
}: {
  result: SuperAdminQuickActionResult
  onClose: () => void
}) {
  const fields = Object.entries(result.row)
    .filter(([, value]) => value !== null && value !== undefined && formatCell(value) !== "-")
    .slice(0, 10)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-[22px] border border-[#ddeecf] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3e9e00]">{result.module}</p>
            <h2 className="mt-1 text-xl font-black capitalize text-[#071B4A]">{result.title}</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{result.message}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDE9E4] px-3 py-2 text-sm font-black text-[#071B4A]">
            Close
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-[#dbeecf] bg-[#f6fff0] p-3">
          <p className="text-sm font-black text-[#18230f]">{result.recordTitle}</p>
          {result.operationId ? <p className="mt-1 text-xs font-bold text-[#5f6f56]">Operation ID: {result.operationId}</p> : null}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {fields.map(([key, value]) => (
            <div key={key} className="rounded-xl border border-[#e5f2dc] bg-white p-3">
              <p className="text-[10px] font-black uppercase text-[#5f6f56]">{prettyColumn(key)}</p>
              <p className="mt-1 break-words text-sm font-bold text-[#18230f]">{formatCell(value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function quickActionModuleLabel(request: SuperAdminQuickActionRequest) {
  if (request.module === "lead") return "Lead Management"
  if (request.module === "students") return "Students"
  if (request.module === "finance") return request.activeKey === "payments" ? "Finance Payment" : "Finance Invoice"
  return "CRM"
}

function quickEditFields(request: SuperAdminQuickActionRequest) {
  if (request.module === "lead") {
    return [
      ["student_name", "Name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["course_interest", "Course", "text"],
      ["source", "Source", "text"],
      ["status", "Status", "text"],
      ["score", "Lead score", "number"],
      ["notes", "Notes", "textarea"],
    ] as const
  }
  if (request.module === "students") {
    return [
      ["full_name", "Name", "text"],
      ["email", "Email", "email"],
      ["phone", "Phone", "text"],
      ["branch_id", "Branch", "text"],
      ["course_enrolled", "Course", "text"],
      ["batch_name", "Batch", "text"],
      ["student_status", "Status", "text"],
      ["document_status", "Document status", "text"],
    ] as const
  }
  if (request.activeKey === "payments") {
    return [
      ["amount", "Amount", "number"],
      ["payment_method", "Payment method", "text"],
      ["reference_number", "Reference number", "text"],
      ["notes", "Notes", "textarea"],
    ] as const
  }
  return [
    ["invoice_number", "Invoice number", "text"],
    ["student_id", "Student ID", "text"],
    ["course_name", "Course", "text"],
    ["amount", "Amount", "number"],
    ["paid_amount", "Paid amount", "number"],
    ["status", "Status", "text"],
    ["due_date", "Due date", "date"],
    ["notes", "Notes", "textarea"],
  ] as const
}

function quickUpdateEndpoint(request: SuperAdminQuickActionRequest) {
  const id = formatCell(request.row.id)
  if (!id || id === "-") return ""
  if (request.module === "lead") return `/crm/leads/${id}`
  if (request.module === "students") return `/auth/users/${id}`
  if (request.module === "finance" && request.activeKey === "payments") return `/finance/payments/${id}`
  if (request.module === "finance") return `/finance/invoices/${id}`
  return ""
}

function quickDeleteEndpoint(request: SuperAdminQuickActionRequest) {
  const id = formatCell(request.row.id)
  if (!id || id === "-") return ""
  if (request.module === "lead") return `/crm/leads/${id}`
  if (request.module === "students") return `/auth/users/${id}`
  if (request.module === "finance" && request.activeKey === "payments") return `/finance/payments/${id}`
  if (request.module === "finance") return `/finance/invoices/${id}`
  return ""
}

function quickTogglePayload(request: SuperAdminQuickActionRequest) {
  if (request.module === "lead") return { status: "lost", lost_reason: "Deactivated by Super Admin" }
  if (request.module === "students") return { is_active: false, student_status: "inactive" }
  if (request.module === "finance" && request.activeKey === "payments") {
    const existingNotes = formatCell(request.row.notes)
    return { notes: `${existingNotes === "-" ? "" : `${existingNotes}\n`}Deactivated by Super Admin`.trim() }
  }
  return { status: "cancelled" }
}

function SuperAdminQuickActionModal({
  accessToken,
  request,
  onClose,
  onSaved,
}: {
  accessToken: string
  request: SuperAdminQuickActionRequest
  onClose: () => void
  onSaved: (message: string, row: Record<string, unknown>) => void | Promise<void>
}) {
  const isEdit = request.action === "edit"
  const isToggle = request.action === "toggle_status"
  const isRemove = request.action === "remove"
  const fields = quickEditFields(request)
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(fields.map(([name]) => [name, formatCell(request.row[name]) === "-" ? "" : formatCell(request.row[name])])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const endpoint = isRemove ? quickDeleteEndpoint(request) : quickUpdateEndpoint(request)
  const title = isEdit ? `Edit ${quickActionModuleLabel(request)}` : isRemove ? "Confirm Remove" : "Confirm Deactivate"

  async function submit(event?: { preventDefault: () => void }) {
    event?.preventDefault()
    if (!endpoint) {
      setError("This record cannot be updated because it has no backend id.")
      return
    }
    setBusy(true)
    setError("")
    try {
      const body = isEdit
        ? Object.fromEntries(fields.map(([name, , type]) => [name, type === "number" ? Number(form[name] || 0) : form[name] || null]))
        : quickTogglePayload(request)
      const updated = await apiRequest<Record<string, unknown>>(endpoint, accessToken, isRemove ? { method: "DELETE" } : {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      await onSaved(isEdit ? "Changes saved successfully." : isRemove ? "Record removed successfully." : "Status updated successfully.", isRemove ? request.row : updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-auto rounded-[22px] border border-[#ddeecf] bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#071B4A]">{title}</h2>
            <p className="mt-2 text-sm font-bold text-[#64748B]">{rowTitle(request.row)}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-11 w-11 place-items-center rounded-full border border-[#dbeecf] text-[#071B4A]">
            x
          </button>
        </div>
        {error ? <div className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-sm font-bold text-[#b91c1c]">{error}</div> : null}

        {isEdit ? (
          <form onSubmit={submit} className="mt-5 space-y-4">
            {fields.map(([name, label, type]) => (
              <label key={name} className="block text-sm font-black text-[#071B4A]">
                {label}
                {type === "textarea" ? (
                  <textarea value={form[name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="mt-2 min-h-24 w-full rounded-[16px] border border-[#dbeecf] px-4 py-3 text-sm font-bold outline-none focus:border-[#58cc02]" />
                ) : (
                  <input type={type} value={form[name] ?? ""} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} className="mt-2 h-12 w-full rounded-[16px] border border-[#dbeecf] px-4 text-sm font-bold outline-none focus:border-[#58cc02]" />
                )}
              </label>
            ))}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="rounded-[14px] border border-[#dbeecf] px-5 py-3 text-sm font-black text-[#071B4A]">Cancel</button>
              <button type="submit" disabled={busy} className="rounded-[14px] bg-[#58cc02] px-6 py-3 text-sm font-black text-white disabled:opacity-60">{busy ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        ) : (
          <div className="mt-6">
            <p className="text-base font-semibold leading-7 text-[#64748B]">
              {isRemove ? `Remove ${rowTitle(request.row)}? This will delete this specific record from ${quickActionModuleLabel(request)}.` : `Deactivate ${rowTitle(request.row)}? This will update the database record and reduce access or active status where supported.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-[12px] border border-[#dbeecf] px-5 py-3 text-sm font-black text-[#071B4A]">Cancel</button>
              <button type="button" onClick={() => void submit()} disabled={busy} className="rounded-[12px] bg-[#fee2e2] px-5 py-3 text-sm font-black text-[#dc2626] disabled:opacity-60">{busy ? "Saving..." : isRemove ? "Yes, Remove" : "Yes, Deactivate"}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EnhancedModuleOverview({ kind, data }: { kind: string; data: Record<string, unknown[]> }) {
  const enhanced = buildEnhancedPanelData(kind, data)
  if (!enhanced) return null
  const toneClass = {
    green: "bg-[#E8F6F0] text-[#0B7A5A]",
    blue: "bg-[#EAF2FF] text-[#1D4ED8]",
    orange: "bg-[#FFF7ED] text-[#EA580C]",
    red: "bg-[#FEF2F2] text-[#DC2626]",
  } as const
  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {enhanced.kpis.map((item) => (
          <article key={item.label} className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase text-[#64748B]">{item.label}</p>
              <span className={`rounded-full px-2 py-1 text-[10px] font-black ${toneClass[item.tone]}`}>Live</span>
            </div>
            <p className="mt-3 text-2xl font-black text-[#071B4A]">{item.value}</p>
            <p className="mt-1 text-xs font-bold text-[#64748B]">{item.helper}</p>
          </article>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1.1fr]">
        <MiniBarChart title={kind === "finance" ? "Invoice Status" : kind === "students" ? "Course Distribution" : "Lead Status"} rows={enhanced.primaryChart} />
        <MiniBarChart title={kind === "finance" ? "Payment Methods" : kind === "students" ? "Lifecycle Status" : "Lead Sources"} rows={enhanced.secondaryChart} />
        <div className="rounded-lg border border-[#E3ECE8] bg-white p-4">
          <h3 className="text-sm font-black text-[#071B4A]">{enhanced.reviewTitle}</h3>
          <p className="mt-1 text-xs font-semibold text-[#64748B]">{enhanced.reviewMeta}</p>
          <div className="mt-4 space-y-2">
            {enhanced.reviewRows.length ? enhanced.reviewRows.map((row, index) => (
              <div key={formatCell(row.id ?? index)} className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3">
                <p className="truncate text-sm font-black text-[#071B4A]">{rowTitle(row)}</p>
                <p className="mt-1 truncate text-xs font-semibold text-[#64748B]">
                  {formatCell(row.status ?? row.student_status ?? row.course_enrolled ?? row.invoice_number ?? row.email ?? row.phone)}
                </p>
              </div>
            )) : <p className="rounded-lg bg-[#FBFDFC] p-3 text-sm font-bold text-[#64748B]">No review items right now.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

const oldSuperAdminActions: Record<string, SuperAdminActionConfig> = {
  "Add lead": {
    title: "Add lead",
    description: "Creates a CRM lead.",
    endpoint: "/crm/leads",
    method: "POST",
    successMessage: "CRM lead created successfully.",
    fields: [
      { name: "student_name", label: "Student name", required: true },
      { name: "parent_name", label: "Parent name" },
      { name: "phone", label: "Phone", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "course_interest", label: "Course interest" },
      { name: "source", label: "Lead source", type: "select", defaultValue: "walk-in", options: [{ label: "Walk-in", value: "walk-in" }, { label: "Website", value: "website" }, { label: "WhatsApp", value: "whatsapp" }, { label: "Facebook", value: "facebook" }, { label: "Referral", value: "referral" }] },
      { name: "status", label: "Status", type: "select", defaultValue: "new", options: [{ label: "New", value: "new" }, { label: "Contacted", value: "contacted" }, { label: "Follow up", value: "follow_up" }, { label: "Demo scheduled", value: "demo_scheduled" }, { label: "Converted", value: "converted" }, { label: "Lost", value: "lost" }] },
      { name: "score", label: "Lead score", type: "number", defaultValue: "50" },
      { name: "next_follow_up_at", label: "Next follow-up", type: "datetime-local" },
      { name: "branch_id", label: "Branch ID" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    buildBody: (v) => ({ student_name: v.student_name, parent_name: v.parent_name || null, phone: v.phone, email: v.email || null, course_interest: v.course_interest || null, source: v.source || "walk-in", status: v.status || "new", score: Number(v.score || 0), branch_id: v.branch_id || null, counsellor_id: null, next_follow_up_at: v.next_follow_up_at || null, notes: v.notes || null }),
  },
  "Schedule demo": {
    title: "Schedule demo",
    description: "Schedules a demo class by updating an existing CRM lead.",
    endpoint: "/crm/leads/{lead_id}",
    method: "PATCH",
    successMessage: "Demo scheduled successfully.",
    fields: [
      { name: "lead_id", label: "Lead ID", required: true },
      { name: "demo_at", label: "Demo date and time", type: "datetime-local", required: true },
      { name: "demo_mode", label: "Demo mode", type: "select", defaultValue: "offline", options: [{ label: "Offline", value: "offline" }, { label: "Online", value: "online" }] },
      { name: "demo_link", label: "Demo link" },
      { name: "trainer_name", label: "Trainer name" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    buildBody: (v) => ({ status: "demo_scheduled", next_follow_up_at: v.demo_at, demo_at: v.demo_at, demo_mode: v.demo_mode || "offline", demo_link: v.demo_link || null, demo_attended: "pending", notes: [v.trainer_name ? `Trainer: ${v.trainer_name}` : "", v.notes || ""].filter(Boolean).join("\n") }),
  },
  "Follow up": {
    title: "Follow up",
    description: "Updates an existing CRM lead with follow-up status, date, and notes.",
    endpoint: "/crm/leads/{lead_id}",
    method: "PATCH",
    successMessage: "Lead follow-up updated successfully.",
    fields: [
      { name: "lead_id", label: "Lead ID", required: true },
      { name: "status", label: "Follow-up status", type: "select", defaultValue: "follow_up", options: [{ label: "Contacted", value: "contacted" }, { label: "Follow up", value: "follow_up" }, { label: "Demo scheduled", value: "demo_scheduled" }, { label: "Converted", value: "converted" }, { label: "Lost", value: "lost" }] },
      { name: "next_follow_up_at", label: "Next follow-up", type: "datetime-local" },
      { name: "notes", label: "Follow-up notes", type: "textarea" },
      { name: "lost_reason", label: "Lost reason" },
    ],
    buildBody: (v) => ({ status: v.status || "follow_up", next_follow_up_at: v.next_follow_up_at || null, notes: v.notes || null, lost_reason: v.lost_reason || null }),
  },
  "Add student": {
    title: "Add student",
    description: "Creates a student profile with parent, course, batch, and document status.",
    endpoint: "/auth/users",
    method: "POST",
    successMessage: "Student created successfully.",
    fields: [
      { name: "full_name", label: "Full name", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Student phone" },
      { name: "password", label: "Password", type: "password", required: true, defaultValue: "Admin@123" },
      { name: "parent_name", label: "Parent / guardian name" },
      { name: "parent_phone", label: "Parent phone" },
      { name: "course_enrolled", label: "Course enrolled" },
      { name: "batch_name", label: "Batch name" },
      { name: "trainer_name", label: "Trainer name" },
      { name: "student_status", label: "Student status", type: "select", defaultValue: "active", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }, { label: "Completed", value: "completed" }, { label: "Dropped", value: "dropped" }] },
      { name: "document_status", label: "Document status", type: "select", defaultValue: "pending", options: [{ label: "Pending", value: "pending" }, { label: "Verified", value: "verified" }, { label: "Rejected", value: "rejected" }] },
      { name: "branch_id", label: "Branch ID" },
    ],
    buildBody: (v) => ({ ...v, role: "student", phone: v.phone || null, branch_id: v.branch_id || null }),
  },
  "Assign batch": {
    title: "Assign batch",
    description: "Assigns an existing student to an LMS course or batch.",
    endpoint: "/lms/enrollments/assign",
    method: "POST",
    successMessage: "Student assigned to batch successfully.",
    fields: [{ name: "student_id", label: "Student ID", required: true }, { name: "course_id", label: "Course ID", required: true }, { name: "batch_name", label: "Batch name" }],
    buildBody: (v) => ({ student_id: v.student_id, course_id: v.course_id, batch_name: v.batch_name || null }),
  },
  "Update status": {
    title: "Update status",
    description: "Updates an existing student's status.",
    endpoint: "/auth/users/assign-role",
    method: "PATCH",
    successMessage: "Student status updated successfully.",
    fields: [{ name: "user_id", label: "Student ID", required: true }, { name: "is_active", label: "Student status", type: "select", defaultValue: "true", options: [{ label: "Active", value: "true" }, { label: "Inactive", value: "false" }] }, { name: "student_status", label: "Lifecycle status", defaultValue: "active" }, { name: "batch_name", label: "Batch name" }, { name: "trainer_name", label: "Trainer name" }, { name: "branch_id", label: "Branch ID" }],
    buildBody: (v) => ({ user_id: v.user_id, role: "student", branch_id: v.branch_id || null, is_active: v.is_active === "true", student_status: v.student_status || null, batch_name: v.batch_name || null, trainer_name: v.trainer_name || null }),
  },
  "Create course": {
    title: "Create course",
    description: "Creates an LMS course.",
    endpoint: "/lms/courses",
    method: "POST",
    successMessage: "Course created successfully.",
    fields: [{ name: "title", label: "Course title", required: true }, { name: "description", label: "Description", type: "textarea", required: true }, { name: "duration", label: "Duration", defaultValue: "8 weeks" }, { name: "difficulty_level", label: "Difficulty", type: "select", defaultValue: "Beginner", options: [{ label: "Beginner", value: "Beginner" }, { label: "Intermediate", value: "Intermediate" }, { label: "Advanced", value: "Advanced" }] }, { name: "status", label: "Status", type: "select", defaultValue: "draft", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }] }],
    buildBody: (v) => ({ title: v.title, description: v.description, duration: v.duration || "8 weeks", difficulty_level: v.difficulty_level || "Beginner", status: v.status || "draft" }),
  },
  "Upload lesson": {
    title: "Create lesson",
    description: "Adds a lesson to an existing course.",
    endpoint: "/lms/courses/{course_id}/lessons",
    method: "POST",
    successMessage: "Lesson created successfully.",
    fields: [{ name: "course_id", label: "Course ID", required: true }, { name: "title", label: "Lesson title", required: true }, { name: "summary", label: "Summary", type: "textarea" }, { name: "content", label: "Lesson content", type: "textarea" }, { name: "video_url", label: "Video URL" }, { name: "pdf_url", label: "PDF URL" }, { name: "content_type", label: "Content type", type: "select", defaultValue: "lesson", options: [{ label: "Lesson", value: "lesson" }, { label: "Assignment", value: "assignment" }, { label: "Quiz prep", value: "quiz_prep" }, { label: "Project", value: "project" }] }, { name: "assignment_url", label: "Assignment URL" }, { name: "due_at", label: "Due date and time" }, { name: "max_marks", label: "Max marks", type: "number", defaultValue: "0" }, { name: "sort_order", label: "Sort order", type: "number", defaultValue: "1" }],
    buildBody: (v) => ({ title: v.title, summary: v.summary || null, content: v.content || null, video_url: v.video_url || null, pdf_url: v.pdf_url || null, assignment_url: v.assignment_url || null, content_type: v.content_type || "lesson", due_at: v.due_at || null, max_marks: Number(v.max_marks || 0), sort_order: Number(v.sort_order || 1), is_preview: false }),
  },
  "Publish quiz": {
    title: "Publish quiz",
    description: "Creates a quiz with one starter question.",
    endpoint: "/lms/courses/{course_id}/quizzes",
    method: "POST",
    successMessage: "Quiz created successfully.",
    fields: [{ name: "course_id", label: "Course ID", required: true }, { name: "title", label: "Quiz title", required: true }, { name: "description", label: "Description", type: "textarea" }, { name: "question", label: "Question", type: "textarea", required: true }, { name: "option_a", label: "Option A", required: true }, { name: "option_b", label: "Option B", required: true }, { name: "correct_option", label: "Correct option", type: "select", defaultValue: "A", options: [{ label: "A", value: "A" }, { label: "B", value: "B" }] }],
    buildBody: (v) => ({ title: v.title, description: v.description || null, passing_score: 60, total_marks: 1, status: "published", questions: [{ question: v.question, option_a: v.option_a, option_b: v.option_b, correct_option: v.correct_option || "A", marks: 1 }] }),
  },
  "Mark attendance": {
    title: "Mark attendance",
    description: "Creates a class attendance session and marks students.",
    endpoint: "/attendance/sessions/quick-mark",
    method: "POST",
    successMessage: "Attendance marked for active students.",
    fields: [{ name: "title", label: "Session title", required: true }, { name: "session_date", label: "Session date", type: "date", required: true }, { name: "course_id", label: "Course / batch" }, { name: "status", label: "Default mark", type: "select", defaultValue: "present", options: [{ label: "Present", value: "present" }, { label: "Absent", value: "absent" }, { label: "Late", value: "late" }] }, { name: "remarks", label: "Remarks", type: "textarea" }],
    buildBody: (v) => ({ title: v.title, session_date: v.session_date, course_id: v.course_id || null, status: v.status || "present", remarks: v.remarks || null }),
  },
  "Create invoice": {
    title: "Create invoice",
    description: "Creates a student fee invoice.",
    endpoint: "/finance/invoices",
    method: "POST",
    successMessage: "Invoice created successfully.",
    fields: [{ name: "invoice_number", label: "Invoice number", required: true, defaultValue: "INV-004" }, { name: "student_id", label: "Student ID", required: true }, { name: "branch_id", label: "Branch ID" }, { name: "course_name", label: "Course name" }, { name: "amount", label: "Amount", type: "number", required: true, defaultValue: "10000" }, { name: "due_date", label: "Due date", type: "date", required: true }, { name: "notes", label: "Notes", type: "textarea" }],
    buildBody: (v) => ({ invoice_number: v.invoice_number, student_id: v.student_id, branch_id: v.branch_id || null, course_name: v.course_name || null, amount: Number(v.amount || 0), due_date: v.due_date, notes: v.notes || null }),
  },
  "Record payment": {
    title: "Record payment",
    description: "Records a student fee payment.",
    endpoint: "/finance/payments",
    method: "POST",
    successMessage: "Payment recorded successfully.",
    fields: [{ name: "invoice_id", label: "Invoice ID", required: true }, { name: "amount", label: "Amount", type: "number", required: true, defaultValue: "5000" }, { name: "payment_method", label: "Payment method", defaultValue: "cash" }, { name: "reference_number", label: "Reference number" }, { name: "notes", label: "Notes", type: "textarea" }],
    buildBody: (v) => ({ invoice_id: v.invoice_id, amount: Number(v.amount || 0), payment_method: v.payment_method || "cash", reference_number: v.reference_number || null, notes: v.notes || null }),
  },
  "Send reminders": { title: "Send reminders", description: "Generates fee reminder messages from pending invoices.", endpoint: "/finance/send-reminders", method: "POST", fields: [], buildBody: () => ({}), successMessage: "Fee reminders generated successfully." },
}

function LiveOperationsPanel({ accessToken, config }: { accessToken: string; config: QuickPanelConfig }) {
  const [activeKey, setActiveKey] = useState(config.endpoints[0]?.key ?? "")
  const [data, setData] = useState<Record<string, unknown[]>>({})
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState("")
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [quickActionResult, setQuickActionResult] = useState<SuperAdminQuickActionResult | null>(null)
  const [quickActionRequest, setQuickActionRequest] = useState<SuperAdminQuickActionRequest | null>(null)

  const activeEndpoint = config.endpoints.find((endpoint) => endpoint.key === activeKey) ?? config.endpoints[0]
  const activeRows = data[activeEndpoint?.key ?? ""] ?? []
  const objectRows = activeRows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
  const panelKind = inferPanelKind(config)
  const visual = moduleVisual(panelKind)
  const statusOptions = useMemo(() => {
    const values = objectRows
      .map((row) => formatCell(row.status ?? row.student_status ?? row.document_status))
      .filter((value) => value && value !== "-")
    return ["all", ...Array.from(new Set(values)).slice(0, 8)]
  }, [objectRows])
  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase()
    return objectRows.filter((row) => {
      const matchesSearch = !query || JSON.stringify(row).toLowerCase().includes(query)
      const status = formatCell(row.status ?? row.student_status ?? row.document_status)
      const matchesStatus = statusFilter === "all" || status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [objectRows, searchText, statusFilter])

  const load = useCallback(async () => {
    setLoading(true)
    setNotice("")
    try {
      const results = await Promise.allSettled(config.endpoints.map(async (endpoint) => {
        const response = await apiRequest<unknown>(endpoint.endpoint, accessToken)
        return [endpoint.key, extractRows(response, [endpoint.key, "items", "data", "records"])] as const
      }))
      const entries = results
        .filter((result): result is PromiseFulfilledResult<readonly [string, unknown[]]> => result.status === "fulfilled")
        .map((result) => result.value)
      setData(Object.fromEntries(entries))
      const failed = results.filter((result) => result.status === "rejected").length
      if (failed && entries.length === 0) setNotice("Live data unavailable. Please refresh.")
      else setNotice("")
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Unable to load the latest records.")
    } finally {
      setLoading(false)
    }
  }, [accessToken, config.endpoints])

  const runQuickAction = useCallback(async (action: SuperAdminQuickAction, row: Record<string, unknown>) => {
    const module = panelKind === "crm" && activeEndpoint?.key === "leads" ? "lead" : panelKind
    if (!["crm", "lead", "finance", "students"].includes(module)) return
    const actionLabel = action.replaceAll("_", " ")
    const recordTitle = rowTitle(row)
    const title = `${actionLabel}: ${recordTitle}`
    const request = { action, module, activeKey: activeEndpoint?.key ?? "", title, row }
    if (action === "view") {
      setQuickActionResult({
        action,
        title: actionLabel,
        module: module === "lead" ? "Lead Management" : config.title,
        recordTitle,
        message: "Record details loaded.",
        row,
      })
      return
    }
    if (action === "edit" || action === "toggle_status" || action === "remove") {
      setQuickActionRequest(request)
      return
    }
    setNotice(`Running ${title}...`)
    try {
      const operation = await apiRequest<{ id?: string }>(`/operations/super-admin/${module}/${action}`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          title,
          status: "completed",
          related_user_id: formatCell(row.user_id ?? row.student_id ?? row.id).replace("-", "") || null,
          related_branch_id: formatCell(row.branch_id).replace("-", "") || null,
          amount: row.amount != null ? formatCell(row.amount) : null,
          notes: `${config.title} ${activeEndpoint?.label ?? "record"} action from Super Admin`,
          payload: {
            module: config.title,
            active_key: activeEndpoint?.key,
            action,
            record_id: formatCell(row.id),
            record_title: rowTitle(row),
          },
        }),
      })
      setNotice(`${title} completed.`)
      setQuickActionResult({
        action,
        title: actionLabel,
        module: module === "lead" ? "Lead Management" : config.title,
        recordTitle,
        message: action === "generate_report" ? "Report generation request saved in backend operations." : "Action saved in backend operations.",
        operationId: operation.id,
        row,
      })
      await load()
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "The action could not be completed.")
    }
  }, [accessToken, activeEndpoint?.key, activeEndpoint?.label, config.title, load, panelKind])

  useEffect(() => {
    void Promise.resolve().then(load)
  }, [load])

  return (
    <section className="space-y-4">
      <div className="rounded-[22px] border border-[#d4efbf] bg-[#0f4f0b] p-5 text-white shadow-[0_10px_30px_rgba(21,128,61,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#d7ff70] text-[#3e9e00]">
              <visual.icon size={28} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff70]">{visual.label}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight">{config.title}</h2>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#f0ffe7]">{config.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-[12px] bg-white px-4 py-2 text-sm font-black text-[#246300] shadow-sm">
              <RefreshCw size={16} />
              Refresh
            </button>
            {config.actions?.map((action) => (
              <button key={action} type="button" onClick={() => setActiveAction(action)} className="inline-flex items-center gap-2 rounded-[12px] bg-[#58cc02] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#3e9e00]">
                <Plus size={16} />
                {action === "Create course" ? "Add Course" : action}
              </button>
            ))}
          </div>
        </div>
      </div>

      {panelKind !== "standard" ? <EnhancedModuleOverview kind={panelKind} data={data} /> : null}

      <article className="rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#d7ff70] text-[#3e9e00]">
            <Filter size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[19px] font-black leading-tight text-[#18230f]">Search and filters</h3>
            <p className="mt-1 text-sm font-semibold text-[#5f6f56]">Find records by name, course, phone, status, invoice, or batch.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="h-11 w-full rounded-[12px] border border-[#ddeecf] bg-[#f6fff0] pl-10 pr-3 text-sm font-bold text-[#18230f] outline-none focus:border-[#58cc02]"
              placeholder={`Search ${config.title.toLowerCase()}`}
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-[12px] border border-[#ddeecf] bg-[#f6fff0] px-3 text-sm font-black capitalize text-[#18230f] outline-none focus:border-[#58cc02]">
            {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status.replaceAll("_", " ")}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            {config.endpoints.map((endpoint) => (
              <button
                key={endpoint.key}
                type="button"
                onClick={() => setActiveKey(endpoint.key)}
                className={`h-11 rounded-[12px] px-3 text-xs font-black transition ${activeEndpoint?.key === endpoint.key ? "bg-[#58cc02] text-white" : "border border-[#ddeecf] bg-white text-[#18230f] hover:border-[#58cc02] hover:text-[#3e9e00]"}`}
              >
                {endpoint.label} ({data[endpoint.key]?.length ?? 0})
              </button>
            ))}
          </div>
        </div>
      </article>

      {notice ? <div className="rounded-[16px] border border-[#ddeecf] bg-[#f6fff0] p-3 text-sm font-black text-[#18230f]">{notice}</div> : null}

      <ModuleDirectory kind={panelKind} activeKey={activeEndpoint?.key ?? ""} rows={filteredRows} loading={loading} onAction={setActiveAction} onQuickAction={runQuickAction} />

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#d7ff70] text-[#3e9e00]"><Activity size={22} /></div>
            <div>
              <h3 className="text-[19px] font-black leading-tight text-[#18230f]">Live activity</h3>
              <p className="mt-1 text-sm font-semibold text-[#5f6f56]">Recent movement in this workspace.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {filteredRows.slice(0, 3).map((row, index) => (
              <div key={formatCell(row.id ?? index)} className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
                <p className="truncate text-sm font-black text-[#18230f]">{rowTitle(row)}</p>
                <p className="mt-1 truncate text-xs font-bold text-[#5f6f56]">{formatCell(row.status ?? row.student_status ?? row.course_enrolled ?? row.course_interest ?? row.invoice_number ?? "Updated recently")}</p>
              </div>
            ))}
            {!filteredRows.length ? <p className="rounded-xl bg-[#f6fff0] p-3 text-sm font-black text-[#5f6f56]">No activity to show yet.</p> : null}
          </div>
        </article>
        <article className="rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#d7ff70] text-[#3e9e00]"><Bot size={22} /></div>
            <div>
              <h3 className="text-[19px] font-black leading-tight text-[#18230f]">AI insights</h3>
              <p className="mt-1 text-sm font-semibold text-[#5f6f56]">Top operating signals.</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
            <p className="text-sm font-black text-[#3e9e00]">{filteredRows.length ? `${filteredRows.length} records ready for review` : "Workspace ready"}</p>
            <p className="mt-1 text-xs font-bold leading-5 text-[#5f6f56]">Use filters and quick actions to keep this module moving.</p>
          </div>
        </article>
        <article className="rounded-[22px] border border-[#ddeecf] bg-white p-[18px] shadow-[0_8px_18px_rgba(15,23,42,0.06)]">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#d7ff70] text-[#3e9e00]"><AlertTriangle size={22} /></div>
            <div>
              <h3 className="text-[19px] font-black leading-tight text-[#18230f]">Smart alerts</h3>
              <p className="mt-1 text-sm font-semibold text-[#5f6f56]">Items needing attention.</p>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
            <p className="text-sm font-black text-[#18230f]">{loading ? "Checking records..." : filteredRows.length ? "No critical alerts in this filtered view." : "No smart alerts yet."}</p>
          </div>
        </article>
      </div>
      {activeAction ? (
        <OldSuperAdminActionModal
          accessToken={accessToken}
          action={activeAction}
          data={data}
          onClose={() => setActiveAction(null)}
          onComplete={async (message) => {
            setNotice(message)
            setActiveAction(null)
            await load()
          }}
        />
      ) : null}
      {quickActionRequest ? (
        <SuperAdminQuickActionModal
          accessToken={accessToken}
          request={quickActionRequest}
          onClose={() => setQuickActionRequest(null)}
          onSaved={async (message, row) => {
            setNotice(message)
            setQuickActionResult({
              action: quickActionRequest.action,
              title: quickActionRequest.action.replaceAll("_", " "),
              module: quickActionModuleLabel(quickActionRequest),
              recordTitle: rowTitle(row),
              message,
              row,
            })
            await load()
          }}
        />
      ) : null}
      {quickActionResult ? <SuperAdminQuickActionResultModal result={quickActionResult} onClose={() => setQuickActionResult(null)} /> : null}
    </section>
  )
}

function OldSuperAdminActionModal({
  accessToken,
  action,
  data,
  onClose,
  onComplete,
}: {
  accessToken: string
  action: string
  data: Record<string, unknown[]>
  onClose: () => void
  onComplete: (message: string) => void | Promise<void>
}) {
  const config = oldSuperAdminActions[action]
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries((config?.fields ?? []).map((field) => [field.name, field.defaultValue ?? ""])))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  if (!config) return null

  function optionsFor(field: FormField) {
    if (field.options?.length) return field.options
    const courses = (data.courses ?? []) as Record<string, unknown>[]
    const leads = (data.leads ?? []) as Record<string, unknown>[]
    const students = ((data.students ?? data.users) ?? []) as Record<string, unknown>[]
    const invoices = (data.invoices ?? []) as Record<string, unknown>[]
    if (field.name === "course_id") return courses.map((course) => ({ label: `${formatCell(course.title)} (${formatCell(course.id)})`, value: formatCell(course.id) }))
    if (field.name === "lead_id") return leads.map((lead) => ({ label: `${formatCell(lead.student_name)} - ${formatCell(lead.course_interest ?? "No course")} (${formatCell(lead.id)})`, value: formatCell(lead.id) }))
    if (field.name === "student_id" || field.name === "user_id") return students.filter((student) => student.role === "student" || student.student_status || student.course_enrolled).map((student) => ({ label: `${formatCell(student.full_name ?? student.name)} (${formatCell(student.id)})`, value: formatCell(student.id) }))
    if (field.name === "invoice_id") return invoices.filter((invoice) => invoice.status !== "paid").map((invoice) => ({ label: `${formatCell(invoice.invoice_number)} - Rs ${formatCell(invoice.amount)} (${formatCell(invoice.id)})`, value: formatCell(invoice.id) }))
    if (field.name === "course_name" || field.name === "course_interest" || field.name === "course_enrolled") return courses.map((course) => ({ label: formatCell(course.title), value: formatCell(course.title) }))
    return []
  }

  function update(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const endpoint = config.endpoint.replace("{course_id}", values.course_id ?? "").replace("{lead_id}", values.lead_id ?? "")
      const body = config.buildBody ? config.buildBody(values) : values
      await apiRequest<unknown>(endpoint, accessToken, config.method === "GET" ? { method: "GET" } : { method: config.method, body: JSON.stringify(body) })
      await onComplete(config.successMessage)
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action could not be completed.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-auto rounded-[22px] border border-[#ddeecf] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-[#071B4A]">{config.title}</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">{config.description}</p>
            <p className="mt-2 text-xs font-black text-[#0B7A5A]">Super Admin action</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDE9E4] px-3 py-2 text-sm font-black">Close</button>
        </div>
        {error ? <div className="mt-4 rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-3 text-sm font-bold text-[#9A3412]">{error}</div> : null}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {config.fields.map((field) => {
            const options = optionsFor(field)
            const commonClass = "min-h-11 rounded-lg border border-[#DDE9E4] px-3 text-sm font-bold text-[#071B4A] outline-none focus:border-[#0B7A5A]"
            return (
              <label key={field.name} className={field.type === "textarea" ? "grid gap-2 text-xs font-black uppercase text-[#64748B] md:col-span-2" : "grid gap-2 text-xs font-black uppercase text-[#64748B]"}>
                {field.label}{field.required ? " *" : ""}
                {field.type === "textarea" ? (
                  <textarea value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} className={`${commonClass} min-h-24 py-3 normal-case`} />
                ) : field.type === "select" || options.length ? (
                  <select value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} className={`${commonClass} normal-case`}>
                    <option value="">Select</option>
                    {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <input type={field.type ?? "text"} value={values[field.name] ?? ""} onChange={(event) => update(field.name, event.target.value)} className={`${commonClass} normal-case`} />
                )}
              </label>
            )
          })}
        </div>
        <button type="button" onClick={submit} disabled={busy} className="mt-5 w-full rounded-lg bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
          {busy ? "Saving..." : config.title}
        </button>
      </div>
    </div>
  )
}

const livePanelConfigs: Record<string, QuickPanelConfig> = {
  crm: {
    title: "CRM and Admissions Operations",
    subtitle: "A focused command view for leads, demos, follow-ups, and admissions conversion.",
    endpoints: [
      { key: "leads", label: "Leads", endpoint: "/crm/leads" },
      { key: "admissions", label: "Admissions", endpoint: "/admissions" },
      { key: "courses", label: "Courses", endpoint: "/lms/courses" },
    ],
    actions: ["Add lead", "Schedule demo", "Follow up"],
  },
  "crm/lead-management": {
    title: "Lead Management",
    subtitle: "Prioritize enquiries, schedule demos, and move leads toward admission.",
    endpoints: [
      { key: "leads", label: "Leads", endpoint: "/crm/leads" },
      { key: "courses", label: "Courses", endpoint: "/lms/courses" },
    ],
    actions: ["Add lead", "Schedule demo", "Follow up"],
  },
  "crm/admissions": {
    title: "Admissions Operations",
    subtitle: "Admission records connected with CRM leads and course data.",
    endpoints: [
      { key: "admissions", label: "Admissions", endpoint: "/admissions" },
      { key: "leads", label: "Leads", endpoint: "/crm/leads" },
      { key: "courses", label: "Courses", endpoint: "/lms/courses" },
    ],
    actions: ["Add lead", "Schedule demo", "Follow up"],
  },
  students: {
    title: "Student Operations",
    subtitle: "Student profiles, enrollments, attendance, invoices, and payments in one review view.",
    endpoints: [
      { key: "users", label: "Student Users", endpoint: "/auth/users" },
      { key: "enrollments", label: "Enrollments", endpoint: "/lms/enrollments" },
      { key: "sessions", label: "Attendance", endpoint: "/attendance/sessions" },
      { key: "invoices", label: "Invoices", endpoint: "/finance/invoices" },
      { key: "payments", label: "Payments", endpoint: "/finance/payments" },
    ],
    actions: ["Add student", "Assign batch", "Update status"],
  },
  lms: {
    title: "LMS Operations",
    subtitle: "Courses, enrollments, batches, quizzes, and trainer delivery records.",
    endpoints: [
      { key: "courses", label: "Courses", endpoint: "/lms/courses" },
      { key: "enrollments", label: "Enrollments / Batches", endpoint: "/lms/enrollments" },
      { key: "sessions", label: "Attendance", endpoint: "/attendance/sessions" },
    ],
    actions: ["Create course", "Upload lesson", "Publish quiz", "Mark attendance"],
  },
  "lms/batch": {
    title: "Batch Operations",
    subtitle: "Plan batch assignments, course movement, and attendance-linked activity.",
    endpoints: [
      { key: "enrollments", label: "Enrollments / Batches", endpoint: "/lms/enrollments" },
      { key: "courses", label: "Courses", endpoint: "/lms/courses" },
      { key: "sessions", label: "Attendance Sessions", endpoint: "/attendance/sessions" },
    ],
    actions: ["Assign batch", "Mark attendance"],
  },
  "lms/attendance": {
    title: "Attendance Operations",
    subtitle: "Live attendance sessions with report-ready student attendance data.",
    endpoints: [
      { key: "sessions", label: "Sessions", endpoint: "/attendance/sessions" },
      { key: "students", label: "Attendance Students", endpoint: "/attendance/students" },
    ],
    actions: ["Mark attendance"],
  },
  finance: {
    title: "Finance Operations",
    subtitle: "Finance summary, invoices, payments, fee defaulters, and payroll review in one Super Admin panel.",
    endpoints: [
      { key: "summary", label: "Summary", endpoint: "/finance/summary" },
      { key: "invoices", label: "Invoices", endpoint: "/finance/invoices" },
      { key: "payments", label: "Payments", endpoint: "/finance/payments" },
      { key: "defaulters", label: "Defaulters", endpoint: "/finance/defaulters" },
      { key: "payroll", label: "Payroll", endpoint: "/hr/payroll" },
    ],
    actions: ["Record payment", "Create invoice", "Send reminders"],
  },
  "finance/payments": {
    title: "Payment Operations",
    subtitle: "Collected fee payments, receipts, and payment method trends.",
    endpoints: [
      { key: "payments", label: "Payments", endpoint: "/finance/payments" },
      { key: "invoices", label: "Invoices", endpoint: "/finance/invoices" },
    ],
    actions: ["Record payment"],
  },
  "finance/invoices": {
    title: "Invoice Operations",
    subtitle: "Invoice records, due amounts, paid status, and defaulter context.",
    endpoints: [
      { key: "invoices", label: "Invoices", endpoint: "/finance/invoices" },
      { key: "defaulters", label: "Defaulters", endpoint: "/finance/defaulters" },
      { key: "payments", label: "Payments", endpoint: "/finance/payments" },
    ],
    actions: ["Create invoice", "Record payment", "Send reminders"],
  },
  "finance/payroll": {
    title: "Finance Payroll Review",
    subtitle: "Payroll totals, approval checks, and finance review actions.",
    endpoints: [
      { key: "payroll", label: "Payroll", endpoint: "/hr/payroll" },
      { key: "employees", label: "Employees", endpoint: "/hr/employees" },
    ],
    actions: ["Record payment"],
  },
}

const emptySnapshot = {
  courses: [],
  sessions: [],
  students: [],
  users: [],
  branches: [],
}

function SimpleActionModal({
  accessToken,
  action,
  onClose,
  onComplete,
}: {
  accessToken: string
  action: string
  onClose: () => void
  onComplete: (message: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function submit() {
    setBusy(true)
    try {
      await apiRequest<unknown>(`/operations/${action.toLowerCase().replaceAll(" ", "-")}`, accessToken)
      setMessage(`${action} completed successfully.`)
      onComplete(`${action} completed`)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Action failed")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[22px] border border-[#ddeecf] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <h2 className="text-xl font-black text-[#071B4A]">{action}</h2>
        <p className="mt-1 text-sm font-semibold text-[#64748B]">This action will update the selected workspace.</p>
        {message ? <div className="mt-4 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] p-3 text-xs font-bold text-[#071B4A]">{message}</div> : null}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDE9E4] px-4 py-2 text-sm font-black">Close</button>
          <button type="button" onClick={submit} disabled={busy} className="rounded-lg bg-[#0B7A5A] px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {busy ? "Running..." : "Run"}
          </button>
        </div>
      </div>
    </div>
  )
}

export function SuperAdminModulePage({ slug }: { slug: string[] }) {
  const moduleKey = slug.join("/")
  const config = moduleConfigs[moduleKey]
  const dashboard = useMemo(() => getRoleDashboardMock("super_admin"), [])
  const [mounted, setMounted] = useState(false)
  const [session, setSession] = useState<{ accessToken: string; user: UserProfile } | null>(null)
  const [payload, setPayload] = useState<unknown>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [aiPrompt, setAiPrompt] = useState("Show me today ERP summary")
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hi, I am trained on your Pinesphere ERP data. Ask about students, fees, attendance, CRM, LMS, security, or parent updates." },
  ])
  const [aiSuggestions, setAiSuggestions] = useState(["Find low attendance students", "Show fee follow-up list", "Create parent update summary"])
  const [aiLoading, setAiLoading] = useState(false)
  const [actionStatus, setActionStatus] = useState("")
  const [legacyAction, setLegacyAction] = useState<string | null>(null)

  useEffect(() => {
    void Promise.resolve().then(() => {
      setMounted(true)
      const stored = getStoredSession()
      const legacyUser = parseLegacyUser()
      const accessToken = stored?.accessToken || getStoredSessionValue("pinesphere_access_token")
      const user = stored?.user ?? legacyUser
      if (accessToken && user) {
        setSession({ accessToken, user })
      }
    })
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!session) {
      window.location.href = "/login"
      return
    }

    if (session.user.role !== "super_admin") {
      window.location.href = getRoleDashboardPath(session.user.role)
      return
    }
  }, [mounted, session])

  useEffect(() => {
    if (!session || !config) return
    apiRequest<unknown>(config.endpoint, session.accessToken)
      .then(setPayload)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [config, session])

  async function refreshData() {
    if (!session || !config) return
    setLoading(true)
    setError("")
    try {
      const data = await apiRequest<unknown>(config.endpoint, session.accessToken)
      setPayload(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refresh failed")
    } finally {
      setLoading(false)
    }
  }

  async function runBackendAction(action: NonNullable<ModuleConfig["backendActions"]>[number]) {
    if (!session) return
    setActionStatus(`Running ${action.label}...`)
    try {
      await apiRequest<unknown>(action.endpoint, session.accessToken, {
        method: action.method ?? "POST",
        body: JSON.stringify(action.body),
      })
      setActionStatus(`${action.label} completed successfully.`)
      await refreshData()
    } catch (err) {
      setActionStatus(err instanceof Error ? err.message : "The action could not be completed.")
    }
  }

  if (!config) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8] px-4">
        <div className="rounded-lg border border-[#DDE9E4] bg-white p-5 text-sm font-bold text-[#071B4A] shadow">
          Super Admin module not found.
        </div>
      </main>
    )
  }

  if (!mounted || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black text-[#071B4A] shadow">
          Loading Super Admin module...
        </div>
      </main>
    )
  }

  const rows = extractRows(payload, config.collectionKeys)
  const objectRows = rows.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object" && !Array.isArray(row))
  const columns = Array.from(new Set(objectRows.flatMap((row) => Object.keys(row)))).slice(0, 6)
  const moduleHeaderActions = (
    <>
      <Link href="/super-admin/dashboard" className="inline-flex min-h-8 items-center rounded-[10px] bg-white px-3 text-[11px] font-black text-[#3e9e00] shadow-sm transition hover:bg-[#f6fff0]">
        Dashboard
      </Link>
      {config.actions?.map((action) => (
        <Link key={action.href} href={action.href} className="inline-flex min-h-8 items-center rounded-[10px] bg-white px-3 text-[11px] font-black text-[#3e9e00] shadow-sm transition hover:bg-[#f6fff0]">
          {action.label}
        </Link>
      ))}
      {config.backendActions?.map((action) => (
        <button key={action.label} type="button" onClick={() => runBackendAction(action)} className="inline-flex min-h-8 items-center rounded-[10px] bg-[#18230f] px-3 text-[11px] font-black text-white shadow-sm transition hover:bg-[#26351a]">
          {action.label}
        </button>
      ))}
    </>
  )
  const legacyPanel = (() => {
    if (moduleKey === "users") return <UserManagementPanel accessToken={session.accessToken} headerActions={moduleHeaderActions} />
    if (moduleKey === "branches") return <BranchManagementPanel accessToken={session.accessToken} headerActions={moduleHeaderActions} />
    if (livePanelConfigs[moduleKey]) return <LiveOperationsPanel accessToken={session.accessToken} config={livePanelConfigs[moduleKey]} />
    if (moduleKey === "hr" || moduleKey.startsWith("hr/")) {
      return (
        <HRCommandCenter
          accessToken={session.accessToken}
          snapshot={emptySnapshot}
          setSnapshot={() => {}}
          loading={false}
          notice={actionStatus}
          setNotice={setActionStatus}
          activeAction={legacyAction}
          setActiveAction={setLegacyAction}
          ActionModalComponent={SimpleActionModal}
        />
      )
    }
    if (moduleKey === "franchise") return <FranchiseOperationsPanel accessToken={session.accessToken} ActionModalComponent={SimpleActionModal} />
    if (moduleKey === "reports" || moduleKey.startsWith("reports/")) return <ReportsAnalyticsPanel accessToken={session.accessToken} role="super_admin" />
    return null
  })()

  async function askAi(prompt = aiPrompt) {
    const question = prompt.trim()
    if (!question || aiLoading) return
    setAiLoading(true)
    setAiPrompt("")
    setAiMessages((messages) => [...messages, { role: "user", text: question }])
    try {
      const response = await apiRequest<{ answer?: string; suggestions?: string[] }>("/ai/chat", session.accessToken, {
        method: "POST",
        body: JSON.stringify({ message: question, module: moduleKey || "super_admin" }),
      })
      setAiMessages((messages) => [...messages, { role: "assistant", text: response.answer ?? JSON.stringify(response, null, 2) }])
      if (response.suggestions?.length) setAiSuggestions(response.suggestions)
    } catch (err) {
      setAiMessages((messages) => [...messages, { role: "assistant", text: err instanceof Error ? err.message : "AI assistant is unavailable. Please check backend." }])
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <RoleDashboardLayout dashboard={dashboard} user={session.user} showWelcome={false}>
      <div className="space-y-5">
        {actionStatus ? (
          <section className="rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] p-4 text-sm font-bold text-[#071B4A]">
            {actionStatus}
          </section>
        ) : null}

        {legacyPanel ? legacyPanel : null}

        {moduleKey === "ai-platform" ? (
          <section className="overflow-hidden rounded-[22px] border border-[#d4efbf] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
            <div className="bg-[#0f4f0b] p-5 text-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#d7ff70] text-[#3e9e00]">
                    <Bot size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff70]">AI Platform</p>
                    <h2 className="mt-1 text-2xl font-black leading-tight">AI Assistant</h2>
                    <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#f0ffe7]">Trained on Pinesphere ERP students, fees, attendance, CRM, LMS, security, and parent update data.</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-[#0f4f0b]">Live backend</span>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[18px] border border-[#ddeecf] bg-[#fbfef8] p-4">
                <div className="flex h-[420px] flex-col gap-3 overflow-y-auto pr-1">
                  {aiMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`max-w-[88%] rounded-[16px] px-4 py-3 text-sm font-bold leading-6 ${
                        message.role === "user"
                          ? "self-end bg-[#58cc02] text-white"
                          : "self-start border border-[#ddeecf] bg-white text-[#18230f]"
                      }`}
                    >
                      {message.text}
                    </div>
                  ))}
                  {aiLoading ? <div className="self-start rounded-[16px] border border-[#ddeecf] bg-white px-4 py-3 text-sm font-black text-[#3e9e00]">Thinking...</div> : null}
                </div>

                <div className="mt-4 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
                  <input
                    value={aiPrompt}
                    onChange={(event) => setAiPrompt(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void askAi()
                    }}
                    className="h-12 rounded-[14px] border border-[#ddeecf] bg-white px-4 text-sm font-bold text-[#18230f] outline-none focus:border-[#58cc02]"
                    placeholder="Type your question..."
                  />
                  <button
                    type="button"
                    onClick={() => void askAi()}
                    disabled={aiLoading}
                    className="h-12 rounded-[14px] bg-[#58cc02] px-6 text-sm font-black text-white shadow-sm transition hover:bg-[#3e9e00] disabled:opacity-60"
                  >
                    {aiLoading ? "Asking..." : "Ask"}
                  </button>
                </div>
              </div>

              <aside className="space-y-4">
                <article className="rounded-[18px] border border-[#ddeecf] bg-[#f6fff0] p-4">
                  <h3 className="text-sm font-black text-[#18230f]">Suggested prompts</h3>
                  <div className="mt-3 grid gap-2">
                    {aiSuggestions.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void askAi(prompt)}
                        className="rounded-[12px] border border-[#ddeecf] bg-white px-3 py-2 text-left text-xs font-black text-[#18230f] transition hover:border-[#58cc02] hover:text-[#3e9e00]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </article>
                <article className="rounded-[18px] border border-[#ddeecf] bg-white p-4">
                  <h3 className="text-sm font-black text-[#18230f]">Connected data</h3>
                  <div className="mt-3 grid gap-2 text-xs font-bold text-[#5f6f56]">
                    <p>Students, parent details, courses, and batches</p>
                    <p>Attendance records and low-attendance checks</p>
                    <p>CRM leads, admissions, fee invoices, and finance follow-ups</p>
                    <p>Security guidance for roles, sessions, and audits</p>
                  </div>
                </article>
              </aside>
            </div>
          </section>
        ) : null}

        {!legacyPanel && error ? (
          <section className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] p-4 text-sm font-bold text-[#9A3412]">
            We could not load this workspace right now: {error}
          </section>
        ) : null}

        {!legacyPanel ? <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-black text-[#071B4A]">Workspace Records</h2>
            <span className="rounded bg-[#E8F6F0] px-2 py-1 text-[11px] font-black text-[#0B7A5A]">
              {loading ? "Loading" : `${objectRows.length} records`}
            </span>
          </div>

          {loading ? (
            <div className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-4 text-sm font-bold text-[#475569]">Loading the latest workspace data...</div>
          ) : objectRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-[#E3ECE8] px-3 py-3 text-xs font-black uppercase text-[#64748B]">Record</th>
                    {columns.map((column) => (
                      <th key={column} className="border-b border-[#E3ECE8] px-3 py-3 text-xs font-black uppercase text-[#64748B]">{column.replaceAll("_", " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {objectRows.slice(0, 50).map((row, index) => (
                    <tr key={formatCell(row.id ?? index)} className="align-top">
                      <td className="border-b border-[#EDF3F1] px-3 py-3 font-black text-[#071B4A]">{rowTitle(row)}</td>
                      {columns.map((column) => (
                        <td key={column} className="max-w-[260px] truncate border-b border-[#EDF3F1] px-3 py-3 font-semibold text-[#475569]">
                          {formatCell(row[column])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-4 text-sm font-bold text-[#475569]">
              No records are available in this workspace yet.
            </div>
          )}
        </section> : null}
      </div>
    </RoleDashboardLayout>
  )
}
