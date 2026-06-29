"use client"

import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  Library,
  Menu,
  MessageSquare,
  Network,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  TestTube2,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react"
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { apiRequest, getStoredSessionValue } from "@/app/shared/api"
import { getRoleDashboardPath, getStoredSession, type UserProfile, type UserRole } from "@/app/shared/auth"
import { ProfileAvatarDropdown } from "@/components/profile/ProfileAvatarDropdown"
import {
  dashboardColors,
  getRoleDashboardMock,
  type CommunicationStat,
  type DashboardIconKey,
  type DashboardMetric,
  type DonutDatum,
  type EventItem,
  type FunnelDatum,
  type LineDatum,
  type MetricTone,
  type ProgressDatum,
  type QuickAction,
  type RecentItem,
  type RoleDashboardKey,
  type RoleDashboardMock,
  type SidebarModule,
  type SummaryStat,
  type TaskItem,
} from "@/components/role-dashboard-data"

type ApiMetric = {
  key: string
  label: string
  value: string
  helper: string
  module: string
}

type ApiDashboardData = {
  role: UserRole | "super_admin"
  title: string
  scope: string
  metrics: ApiMetric[]
  modules: Array<{ key: string; label: string; href: string; enabled: boolean }>
  recent_activity: Array<{ title: string; detail: string; time?: string; module: string }>
  notifications: Array<{ title: string; message: string; tone: "success" | "info" | "warning" }>
  attendance: { rate: number; present: number; total: number; series: Array<{ label: string; rate: number }> }
  fees: { collected: number; pending: number; overdue: number }
  courses: { total_courses: number; published_courses: number; enrollments: number }
  lead_stats?: {
    total: number
    new: number
    contacted: number
    qualified: number
    proposal_sent: number
    converted_admissions: number
    conversion_rate: number
    follow_ups_today: number
  }
  lead_status_overview?: DonutDatum[]
  lead_pipeline?: FunnelDatum[]
  tasks: Array<{ title: string; status: string; module: string }>
  calendar: Array<{ title: string; date: string; module: string }>
  reports: Array<{ title: string; value: string; module: string }>
  permissions: { allowed_modules: string[]; denied_modules: string[] }
  updated_at: string
}

type RoleSession = {
  accessToken: string
  user: UserProfile
}

type AccountPanelMode = "profile" | "settings" | null

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

const iconByKey: Record<DashboardIconKey, LucideIcon> = {
  academics: GraduationCap,
  admissions: FileText,
  assignments: ClipboardList,
  attendance: CalendarDays,
  batches: Users,
  branches: Network,
  calendar: CalendarDays,
  communication: MessageSquare,
  dashboard: Home,
  exams: TestTube2,
  fees: CreditCard,
  franchise: Network,
  library: Library,
  lms: BookOpen,
  messages: MessageSquare,
  notices: Bell,
  payroll: WalletCards,
  placement: GraduationCap,
  profile: UserRound,
  reports: BarChart3,
  security: ShieldCheck,
  settings: Settings,
  staff: Users,
  students: Users,
  tasks: CheckSquare,
  tests: TestTube2,
  users: Users,
  wallet: WalletCards,
}

const toneStyles: Record<MetricTone, { text: string; bg: string; border: string; chip: string }> = {
  green: { text: "#0B7A5A", bg: "#E8F6F0", border: "#CFE8DF", chip: "#E0F3E9" },
  blue: { text: "#2563EB", bg: "#EAF1FF", border: "#D7E4FF", chip: "#E8F0FF" },
  purple: { text: "#7C3AED", bg: "#F3EAFE", border: "#E8D8FB", chip: "#F1E8FF" },
  orange: { text: "#F97316", bg: "#FFF3E8", border: "#FEDFC2", chip: "#FFF0DC" },
  red: { text: "#EF4444", bg: "#FFF0F0", border: "#FBD1D1", chip: "#FFE8E8" },
}

const branchLoginOptions = [
  { id: "kochi", label: "Pinesphere Kochi" },
  { id: "madurai", label: "Pinesphere Madurai" },
  { id: "chennai", label: "Pinesphere Chennai" },
  { id: "coimbatore", label: "Pinesphere Coimbatore" },
]

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
}

function isRoleDashboardKey(role: UserRole | "super_admin"): role is RoleDashboardKey {
  return (
    role === "super_admin"
    || role === "branch_admin"
    || role === "counsellor"
    || role === "trainer"
    || role === "parent"
    || role === "hr"
    || role === "finance"
    || role === "franchise_owner"
    || role === "company_hr"
  )
}

function assertRoleAccess(expectedRole: UserRole | "super_admin", userRole: UserRole) {
  return userRole === expectedRole
}

function roleFromEndpoint(endpoint: string): RoleDashboardKey {
  if (endpoint.includes("counsellor")) return "counsellor"
  if (endpoint.includes("trainer")) return "trainer"
  if (endpoint.includes("parent")) return "parent"
  return "branch_admin"
}

