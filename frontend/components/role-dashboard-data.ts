import type { UserRole } from "@/app/shared/auth"
import { branchAdminSidebar } from "@/components/sidebarConfig/branchAdminSidebar"
import { companyHrSidebar } from "@/components/sidebarConfig/companyHrSidebar"
import { counsellorSidebar } from "@/components/sidebarConfig/counsellorSidebar"
import { financeSidebar } from "@/components/sidebarConfig/financeSidebar"
import { franchiseOwnerSidebar } from "@/components/sidebarConfig/franchiseOwnerSidebar"
import { hrSidebar } from "@/components/sidebarConfig/hrSidebar"
import { parentSidebar } from "@/components/sidebarConfig/parentSidebar"
import { superAdminSidebar } from "@/components/sidebarConfig/superAdminSidebar"
import { trainerSidebar } from "@/components/sidebarConfig/trainerSidebar"

export type RoleDashboardKey = Extract<
  UserRole,
  "super_admin" | "branch_admin" | "counsellor" | "trainer" | "parent" | "hr" | "finance" | "franchise_owner" | "company_hr"
>

const dashboardToday = new Date()
const dashboardTomorrow = new Date(dashboardToday)
dashboardTomorrow.setDate(dashboardToday.getDate() + 1)
const dashboardNextDay = new Date(dashboardToday)
dashboardNextDay.setDate(dashboardToday.getDate() + 2)
const shortDate = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
const followUpMeta = (date: Date, time: string) => `${shortDate.format(date)} - ${time}`
const followUpStatus = (date: Date) => shortDate.format(date)

export type DashboardIconKey =
  | "academics"
  | "admissions"
  | "assignments"
  | "attendance"
  | "batches"
  | "branches"
  | "calendar"
  | "communication"
  | "dashboard"
  | "exams"
  | "fees"
  | "franchise"
  | "library"
  | "lms"
  | "messages"
  | "notices"
  | "payroll"
  | "placement"
  | "profile"
  | "reports"
  | "security"
  | "settings"
  | "staff"
  | "students"
  | "tasks"
  | "tests"
  | "users"
  | "wallet"

export type SidebarModule = {
  key: string
  label: string
  href: string
  icon: DashboardIconKey
  badge?: string
  children?: SidebarModule[]
}

export type MetricTone = "green" | "blue" | "purple" | "orange" | "red"

export type DashboardMetric = {
  key: string
  label: string
  value: string
  helper: string
  href: string
  icon: DashboardIconKey
  tone: MetricTone
  progress?: number
}

export type DonutDatum = {
  label: string
  value: number
  detail: string
  color: string
}

export type LineDatum = {
  label: string
  current: number
  previous?: number
}

export type FunnelDatum = {
  label: string
  value: number
  color: string
}

export type ProgressDatum = {
  label: string
  value: number
  grade?: string
  detail?: string
}

export type RecentItem = {
  title: string
  detail: string
  meta?: string
  status?: string
  tone?: MetricTone
  href: string
  initials?: string
}

export type EventItem = {
  day: string
  month: string
  title: string
  time: string
  status: string
  tone: MetricTone
  href: string
}

export type TaskItem = {
  title: string
  detail?: string
  due: string
  href: string
  completed?: boolean
  tone?: MetricTone
}

export type QuickAction = {
  label: string
  href: string
  icon: DashboardIconKey
}

export type SummaryStat = {
  label: string
  value: string
}

export type CommunicationStat = {
  label: string
  value: string
  icon: DashboardIconKey
  tone: MetricTone
}

export type RoleDashboardMock = {
  role: RoleDashboardKey
  title: string
  portalLabel: string
  roleLabel: string
  userName: string
  userSubtitle: string
  avatar: string
  notificationCount: number
  welcome: string
  dateLabel: string
  modules: SidebarModule[]
  metrics: DashboardMetric[]
  donutCards: Array<{
    key: string
    title: string
    centerLabel: string
    centerValue: string
    href: string
    linkLabel: string
    data: DonutDatum[]
  }>
  lineCards: Array<{
    key: string
    title: string
    href: string
    linkLabel: string
    data: LineDatum[]
    suffix?: string
    currency?: boolean
  }>
  funnels: Array<{
    key: string
    title: string
    href: string
    linkLabel: string
    data: FunnelDatum[]
  }>
  progressCards: Array<{
    key: string
    title: string
    href: string
    linkLabel: string
    data: ProgressDatum[]
  }>
  keyModules?: QuickAction[]
  lists: Array<{
    key: string
    title: string
    href: string
    linkLabel?: string
    items: RecentItem[]
  }>
  events?: {
    title: string
    href: string
    linkLabel: string
    items: EventItem[]
  }
  tasks?: {
    title: string
    href: string
    linkLabel: string
    items: TaskItem[]
  }
  quickActions?: QuickAction[]
  summaryStats?: SummaryStat[]
  communicationStats?: CommunicationStat[]
  footerPanel?: {
    title: string
    studentName?: string
    detail?: string
    stats: SummaryStat[]
    remarkTitle?: string
    remark?: string
    href: string
  }
}