function parseLegacyProfile(): UserProfile | null {
  const raw = getStoredSessionValue("pinesphere_profile")
  if (!raw) return null
  try {
    const profile = JSON.parse(raw) as Partial<UserProfile>
    if (!profile.role || !profile.full_name) return null
    return {
      id: profile.id ?? "",
      email: profile.email ?? "",
      full_name: profile.full_name,
      role: profile.role,
      role_abbreviation: profile.role_abbreviation ?? "",
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

function readRoleSession(): RoleSession | null {
  const session = getStoredSession()
  if (session) return { accessToken: session.accessToken, user: session.user }
  const accessToken = getStoredSessionValue("pinesphere_access_token")
  const profile = parseLegacyProfile()
  if (!accessToken || !profile) return null
  return { accessToken, user: profile }
}

function mergeWithApi(base: RoleDashboardMock, api?: ApiDashboardData | null): RoleDashboardMock {
  if (!api) return base

  const metricByKey = new Map(api.metrics.map((metric) => [metric.key, metric]))
  const metrics = base.metrics.map((metric) => {
    if (metric.key === "students") {
      const live = metricByKey.get("students")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "leads") {
      const live = metricByKey.get("leads")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "new-leads") {
      if (typeof api.lead_stats?.new === "number") {
        return { ...metric, value: String(api.lead_stats.new), helper: "Leads with status NEW" }
      }
      const live = metricByKey.get("new-leads")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "admissions") {
      if (typeof api.lead_stats?.converted_admissions === "number") {
        return { ...metric, value: String(api.lead_stats.converted_admissions), helper: "Converted admissions in the current month" }
      }
      const live = metricByKey.get("admissions")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "follow-ups") {
      if (typeof api.lead_stats?.follow_ups_today === "number") {
        return { ...metric, value: String(api.lead_stats.follow_ups_today), helper: "Leads scheduled for today" }
      }
      const live = metricByKey.get("follow-ups")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "conversion") {
      if (typeof api.lead_stats?.conversion_rate === "number") {
        return { ...metric, value: `${api.lead_stats.conversion_rate}%`, helper: `${api.lead_stats.converted_admissions} converted admissions` }
      }
      const live = metricByKey.get("conversion")
      return live ? { ...metric, value: live.value, helper: live.helper } : metric
    }
    if (metric.key === "attendance") {
      const value = api.attendance ? `${api.attendance.rate.toFixed(1)}%` : metric.value
      const helper = api.attendance?.total ? `${api.attendance.present} present / ${api.attendance.total} marked` : metric.helper
      return { ...metric, value, helper }
    }
    if (metric.key === "fees" || metric.key === "paid") {
      return api.fees ? { ...metric, value: formatMoney(api.fees.collected), helper: metric.helper } : metric
    }
    if (metric.key === "outstanding") {
      return api.fees ? { ...metric, value: formatMoney(api.fees.pending), helper: api.fees.overdue ? `${api.fees.overdue} overdue invoice(s)` : metric.helper } : metric
    }
    if (metric.key === "batches") {
      return api.courses ? { ...metric, value: String(api.courses.total_courses || metric.value), helper: `${api.courses.published_courses} published courses` } : metric
    }
    const live = metricByKey.get(metric.key)
    if (live) {
      return { ...metric, value: live.value, helper: live.helper }
    }
    return metric
  })

  const apiActivity: RecentItem[] = api.recent_activity.slice(0, 5).map((item) => ({
    title: item.title,
    detail: item.detail,
    meta: item.time ? new Date(item.time).toLocaleDateString("en-IN") : item.module,
    href: "/reports",
    tone: "green",
  }))

  const lists = base.lists.map((list) => {
    if (list.key === "notifications" && api.notifications.length) {
      return {
        ...list,
        items: api.notifications.map((item) => ({
          title: item.title,
          detail: item.message,
          meta: "Live",
          href: "/communication",
          tone: (item.tone === "warning" ? "orange" : item.tone === "success" ? "green" : "blue") as MetricTone,
        })),
      }
    }
    if ((list.key === "recent-admissions" || list.key === "recent-leads") && apiActivity.length) {
      return { ...list, items: apiActivity }
    }
    return list
  })

  const donutCards = base.donutCards.map((card) => {
    if (card.key !== "lead-status" || !api.lead_status_overview?.length) return card
    return {
      ...card,
      centerValue: api.lead_stats ? String(api.lead_stats.total) : card.centerValue,
      data: api.lead_status_overview,
    }
  })

  const funnels = base.funnels.map((funnel) => {
    if (funnel.key !== "lead-pipeline" || !api.lead_pipeline?.length) return funnel
    return {
      ...funnel,
      data: api.lead_pipeline,
    }
  })

  return {
    ...base,
    metrics,
    donutCards,
    funnels,
    lists,
    dateLabel: api.updated_at
      ? new Date(api.updated_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", weekday: "long" })
      : base.dateLabel,
  }
}

export function RoleDashboardPage({ expectedRole, endpoint }: { expectedRole: UserRole | "super_admin"; endpoint: string }) {
  const roleKey = isRoleDashboardKey(expectedRole) ? expectedRole : roleFromEndpoint(endpoint)
  const [apiDashboard, setApiDashboard] = useState<ApiDashboardData | null>(null)
  const [error, setError] = useState("")
  const [session] = useState<RoleSession | null>(() => readRoleSession())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    if (!session) {
      window.location.href = "/login"
      return
    }
    if (!assertRoleAccess(expectedRole, session.user.role)) {
      window.location.href = getRoleDashboardPath(session.user.role)
      return
    }

    apiRequest<ApiDashboardData>(endpoint, session.accessToken)
      .then(setApiDashboard)
      .catch((err: Error) => {
        setError(err.message)
        setApiDashboard(null)
      })
  }, [endpoint, expectedRole, session, isMounted])

  const dashboard = useMemo(() => mergeWithApi(getRoleDashboardMock(roleKey), apiDashboard), [apiDashboard, roleKey])

  if (!isMounted || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black text-[#071B4A] shadow">
          Loading role dashboard...
        </div>
      </main>
    )
  }

  return (
    <RoleDashboardLayout dashboard={dashboard} user={session.user} apiWarning={error}>
      <RoleDashboardContent dashboard={dashboard} />
    </RoleDashboardLayout>
  )
}

export function RoleDashboardLayout({
  dashboard,
  user,
  apiWarning,
  children,
  showWelcome = true,
}: {
  dashboard: RoleDashboardMock
  user: UserProfile
  apiWarning?: string
  children: ReactNode
  showWelcome?: boolean
}) {
  const displayName = user.full_name || dashboard.userName
  const [accountPanel, setAccountPanel] = useState<AccountPanelMode>(null)
  const [darkMode, setDarkMode] = useState(false)
  const isCounsellor = dashboard.role === "counsellor"

  useEffect(() => {
    function handleOpenAccountPanel(event: Event) {
      const detail = (event as CustomEvent<{ mode?: "profile" | "settings" }>).detail
      setAccountPanel(detail?.mode === "profile" ? "profile" : "settings")
    }

    window.addEventListener("pinesphere:open-account-panel", handleOpenAccountPanel)
    return () => window.removeEventListener("pinesphere:open-account-panel", handleOpenAccountPanel)
  }, [])

  useEffect(() => {
    if (!isCounsellor) return
    const savedTheme = window.localStorage.getItem("pinesphere_counsellor_theme")
    setDarkMode(savedTheme === "dark")
  }, [isCounsellor])

  useEffect(() => {
    if (!isCounsellor) return
    window.localStorage.setItem("pinesphere_counsellor_theme", darkMode ? "dark" : "light")
  }, [darkMode, isCounsellor])

  function toggleDarkMode() {
    if (!isCounsellor) return
    setDarkMode((value) => !value)
  }

  return (
    <main className={darkMode ? "min-h-screen bg-slate-950 text-slate-100" : "min-h-screen bg-[#F8FAF8] text-[#071B4A]"}>
      <div className="grid min-h-screen lg:grid-cols-[292px_minmax(0,1fr)]">
        <RoleSidebar dashboard={dashboard} userName={displayName} darkMode={darkMode} />
        <section className="min-w-0">
          <RoleTopbar dashboard={dashboard} user={user} userName={displayName} darkMode={darkMode} onToggleDarkMode={toggleDarkMode} />
          <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">
            {showWelcome ? (
              <section className={cx("mb-5 flex flex-wrap items-start justify-between gap-4 rounded-[22px] border px-4 py-4 shadow-sm", darkMode ? "border-slate-800 bg-slate-900" : "border-transparent bg-transparent shadow-none")}>
                <div>
                  <h2 className={cx("text-2xl font-black tracking-normal sm:text-3xl", darkMode ? "text-white" : "text-[#020617]")}>Welcome back, {displayName}!</h2>
                  <p className={cx("mt-1.5 text-sm font-semibold", darkMode ? "text-slate-300" : "text-[#475569]")}>{dashboard.welcome}</p>
                </div>
                <div className={cx("inline-flex h-12 items-center gap-2 rounded-lg border px-4 text-sm font-black shadow-sm", darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-[#DDE9E4] bg-white text-[#0F172A]")}>
                  <CalendarDays size={17} className="text-[#0B7A5A]" />
                  {dashboard.dateLabel}
                </div>
              </section>
            ) : null}
            {apiWarning ? (
              <div className={cx("mb-4 rounded-lg border px-4 py-3 text-xs font-bold", darkMode ? "border-amber-900 bg-amber-950/40 text-amber-200" : "border-[#FED7AA] bg-[#FFF7ED] text-[#9A3412]")}>
                Live dashboard data is unavailable, so structured role data is being shown: {apiWarning}
              </div>
            ) : null}
            {accountPanel ? (
              <InlineAccountPage mode={accountPanel} user={user} dashboard={dashboard} onClose={() => setAccountPanel(null)} />
            ) : children}
          </div>
        </section>
      </div>
    </main>
  )
}

function InlineAccountPage({ mode, user, dashboard, onClose }: { mode: Exclude<AccountPanelMode, null>; user: UserProfile; dashboard: RoleDashboardMock; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">(mode === "settings" ? "preferences" : "profile")
  const displayName = user.full_name || dashboard.userName
  const username = user.email?.split("@")[0] || displayName.toLowerCase().replace(/\s+/g, ".")

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#DDE9E4] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B7A5A]">Account Settings</p>
            <h2 className="mt-2 text-2xl font-black text-[#020617]">Settings</h2>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => setActiveTab("profile")} className={`inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-black ${activeTab === "profile" ? "bg-[#0B7A5A] text-white shadow-sm" : "bg-[#F7FBF4] text-[#1F2B18]"}`}><UserRound size={16} /> Profile</button>
              <button onClick={() => setActiveTab("preferences")} className={`inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-black ${activeTab === "preferences" ? "bg-[#0B7A5A] text-white shadow-sm" : "bg-[#F7FBF4] text-[#1F2B18]"}`}><Settings size={16} /> Preferences</button>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[#DDE9E4] bg-white px-4 py-2 text-sm font-black text-[#0F172A] shadow-sm">Back</button>
        </div>
      </section>

      {activeTab === "profile" ? (
        <div className="grid gap-5">
          <AccountSection title="Personal Details">
            <AccountField label="Student/User Name" value={displayName} />
            <AccountField label="Username" value={username} />
            <AccountField label="Email" value={user.email || ""} />
            <AccountField label="Role" value={dashboard.roleLabel} />
          </AccountSection>
          <AccountSection title="Contact Details">
            <AccountField label="Mobile Number" value={user.phone || ""} />
            <AccountField label="Branch" value={dashboard.userSubtitle || user.branch_id || ""} />
            <AccountField label="City" value="" />
            <AccountField label="State" value="" />
          </AccountSection>
        </div>
      ) : (
        <div className="grid gap-5">
          <AccountSection title="Timezone">
            <label className="grid gap-2 text-xs font-black uppercase text-[#415038] md:col-span-1">Timezone<select className="h-11 rounded-lg border border-[#BFE4D5] bg-white px-3 text-sm font-bold normal-case outline-none"><option>Asia/Kolkata</option></select></label>
            <label className="flex h-11 items-center gap-3 self-end rounded-lg border border-[#E2EEDC] bg-[#FBFDF9] px-3 text-sm font-bold"><input type="checkbox" /> Set timezone automatically</label>
          </AccountSection>
          <AccountSection title="Notification Settings">
            {["Session reminder 1 hour before", "Session reminder 1 day before", "Session start notification", "Promotional campaigns"].map((item, index) => <AccountToggle key={item} label={item} enabled={index !== 3} />)}
          </AccountSection>
          <AccountSection title="Notification Channels">
            {["WhatsApp", "Email", "SMS", "Push"].map((item, index) => <AccountToggle key={item} label={item} enabled={index !== 2} />)}
            <div className="md:col-span-2 flex justify-end"><button className="rounded-lg bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Save Preferences</button></div>
          </AccountSection>
        </div>
      )}
    </div>
  )
}

function AccountSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[#DDE9E4] bg-white p-5 shadow-sm"><h3 className="mb-4 text-lg font-black text-[#020617]">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></section>
}

function AccountField({ label, value }: { label: string; value: string }) {
  return <label className="grid gap-2 text-xs font-black uppercase text-[#415038]">{label}<input value={value} readOnly className="h-11 rounded-lg border border-[#BFE4D5] bg-[#FBFDF9] px-3 text-sm font-bold normal-case outline-none" /></label>
}

function AccountToggle({ label, enabled }: { label: string; enabled: boolean }) {
  return <div className="flex min-h-[52px] items-center justify-between rounded-lg border border-[#E2EEDC] bg-[#FBFDF9] px-3 py-3 text-sm font-bold"><span>{label}</span><span className={`h-7 w-12 rounded-full p-1 ${enabled ? "bg-[#0B7A5A]" : "bg-[#C8D4C1]"}`}><span className={`block h-5 w-5 rounded-full bg-white transition ${enabled ? "translate-x-5" : ""}`} /></span></div>
}

export function RoleLayout({
  expectedRole,
  endpoint,
  children,
  showWelcome = false,
}: {
  expectedRole: UserRole | "super_admin"
  endpoint: string
  children: ReactNode
  showWelcome?: boolean
}) {
  const roleKey = isRoleDashboardKey(expectedRole) ? expectedRole : roleFromEndpoint(endpoint)
  const [apiDashboard, setApiDashboard] = useState<ApiDashboardData | null>(null)
  const [error, setError] = useState("")
  const [session] = useState<RoleSession | null>(() => readRoleSession())
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return;
    if (!session) {
      window.location.href = "/login"
      return
    }
    if (!assertRoleAccess(expectedRole, session.user.role)) {
      window.location.href = getRoleDashboardPath(session.user.role)
      return
    }

    apiRequest<ApiDashboardData>(endpoint, session.accessToken)
      .then(setApiDashboard)
      .catch((err: Error) => {
        setError(err.message)
        setApiDashboard(null)
      })
  }, [endpoint, expectedRole, session, isMounted])

  const dashboard = useMemo(() => mergeWithApi(getRoleDashboardMock(roleKey), apiDashboard), [apiDashboard, roleKey])

  if (!isMounted || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black text-[#071B4A] shadow">
          Loading dashboard...
        </div>
      </main>
    )
  }

  return (
    <RoleDashboardLayout dashboard={dashboard} user={session.user} apiWarning={error} showWelcome={showWelcome}>
      {children}
    </RoleDashboardLayout>
  )
}

export function RoleSidebar({ dashboard, userName, darkMode = false }: { dashboard: RoleDashboardMock; userName: string; darkMode?: boolean }) {
  const pathname = usePathname()
  const visibleModules = useMemo(() => {
    if (dashboard.role === "counsellor") {
      return dashboard.modules.filter((module) => module.key !== "tasks")
    }
    if (dashboard.role === "super_admin") {
      return dashboard.modules.filter((module) => module.key !== "placement")
    }
    return dashboard.modules
  }, [dashboard.modules, dashboard.role])
  const initiallyOpen = useMemo(() => {
    return visibleModules
      .filter((module) => module.children?.some((child) => pathname === child.href || pathname?.startsWith(child.href)))
      .map((module) => module.key)
  }, [visibleModules, pathname])
  const [openGroups, setOpenGroups] = useState<string[]>(initiallyOpen)

  useEffect(() => {
    void Promise.resolve().then(() => {
      setOpenGroups((current) => Array.from(new Set([...current, ...initiallyOpen])))
    })
  }, [initiallyOpen])

  function toggleGroup(key: string) {
    setOpenGroups((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])
  }

  return (
    <aside className={darkMode ? "bg-[linear-gradient(165deg,#020617_0%,#0F172A_48%,#111827_100%)] text-white" : "bg-[linear-gradient(165deg,#063D36_0%,#004235_48%,#002F2D_100%)] text-white"}>
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <Link href="/" className="flex items-center gap-3 px-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-[#0B7A5A]">P</span>
          <div className="min-w-0">
            <span className="block truncate text-xl font-black leading-tight">Pinesphere ERP</span>
            <span className="text-xs font-semibold text-white/75">{dashboard.portalLabel}</span>
          </div>
        </Link>
        <div className="mt-7 flex items-center gap-3 rounded-lg bg-white/10 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
          <Avatar label={dashboard.avatar} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{userName}</p>
            <p className="text-xs font-semibold text-white/75">{dashboard.roleLabel}</p>
            <p className="truncate text-xs font-semibold text-white/75">{dashboard.userSubtitle}</p>
          </div>
          <ChevronDown size={15} className="ml-auto text-white/75" />
        </div>
        <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
          {visibleModules.map((module) => {
            const childActive = module.children?.some((child) => pathname === child.href || (child.href !== "/" && pathname?.startsWith(child.href))) ?? false
            const active = pathname === module.href || (module.href !== "/" && pathname?.startsWith(module.href)) || childActive
            return (
              <SidebarLink
                key={module.key}
                module={module}
                active={active}
                childActive={childActive}
                pathname={pathname}
                open={openGroups.includes(module.key) || childActive}
                onToggle={() => toggleGroup(module.key)}
              />
            )
          })}
        </nav>
        <div className="mt-5 text-xs font-semibold text-white/70">© 2026 Pinesphere ERP</div>
      </div>
    </aside>
  )
}

function SidebarLink({
  module,
  active,
  childActive = false,
  pathname,
  open = false,
  onToggle,
}: {
  module: SidebarModule
  active: boolean
  childActive?: boolean
  pathname: string | null
  open?: boolean
  onToggle?: () => void
}) {
  const Icon = iconByKey[module.icon] ?? LayoutDashboard
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (module.key !== "settings") return
    event.preventDefault()
    window.dispatchEvent(new CustomEvent("pinesphere:open-account-panel", { detail: { mode: "settings" } }))
  }

  return (
    <div>
      <div className="flex items-stretch">
        <Link
          href={module.href}
          onClick={handleClick}
          className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${module.children?.length ? "rounded-r-none pr-2" : ""} ${
            active ? "bg-[#0B7A5A] text-white shadow-[0_8px_20px_rgba(0,0,0,0.14)]" : "text-white/90 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon size={17} />
          <span className="truncate">{module.label}</span>
          {module.badge ? <span className="ml-auto rounded-full bg-[#EF4444] px-1.5 py-0.5 text-[10px] font-black text-white">{module.badge}</span> : null}
        </Link>
        {module.children?.length ? (
          <button
            type="button"
            onClick={onToggle}
            className={`flex w-11 items-center justify-center rounded-r-lg transition ${
              active ? "bg-[#0B7A5A] text-white shadow-[0_8px_20px_rgba(0,0,0,0.14)]" : "text-white/90 hover:bg-white/10 hover:text-white"
            }`}
            aria-label={`${open ? "Collapse" : "Expand"} ${module.label}`}
            aria-expanded={open}
          >
            <ChevronDown size={15} className={`transition-transform ${open ? "rotate-180" : ""}`} />
          </button>
        ) : null}
      </div>
      {module.children?.length && open ? (
        <div className="ml-5 mt-1 space-y-1 border-l border-white/18 pl-3">
          {module.children.map((child) => {
            const ChildIcon = iconByKey[child.icon] ?? LayoutDashboard
            const childIsActive = pathname === child.href || (child.href !== "/" && pathname?.startsWith(child.href))
            return (
              <Link
                key={child.key}
                href={child.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                  childIsActive || (!childActive && pathname === child.href)
                    ? "bg-white/15 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <ChildIcon size={15} />
                </span>
                <span className="truncate">{child.label}</span>
              </Link>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export function RoleTopbar({ dashboard, user, userName, darkMode = false, onToggleDarkMode }: { dashboard: RoleDashboardMock; user: UserProfile; userName: string; darkMode?: boolean; onToggleDarkMode?: () => void }) {
  const showBranchSwitcher = dashboard.role === "counsellor"
  const userBranch = branchLoginOptions.find((branch) => branch.id === user.branch_id)
  const [selectedBranch, setSelectedBranch] = useState(userBranch?.label ?? dashboard.userSubtitle ?? "Pinesphere Kochi")
  const [branchOpen, setBranchOpen] = useState(false)

  useEffect(() => {
    if (!showBranchSwitcher) return
    const savedBranch = window.localStorage.getItem("pinesphere_selected_branch")
    if (savedBranch) setSelectedBranch(savedBranch)
  }, [showBranchSwitcher])

  function chooseBranch(label: string) {
    setSelectedBranch(label)
    setBranchOpen(false)
    window.localStorage.setItem("pinesphere_selected_branch", label)
  }

  return (
    <header className={cx("sticky top-0 z-40 border-b px-4 py-3 backdrop-blur sm:px-6 lg:px-8", darkMode ? "border-slate-800 bg-slate-950/95 text-slate-100" : "border-[#E2E8F0] bg-white/95")}>
      <div className="flex min-h-12 flex-wrap items-center gap-4">
        <Menu size={22} className={darkMode ? "text-slate-100" : "text-[#071B4A]"} />
        <h1 className={cx("text-base font-black sm:text-lg", darkMode ? "text-slate-100" : "text-[#0F172A]")}>{dashboard.title}</h1>
        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {dashboard.role === "counsellor" && onToggleDarkMode ? (
            <button type="button" onClick={onToggleDarkMode} className={cx("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-[#DDE9E4] bg-white text-[#071B4A]")}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light" : "Dark"}
            </button>
          ) : null}
          {showBranchSwitcher ? <div className="relative hidden md:block">
            <button type="button" onClick={() => setBranchOpen((value) => !value)} className={cx("flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-black shadow-sm", darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-[#DDE9E4] bg-white text-[#0F172A]")}>
              <Home size={17} />
              {selectedBranch}
              <ChevronDown size={15} />
            </button>
            {branchOpen ? (
              <div className={cx("absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-lg border py-1 shadow-xl", darkMode ? "border-slate-700 bg-slate-900" : "border-[#DDE9E4] bg-white")}>
                {branchLoginOptions.map((branch) => (
                  <button
                    key={branch.id}
                    type="button"
                    onClick={() => chooseBranch(branch.label)}
                    className={`block w-full px-4 py-2 text-left text-sm font-bold transition ${selectedBranch === branch.label ? "bg-[#0B7A5A] text-white" : darkMode ? "text-slate-200 hover:bg-slate-800 hover:text-white" : "text-[#334155] hover:bg-[#E9F8F1] hover:text-[#0B7A5A]"}`}
                  >
                    {branch.label.replace("Pinesphere ", "")}
                  </button>
                ))}
              </div>
            ) : null}
          </div> : null}
          <button type="button" aria-label="Notifications" className={cx("relative flex h-10 w-10 items-center justify-center rounded-full border", darkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-[#E2E8F0] bg-white text-[#071B4A]")}>
            <Bell size={18} />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white">
              {dashboard.notificationCount}
            </span>
          </button>
          <div className="flex items-center gap-3">
            <ProfileAvatarDropdown user={user} compact />
            <div className="hidden sm:block">
              <p className={cx("text-sm font-black leading-tight", darkMode ? "text-slate-100" : "text-[#0F172A]")}>{userName}</p>
              <p className={cx("text-xs font-semibold", darkMode ? "text-slate-300" : "text-[#64748B]")}>{dashboard.roleLabel}</p>
            </div>
            <ChevronDown size={15} className={cx("hidden sm:block", darkMode ? "text-slate-300" : "text-[#64748B]")} />
          </div>
        </div>
      </div>
    </header>
  )
}

function RoleDashboardContent({ dashboard }: { dashboard: RoleDashboardMock }) {
  if (dashboard.role === "branch_admin") return <BranchAdminDashboard dashboard={dashboard} />
  if (dashboard.role === "counsellor") return <CounsellorDashboard dashboard={dashboard} />
  if (dashboard.role === "trainer") return <TrainerDashboard dashboard={dashboard} />
  if (dashboard.role === "parent") return <ParentDashboard dashboard={dashboard} />
  return <GenericRoleDashboard dashboard={dashboard} />
}

function GenericRoleDashboard({ dashboard }: { dashboard: RoleDashboardMock }) {
  return (
    <div className="space-y-4">
      <MetricGrid metrics={dashboard.metrics} />
      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <QuickActionGrid title="Role Modules" actions={dashboard.keyModules ?? []} columns="grid-cols-2" />
        <RecentListCard title={dashboard.lists[0]?.title ?? "Role Activity"} items={dashboard.lists[0]?.items ?? []} href={dashboard.lists[0]?.href ?? "/reports"} linkLabel={dashboard.lists[0]?.linkLabel} />
      </section>
      {dashboard.summaryStats?.length ? <SummaryStatsCard title="Role Scope" stats={dashboard.summaryStats} /> : null}
    </div>
  )
}

function BranchAdminDashboard({ dashboard }: { dashboard: RoleDashboardMock }) {
  return (
    <div className="space-y-4">
      <MetricGrid metrics={dashboard.metrics} />
      <section className="grid gap-4 xl:grid-cols-[1fr_0.9fr_1.25fr]">
        <ChartCard title={dashboard.donutCards[0].title} href={dashboard.donutCards[0].href} linkLabel={dashboard.donutCards[0].linkLabel}>
          <DonutChart data={dashboard.donutCards[0].data} centerValue={dashboard.donutCards[0].centerValue} centerLabel={dashboard.donutCards[0].centerLabel} />
        </ChartCard>
        <FunnelCard funnel={dashboard.funnels[0]} />
        <ChartCard title={dashboard.lineCards[0].title} href={dashboard.lineCards[0].href} linkLabel={dashboard.lineCards[0].linkLabel}>
          <LineChart data={dashboard.lineCards[0].data} currency={dashboard.lineCards[0].currency} />
        </ChartCard>
      </section>
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1fr_1.25fr]">
        <QuickActionGrid title="Key Modules" actions={dashboard.keyModules ?? []} columns="grid-cols-2" />
        <RecentListCard title={dashboard.lists[0].title} items={dashboard.lists[0].items} href={dashboard.lists[0].href} linkLabel={dashboard.lists[0].linkLabel} />
        {dashboard.events ? <EventListCard events={dashboard.events.items} title={dashboard.events.title} href={dashboard.events.href} linkLabel={dashboard.events.linkLabel} /> : null}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <SummaryStatsCard title="Quick Stats" stats={dashboard.summaryStats ?? []} />
        <RecentListCard title={dashboard.lists[1].title} items={dashboard.lists[1].items} href={dashboard.lists[1].href} linkLabel={dashboard.lists[1].linkLabel} compact />
      </section>
    </div>
  )
}

function CounsellorDashboard({ dashboard }: { dashboard: RoleDashboardMock }) {
  const donutCard = dashboard.donutCards?.[0]
  const funnel = dashboard.funnels?.[0]
  const lineCard = dashboard.lineCards?.[0]
  const primaryList = dashboard.lists?.[0]
  const secondaryList = dashboard.lists?.[1]
  const progressCard = dashboard.progressCards?.[0]
  const fallbackFunnel = {
    title: "Lead Funnel",
    href: "/counsellor/leads",
    linkLabel: "View leads",
    data: [
      { label: "New", value: 0, color: "#0B7A5A" },
      { label: "Contacted", value: 0, color: "#2563EB" },
      { label: "Qualified", value: 0, color: "#7C3AED" },
      { label: "Proposal", value: 0, color: "#F59E0B" },
      { label: "Converted", value: 0, color: "#F97316" },
    ],
  }
  const fallbackTrend = [
    { label: "Mon", current: 0 },
    { label: "Tue", current: 0 },
    { label: "Wed", current: 0 },
    { label: "Thu", current: 0 },
    { label: "Fri", current: 0 },
  ]

  return (
    <div className="space-y-4">
      <MetricGrid metrics={dashboard.metrics} />
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1.25fr]">
        <ChartCard title={donutCard?.title ?? "Lead Mix"} href={donutCard?.href} linkLabel={donutCard?.linkLabel}>
          <DonutChart data={donutCard?.data ?? []} centerValue={donutCard?.centerValue} centerLabel={donutCard?.centerLabel} />
        </ChartCard>
        <FunnelCard funnel={funnel ?? fallbackFunnel} />
        <ChartCard title={lineCard?.title ?? "Follow-up Trend"} href={lineCard?.href} linkLabel={lineCard?.linkLabel}>
          <LineChart data={lineCard?.data?.length ? lineCard.data : fallbackTrend} />
        </ChartCard>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr_1fr]">
        <RecentListCard title={primaryList?.title ?? "Recent Leads"} items={primaryList?.items ?? []} href={primaryList?.href} linkLabel={primaryList?.linkLabel} />
        <RecentListCard title={secondaryList?.title ?? "Upcoming Follow Ups"} items={secondaryList?.items ?? []} href={secondaryList?.href} linkLabel={secondaryList?.linkLabel} />
        <CommunicationSummary stats={dashboard.communicationStats ?? []} />
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <SummaryStatsCard title="Conversion Overview" stats={dashboard.summaryStats ?? []} />
        <ProgressCard title={progressCard?.title ?? "Targets"} data={progressCard?.data ?? []} href={progressCard?.href} linkLabel={progressCard?.linkLabel} />
      </section>
    </div>
  )
}

function TrainerDashboard({ dashboard }: { dashboard: RoleDashboardMock }) {
  return (
    <div className="space-y-4">
      <MetricGrid metrics={dashboard.metrics} />
      <section className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1.05fr]">
        <RecentListCard title={dashboard.lists[0].title} items={dashboard.lists[0].items} href={dashboard.lists[0].href} linkLabel={dashboard.lists[0].linkLabel} timeAsBadge />
        <ChartCard title={dashboard.lineCards[0].title} href={dashboard.lineCards[0].href} linkLabel={dashboard.lineCards[0].linkLabel}>
          <LineChart data={dashboard.lineCards[0].data} suffix={dashboard.lineCards[0].suffix} />
        </ChartCard>
        <ProgressCard title={dashboard.progressCards[0].title} data={dashboard.progressCards[0].data} href={dashboard.progressCards[0].href} linkLabel={dashboard.progressCards[0].linkLabel} />
      </section>
      <section className="grid gap-4 xl:grid-cols-3">
        <RecentListCard title={dashboard.lists[1].title} items={dashboard.lists[1].items} href={dashboard.lists[1].href} linkLabel={dashboard.lists[1].linkLabel} />
        <RecentListCard title={dashboard.lists[2].title} items={dashboard.lists[2].items} href={dashboard.lists[2].href} linkLabel={dashboard.lists[2].linkLabel} />
        {dashboard.tasks ? <TaskListCard title={dashboard.tasks.title} tasks={dashboard.tasks.items} href={dashboard.tasks.href} linkLabel={dashboard.tasks.linkLabel} /> : null}
      </section>
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <ProgressCard title={dashboard.progressCards[1].title} data={dashboard.progressCards[1].data} href={dashboard.progressCards[1].href} linkLabel={dashboard.progressCards[1].linkLabel} compact />
        <QuickActionGrid title="Quick Actions" actions={dashboard.quickActions ?? []} columns="grid-cols-2 sm:grid-cols-5 xl:grid-cols-5" />
      </section>
    </div>
  )
}

function ParentDashboard({ dashboard }: { dashboard: RoleDashboardMock }) {
  return (
    <div className="space-y-4">
      <MetricGrid metrics={dashboard.metrics} />
      <section className="grid gap-4 xl:grid-cols-[1fr_1.05fr_1.1fr]">
        <ChartCard title={dashboard.donutCards[0].title} href={dashboard.donutCards[0].href} linkLabel={dashboard.donutCards[0].linkLabel}>
          <DonutChart data={dashboard.donutCards[0].data} centerValue={dashboard.donutCards[0].centerValue} centerLabel={dashboard.donutCards[0].centerLabel} />
        </ChartCard>
        <ProgressCard title={dashboard.progressCards[0].title} data={dashboard.progressCards[0].data} href={dashboard.progressCards[0].href} linkLabel={dashboard.progressCards[0].linkLabel} />
        <ChartCard title={dashboard.donutCards[1].title} href={dashboard.donutCards[1].href} linkLabel={dashboard.donutCards[1].linkLabel} actionLabel="Pay Now">
          <DonutChart data={dashboard.donutCards[1].data} centerValue={dashboard.donutCards[1].centerValue} centerLabel={dashboard.donutCards[1].centerLabel} />
        </ChartCard>
      </section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1.05fr_1.1fr]">
        {dashboard.events ? <EventListCard events={dashboard.events.items} title={dashboard.events.title} href={dashboard.events.href} linkLabel={dashboard.events.linkLabel} /> : null}
        <RecentListCard title={dashboard.lists[0].title} items={dashboard.lists[0].items} href={dashboard.lists[0].href} linkLabel={dashboard.lists[0].linkLabel} />
        <RecentListCard title={dashboard.lists[1].title} items={dashboard.lists[1].items} href={dashboard.lists[1].href} linkLabel={dashboard.lists[1].linkLabel} />
      </section>
      {dashboard.footerPanel ? <ChildProgressPanel panel={dashboard.footerPanel} /> : null}
    </div>
  )
}

function MetricGrid({ metrics }: { metrics: DashboardMetric[] }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
      {metrics.map((metric) => <DashboardMetricCard key={metric.key} metric={metric} />)}
    </section>
  )
}

export function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  const Icon = iconByKey[metric.icon] ?? LayoutDashboard
  const tone = toneStyles[metric.tone]
  return (
    <Link href={metric.href} className="min-h-[118px] rounded-lg border bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]" style={{ borderColor: tone.border }}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-[#0F172A]">{metric.label}</h3>
          <p className="mt-2 text-2xl font-black text-[#020617]">{metric.value}</p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#475569]">{metric.helper}</p>
        </div>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: tone.bg, color: tone.text }}>
          <Icon size={22} />
        </span>
      </div>
      {typeof metric.progress === "number" ? <ProgressBar value={metric.progress} className="mt-3" /> : null}
    </Link>
  )
}

export function ChartCard({
  title,
  href,
  linkLabel,
  actionLabel,
  children,
}: {
  title: string
  href: string
  linkLabel?: string
  actionLabel?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} href={href} linkLabel={linkLabel} />
      <div className="min-h-[250px]">{children}</div>
      {actionLabel ? (
        <div className="mt-3 flex justify-end">
          <Link href={href} className="rounded-lg bg-[#0B7A5A] px-5 py-2 text-xs font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.24)]">
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </section>
  )
}

export function DonutChart({ data, centerValue, centerLabel }: { data: DonutDatum[]; centerValue: string; centerLabel: string }) {
  return (
    <div className="grid min-h-[250px] items-center gap-4 sm:grid-cols-[0.9fr_1fr]">
      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius="58%" outerRadius="78%" paddingAngle={2} stroke="#fff" strokeWidth={3}>
              {data.map((entry) => <Cell key={entry.label} fill={entry.color} />)}
            </Pie>
            <Tooltip formatter={(value) => String(value)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xl font-black text-[#020617]">{centerValue}</p>
            <p className="text-xs font-bold text-[#475569]">{centerLabel}</p>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 font-semibold text-[#334155]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-bold text-[#071B4A]">{item.detail}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function LineChart({ data, suffix = "", currency = false }: { data: LineDatum[]; suffix?: string; currency?: boolean }) {
  const formatValue = (value: number) => currency ? `₹${value}L` : `${value}${suffix}`
  const chartData = data.length ? data : [{ label: "No data", current: 0 }]
  const allZero = chartData.every((point) => (point.current ?? 0) === 0 && (point.previous ?? 0) === 0)
  return (
    <div className="h-[250px] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="lineFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#0B7A5A" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#0B7A5A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E8EEF2" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis domain={allZero ? [0, 1] : undefined} tick={{ fill: "#475569", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} tickFormatter={(value) => formatValue(Number(value))} />
          <Tooltip formatter={(value) => formatValue(Number(value))} contentStyle={{ borderRadius: 8, borderColor: "#DDE9E4", boxShadow: "0 12px 30px rgba(15,23,42,0.1)" }} />
          {chartData.some((point) => typeof point.previous === "number") ? <Line type="monotone" dataKey="previous" stroke="#A7B0BC" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} /> : null}
          <Line type="monotone" dataKey="current" stroke="#0B7A5A" strokeWidth={3} dot={{ r: 4, fill: "#0B7A5A", strokeWidth: 0 }} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

function FunnelCard({ funnel }: { funnel: { title: string; href: string; linkLabel: string; data: FunnelDatum[] } }) {
  const max = Math.max(1, ...funnel.data.map((item) => item.value))
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={funnel.title} href={funnel.href} linkLabel={funnel.linkLabel} />
      <div className="space-y-3 py-2">
        {funnel.data.map((item, index) => {
          const width = Math.max(38, (item.value / max) * 100)
          return (
            <div key={item.label} className="grid grid-cols-[138px_minmax(0,1fr)] items-center gap-3">
              <span className="truncate text-xs font-bold text-[#071B4A]">{item.label}</span>
              <div className="flex justify-center">
                <div
                  className="flex h-11 items-center justify-center rounded-sm text-xs font-black text-white shadow-sm"
                  style={{
                    width: `${width}%`,
                    backgroundColor: item.color,
                    color: index > 0 ? "#071B4A" : "#fff",
                    clipPath: "polygon(5% 0, 95% 0, 86% 100%, 14% 100%)",
                  }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function ProgressBar({ value, className = "" }: { value: number; className?: string }) {
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-[#E8EEF2] ${className}`}>
      <div className="h-full rounded-full bg-[#0B7A5A]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

function ProgressCard({
  title,
  data,
  href,
  linkLabel,
  compact,
}: {
  title: string
  data: ProgressDatum[]
  href: string
  linkLabel?: string
  compact?: boolean
}) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} href={href} linkLabel={linkLabel} />
      <div className={compact ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-5" : "space-y-4"}>
        {data.map((item) => (
          <div key={item.label} className={compact ? "min-w-0" : "grid grid-cols-[minmax(0,1fr)_minmax(120px,0.7fr)_42px] items-center gap-3"}>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-[#071B4A]">{item.label}</p>
              {item.detail ? <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">{item.detail}</p> : null}
            </div>
            <div>
              <ProgressBar value={item.value} />
            </div>
            <div className="text-right">
              {item.grade ? (
                <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[#E0F3E9] px-2 text-xs font-black text-[#0B7A5A]">{item.grade}</span>
              ) : (
                <span className="text-xs font-black text-[#071B4A]">{item.value}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RecentListCard({
  title,
  items,
  href,
  linkLabel = "View all",
  compact,
  timeAsBadge,
}: {
  title: string
  items: RecentItem[]
  href: string
  linkLabel?: string
  compact?: boolean
  timeAsBadge?: boolean
}) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} href={href} linkLabel={linkLabel} />
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {items.map((item) => (
          <Link key={`${item.title}-${item.meta ?? ""}`} href={item.href} className="flex items-center gap-3 rounded-lg border border-transparent p-1.5 transition hover:border-[#E3ECE8] hover:bg-[#FBFDFC]">
            {timeAsBadge && item.meta ? (
              <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border border-[#DDE9E4] bg-[#F8FAF8] text-center text-sm font-black leading-4 text-[#0B7A5A]">{item.meta.replace(" ", "\n")}</span>
            ) : item.initials ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] text-xs font-black text-[#0B7A5A]">{item.initials}</span>
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                <Bell size={15} />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-[#071B4A]">{item.title}</span>
              <span className="mt-0.5 block truncate text-xs font-semibold text-[#64748B]">{item.detail}</span>
            </span>
            {item.meta && !timeAsBadge ? <span className="hidden shrink-0 text-xs font-semibold text-[#64748B] md:block">{item.meta}</span> : null}
            {item.status ? <StatusBadge label={item.status} tone={item.tone ?? "green"} /> : null}
          </Link>
        ))}
      </div>
    </section>
  )
}

export function TaskListCard({ title, tasks, href, linkLabel }: { title: string; tasks: TaskItem[]; href: string; linkLabel: string }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} />
      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.title} className="flex items-start gap-3">
            <span className={`mt-1 h-4 w-4 rounded border ${task.completed ? "border-[#0B7A5A] bg-[#0B7A5A]" : "border-[#B7C2CF] bg-white"}`} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-[#071B4A]">{task.title}</span>
              {task.detail ? <span className="block truncate text-xs font-semibold text-[#64748B]">{task.detail}</span> : null}
            </span>
            <StatusBadge label={task.due} tone={task.tone ?? "blue"} />
          </div>
        ))}
      </div>
    </section>
  )
}

export function QuickActionGrid({ title, actions, columns = "grid-cols-2" }: { title: string; actions: QuickAction[]; columns?: string }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} />
      <div className={`grid gap-3 ${columns}`}>
        {actions.map((action) => {
          const Icon = iconByKey[action.icon] ?? LayoutDashboard
          return (
            <Link key={action.label} href={action.href} className="flex min-h-[88px] flex-col items-center justify-center rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3 text-center transition hover:border-[#0B7A5A] hover:bg-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                <Icon size={20} />
              </span>
              <span className="mt-2 text-xs font-black leading-4 text-[#071B4A]">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

export function StatusBadge({ label, tone = "green" }: { label: string; tone?: MetricTone }) {
  const style = toneStyles[tone]
  return (
    <span className="shrink-0 rounded px-2 py-1 text-[11px] font-black" style={{ backgroundColor: style.chip, color: style.text }}>
      {label}
    </span>
  )
}

function EventListCard({ title, events, href, linkLabel }: { title: string; events: EventItem[]; href: string; linkLabel: string }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} href={href} linkLabel={linkLabel} />
      <div className="space-y-3">
        {events.map((event) => (
          <Link key={`${event.day}-${event.title}`} href={event.href} className="flex items-center gap-3 rounded-lg border-b border-[#EDF3F1] pb-3 last:border-b-0 last:pb-0">
            <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg border border-[#DDE9E4] bg-[#FBFDFC]">
              <span className="text-lg font-black leading-5 text-[#0B7A5A]">{event.day}</span>
              <span className="text-[10px] font-black uppercase text-[#0B7A5A]">{event.month}</span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-black text-[#071B4A]">{event.title}</span>
              <span className="block truncate text-xs font-semibold text-[#64748B]">{event.time}</span>
            </span>
            <StatusBadge label={event.status} tone={event.tone} />
          </Link>
        ))}
      </div>
    </section>
  )
}

function SummaryStatsCard({ title, stats }: { title: string; stats: SummaryStat[] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={title} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="border-r border-[#E3ECE8] px-3 last:border-r-0">
            <p className="truncate text-xs font-bold text-[#64748B]">{stat.label}</p>
            <p className="mt-1 text-xl font-black text-[#020617]">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CommunicationSummary({ stats }: { stats: CommunicationStat[] }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title="Communication Summary (This Month)" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = iconByKey[stat.icon] ?? MessageSquare
          const tone = toneStyles[stat.tone]
          return (
            <div key={stat.label} className="rounded-lg border border-[#E3ECE8] bg-[#FBFDFC] p-3 text-center">
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: tone.bg, color: tone.text }}>
                <Icon size={17} />
              </span>
              <p className="mt-2 text-lg font-black text-[#071B4A]">{stat.value}</p>
              <p className="text-[11px] font-bold text-[#475569]">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ChildProgressPanel({ panel }: { panel: NonNullable<RoleDashboardMock["footerPanel"]> }) {
  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
      <PanelHeader title={panel.title} href={panel.href} linkLabel="View Profile" />
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <div className="flex items-center gap-4">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] text-xl font-black text-[#0B7A5A]">NP</span>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-[#071B4A]">{panel.studentName}</p>
            <p className="mt-1 text-xs font-semibold text-[#64748B]">{panel.detail}</p>
            <Link href={panel.href} className="mt-3 inline-flex rounded-lg border border-[#DDE9E4] px-4 py-2 text-xs font-black text-[#0B7A5A]">View Profile</Link>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {panel.stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
                <ShieldCheck size={18} />
              </span>
              <p className="mt-2 text-xs font-semibold text-[#64748B]">{stat.label}</p>
              <p className="mt-1 text-lg font-black text-[#020617]">{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="border-l border-[#E3ECE8] pl-5">
          <p className="text-sm font-black text-[#071B4A]">{panel.remarkTitle}</p>
          <p className="mt-2 text-xs font-semibold leading-6 text-[#475569]">{panel.remark}</p>
          <p className="mt-3 text-xs font-black text-[#071B4A]">- Rahul Kumar</p>
          <p className="text-xs font-semibold text-[#64748B]">Data Structures Faculty</p>
        </div>
      </div>
    </section>
  )
}

function PanelHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="min-w-0 truncate text-sm font-black text-[#071B4A]">{title}</h2>
      {href && linkLabel ? (
        <Link href={href} className="shrink-0 text-xs font-black text-[#0B7A5A]">
          {linkLabel}
        </Link>
      ) : null}
    </div>
  )
}

function Avatar({ label, size = "md" }: { label: string; size?: "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm"
  return <span className={`flex shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] font-black text-[#0B7A5A] ${dimensions}`}>{label}</span>
}

export { dashboardColors }