const green = "#0B7A5A"
const navy = "#071B4A"
const blue = "#2563EB"
const purple = "#7C3AED"
const orange = "#F97316"
const red = "#EF4444"
const grey = "#A7B0BC"

export const roleDashboardMocks: Record<RoleDashboardKey, RoleDashboardMock> = {
  super_admin: {
    role: "super_admin",
    title: "Super Admin Dashboard",
    portalLabel: "Super Admin",
    roleLabel: "Super Admin",
    userName: "Super Admin",
    userSubtitle: "Organization-wide control",
    avatar: "SA",
    notificationCount: 9,
    welcome: "Organization-wide metrics, branches, access, and security are isolated here.",
    dateLabel: "03 June 2026, Tuesday",
    modules: superAdminSidebar,
    metrics: [
      { key: "students", label: "Total Students", value: "0", helper: "All branches in scope", href: "/super-admin/students", icon: "students", tone: "green" },
      { key: "branches", label: "Branches", value: "0", helper: "Organization branch network", href: "/super-admin/branches", icon: "branches", tone: "blue" },
      { key: "fees", label: "Organization Revenue", value: "Rs 0", helper: "All collected payments", href: "/super-admin/finance/payments", icon: "wallet", tone: "orange" },
      { key: "security", label: "Security Checks", value: "Active", helper: "RBAC and session controls", href: "/super-admin/security", icon: "security", tone: "purple" },
    ],
    donutCards: [],
    lineCards: [],
    funnels: [],
    progressCards: [],
    keyModules: [
      { label: "Branches", href: "/super-admin/branches", icon: "branches" },
      { label: "Users", href: "/super-admin/users", icon: "users" },
      { label: "Finance", href: "/super-admin/finance/payments", icon: "wallet" },
      { label: "Security", href: "/super-admin/security", icon: "security" },
    ],
    lists: [
      {
        key: "organization-activity",
        title: "Organization Activity",
        href: "/reports",
        linkLabel: "View reports",
        items: [
          { title: "Role dashboards isolated", detail: "Each role has a dedicated route and sidebar", meta: "Live", href: "/super-admin/security", tone: "green" },
          { title: "Organization metrics connected", detail: "Super Admin endpoint uses organization scope", meta: "Live", href: "/super-admin/reports/analytics", tone: "blue" },
        ],
      },
    ],
    summaryStats: [
      { label: "Scope", value: "All" },
      { label: "Access", value: "SA" },
      { label: "Route", value: "Dedicated" },
    ],
  },
  branch_admin: {
    role: "branch_admin",
    title: "Branch Dashboard",
    portalLabel: "Branch Admin",
    roleLabel: "Branch Admin",
    userName: "Dencil Jaushmy",
    userSubtitle: "Pinesphere Kochi",
    avatar: "BA",
    notificationCount: 12,
    welcome: "Here's what's happening in your branch today.",
    dateLabel: "03 June 2026, Tuesday",
    modules: branchAdminSidebar,
    metrics: [
      { key: "students", label: "Total Students", value: "1,248", helper: "12.5% this month", href: "/students", icon: "students", tone: "green" },
      { key: "admissions", label: "New Admissions", value: "86", helper: "18.6% this month", href: "/crm", icon: "admissions", tone: "blue" },
      { key: "attendance", label: "Attendance Today", value: "92.4%", helper: "4.2% vs yesterday", href: "/attendance", icon: "attendance", tone: "purple" },
      { key: "fees", label: "Fee Collection (MTD)", value: "₹8,64,250", helper: "22.8% this month", href: "/finance", icon: "wallet", tone: "orange" },
    ],
    donutCards: [
      {
        key: "student-overview",
        title: "Student Overview",
        centerLabel: "Total",
        centerValue: "1,248",
        href: "/students",
        linkLabel: "View all students",
        data: [
          { label: "Enrolled", value: 925, detail: "925 (74%)", color: green },
          { label: "Active", value: 198, detail: "198 (16%)", color: blue },
          { label: "Completed", value: 75, detail: "75 (6%)", color: purple },
          { label: "On Hold", value: 25, detail: "25 (2%)", color: "#F59E0B" },
          { label: "Withdrawn", value: 15, detail: "15 (1%)", color: red },
          { label: "Transferred", value: 10, detail: "10 (1%)", color: grey },
        ],
      },
    ],
    funnels: [
      {
        key: "admissions-funnel",
        title: "Admissions Funnel (This Month)",
        href: "/crm",
        linkLabel: "View admissions",
        data: [
          { label: "Leads", value: 245, color: green },
          { label: "Applications", value: 140, color: "#A9DDBD" },
          { label: "Documents Verified", value: 98, color: "#B8D8F6" },
          { label: "Admissions Approved", value: 86, color: "#CDB7F2" },
        ],
      },
    ],
    lineCards: [
      {
        key: "fee-collection",
        title: "Fee Collection Overview",
        href: "/finance",
        linkLabel: "View finance",
        currency: true,
        data: [
          { label: "1 Jun", current: 1, previous: 0 },
          { label: "7 Jun", current: 3, previous: 1.5 },
          { label: "14 Jun", current: 5.8, previous: 3.2 },
          { label: "21 Jun", current: 8.8, previous: 5.6 },
          { label: "28 Jun", current: 11, previous: 8.5 },
        ],
      },
    ],
    progressCards: [],
    keyModules: [
      { label: "Students", href: "/students", icon: "students" },
      { label: "Staff", href: "/hr", icon: "staff" },
      { label: "Finance", href: "/finance", icon: "wallet" },
      { label: "LMS", href: "/lms", icon: "lms" },
      { label: "Reports", href: "/reports", icon: "reports" },
      { label: "Communication", href: "/communication", icon: "communication" },
    ],
    lists: [
      {
        key: "recent-admissions",
        title: "Recent Admissions",
        href: "/crm",
        linkLabel: "View all",
        items: [
          { title: "Aarav Sharma", detail: "Full Stack Development", meta: "03 Jun 2026", status: "Approved", tone: "green", href: "/crm", initials: "AS" },
          { title: "Neha Patel", detail: "Data Science", meta: "02 Jun 2026", status: "Approved", tone: "green", href: "/crm", initials: "NP" },
          { title: "Rohan Kumar", detail: "Digital Marketing", meta: "01 Jun 2026", status: "Pending", tone: "orange", href: "/crm", initials: "RK" },
          { title: "Sneha Iyer", detail: "UI/UX Design", meta: "31 May 2026", status: "Approved", tone: "green", href: "/crm", initials: "SI" },
          { title: "Vikram Desai", detail: "Cyber Security", meta: "30 May 2026", status: "Pending", tone: "orange", href: "/crm", initials: "VD" },
        ],
      },
      {
        key: "notifications",
        title: "Recent Notifications",
        href: "/communication",
        linkLabel: "View all",
        items: [
          { title: "Fee payment of ₹25,000 received from Aarav Sharma", detail: "Finance", meta: "10 mins ago", tone: "orange", href: "/finance" },
          { title: "New admission Neha Patel has been approved", detail: "Admissions", meta: "1 hour ago", tone: "green", href: "/crm" },
        ],
      },
    ],
    events: {
      title: "Upcoming Activities",
      href: "/calendar",
      linkLabel: "View Calendar",
      items: [
        { day: "05", month: "Jun", title: "Fee Due Date", time: "All Day", status: "Important", tone: "red", href: "/finance" },
        { day: "07", month: "Jun", title: "Parent Meeting", time: "10:00 AM - 12:00 PM", status: "Meeting", tone: "blue", href: "/calendar" },
        { day: "10", month: "Jun", title: "Monthly Test - FSD Batch", time: "09:30 AM - 11:30 AM", status: "Exam", tone: "green", href: "/exams" },
        { day: "15", month: "Jun", title: "Trainer Workshop", time: "02:00 PM - 04:00 PM", status: "Workshop", tone: "blue", href: "/calendar" },
      ],
    },
    summaryStats: [
      { label: "Active Courses", value: "42" },
      { label: "Batches Running", value: "18" },
      { label: "Trainers", value: "24" },
      { label: "Classrooms", value: "12" },
      { label: "Certifications Issued", value: "356" },
    ],
  },
  counsellor: {
    role: "counsellor",
    title: "Counsellor Dashboard",
    portalLabel: "Counsellor",
    roleLabel: "Counsellor",
    userName: "Dencil Jaushmy",
    userSubtitle: "Pinesphere Kochi",
    avatar: "CL",
    notificationCount: 8,
    welcome: "Here's your performance and activities for today.",
    dateLabel: "03 June 2026, Tuesday",
    modules: counsellorSidebar,
    metrics: [
      { key: "leads", label: "Total Leads", value: "245", helper: "18.6% this month", href: "/crm", icon: "students", tone: "green" },
      { key: "new-leads", label: "New Leads", value: "32", helper: "23.5% this month", href: "/crm", icon: "admissions", tone: "blue" },
      { key: "follow-ups", label: "Follow Ups Today", value: "14", helper: "View your follow up list", href: "/crm", icon: "calendar", tone: "purple" },
      { key: "admissions", label: "Admissions This Month", value: "18", helper: "20.0% this month", href: "/crm", icon: "academics", tone: "green" },
      { key: "students", label: "Students", value: "128", helper: "Converted and active profiles", href: "/students", icon: "students", tone: "blue" },
    ],
    donutCards: [
      {
        key: "lead-status",
        title: "Lead Status Overview",
        centerLabel: "Total Leads",
        centerValue: "245",
        href: "/crm",
        linkLabel: "View all leads",
        data: [
          { label: "New", value: 85, detail: "85 (34.7%)", color: green },
          { label: "Contacted", value: 62, detail: "62 (25.3%)", color: "#3B82F6" },
          { label: "Qualified", value: 48, detail: "48 (19.6%)", color: "#8B5CF6" },
          { label: "Proposal Sent", value: 28, detail: "28 (11.4%)", color: "#F59E0B" },
          { label: "Lost / Not Interested", value: 22, detail: "22 (9.0%)", color: red },
        ],
      },
    ],
    funnels: [],
    lineCards: [],
    progressCards: [],
    lists: [
      {
        key: "follow-ups",
        title: "Upcoming Follow Ups",
        href: "/crm",
        linkLabel: "View all",
        items: [
          { title: "Aarav Sharma", detail: "Full Stack Development", meta: followUpMeta(dashboardToday, "10:00 AM"), status: "Today", tone: "orange", href: "/crm", initials: "AS" },
          { title: "Neha Patel", detail: "Data Science", meta: followUpMeta(dashboardToday, "11:30 AM"), status: "Today", tone: "orange", href: "/crm", initials: "NP" },
          { title: "Rohan Kumar", detail: "Digital Marketing", meta: followUpMeta(dashboardTomorrow, "02:00 PM"), status: followUpStatus(dashboardTomorrow), tone: "blue", href: "/crm", initials: "RK" },
          { title: "Sneha Iyer", detail: "UI/UX Design", meta: followUpMeta(dashboardTomorrow, "03:30 PM"), status: followUpStatus(dashboardTomorrow), tone: "blue", href: "/crm", initials: "SI" },
          { title: "Vikram Desai", detail: "Cyber Security", meta: followUpMeta(dashboardNextDay, "10:30 AM"), status: followUpStatus(dashboardNextDay), tone: "red", href: "/crm", initials: "VD" },
        ],
      },
      {
        key: "recent-leads",
        title: "Recent Leads",
        href: "/crm",
        linkLabel: "View all leads",
        items: [
          { title: "Meera Nair", detail: "MERN Stack Development", meta: "02 Jun 2026", status: "New", tone: "green", href: "/crm", initials: "MN" },
          { title: "Arjun Menon", detail: "Data Analytics", meta: "02 Jun 2026", status: "New", tone: "green", href: "/crm", initials: "AM" },
          { title: "Fathima Roshni", detail: "Digital Marketing", meta: "01 Jun 2026", status: "Contacted", tone: "blue", href: "/crm", initials: "FR" },
          { title: "Nikhil Varma", detail: "Python Full Stack", meta: "01 Jun 2026", status: "Contacted", tone: "blue", href: "/crm", initials: "NV" },
          { title: "Ananya Krishnan", detail: "UI/UX Design", meta: "31 May 2026", status: "Qualified", tone: "purple", href: "/crm", initials: "AK" },
        ],
      },
    ],
    tasks: {
      title: "Tasks To Do",
      href: "/tasks",
      linkLabel: "View all",
      items: [
        { title: "Call Rahul about course details", due: "Today", href: "/tasks", tone: "red" },
        { title: "Follow up with Neha Patel", due: "Today", href: "/tasks", tone: "red" },
        { title: "Send proposal to 3 leads", due: "Today", href: "/tasks", tone: "red" },
        { title: "Update lead status in CRM", due: "Tomorrow", href: "/tasks", tone: "blue" },
        { title: "Attend counsellor meeting", due: "05 Jun 2026", href: "/tasks" },
      ],
    },
    summaryStats: [
      { label: "Total Leads", value: "245" },
      { label: "Qualified Leads", value: "48" },
      { label: "Proposals Sent", value: "28" },
      { label: "Admissions", value: "18" },
      { label: "Students", value: "128" },
      { label: "Conversion Rate", value: "24.3%" },
    ],
  },
  trainer: {
    role: "trainer",
    title: "Trainer Dashboard",
    portalLabel: "Trainer",
    roleLabel: "Trainer",
    userName: "Dencil Jaushmy",
    userSubtitle: "Pinesphere Kochi",
    avatar: "TR",
    notificationCount: 6,
    welcome: "Here's an overview of your classes and activities today.",
    dateLabel: "03 June 2026, Tuesday",
    modules: trainerSidebar,
    metrics: [
      { key: "batches", label: "Total Batches", value: "6", helper: "2 Active • 4 Completed", href: "/lms", icon: "students", tone: "green" },
      { key: "students", label: "Total Students", value: "128", helper: "12.5% this month", href: "/students", icon: "academics", tone: "blue" },
      { key: "classes", label: "Classes Today", value: "3", helper: "Next: 11:30 AM (Data Structures)", href: "/calendar", icon: "calendar", tone: "orange" },
      { key: "attendance", label: "Attendance Today", value: "92.4%", helper: "4.3% vs yesterday", href: "/attendance", icon: "reports", tone: "purple" },
      { key: "tasks", label: "Pending Tasks", value: "5", helper: "View tasks", href: "/tasks", icon: "tasks", tone: "green" },
    ],
    donutCards: [],
    funnels: [],
    lineCards: [
      {
        key: "attendance-week",
        title: "Attendance Overview (This Week)",
        href: "/attendance",
        linkLabel: "View report",
        suffix: "%",
        data: [
          { label: "Mon", current: 86, previous: 50 },
          { label: "Tue", current: 82, previous: 65 },
          { label: "Wed", current: 60, previous: 40 },
          { label: "Thu", current: 77, previous: 65 },
          { label: "Fri", current: 53, previous: 40 },
          { label: "Sat", current: 84, previous: 65 },
        ],
      },
    ],
    progressCards: [
      {
        key: "my-batches",
        title: "My Batches",
        href: "/lms",
        linkLabel: "View all",
        data: [
          { label: "FSD-2026-01", value: 93, detail: "28/30" },
          { label: "DS-2026-01", value: 89, detail: "25/28" },
          { label: "PY-2026-01", value: 92, detail: "24/26" },
          { label: "UX-2026-01", value: 88, detail: "22/25" },
          { label: "DM-2026-01", value: 75, detail: "15/20" },
          { label: "CS-2026-01", value: 78, detail: "14/18" },
        ],
      },
      {
        key: "course-progress",
        title: "Course Progress Overview",
        href: "/lms",
        linkLabel: "View report",
        data: [
          { label: "Full Stack Development", value: 68 },
          { label: "Data Structures", value: 55 },
          { label: "Python Programming", value: 72 },
          { label: "UI/UX Design", value: 61 },
          { label: "Digital Marketing", value: 45 },
        ],
      },
    ],
    lists: [
      {
        key: "classes",
        title: "Today's Classes",
        href: "/calendar",
        linkLabel: "View full schedule",
        items: [
          { title: "Full Stack Development", detail: "Batch: FSD-2026-01", meta: "09:00 AM", status: "Completed", tone: "green", href: "/calendar" },
          { title: "Data Structures & Algorithms", detail: "Batch: DS-2026-01", meta: "11:30 AM", status: "Ongoing", tone: "blue", href: "/calendar" },
          { title: "UI/UX Design Principles", detail: "Batch: UX-2026-01", meta: "02:00 PM", status: "Scheduled", tone: "orange", href: "/calendar" },
          { title: "Python Programming", detail: "Batch: PY-2026-01", meta: "04:00 PM", status: "Scheduled", tone: "orange", href: "/calendar" },
        ],
      },
      {
        key: "assignments",
        title: "Recent Assignments",
        href: "/assignments",
        linkLabel: "View all",
        items: [
          { title: "React Component Library", detail: "FSD-2026-01", meta: "Due: 05 Jun 2026", status: "12 Submitted", tone: "green", href: "/assignments" },
          { title: "DSA Problem Set - 5", detail: "DS-2026-01", meta: "Due: 06 Jun 2026", status: "8 Submitted", tone: "blue", href: "/assignments" },
          { title: "Python Functions", detail: "PY-2026-01", meta: "Due: 07 Jun 2026", status: "10 Submitted", tone: "orange", href: "/assignments" },
          { title: "UI Design Challenge", detail: "UX-2026-01", meta: "Due: 08 Jun 2026", status: "6 Submitted", tone: "blue", href: "/assignments" },
        ],
      },
      {
        key: "results",
        title: "Recent Test Results",
        href: "/exams",
        linkLabel: "View all",
        items: [
          { title: "DSA Quiz - 2", detail: "Avg Score: 78%", meta: "DS-2026-01", status: "Completed", tone: "purple", href: "/exams", initials: "DS" },
          { title: "HTML & CSS Test", detail: "Avg Score: 84%", meta: "FSD-2026-01", status: "Completed", tone: "purple", href: "/exams", initials: "F" },
          { title: "Python Basics Test", detail: "Avg Score: 88%", meta: "PY-2026-01", status: "Completed", tone: "purple", href: "/exams", initials: "PY" },
          { title: "UI Principles Test", detail: "Avg Score: 91%", meta: "UX-2026-01", status: "Completed", tone: "purple", href: "/exams", initials: "Y" },
        ],
      },
    ],
    tasks: {
      title: "Pending Tasks",
      href: "/tasks",
      linkLabel: "View all",
      items: [
        { title: "Grade React Component Library", detail: "FSD-2026-01", due: "Due Today", href: "/tasks", tone: "red" },
        { title: "Review DSA Problem Set - 5", detail: "DS-2026-01", due: "Due Tomorrow", href: "/tasks", tone: "red" },
        { title: "Prepare Notes for Next Class", detail: "Python Programming", due: "Due 05 Jun", href: "/tasks", tone: "red" },
        { title: "Upload UI Design Resources", detail: "UX-2026-01", due: "Due 06 Jun", href: "/tasks", tone: "red" },
        { title: "Update Course Content", detail: "Full Stack Development", due: "Due 07 Jun", href: "/tasks", tone: "red" },
      ],
    },
    quickActions: [
      { label: "Mark Attendance", href: "/attendance", icon: "attendance" },
      { label: "Create Assignment", href: "/assignments", icon: "assignments" },
      { label: "Create Test", href: "/exams", icon: "tests" },
      { label: "Upload Material", href: "/lms", icon: "lms" },
      { label: "View Calendar", href: "/calendar", icon: "calendar" },
    ],
  },
  parent: {
    role: "parent",
    title: "Parent Dashboard",
    portalLabel: "Parent Portal",
    roleLabel: "Parent of Neha Patel",
    userName: "Dencil Jaushmy",
    userSubtitle: "Neha Patel • Data Science",
    avatar: "P",
    notificationCount: 5,
    welcome: "Here's an overview of your child's progress and activities.",
    dateLabel: "03 June 2026, Tuesday",
    modules: parentSidebar,
    metrics: [
      { key: "attendance", label: "Attendance", value: "92.4%", helper: "4.3% vs last month", href: "/attendance", icon: "attendance", tone: "green" },
      { key: "paid", label: "Total Fees Paid", value: "₹1,24,000", helper: "of ₹1,50,000", href: "/finance", icon: "fees", tone: "green", progress: 82.7 },
      { key: "outstanding", label: "Outstanding Fees", value: "₹26,000", helper: "Due on 10 Jun 2026", href: "/finance", icon: "wallet", tone: "red" },
      { key: "grade", label: "Overall Grade", value: "A", helper: "Excellent Performance", href: "/lms", icon: "academics", tone: "purple" },
      { key: "assignments", label: "Pending Assignments", value: "2", helper: "View assignments", href: "/assignments", icon: "assignments", tone: "orange" },
    ],
    donutCards: [
      {
        key: "attendance",
        title: "Attendance Overview (This Month)",
        centerLabel: "Present",
        centerValue: "92.4%",
        href: "/attendance",
        linkLabel: "View full attendance",
        data: [
          { label: "Present", value: 24, detail: "24 Days (92.4%)", color: green },
          { label: "Absent", value: 2, detail: "2 Days (7.6%)", color: red },
          { label: "Leave", value: 0.2, detail: "0 Days (0%)", color: grey },
        ],
      },
      {
        key: "fees",
        title: "Fee Payment Summary",
        centerLabel: "Total Fees",
        centerValue: "₹1,50,000",
        href: "/finance",
        linkLabel: "View payment history",
        data: [
          { label: "Paid", value: 124000, detail: "₹1,24,000 (82.7%)", color: green },
          { label: "Pending", value: 26000, detail: "₹26,000 (17.3%)", color: "#FBBF24" },
        ],
      },
    ],
    funnels: [],
    lineCards: [],
    progressCards: [
      {
        key: "subjects",
        title: "Subject Performance",
        href: "/reports",
        linkLabel: "View detailed report",
        data: [
          { label: "Data Structures", value: 91, grade: "A" },
          { label: "Python Programming", value: 88, grade: "A" },
          { label: "DBMS", value: 82, grade: "B+" },
          { label: "Operating Systems", value: 79, grade: "B+" },
          { label: "Web Development", value: 85, grade: "A" },
        ],
      },
    ],
    lists: [
      {
        key: "announcements",
        title: "Recent Announcements",
        href: "/notices",
        linkLabel: "View all",
        items: [
          { title: "Holiday Notice", detail: "The campus will remain closed on 06 Jun 2026.", meta: "2 hours ago", href: "/notices", tone: "green" },
          { title: "Workshop on AI & ML", detail: "Workshop for Data Science students on 12 Jun 2026.", meta: "1 day ago", href: "/notices", tone: "blue" },
          { title: "Fee Due Reminder", detail: "Your next fee installment is due on 10 Jun 2026.", meta: "2 days ago", href: "/finance", tone: "orange" },
        ],
      },
      {
        key: "assignments",
        title: "Recent Assignments",
        href: "/assignments",
        linkLabel: "View all",
        items: [
          { title: "DBMS Assignment - 2", detail: "Due: 05 Jun 2026", status: "Submitted", tone: "green", href: "/assignments" },
          { title: "Python Program - File Handling", detail: "Due: 08 Jun 2026", status: "Pending", tone: "orange", href: "/assignments" },
          { title: "DSA Practice Set - 5", detail: "Due: 10 Jun 2026", status: "Pending", tone: "orange", href: "/assignments" },
        ],
      },
    ],
    events: {
      title: "Upcoming Events",
      href: "/calendar",
      linkLabel: "View calendar",
      items: [
        { day: "05", month: "Jun", title: "Parent Meeting", time: "10:00 AM - 12:00 PM", status: "Meeting", tone: "blue", href: "/calendar" },
        { day: "10", month: "Jun", title: "Monthly Test - DBMS", time: "09:30 AM - 11:30 AM", status: "Exam", tone: "green", href: "/exams" },
        { day: "15", month: "Jun", title: "Project Submission", time: "11:59 PM", status: "Submission", tone: "orange", href: "/assignments" },
      ],
    },
    footerPanel: {
      title: "My Child's Progress",
      studentName: "Neha Patel",
      detail: "Data Science • Batch: DS-2026-01",
      href: "/students",
      stats: [
        { label: "Classes Conducted", value: "32" },
        { label: "Classes Attended", value: "30" },
        { label: "Assignments Submitted", value: "18/20" },
        { label: "Tests Appeared", value: "6/7" },
        { label: "Average Score", value: "85.6%" },
      ],
      remarkTitle: "Teacher's Remark",
      remark: "Neha is a keen learner and actively participates in class discussions. She is doing excellent in academics. Keep up the good work!",
    },
  },
  hr: {
    role: "hr",
    title: "HR Dashboard",
    portalLabel: "HR",
    roleLabel: "HR",
    userName: "HR Admin",
    userSubtitle: "People operations",
    avatar: "HR",
    notificationCount: 4,
    welcome: "Employee, payroll, leave, and staffing data are scoped to HR.",
    dateLabel: "03 June 2026, Tuesday",
    modules: hrSidebar,
    metrics: [
      { key: "employees", label: "Employees", value: "0", helper: "HR employee records", href: "/hr", icon: "staff", tone: "green" },
      { key: "payroll", label: "Payroll", value: "Rs 0", helper: "Payroll in HR scope", href: "/hr", icon: "payroll", tone: "orange" },
      { key: "leave", label: "Pending Leave", value: "0", helper: "Leave requests awaiting action", href: "/hr", icon: "calendar", tone: "blue" },
      { key: "training", label: "Training", value: "0", helper: "Published training courses", href: "/lms", icon: "lms", tone: "purple" },
    ],
    donutCards: [],
    lineCards: [],
    funnels: [],
    progressCards: [],
    keyModules: [
      { label: "Employees", href: "/hr", icon: "staff" },
      { label: "Payroll", href: "/hr", icon: "payroll" },
      { label: "Reports", href: "/reports", icon: "reports" },
      { label: "Settings", href: "/settings/profile", icon: "settings" },
    ],
    lists: [
      {
        key: "hr-activity",
        title: "HR Activity",
        href: "/hr",
        linkLabel: "View HR",
        items: [
          { title: "Leave queue scoped to HR", detail: "Only HR modules are visible here", meta: "Live", href: "/hr", tone: "blue" },
          { title: "Employee data isolated", detail: "Branch/student dashboards are not reused", meta: "Live", href: "/reports", tone: "green" },
        ],
      },
    ],
    summaryStats: [
      { label: "Scope", value: "HR" },
      { label: "Route", value: "HR" },
      { label: "Access", value: "HR" },
    ],
  },
  finance: {
    role: "finance",
    title: "Finance Dashboard",
    portalLabel: "Finance",
    roleLabel: "Finance",
    userName: "Finance Admin",
    userSubtitle: "Fee and payment operations",
    avatar: "FN",
    notificationCount: 7,
    welcome: "Fees, invoices, payments, salary, and finance reports are isolated here.",
    dateLabel: "03 June 2026, Tuesday",
    modules: financeSidebar,
    metrics: [
      { key: "fees", label: "Collected Fees", value: "Rs 0", helper: "Payments in finance scope", href: "/finance", icon: "wallet", tone: "green" },
      { key: "outstanding", label: "Outstanding", value: "Rs 0", helper: "Pending invoice balance", href: "/finance", icon: "fees", tone: "red" },
      { key: "invoices", label: "Invoices", value: "0", helper: "Invoice records in scope", href: "/finance", icon: "reports", tone: "blue" },
      { key: "overdue", label: "Overdue", value: "0", helper: "Overdue invoices", href: "/finance", icon: "calendar", tone: "orange" },
    ],
    donutCards: [],
    lineCards: [],
    funnels: [],
    progressCards: [],
    keyModules: [
      { label: "Fees", href: "/finance", icon: "fees" },
      { label: "Invoices", href: "/finance", icon: "wallet" },
      { label: "Payments", href: "/finance", icon: "wallet" },
      { label: "Reports", href: "/reports", icon: "reports" },
    ],
    lists: [
      {
        key: "finance-activity",
        title: "Finance Activity",
        href: "/finance",
        linkLabel: "View finance",
        items: [
          { title: "Finance route protected", detail: "Only Finance users can open this dashboard", meta: "Live", href: "/finance", tone: "green" },
          { title: "Payment data scoped", detail: "Branch and student records are filtered by backend role", meta: "Live", href: "/reports", tone: "blue" },
        ],
      },
    ],
    summaryStats: [
      { label: "Scope", value: "Fees" },
      { label: "Route", value: "FN" },
      { label: "Access", value: "Finance" },
    ],
  },
  franchise_owner: {
    role: "franchise_owner",
    title: "Franchise Owner Dashboard",
    portalLabel: "Franchise Owner",
    roleLabel: "Franchise Owner",
    userName: "Franchise Owner",
    userSubtitle: "Assigned franchise network",
    avatar: "FO",
    notificationCount: 3,
    welcome: "Franchise, branch, and franchise reports are isolated from admin dashboards.",
    dateLabel: "03 June 2026, Tuesday",
    modules: franchiseOwnerSidebar,
    metrics: [
      { key: "branches", label: "Branches", value: "0", helper: "Assigned franchise branches", href: "/branches", icon: "branches", tone: "green" },
      { key: "students", label: "Students", value: "0", helper: "Students in franchise scope", href: "/students", icon: "students", tone: "blue" },
      { key: "fees", label: "Revenue", value: "Rs 0", helper: "Collected payments in scope", href: "/finance", icon: "wallet", tone: "orange" },
      { key: "reports", label: "Reports", value: "Live", helper: "Franchise reports only", href: "/reports", icon: "reports", tone: "purple" },
    ],
    donutCards: [],
    lineCards: [],
    funnels: [],
    progressCards: [],
    keyModules: [
      { label: "Franchise", href: "/franchise", icon: "franchise" },
      { label: "Branches", href: "/branches", icon: "branches" },
      { label: "Reports", href: "/reports", icon: "reports" },
    ],
    lists: [
      {
        key: "franchise-activity",
        title: "Franchise Activity",
        href: "/franchise",
        linkLabel: "View franchise",
        items: [
          { title: "Franchise route protected", detail: "The route is /franchise-owner/dashboard", meta: "Live", href: "/franchise", tone: "green" },
          { title: "Branch network scoped", detail: "Only assigned franchise data is requested", meta: "Live", href: "/reports", tone: "blue" },
        ],
      },
    ],
    summaryStats: [
      { label: "Scope", value: "Franchise" },
      { label: "Route", value: "FO" },
      { label: "Access", value: "Owner" },
    ],
  },
  company_hr: {
    role: "company_hr",
    title: "Company HR Dashboard",
    portalLabel: "Company HR",
    roleLabel: "Company HR",
    userName: "Company HR",
    userSubtitle: "Placement operations",
    avatar: "CH",
    notificationCount: 2,
    welcome: "Placement and company hiring workflows are isolated here.",
    dateLabel: "03 June 2026, Tuesday",
    modules: companyHrSidebar,
    metrics: [
      { key: "placement", label: "Placement Pipeline", value: "0", helper: "Eligible student records", href: "/placement", icon: "placement", tone: "green" },
      { key: "students", label: "Students", value: "0", helper: "Students visible to Company HR", href: "/students", icon: "students", tone: "blue" },
      { key: "reports", label: "Reports", value: "Live", helper: "Placement reporting only", href: "/reports", icon: "reports", tone: "purple" },
      { key: "messages", label: "Messages", value: "0", helper: "Placement communication", href: "/messages", icon: "messages", tone: "orange" },
    ],
    donutCards: [],
    lineCards: [],
    funnels: [],
    progressCards: [],
    keyModules: [
      { label: "Placement", href: "/placement", icon: "placement" },
      { label: "Students", href: "/students", icon: "students" },
      { label: "Reports", href: "/reports", icon: "reports" },
    ],
    lists: [
      {
        key: "company-hr-activity",
        title: "Placement Activity",
        href: "/placement",
        linkLabel: "View placement",
        items: [
          { title: "Company HR route protected", detail: "Only Company HR users can open this dashboard", meta: "Live", href: "/placement", tone: "green" },
          { title: "Placement data scoped", detail: "Admin and finance modules are hidden", meta: "Live", href: "/reports", tone: "blue" },
        ],
      },
    ],
    summaryStats: [
      { label: "Scope", value: "Placement" },
      { label: "Route", value: "CH" },
      { label: "Access", value: "Company" },
    ],
  },
}

export function getRoleDashboardMock(role: RoleDashboardKey) {
  return roleDashboardMocks[role]
}

export const dashboardColors = { green, navy, blue, purple, orange, red, grey }
