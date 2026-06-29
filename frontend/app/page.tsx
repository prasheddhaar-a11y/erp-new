/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Page
Purpose     : Renders and coordinates Page UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client";


/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Moon,
  Network,
  ReceiptText,
  Search,
  School,
  Settings,
  Shield,
  Sparkles,
  Store,
  Sun,
  TrendingDown,
  UserPlus,
  Users,
  X,
  Zap,
  Star,
  Trophy,
  Bell,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BranchManagementPanel } from "./modules/branches";
import { FranchiseOperationsPanel } from "./modules/franchise";
import { HRCommandCenter } from "./modules/hr";
import { ReportsAnalyticsPanel } from "./modules/reports";
import { UserManagementPanel } from "./modules/users";
import { ConfirmActionModal } from "./shared/confirm-modal";
import { clearStoredSession, getStoredSessionValue, storeSessionValue } from "./shared/api";
import { useAuthModalStore } from "@/store/authModalStore";
import { ProfileAvatarDropdown } from "@/components/profile/ProfileAvatarDropdown";
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type IconType = ComponentType<{
  size?: number;
  className?: string;
  style?: CSSProperties;
}>;

type AuthProfile = {
  id?: string;
  email?: string;
  full_name: string;
  role: string;
  phone?: string | null;
  emergency_contact?: string | null;
  profile_photo?: string | null;
  role_abbreviation?: string | null;
  branch_id?: string | null;
  franchise_id?: string | null;
  email_verified?: boolean | null;
  is_active?: boolean;
  last_login_at?: string | null;
  email_verified_at?: string | null;
  last_login_device?: string | null;
  last_login_ip?: string | null;
  last_login_browser?: string | null;
  last_login_operating_system?: string | null;
};

type AuthSession = {
  accessToken: string;
  refreshToken: string;
  profile: AuthProfile | null;
  rememberMe: boolean;
};

type DashboardMetric = {
  key: string;
  label: string;
  value: string;
  helper: string;
  trend: string;
};

type DisplayMetric = DashboardMetric & {
  icon: IconType;
  gradient: string;
  shadowColor: string;
  module: ModuleLabel;
  accentColor: string;
  borderColor: string;
};

type BranchComparison = {
  branch_name: string;
  students: number;
  attendance_rate: number;
  revenue: number;
  lead_conversion: number;
};

type AiAlert = {
  title: string;
  message: string;
  severity: string;
};

type InstituteProgress = {
  xp: number;
  streak: number;
  active_quests: number;
  awards: number;
  completion: number;
  message: string;
};

type AiInsight = {
  title: string;
  detail: string;
  impact: string;
  emoji: string;
};

type SecurityCheck = {
  label: string;
  status: string;
  detail: string;
};

type DashboardResponse = {
  total_students_active: number;
  total_students_inactive: number;
  revenue_this_month: number;
  new_leads_today: number;
  attendance_rate_today: number;
  fee_defaulters_count: number;
  upcoming_batches_classes: number;
  metrics: DashboardMetric[];
  branch_comparison: BranchComparison[];
  ai_alerts: AiAlert[];
  institute_progress: InstituteProgress;
  ai_insights: AiInsight[];
  security_checks: SecurityCheck[];
};

type UserRow = {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: string;
  branch_id?: string | null;
  is_active: boolean;
  display_code?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  parent_name?: string | null;
  parent_phone?: string | null;
  emergency_contact?: string | null;
  course_enrolled?: string | null;
  batch_name?: string | null;
  trainer_name?: string | null;
  student_status?: string | null;
  document_status?: string | null;
  admission_date?: string | null;
};

type LeadRow = {
  id: string;
  student_name: string;
  parent_name?: string | null;
  phone: string;
  email?: string | null;
  course_interest?: string | null;
  source: string;
  status: string;
  score: number;
  lost_reason?: string | null;
  demo_at?: string | null;
  demo_mode?: string | null;
  demo_link?: string | null;
  demo_attended?: string | null;
  branch_id?: string | null;
  counsellor_id?: string | null;
  next_follow_up_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  display_code?: string | null;
};

type InvoiceRow = {
  id: string;
  invoice_number: string;
  student_id: string;
  branch_id?: string | null;
  course_name?: string | null;
  amount: number;
  paid_amount: number;
  status: string;
  due_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  display_code?: string | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  payment_method: string;
  reference_number?: string | null;
  paid_at: string;
  notes?: string | null;
};

type CourseRow = {
  id: string;
  title: string;
  description: string;
  duration?: string | null;
  difficulty_level: string;
  status: string;
  trainer_id?: string | null;
  created_at: string;
  display_code?: string | null;
};

type EnrollmentRow = {
  id: string;
  course_id: string;
  student_id: string;
  progress_percent: number;
  batch_name?: string | null;
  status?: string | null;
  enrolled_at: string;
};

type AttendanceSessionRow = {
  id: string;
  title: string;
  session_date: string;
  course_id?: string | null;
  trainer_id: string;
  qr_token?: string | null;
};

type ApiSnapshot = {
  branches: BranchAdminRow[];
  courses: CourseRow[];
  sessions: AttendanceSessionRow[];
  students: UserRow[];
  users: UserRow[];
  leads: LeadRow[];
  enrollments: EnrollmentRow[];
  invoices: InvoiceRow[];
  payments: PaymentRow[];
  securitySummary?: SecuritySummaryRow | null;
  settingsSummary?: SettingsSummaryRow | null;
  settingsItems: SettingRow[];
  auditLogs: AuditLogRow[];
  securityEvents: SecurityEventRow[];
  securitySessions: SecuritySessionRow[];
};

type BranchAdminRow = {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  capacity: number;
  students: number;
  staff: number;
  total_users: number;
  utilization_percent: number;
  status: string;
};

type SecuritySummaryRow = {
  audit_logs: number;
  active_sessions: number;
  revoked_sessions: number;
  failed_logins: number;
  suspicious_events: number;
  security_score?: number;
  concepts?: Array<{ title: string; detail: string }>;
};

type SettingsSummaryRow = {
  institute_profile: number;
  academic_defaults: number;
  notifications: number;
  backup_security: number;
  enabled_settings: number;
};

type SettingRow = {
  id: string;
  key: string;
  label: string;
  category: string;
  value: string;
  description?: string | null;
  is_enabled: boolean;
  updated_at?: string | null;
};

type AuditLogRow = {
  id: string;
  user_id: string;
  action: string;
  module?: string | null;
  action_type?: string | null;
  new_value?: string | null;
  user_agent?: string | null;
  severity?: string | null;
  ip_address?: string | null;
  created_at: string;
};

type SecurityEventRow = {
  id: string;
  user_id?: string | null;
  event_type: string;
  severity?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
};

type SecuritySessionRow = {
  id: string;
  user_id: string;
  ip_address?: string | null;
  revoked: boolean;
  expires_at: string;
  created_at?: string | null;
};

type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "password" | "date" | "datetime-local" | "number" | "textarea" | "select";
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  defaultValue?: string;
};

type ActionConfig = {
  title: string;
  description: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PATCH";
  fields: FormField[];
  buildBody?: (values: Record<string, string>) => unknown;
  successMessage?: string;
  planned?: boolean;
};

type HistoryEventRow = {
  id: string;
  module: string;
  action: string;
  title: string;
  details?: string | null;
  record_id?: string | null;
  created_by_id?: string | null;
  branch_id?: string | null;
  created_at: string;
};

type ModuleLabel =
  | "Dashboard"
  | "Users"
  | "Branches"
  | "CRM"
  | "Students"
  | "LMS"
  | "Finance"
  | "HR"
  | "AI"
  | "Placement"
  | "Franchise"
  | "Reports"
  | "Security"
  | "Settings";

/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

async function apiRequest<T>(endpoint: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    cache: "no-store",
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = "Request failed";
    try {
      const data = await response.json();
      message = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail ?? data);
    } catch {
      message = `${response.status} ${response.statusText}`;
    }
    /* =====================================================
       SECTION: ERROR HANDLING
       PURPOSE:
       This section handles expected failures and converts them into useful responses.
       Good error handling keeps the app stable when something goes wrong.
    ===================================================== */

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}


async function sendPublicConfirmationEmail(
  email: string,
  subject: string,
  message: string
): Promise<boolean> {
  const cleanedEmail = email.trim().toLowerCase();
  if (!cleanedEmail) {
    throw new Error("Email address is required");
  }

  const response = await fetch(`${API_URL}/demo-otp/send-confirmation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: cleanedEmail,
      subject,
      message,
    }),
  });

  let data: { detail?: string; message?: string } | null = null;
  try {
    data = (await response.json()) as { detail?: string; message?: string };
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || "Failed to send confirmation email");
  }

  return true;
}

// â”€â”€â”€ DUOLINGO DESIGN TOKENS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const duo = {
  green:     "#58CC02",
  greenDark: "#46A302",
  greenSoft: "#D7F5B1",
  blue:      "#1CB0F6",
  blueDark:  "#0A90D4",
  blueSoft:  "#DDF4FF",
  yellow:    "#FFD900",
  yellowDark:"#E6C400",
  yellowSoft:"#FFF9C4",
  red:       "#FF4B4B",
  redDark:   "#CC0000",
  redSoft:   "#FFE0E0",
  purple:    "#CE82FF",
  purpleDark:"#9C44DD",
  purpleSoft:"#F1DAFF",
  orange:    "#FF9600",
  orangeDark:"#E08600",
  orangeSoft:"#FFE8C0",
  teal:      "#00CD9C",
  tealDark:  "#00A87F",
  tealSoft:  "#C7F5EA",
  bg:        "#FFFFFF",
  bgAlt:     "#F7F7F7",
  bgDark:    "#1A1A2A",
  bgDarkAlt: "#242438",
  border:    "#E5E5E5",
  borderDark:"rgba(255,255,255,0.12)",
  text:      "#3C3C3C",
  textMuted: "#777777",
  textDark:  "#FFFFFF",
  textMutedDark: "rgba(255,255,255,0.55)",
  shadow:    "0 4px 0 rgba(0,0,0,0.12)",
  shadowBtn: "0 4px 0",
  radius:    "16px",
  radiusSm:  "12px",
  radiusLg:  "24px",
  radiusXl:  "32px",
};

const duoGradients = {
  green:   `linear-gradient(135deg, ${duo.green} 0%, ${duo.teal} 100%)`,
  blue:    `linear-gradient(135deg, ${duo.blue} 0%, #5B86E5 100%)`,
  yellow:  `linear-gradient(135deg, ${duo.yellow} 0%, ${duo.orange} 100%)`,
  red:     `linear-gradient(135deg, ${duo.red} 0%, #FF6B35 100%)`,
  purple:  `linear-gradient(135deg, ${duo.purple} 0%, #7C3AED 100%)`,
  orange:  `linear-gradient(135deg, ${duo.orange} 0%, #FF6B35 100%)`,
  teal:    `linear-gradient(135deg, ${duo.teal} 0%, ${duo.blue} 100%)`,
  hero:    `linear-gradient(135deg, ${duo.green} 0%, ${duo.teal} 50%, ${duo.blue} 100%)`,
  sidebar: `linear-gradient(180deg, #1A1A2A 0%, #1E1E35 100%)`,
  pineHeader: `linear-gradient(135deg, #12310f 0%, #2f7d00 46%, #6fe31d 100%)`,
};

const moduleStyles: Record<ModuleLabel, { gradient: string; accent: string; soft: string; border: string; icon: string; shadow: string }> = {
  Dashboard: { gradient: duoGradients.pineHeader,  accent: duo.green,   soft: duo.greenSoft,  border: "#cceabf",  icon: "ðŸ ", shadow: "rgba(47,125,0,0.22)" },
  Users:     { gradient: duoGradients.blue,   accent: duo.blue,    soft: duo.blueSoft,   border: duo.blueDark,   icon: "ðŸ‘¥", shadow: "rgba(28,176,246,0.35)" },
  Branches:  { gradient: duoGradients.teal,   accent: duo.teal,    soft: duo.tealSoft,   border: duo.tealDark,   icon: "ðŸ¢", shadow: "rgba(0,205,156,0.35)" },
  CRM:       { gradient: duoGradients.pineHeader, accent: duo.green,  soft: duo.greenSoft, border: "#cceabf", icon: "ðŸ“Š", shadow: "rgba(47,125,0,0.22)" },
  Students:  { gradient: duoGradients.pineHeader, accent: duo.green,  soft: duo.greenSoft, border: "#cceabf", icon: "ðŸŽ“", shadow: "rgba(47,125,0,0.22)" },
  LMS:       { gradient: duoGradients.pineHeader, accent: duo.green,  soft: duo.greenSoft, border: "#cceabf", icon: "ðŸ“š", shadow: "rgba(47,125,0,0.22)" },
  Finance:   { gradient: duoGradients.pineHeader,  accent: duo.green,   soft: duo.greenSoft,  border: "#cceabf",  icon: "ðŸ’°", shadow: "rgba(47,125,0,0.22)" },
  HR:        { gradient: duoGradients.blue,   accent: duo.blue,    soft: duo.blueSoft,   border: duo.blueDark,   icon: "ðŸ‘”", shadow: "rgba(28,176,246,0.35)" },
  AI:        { gradient: duoGradients.purple, accent: duo.purple,  soft: duo.purpleSoft, border: duo.purpleDark, icon: "ðŸ¤–", shadow: "rgba(206,130,255,0.35)" },
  Franchise: { gradient: duoGradients.orange, accent: duo.orange,  soft: duo.orangeSoft, border: duo.orangeDark, icon: "ðŸª", shadow: "rgba(255,150,0,0.35)" },
  Reports:   { gradient: duoGradients.teal,   accent: duo.teal,    soft: duo.tealSoft,   border: duo.tealDark,   icon: "ðŸ“ˆ", shadow: "rgba(0,205,156,0.35)" },
  Security:  { gradient: duoGradients.pineHeader,    accent: duo.green,     soft: duo.greenSoft,    border: "#cceabf",    icon: "ðŸ”’", shadow: "rgba(47,125,0,0.22)" },
  Settings:  { gradient: duoGradients.pineHeader,   accent: duo.green,    soft: duo.greenSoft,   border: "#cceabf",   icon: "âš™ï¸", shadow: "rgba(47,125,0,0.22)" },
  Placement: { gradient: duoGradients.teal, accent: duo.teal, soft: duo.tealSoft, border: duo.tealDark, icon: "PL", shadow: "rgba(0,205,156,0.35)" },
};

const allModules: Array<{ label: ModuleLabel; icon: IconType }> = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Users",     icon: Users },
  { label: "Branches",  icon: Network },
  { label: "CRM",       icon: Building2 },
  { label: "Students",  icon: GraduationCap },
  { label: "LMS",       icon: School },
  { label: "Finance",   icon: CreditCard },
  { label: "HR",        icon: ClipboardCheck },
  { label: "AI",        icon: Bot },
  { label: "Placement", icon: Building2 },
  { label: "Franchise", icon: Store },
  { label: "Reports",   icon: BarChart3 },
  { label: "Security",  icon: Shield },
  { label: "Settings",  icon: Settings },
];

const roleModules: Record<string, ModuleLabel[]> = {
  super_admin:     allModules.map((m) => m.label),
  branch_admin:    ["Dashboard","Students","HR","Finance","LMS"],
  counsellor:      ["Dashboard","CRM","Students"],
  trainer:         ["Dashboard","LMS","Students"],
  student:         ["Dashboard","LMS","AI"],
  parent:          ["Dashboard","Students","Finance"],
  hr:              ["Dashboard","HR","Users","Finance"],
  finance:         ["Dashboard","Finance","HR"],
  franchise_owner: ["Dashboard","Franchise","Branches","Reports"],
  company_hr:      ["Dashboard","Placement"],
  public:          [],
};

const roleDashboardPaths: Record<string, string> = {
  super_admin: "/super-admin/dashboard",
  branch_admin: "/branch-admin/dashboard",
  counsellor: "/counsellor/dashboard",
  trainer: "/trainer/dashboard",
  hr: "/hr/dashboard",
  finance: "/finance/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  franchise_owner: "/franchise-owner/dashboard",
  company_hr: "/company-hr/dashboard",
  public: "/public",
};

const publicAuthRoutes = new Set(["/accept-invite", "/reset-password", "/verify-email"]);

const roleDisplayNames: Record<string, string> = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  counsellor: "Counsellor",
  trainer: "Trainer",
  hr: "HR",
  finance: "Finance",
  student: "Student",
  parent: "Parent",
  franchise_owner: "Franchise Owner",
  company_hr: "Company HR",
  public: "Public",
};

type SidebarChild = {
  label: string;
  icon: IconType;
};

const sidebarDropdowns: Partial<Record<ModuleLabel, SidebarChild[]>> = {
  CRM: [
    { label: "Admissions", icon: UserPlus },
    { label: "Lead Management", icon: ClipboardCheck },
  ],
  LMS: [
    { label: "Batch", icon: CalendarDays },
    { label: "Attendance", icon: ClipboardCheck },
  ],
  Finance: [
    { label: "Payments", icon: CreditCard },
    { label: "Invoices", icon: ReceiptText },
    { label: "Payroll", icon: CreditCard },
  ],
  HR: [
    { label: "Payroll", icon: CreditCard },
    { label: "Leave Management", icon: CalendarDays },
    { label: "Performance", icon: BarChart3 },
    { label: "Placement Portal", icon: Building2 },
  ],
  AI: [
    { label: "AI Alerts", icon: Sparkles },
    { label: "Predictions", icon: TrendingDown },
  ],
  Reports: [
    { label: "Analytics", icon: BarChart3 },
    { label: "Branch Reports", icon: Network },
  ],
};

const metricModuleByKey: Record<string, ModuleLabel> = {
  total_students:          "Students",
  revenue_this_month:      "Finance",
  new_leads_today:         "CRM",
  attendance_rate_today:   "HR",
  fee_defaulters_count:    "Finance",
  upcoming_batches_classes:"LMS",
};

const metricIconByKey: Record<string, IconType> = {
  total_students:          Users,
  revenue_this_month:      CreditCard,
  new_leads_today:         UserPlus,
  attendance_rate_today:   ClipboardCheck,
  fee_defaulters_count:    ReceiptText,
  upcoming_batches_classes:CalendarDays,
};

const metricStyleByKey: Record<string, { gradient: string; shadow: string; accent: string; border: string }> = {
  total_students:           { gradient: duoGradients.blue,   shadow: "rgba(28,176,246,0.35)",  accent: duo.blue,   border: duo.blueDark },
  revenue_this_month:       { gradient: duoGradients.green,  shadow: "rgba(88,204,2,0.35)",   accent: duo.green,  border: duo.greenDark },
  new_leads_today:          { gradient: duoGradients.purple, shadow: "rgba(206,130,255,0.35)", accent: duo.purple, border: duo.purpleDark },
  attendance_rate_today:    { gradient: duoGradients.teal,   shadow: "rgba(0,205,156,0.35)",  accent: duo.teal,   border: duo.tealDark },
  fee_defaulters_count:     { gradient: duoGradients.red,    shadow: "rgba(255,75,75,0.35)",  accent: duo.red,    border: duo.redDark },
  upcoming_batches_classes: { gradient: duoGradients.orange, shadow: "rgba(255,150,0,0.35)",  accent: duo.orange, border: duo.orangeDark },
};

const alertStyleBySeverity: Record<string, { accent: string; soft: string; border: string; emoji: string }> = {
  critical: { accent: duo.red,    soft: duo.redSoft,    border: duo.redDark,   emoji: "ðŸš¨" },
  warning:  { accent: duo.orange, soft: duo.orangeSoft, border: duo.orangeDark, emoji: "âš ï¸" },
  info:     { accent: duo.blue,   soft: duo.blueSoft,   border: duo.blueDark,  emoji: "â„¹ï¸" },
  success:  { accent: duo.green,  soft: duo.greenSoft,  border: duo.greenDark, emoji: "âœ…" },
};

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day:"2-digit", month:"short", year:"numeric" }).format(new Date(value));
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

const moduleCopy: Record<ModuleLabel, { title: string; text: string; actions: string[] }> = {
  Dashboard: { title: "Institute command center",    text: "Live summary across admissions, learning, attendance, finance, branches, and AI alerts.",           actions: ["Refresh dashboard","Export summary","Review alerts"] },
  Users:     { title: "User management",             text: "Create users, assign roles, manage staff, trainers, students, parents, and branch admins.",          actions: ["Add user","Assign role","Invite staff"] },
  Branches:  { title: "Branch management",           text: "Compare branch capacity, revenue, attendance, conversion, and daily operating health.",              actions: ["Add branch","Compare branches","Capacity report"] },
  CRM:       { title: "CRM and admissions",          text: "Track leads, demos, follow-ups, counsellor actions, and admissions conversion.",                     actions: ["Add lead","Schedule demo","Follow up","History"] },
  Students:  { title: "Student management",          text: "Manage student profiles, batches, status, attendance, learning progress, and parent visibility.",     actions: ["Add student","Assign batch","Update status","History"] },
  LMS:       { title: "Course and LMS",              text: "Publish courses, lessons, materials, quizzes, assignments, and trainer delivery plans.",             actions: ["Create course","Upload lesson","Publish quiz","Mark attendance","History"] },
  Finance:   { title: "Finance operations",          text: "Handle fees, invoices, GST billing, collections, defaulters, and payment follow-up.",                actions: ["Record payment","Create invoice","Send reminders","History"] },
  HR:        { title: "HR and attendance",           text: "Manage trainer workload, staff attendance, open roles, and payroll readiness.",                      actions: ["Add staff","Assign trainer","Mark attendance"] },
  AI:        { title: "AI platform",                 text: "Review smart alerts, automation suggestions, student risk signals, and operating recommendations.",   actions: ["Run insights","Review alerts","Configure AI"] },
  Placement: { title: "Placement portal",            text: "Review approved placement opportunities, applications, and company hiring activity.",                 actions: [] },
  Franchise: { title: "Franchise operations",        text: "Monitor franchise performance, compliance, revenue, branch agreements, and quality signals.",         actions: ["Add franchise","Review compliance","Compare revenue"] },
  Reports:   { title: "Reports and analytics",       text: "Generate exports, daily summaries, finance reports, attendance reports, and LMS analytics.",          actions: ["Generate report","Download CSV","Schedule email"] },
  Security:  { title: "Security and access",         text: "Manage roles, permissions, audit logs, JWT sessions, and high-risk access controls.",                 actions: ["Create role","Audit access","Rotate keys"] },
  Settings:  { title: "System settings",             text: "Configure institute profile, notification templates, academic calendar, and defaults.",               actions: ["Save profile","Update calendar","Configure alerts"] },
};

const roleOptions = [
  { label:"Super Admin",     value:"super_admin" },
  { label:"Branch Admin",    value:"branch_admin" },
  { label:"Counsellor",      value:"counsellor" },
  { label:"Trainer",         value:"trainer" },
  { label:"Student",         value:"student" },
  { label:"Parent",          value:"parent" },
  { label:"HR",              value:"hr" },
  { label:"Finance",         value:"finance" },
  { label:"Franchise Owner", value:"franchise_owner" },
  { label:"Company HR",      value:"company_hr" },
  { label:"Public",          value:"public" },
];

const roleAbbreviations: Record<string, string> = {
  super_admin: "SA",
  branch_admin: "BA",
  counsellor: "CL",
  trainer: "TR",
  student: "ST",
  parent: "PA",
  hr: "HR",
  finance: "FN",
  franchise_owner: "FO",
  company_hr: "CH",
  public: "PB",
};

function userFields(defaultRole = "student"): FormField[] {
  return [
    { name:"full_name",  label:"Full name",  required:true },
    { name:"email",      label:"Email",      type:"email",    required:true },
    { name:"phone",      label:"Phone" },
    { name:"password",   label:"Password",   type:"password", required:true, defaultValue:"Admin@123" },
    { name:"role",       label:"Role",       type:"select",   required:true, options:roleOptions, defaultValue:defaultRole },
    { name:"branch_id",  label:"Branch ID" },
  ];
}

function studentFields(): FormField[] {
  return [
    { name:"full_name",        label:"Full name",             required:true },
    { name:"email",            label:"Email",                 type:"email",    required:true },
    { name:"phone",            label:"Student phone" },
    { name:"password",         label:"Password",              type:"password", required:true, defaultValue:"Admin@123" },
    { name:"parent_name",      label:"Parent / guardian name" },
    { name:"parent_phone",     label:"Parent phone" },
    { name:"emergency_contact",label:"Emergency contact" },
    { name:"date_of_birth",    label:"Date of birth",         type:"date" },
    { name:"gender", label:"Gender", type:"select", options:[{label:"Not specified",value:""},{label:"Female",value:"female"},{label:"Male",value:"male"},{label:"Other",value:"other"}] },
    { name:"address",          label:"Address",               type:"textarea" },
    { name:"course_enrolled",  label:"Course enrolled" },
    { name:"batch_name",       label:"Batch name" },
    { name:"trainer_name",     label:"Trainer name" },
    { name:"student_status", label:"Student status", type:"select", defaultValue:"active", options:[{label:"Active",value:"active"},{label:"Inactive",value:"inactive"},{label:"Completed",value:"completed"},{label:"Dropped",value:"dropped"},{label:"Transferred",value:"transferred"}] },
    { name:"document_status", label:"Document status", type:"select", defaultValue:"pending", options:[{label:"Pending",value:"pending"},{label:"Verified",value:"verified"},{label:"Rejected",value:"rejected"}] },
    { name:"admission_date",   label:"Admission date",        type:"date" },
    { name:"branch_id",        label:"Branch ID" },
  ];
}

const actionConfigs: Record<string, ActionConfig> = {
  "Students history": { title:"Student history",   description:"Shows students added and student status changes.",         endpoint:"/history?module=students", method:"GET", fields:[], successMessage:"Student history loaded." },
  "CRM history":      { title:"CRM history",        description:"Shows lead additions, demo scheduling, and follow-up changes.", endpoint:"/history?module=crm", method:"GET", fields:[], successMessage:"CRM history loaded." },
  "LMS history":      { title:"LMS history",        description:"Shows course, lesson, quiz, and enrollment actions.",     endpoint:"/history?module=lms", method:"GET", fields:[], successMessage:"LMS history loaded." },
  "Finance history":  { title:"Finance history",    description:"Shows invoice, payment, and reminder actions.",           endpoint:"/history?module=finance", method:"GET", fields:[], successMessage:"Finance history loaded." },
  "Assign batch": {
    title:"Assign batch", description:"Assigns an existing student to an existing LMS course or batch.",
    endpoint:"/lms/enrollments/assign", method:"POST",
    fields:[{name:"student_id",label:"Student ID",required:true},{name:"course_id",label:"Select course / batch",required:true},{name:"batch_name",label:"Batch name"}],
    buildBody:(v)=>({ student_id:v.student_id, course_id:v.course_id, batch_name:v.batch_name||null }),
    successMessage:"Student assigned to batch successfully.",
  },
  "Update status": {
    title:"Update status", description:"Updates an existing student's active or inactive status.",
    endpoint:"/auth/users/assign-role", method:"PATCH",
    fields:[
      {name:"user_id",label:"Student ID",required:true},
      {name:"is_active",label:"Student status",type:"select",defaultValue:"true",options:[{label:"Active",value:"true"},{label:"Inactive",value:"false"}]},
      {name:"student_status",label:"Lifecycle status",type:"select",defaultValue:"active",options:[{label:"Active",value:"active"},{label:"Inactive",value:"inactive"},{label:"Completed",value:"completed"},{label:"Dropped",value:"dropped"},{label:"Transferred",value:"transferred"}]},
      {name:"batch_name",label:"Batch name"},{name:"trainer_name",label:"Trainer name"},{name:"branch_id",label:"Branch ID"},
    ],
    buildBody:(v)=>({ user_id:v.user_id, role:"student", branch_id:v.branch_id||null, is_active:v.is_active==="true", student_status:v.student_status||null, batch_name:v.batch_name||null, trainer_name:v.trainer_name||null }),
    successMessage:"Student status updated successfully.",
  },
  "Send reminders":  { title:"Send reminders", description:"Generates fee reminder messages from pending invoices.", endpoint:"/finance/send-reminders", method:"POST", fields:[], buildBody:()=>({}), successMessage:"Fee reminders generated successfully." },
  "Create role": {
    title:"Add staff access role", description:"Create a named ERP access role and save it in the Security audit list.", endpoint:"/security/roles", method:"POST",
    fields:[
      {name:"role_name",label:"Role / designation name",required:true,defaultValue:"Branch Supervisor"},
      {name:"permissions",label:"Allowed modules and work",type:"textarea",defaultValue:"Students view, Finance view, Attendance view"},
      {name:"description",label:"Notes for admin",type:"textarea",defaultValue:"Can monitor branch operations but cannot delete records."},
    ],
    buildBody:(v)=>({ role_name:v.role_name, permissions:v.permissions||"", description:v.description||null }),
    successMessage:"Role saved in Security audit list.",
  },
  "Audit access": { title:"Check user access", description:"Review active logins and failed logins, then save the result in Recent audit logs.", endpoint:"/security/audit-access", method:"POST", fields:[], buildBody:()=>({}), successMessage:"Access check saved in Recent audit logs." },
  "Rotate keys": {
    title:"Reset login sessions", description:"Use this when you want to force users to log in again after a security change.", endpoint:"/security/rotate-keys", method:"POST",
    fields:[
      {name:"reason",label:"Reason for reset",type:"textarea",defaultValue:"Routine admin security reset"},
      {name:"revoke_sessions",label:"Logout active users",type:"select",defaultValue:"true",options:[{label:"Yes",value:"true"},{label:"No",value:"false"}]},
    ],
    buildBody:(v)=>({ reason:v.reason||null, revoke_sessions:v.revoke_sessions!=="false" }),
    successMessage:"Session reset saved in Security events.",
  },
  "Save profile": {
    title:"Save profile", description:"Saves institute profile settings.", endpoint:"/settings/save-profile", method:"POST",
    fields:[
      {name:"institute_name",label:"Institute name",required:true,defaultValue:"Pinesphere ERP"},
      {name:"primary_contact",label:"Primary contact",defaultValue:"+91 98765 43210"},
    ],
    buildBody:(v)=>({ institute_name:v.institute_name, primary_contact:v.primary_contact||null }),
    successMessage:"Institute profile saved successfully.",
  },
  "Update calendar": {
    title:"Update calendar", description:"Updates academic year and attendance defaults.", endpoint:"/settings/update-calendar", method:"POST",
    fields:[
      {name:"academic_year",label:"Academic year",required:true,defaultValue:"2026-2027"},
      {name:"default_attendance_mode",label:"Attendance mode",defaultValue:"QR + manual fallback"},
    ],
    buildBody:(v)=>({ academic_year:v.academic_year, default_attendance_mode:v.default_attendance_mode||null }),
    successMessage:"Academic calendar updated successfully.",
  },
  "Configure alerts": {
    title:"Configure alerts", description:"Configures fee reminder and absence alert settings.", endpoint:"/settings/configure-alerts", method:"POST",
    fields:[
      {name:"fee_reminder_enabled",label:"Fee reminder rule",required:true,defaultValue:"Send 3 days before due date"},
      {name:"absence_alert_enabled",label:"Absence alert rule",defaultValue:"Notify parent after 2 missed classes"},
    ],
    buildBody:(v)=>({ fee_reminder_enabled:v.fee_reminder_enabled, absence_alert_enabled:v.absence_alert_enabled||null }),
    successMessage:"Alert settings configured successfully.",
  },
  "Follow up": {
    title:"Follow up", description:"Updates an existing CRM lead with follow-up status, next follow-up date, and notes.",
    endpoint:"/crm/leads/{lead_id}", method:"PATCH",
    fields:[
      {name:"lead_id",label:"Lead ID",required:true},
      {name:"status",label:"Follow-up status",type:"select",defaultValue:"follow_up",options:[{label:"Contacted",value:"contacted"},{label:"Follow up",value:"follow_up"},{label:"Demo scheduled",value:"demo_scheduled"},{label:"Converted",value:"converted"},{label:"Lost",value:"lost"}]},
      {name:"next_follow_up_at",label:"Next follow-up date and time",type:"datetime-local"},
      {name:"notes",label:"Follow-up notes",type:"textarea"},
      {name:"lost_reason",label:"Lost reason"},
      {name:"demo_attended",label:"Demo attendance",type:"select",defaultValue:"pending",options:[{label:"Pending",value:"pending"},{label:"Attended",value:"attended"},{label:"Missed",value:"missed"}]},
    ],
    buildBody:(v)=>({ status:v.status||"follow_up", next_follow_up_at:v.next_follow_up_at||null, notes:v.notes||null, lost_reason:v.lost_reason||null, demo_attended:v.demo_attended||"pending" }),
    successMessage:"Lead follow-up updated successfully.",
  },
  "Create invoice": {
    title:"Create invoice", description:"Creates a student fee invoice.", endpoint:"/finance/invoices", method:"POST",
    fields:[
      {name:"invoice_number",label:"Invoice number",required:true,defaultValue:"INV-004"},
      {name:"student_id",label:"Student ID",required:true},
      {name:"branch_id",label:"Branch ID"},
      {name:"course_name",label:"Course name"},
      {name:"amount",label:"Amount",type:"number",required:true,defaultValue:"10000"},
      {name:"due_date",label:"Due date",type:"date",required:true},
      {name:"notes",label:"Notes",type:"textarea"},
    ],
    buildBody:(v)=>({ invoice_number:v.invoice_number, student_id:v.student_id, branch_id:v.branch_id||null, course_name:v.course_name||null, amount:Number(v.amount||0), due_date:v.due_date, notes:v.notes||null }),
    successMessage:"Invoice created successfully.",
  },
  "Record payment": {
    title:"Record payment", description:"Records a student fee payment.", endpoint:"/finance/payments", method:"POST",
    fields:[
      {name:"invoice_id",label:"Invoice ID",required:true},
      {name:"amount",label:"Amount",type:"number",required:true,defaultValue:"5000"},
      {name:"payment_method",label:"Payment method",type:"select",defaultValue:"cash",options:[{label:"Cash",value:"cash"},{label:"UPI",value:"upi"},{label:"Card",value:"card"},{label:"Bank transfer",value:"bank_transfer"}]},
      {name:"reference_number",label:"Reference number"},
      {name:"notes",label:"Notes",type:"textarea"},
    ],
    buildBody:(v)=>({ invoice_id:v.invoice_id, amount:Number(v.amount||0), payment_method:v.payment_method||"cash", reference_number:v.reference_number||null, notes:v.notes||null }),
    successMessage:"Payment recorded successfully.",
  },
  "Schedule demo": {
    title:"Schedule demo", description:"Schedules a demo class by updating an existing CRM lead.",
    endpoint:"/crm/leads/{lead_id}", method:"PATCH",
    fields:[
      {name:"lead_id",label:"Lead ID",required:true},
      {name:"demo_at",label:"Demo date and time",type:"datetime-local",required:true},
      {name:"demo_mode",label:"Demo mode",type:"select",defaultValue:"offline",options:[{label:"Offline",value:"offline"},{label:"Online",value:"online"}]},
      {name:"demo_link",label:"Demo link"},
      {name:"trainer_name",label:"Trainer name"},
      {name:"notes",label:"Notes",type:"textarea"},
    ],
    buildBody:(v)=>({ status:"demo_scheduled", next_follow_up_at:v.demo_at, demo_at:v.demo_at, demo_mode:v.demo_mode||"offline", demo_link:v.demo_link||null, demo_attended:"pending", notes:[v.trainer_name?`Trainer: ${v.trainer_name}`:"",v.notes||""].filter(Boolean).join("\n") }),
    successMessage:"Demo scheduled successfully.",
  },
  "Add lead": {
    title:"Add lead", description:"Creates a CRM lead.", endpoint:"/crm/leads", method:"POST",
    fields:[
      {name:"student_name",label:"Student name",required:true},
      {name:"parent_name",label:"Parent name"},
      {name:"phone",label:"Phone",required:true},
      {name:"email",label:"Email",type:"email"},
      {name:"course_interest",label:"Course interest"},
      {name:"source",label:"Lead source",type:"select",defaultValue:"walk-in",options:[{label:"Walk-in",value:"walk-in"},{label:"Website",value:"website"},{label:"WhatsApp",value:"whatsapp"},{label:"Facebook",value:"facebook"},{label:"Referral",value:"referral"}]},
      {name:"status",label:"Status",type:"select",defaultValue:"new",options:[{label:"New",value:"new"},{label:"Contacted",value:"contacted"},{label:"Follow up",value:"follow_up"},{label:"Demo scheduled",value:"demo_scheduled"},{label:"Converted",value:"converted"},{label:"Lost",value:"lost"}]},
      {name:"score",label:"Lead score",type:"number",defaultValue:"50"},
      {name:"next_follow_up_at",label:"Next follow-up date and time",type:"datetime-local"},
      {name:"branch_id",label:"Branch ID"},
      {name:"notes",label:"Notes",type:"textarea"},
    ],
    buildBody:(v)=>({ student_name:v.student_name, parent_name:v.parent_name||null, phone:v.phone, email:v.email||null, course_interest:v.course_interest||null, source:v.source||"walk-in", status:v.status||"new", score:Number(v.score||0), branch_id:v.branch_id||null, counsellor_id:null, next_follow_up_at:v.next_follow_up_at||null, notes:v.notes||null }),
    successMessage:"CRM lead created successfully.",
  },
  "Add user": {
    title:"Add user", description:"Creates a user account.", endpoint:"/auth/users", method:"POST",
    fields:userFields("trainer"),
    buildBody:(v)=>({ ...v, phone:v.phone||null, branch_id:v.branch_id||null }),
    successMessage:"User created successfully.",
  },
  "Invite staff": {
    title:"Invite staff", description:"Sends an email invitation for a staff member to activate their account.",
    endpoint:"/users/invite", method:"POST",
    fields:[
      { name:"full_name", label:"Full name" },
      { name:"email", label:"Email", type:"email", required:true },
      { name:"role", label:"Role", type:"select", required:true, options:roleOptions.filter((role) => !["student", "parent", "public"].includes(role.value)), defaultValue:"trainer" },
      { name:"branch_id", label:"Branch ID", required:true },
      { name:"invite_method", label:"Invite method", type:"select", defaultValue:"auto", options:[{ label:"Auto email invite", value:"auto" }, { label:"Temporary password", value:"temporary" }] },
      { name:"temporary_password", label:"Temporary password", type:"password", defaultValue:"Welcome@123" },
    ],
    buildBody:(v)=>({ email:v.email, full_name:v.full_name||null, role:v.role, role_abbreviation:roleAbbreviations[v.role] ?? "", branch_id:v.branch_id||null, invite_method:v.invite_method||"auto", temporary_password:v.invite_method==="temporary" ? v.temporary_password||null : null, reactivate_existing:false }),
    successMessage:"Staff invitation sent successfully.",
  },
  "Assign role": {
    title:"Assign role", description:"Updates an existing user's role and branch.",
    endpoint:"/auth/users/assign-role", method:"PATCH",
    fields:[
      {name:"user_id",label:"User ID",required:true},
      {name:"role",label:"New role",type:"select",required:true,options:roleOptions,defaultValue:"student"},
      {name:"branch_id",label:"Branch ID"},
    ],
    buildBody:(v)=>({ user_id:v.user_id, role:v.role, branch_id:v.branch_id||null, is_active:true }),
    successMessage:"Role assigned successfully.",
  },
  "Add branch": {
    title:"Add branch", description:"Creates a branch.", endpoint:"/branches", method:"POST",
    fields:[
      {name:"name",label:"Branch name",required:true},
      {name:"code",label:"Branch code",required:true},
      {name:"city",label:"City"},
      {name:"address",label:"Address",type:"textarea"},
      {name:"manager_name",label:"Manager name"},
      {name:"phone",label:"Phone"},
      {name:"capacity",label:"Student capacity",type:"number",defaultValue:"100"},
    ],
    buildBody:(v)=>({ name:v.name, code:v.code, city:v.city||null, address:v.address||null, manager_name:v.manager_name||null, phone:v.phone||null, capacity:Number(v.capacity||0), status:"active" }),
    successMessage:"Branch created successfully.",
  },
  "Compare branches":  { title:"Compare branches",  description:"Loads branch comparison details.",  endpoint:"/branches/compare",         method:"GET", fields:[], successMessage:"Branch comparison loaded." },
  "Capacity report":   { title:"Capacity report",   description:"Loads branch capacity details.",    endpoint:"/branches/capacity-report",  method:"GET", fields:[], successMessage:"Capacity report loaded." },
  "Add student": {
    title:"Add student", description:"Creates a student profile with parent, course, batch, and document status.",
    endpoint:"/auth/users", method:"POST", fields:studentFields(),
    buildBody:(v)=>({ ...v, role:"student", phone:v.phone||null, branch_id:v.branch_id||null, gender:v.gender||null, date_of_birth:v.date_of_birth||null, admission_date:v.admission_date||null }),
    successMessage:"Student created successfully.",
  },
  "Add staff": {
    title:"Add staff", description:"Creates a staff user with the selected operational role.",
    endpoint:"/auth/users", method:"POST", fields:userFields("hr"),
    buildBody:(v)=>({ ...v, phone:v.phone||null, branch_id:v.branch_id||null }),
    successMessage:"Staff user created successfully.",
  },
  "Create course": {
    title:"Create course", description:"Creates an LMS course.", endpoint:"/lms/courses", method:"POST",
    fields:[
      {name:"title",label:"Course title",required:true},
      {name:"description",label:"Description",type:"textarea",required:true},
      {name:"duration",label:"Duration",defaultValue:"8 weeks"},
      {name:"difficulty_level",label:"Difficulty",type:"select",defaultValue:"Beginner",options:[{label:"Beginner",value:"Beginner"},{label:"Intermediate",value:"Intermediate"},{label:"Advanced",value:"Advanced"}]},
      {name:"status",label:"Status",type:"select",defaultValue:"draft",options:[{label:"Draft",value:"draft"},{label:"Published",value:"published"}]},
    ],
    buildBody:(v)=>v,
    successMessage:"Course created successfully.",
  },
  "Upload lesson": {
    title:"Create lesson", description:"Adds a lesson to an existing course.",
    endpoint:"/lms/courses/{course_id}/lessons", method:"POST",
    fields:[
      {name:"course_id",label:"Course ID",required:true},
      {name:"title",label:"Lesson title",required:true},
      {name:"summary",label:"Summary",type:"textarea"},
      {name:"content",label:"Lesson content",type:"textarea"},
      {name:"video_url",label:"Video URL"},
      {name:"pdf_url",label:"PDF URL"},
      {name:"content_type",label:"Content type",type:"select",defaultValue:"lesson",options:[{label:"Lesson",value:"lesson"},{label:"Assignment",value:"assignment"},{label:"Quiz prep",value:"quiz_prep"},{label:"Project",value:"project"}]},
      {name:"assignment_url",label:"Assignment URL"},
      {name:"due_at",label:"Due date and time",type:"text"},
      {name:"max_marks",label:"Max marks",type:"number",defaultValue:"0"},
      {name:"sort_order",label:"Sort order",type:"number",defaultValue:"1"},
    ],
    buildBody:(v)=>({ title:v.title, summary:v.summary||null, content:v.content||null, video_url:v.video_url||null, pdf_url:v.pdf_url||null, assignment_url:v.assignment_url||null, content_type:v.content_type||"lesson", due_at:v.due_at||null, max_marks:Number(v.max_marks||0), sort_order:Number(v.sort_order||1), is_preview:false }),
    successMessage:"Lesson created successfully.",
  },
  "Publish quiz": {
    title:"Publish quiz", description:"Creates a quiz with one starter question.",
    endpoint:"/lms/courses/{course_id}/quizzes", method:"POST",
    fields:[
      {name:"course_id",label:"Course ID",required:true},
      {name:"title",label:"Quiz title",required:true},
      {name:"description",label:"Description",type:"textarea"},
      {name:"question",label:"Question",type:"textarea",required:true},
      {name:"option_a",label:"Option A",required:true},
      {name:"option_b",label:"Option B",required:true},
      {name:"correct_option",label:"Correct option",type:"select",defaultValue:"A",options:[{label:"A",value:"A"},{label:"B",value:"B"}]},
    ],
    buildBody:(v)=>({ title:v.title, description:v.description||null, passing_score:60, total_marks:1, status:"published", questions:[{ question:v.question, option_a:v.option_a, option_b:v.option_b, correct_option:v.correct_option, marks:1 }] }),
    successMessage:"Quiz created successfully.",
  },
  "Mark attendance": {
    title:"Mark attendance", description:"Create a class attendance session and mark active/enrolled students immediately.",
    endpoint:"/attendance/sessions/quick-mark", method:"POST",
    fields:[
      {name:"title",label:"Session title",required:true},
      {name:"session_date",label:"Session date",type:"date",required:true},
      {name:"course_id",label:"Course / batch"},
      {name:"status",label:"Default mark",type:"select",defaultValue:"present",options:[{label:"Present",value:"present"},{label:"Absent",value:"absent"},{label:"Late",value:"late"}]},
      {name:"remarks",label:"Remarks",type:"textarea"},
    ],
    buildBody:(v)=>({ title:v.title, session_date:v.session_date, course_id:v.course_id||null, status:v.status||"present", remarks:v.remarks||null }),
    successMessage:"Attendance marked for active students.",
  },
  "Generate report": {
    title:"Generate attendance report", description:"Generates an attendance report with optional filters.",
    endpoint:"/attendance/reports", method:"POST",
    fields:[
      {name:"course_id",label:"Course ID"},
      {name:"student_id",label:"Student ID"},
      {name:"date_from",label:"Date from",type:"date"},
      {name:"date_to",label:"Date to",type:"date"},
    ],
    buildBody:(v)=>({ course_id:v.course_id||null, student_id:v.student_id||null, date_from:v.date_from||null, date_to:v.date_to||null }),
    successMessage:"Report generated.",
  },
  "Run insights": {
    title:"Run AI insight", description:"Runs an AI learning insight.",
    endpoint:"/lms/ai-tutor", method:"POST",
    fields:[
      {name:"question",label:"Question",type:"textarea",required:true,defaultValue:"Summarize today's operating risks."},
      {name:"course_id",label:"Course ID"},
      {name:"lesson_id",label:"Lesson ID"},
    ],
    buildBody:(v)=>({ question:v.question, course_id:v.course_id||null, lesson_id:v.lesson_id||null }),
    successMessage:"AI response received.",
  },
  "Review alerts": {
    title:"Review AI alerts", description:"Saves an AI alert review task for follow-up.",
    endpoint:"/ai/alerts/review", method:"POST",
    fields:[
      {name:"title",label:"Review title",required:true,defaultValue:"AI alert review"},
      {name:"priority",label:"Priority",type:"select",defaultValue:"high",options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"}]},
      {name:"notes",label:"Review notes",type:"textarea",defaultValue:"Review critical AI alerts and assign follow-up owners."},
    ],
    buildBody:(v)=>({ title:v.title, priority:v.priority||"high", status:"open", notes:v.notes||null, payload:{ source:"ai_alerts" } }),
    successMessage:"AI alert review saved.",
  },
  "Configure AI": {
    title:"Configure AI", description:"Saves AI automation and alert configuration notes.",
    endpoint:"/ai/configurations", method:"POST",
    fields:[
      {name:"title",label:"Configuration title",required:true,defaultValue:"AI alert configuration"},
      {name:"priority",label:"Priority",type:"select",defaultValue:"medium",options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"}]},
      {name:"notes",label:"Configuration notes",type:"textarea",defaultValue:"Tune student risk, finance recovery, and attendance alert thresholds."},
    ],
    buildBody:(v)=>({ title:v.title, priority:v.priority||"medium", status:"open", notes:v.notes||null, payload:{ source:"ai_configuration" } }),
    successMessage:"AI configuration saved.",
  },
  "Add franchise": {
    title:"Add franchise", description:"Creates a franchise operations record for admin follow-up.",
    endpoint:"/franchise/franchises", method:"POST",
    fields:[
      {name:"title",label:"Franchise name",required:true},
      {name:"related_branch_id",label:"Branch ID"},
      {name:"priority",label:"Priority",type:"select",defaultValue:"medium",options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"}]},
      {name:"notes",label:"Notes",type:"textarea"},
    ],
    buildBody:(v)=>({ title:v.title, related_branch_id:v.related_branch_id||null, priority:v.priority||"medium", status:"open", notes:v.notes||null }),
    successMessage:"Franchise record saved.",
  },
  "Review compliance": {
    title:"Review compliance", description:"Creates a franchise compliance review task.",
    endpoint:"/franchise/compliance-reviews", method:"POST",
    fields:[
      {name:"title",label:"Review title",required:true,defaultValue:"Franchise compliance review"},
      {name:"related_branch_id",label:"Branch ID"},
      {name:"priority",label:"Priority",type:"select",defaultValue:"high",options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"}]},
      {name:"notes",label:"Compliance notes",type:"textarea"},
    ],
    buildBody:(v)=>({ title:v.title, related_branch_id:v.related_branch_id||null, priority:v.priority||"high", status:"open", notes:v.notes||null }),
    successMessage:"Compliance review saved.",
  },
  "Compare revenue": { title:"Compare revenue", description:"Loads franchise revenue comparison records.", endpoint:"/franchise/revenue-comparison", method:"GET", fields:[], successMessage:"Franchise revenue comparison loaded." },
  "Export summary": { title:"Export summary", description:"Loads saved report export records.", endpoint:"/reports/exports", method:"GET", fields:[], successMessage:"Report exports loaded." },
  "Download CSV": { title:"Download CSV", description:"Loads CSV download records.", endpoint:"/reports/download-csv", method:"GET", fields:[], successMessage:"CSV download records loaded." },
  "Schedule email": {
    title:"Schedule email", description:"Creates a scheduled report email task.",
    endpoint:"/reports/scheduled-emails", method:"POST",
    fields:[
      {name:"title",label:"Email title",required:true,defaultValue:"Scheduled ERP report"},
      {name:"due_date",label:"Send date",type:"date"},
      {name:"priority",label:"Priority",type:"select",defaultValue:"medium",options:[{label:"Low",value:"low"},{label:"Medium",value:"medium"},{label:"High",value:"high"}]},
      {name:"notes",label:"Recipients and notes",type:"textarea"},
    ],
    buildBody:(v)=>({ title:v.title, due_date:v.due_date||null, priority:v.priority||"medium", status:"open", notes:v.notes||null }),
    successMessage:"Scheduled email saved.",
  },
  "Refresh dashboard": { title:"Refresh dashboard", description:"Refreshes the dashboard summary.", endpoint:"/dashboard/super-admin", method:"GET", fields:[], successMessage:"Dashboard refreshed." },
};

function getActionConfig(action: string): ActionConfig {
  return actionConfigs[action] ?? {
    title: action,
    description: "This feature is not available yet.",
    fields:[{ name:"note", label:"Note", type:"textarea", defaultValue:`${action} is not available yet.` }],
    planned: true,
  };
}

// â”€â”€â”€ ROOT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Home() {
  const router = useRouter();
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [loginOpen,   setLoginOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ModuleLabel>("Dashboard");
  const [authSession, setAuthSession] = useState<AuthSession>({ accessToken:"", refreshToken:"", profile:null, rememberMe:false });
  const [isDark, setIsDark] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sessionReady, setSessionReady] = useState(
    () => typeof window !== "undefined" && publicAuthRoutes.has(window.location.pathname)
  );
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [publicAction, setPublicAction] = useState<"enquiry" | "demo" | "admission" | "contact" | null>(null);
  const { openModal } = useAuthModalStore();

  function navigateTo(path: string) {
    if (window.location.pathname !== path) window.history.replaceState({}, "", path);
  }

  useEffect(() => {
    if (publicAuthRoutes.has(window.location.pathname)) {
      return;
    }

    const initialPath = window.location.pathname;
    if (initialPath === "/" || initialPath === "/login" || initialPath.endsWith("/dashboard")) {
      saveSession({ accessToken:"", refreshToken:"", profile:null, rememberMe:false });
      navigateTo("/login");
      openModal("login");
      setSessionReady(true);
      return;
    }

    const timer = window.setTimeout(async () => {
      const accessToken   = getStoredSessionValue("pinesphere_access_token");
      const refreshToken  = getStoredSessionValue("pinesphere_refresh_token");
      const rememberMe = window.localStorage.getItem("pinesphere_refresh_token") === refreshToken;
      if (!accessToken || !refreshToken) {
        if (window.location.pathname.endsWith("/dashboard")) navigateTo("/login");
        if (window.location.pathname === "/login" || window.location.pathname.endsWith("/dashboard")) openModal("login");
        setSessionReady(true);
        return;
      }
      try {
        let token = accessToken;
        let response = await fetch(`${API_URL}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } });
        if (response.status === 401) {
          const refreshed = await fetch(`${API_URL}/auth/refresh`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ refresh_token:refreshToken }) });
          if (!refreshed.ok) throw new Error("Session expired");
          token = ((await refreshed.json()) as { access_token:string }).access_token;
          response = await fetch(`${API_URL}/auth/me`, { headers:{ Authorization:`Bearer ${token}` } });
        }
        if (!response.ok) throw new Error("Session expired");
        const profile = await response.json() as AuthProfile;
        saveSession({ accessToken:token, refreshToken, profile, rememberMe });
        navigateTo(roleDashboardPaths[profile.role] ?? "/login");
      } catch {
        saveSession({ accessToken:"", refreshToken:"", profile:null, rememberMe:false });
        navigateTo("/login");
        openModal("login");
      } finally {
        setSessionReady(true);
      }
    }, 0);
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (authSession.profile?.role !== "trainer") return;
    if (typeof window === "undefined") return;

    const targetPath = roleDashboardPaths.trainer;
    if (!window.location.pathname.startsWith("/trainer")) {
      window.location.assign(targetPath);
      return;
    }

    if (!window.sessionStorage.getItem("trainer_route_handoff")) {
      window.sessionStorage.setItem("trainer_route_handoff", "1");
      window.location.reload();
    }
  }, [authSession.profile?.role]);

  const allowedModules = useMemo(() => {
    const role   = authSession.profile?.role ?? "guest";
    const labels = roleModules[role] ?? [];
    return allModules.filter((m) => labels.includes(m.label));
  }, [authSession.profile?.role]);

  const visibleModule = allowedModules.some((m) => m.label === activeModule) ? activeModule : "Dashboard";

  function saveSession(next: AuthSession) {
    clearStoredSession();
    if (next.accessToken) {
      storeSessionValue("pinesphere_access_token", next.accessToken, next.rememberMe);
      storeSessionValue("pinesphere_refresh_token", next.refreshToken, next.rememberMe);
      storeSessionValue("pinesphere_profile", JSON.stringify(next.profile), next.rememberMe);
    }
    setAuthSession(next);
  }

  const refreshSession = useCallback(async (current = authSession) => {
    if (!current.refreshToken || !current.profile) return undefined;
    const res = await fetch(`${API_URL}/auth/refresh`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ refresh_token:current.refreshToken }) });
    if (!res.ok) {
      saveSession({ accessToken:"", refreshToken:"", profile:null, rememberMe:false });
      navigateTo("/login");
      openModal("login");
      return undefined;
    }
    const data = (await res.json()) as { access_token: string };
    saveSession({ accessToken:data.access_token, refreshToken:current.refreshToken, profile:current.profile, rememberMe:current.rememberMe });
    return data.access_token;
  }, [authSession]);

  useEffect(() => {
    if (!authSession.refreshToken || !authSession.profile) return;
    const timer = window.setInterval(() => { void refreshSession(); }, 20*60*1000);
    return () => window.clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authSession.refreshToken, authSession.profile]);

  /* =====================================================
     SECTION: EVENT HANDLERS
     PURPOSE:
     This section responds to user actions such as clicks, typing, and form submission.
     Handlers connect interface events to state updates or API calls.
  ===================================================== */

  async function handleLogout() {
    setLogoutBusy(true);
    const logoutAccessToken = authSession.accessToken;
    const logoutRefreshToken = authSession.refreshToken;
    saveSession({ accessToken:"", refreshToken:"", profile:null, rememberMe:false });
    setActiveModule("Dashboard");
    navigateTo("/login");
    setProfileOpen(false);
    setLogoutConfirmOpen(false);
    setLogoutBusy(false);
    setToast("Logged out successfully.");
    openModal("login");
    if (logoutAccessToken && logoutRefreshToken) {
      const controller = new AbortController();
      window.setTimeout(() => controller.abort(), 1500);
      void fetch(`${API_URL}/auth/logout`, { method:"POST", headers:{ Authorization:`Bearer ${logoutAccessToken}`, "Content-Type":"application/json" }, body:JSON.stringify({ refresh_token:logoutRefreshToken }), signal: controller.signal }).catch(()=>undefined);
    }
  }

  if (!sessionReady) {
    return <main style={{ minHeight:"100vh", background: isDark ? duo.bgDark : duo.bgAlt }} />;
  }

  if (typeof window !== "undefined" && window.location.pathname === "/accept-invite") {
    return <InviteAcceptancePage />;
  }
  return (
    <main className={isDark ? "dark" : undefined} style={{ minHeight:"100vh", background: isDark ? duo.bgDark : duo.bgAlt, fontFamily:"'Nunito',sans-serif" }}>
      {authSession.profile && authSession.profile.role !== "public" ? (
        <AuthenticatedApp
          activeModule={visibleModule}
          allowedModules={allowedModules}
          accessToken={authSession.accessToken}
          profile={authSession.profile}
          sidebarOpen={sidebarOpen}
          isDark={isDark}
          onToggleTheme={() => setIsDark(d => !d)}
          onCloseSidebar={() => setSidebarOpen(false)}
          onOpenProfile={() => setProfileOpen(true)}
          onRefreshSession={() => refreshSession()}
          onNavigate={(module) => {
            if (module === "Settings") {
              router.push("/settings/profile");
              setSidebarOpen(false);
              return;
            }
            setActiveModule(module);
            setSidebarOpen(false);
          }}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
      ) : (
        <LandingPage onLoginClick={() => { navigateTo("/login"); openModal("login"); }} onSignUpClick={() => openModal("register")} onPublicAction={setPublicAction} />
      )}
      {loginOpen && (
        <LoginDialog onClose={() => setLoginOpen(false)} onLogin={(s) => { saveSession(s); navigateTo(roleDashboardPaths[s.profile?.role ?? ""] ?? "/login"); setToast(`Welcome back, ${roleDisplayNames[s.profile?.role ?? ""] ?? "User"}.`); setLoginOpen(false); }} />
      )}
      {publicAction ? <PublicEnquiryDialog action={publicAction} onClose={() => setPublicAction(null)} /> : null}
      {profileOpen && authSession.profile ? (
        <ProfileDialog
          accessToken={authSession.accessToken}
          profile={authSession.profile}
          onClose={() => setProfileOpen(false)}
          onSaved={(profile) => { saveSession({ ...authSession, profile }); setToast("Profile updated successfully."); }}
          onPasswordChanged={() => void handleLogout()}
        />
      ) : null}
      {logoutConfirmOpen ? (
        <ConfirmActionModal
          title="Confirm Logout"
          message="Are you sure you want to logout from Pinesphere ERP?"
          confirmLabel="Yes, Logout"
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={() => void handleLogout()}
          busy={logoutBusy}
          danger={false}
        />
      ) : null}
      {toast ? <div style={{ position:"fixed", right:20, bottom:20, zIndex:100, maxWidth:360, border:`2px solid ${duo.greenDark}`, borderRadius:duo.radiusSm, background:"#fff", color:duo.text, padding:"12px 16px", boxShadow:"0 8px 20px rgba(0,0,0,0.14)", fontSize:13, fontWeight:900 }}>{toast}</div> : null}
    </main>
  );
}

// â”€â”€â”€ LANDING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LandingPage({ onLoginClick, onSignUpClick }: { onLoginClick: () => void; onSignUpClick: () => void; onPublicAction: (action:"enquiry" | "demo" | "admission" | "contact") => void }) {
  const [demoOpen, setDemoOpen] = useState(false);
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const courses = [
    { title:"Full Stack Web Development", category:"Technology", level:"Beginner to Pro", duration:"24 weeks", rating:"4.9", image:"https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80", skills:["React", "Node", "Projects"] },
    { title:"Data Science and AI", category:"Analytics", level:"Advanced", duration:"20 weeks", rating:"4.8", image:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80", skills:["Python", "ML", "Dashboards"] },
    { title:"Cloud DevOps Engineer", category:"Cloud", level:"Career Track", duration:"18 weeks", rating:"4.7", image:"https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80", skills:["AWS", "Docker", "CI/CD"] },
    { title:"Digital Marketing Mastery", category:"Marketing", level:"Job Ready", duration:"12 weeks", rating:"4.8", image:"https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80", skills:["SEO", "Ads", "Analytics"] },
  ];
  const events = [
    { date:"08 Jun", title:"Career Launch Open House", mode:"Hybrid", seats:"120 seats" },
    { date:"15 Jun", title:"AI Tools for Students", mode:"Online", seats:"80 seats" },
    { date:"22 Jun", title:"Placement Readiness Bootcamp", mode:"Campus", seats:"60 seats" },
  ];
  const workshops = ["Resume clinic and LinkedIn review", "Live portfolio build day", "Mock interview sprint", "Capstone demo showcase"];
  const trainers = [
    { name:"Ananya Rao", role:"Full Stack Mentor", image:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80" },
    { name:"Rahul Menon", role:"AI and Data Coach", image:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80" },
    { name:"Meera Shah", role:"Career Specialist", image:"https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80" },
  ];
  const categories = ["All", "Technology", "Analytics", "Cloud", "Marketing", "Design"];
  const sectionStyle: CSSProperties = { maxWidth:1180, margin:"0 auto", padding:"72px 22px" };
  const glass: CSSProperties = { background:"rgba(255,255,255,0.76)", border:"1px solid rgba(255,255,255,0.72)", boxShadow:"0 24px 70px rgba(18,38,63,0.14)", backdropFilter:"blur(18px)" };

  return (
    <div style={{ minHeight:"100vh", background:"#F6FAFF", color:"#162033", fontFamily:"'Nunito',sans-serif", overflow:"hidden" }}>
      <style>{`
        html { scroll-behavior: smooth; }
        .public-card { transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease; }
        .public-card:hover { transform: translateY(-8px); box-shadow: 0 28px 80px rgba(18,38,63,.18) !important; border-color: rgba(88,204,2,.55) !important; }
        .public-float { animation: publicFloat 7s ease-in-out infinite; }
        .public-marquee { animation: publicMarquee 24s linear infinite; }
        @keyframes publicFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-16px) } }
        @keyframes publicMarquee { from{ transform:translateX(0) } to{ transform:translateX(-50%) } }
        @media(max-width:760px){ .public-hero-title{font-size:42px!important;} .public-nav-links{display:none!important;} .public-hero-grid{grid-template-columns:1fr!important;} .public-two-col{grid-template-columns:1fr!important;} }
      `}</style>

      <header style={{ position:"fixed", top:0, left:0, right:0, zIndex:40, padding:"16px 22px" }}>
        <nav style={{ maxWidth:1180, margin:"0 auto", ...glass, borderRadius:24, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16 }}>
          <a href="#top" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none", color:"#162033" }}>
            <div style={{ width:48, height:48, borderRadius:16, background:"linear-gradient(135deg,#58cc02,#12c99b)", display:"grid", placeItems:"center", color:"#fff", fontWeight:900, fontSize:20, boxShadow:"0 10px 24px rgba(88,204,2,.32)" }}>P</div>
            <div>
              <p style={{ margin:0, fontSize:19, fontWeight:900 }}>Pinesphere Learning</p>
              <p style={{ margin:0, color:"#687386", fontSize:12, fontWeight:800 }}>Courses, events and workshops</p>
            </div>
          </a>
          <div className="public-nav-links" style={{ display:"flex", gap:22, fontSize:14, fontWeight:900, color:"#4B5565" }}>
            <a href="#courses" style={{ color:"inherit", textDecoration:"none" }}>Courses</a>
            <a href="#events" style={{ color:"inherit", textDecoration:"none" }}>Events</a>
            <a href="#workshops" style={{ color:"inherit", textDecoration:"none" }}>Workshops</a>
            <a href="#placements" style={{ color:"inherit", textDecoration:"none" }}>Placements</a>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <button onClick={onLoginClick} style={{ border:"1px solid #DDE7F3", borderRadius:16, padding:"13px 20px", background:"#fff", color:"#162033", fontWeight:900, cursor:"pointer", boxShadow:"0 10px 24px rgba(22,32,51,.10)", fontFamily:"'Nunito',sans-serif" }}>Login</button>
            <button onClick={onSignUpClick} style={{ border:0, borderRadius:16, padding:"13px 20px", background:"#58cc02", color:"#fff", fontWeight:900, cursor:"pointer", boxShadow:"0 10px 24px rgba(88,204,2,.28)", fontFamily:"'Nunito',sans-serif" }}>Sign Up</button>
          </div>
        </nav>
      </header>

      <section id="top" style={{ minHeight:"100vh", position:"relative", padding:"132px 22px 76px", display:"flex", alignItems:"center", backgroundImage:"linear-gradient(115deg, rgba(7,18,38,.84), rgba(26,96,122,.48), rgba(88,204,2,.26)), url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=2200&q=85')", backgroundSize:"cover", backgroundPosition:"center" }}>
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(circle at 72% 18%, rgba(255,255,255,.32), transparent 28%), linear-gradient(180deg, transparent 70%, #F6FAFF 100%)" }} />
        <div className="public-hero-grid" style={{ position:"relative", maxWidth:1180, margin:"0 auto", width:"100%", display:"grid", gridTemplateColumns:"minmax(0,1.08fr) 430px", gap:34, alignItems:"center" }}>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:10, padding:"9px 15px", borderRadius:999, background:"rgba(255,255,255,.18)", border:"1px solid rgba(255,255,255,.38)", color:"#fff", fontWeight:900, backdropFilter:"blur(12px)", marginBottom:22 }}>Live admissions open for 2026</div>
            <h1 className="public-hero-title" style={{ margin:0, maxWidth:760, fontSize:72, lineHeight:.98, letterSpacing:0, color:"#fff", fontWeight:900 }}>Build job-ready skills with live courses, events and workshops.</h1>
            <p style={{ maxWidth:680, margin:"24px 0 0", color:"rgba(255,255,255,.86)", fontSize:20, lineHeight:1.65, fontWeight:700 }}>Explore career tracks, book demo classes, join weekend workshops, and learn from trainers who guide you from first class to placement.</p>
            <div style={{ marginTop:28, ...glass, borderRadius:22, padding:10, display:"grid", gridTemplateColumns:"1fr auto", gap:10, maxWidth:680 }}>
              <input placeholder="Search courses, workshops, trainers..." style={{ minWidth:0, height:54, border:0, outline:"none", background:"transparent", padding:"0 14px", fontSize:16, fontWeight:800, color:"#162033", fontFamily:"'Nunito',sans-serif" }} />
              <button style={{ border:0, borderRadius:16, padding:"0 24px", background:"linear-gradient(135deg,#58cc02,#12c99b)", color:"#fff", fontWeight:900, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Search</button>
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:14, marginTop:28 }}>
              <button onClick={() => setAdmissionOpen(true)} style={{ border:0, borderRadius:16, padding:"16px 24px", background:"#fff", color:"#162033", fontWeight:900, cursor:"pointer", boxShadow:"0 18px 44px rgba(0,0,0,.22)", fontFamily:"'Nunito',sans-serif" }}>Apply Now</button>
              <button onClick={()=>setDemoOpen(true)} style={{ border:"1px solid rgba(255,255,255,.5)", borderRadius:16, padding:"15px 22px", background:"rgba(255,255,255,.14)", color:"#fff", fontWeight:900, cursor:"pointer", backdropFilter:"blur(12px)", fontFamily:"'Nunito',sans-serif" }}>Book Demo Class</button>
              <a href="#courses" style={{ border:"1px solid rgba(255,255,255,.5)", borderRadius:16, padding:"15px 22px", background:"rgba(255,255,255,.14)", color:"#fff", fontWeight:900, textDecoration:"none", backdropFilter:"blur(12px)" }}>Explore Courses</a>
            </div>
          </div>
          <div className="public-float" style={{ ...glass, borderRadius:28, padding:18 }}>
            <img alt="Students in workshop" src="https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=85" style={{ width:"100%", height:270, objectFit:"cover", borderRadius:22, display:"block" }} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:14 }}>
              {[["18K+","Learners"],["92%","Placement"],["4.8","Rating"]].map(([n,l])=><div key={l} style={{ borderRadius:18, background:"rgba(246,250,255,.82)", padding:"14px 10px", textAlign:"center" }}><p style={{ margin:0, fontSize:24, fontWeight:900, color:"#162033" }}>{n}</p><p style={{ margin:"2px 0 0", fontSize:12, color:"#687386", fontWeight:900 }}>{l}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="courses" style={sectionStyle}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:20, alignItems:"end", flexWrap:"wrap", marginBottom:24 }}>
          <div><p style={{ margin:"0 0 8px", color:"#12A37F", fontWeight:900 }}>Featured courses</p><h2 style={{ margin:0, fontSize:42, lineHeight:1.08, fontWeight:900 }}>Choose a career path that moves with you.</h2></div>
          <button style={{ border:"1px solid #DDE7F3", background:"#fff", borderRadius:14, padding:"13px 18px", fontWeight:900, color:"#162033", fontFamily:"'Nunito',sans-serif" }}>Compare courses</button>
        </div>
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:16, marginBottom:12 }}>
          {categories.map(c=><button key={c} style={{ flex:"0 0 auto", border:"1px solid #DDE7F3", borderRadius:999, padding:"10px 18px", background:c==="All"?"#162033":"#fff", color:c==="All"?"#fff":"#4B5565", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>{c}</button>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:20 }}>
          {courses.map(course=>(
            <article className="public-card" key={course.title} style={{ ...glass, borderRadius:24, overflow:"hidden" }}>
              <img alt={course.title} src={course.image} style={{ width:"100%", height:170, objectFit:"cover", display:"block" }} />
              <div style={{ padding:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:10 }}><span style={{ color:"#12A37F", fontWeight:900 }}>{course.category}</span><span style={{ color:"#F59E0B", fontWeight:900 }}>{course.rating} rating</span></div>
                <h3 style={{ margin:"0 0 10px", fontSize:22, fontWeight:900 }}>{course.title}</h3>
                <p style={{ margin:"0 0 14px", color:"#687386", fontWeight:800 }}>{course.level} ï¿½ {course.duration}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>{course.skills.map(s=><span key={s} style={{ padding:"6px 10px", borderRadius:999, background:"#EEF7FF", color:"#2F70FF", fontSize:12, fontWeight:900 }}>{s}</span>)}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginTop:18 }}><button onClick={onLoginClick} style={{ border:0, borderRadius:14, background:"#58cc02", color:"#fff", padding:"12px", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>View details</button><button style={{ border:"1px solid #DDE7F3", borderRadius:14, background:"#fff", color:"#162033", padding:"12px", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Brochure</button></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="events" style={{ background:"linear-gradient(180deg,#FFFFFF,#EEF7FF)", borderTop:"1px solid #E8EEF6", borderBottom:"1px solid #E8EEF6" }}>
        <div className="public-two-col" style={{ ...sectionStyle, display:"grid", gridTemplateColumns:"1fr 1fr", gap:28, alignItems:"start" }}>
          <div><p style={{ margin:"0 0 8px", color:"#8B5CF6", fontWeight:900 }}>Upcoming events</p><h2 style={{ margin:"0 0 16px", fontSize:40, fontWeight:900 }}>Register for live sessions and campus experiences.</h2>{events.map(e=><div className="public-card" key={e.title} style={{ ...glass, borderRadius:22, padding:18, display:"grid", gridTemplateColumns:"78px 1fr auto", gap:16, alignItems:"center", marginTop:14 }}><div style={{ borderRadius:18, background:"#F1E8FF", color:"#6D28D9", padding:12, textAlign:"center", fontWeight:900 }}>{e.date}</div><div><h3 style={{ margin:0, fontSize:18, fontWeight:900 }}>{e.title}</h3><p style={{ margin:"4px 0 0", color:"#687386", fontWeight:800 }}>{e.mode} ï¿½ {e.seats}</p></div><button onClick={onLoginClick} style={{ border:0, borderRadius:14, padding:"12px 14px", background:"#8B5CF6", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Register</button></div>)}</div>
          <div id="workshops" style={{ ...glass, borderRadius:28, padding:26 }}><p style={{ margin:"0 0 8px", color:"#F59E0B", fontWeight:900 }}>Workshops timeline</p><h2 style={{ margin:"0 0 22px", fontSize:34, fontWeight:900 }}>Weekend learning sprints.</h2>{workshops.map((w,i)=><div key={w} style={{ display:"grid", gridTemplateColumns:"34px 1fr", gap:14, paddingBottom:i===workshops.length-1?0:24 }}><div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}><span style={{ width:30, height:30, borderRadius:999, background:"#58cc02", color:"#fff", display:"grid", placeItems:"center", fontWeight:900 }}>{i+1}</span>{i<workshops.length-1&&<span style={{ width:2, flex:1, background:"#DDE7F3", marginTop:6 }} />}</div><div><h3 style={{ margin:0, fontSize:18, fontWeight:900 }}>{w}</h3><p style={{ margin:"5px 0 0", color:"#687386", fontWeight:800 }}>Hands-on, mentor-led, certificate included.</p></div></div>)}<button onClick={onLoginClick} style={{ marginTop:24, width:"100%", border:0, borderRadius:16, padding:15, background:"#162033", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Book workshop</button></div>
        </div>
      </section>

      <section id="placements" style={sectionStyle}>
        <div style={{ textAlign:"center", maxWidth:760, margin:"0 auto 34px" }}><p style={{ margin:"0 0 8px", color:"#12A37F", fontWeight:900 }}>Outcomes</p><h2 style={{ margin:0, fontSize:42, fontWeight:900 }}>Success stories, placements and trainers in one place.</h2></div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:18, marginBottom:34 }}>{[["92%","placement assistance"],["650+","hiring partners"],["14 LPA","top learner offer"],["38K+","project submissions"]].map(([n,l])=><div className="public-card" key={l} style={{ ...glass, borderRadius:24, padding:24, textAlign:"center" }}><p style={{ margin:0, fontSize:42, fontWeight:900, color:"#162033" }}>{n}</p><p style={{ margin:"6px 0 0", color:"#687386", fontWeight:900 }}>{l}</p></div>)}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:18 }}>{trainers.map(t=><article className="public-card" key={t.name} style={{ ...glass, borderRadius:24, padding:20, display:"flex", gap:16, alignItems:"center" }}><img alt={t.name} src={t.image} style={{ width:74, height:74, borderRadius:20, objectFit:"cover" }} /><div><h3 style={{ margin:0, fontSize:19, fontWeight:900 }}>{t.name}</h3><p style={{ margin:"4px 0 0", color:"#687386", fontWeight:800 }}>{t.role}</p></div></article>)}</div>
      </section>

      <section style={{ padding:"36px 0", background:"#162033", color:"#fff", overflow:"hidden" }}><div className="public-marquee" style={{ display:"flex", width:"max-content", gap:14 }}>{[...courses,...courses].map((c,i)=><span key={`${c.title}-${i}`} style={{ padding:"12px 18px", borderRadius:999, background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.16)", fontWeight:900 }}>{c.title}</span>)}</div></section>

      <section style={{ ...sectionStyle, display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:20 }}>
        {["Students loved the practical projects and placement support.", "The demo class made choosing the right course easy.", "Workshops helped me finish my portfolio in two weekends."].map((quote,i)=><article className="public-card" key={quote} style={{ ...glass, borderRadius:24, padding:24 }}><p style={{ margin:0, fontSize:18, lineHeight:1.6, fontWeight:800 }}>"{quote}"</p><p style={{ margin:"18px 0 0", color:"#12A37F", fontWeight:900 }}>Learner story {i+1}</p></article>)}
      </section>

      <section style={{ background:"#fff", borderTop:"1px solid #E8EEF6" }}><div className="public-two-col" style={{ ...sectionStyle, display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}><div><p style={{ color:"#12A37F", fontWeight:900, margin:"0 0 8px" }}>Branches</p><h2 style={{ fontSize:38, margin:"0 0 14px", fontWeight:900 }}>Learn online or at a nearby campus.</h2><p style={{ color:"#687386", lineHeight:1.7, fontWeight:800 }}>Main Campus, North Campus, Online Live, and Franchise partner classrooms with counsellors, trainers, and placement support.</p></div><div style={{ ...glass, borderRadius:24, padding:22 }}>{["Main Campus - Student hub and labs", "North Campus - Weekend workshops", "Online Live - Remote cohorts", "Franchise Partner - Local admissions"].map(b=><div key={b} style={{ padding:"14px 0", borderBottom:"1px solid #E8EEF6", fontWeight:900, color:"#162033" }}>{b}</div>)}</div></div></section>

      <section style={sectionStyle}><h2 style={{ margin:"0 0 20px", fontSize:38, fontWeight:900 }}>FAQ</h2>{["Can I book a free demo class?", "Do courses include certificates?", "Can I compare two courses?", "Are workshops available online?"].map(q=><details key={q} style={{ ...glass, borderRadius:18, padding:"18px 20px", marginBottom:12 }}><summary style={{ cursor:"pointer", fontWeight:900, fontSize:17 }}>{q}</summary><p style={{ color:"#687386", fontWeight:800, lineHeight:1.6 }}>Yes. Use the apply, demo, brochure, or booking actions and our counsellor team will guide the next step.</p></details>)}</section>

      <footer style={{ background:"#101828", color:"#fff", padding:"42px 22px" }}><div style={{ maxWidth:1180, margin:"0 auto", display:"flex", justifyContent:"space-between", gap:24, flexWrap:"wrap" }}><div><h3 style={{ margin:"0 0 8px", fontSize:24, fontWeight:900 }}>Pinesphere Learning</h3><p style={{ margin:0, color:"rgba(255,255,255,.68)", fontWeight:800 }}>Courses, events, workshops and career outcomes.</p></div><div style={{ display:"flex", gap:12, flexWrap:"wrap" }}><button onClick={() => setAdmissionOpen(true)} style={{ border:0, borderRadius:14, padding:"13px 18px", background:"#58cc02", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Apply Now</button><button onClick={()=>setDemoOpen(true)} style={{ border:"1px solid rgba(255,255,255,.22)", borderRadius:14, padding:"13px 18px", background:"rgba(255,255,255,.08)", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Book Demo</button></div></div></footer>
      {admissionOpen && <AdmissionPortal onClose={() => setAdmissionOpen(false)} />}
      {demoOpen && <DemoBookingWizard mode="public" onClose={()=>setDemoOpen(false)} />}
    </div>
  );
}


function PublicEnquiryDialog({ action, onClose }: { action:"enquiry" | "demo" | "admission" | "contact"; onClose:()=>void }) {
  if (action === "demo") return <DemoBookingWizard mode="public" onClose={onClose} />;
  if (action === "admission") return <AdmissionPortal onClose={onClose} />;

  const labels = { enquiry:"Enquire Now", demo:"Book Demo", admission:"Apply for Admission", contact:"Contact Us" };
  const [form, setForm] = useState({ student_name:"", phone:"", email:"", course_interest:"", notes:"" });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setStatus("Submitting...");
    try {
      const response = await fetch(`${API_URL}/crm/public/enquiries`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body:JSON.stringify({
          ...form,
          email:form.email || null,
          course_interest:form.course_interest || null,
          notes:form.notes || null,
          source:`public-${action}`,
          status:action === "demo" ? "demo_requested" : action === "admission" ? "admission_enquiry" : "new",
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { detail?:string };
        throw new Error(data.detail ?? "Your request could not be submitted.");
      }
      setStatus("Thank you. The institute team will contact you shortly.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Your request could not be submitted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:520, background:"#fff", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:28 }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:16 }}>
          <div><h2 style={{ margin:0, fontSize:24, color:duo.text }}>{labels[action]}</h2><p style={{ color:duo.textMuted, fontWeight:700 }}>Submit your details and our team will follow up.</p></div>
          <button onClick={onClose} aria-label="Close" style={{ width:40, height:40, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#fff", cursor:"pointer" }}><X size={18}/></button>
        </div>
        <form onSubmit={submit} style={{ display:"grid", gap:12 }}>
          <input required placeholder="Student name" value={form.student_name} onChange={e=>setForm({...form,student_name:e.target.value})} style={publicInputStyle}/>
          <input required placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} style={publicInputStyle}/>
          <input type="email" placeholder="Email address" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={publicInputStyle}/>
          <input placeholder="Course interest" value={form.course_interest} onChange={e=>setForm({...form,course_interest:e.target.value})} style={publicInputStyle}/>
          <textarea placeholder="Message" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ ...publicInputStyle, minHeight:82, paddingTop:12 }}/>
          {status ? <p style={{ margin:0, color:duo.textMuted, fontWeight:800 }}>{status}</p> : null}
          <button disabled={busy} type="submit" style={{ minHeight:48, borderRadius:duo.radiusSm, background:duo.green, border:`2px solid ${duo.greenDark}`, color:"#fff", fontWeight:900, cursor:"pointer" }}>{busy ? "Submitting..." : labels[action]}</button>
        </form>
      </div>
    </div>
  );
}

const publicInputStyle:CSSProperties = { minHeight:48, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, padding:"0 14px", fontFamily:"'Nunito',sans-serif", fontWeight:700 };

/* =====================================================
   SECTION: INTEGRATED CRM PUBLIC FEATURES FROM page1.tsx
   PURPOSE:
   Adds the useful admission portal and demo booking wizard without replacing the stable page.tsx layout.
===================================================== */

type AdmissionDraft = {
  name: string;
  dob: string;
  gender: string;
  contact: string;
  email: string;
  qualification: string;
  college: string;
  percentage: string;
  course: string;
  batch: string;
  branch: string;
  baseFee: string;
  discount: string;
  scholarship: string;
  paymentMode: string;
};

function AdmissionPortal({ onClose }: { onClose:()=>void }) {
  const tabs = ["Personal", "Academic", "Course", "Documents", "Payment", "Preview"];
  const courses = ["Full Stack Web Development", "Data Science and AI", "Cloud DevOps Engineer", "Digital Marketing Mastery"];
  const batches = ["Weekday Morning", "Weekday Evening", "Weekend", "Online Live"];
  const branches = ["Main Campus", "North Campus", "Online Live", "Franchise Partner"];
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState("Draft auto-saved locally.");
  const [submitted, setSubmitted] = useState(false);
  const [draft, setDraft] = useState<AdmissionDraft>(() => ({
    name:"", dob:"", gender:"", contact:"", email:"", qualification:"", college:"", percentage:"",
    course:courses[0], batch:batches[0], branch:branches[0], baseFee:"45000", discount:"0", scholarship:"0", paymentMode:"Installments",
  }));
  const [files, setFiles] = useState<Record<string,{name:string; url:string; type:string} | null>>({ photo:null, aadhaar:null, certificates:null });


  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem("pinesphere_admission_draft", JSON.stringify(draft));
      setStatus("Draft auto-saved locally.");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const fee = Math.max(0, Number(draft.baseFee || 0) - Number(draft.discount || 0) - Number(draft.scholarship || 0));
  const inputStyle: CSSProperties = { height:48, borderRadius:12, border:"1px solid #DDE7F3", background:"#fff", padding:"0 13px", color:"#162033", fontWeight:800, outline:"none", fontFamily:"'Nunito',sans-serif" };
  const labelStyle: CSSProperties = { display:"grid", gap:7, color:"#4B5565", fontSize:12, fontWeight:900 };
  const sectionCard: CSSProperties = { background:"#fff", border:"1px solid #E4EAF3", borderRadius:8, padding:22, boxShadow:"0 18px 50px rgba(18,38,63,.08)" };

  function update(name:keyof AdmissionDraft, value:string) {
    setDraft(cur => ({ ...cur, [name]: value }));
    setSubmitted(false);
  }

  function handleFile(key:string, file?:File) {
    if (!file) return;
    const imageTypes = ["image/jpeg", "image/png", "image/webp"];
    const certificateTypes = [...imageTypes, "application/pdf"];
    const allowedTypes = key==="certificates" ? certificateTypes : imageTypes;
    const label = key==="aadhaar" ? "Aadhaar" : key.charAt(0).toUpperCase()+key.slice(1);
    if (!allowedTypes.includes(file.type)) {
      setStatus(`${label} upload rejected. ${key==="certificates" ? "Upload an image or PDF certificate." : "Upload JPG, PNG, or WebP image only."}`);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatus(`${label} upload rejected. File size must be 5 MB or less.`);
      return;
    }
    setFiles(cur => {
      if (cur[key]?.url) URL.revokeObjectURL(cur[key]?.url || "");
      return { ...cur, [key]: { name:file.name, type:file.type, url:URL.createObjectURL(file) } };
    });
    setStatus(`${file.name} ready for preview.`);
  }

  function missingForCurrentStep() {
    if (step===0) return [["name","Name"],["dob","DOB"],["gender","Gender"],["contact","Contact"],["email","Email"]].filter(([k]) => !draft[k as keyof AdmissionDraft]).map(([,v])=>v);
    if (step===1) return [["qualification","Qualification"],["college","College"],["percentage","Percentage"]].filter(([k]) => !draft[k as keyof AdmissionDraft]).map(([,v])=>v);
    if (step===2) return [["course","Course"],["batch","Batch"],["branch","Branch"]].filter(([k]) => !draft[k as keyof AdmissionDraft]).map(([,v])=>v);
    if (step===3) return ["photo","aadhaar","certificates"].filter(k => !files[k]).map(k => k.charAt(0).toUpperCase()+k.slice(1));
    return [];
  }

  function goNext() {
    const missing = missingForCurrentStep();
    if (missing.length) { setStatus(`Complete required fields: ${missing.join(", ")}.`); return; }
    setStep(s => Math.min(tabs.length-1, s+1));
    setStatus("Draft auto-saved locally.");
  }

  async function submitAdmission() {
    if (!draft.name || !draft.dob || !draft.gender || !draft.contact || !draft.email || !draft.qualification || !draft.college || !draft.percentage || !draft.course || !draft.batch || !draft.branch || !files.photo || !files.aadhaar || !files.certificates) {
      setStatus("Please complete all admission sections and upload required documents before submit.");
      return;
    }
    setStatus("Submitting application and sending confirmation email...");
    const details = [
      "Pinesphere Online Admission Application",
      "",
      `Name: ${draft.name}`,
      `DOB: ${draft.dob}`,
      `Gender: ${draft.gender}`,
      `Contact: ${draft.contact}`,
      `Email: ${draft.email}`,
      `Qualification: ${draft.qualification}`,
      `College: ${draft.college}`,
      `Percentage: ${draft.percentage}%`,
      `Course: ${draft.course}`,
      `Batch: ${draft.batch}`,
      `Branch: ${draft.branch}`,
      `Fee: Rs ${Number(draft.baseFee || 0).toLocaleString("en-IN")}`,
      `Discount: Rs ${Number(draft.discount || 0).toLocaleString("en-IN")}`,
      `Scholarship: Rs ${Number(draft.scholarship || 0).toLocaleString("en-IN")}`,
      `Net payable: Rs ${fee.toLocaleString("en-IN")}`,
      `Payment mode: ${draft.paymentMode}`,
      `Documents: ${Object.values(files).filter(Boolean).map(f=>f?.name).join(", ")}`,
      "",
      "Our admissions team will review the application and contact you shortly.",
    ].join("\n");
    const mailed = await sendPublicConfirmationEmail(draft.email, "Pinesphere admission application received", details).catch(()=>false);
    setSubmitted(true);
    window.sessionStorage.removeItem("pinesphere_admission_draft");
    setStatus(mailed ? "Application submitted. Confirmation email sent." : "Application submitted. Confirmation email could not be sent.");
    window.setTimeout(onClose, 1600);
  }

  const rows = [
    ["Name", draft.name || "-"], ["DOB", draft.dob || "-"], ["Gender", draft.gender || "-"], ["Contact", draft.contact || "-"], ["Email", draft.email || "-"],
    ["Qualification", draft.qualification || "-"], ["College", draft.college || "-"], ["Percentage", draft.percentage ? `${draft.percentage}%` : "-"],
    ["Course", draft.course], ["Batch", draft.batch], ["Branch", draft.branch], ["Net payable", `Rs ${fee.toLocaleString("en-IN")}`],
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:75, display:"flex", alignItems:"center", justifyContent:"center", padding:18, background:"rgba(7,18,38,.58)", backdropFilter:"blur(10px)", color:"#162033", fontFamily:"'Nunito',sans-serif" }}>
      <style>{`@media(max-width:860px){.admission-grid{grid-template-columns:1fr!important;}.admission-shell{max-height:94vh!important;padding:20px!important;}} @media print{button, aside{display:none!important;} .admission-shell{box-shadow:none!important;max-height:none!important;overflow:visible!important;} body{background:#fff!important;}}`}</style>
      <main className="admission-shell" style={{ width:"100%", maxWidth:1080, maxHeight:"92vh", overflowY:"auto", borderRadius:28, background:"linear-gradient(180deg,rgba(255,255,255,.97),rgba(246,250,255,.97))", border:"1px solid rgba(255,255,255,.75)", boxShadow:"0 30px 90px rgba(7,18,38,.28)", padding:26 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:18, marginBottom:20 }}>
          <div><p style={{ margin:"0 0 6px", color:"#12A37F", fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:1.2 }}>Online Admission Form</p><h1 style={{ margin:0, fontSize:28, fontWeight:900 }}>Student Admission Portal</h1><p style={{ margin:"6px 0 0", color:"#687386", fontWeight:800 }}>Complete each step and preview the application before submit.</p></div>
          <button onClick={()=>{window.sessionStorage.removeItem("pinesphere_admission_draft"); onClose();}} style={{ width:42, height:42, borderRadius:14, border:"1px solid #DDE7F3", background:"#fff", cursor:"pointer", color:"#162033" }}><X size={18}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) 320px", gap:22, alignItems:"start" }} className="admission-grid">
          <section style={sectionCard}>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:22 }}>
              {tabs.map((tab,i)=><button key={tab} onClick={()=>setStep(i)} style={{ border:`1px solid ${i===step?"#12A37F":"#DDE7F3"}`, borderRadius:8, padding:"10px 13px", background:i===step?"#E9FFF8":"#fff", color:i===step?"#087A60":"#4B5565", fontWeight:900, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>{i+1}. {tab}</button>)}
            </div>

            {step===0 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>Personal Details</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14 }}><label style={labelStyle}>Name<input value={draft.name} onChange={e=>update("name",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>DOB<input type="date" value={draft.dob} onChange={e=>update("dob",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Gender<select value={draft.gender} onChange={e=>update("gender",e.target.value)} style={inputStyle}><option value="">Select</option><option>Female</option><option>Male</option><option>Other</option></select></label><label style={labelStyle}>Contact<input value={draft.contact} onChange={e=>update("contact",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Email<input type="email" value={draft.email} onChange={e=>update("email",e.target.value)} style={inputStyle}/></label></div></div>}

            {step===1 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>Academic Details</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}><label style={labelStyle}>Qualification<input value={draft.qualification} onChange={e=>update("qualification",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>College<input value={draft.college} onChange={e=>update("college",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Percentage<input type="number" min="0" max="100" value={draft.percentage} onChange={e=>update("percentage",e.target.value)} style={inputStyle}/></label></div></div>}

            {step===2 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>Course Details</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:14 }}><label style={labelStyle}>Course<select value={draft.course} onChange={e=>update("course",e.target.value)} style={inputStyle}>{courses.map(c=><option key={c}>{c}</option>)}</select></label><label style={labelStyle}>Batch<select value={draft.batch} onChange={e=>update("batch",e.target.value)} style={inputStyle}>{batches.map(b=><option key={b}>{b}</option>)}</select></label><label style={labelStyle}>Branch<select value={draft.branch} onChange={e=>update("branch",e.target.value)} style={inputStyle}>{branches.map(b=><option key={b}>{b}</option>)}</select></label></div></div>}

            {step===3 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>Documents Upload</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14 }}>{[["photo","Photo","JPG, PNG, or WebP photo only"],["aadhaar","Aadhaar","JPG, PNG, or WebP Aadhaar image only"],["certificates","Certificates","Image or PDF certificate only"]].map(([key,label,helper])=><label key={key} style={{ ...labelStyle, border:"1px dashed #BFD0E4", borderRadius:8, padding:14, background:"#FAFCFF" }}>{label}<input type="file" accept={key==="certificates"?"image/jpeg,image/png,image/webp,application/pdf":"image/jpeg,image/png,image/webp"} onChange={e=>handleFile(key,e.target.files?.[0])} style={{ fontWeight:800 }}/><span style={{ color:"#687386", fontSize:11, fontWeight:800 }}>{helper} Â· Max 5 MB</span>{files[key]&&<div style={{ marginTop:8, borderRadius:8, background:"#fff", border:"1px solid #E4EAF3", padding:10 }}>{files[key]?.type.startsWith("image/")?<img alt={files[key]?.name} src={files[key]?.url} style={{ width:"100%", height:120, objectFit:"cover", borderRadius:6 }}/>:<p style={{ margin:0, fontWeight:900 }}>{files[key]?.name}</p>}</div>}</label>)}</div></div>}

            {step===4 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>Payment Section</h2><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}><label style={labelStyle}>Fee details<input type="number" value={draft.baseFee} onChange={e=>update("baseFee",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Discounts<input type="number" value={draft.discount} onChange={e=>update("discount",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Scholarships<input type="number" value={draft.scholarship} onChange={e=>update("scholarship",e.target.value)} style={inputStyle}/></label><label style={labelStyle}>Payment mode<select value={draft.paymentMode} onChange={e=>update("paymentMode",e.target.value)} style={inputStyle}><option>Installments</option><option>Full payment</option><option>Scholarship hold</option></select></label></div><div style={{ borderRadius:8, padding:18, background:"#EEF7FF", color:"#1A5DD6", fontWeight:900 }}>Fee calculator: Rs {Number(draft.baseFee||0).toLocaleString("en-IN")} - Rs {Number(draft.discount||0).toLocaleString("en-IN")} - Rs {Number(draft.scholarship||0).toLocaleString("en-IN")} = Rs {fee.toLocaleString("en-IN")}</div></div>}

            {step===5 && <div style={{ display:"grid", gap:16 }}><h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>PDF Preview Before Submit</h2><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>{tabs.slice(0,5).map((tab,i)=><button key={tab} type="button" onClick={()=>setStep(i)} style={{ border:"1px solid #DDE7F3", borderRadius:8, padding:"9px 12px", background:"#fff", color:"#162033", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Edit {tab}</button>)}</div><div style={{ border:"1px solid #DDE7F3", borderRadius:8, padding:22, background:"#fff" }}><h3 style={{ margin:"0 0 14px", fontSize:22, fontWeight:900 }}>Pinesphere Admission Application</h3><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:10 }}>{rows.map(([k,v])=><p key={k} style={{ margin:0, padding:"10px 12px", borderRadius:6, background:"#F6FAFF", color:"#4B5565", fontWeight:800 }}><strong style={{ color:"#162033" }}>{k}:</strong> {v}</p>)}</div><p style={{ margin:"16px 0 0", color:"#687386", fontWeight:800 }}>Documents: {Object.values(files).filter(Boolean).map(f=>f?.name).join(", ") || "Pending"}</p></div><div style={{ display:"flex", gap:10, flexWrap:"wrap" }}><button onClick={()=>window.print()} style={{ border:"1px solid #DDE7F3", borderRadius:8, padding:"12px 16px", background:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Print / Save PDF</button><button onClick={submitAdmission} style={{ border:0, borderRadius:8, padding:"12px 18px", background:"#58cc02", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Submit Application</button></div>{submitted&&<div style={{ borderRadius:8, background:"#E9FFF8", color:"#087A60", padding:14, fontWeight:900 }}>Application saved for review.</div>}</div>}

            <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginTop:24 }}><button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} style={{ border:"1px solid #DDE7F3", borderRadius:8, padding:"12px 16px", background:"#fff", color:"#162033", opacity:step===0?.5:1, fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Previous</button>{step<tabs.length-1?<button onClick={goNext} style={{ border:0, borderRadius:8, padding:"12px 18px", background:"#162033", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Next</button>:<button onClick={submitAdmission} style={{ border:0, borderRadius:8, padding:"12px 18px", background:"#58cc02", color:"#fff", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Submit</button>}</div>
          </section>

          <aside style={{ display:"grid", gap:14 }}><div style={sectionCard}><p style={{ margin:"0 0 8px", color:"#12A37F", fontWeight:900 }}>Auto-save draft</p><p style={{ margin:0, color:"#4B5565", fontWeight:800, lineHeight:1.5 }}>{status}</p></div><div style={sectionCard}><p style={{ margin:"0 0 10px", fontWeight:900 }}>Admission progress</p><div style={{ height:10, borderRadius:999, background:"#E8EEF6", overflow:"hidden" }}><div style={{ width:`${((step+1)/tabs.length)*100}%`, height:"100%", background:"linear-gradient(135deg,#58cc02,#12c99b)" }}/></div><p style={{ margin:"10px 0 0", color:"#687386", fontWeight:800 }}>{tabs[step]} section</p></div><div style={sectionCard}><p style={{ margin:"0 0 10px", fontWeight:900 }}>Fee summary</p><p style={{ margin:0, fontSize:30, fontWeight:900, color:"#162033" }}>Rs {fee.toLocaleString("en-IN")}</p><p style={{ margin:"6px 0 0", color:"#687386", fontWeight:800 }}>{draft.paymentMode}</p></div></aside>
        </div>
      </main>
    </div>
  );
}
function DemoBookingWizard({ mode, accessToken="", leads=[], courses=[], onClose, onBooked }:{
  mode:"public"|"counsellor";
  accessToken?:string;
  leads?:LeadRow[];
  courses?:CourseRow[];
  onClose:()=>void;
  onBooked?:(message:string,data?:unknown)=>void;
}) {
  const courseOptions = courses.length ? courses.map(c=>c.title) : ["Full Stack Web Development","Data Science and AI","Cloud DevOps Engineer","Digital Marketing Mastery"];
  const branches = ["Chennai Branch","Bangalore Branch","Coimbatore Branch"];
  const timings = ["Morning 9:00 AM","Afternoon 2:00 PM","Evening 6:00 PM","Weekend batch"];
  const slots = ["09:30","11:00","15:30","18:00"];
  const steps = ["Personal","Course","Branch","Schedule","Confirm"];
  const [step,setStep]=useState(0);
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  const [status,setStatus]=useState("");
  const [otpSent,setOtpSent]=useState(false);
  const [otpVerified,setOtpVerified]=useState(false);
  const [otpBusy,setOtpBusy]=useState(false);
  const [values,setValues]=useState({
    lead_id:"",
    name:"",
    mobile:"",
    email:"",
    course:courseOptions[0]??"",
    timing:timings[0],
    mode:"online",
    branch:branches[0],
    date:"",
    slot:slots[0],
    otp:"",
  });
  const selectedLead = leads.find(l=>l.id===values.lead_id);
  const inputStyle:CSSProperties={ height:50, borderRadius:14, border:"1px solid #DDE7F3", background:"#fff", padding:"0 14px", fontSize:14, fontWeight:800, color:"#162033", outline:"none", fontFamily:"'Nunito',sans-serif" };
  const progress = ((step+1)/steps.length)*100;
  function setValue(name:string,value:string){
    if(name==="email"){setOtpSent(false);setOtpVerified(false);}
    if(name==="mobile"){setOtpVerified(false);}
    if(name==="otp"){setOtpVerified(false);}
    setValues(cur=>{
      const next={...cur,[name]:value};
      if(name==="lead_id"){
        const lead=leads.find(l=>l.id===value);
        if(lead){next.name=lead.student_name;next.mobile=lead.phone;next.email=lead.email||"";next.course=lead.course_interest||next.course;}
      }
      return next;
    });
  }
  async function sendOtp(){
    if(!values.email){setStatus("Enter email address before sending OTP.");return;}
    setOtpBusy(true);setStatus("Preparing OTP...");
    try{
      const response=await fetch(`${API_URL}/demo-otp/send`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:values.email,mobile:values.mobile})});
      const data=await response.json().catch(()=>({detail:"Unable to send OTP"}));
      if(!response.ok) throw new Error(typeof data.detail==="string"?data.detail:"Unable to send OTP");
      setOtpSent(true);
      setValue("otp","");
      setStatus(data.message?.includes("Test") ? "Test mode: enter email OTP 123456, then click Verify OTP." : `OTP sent to ${values.email}. Please enter the code received in email.`);
    }catch(error){
      const message = error instanceof Error ? error.message : "Unable to send OTP";
      setStatus(message.includes("not configured") ? "Email OTP is not connected. Use OTP_PROVIDER=test for testing, or configure SMTP in backend/.env." : message);
    }
    finally{setOtpBusy(false);}
  }
  async function verifyOtp(){
    if(!values.email||!values.otp){setStatus("Enter email address and OTP.");return false;}
    setOtpBusy(true);setStatus("Verifying OTP...");
    try{
      const response=await fetch(`${API_URL}/demo-otp/verify`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:values.email,mobile:values.mobile,otp:values.otp})});
      const data=await response.json().catch(()=>({detail:"OTP verification failed"}));
      if(!response.ok) throw new Error(typeof data.detail==="string"?data.detail:"OTP verification failed");
      setOtpVerified(true);setStatus("OTP verified successfully.");
      return true;
    }catch(error){setOtpVerified(false);setStatus(error instanceof Error?error.message:"OTP verification failed");return false;}
    finally{setOtpBusy(false);}
  }
  async function submitBooking(){
    setBusy(true);setStatus("Checking slot availability...");
    try{
      await new Promise(resolve=>window.setTimeout(resolve,500));
      setStatus("Preparing confirmation...");
      await new Promise(resolve=>window.setTimeout(resolve,500));
      const demoAt = values.date && values.slot ? `${values.date}T${values.slot}` : "";
      const summary = {
        student_name: values.name,
        phone: values.mobile,
        email: values.email || null,
        course_interest: values.course,
        demo_at: demoAt,
        demo_mode: values.mode,
        branch: values.mode==="offline" ? values.branch : "Online",
      };
      if(mode==="counsellor"){
        if(!values.lead_id) throw new Error("Please select a lead for counsellor demo booking.");
        const response = await fetch(`${API_URL}/crm/leads/${values.lead_id}`,{
          method:"PATCH",
          headers:{ Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json" },
          body:JSON.stringify({
            status:"demo_scheduled",
            next_follow_up_at:demoAt,
            demo_at:demoAt,
            demo_mode:values.mode,
            demo_link:values.mode==="online"?"Demo link will be shared by email":null,
            demo_attended:"pending",
            notes:`Branch: ${summary.branch}\nPreferred timing: ${values.timing}\nOTP verified: ${otpVerified?"yes":"no"}`,
          }),
        });
        if(!response.ok){
          const data=await response.json().catch(()=>({detail:"Demo booking failed"}));
          throw new Error(typeof data.detail==="string"?data.detail:"Demo booking failed");
        }
        const data=await response.json();
        setDone(true);setStatus("Demo scheduled successfully.");
        window.setTimeout(()=>onBooked?.("Demo scheduled successfully.",data),700);
      }else{
        const details = [
          "Pinesphere Demo Class Booking",
          "",
          `Name: ${summary.student_name}`,
          `Mobile: ${summary.phone}`,
          `Email: ${summary.email || "-"}`,
          `Course: ${summary.course_interest}`,
          `Mode: ${summary.demo_mode}`,
          `Branch: ${summary.branch}`,
          `Date and time: ${values.date || "-"} ${values.slot}`,
          `Preferred timing: ${values.timing}`,
          "",
          "Your demo class booking request is confirmed. Our counsellor will share class details shortly.",
        ].join("\n");
        const mailed = values.email ? await sendPublicConfirmationEmail(values.email, "Pinesphere demo class booking confirmed", details).catch(()=>false) : false;
        setDone(true);setStatus(mailed ? "Demo booking request confirmed. Confirmation email sent." : "Demo booking request confirmed. Email preview generated.");
      }
    }catch(error){setStatus(error instanceof Error?error.message:"Demo booking failed");}
    finally{setBusy(false);}
  }
  const canNext = step===0 ? Boolean(values.name&&values.mobile&&values.email&&otpVerified&&(mode==="public"||values.lead_id)) : step===3 ? Boolean(values.date&&values.slot) : true;
  return (
    <div style={{ position:"fixed", inset:0, zIndex:70, display:"flex", alignItems:"center", justifyContent:"center", padding:18, background:"rgba(7,18,38,.58)", backdropFilter:"blur(10px)" }}>
      <div style={{ width:"100%", maxWidth:760, maxHeight:"92vh", overflowY:"auto", borderRadius:28, background:"linear-gradient(180deg,rgba(255,255,255,.96),rgba(246,250,255,.96))", border:"1px solid rgba(255,255,255,.75)", boxShadow:"0 30px 90px rgba(7,18,38,.28)", padding:26 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:18, marginBottom:20 }}>
          <div>
            <p style={{ margin:"0 0 6px", color:"#12A37F", fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:1.2 }}>{mode==="public"?"Public demo booking":"Counsellor demo booking"}</p>
            <h2 style={{ margin:0, fontSize:28, fontWeight:900, color:"#162033" }}>Book a demo class</h2>
            <p style={{ margin:"6px 0 0", color:"#687386", fontWeight:800 }}>Complete the steps to reserve an available class slot.</p>
          </div>
          <button onClick={onClose} style={{ width:42, height:42, borderRadius:14, border:"1px solid #DDE7F3", background:"#fff", cursor:"pointer", color:"#162033" }}><X size={18}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:8, marginBottom:18 }}>
          {steps.map((label,i)=><div key={label} style={{ minWidth:0 }}><div style={{ height:8, borderRadius:999, background:i<=step?"linear-gradient(135deg,#58cc02,#12c99b)":"#E8EEF6" }}/><p style={{ margin:"6px 0 0", fontSize:11, color:i===step?"#162033":"#8A94A6", fontWeight:900, textAlign:"center" }}>{label}</p></div>)}
        </div>
        <div style={{ height:6, borderRadius:999, background:"#E8EEF6", overflow:"hidden", marginBottom:22 }}><div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(135deg,#58cc02,#12c99b)", transition:"width .25s ease" }}/></div>

        {step===0&&<div style={{ display:"grid", gap:14 }}>
          {mode==="counsellor"&&<label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>CRM lead<select value={values.lead_id} onChange={e=>setValue("lead_id",e.target.value)} style={inputStyle}><option value="">Select lead</option>{leads.filter(l=>!["converted","enrolled","lost"].includes(l.status)).map(l=><option key={l.id} value={l.id}>{l.student_name} - {l.phone}</option>)}</select></label>}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}>
            <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Name<input value={values.name} onChange={e=>setValue("name",e.target.value)} placeholder="Student name" style={inputStyle}/></label>
            <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Mobile<input value={values.mobile} onChange={e=>setValue("mobile",e.target.value)} placeholder="+91 mobile number" style={inputStyle}/></label>
            <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Email<input value={values.email} onChange={e=>setValue("email",e.target.value)} placeholder="student@email.com" style={inputStyle}/></label>
          </div>
          <div style={{ borderRadius:18, background:"#FFF7E6", border:"1px solid #FFE0A3", padding:14, color:"#8A5A00", fontWeight:900, display:"grid", gridTemplateColumns:"minmax(0,1fr) auto auto", gap:10, alignItems:"center" }}>
            <span>{otpVerified?"OTP verified. You can continue.":"Send an OTP to the email address, then enter the code received in email."}</span>
            <input value={values.otp} onChange={e=>setValue("otp",e.target.value)} placeholder="123456" style={{ ...inputStyle, width:130, height:40 }}/>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button type="button" onClick={sendOtp} disabled={otpBusy||!values.email} style={{ border:0, borderRadius:12, padding:"10px 14px", background:otpSent?"#162033":"#58cc02", color:"#fff", fontWeight:900, cursor:otpBusy||!values.email?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif" }}>{otpSent?"Resend code":"Send code"}</button>
              <button type="button" onClick={()=>void verifyOtp()} disabled={otpBusy||!otpSent||!values.otp} style={{ border:"1px solid #DDE7F3", borderRadius:12, padding:"10px 14px", background:otpVerified?"#12A37F":"#fff", color:otpVerified?"#fff":"#162033", fontWeight:900, cursor:otpBusy||!otpSent||!values.otp?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif" }}>{otpVerified?"Verified":"Verify OTP"}</button>
            </div>
          </div>
          {status&&step===0&&<p style={{ margin:0, color:otpVerified?"#2F7D00":"#8A5A00", fontWeight:900 }}>{status}</p>}
        </div>}
        {step===1&&<div style={{ display:"grid", gap:14 }}>
          <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Course<select value={values.course} onChange={e=>setValue("course",e.target.value)} style={inputStyle}>{courseOptions.map(c=><option key={c}>{c}</option>)}</select></label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
            <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Preferred timing<select value={values.timing} onChange={e=>setValue("timing",e.target.value)} style={inputStyle}>{timings.map(t=><option key={t}>{t}</option>)}</select></label>
            <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Class mode<select value={values.mode} onChange={e=>setValue("mode",e.target.value)} style={inputStyle}><option value="online">Online</option><option value="offline">Offline</option></select></label>
          </div>
        </div>}
        {step===2&&<div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))", gap:14 }}>{branches.map(branch=><button key={branch} onClick={()=>setValue("branch",branch)} style={{ minHeight:112, borderRadius:20, border:`2px solid ${values.branch===branch?"#58cc02":"#DDE7F3"}`, background:values.branch===branch?"#F0FFE8":"#fff", cursor:"pointer", textAlign:"left", padding:18, fontFamily:"'Nunito',sans-serif" }}><p style={{ margin:0, fontSize:24 }}>ðŸ“</p><p style={{ margin:"10px 0 0", fontWeight:900, color:"#162033" }}>{branch}</p><p style={{ margin:"4px 0 0", color:"#687386", fontSize:12, fontWeight:800 }}>Slots available today</p></button>)}</div>}
        {step===3&&<div style={{ display:"grid", gap:16 }}>
          <label style={{ display:"grid", gap:7, fontSize:12, fontWeight:900, color:"#4B5565" }}>Calendar picker<input type="date" value={values.date} onChange={e=>setValue("date",e.target.value)} style={inputStyle}/></label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))", gap:10 }}>{slots.map(slot=><button key={slot} onClick={()=>setValue("slot",slot)} style={{ borderRadius:16, border:`2px solid ${values.slot===slot?"#12A37F":"#DDE7F3"}`, background:values.slot===slot?"#E9FFF8":"#fff", padding:"13px 10px", fontWeight:900, color:"#162033", fontFamily:"'Nunito',sans-serif" }}>{slot}<br/><span style={{ fontSize:11, color:"#12A37F" }}>Available</span></button>)}</div>
          <div style={{ borderRadius:18, background:"#EEF7FF", padding:14, color:"#2F70FF", fontWeight:900 }}>Slot availability check: {values.date ? "4 slots available" : "Choose a date to check slots"}</div>
        </div>}
        {step===4&&<div style={{ display:"grid", gap:16 }}>
          <div style={{ borderRadius:22, background:"#fff", border:"1px solid #DDE7F3", padding:20 }}>
            <h3 style={{ margin:"0 0 14px", fontSize:22, fontWeight:900, color:"#162033" }}>{done?"Demo booking confirmed":"Confirm demo class"}</h3>
            {["Name: "+values.name,"Mobile: "+values.mobile,"Email: "+(values.email||"-"),"Course: "+values.course,"Mode: "+values.mode,"Branch: "+(values.mode==="offline"?values.branch:"Online"),"Date and time: "+(values.date||"-")+" "+values.slot].map(row=><p key={row} style={{ margin:"8px 0", color:"#4B5565", fontWeight:800 }}>{row}</p>)}
          </div>
          <div style={{ borderRadius:18, background:"#F6FFF0", border:"1px solid #B7E89A", padding:16, color:"#2F7D00", fontWeight:900 }}>Email preview: Your demo for {values.course} is reserved for {values.date||"selected date"} at {values.slot}. Our counsellor will share class details shortly.</div>
          {done&&<div style={{ textAlign:"center", fontSize:42, animation:"publicFloat 1.8s ease-in-out infinite" }}>âœ…</div>}
          {status&&<p style={{ margin:0, color:done?"#2F7D00":"#687386", fontWeight:900 }}>{status}</p>}
        </div>}
        <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginTop:24 }}>
          <button onClick={()=>step===0?onClose():setStep(s=>s-1)} style={{ border:"1px solid #DDE7F3", borderRadius:14, background:"#fff", padding:"13px 20px", fontWeight:900, color:"#4B5565", fontFamily:"'Nunito',sans-serif" }}>{step===0?"Cancel":"Back"}</button>
          {step<4?<button disabled={!canNext} onClick={()=>setStep(s=>s+1)} style={{ border:0, borderRadius:14, background:canNext?"#162033":"#CBD5E1", color:"#fff", padding:"13px 24px", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>Next</button>:<button disabled={busy||done} onClick={submitBooking} style={{ border:0, borderRadius:14, background:done?"#12A37F":busy?"#94A3B8":"linear-gradient(135deg,#58cc02,#12c99b)", color:"#fff", padding:"13px 24px", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}>{done?"Confirmed":busy?"Booking...":"Confirm booking"}</button>}
        </div>
      </div>
    </div>
  );
}
//  LOGIN DIALOG

function InviteAcceptancePage() {
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "";
  const [invite, setInvite] = useState<{ email:string; full_name:string; role:string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState(token ? "Checking invitation..." : "Invite token is missing.");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/accept-invite`, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ token }) })
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail ?? "Invitation is invalid.");
        setInvite(data);
        setStatus("Set your password to activate your account.");
      })
      .catch(error => setStatus(error instanceof Error ? error.message : "Invitation is invalid."));
  }, [token]);

  async function activate(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch(`${API_URL}/auth/set-password`, { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ token, new_password:password, confirm_password:confirmPassword }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail ?? "Password could not be set.");
      setStatus(data.message);
      setInvite(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password could not be set.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:20, background:duo.bgAlt, fontFamily:"'Nunito',sans-serif" }}>
      <section style={{ width:"100%", maxWidth:480, background:"#fff", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:30 }}>
        <h1 style={{ margin:"0 0 8px", color:duo.text }}>Activate Pinesphere ERP</h1>
        {invite ? <p style={{ color:duo.textMuted, fontWeight:700 }}>Hello {invite.full_name}. Your role is {invite.role.replaceAll("_"," ")}.</p> : null}
        <p style={{ color:duo.textMuted, fontWeight:700 }}>{status}</p>
        {invite ? <form onSubmit={activate} style={{ display:"grid", gap:12 }}>
          <input required type="password" minLength={8} placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} style={publicInputStyle}/>
          <input required type="password" minLength={8} placeholder="Confirm password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} style={publicInputStyle}/>
          <button disabled={busy} type="submit" style={{ minHeight:48, borderRadius:duo.radiusSm, background:duo.green, border:`2px solid ${duo.greenDark}`, color:"#fff", fontWeight:900, cursor:"pointer" }}>{busy ? "Activating..." : "Activate account"}</button>
        </form> : <button type="button" onClick={() => { window.location.href="/login"; }} style={{ border:0, background:"transparent", color:duo.greenDark, fontWeight:900, cursor:"pointer", padding:0 }}>Go to login</button>}
      </section>
    </main>
  );
}

// â”€â”€â”€ LOGIN DIALOG â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LoginDialog({ onClose, onLogin }: { onClose:()=>void; onLogin:(s:AuthSession)=>void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [status,   setStatus]   = useState("Use your registered email address to continue.");
  const [busy,     setBusy]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const branchLogins = [
    { label:"Kochi", email:"kochi@pinesphere.com" },
    { label:"Madurai", email:"madurai@pinesphere.com" },
    { label:"Chennai", email:"chennai@pinesphere.com" },
    { label:"Coimbatore", email:"coimbatore@pinesphere.com" },
  ];

  async function readError(r: Response) {
    try { const d = await r.json(); return typeof d.detail==="string"?d.detail:"Request failed"; } catch { return "Request failed"; }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("Enter a valid email address.");
      return;
    }
    if (!password) {
      setStatus("Enter your password.");
      return;
    }
    setBusy(true); setStatus("Signing in securely...");
    try {
      const lr = await fetch(`${API_URL}/auth/login`,{ method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email:email.trim().toLowerCase(),password}) });
      if (!lr.ok) throw new Error(await readError(lr));
      const login = await lr.json() as { access_token:string; refresh_token:string };
      const mr = await fetch(`${API_URL}/auth/me`,{ headers:{ Authorization:`Bearer ${login.access_token}` } });
      if (!mr.ok) throw new Error(await readError(mr));
      const profile = await mr.json() as AuthProfile;
      setStatus(`Welcome back, ${roleDisplayNames[profile.role] ?? "User"}.`);
      await new Promise((resolve) => window.setTimeout(resolve, 350));
      onLogin({ accessToken:login.access_token, refreshToken:login.refresh_token, profile, rememberMe });
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Unable to login");
    } finally { setBusy(false); }
  }

  async function handleForgotPassword() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus("Enter your registered email before requesting a reset.");
      return;
    }
    setBusy(true);
    setStatus("Sending password reset instructions...");
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ email:email.trim().toLowerCase() }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = await response.json() as { message?:string };
      setStatus(data.message ?? "Password reset instructions sent.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Password reset could not be started.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:440, background:"#fff", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:36, boxShadow:"0 8px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ width:64, height:64, borderRadius:20, background:duoGradients.green, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:28, border:`3px solid ${duo.greenDark}`, boxShadow:"0 4px 0 rgba(70,163,2,0.4)" }}>
              ðŸ”
            </div>
            <h2 style={{ fontSize:26, fontWeight:900, color:duo.text, margin:"0 0 4px", letterSpacing:"-0.5px" }}>Login to Pinesphere</h2>
            <p style={{ fontSize:14, color:duo.textMuted, margin:0, fontWeight:600 }}>{status}</p>
          </div>
          <button onClick={onClose} style={{ width:40, height:40, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:duo.bgAlt, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:duo.text }}><X size={18}/></button>
        </div>
        <div style={{ marginTop:20 }}>
          <p style={{ margin:"0 0 8px", color:duo.textMuted, fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.8px" }}>Branch admin login</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,minmax(0,1fr))", gap:8 }}>
            {branchLogins.map((branch) => (
              <button
                key={branch.email}
                type="button"
                onClick={() => {
                  setEmail(branch.email);
                  setPassword("Admin@123");
                  setStatus(`${branch.label} branch login selected.`);
                }}
                style={{ height:42, borderRadius:12, border:`2px solid ${email === branch.email ? duo.greenDark : duo.border}`, background:email === branch.email ? "#E9F8F1" : duo.bgAlt, color:email === branch.email ? duo.greenDark : duo.text, cursor:"pointer", fontWeight:900, fontFamily:"'Nunito',sans-serif" }}
              >
                {branch.label}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop:28, display:"flex", flexDirection:"column", gap:16 }}>
          <label style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13, fontWeight:800, color:duo.text, letterSpacing:"0.2px" }}>
            Email address
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" required autoComplete="email"
              style={{ height:52, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:duo.bgAlt, color:duo.text, padding:"0 16px", fontSize:15, outline:"none", fontFamily:"'Nunito',sans-serif", fontWeight:700, transition:"border-color 0.2s" }}/>
          </label>
          <label style={{ display:"flex", flexDirection:"column", gap:8, fontSize:13, fontWeight:800, color:duo.text, letterSpacing:"0.2px" }}>
            Password
            <div style={{ display:"flex", alignItems:"center", border:`2px solid ${duo.border}`, borderRadius:duo.radiusSm, background:duo.bgAlt, overflow:"hidden" }}>
              <input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?"text":"password"} required autoComplete="current-password"
                style={{ minWidth:0, height:48, flex:1, border:0, background:"transparent", color:duo.text, padding:"0 16px", fontSize:15, outline:"none", fontFamily:"'Nunito',sans-serif", fontWeight:700 }}/>
              <button type="button" onClick={()=>setShowPassword((value)=>!value)} style={{ height:48, padding:"0 14px", border:0, background:"transparent", color:duo.greenDark, cursor:"pointer", fontWeight:900 }}>{showPassword?"Hide":"Show"}</button>
            </div>
          </label>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, fontSize:12, fontWeight:800 }}>
            <label style={{ display:"flex", alignItems:"center", gap:7, color:duo.textMuted }}><input type="checkbox" checked={rememberMe} onChange={(event)=>setRememberMe(event.target.checked)}/>Remember me</label>
            <button type="button" onClick={()=>void handleForgotPassword()} disabled={busy} style={{ border:0, background:"transparent", color:duo.greenDark, cursor:busy?"wait":"pointer", fontSize:12, fontWeight:900 }}>Forgot password?</button>
          </div>
          <button type="submit" disabled={busy}
            style={{ height:56, borderRadius:duo.radiusSm, background:busy?"#a8d98b":duo.green, border:`3px solid ${busy?"#8ab870":duo.greenDark}`, color:"#fff", fontWeight:900, fontSize:16, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":`0 5px 0 rgba(70,163,2,0.5)`, fontFamily:"'Nunito',sans-serif", transition:"all 0.15s", letterSpacing:"0.2px" }}>
            {busy?"Signing in...":"Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

// â”€â”€â”€ AUTHENTICATED APP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ProfileDialog({ accessToken, profile, onClose, onSaved, onPasswordChanged }:{
  accessToken:string; profile:AuthProfile; onClose:()=>void; onSaved:(profile:AuthProfile)=>void; onPasswordChanged:()=>void;
}) {
  const [form, setForm] = useState({ full_name:profile.full_name, phone:profile.phone ?? "", profile_photo:profile.profile_photo ?? "" });
  const [currentProfile, setCurrentProfile] = useState(profile);
  const [passwordForm, setPasswordForm] = useState({ current_password:"", new_password:"", confirm_password:"" });
  const [status, setStatus] = useState<{type:"success"|"error";message:string}|null>(null);
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"profile"|"password"|null>(null);

  useEffect(() => {
    void fetch(`${API_URL}/profile/me`, { headers:{ Authorization:`Bearer ${accessToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profile could not be loaded");
        const loaded = await response.json() as AuthProfile;
        setCurrentProfile(loaded);
        setForm({ full_name:loaded.full_name, phone:loaded.phone ?? "", profile_photo:loaded.profile_photo ?? "" });
      })
      .catch((error) => setStatus({ type:"error", message:error instanceof Error ? error.message : "Profile could not be loaded" }));
  }, [accessToken]);

  function updatePhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setStatus({ type:"error", message:"Choose an image file for your profile photo." });
    if (file.size > 1_500_000) return setStatus({ type:"error", message:"Profile photo must be smaller than 1.5 MB." });
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, profile_photo:String(reader.result ?? "") }));
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.full_name.trim().length < 2) {
      setStatus({ type:"error", message:"Enter your full name." });
      return;
    }
    setConfirmAction("profile");
  }

  async function saveProfile() {
    setBusy(true);
    setStatus(null);
    setConfirmAction(null);
    try {
      const response = await fetch(`${API_URL}/profile/me`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${accessToken}`, "Content-Type":"application/json" },
        body:JSON.stringify({ ...form, full_name:form.full_name.trim(), phone:form.phone.trim() || null }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail:"Profile could not be updated" })) as { detail?:string };
        throw new Error(data.detail ?? "Profile could not be updated");
      }
      const updated = await response.json() as AuthProfile;
      setCurrentProfile(updated);
      onSaved(updated);
      setStatus({ type:"success", message:"Profile updated successfully." });
    } catch (error) {
      setStatus({ type:"error", message:error instanceof Error ? error.message : "Profile could not be updated" });
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus(null);
    if (passwordForm.new_password.length < 8) return setStatus({ type:"error", message:"New password must be at least 8 characters." });
    if (passwordForm.new_password !== passwordForm.confirm_password) return setStatus({ type:"error", message:"New password and confirmation do not match." });
    setConfirmAction("password");
  }

  async function confirmPasswordChange() {
    setPasswordBusy(true);
    setConfirmAction(null);
    try {
      const response = await fetch(`${API_URL}/profile/change-password`, {
        method:"PATCH",
        headers:{ Authorization:`Bearer ${accessToken}`, "Content-Type":"application/json" },
        body:JSON.stringify(passwordForm),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ detail:"Password could not be changed" })) as { detail?:string };
        throw new Error(data.detail ?? "Password could not be changed");
      }
      setStatus({ type:"success", message:"Password changed successfully. Logging you out securely..." });
      window.setTimeout(onPasswordChanged, 700);
    } catch (error) {
      setStatus({ type:"error", message:error instanceof Error ? error.message : "Password could not be changed" });
    } finally {
      setPasswordBusy(false);
    }
  }

  async function sendVerification() {
    setStatus(null);
    try {
      const response = await fetch(`${API_URL}/auth/send-verification`, {
        method:"POST",
        headers:{ Authorization:`Bearer ${accessToken}` },
      });
      const data = await response.json().catch(() => ({ detail:"Verification could not be sent" })) as { message?:string; detail?:string };
      if (!response.ok) throw new Error(data.detail ?? "Verification could not be sent");
      setStatus({ type:"success", message:data.message ?? "Verification email sent." });
    } catch (error) {
      setStatus({ type:"error", message:error instanceof Error ? error.message : "Verification could not be sent" });
    }
  }

  const fieldStyle:CSSProperties = { height:46, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, padding:"0 13px", fontWeight:700, outline:"none" };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:60, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)", padding:16 }}>
      <section style={{ width:"100%", maxWidth:760, maxHeight:"92vh", overflowY:"auto", display:"flex", flexDirection:"column", gap:18, background:"#fff", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:28 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12 }}>
          <div>
            <h2 style={{ margin:0, color:duo.text, fontSize:24, fontWeight:900 }}>My profile</h2>
            <p style={{ margin:"4px 0 0", color:duo.textMuted, fontSize:13, fontWeight:700 }}>{currentProfile.email}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile" style={{ width:40, height:40, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:duo.bgAlt, cursor:"pointer" }}><X size={18}/></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:12, padding:14, borderRadius:duo.radiusSm, background:duo.bgAlt, border:`2px solid ${duo.border}`, color:duo.textMuted, fontSize:12, fontWeight:800 }}>
          <span>Role: <strong style={{ color:duo.text }}>{currentProfile.role.replaceAll("_"," ")} ({currentProfile.role_abbreviation ?? "-"})</strong></span>
          <span>Status: <strong style={{ color:currentProfile.is_active===false?duo.red:duo.greenDark }}>{currentProfile.is_active===false?"Inactive":"Active"}</strong></span>
          <span>Email: <strong style={{ color:duo.text }}>{currentProfile.email_verified?"Verified":"Not verified"}</strong>{currentProfile.email_verified_at?` (${new Date(currentProfile.email_verified_at).toLocaleString()})`:""}</span>
          <span>Branch: <strong style={{ color:duo.text }}>{currentProfile.branch_id ?? "Not assigned"}</strong></span>
          <span>Franchise: <strong style={{ color:duo.text }}>{currentProfile.franchise_id ?? "Not assigned"}</strong></span>
          <span>Last login: <strong style={{ color:duo.text }}>{currentProfile.last_login_at?new Date(currentProfile.last_login_at).toLocaleString():"Not available"}</strong></span>
          <span>IP address: <strong style={{ color:duo.text }}>{currentProfile.last_login_ip ?? "Not available"}</strong></span>
          <span>Browser: <strong style={{ color:duo.text }}>{currentProfile.last_login_browser ?? "Not available"}</strong></span>
          <span>OS: <strong style={{ color:duo.text }}>{currentProfile.last_login_operating_system ?? "Not available"}</strong></span>
          <span style={{ gridColumn:"1 / -1" }}>Device: <strong style={{ color:duo.text }}>{currentProfile.last_login_device ?? "Not available"}</strong></span>
        </div>
        {status ? <p style={{ margin:0, borderRadius:duo.radiusSm, padding:"10px 12px", background:status.type==="success"?duo.greenSoft:duo.redSoft, color:status.type==="success"?duo.greenDark:duo.red, fontSize:13, fontWeight:900 }}>{status.message}</p> : null}
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:13 }}>
          <h3 style={{ margin:0, color:duo.text, fontSize:17, fontWeight:900 }}>Profile details</h3>
          <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:14 }}>
            <div style={{ width:76, height:76, overflow:"hidden", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background:duo.greenSoft, border:`2px solid ${duo.greenDark}`, color:duo.greenDark, fontSize:24, fontWeight:900 }}>
              {form.profile_photo?<Image src={form.profile_photo} alt="Profile preview" width={76} height={76} unoptimized style={{ width:"100%", height:"100%", objectFit:"cover" }}/>:currentProfile.full_name.slice(0,2).toUpperCase()}
            </div>
            <label style={{ color:duo.text, fontSize:13, fontWeight:800 }}>Profile photo<input type="file" accept="image/*" onChange={(event)=>updatePhoto(event.target.files?.[0])} style={{ display:"block", marginTop:7, maxWidth:260, fontSize:12 }}/></label>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:12 }}>
            <label style={{ display:"flex", flexDirection:"column", gap:7, color:duo.text, fontSize:13, fontWeight:800 }}>Full name<input value={form.full_name} onChange={(e)=>setForm((current)=>({...current,full_name:e.target.value}))} required style={fieldStyle}/></label>
            <label style={{ display:"flex", flexDirection:"column", gap:7, color:duo.text, fontSize:13, fontWeight:800 }}>Phone<input value={form.phone} onChange={(e)=>setForm((current)=>({...current,phone:e.target.value}))} style={fieldStyle}/></label>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            {!currentProfile.email_verified ? <button type="button" onClick={()=>void sendVerification()} style={{ height:46, padding:"0 18px", borderRadius:duo.radiusSm, border:`2px solid ${duo.blueDark}`, background:duo.blueSoft, color:duo.blueDark, cursor:"pointer", fontWeight:900 }}>Send verification</button> : null}
            <button type="button" onClick={onClose} style={{ height:46, padding:"0 18px", borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#fff", color:duo.textMuted, cursor:"pointer", fontWeight:900 }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ height:46, padding:"0 20px", borderRadius:duo.radiusSm, border:`2px solid ${duo.greenDark}`, background:duo.green, color:"#fff", cursor:busy?"wait":"pointer", fontWeight:900 }}>{busy?"Saving...":"Save profile"}</button>
          </div>
        </form>
        <form onSubmit={changePassword} style={{ display:"flex", flexDirection:"column", gap:12, paddingTop:16, borderTop:`2px solid ${duo.border}` }}>
          <h3 style={{ margin:0, color:duo.text, fontSize:17, fontWeight:900 }}>Change password</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:12 }}>
            <label style={{ display:"flex", flexDirection:"column", gap:7, color:duo.text, fontSize:13, fontWeight:800 }}>Current password<input type="password" value={passwordForm.current_password} onChange={(e)=>setPasswordForm((current)=>({...current,current_password:e.target.value}))} required style={fieldStyle}/></label>
            <label style={{ display:"flex", flexDirection:"column", gap:7, color:duo.text, fontSize:13, fontWeight:800 }}>New password<input type="password" value={passwordForm.new_password} onChange={(e)=>setPasswordForm((current)=>({...current,new_password:e.target.value}))} required style={fieldStyle}/></label>
            <label style={{ display:"flex", flexDirection:"column", gap:7, color:duo.text, fontSize:13, fontWeight:800 }}>Confirm password<input type="password" value={passwordForm.confirm_password} onChange={(e)=>setPasswordForm((current)=>({...current,confirm_password:e.target.value}))} required style={fieldStyle}/></label>
          </div>
          <button type="submit" disabled={passwordBusy} style={{ alignSelf:"flex-end", height:44, padding:"0 18px", borderRadius:duo.radiusSm, border:`2px solid ${duo.greenDark}`, background:duo.green, color:"#fff", cursor:passwordBusy?"wait":"pointer", fontWeight:900 }}>{passwordBusy?"Changing...":"Change password"}</button>
        </form>
      </section>
      {confirmAction === "profile" ? (
        <ConfirmActionModal
          title="Confirm Profile Update"
          message="Do you want to save these changes?"
          confirmLabel="Save Changes"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void saveProfile()}
          busy={busy}
          danger={false}
        />
      ) : null}
      {confirmAction === "password" ? (
        <ConfirmActionModal
          title="Confirm Password Change"
          message="Are you sure you want to update your password?"
          confirmLabel="Update Password"
          onCancel={() => setConfirmAction(null)}
          onConfirm={() => void confirmPasswordChange()}
          busy={passwordBusy}
          danger={false}
        />
      ) : null}
    </div>
  );
}

function AuthenticatedApp({ accessToken,activeModule,allowedModules,profile,sidebarOpen,isDark,onToggleTheme,onCloseSidebar,onOpenProfile,onRefreshSession,onNavigate,onOpenSidebar }:{
  accessToken:string; activeModule:ModuleLabel; allowedModules:Array<{label:ModuleLabel;icon:IconType}>; profile:AuthProfile;
  sidebarOpen:boolean; isDark:boolean; onToggleTheme:()=>void; onCloseSidebar:()=>void; onOpenProfile:()=>void; onRefreshSession:()=>Promise<string|undefined>;
  onNavigate:(m:ModuleLabel)=>void; onOpenSidebar:()=>void;
}) {
  const ms = moduleStyles[activeModule];
  const isDashboardView = activeModule === "Dashboard";

  const t = isDark ? {
    appBg: duo.bgDark,
    contentBg: duo.bgDarkAlt,
    sidebarBg: "linear-gradient(180deg, #1A1A2A 0%, #1E1E35 100%)",
    sidebarBorder: duo.borderDark,
    topbarBg: "rgba(26,26,42,0.97)",
    topbarBorder: duo.borderDark,
    titleColor: "#FFFFFF",
    subColor: "rgba(255,255,255,0.5)",
    cardBg: "rgba(255,255,255,0.05)",
    cardBorder: "rgba(255,255,255,0.1)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.55)",
    textTertiary: "rgba(255,255,255,0.3)",
  } : {
    appBg: "#F7F7F7",
    contentBg: "#F0F2F5",
    sidebarBg: "linear-gradient(180deg, #FFFFFF 0%, #F7F7F7 100%)",
    sidebarBorder: duo.border,
    topbarBg: isDashboardView ? duoGradients.pineHeader : "rgba(255,255,255,0.97)",
    topbarBorder: isDashboardView ? "#2f7d00" : duo.border,
    titleColor: isDashboardView ? "#FFFFFF" : duo.text,
    subColor: isDashboardView ? "rgba(255,255,255,0.82)" : duo.textMuted,
    cardBg: "#FFFFFF",
    cardBorder: duo.border,
    textPrimary: duo.text,
    textSecondary: duo.textMuted,
    textTertiary: "#AAAAAA",
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:t.appBg, fontFamily:"'Nunito',sans-serif" }}>
      {/* Desktop Sidebar */}
      <aside style={{ display:"none", width:272, flexShrink:0, background:t.sidebarBg, borderRight:`2px solid ${t.sidebarBorder}`, position:"sticky", top:0, height:"100vh", overflow:"hidden" }} className="lg-block">
        <Sidebar modules={allowedModules} activeModule={activeModule} onNavigate={onNavigate} isDark={isDark}/>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:40 }}>
          <button style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.5)", border:"none", cursor:"pointer" }} onClick={onCloseSidebar} aria-label="Close menu"/>
          <aside style={{ position:"relative", height:"100%", width:272, background:t.sidebarBg, boxShadow:"8px 0 40px rgba(0,0,0,0.25)" }}>
            <button onClick={onCloseSidebar} aria-label="Close" style={{ position:"absolute", top:16, right:16, width:36, height:36, borderRadius:duo.radiusSm, border:`2px solid ${t.cardBorder}`, background:t.cardBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:t.textPrimary }}><X size={18}/></button>
            <Sidebar modules={allowedModules} activeModule={activeModule} onNavigate={onNavigate} isDark={isDark}/>
          </aside>
        </div>
      )}

      {/* Main */}
      <section style={{ flex:1, minWidth:0, display:"flex", flexDirection:"column" }}>
        {/* Topbar */}
        <header style={{ position:"sticky", top:0, zIndex:9998, background:t.topbarBg, backdropFilter:"blur(20px)", borderBottom:`2px solid ${t.topbarBorder}`, padding:"0 24px", boxShadow:isDashboardView?"0 8px 24px rgba(47,125,0,0.18)":"none" }}>
          <div style={{ height:68, display:"flex", alignItems:"center", gap:16 }}>
            <button onClick={onOpenSidebar} aria-label="Open menu" className="lg-hidden"
              style={{ width:42, height:42, borderRadius:duo.radiusSm, border:`2px solid ${t.cardBorder}`, background:t.cardBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:t.textPrimary }}>
              <Menu size={20}/>
            </button>
            {/* Module badge */}
            <div style={{ width:44, height:44, borderRadius:14, background:ms.gradient, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0, border:`2px solid ${ms.border}`, boxShadow:`0 4px 0 ${ms.shadow}` }}>
              {ms.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:t.titleColor, lineHeight:1.2, letterSpacing:"-0.3px" }}>{moduleCopy[activeModule].title}</h1>
              <p style={{ margin:0, fontSize:12, color:t.subColor, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>{moduleCopy[activeModule].text}</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button type="button" onClick={onOpenProfile} title="Edit profile" style={{ textAlign:"right", display:"none", border:"none", background:"transparent", cursor:"pointer", fontFamily:"'Nunito',sans-serif" }} className="md-block">
                {/* XP Badge */}
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:4, background:duo.yellowSoft, border:`2px solid ${duo.yellowDark}`, borderRadius:50, padding:"4px 12px" }}>
                    <Flame size={14} color={duo.orange}/><span style={{ fontSize:12, fontWeight:800, color:duo.orangeDark }}>47 ðŸ”¥</span>
                  </div>
                  <p style={{ margin:0, fontSize:14, fontWeight:800, color:isDashboardView?"#FFFFFF":t.textPrimary }}>{profile.full_name}</p>
                </div>
                <p style={{ margin:0, fontSize:11, color:t.subColor, textTransform:"uppercase", letterSpacing:1, fontWeight:700 }}>{profile.role.replaceAll("_"," ")}</p>
              </button>
              <button onClick={onToggleTheme} title={isDark ? "Switch to Light" : "Switch to Dark"}
                style={{ width:42, height:42, borderRadius:duo.radiusSm, border:`2px solid ${t.cardBorder}`, background:t.cardBg, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:isDark?duo.yellow:duo.purpleDark, flexShrink:0 }}>
                {isDark ? <Sun size={18}/> : <Moon size={18}/>}
              </button>
              <ProfileAvatarDropdown user={profile} compact />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className={isDark ? "erp-module-dark" : undefined} style={{ flex:1, padding:"24px", overflow:"auto", background:t.contentBg }}>
          {activeModule==="Dashboard" ? (
            <DashboardContent accessToken={accessToken} onRefreshSession={onRefreshSession} onNavigate={onNavigate} allowedModules={allowedModules.map(m=>m.label)} isDark={isDark}/>
          ) : (
            <ModuleContent accessToken={accessToken} onRefreshSession={onRefreshSession} module={activeModule} profile={profile} isDark={isDark}/>
          )}
        </div>
      </section>

      <FloatingAiChat accessToken={accessToken} isDark={isDark}/>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        .lg-block { display: none !important; }
        .md-block { display: none !important; }
        .lg-hidden { display: flex !important; }
        @media(min-width:1024px){ .lg-block{display:block!important;} .lg-hidden{display:none!important;} }
        @media(min-width:768px){ .md-block{display:block!important;} }
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:${isDark?"rgba(255,255,255,0.03)":duo.bgAlt}}
        ::-webkit-scrollbar-thumb{background:${isDark?"rgba(255,255,255,0.15)":"#DDDDDD"};border-radius:3px}
        input, textarea, select {
          color: ${isDark?"#FFFFFF":duo.text} !important;
          background: ${isDark?"rgba(255,255,255,0.06)":"#FFFFFF"} !important;
          border: 2px solid ${isDark?"rgba(255,255,255,0.15)":duo.border} !important;
          font-family: 'Nunito', sans-serif !important;
          font-weight: 700 !important;
          border-radius: 12px !important;
        }
        input::placeholder, textarea::placeholder {
          color: ${isDark?"rgba(255,255,255,0.3)":"#AAAAAA"} !important;
        }
        input:focus, textarea:focus, select:focus {
          border-color: ${duo.green} !important;
          box-shadow: 0 0 0 3px ${duo.greenSoft} !important;
          outline: none !important;
        }
        select option {
          background: ${isDark?"#1A1A2A":"#FFFFFF"} !important;
          color: ${isDark?"#FFFFFF":duo.text} !important;
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: ${isDark?"invert(1) opacity(0.6)":"opacity(0.5)"};
          cursor: pointer;
        }
        button:active { transform: translateY(2px) !important; }
      `}</style>
    </div>
  );
}

// â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Sidebar({ modules, activeModule, onNavigate, isDark }:{ modules:Array<{label:ModuleLabel;icon:IconType}>; activeModule:ModuleLabel; onNavigate:(m:ModuleLabel)=>void; isDark:boolean }) {
  const [expandedModules, setExpandedModules] = useState<Partial<Record<ModuleLabel, boolean>>>(() => ({ [activeModule]: true }));
  const [activeChild, setActiveChild] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!sidebarDropdowns[activeModule]?.length) return;
      setExpandedModules((current) => ({ ...current, [activeModule]: true }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeModule]);

  const t = isDark ? {
    logoBg:    "rgba(255,255,255,0.07)",
    logoBorder:"rgba(255,255,255,0.12)",
    logoText:  "#FFFFFF",
    logoSub:   "rgba(255,255,255,0.45)",
    sectionLbl:"rgba(255,255,255,0.3)",
    activeBg: "rgba(88,204,2,0.16)",
    activeBorder: "rgba(88,204,2,0.45)",
    activeText: "#A3E635",
    activeIconBg: "rgba(88,204,2,0.22)",
    activeIconBorder: "rgba(88,204,2,0.45)",
    inactiveText:"rgba(255,255,255,0.62)",
    inactiveBg:"transparent",
    inactiveHoverBg:"rgba(88,204,2,0.10)",
    inactiveIconBg:"rgba(255,255,255,0.07)",
    inactiveIconBorder:"rgba(255,255,255,0.1)",
    rail:"rgba(88,204,2,0.24)",
    childText:"rgba(255,255,255,0.72)",
    childActiveBg:"rgba(88,204,2,0.16)",
    badgeBg:   "rgba(88,204,2,0.12)",
    badgeBorder:"rgba(88,204,2,0.3)",
    badgeText: "rgba(255,255,255,0.8)",
    badgeSub:  "rgba(255,255,255,0.4)",
  } : {
    logoBg:    "#F7FFF1",
    logoBorder:"#DDEECF",
    logoText:  duo.text,
    logoSub:   duo.textMuted,
    sectionLbl:duo.textMuted,
    activeBg: "#EAF8DE",
    activeBorder: "#B7E7A0",
    activeText: "#3E9E00",
    activeIconBg: "#DDF4CC",
    activeIconBorder: "#A8DE8B",
    inactiveText:"#5F6F56",
    inactiveBg:"transparent",
    inactiveHoverBg:"#F3FCEB",
    inactiveIconBg:"#F5F7F3",
    inactiveIconBorder:"#E3EAD9",
    rail:"#DDEECF",
    childText:"#5F6F56",
    childActiveBg:"#F3FCEB",
    badgeBg:   "#F6FFF0",
    badgeBorder:"#DDEECF",
    badgeText: duo.text,
    badgeSub:  duo.textMuted,
  };

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column", padding:18, overflow:"hidden" }}>
      {/* Logo */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24, padding:"12px 14px", background:t.logoBg, borderRadius:14, border:`1px solid ${t.logoBorder}` }}>
        <div style={{ width:48, height:48, borderRadius:14, background:duoGradients.green, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0, border:`2px solid ${duo.greenDark}`, boxShadow:"0 4px 0 rgba(70,163,2,0.4)" }}>ðŸŽ“</div>
        <div>
          <p style={{ margin:0, fontWeight:900, fontSize:16, color:t.logoText, lineHeight:1.15 }}>Pinesphere ERP</p>
          <p style={{ margin:0, fontSize:11, color:t.logoSub, fontWeight:700 }}>Student Learning Hub</p>
        </div>
      </div>

      <p style={{ fontSize:10, fontWeight:900, color:t.sectionLbl, letterSpacing:1.8, margin:"0 0 10px 8px", textTransform:"uppercase" }}>Learning Workspace</p>

      <nav style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:4, paddingRight:2 }}>
        {modules.map((item) => {
          const isActive = item.label===activeModule;
          const ms2 = moduleStyles[item.label];
          const displayLabel = item.label;
          const children = sidebarDropdowns[item.label] ?? [];
          const hasChildren = children.length > 0;
          const isExpanded = Boolean(expandedModules[item.label]);
          return (
            <div key={item.label}>
              <button onClick={() => {
                  if (hasChildren) {
                    setExpandedModules((current) => ({ ...current, [item.label]: !current[item.label] }));
                  }
                  setActiveChild(null);
                  onNavigate(item.label);
                }}
                style={{
                  display:"flex", alignItems:"center", gap:12, minHeight:48, padding:"7px 10px", borderRadius:12,
                  border: isActive ? `1px solid ${t.activeBorder}` : "1px solid transparent",
                  background: isActive ? t.activeBg : t.inactiveBg,
                  cursor:"pointer", width:"100%", textAlign:"left", position:"relative", overflow:"hidden",
                  transition:"background 0.15s ease, border-color 0.15s ease, color 0.15s ease",
                  boxShadow: isActive ? "inset 3px 0 0 #58CC02" : "none",
                }}
                onMouseEnter={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.background=t.inactiveHoverBg; }}
                onMouseLeave={e=>{ if(!isActive)(e.currentTarget as HTMLElement).style.background=t.inactiveBg; }}>
                <div style={{
                  width:34, height:34, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17,
                  background: isActive ? t.activeIconBg : t.inactiveIconBg,
                  border: `1px solid ${isActive ? t.activeIconBorder : t.inactiveIconBorder}`,
                  boxShadow: "none",
                }}>
                  {ms2.icon}
                </div>
                <span style={{ fontSize:14, fontWeight: isActive?900:800, color: isActive?t.activeText:t.inactiveText, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {displayLabel}
                </span>
                {hasChildren && (
                  <ChevronRight size={16} style={{ marginLeft:"auto", color:isActive?t.activeText:t.inactiveText, flexShrink:0, transform:isExpanded?"rotate(90deg)":"rotate(0deg)", transition:"transform 0.15s ease" }}/>
                )}
              </button>

              {hasChildren && isExpanded && (
                <div style={{ margin:"5px 0 8px 16px", paddingLeft:18, borderLeft:`1px solid ${t.rail}`, display:"flex", flexDirection:"column", gap:4 }}>
                  {children.map((child) => {
                    const ChildIcon = child.icon;
                    const isChildActive = activeModule === item.label && activeChild === child.label;
                    return (
                      <button key={child.label} onClick={() => { setActiveChild(child.label); onNavigate(item.label); }}
                        style={{
                          display:"flex", alignItems:"center", gap:12, minHeight:42, width:"100%", padding:"6px 10px", borderRadius:12,
                          border:"1px solid transparent", background:isChildActive?t.childActiveBg:"transparent", cursor:"pointer", textAlign:"left",
                          color:isChildActive?t.activeText:t.childText, fontFamily:"'Nunito',sans-serif", transition:"background 0.15s ease, color 0.15s ease",
                        }}
                        onMouseEnter={e=>{ if(!isChildActive)(e.currentTarget as HTMLElement).style.background=t.inactiveHoverBg; }}
                        onMouseLeave={e=>{ if(!isChildActive)(e.currentTarget as HTMLElement).style.background="transparent"; }}>
                        <span style={{ width:32, height:32, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:t.inactiveIconBg, border:`1px solid ${t.inactiveIconBorder}` }}>
                          <ChildIcon size={16}/>
                        </span>
                        <span style={{ fontSize:13, fontWeight:900, minWidth:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{child.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* AI Badge */}
      <div style={{ marginTop:16, padding:"13px 14px", background:t.badgeBg, border:`1px solid ${t.badgeBorder}`, borderRadius:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>ðŸ¤–</span>
          <span style={{ fontSize:12, fontWeight:900, color:t.badgeText }}>AI-powered ERP</span>
        </div>
        <p style={{ margin:"4px 0 0", fontSize:11, color:t.badgeSub, fontWeight:700 }}>âœ… Smart alerts active</p>
      </div>
    </div>
  );
}

// â”€â”€â”€ DASHBOARD CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DashboardContent({ accessToken,allowedModules,onRefreshSession,onNavigate,isDark=false }:{
  accessToken:string; allowedModules:ModuleLabel[]; onRefreshSession:()=>Promise<string|undefined>; onNavigate:(m:ModuleLabel)=>void; isDark?:boolean;
}) {
  const [dashboard, setDashboard] = useState<DashboardResponse|null>(null);
  const [status, setStatus] = useState("Loading live dashboard...");

  useEffect(()=>{
    let alive=true;
    apiRequest<DashboardResponse>("/dashboard/super-admin", accessToken)
      .then(d=>{ if(!alive)return; setDashboard(d); setStatus(""); })
      .catch(err=>{ if(!alive)return; const msg=err instanceof Error?err.message:"Dashboard unavailable"; setDashboard(null); setStatus(msg); if(msg.toLowerCase().includes("token")){setStatus("Refreshing session..."); void onRefreshSession();} });
    return ()=>{ alive=false; };
  },[accessToken,onRefreshSession]);

  const liveMetrics = dashboard ? dashboard.metrics.map(m=>({ ...m, trend:"Updated", icon:metricIconByKey[m.key]??BarChart3, gradient:(metricStyleByKey[m.key]?.gradient??duoGradients.green), shadowColor:(metricStyleByKey[m.key]?.shadow??"rgba(88,204,2,0.35)"), accentColor:(metricStyleByKey[m.key]?.accent??duo.green), borderColor:(metricStyleByKey[m.key]?.border??duo.greenDark), module:metricModuleByKey[m.key]??"Reports" as ModuleLabel })) : [];
  const liveBranches = dashboard?.branch_comparison.map(b=>({ name:b.branch_name, students:b.students, attendance:b.attendance_rate, revenue:formatCurrency(b.revenue), conversion:b.lead_conversion }))??[];
  const liveAlerts = dashboard?.ai_alerts.map(a=>({ title:a.title, message:a.message, level:a.severity, style:alertStyleBySeverity[a.severity]??alertStyleBySeverity.info }))??[];

  const total = dashboard ? `${dashboard.total_students_active+dashboard.total_students_inactive}` : "â€”";
  const rev   = dashboard ? formatCurrency(dashboard.revenue_this_month) : "â€”";
  const att   = dashboard ? `${Math.round(dashboard.attendance_rate_today)}%` : "â€”";
  const insights = dashboard?.ai_insights ?? [];

  const t = isDark ? { cardBg:"rgba(255,255,255,0.05)", cardBorder:"rgba(255,255,255,0.1)", textPrimary:"#FFF", textSecondary:"rgba(255,255,255,0.55)" } :
                     { cardBg:"#FFFFFF", cardBorder:duo.border, textPrimary:duo.text, textSecondary:duo.textMuted };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
      {/* Hero Banner */}
      <div style={{ borderRadius:duo.radiusXl, background:duoGradients.pineHeader, padding:"26px 32px", position:"relative", overflow:"hidden", border:"3px solid #2f7d00", boxShadow:"0 7px 0 rgba(47,125,0,0.35)" }}>
        {/* Decorative circles */}
        <div style={{ position:"absolute", top:-50, right:-50, width:200, height:200, borderRadius:"50%", background:"rgba(255,255,255,0.1)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:-60, right:100, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.07)", pointerEvents:"none" }}/>
        {/* Decorative emoji */}
        <div style={{ position:"absolute", top:16, right:180, fontSize:40, opacity:0.2, pointerEvents:"none" }}>ðŸŒŸ</div>
        <div style={{ position:"absolute", bottom:10, right:60, fontSize:32, opacity:0.15, pointerEvents:"none" }}>ðŸŽ¯</div>
        <div style={{ position:"relative", display:"flex", flexWrap:"wrap", gap:20, alignItems:"center" }}>
          <div style={{ flex:1, minWidth:220 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ fontSize:28 }}>ðŸš€</span>
              <p style={{ margin:0, fontSize:12, fontWeight:900, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:1.5 }}>Command Center</p>
            </div>
            <h2 style={{ margin:"0 0 6px", fontSize:28, fontWeight:900, color:"#fff", lineHeight:1.18, letterSpacing:"-0.5px" }}>Happy learning. Smart management.</h2>
            <p style={{ margin:0, fontSize:14, color:"rgba(255,255,255,0.85)", lineHeight:1.5, fontWeight:700 }}>All your institute operations in one beautiful dashboard.</p>
            {status && <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.2)", borderRadius:50, padding:"6px 16px" }}><span style={{ fontSize:11, color:"#fff", fontWeight:700 }}>â³ {status}</span></div>}
          </div>
          {[["ðŸŽ“","Total Students",total,"Students"],[" ðŸ’°","Revenue",rev,"Finance"],["âœ…","Attendance",att,"HR"]].map(([icon,lbl,val,mod])=>(
            <button key={lbl} onClick={()=>onNavigate(mod as ModuleLabel)} style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(10px)", borderRadius:duo.radius, padding:"15px 20px", minWidth:128, border:"2px solid rgba(255,255,255,0.35)", cursor:"pointer", textAlign:"left", boxShadow:"0 4px 0 rgba(0,0,0,0.1)", transition:"transform 0.1s", fontFamily:"'Nunito',sans-serif" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-3px)";}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";}}>
              <p style={{ margin:"0 0 5px", fontSize:24 }}>{icon}</p>
              <p style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff", letterSpacing:"-0.5px" }}>{val}</p>
              <p style={{ margin:0, fontSize:12, color:"rgba(255,255,255,0.75)", fontWeight:700 }}>{lbl}</p>
            </button>
          ))}
        </div>
      </div>

      {/* AI Insights */}
      <GlassPanel title="ðŸ§  AI Insights" subtitle="Duolingo-style motivation, but focused on institute operations" isDark={isDark}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:12 }}>
          {insights.map((insight)=>(
            <div key={insight.title} style={{ border:`2px solid ${isDark?"rgba(255,255,255,0.1)":duo.yellowDark}`, borderRadius:duo.radius, padding:"14px 16px", background:isDark?"rgba(255,217,0,0.08)":duo.yellowSoft, boxShadow:isDark?"none":"0 3px 0 rgba(230,196,0,0.25)" }}>
              <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:24 }}>{insight.emoji}</span>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                    <p style={{ margin:0, fontSize:14, fontWeight:900, color:t.textPrimary }}>{insight.title}</p>
                    <span style={{ fontSize:10, fontWeight:900, padding:"3px 9px", borderRadius:50, background:duo.orange, color:"#fff" }}>{insight.impact}</span>
                  </div>
                  <p style={{ margin:"6px 0 0", fontSize:12, lineHeight:1.5, fontWeight:700, color:t.textSecondary }}>{insight.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>

      {/* Metric Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(178px,1fr))", gap:12 }}>
        {liveMetrics.filter(m=>allowedModules.includes(m.module as ModuleLabel)).map(m=>(
          <MetricCard key={m.label} metric={m as DisplayMetric} onClick={()=>onNavigate(m.module as ModuleLabel)} isDark={isDark}/>
        ))}
      </div>

      {/* Branch + Alerts */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))", gap:20 }}>
        <GlassPanel title="ðŸ¢ Branch Performance" subtitle="Students, attendance, revenue by branch" isDark={isDark}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {liveBranches.map(b=><BranchRow key={b.name} branch={b} isDark={isDark}/>)}
          </div>
        </GlassPanel>
        <GlassPanel title="ðŸ¤– AI Alerts" subtitle="Smart operating alerts" isDark={isDark}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {liveAlerts.map(a=><AlertTile key={a.title} alert={a} isDark={isDark}/>)}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

// â”€â”€â”€ MODULE CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ModuleContent({ accessToken, module, profile, onRefreshSession, isDark=false }:{ accessToken:string; module:ModuleLabel; profile:AuthProfile; onRefreshSession:()=>Promise<string|undefined>; isDark?:boolean }) {
  const [activeAction, setActiveAction]   = useState<string|null>(null);
  const [editingStudent, setEditingStudent] = useState<UserRow|null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{title:string;endpoint:string;kind:"student"|"lead"|"course"|"invoice"|"branch";id:string}|null>(null);
  const [notice, setNotice]   = useState(`${moduleCopy[module].title} is ready`);
  const [loading, setLoading] = useState(true);
  const [moduleSearch, setModuleSearch] = useState("");
  const [snapshot, setSnapshot] = useState<ApiSnapshot>({ branches:[],courses:[],sessions:[],students:[],users:[],leads:[],enrollments:[],invoices:[],payments:[],securitySummary:null,settingsSummary:null,settingsItems:[],auditLogs:[],securityEvents:[],securitySessions:[] });
  const ms = moduleStyles[module];

  useEffect(()=>{
    let alive=true;
    async function load() {
      setLoading(true);
      try {
        let tok=accessToken;
        async function loadList<T>(ep:string):Promise<T[]>{
          try{return await apiRequest<T[]>(ep,tok);}catch(e){const msg=e instanceof Error?e.message.toLowerCase():"";if(msg.includes("token")){const r=await onRefreshSession();if(r){tok=r;return apiRequest<T[]>(ep,tok);}}return [];}
        }
        const [branches,courses,sessions,students,users,leads,enrollments,invoices,payments,securitySummary,settingsSummary,settingsItems,auditLogs,securityEvents,securitySessions]=await Promise.all([
          module==="Branches"?loadList<BranchAdminRow>("/branches/compare"):Promise.resolve([]),
          loadList<CourseRow>("/lms/courses"),loadList<AttendanceSessionRow>("/attendance/sessions"),
          loadList<UserRow>("/attendance/students"),loadList<UserRow>("/auth/users"),
          loadList<LeadRow>("/crm/leads"),loadList<EnrollmentRow>("/lms/enrollments"),
          loadList<InvoiceRow>("/finance/invoices"),loadList<PaymentRow>("/finance/payments"),
          module==="Security"?apiRequest<SecuritySummaryRow>("/security/summary",tok).catch(()=>null):Promise.resolve(null),
          module==="Settings"?apiRequest<SettingsSummaryRow>("/settings/summary",tok).catch(()=>null):Promise.resolve(null),
          module==="Settings"?loadList<SettingRow>("/settings/items"):Promise.resolve([]),
          module==="Security"?loadList<AuditLogRow>("/security/audit-logs"):Promise.resolve([]),
          module==="Security"?loadList<SecurityEventRow>("/security/events"):Promise.resolve([]),
          module==="Security"?loadList<SecuritySessionRow>("/security/sessions"):Promise.resolve([]),
        ]);
        if(!alive)return;
        setSnapshot({branches,courses,sessions,students,users,leads,enrollments,invoices,payments,securitySummary,settingsSummary,settingsItems,auditLogs,securityEvents,securitySessions});
        setNotice(`${moduleCopy[module].title} ready âœ…`);
      } catch { if(alive)setNotice(`${moduleCopy[module].title} data unavailable`); } finally { if(alive)setLoading(false); }
    }
    load();
    return ()=>{ alive=false; };
  },[accessToken,module,onRefreshSession]);

  const searchText = moduleSearch.trim().toLowerCase();
  const currentRole = profile.role;
  const isStudentLogin = currentRole === "student";
  const isSuperAdmin = currentRole === "super_admin";
  const canManageStudents = ["super_admin", "branch_admin"].includes(currentRole);
  const canManageLms = ["super_admin", "branch_admin", "trainer"].includes(currentRole);
  const canManageCrm = ["super_admin", "counsellor"].includes(currentRole);
  const canManageFinance = ["super_admin", "branch_admin", "finance"].includes(currentRole);
  const actionAccess: Partial<Record<ModuleLabel, boolean>> = {
    Students: canManageStudents,
    LMS: canManageLms,
    CRM: canManageCrm,
    Finance: canManageFinance,
    Users: isSuperAdmin,
    Security: isSuperAdmin,
    Settings: isSuperAdmin,
    HR: ["super_admin", "branch_admin", "hr"].includes(currentRole),
  };
  const moduleActions = actionAccess[module] ? moduleCopy[module].actions : [];
  const activeStudents = snapshot.students.filter((student) => student.is_active && student.student_status !== "removed");
  const studentRows = isStudentLogin ? snapshot.students.filter((student) => student.is_active && student.student_status !== "removed") : activeStudents;
  const visibleUsers = module==="Students"?studentRows:snapshot.users;
  const matchesSearch = (...values: Array<string | number | null | undefined>) => {
    if (!searchText) return true;
    return values.join(" ").toLowerCase().includes(searchText);
  };
  const searchedStudents = isStudentLogin
    ? studentRows
    : studentRows.filter((student) =>
      matchesSearch(student.full_name, student.email, student.phone, student.display_code, student.parent_name, student.parent_phone, student.course_enrolled, student.batch_name, student.trainer_name, student.student_status)
    );
  const searchedLeads = snapshot.leads.filter((lead) =>
    matchesSearch(lead.student_name, lead.parent_name, lead.phone, lead.email, lead.course_interest, lead.source, lead.status, lead.display_code)
  );
  const searchedCourses = snapshot.courses.filter((course) =>
    matchesSearch(course.title, course.description, course.duration, course.difficulty_level, course.status, course.display_code)
  );
  const searchedInvoices = snapshot.invoices.filter((invoice) =>
    matchesSearch(invoice.invoice_number, invoice.course_name, invoice.amount, invoice.paid_amount, invoice.status, invoice.due_date, invoice.display_code)
  );
  const searchedPayments = snapshot.payments.filter((payment) =>
    matchesSearch(payment.amount, payment.payment_method, payment.reference_number, payment.paid_at, payment.invoice_id, payment.student_id)
  );
  const showModuleSearch = ["Students", "CRM", "LMS", "Finance"].includes(module) && !(isStudentLogin && module === "Students");
  const activeRecords = module==="LMS"?snapshot.courses.length:module==="Students"?studentRows.length:module==="CRM"?snapshot.leads.length:module==="Finance"?snapshot.invoices.length:module==="Security"?(snapshot.securitySummary?.active_sessions??0):module==="Settings"?snapshot.settingsItems.length:(module==="HR"||module==="Reports")?snapshot.sessions.length:snapshot.users.length;
  const pendingRecords = isStudentLogin&&module==="Students"?0:module==="LMS"?snapshot.courses.filter(c=>c.status!=="published").length:module==="CRM"?snapshot.leads.filter(l=>["new","contacted","follow_up","demo_scheduled"].includes(l.status)).length:module==="Students"?studentRows.filter(s=>s.document_status==="pending"||s.student_status!=="active").length:module==="Security"?(snapshot.securitySummary?.suspicious_events??0):module==="Settings"?snapshot.settingsItems.filter(s=>!s.is_enabled).length:snapshot.sessions.filter(s=>!s.qr_token).length;

  async function deleteRecord(){
    if(!confirmDelete)return;
    try{
      const r=await fetch(`${API_URL}${confirmDelete.endpoint}`,{method:"DELETE",headers:{Authorization:`Bearer ${accessToken}`}});
      if(!r.ok){const d=await r.json().catch(()=>null);throw new Error(typeof d?.detail==="string"?d.detail:"Delete failed");}
      const del=confirmDelete;
      setSnapshot(cur=>({...cur,branches:del.kind==="branch"?cur.branches.filter(b=>b.id!==del.id):cur.branches,students:del.kind==="student"?cur.students.filter(s=>s.id!==del.id):cur.students,users:del.kind==="student"?cur.users.filter(u=>u.id!==del.id):cur.users,leads:del.kind==="lead"?cur.leads.filter(l=>l.id!==del.id):cur.leads,courses:del.kind==="course"?cur.courses.filter(c=>c.id!==del.id):cur.courses,enrollments:del.kind==="course"?cur.enrollments.filter(e=>e.course_id!==del.id):cur.enrollments,invoices:del.kind==="invoice"?cur.invoices.filter(i=>i.id!==del.id):cur.invoices,payments:del.kind==="invoice"?cur.payments.filter(p=>p.invoice_id!==del.id):cur.payments}));
      setNotice(`${del.title} deleted âœ…`);setConfirmDelete(null);
    }catch(e){setNotice(e instanceof Error?e.message:"Delete failed");}
  }

  const t = isDark ? { statBg:"rgba(255,255,255,0.05)", statBorder:"rgba(255,255,255,0.1)", textPrimary:"#FFF", textSub:"rgba(255,255,255,0.45)", textTertiary:"rgba(255,255,255,0.3)" } :
                     { statBg:"#FFFFFF", statBorder:duo.border, textPrimary:duo.text, textSub:duo.textMuted, textTertiary:"#AAAAAA" };

  function completeModuleAction(message: string, data?: unknown) {
    const payload = data as { audit_log?: AuditLogRow; security_event?: SecurityEventRow; settings?: SettingRow[] } | undefined;
    if (payload?.audit_log) {
      setSnapshot((current) => ({ ...current, auditLogs: [payload.audit_log as AuditLogRow, ...current.auditLogs] }));
    }
    if (payload?.security_event) {
      setSnapshot((current) => ({ ...current, securityEvents: [payload.security_event as SecurityEventRow, ...current.securityEvents] }));
    }
    if (payload?.settings?.length) {
      setSnapshot((current) => {
        const incoming = payload.settings as SettingRow[];
        const ids = new Set(incoming.map((item) => item.id));
        return { ...current, settingsItems: [...incoming, ...current.settingsItems.filter((item) => !ids.has(item.id))] };
      });
    }
    setNotice(message);
    setActiveAction(null);
  }

  if (module === "Users") {
    return <UserManagementPanel accessToken={accessToken} />;
  }

  if (module === "Branches") {
    return <BranchManagementPanel accessToken={accessToken} />;
  }

  if (module === "HR") {
    return (
      <HRCommandCenter
        accessToken={accessToken}
        snapshot={snapshot as never}
        setSnapshot={setSnapshot as never}
        loading={loading}
        notice={notice}
        setNotice={setNotice}
        activeAction={activeAction}
        setActiveAction={setActiveAction}
        ActionModalComponent={ActionModal as never}
      />
    );
  }

  if (module === "Franchise") {
    return <FranchiseOperationsPanel accessToken={accessToken} ActionModalComponent={ActionModal} />;
  }

  if (module === "Reports") {
    return <ReportsAnalyticsPanel accessToken={accessToken} role={currentRole} />;
  }

  if (["Students", "LMS", "CRM", "Finance", "Security", "Settings"].includes(module)) {
    const directoryTitle: Record<string, string> = {
      Students: "Student directory",
      LMS: "Course directory",
      CRM: "Lead pipeline",
      Finance: "Finance directory",
      Security: "Security activity",
      Settings: "System configuration",
    };
    const directorySubtitle: Record<string, string> = {
      Students: "Profiles, courses, batches, documents, and status actions.",
      LMS: "Courses, delivery state, enrollments, and learning actions.",
      CRM: "Leads, course interest, source, demo readiness, and follow-up status.",
      Finance: "Invoices, collections, payment status, and pending dues.",
      Security: "Audit logs, active sessions, failed logins, and risk signals.",
      Settings: "Feature toggles, institute defaults, and enabled platform settings.",
    };
    const kpiRows = [
      { label: "Active records", value: loading ? "..." : `${activeRecords}`, helper: "Live database", color: ms.accent },
      { label: "Pending actions", value: loading ? "..." : `${pendingRecords}`, helper: "Needs review", color: duo.orange },
      { label: "Health score", value: activeRecords ? "100%" : "Ready", helper: "System OK", color: duo.green },
    ];
    const renderRows = () => {
      if (module === "Students") return (
        <AdminDataTable isDark={isDark} columns={["Student", "Course", "Batch", "Docs", "Status"]}
          rows={searchedStudents.slice(0,12).map(s=>({key:s.id,cells:[`${s.full_name}\n${s.display_code||s.id}`,s.course_enrolled||"Pending",s.batch_name||"Pending",s.document_status||"pending",s.student_status||"active"],onView:()=>setNotice(`${s.full_name} selected`),onEdit:()=>setEditingStudent(s),onDisable:()=>setActiveAction("Update status"),onDelete:canManageStudents?()=>setConfirmDelete({title:s.full_name,endpoint:`/auth/users/${s.id}`,kind:"student",id:s.id}):undefined}))}/>
      );
      if (module === "LMS") return (
        <AdminDataTable isDark={isDark} columns={["Course", "Level", "Duration", "Enrollments", "Status"]}
          rows={searchedCourses.slice(0,12).map(c=>{const enr=snapshot.enrollments.filter(e=>e.course_id===c.id);return {key:c.id,cells:[`${c.title}\n${c.display_code||c.id}`,c.difficulty_level,c.duration||"-",String(enr.length),c.status],onView:()=>setNotice(`${c.title} selected`),onEdit:()=>setActiveAction("Upload lesson"),onDisable:()=>setActiveAction("Publish quiz"),onDelete:canManageLms?()=>setConfirmDelete({title:c.title,endpoint:`/lms/courses/${c.id}`,kind:"course",id:c.id}):undefined};})}/>
      );
      if (module === "CRM") return (
        <AdminDataTable isDark={isDark} columns={["Lead", "Course", "Source", "Demo", "Status"]}
          rows={searchedLeads.slice(0,12).map(l=>({key:l.id,cells:[`${l.student_name}\n${l.phone}`,l.course_interest||"Pending",l.source,l.demo_at?formatDate(l.demo_at):"Pending",l.status.replaceAll("_"," ")],onView:()=>setNotice(`${l.student_name} selected`),onEdit:()=>setActiveAction("Follow up"),onDisable:()=>setActiveAction("Schedule demo"),onDelete:canManageCrm?()=>setConfirmDelete({title:l.student_name,endpoint:`/crm/leads/${l.id}`,kind:"lead",id:l.id}):undefined}))}/>
      );
      if (module === "Finance") return (
        <AdminDataTable isDark={isDark} columns={["Invoice", "Course", "Amount", "Paid", "Status"]}
          rows={searchedInvoices.slice(0,12).map(inv=>({key:inv.id,cells:[`${inv.invoice_number}\n${inv.display_code||inv.id}`,inv.course_name||"Pending",`Rs ${inv.amount.toLocaleString("en-IN")}`,`Rs ${inv.paid_amount.toLocaleString("en-IN")}`,inv.status],onView:()=>setNotice(`${inv.invoice_number} selected`),onEdit:()=>setActiveAction("Record payment"),onDisable:()=>setActiveAction("Send reminders"),onDelete:canManageFinance?()=>setConfirmDelete({title:inv.invoice_number,endpoint:`/finance/invoices/${inv.id}`,kind:"invoice",id:inv.id}):undefined}))}/>
      );
      if (module === "Security") return (
        <DataList emptyText="No audit logs yet." isDark={isDark} rows={snapshot.auditLogs.slice(0,10).map(l=>({ key:l.id, title:l.action, meta:`${l.module||"security"} - ${formatDate(l.created_at)}`, value:l.severity||"info", helper:`User ${l.user_id} | IP ${l.ip_address||"-"}` }))}/>
      );
      return (
        <DataList emptyText="No settings found yet." isDark={isDark} rows={snapshot.settingsItems.slice(0,12).map(s=>({ key:s.id, title:s.label, meta:s.description||s.key, value:s.is_enabled?"Enabled":"Disabled", helper:s.category||"General" }))}/>
      );
    };

    return (
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        <section style={{ borderRadius:duo.radiusXl, background:ms.gradient, padding:"26px 30px", border:`3px solid ${ms.border}`, boxShadow:`0 8px 0 ${ms.shadow}`, color:"#fff", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-42, right:-24, width:170, height:170, borderRadius:"50%", background:"rgba(255,255,255,0.10)" }} />
          <div style={{ position:"absolute", bottom:14, right:42, fontSize:52, opacity:0.16 }}>{ms.icon}</div>
          <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", gap:18, flexWrap:"wrap" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16, minWidth:0 }}>
              <div style={{ width:58, height:58, borderRadius:18, background:"rgba(255,255,255,0.24)", border:"2px solid rgba(255,255,255,0.42)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, boxShadow:"0 4px 0 rgba(0,0,0,0.15)" }}>{ms.icon}</div>
              <div style={{ minWidth:0 }}>
                <h2 style={{ margin:0, fontSize:24, fontWeight:900 }}>{moduleCopy[module].title}</h2>
                <p style={{ margin:"6px 0 0", maxWidth:560, fontSize:13, lineHeight:1.6, fontWeight:800, color:"rgba(255,255,255,0.82)" }}>{moduleCopy[module].text}</p>
              </div>
            </div>
            <div style={{ border:"2px solid rgba(255,255,255,0.38)", background:"rgba(255,255,255,0.20)", borderRadius:duo.radiusSm, padding:"9px 16px", fontSize:13, fontWeight:900 }}>{notice}</div>
          </div>
        </section>

        <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))", gap:14 }}>
          {kpiRows.map((item)=>(
            <article key={item.label} style={{ minHeight:112, border:`2px solid ${isDark?"rgba(255,255,255,0.10)":duo.border}`, borderRadius:duo.radius, background:isDark?"rgba(255,255,255,0.05)":"#fff", padding:"18px 20px", boxShadow:isDark?"none":"0 4px 0 rgba(0,0,0,0.06)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                <p style={{ margin:0, fontSize:12, fontWeight:900, color:isDark?"rgba(255,255,255,0.58)":duo.textMuted }}>{item.label}</p>
                <span style={{ width:10, height:10, borderRadius:99, background:item.color }} />
              </div>
              <p style={{ margin:"14px 0 0", fontSize:30, lineHeight:1, fontWeight:900, color:isDark?"#fff":duo.text }}>{item.value}</p>
              <p style={{ margin:"8px 0 0", fontSize:12, fontWeight:800, color:item.color }}>{item.helper}</p>
            </article>
          ))}
        </section>

        <GlassPanel title={`${ms.icon} ${moduleCopy[module].title} workspace`} subtitle="Quick actions and live module search." isDark={isDark}>
          <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) auto", gap:12, alignItems:"center" }}>
            {showModuleSearch ? (
              <div style={{ position:"relative" }}>
                <Search size={17} style={{ position:"absolute", left:14, top:14, color:isDark?"rgba(255,255,255,0.45)":duo.textMuted }} />
                <input value={moduleSearch} onChange={(event)=>setModuleSearch(event.target.value)} placeholder={`Search ${module.toLowerCase()}...`} style={{ width:"100%", height:46, padding:"0 16px 0 42px", borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, fontSize:13, fontWeight:800 }} />
              </div>
            ) : <div />}
            <div style={{ display:"flex", flexWrap:"wrap", justifyContent:"flex-end", gap:10 }}>
              {moduleActions.map(action=>(
                <button key={action} onClick={()=>setActiveAction(action==="History"?`${module} history`:action)} style={{ minHeight:42, padding:"0 18px", borderRadius:duo.radiusSm, border:"2px solid #2f7d00", background:"#58cc02", color:"#FFFFFF", fontWeight:900, cursor:"pointer", boxShadow:"0 4px 0 rgba(47,125,0,0.35)", fontFamily:"'Nunito',sans-serif" }}>{action}</button>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel title={directoryTitle[module]} subtitle={directorySubtitle[module]} isDark={isDark}>
          {renderRows()}
        </GlassPanel>

        {module==="Finance" && (
          <GlassPanel title="Payment activity" subtitle="Latest payment records connected to finance invoices." isDark={isDark}>
            <DataList emptyText="No payments yet. Use Record payment after creating an invoice." isDark={isDark}
              rows={searchedPayments.slice(0,8).map(p=>({ title:`Rs ${p.amount.toLocaleString("en-IN")}`, meta:`${p.payment_method} - ${formatDate(p.paid_at)}`, value:p.reference_number||"paid", helper:`Invoice ${p.invoice_id}` }))}/>
          </GlassPanel>
        )}

        {editingStudent && <StudentEditModal accessToken={accessToken} student={editingStudent} courses={snapshot.courses} onClose={()=>setEditingStudent(null)} onComplete={(student)=>{setSnapshot(cur=>({...cur,students:cur.students.map(s=>s.id===student.id?student:s),users:cur.users.map(u=>u.id===student.id?student:u)}));setEditingStudent(null);setNotice(`${student.full_name} updated âœ…`);}} />}
        {confirmDelete && <ConfirmDeleteModal title={confirmDelete.title} onCancel={()=>setConfirmDelete(null)} onConfirm={deleteRecord}/>}
        {activeAction && <ActionModal accessToken={accessToken} action={activeAction} courses={snapshot.courses} students={studentRows} leads={snapshot.leads} invoices={snapshot.invoices} onClose={()=>setActiveAction(null)} onComplete={completeModuleAction} />}
      </div>
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
      {/* Module Hero */}
      <div style={{ borderRadius:duo.radiusXl, background:ms.gradient, padding:"28px 32px", border:`3px solid ${ms.border}`, boxShadow:`0 8px 0 ${ms.shadow}`, position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:160, height:160, borderRadius:"50%", background:"rgba(255,255,255,0.08)", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:10, right:32, fontSize:48, opacity:0.15, pointerEvents:"none" }}>{ms.icon}</div>
        <div style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <div style={{ width:60, height:60, borderRadius:18, background:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, border:"2px solid rgba(255,255,255,0.4)", boxShadow:"0 4px 0 rgba(0,0,0,0.15)" }}>{ms.icon}</div>
            <div>
              <h2 style={{ margin:0, fontSize:24, fontWeight:900, color:"#fff", letterSpacing:"-0.3px" }}>{moduleCopy[module].title}</h2>
              <p style={{ margin:"4px 0 0", fontSize:13, color:"rgba(255,255,255,0.75)", maxWidth:400, fontWeight:700 }}>{moduleCopy[module].text}</p>
            </div>
          </div>
          <div style={{ background:"rgba(255,255,255,0.25)", borderRadius:duo.radiusSm, padding:"8px 18px", fontSize:13, fontWeight:900, color:"#fff", border:"2px solid rgba(255,255,255,0.35)" }}>{notice}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:12 }}>
        {[["ðŸ“Š Active records",loading?"â³":`${activeRecords}`,"Current",""],["ðŸ”” Pending actions",loading?"â³":`${pendingRecords}`,"Needs review",""],["ðŸ’š Health score",activeRecords?"100%":"Ready","System OK",""]].map(([lbl,val,helper])=>(
          <div key={lbl as string} style={{ background:t.statBg, border:`2px solid ${t.statBorder}`, borderRadius:duo.radius, padding:"18px 20px", boxShadow: isDark?"none":`0 4px 0 rgba(0,0,0,0.06)` }}>
            <p style={{ margin:"0 0 8px", fontSize:12, color:t.textSub, fontWeight:800 }}>{lbl as string}</p>
            <p style={{ margin:0, fontSize:30, fontWeight:900, color:t.textPrimary, letterSpacing:"-1px" }}>{val}</p>
            <p style={{ margin:"4px 0 0", fontSize:11, color:t.textTertiary, fontWeight:700 }}>{helper as string}</p>
          </div>
        ))}
      </div>

      {showModuleSearch && (
        <GlassPanel title={`ðŸ”Ž ${module} search`} subtitle="Search inside this module by name, ID, phone, status, course or record details." isDark={isDark}>
          <div style={{ position:"relative" }}>
            <Search size={18} style={{ position:"absolute", left:14, top:15, color:isDark?"rgba(255,255,255,0.45)":duo.textMuted }} />
            <input
              value={moduleSearch}
              onChange={(event)=>setModuleSearch(event.target.value)}
              placeholder={`Search ${module.toLowerCase()}...`}
              style={{ width:"100%", height:50, padding:"0 16px 0 44px", borderRadius:duo.radiusSm, fontSize:14 }}
            />
          </div>
        </GlassPanel>
      )}

      {/* Actions */}
      {moduleActions.length > 0 && (
      <GlassPanel title={`${ms.icon} ${moduleCopy[module].title} workspace`} subtitle="Actions enabled for your role" isDark={isDark}>
        <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
          {moduleActions.map(action=>(
            <button key={action} onClick={()=>setActiveAction(action==="History"?`${module} history`:action)}
              style={{ padding:"12px 22px", borderRadius:duo.radiusSm, border:`2px solid ${isDark?"rgba(255,255,255,0.15)":duo.border}`, background: isDark?"rgba(255,255,255,0.07)":"#FFFFFF", color: isDark?"#fff":duo.text, fontWeight:800, fontSize:13, cursor:"pointer", transition:"all 0.15s", fontFamily:"'Nunito',sans-serif", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.07)" }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background=ms.gradient;(e.currentTarget as HTMLElement).style.borderColor=ms.border;(e.currentTarget as HTMLElement).style.color="#fff";(e.currentTarget as HTMLElement).style.boxShadow=`0 4px 0 ${ms.shadow}`;}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background= isDark?"rgba(255,255,255,0.07)":"#FFFFFF";(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.15)":duo.border;(e.currentTarget as HTMLElement).style.color=isDark?"#fff":duo.text;(e.currentTarget as HTMLElement).style.boxShadow=isDark?"none":"0 3px 0 rgba(0,0,0,0.07)";}}>
              {action}
            </button>
          ))}
        </div>
      </GlassPanel>
      )}

      {/* Module-specific panels */}
      {module==="Students" && searchedStudents.length>0 && isSuperAdmin && (
        <GlassPanel title="Student directory" subtitle="Student records with profile actions." isDark={isDark}>
          <AdminDataTable isDark={isDark} columns={["Student","Course","Batch","Docs","Status"]}
            rows={searchedStudents.slice(0,12).map(s=>({key:s.id,cells:[`${s.full_name}\n${s.display_code||s.id}`,s.course_enrolled||"Pending",s.batch_name||"Pending",s.document_status||"pending",s.student_status||"active"],onView:()=>setNotice(`${s.full_name} selected`),onEdit:()=>setEditingStudent(s),onDisable:()=>setActiveAction("Update status"),onDelete:()=>setConfirmDelete({title:s.full_name,endpoint:`/auth/users/${s.id}`,kind:"student",id:s.id})}))}/>
        </GlassPanel>
      )}

      {module==="Students" && searchedStudents.length>0 && !isSuperAdmin && (
        <GlassPanel title="ðŸŽ“ Student lifecycle" subtitle="Admission, documents, batch, course readiness" isDark={isDark}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {searchedStudents.slice(0,8).map(s=>(
              <OperationRow key={s.id} title={s.full_name} value={s.student_status||(s.is_active?"active":"inactive")} columns={[`ID ${s.display_code||s.id}`,s.course_enrolled||"Course pending",s.batch_name||"Batch pending",`Docs ${s.document_status||"pending"}`]} progress={s.document_status==="verified"?100:s.course_enrolled?65:35}
                onDelete={canManageStudents?()=>setConfirmDelete({title:s.full_name,endpoint:`/auth/users/${s.id}`,kind:"student",id:s.id}):undefined} isDark={isDark}/>
            ))}
          </div>
        </GlassPanel>
      )}
      {module==="Students" && !searchedStudents.length && !loading && <EmptyState text={isStudentLogin ? "Your student profile is not linked yet. Ask the admin to connect your login to a student record." : moduleSearch ? "No matching active students found." : "No active students yet. Use Add student to create one."} isDark={isDark}/>}

      {module==="CRM" && isSuperAdmin && (
        <GlassPanel title="CRM directory" subtitle="Lead records with admin actions." isDark={isDark}>
          <AdminDataTable isDark={isDark} columns={["Lead","Course","Source","Demo","Status"]}
            rows={searchedLeads.slice(0,12).map(l=>({key:l.id,cells:[`${l.student_name}\n${l.phone}`,l.course_interest||"Pending",l.source,l.demo_at?formatDate(l.demo_at):"Pending",l.status.replaceAll("_"," ")],onView:()=>setNotice(`${l.student_name} selected`),onEdit:()=>setActiveAction("Follow up"),onDisable:()=>setActiveAction("Schedule demo"),onDelete:()=>setConfirmDelete({title:l.student_name,endpoint:`/crm/leads/${l.id}`,kind:"lead",id:l.id})}))}/>
        </GlassPanel>
      )}

      {module==="CRM" && !isSuperAdmin && (
        <GlassPanel title="ðŸ“Š CRM pipeline" subtitle="Lead source, follow-up, demo status, conversion" isDark={isDark}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {searchedLeads.slice(0,8).map(l=>(
              <OperationRow key={l.id} title={l.student_name} value={l.status.replaceAll("_"," ")} columns={[l.source,l.course_interest||"Course pending",l.demo_at?`Demo ${formatDate(l.demo_at)}`:"Demo pending",l.next_follow_up_at?`Follow-up ${formatDate(l.next_follow_up_at)}`:"Follow-up pending"]} progress={l.status==="converted"||l.status==="enrolled"?100:l.status==="demo_scheduled"?70:clampPercent(l.score)}
                onDelete={canManageCrm?()=>setConfirmDelete({title:l.student_name,endpoint:`/crm/leads/${l.id}`,kind:"lead",id:l.id}):undefined} isDark={isDark}/>
            ))}
            {!searchedLeads.length&&!loading&&<EmptyState text={moduleSearch ? "No matching CRM leads found." : "No CRM leads yet. Use Add lead to create one."} isDark={isDark}/>}
          </div>
        </GlassPanel>
      )}

      {module==="LMS" && isSuperAdmin && (
        <GlassPanel title="LMS directory" subtitle="Course records with admin actions." isDark={isDark}>
          <AdminDataTable isDark={isDark} columns={["Course","Level","Duration","Enrollments","Status"]}
            rows={searchedCourses.slice(0,12).map(c=>{const enr=snapshot.enrollments.filter(e=>e.course_id===c.id);return {key:c.id,cells:[`${c.title}\n${c.display_code||c.id}`,c.difficulty_level,c.duration||"-",String(enr.length),c.status],onView:()=>setNotice(`${c.title} selected`),onEdit:()=>setActiveAction("Upload lesson"),onDisable:()=>setActiveAction("Publish quiz"),onDelete:()=>setConfirmDelete({title:c.title,endpoint:`/lms/courses/${c.id}`,kind:"course",id:c.id})};})}/>
        </GlassPanel>
      )}

      {module==="LMS" && !isSuperAdmin && (
        <GlassPanel title="ðŸ“š LMS delivery" subtitle="Course publishing, batch assignment, learner progress" isDark={isDark}>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {searchedCourses.slice(0,8).map(c=>{
              const enr=snapshot.enrollments.filter(e=>e.course_id===c.id);
              const avg=enr.length?enr.reduce((t,e)=>t+e.progress_percent,0)/enr.length:c.status==="published"?50:20;
              return <OperationRow key={c.id} title={c.title} value={c.status} columns={[c.display_code||c.id,c.difficulty_level,c.duration||"Duration pending",`${enr.length} enrollments`]} progress={avg}
                onDelete={canManageLms?()=>setConfirmDelete({title:c.title,endpoint:`/lms/courses/${c.id}`,kind:"course",id:c.id}):undefined} isDark={isDark}/>;
            })}
            {!searchedCourses.length&&!loading&&<EmptyState text={moduleSearch ? "No matching courses found." : "No courses yet. Use Create course to add one."} isDark={isDark}/>}
          </div>
        </GlassPanel>
      )}

      {module==="Finance" && isSuperAdmin && (
        <>
          <GlassPanel title="Finance directory" subtitle="Invoice records with admin actions." isDark={isDark}>
            <AdminDataTable isDark={isDark} columns={["Invoice","Course","Amount","Paid","Status"]}
              rows={searchedInvoices.slice(0,12).map(inv=>({key:inv.id,cells:[`${inv.invoice_number}\n${inv.display_code||inv.id}`,inv.course_name||"Pending",`Rs ${inv.amount.toLocaleString("en-IN")}`,`Rs ${inv.paid_amount.toLocaleString("en-IN")}`,inv.status],onView:()=>setNotice(`${inv.invoice_number} selected`),onEdit:()=>setActiveAction("Record payment"),onDisable:()=>setActiveAction("Send reminders"),onDelete:()=>setConfirmDelete({title:inv.invoice_number,endpoint:`/finance/invoices/${inv.id}`,kind:"invoice",id:inv.id})}))}/>
          </GlassPanel>
          <GlassPanel title="Finance payments" subtitle="Latest payment records" isDark={isDark}>
            <DataList emptyText="No payments yet. Use Record payment after creating an invoice." isDark={isDark}
              rows={searchedPayments.slice(0,8).map(p=>({ title:`Rs ${p.amount.toLocaleString("en-IN")}`, meta:`${p.payment_method} - ${formatDate(p.paid_at)}`, value:p.reference_number||"paid", helper:`Invoice ${p.invoice_id}` }))}/>
          </GlassPanel>
        </>
      )}

      {module==="Finance" && !isSuperAdmin && (
        <>
          <GlassPanel title="ðŸ’° Fee collection" subtitle="Invoices, payment status, dues, collection progress" isDark={isDark}>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {searchedInvoices.slice(0,8).map(inv=>{
                const pending=Math.max(inv.amount-inv.paid_amount,0);
                return <OperationRow key={inv.id} title={inv.invoice_number} value={inv.status} columns={[inv.course_name||"Course pending",`Total Rs ${inv.amount.toLocaleString("en-IN")}`,`Paid Rs ${inv.paid_amount.toLocaleString("en-IN")}`,`Pending Rs ${pending.toLocaleString("en-IN")}`]} progress={inv.amount?(inv.paid_amount/inv.amount)*100:0}
                  onDelete={canManageFinance?()=>setConfirmDelete({title:inv.invoice_number,endpoint:`/finance/invoices/${inv.id}`,kind:"invoice",id:inv.id}):undefined} isDark={isDark}/>;
              })}
              {!searchedInvoices.length&&!loading&&<EmptyState text={moduleSearch ? "No matching invoices found." : "No invoices yet. Use Create invoice to add one."} isDark={isDark}/>}
            </div>
          </GlassPanel>
          <GlassPanel title="ðŸ’³ Finance payments" subtitle="Latest payment records" isDark={isDark}>
            <DataList emptyText="No payments yet. Use Record payment after creating an invoice." isDark={isDark}
              rows={searchedPayments.slice(0,8).map(p=>({ title:`Rs ${p.amount.toLocaleString("en-IN")}`, meta:`${p.payment_method} - ${formatDate(p.paid_at)}`, value:p.reference_number||"paid", helper:`Invoice ${p.invoice_id}` }))}/>
          </GlassPanel>
        </>
      )}

      {module==="Security" && (
        <>
          <GlassPanel title="ðŸ”’ Security dashboard" subtitle="Audit trails, sessions, failed logins" isDark={isDark}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12 }}>
              {[["ðŸ“‹ Audit logs",snapshot.securitySummary?.audit_logs??0],["ðŸŸ¢ Active sessions",snapshot.securitySummary?.active_sessions??0],["ðŸš« Revoked",snapshot.securitySummary?.revoked_sessions??0],["âŒ Failed logins",snapshot.securitySummary?.failed_logins??0],["âš ï¸ Events",snapshot.securitySummary?.suspicious_events??0]].map(([lbl,val])=>(
                <div key={lbl as string} style={{ background: isDark?"rgba(255,255,255,0.04)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.1)":duo.border}`, borderRadius:duo.radiusSm, padding:"14px 16px", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.06)" }}>
                  <p style={{ margin:0, fontSize:11, color: isDark?"rgba(255,255,255,0.45)":duo.textMuted, fontWeight:700 }}>{lbl as string}</p>
                  <p style={{ margin:"6px 0 0", fontSize:26, fontWeight:900, color: isDark?"#fff":duo.text }}>{val as number}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel title="ðŸ“‹ Recent audit logs" subtitle="Sensitive platform actions" isDark={isDark}>
            <DataList emptyText="No audit logs yet." isDark={isDark} rows={snapshot.auditLogs.slice(0,8).map(l=>({ key:l.id, title:l.action==="role_created"?"Role added":l.action==="access_audit_run"?"Access checked":l.action.replaceAll("_"," "), meta:l.new_value||`${l.module||"security"} - ${formatDate(l.created_at)}`, value:l.severity||"info", helper:`Saved ${formatDate(l.created_at)} | IP ${l.ip_address||"-"}` }))}/>
          </GlassPanel>
          <GlassPanel title="Active and revoked sessions" subtitle="Signed-in devices and token status." isDark={isDark}>
            <DataList emptyText="No session records yet." isDark={isDark}
              rows={snapshot.securitySessions.slice(0,8).map(s=>({ key:s.id, title:s.revoked?"Revoked session":"Active session", meta:`Expires ${formatDate(s.expires_at)}`, value:s.revoked?"revoked":"active", helper:`User ${s.user_id} | IP ${s.ip_address||"-"}` }))}/>
          </GlassPanel>
          <GlassPanel title="Security events" subtitle="Failed access, suspicious attempts, and risk notes." isDark={isDark}>
            <DataList emptyText="No security events yet." isDark={isDark}
              rows={snapshot.securityEvents.slice(0,8).map(e=>({ key:e.id, title:e.event_type.replaceAll("_"," "), meta:e.details||"No extra detail", value:e.severity||"info", helper:`${formatDate(e.created_at)} | IP ${e.ip_address||"-"}` }))}/>
          </GlassPanel>        </>
      )}

            {module==="Settings" && (
        <>
          <GlassPanel title="Settings control center" subtitle="This panel stores institute-wide defaults used by the ERP." isDark={isDark}>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12 }}>
              {[["Institute profile",snapshot.settingsSummary?.institute_profile??0],["Academic defaults",snapshot.settingsSummary?.academic_defaults??0],["Notifications",snapshot.settingsSummary?.notifications??0],["Backup and security",snapshot.settingsSummary?.backup_security??0],["Enabled settings",snapshot.settingsSummary?.enabled_settings??0]].map(([lbl,val])=>(
                <div key={lbl as string} style={{ background: isDark?"rgba(255,255,255,0.04)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.1)":duo.border}`, borderRadius:duo.radiusSm, padding:"14px 16px", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.06)" }}>
                  <p style={{ margin:0, fontSize:11, color: isDark?"rgba(255,255,255,0.45)":duo.textMuted, fontWeight:700 }}>{lbl as string}</p>
                  <p style={{ margin:"6px 0 0", fontSize:26, fontWeight:900, color: isDark?"#fff":duo.text }}>{val as number}</p>
                </div>
              ))}
            </div>
          </GlassPanel>
          {[["institute_profile","Institute profile","Name, phone, and public identity used in documents and messages."],["academic_defaults","Academic defaults","Common academic values such as academic year and attendance style."],["notifications","Notifications","Rules for fee reminders, absence alerts, and follow-up messages."],["backup_security","Backup and security","Defaults that protect sessions, backups, and data recovery."]].map(([category,title,subtitle])=>(
            <GlassPanel key={category} title={title} subtitle={subtitle} isDark={isDark}>
              <DataList emptyText={`No ${title.toLowerCase()} settings yet.`} isDark={isDark}
                rows={snapshot.settingsItems.filter(item=>item.category===category).map(item=>({ key:item.id, title:item.label, meta:item.description||"No description", value:item.is_enabled?"enabled":"off", helper:`${item.value} | Updated ${item.updated_at?formatDate(item.updated_at):"recently"}` }))}/>
            </GlassPanel>
          ))}
        </>
      )}
{module==="CRM" && (
        <GlassPanel title="ðŸ“‹ CRM leads" subtitle="Latest leads and admission enquiries" isDark={isDark}>
          <DataList emptyText="No CRM leads yet. Use Add lead to create one." isDark={isDark}
            rows={searchedLeads.slice(0,8).map(l=>({ title:l.student_name, meta:l.email||l.phone, value:l.status.replaceAll("_"," "), helper:`ID: ${l.id} | ${l.course_interest||"No course"} - ${l.source}` }))}/>
        </GlassPanel>
      )}

      {((module==="Students"&&!isStudentLogin&&!isSuperAdmin)||module==="Security") && (
        <GlassPanel title="ðŸ‘¥ Users" subtitle="Student and staff account records" isDark={isDark}>
          <DataList emptyText="No users yet. Use Add user or Add student to create one." isDark={isDark}
            rows={(module==="Students"?searchedStudents:visibleUsers).slice(0,8).map(u=>({ title:u.full_name, meta:module==="Students"?(u.parent_name||"Parent not added"):u.email, value:module==="Students"?u.student_status||(u.is_active?"active":"inactive"):u.role.replaceAll("_"," "), helper:`${u.display_code||u.id} | ${u.course_enrolled||u.branch_id||""}` }))}/>
        </GlassPanel>
      )}

      {(module==="LMS"||module==="Students") && (
        <GlassPanel title="ðŸ“– Courses" subtitle="Available courses and batches" isDark={isDark}>
          <DataList emptyText="No courses yet. Use Create course to add one." isDark={isDark}
            rows={searchedCourses.slice(0,8).map(c=>({ title:c.title, meta:c.description, value:c.status, helper:`${c.display_code||c.id} | ${c.difficulty_level}${c.duration?` - ${c.duration}`:""}` }))}/>
        </GlassPanel>
      )}

      {module==="LMS" && (
        <GlassPanel title="ðŸ“… Attendance sessions" subtitle="Upcoming and recorded class sessions" isDark={isDark}>
          <DataList emptyText="No attendance sessions yet. Use Mark attendance to create one." isDark={isDark}
            rows={snapshot.sessions.slice(0,8).map(s=>({ title:s.title, meta:formatDate(s.session_date), value:s.qr_token?"QR ready":"Manual", helper:s.course_id?`Course ${s.course_id}`:"No course linked" }))}/>
        </GlassPanel>
      )}

      {activeAction && (
        <ActionModal accessToken={accessToken} action={activeAction} courses={snapshot.courses} students={snapshot.students} leads={snapshot.leads} invoices={snapshot.invoices} onClose={()=>setActiveAction(null)} onComplete={msg=>{setNotice(msg);setActiveAction(null);}}/>
      )}
      {editingStudent && (
        <StudentEditModal accessToken={accessToken} student={editingStudent} courses={snapshot.courses} onClose={()=>setEditingStudent(null)} onComplete={(updated)=>{setSnapshot(cur=>({...cur,students:cur.students.map(s=>s.id===updated.id?updated:s),users:cur.users.map(u=>u.id===updated.id?updated:u)}));setNotice(`${updated.full_name} updated successfully.`);setEditingStudent(null);}}/>
      )}
      {confirmDelete && (
        <ConfirmDeleteModal title={confirmDelete.title} onCancel={()=>setConfirmDelete(null)} onConfirm={deleteRecord}/>
      )}
    </div>
  );
}

// â”€â”€â”€ UI COMPONENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function GlassPanel({ title, subtitle, children, isDark=false }: { title:string; subtitle:string; children:ReactNode; isDark?:boolean }) {
  return (
    <div style={{ background: isDark?"rgba(255,255,255,0.05)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.1)":duo.border}`, borderRadius:duo.radiusLg, padding:"22px 24px", boxShadow: isDark?"none":"0 4px 0 rgba(0,0,0,0.06)" }}>
      <div style={{ marginBottom:16 }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:900, color: isDark?"#fff":duo.text, letterSpacing:"-0.2px" }}>{title}</h3>
        <p style={{ margin:"4px 0 0", fontSize:12, color: isDark?"rgba(255,255,255,0.45)":duo.textMuted, fontWeight:600 }}>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function FloatingAiChat({ accessToken, isDark=false }: { accessToken: string; isDark?: boolean }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [chat, setChat] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hi, I am trained on your Pinesphere ERP data. Ask about students, fees, attendance, CRM, LMS, security, or parent updates." },
  ]);

  async function askAi(text = message) {
    const question = text.trim();
    if (!question || busy) return;
    setMessage("");
    setBusy(true);
    setChat((rows) => [...rows, { role: "user", text: question }]);
    try {
      const response = await apiRequest<{ answer: string; suggestions: string[] }>("/ai/chat", accessToken, {
        method: "POST",
        body: JSON.stringify({ message: question }),
      });
      setChat((rows) => [...rows, { role: "assistant", text: response.answer }]);
    } catch (error) {
      setChat((rows) => [
        ...rows,
        { role: "assistant", text: error instanceof Error ? error.message : "AI assistant is unavailable. Please check backend." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position:"fixed", right:24, bottom:24, zIndex:45 }}>
      {open && (
        <div style={{ width:340, maxWidth:"calc(100vw - 48px)", marginBottom:12, borderRadius:duo.radiusLg, border:`2px solid ${isDark?"rgba(255,255,255,0.12)":duo.border}`, background:isDark?"#242438":"#fff", boxShadow:"0 14px 35px rgba(0,0,0,0.22)", overflow:"hidden" }}>
          <div style={{ padding:"16px 18px", background:duoGradients.green, color:"#fff" }}>
            <p style={{ margin:0, fontSize:16, fontWeight:900 }}>AI Assistant</p>
            <p style={{ margin:"4px 0 0", fontSize:12, fontWeight:700, opacity:.9 }}>Trained on Pinesphere ERP data and workflows.</p>
          </div>
          <div style={{ padding:16, display:"grid", gap:10 }}>
            <div style={{ display:"grid", gap:8, maxHeight:230, overflowY:"auto", paddingRight:4 }}>
              {chat.map((item, index)=>(
                <div key={`${item.role}-${index}`} style={{ justifySelf:item.role==="user"?"end":"start", maxWidth:"92%", borderRadius:duo.radiusSm, padding:"9px 11px", background:item.role==="user"?duo.green:(isDark?"rgba(255,255,255,0.08)":"#F7F7F7"), color:item.role==="user"?"#fff":(isDark?"#fff":duo.text), fontSize:12, lineHeight:1.45, fontWeight:700 }}>
                  {item.text}
                </div>
              ))}
              {busy && <div style={{ fontSize:12, fontWeight:800, color:duo.green }}>Thinking...</div>}
            </div>
            {["Find low attendance students", "Show fee follow-up list", "Create parent update summary"].map((prompt)=>(
              <button key={prompt} onClick={()=>askAi(prompt)} style={{ textAlign:"left", padding:"10px 12px", borderRadius:duo.radiusSm, border:`2px solid ${isDark?"rgba(255,255,255,0.1)":duo.border}`, background:isDark?"rgba(255,255,255,0.05)":"#F7F7F7", color:isDark?"#fff":duo.text, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>
                {prompt}
              </button>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8 }}>
              <input
                value={message}
                onChange={(event)=>setMessage(event.target.value)}
                onKeyDown={(event)=>{ if(event.key==="Enter") void askAi(); }}
                placeholder="Type your question..."
                style={{ height:42, padding:"0 12px", borderRadius:duo.radiusSm }}
              />
              <button onClick={()=>askAi()} disabled={busy} style={{ padding:"0 16px", borderRadius:duo.radiusSm, border:`2px solid ${duo.greenDark}`, background:busy?"#9edc76":duo.green, color:"#fff", fontWeight:900, cursor:busy?"not-allowed":"pointer", fontFamily:"'Nunito',sans-serif" }}>Ask</button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={()=>setOpen((value)=>!value)}
        aria-label="Open AI assistant"
        style={{ width:64, height:64, borderRadius:22, border:`3px solid ${duo.greenDark}`, background:duoGradients.green, color:"#fff", fontSize:28, cursor:"pointer", boxShadow:"0 7px 0 rgba(70,163,2,0.45)", display:"grid", placeItems:"center" }}
      >
        ðŸ¦‰
      </button>
    </div>
  );
}

function MetricCard({ metric, onClick, isDark=false }: { metric:DisplayMetric; onClick:()=>void; isDark?:boolean }) {
  return (
    <button onClick={onClick} style={{ background: isDark?"rgba(255,255,255,0.05)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.12)":duo.border}`, borderRadius:16, padding:"15px", textAlign:"left", cursor:"pointer", width:"100%", minHeight:154, position:"relative", overflow:"hidden", transition:"transform 0.15s, box-shadow 0.15s", boxShadow: isDark?"none":"0 4px 0 rgba(0,0,0,0.06)", fontFamily:"'Nunito',sans-serif" }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(-5px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 8px 0 ${metric.shadowColor}`;(e.currentTarget as HTMLElement).style.borderColor=metric.borderColor;}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow=isDark?"none":"0 4px 0 rgba(0,0,0,0.06)";(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.12)":duo.border;}}>
      <div style={{ position:"absolute", top:0, left:0, right:0, height:5, background:metric.gradient, borderRadius:"14px 14px 0 0" }}/>
      <div style={{ width:40, height:40, borderRadius:12, background:metric.gradient, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, border:`2px solid ${metric.borderColor}`, boxShadow:`0 3px 0 ${metric.shadowColor}` }}>
        <metric.icon size={19} style={{ color: "#fff" }}/>
      </div>
      <p style={{ margin:"0 0 3px", fontSize:11, color: isDark?"rgba(255,255,255,0.5)":duo.textMuted, fontWeight:900, textTransform:"uppercase" }}>{metric.label}</p>
      <p style={{ margin:"0 0 3px", fontSize:23, fontWeight:900, color: isDark?"#fff":duo.text, letterSpacing:"-0.5px" }}>{metric.value}</p>
      <p style={{ margin:"0 0 8px", fontSize:11, color: isDark?"rgba(255,255,255,0.4)":duo.textMuted, lineHeight:1.35, fontWeight:700 }}>{metric.helper}</p>
      <div style={{ display:"inline-flex", alignItems:"center", gap:4, background: isDark?"rgba(88,204,2,0.15)":duo.greenSoft, border:`1px solid ${duo.greenDark}`, borderRadius:50, padding:"3px 12px" }}>
        <span style={{ fontSize:11, fontWeight:800, color: isDark?"#58CC02":duo.greenDark }}>âœ… {metric.trend}</span>
      </div>
    </button>
  );
}

function BranchRow({ branch, isDark=false }: { branch:{name:string;students:number;attendance:number;revenue:string;conversion:number}; isDark?:boolean }) {
  return (
    <div style={{ background: isDark?"rgba(255,255,255,0.04)":"#F7FBF0", border:`2px solid ${isDark?"rgba(255,255,255,0.08)":duo.border}`, borderRadius:duo.radius, padding:"14px 16px", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <p style={{ margin:0, fontWeight:800, color: isDark?"#fff":duo.text, fontSize:14 }}>ðŸ¢ {branch.name}</p>
        <div style={{ background:duo.greenSoft, border:`2px solid ${duo.greenDark}`, borderRadius:50, padding:"3px 12px" }}>
          <p style={{ margin:0, fontWeight:900, color:duo.greenDark, fontSize:13 }}>{branch.revenue}</p>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:10 }}>
        {[`ðŸ‘¨â€ðŸŽ“ ${branch.students}`,`âœ… ${branch.attendance}%`,`ðŸŽ¯ ${branch.conversion}%`].map(t=>(
          <p key={t} style={{ margin:0, fontSize:12, color: isDark?"rgba(255,255,255,0.5)":duo.textMuted, fontWeight:700 }}>{t}</p>
        ))}
      </div>
      <div style={{ height:10, borderRadius:50, background: isDark?"rgba(255,255,255,0.08)":"#E8F5DA", overflow:"hidden", border:`1px solid ${isDark?"transparent":duo.greenSoft}` }}>
        <div style={{ height:"100%", width:`${branch.attendance}%`, borderRadius:50, background:duoGradients.green, transition:"width 1s ease" }}/>
      </div>
    </div>
  );
}

function AlertTile({ alert, isDark=false }: { alert:{title:string;message:string;level:string;style:{accent:string;soft:string;border:string;emoji:string}}; isDark?:boolean }) {
  const s = alert.style;
  return (
    <div style={{ borderRadius:duo.radius, padding:"14px 16px", background: isDark?"rgba(255,255,255,0.04)":s.soft, border:`2px solid ${s.border}`, position:"relative", overflow:"hidden", boxShadow: isDark?"none":`0 3px 0 rgba(0,0,0,0.06)` }}>
      <div style={{ position:"absolute", left:0, top:0, bottom:0, width:5, background:s.accent, borderRadius:"4px 0 0 4px" }}/>
      <div style={{ paddingLeft:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
          <p style={{ margin:0, fontWeight:900, color: isDark?"#fff":duo.text, fontSize:14 }}>{s.emoji} {alert.title}</p>
          <span style={{ fontSize:11, fontWeight:900, padding:"4px 12px", borderRadius:50, background:s.accent, color:"#fff", textTransform:"uppercase", letterSpacing:"0.3px" }}>{alert.level}</span>
        </div>
        <p style={{ margin:0, fontSize:12, color: isDark?"rgba(255,255,255,0.55)":duo.textMuted, lineHeight:1.5, fontWeight:600 }}>{alert.message}</p>
      </div>
    </div>
  );
}

function AdminDataTable({ columns, rows, isDark=false }: { columns:string[]; rows:Array<{key:string;cells:string[];onView?:()=>void;onEdit?:()=>void;onDisable?:()=>void;onDelete?:()=>void}>; isDark?:boolean }) {
  if (!rows.length) return <EmptyState text="No records found yet." isDark={isDark}/>;
  const border = isDark ? "rgba(255,255,255,0.1)" : duo.border;
  return (
    <div style={{ overflowX:"auto", border:`2px solid ${border}`, borderRadius:duo.radius, background:isDark?"rgba(255,255,255,0.03)":"#fff" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:760, fontSize:12 }}>
        <thead style={{ background:isDark?"rgba(88,204,2,0.12)":"#F0FBE6" }}>
          <tr>
            {columns.map(c=><th key={c} style={{ padding:"12px 14px", textAlign:"left", color:isDark?"rgba(255,255,255,0.65)":duo.textMuted, fontWeight:900, textTransform:"uppercase", fontSize:10, borderBottom:`1px solid ${border}` }}>{c}</th>)}
            <th style={{ padding:"12px 14px", textAlign:"center", color:isDark?"rgba(255,255,255,0.65)":duo.textMuted, fontWeight:900, textTransform:"uppercase", fontSize:10, borderBottom:`1px solid ${border}` }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={row.key} style={{ background:i%2===0?(isDark?"rgba(255,255,255,0.02)":"#FFFFFF"):(isDark?"rgba(88,204,2,0.04)":"#FBFFF7"), borderBottom:`1px solid ${border}` }}>
              {row.cells.map((cell,idx)=>(
                <td key={`${row.key}-${idx}`} style={{ padding:"12px 14px", color:isDark?"#fff":duo.text, fontWeight:idx===0?900:700, whiteSpace:"pre-line", verticalAlign:"middle" }}>{cell}</td>
              ))}
              <td style={{ padding:"10px 12px", textAlign:"center", whiteSpace:"nowrap" }}>
                <div style={{ display:"inline-flex", gap:6 }}>
                  <IconAction label="View" symbol="ðŸ‘" onClick={row.onView}/>
                  <IconAction label="Edit" symbol="âœŽ" onClick={row.onEdit}/>
                  <IconAction label="Disable" symbol="â»" onClick={row.onDisable}/>
                  <IconAction label="Delete" symbol="ðŸ—‘" danger onClick={row.onDelete}/>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IconAction({ label, symbol, onClick, danger=false }:{label:string;symbol:string;onClick?:()=>void;danger?:boolean}) {
  return (
    <button title={label} aria-label={label} onClick={onClick} disabled={!onClick}
      style={{ width:30, height:30, borderRadius:8, border:`1px solid ${danger?duo.redDark:duo.border}`, background:onClick?(danger?duo.redSoft:"#fff"):"#f3f3f3", color:danger?duo.red:duo.text, cursor:onClick?"pointer":"not-allowed", fontWeight:900 }}>
      {symbol}
    </button>
  );
}

function DataList({ emptyText, rows, isDark=false }: { emptyText:string; rows:Array<{key?:string;title:string;meta:string;value:string;helper:string}>; isDark?:boolean }) {
  if (!rows.length) return <EmptyState text={emptyText} isDark={isDark}/>;
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12 }}>
      {rows.map((row,i)=>(
        <div key={row.key??`${row.title}-${i}`} style={{ background: isDark?"rgba(255,255,255,0.04)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.08)":duo.border}`, borderRadius:duo.radius, padding:"14px 16px", transition:"all 0.15s", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.05)" }}
          onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.2)":duo.greenDark;(e.currentTarget as HTMLElement).style.transform="translateY(-2px)";(e.currentTarget as HTMLElement).style.boxShadow=`0 6px 0 ${isDark?"rgba(88,204,2,0.2)":"rgba(70,163,2,0.15)"}`;}}
          onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor=isDark?"rgba(255,255,255,0.08)":duo.border;(e.currentTarget as HTMLElement).style.transform="translateY(0)";(e.currentTarget as HTMLElement).style.boxShadow=isDark?"none":"0 3px 0 rgba(0,0,0,0.05)";}}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:8 }}>
            <div style={{ minWidth:0 }}>
              <p style={{ margin:0, fontWeight:800, fontSize:14, color: isDark?"#fff":duo.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{row.title}</p>
              <p style={{ margin:"4px 0 0", fontSize:12, color: isDark?"rgba(255,255,255,0.5)":duo.textMuted, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", fontWeight:600 }}>{row.meta}</p>
            </div>
            <span style={{ flexShrink:0, fontSize:11, fontWeight:800, padding:"4px 12px", borderRadius:50, background: isDark?"rgba(88,204,2,0.15)":duo.greenSoft, color: isDark?duo.green:duo.greenDark, border:`1px solid ${isDark?"rgba(88,204,2,0.3)":duo.greenDark}` }}>{row.value}</span>
          </div>
          <p style={{ margin:0, fontSize:11, color: isDark?"rgba(255,255,255,0.3)":duo.textMuted, background: isDark?"rgba(255,255,255,0.04)":"#F7F7F7", borderRadius:8, padding:"6px 10px", wordBreak:"break-all", fontWeight:600, border:`1px solid ${isDark?"rgba(255,255,255,0.06)":duo.border}` }}>{row.helper}</p>
        </div>
      ))}
    </div>
  );
}

function OperationRow({ title,value,columns,progress,onDelete,isDark=false }: { title:string;value:string;columns:string[];progress:number;onDelete?:()=>void;isDark?:boolean }) {
  const safe=clampPercent(progress);
  const progressColor = safe>=80?duo.green:safe>=50?duo.orange:duo.red;
  return (
    <div style={{ background: isDark?"rgba(255,255,255,0.04)":"#FFFFFF", border:`2px solid ${isDark?"rgba(255,255,255,0.08)":duo.border}`, borderRadius:duo.radius, padding:"14px 16px", boxShadow: isDark?"none":"0 3px 0 rgba(0,0,0,0.05)" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, marginBottom:10 }}>
        <p style={{ margin:0, fontWeight:800, color: isDark?"#fff":duo.text, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{title}</p>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <span style={{ fontSize:12, fontWeight:800, padding:"4px 14px", borderRadius:50, background: isDark?"rgba(88,204,2,0.15)":duo.greenSoft, color: isDark?duo.green:duo.greenDark, border:`1px solid ${isDark?"rgba(88,204,2,0.3)":duo.greenDark}`, textTransform:"capitalize" }}>{value}</span>
          {onDelete && <button onClick={onDelete} style={{ fontSize:12, fontWeight:800, padding:"4px 14px", borderRadius:50, background:duo.redSoft, border:`2px solid ${duo.redDark}`, color:duo.red, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>ðŸ—‘ï¸ Delete</button>}
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))", gap:6, marginBottom:10 }}>
        {columns.map(c=><p key={c} style={{ margin:0, fontSize:12, color: isDark?"rgba(255,255,255,0.45)":duo.textMuted, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>{c}</p>)}
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ flex:1, height:10, borderRadius:50, background: isDark?"rgba(255,255,255,0.08)":"#E8F5DA", overflow:"hidden", border:`1px solid ${isDark?"rgba(255,255,255,0.06)":duo.greenSoft}` }}>
          <div style={{ height:"100%", width:`${safe}%`, borderRadius:50, background:`linear-gradient(90deg, ${progressColor}, ${safe>=80?duo.teal:safe>=50?duo.yellow:duo.red})`, transition:"width 1s ease" }}/>
        </div>
        <div style={{ background: isDark?"rgba(255,255,255,0.08)":duo.greenSoft, border:`1px solid ${duo.greenDark}`, borderRadius:50, padding:"2px 10px", minWidth:50, textAlign:"center" }}>
          <p style={{ margin:0, fontSize:12, fontWeight:900, color: isDark?duo.green:duo.greenDark }}>{safe}%</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, isDark=false }: { text:string; isDark?:boolean }) {
  return (
    <div style={{ padding:"32px", borderRadius:duo.radius, border:`2px dashed ${isDark?"rgba(255,255,255,0.2)":duo.greenDark}`, textAlign:"center", background: isDark?"transparent":duo.greenSoft }}>
      <p style={{ fontSize:32, marginBottom:8 }}>ðŸŒ±</p>
      <p style={{ margin:0, fontSize:13, color: isDark?"rgba(255,255,255,0.45)":duo.greenDark, fontWeight:700 }}>{text}</p>
    </div>
  );
}

function StudentEditModal({ accessToken,student,courses,onClose,onComplete }:{
  accessToken:string;student:UserRow;courses:CourseRow[];onClose:()=>void;onComplete:(student:UserRow)=>void;
}) {
  const fields:FormField[] = studentFields().map(f=>f.name==="password"?{...f,required:false,defaultValue:""}:f);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(fields.map(f=>[f.name,String((student as unknown as Record<string, unknown>)[f.name]??f.defaultValue??"")])));
  const [responseText,setResponseText]=useState("");
  const [busy,setBusy]=useState(false);
  const inputStyle:CSSProperties={ height:48, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#FAFAFA", color:duo.text, padding:"0 14px", fontSize:14, outline:"none", width:"100%", fontFamily:"'Nunito',sans-serif", fontWeight:700 };

  function setValue(name:string,value:string){setValues(cur=>({...cur,[name]:value}));}
  function optionsFor(field:FormField){return field.name==="course_enrolled"?courses.map(c=>({label:c.title,value:c.title})):(field.options??[]);}
  async function readError(r:Response){try{const d=await r.json();return typeof d.detail==="string"?d.detail:JSON.stringify(d.detail??d);}catch{return "Student update failed";}}
  async function handleSubmit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    setBusy(true);setResponseText("");
    try{
      const body=Object.fromEntries(Object.entries(values).map(([k,v])=>[k,v===""?null:v]));
      if(!values.password) delete body.password;
      const r=await fetch(`${API_URL}/auth/users/${student.id}`,{method:"PATCH",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok) throw new Error(await readError(r));
      onComplete(await r.json() as UserRow);
    }catch(error){setResponseText(error instanceof Error?error.message:"Student update failed");}
    finally{setBusy(false);}
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:55, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:760, maxHeight:"90vh", overflowY:"auto", background:"#FFFFFF", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:32, boxShadow:"0 12px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:duo.text }}>Edit student details</h2>
            <p style={{ margin:"6px 0 0", fontSize:13, color:duo.textMuted, fontWeight:600 }}>{student.full_name} | {student.display_code||student.id}</p>
          </div>
          <button onClick={onClose} style={{ width:40, height:40, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:duo.bgAlt, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:duo.text }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>
          {fields.map(f=>(
            <label key={f.name} style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, fontWeight:900, color:duo.text, letterSpacing:"0.3px", textTransform:"uppercase", gridColumn:f.type==="textarea"?"1 / -1":undefined }}>
              {f.label}
              {f.type==="textarea"?(
                <textarea value={values[f.name]??""} onChange={e=>setValue(f.name,e.target.value)} required={f.required} style={{ ...inputStyle, height:88, padding:"10px 14px", resize:"vertical", textTransform:"none" }}/>
              ):f.type==="select"||f.name==="course_enrolled"?(
                <select value={values[f.name]??""} onChange={e=>setValue(f.name,e.target.value)} required={f.required} style={{ ...inputStyle, cursor:"pointer", textTransform:"none" }}>
                  <option value="">Select {f.label}</option>
                  {optionsFor(f).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ):(
                <input value={values[f.name]??""} onChange={e=>setValue(f.name,e.target.value)} type={f.type??"text"} required={f.required} placeholder={f.name==="password"?"Leave blank to keep current password":undefined} style={{ ...inputStyle, textTransform:"none" }}/>
              )}
            </label>
          ))}
          {responseText&&<pre style={{ gridColumn:"1 / -1", maxHeight:160, overflowY:"auto", background:duo.bgAlt, borderRadius:duo.radiusSm, padding:14, fontSize:11, color:duo.redDark, margin:0, border:`2px solid ${duo.border}` }}>{responseText}</pre>}
          <div style={{ gridColumn:"1 / -1", display:"flex", justifyContent:"flex-end", gap:10, marginTop:8 }}>
            <button type="button" onClick={onClose} style={{ padding:"12px 22px", borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#fff", color:duo.textMuted, fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cancel</button>
            <button type="submit" disabled={busy} style={{ padding:"12px 28px", borderRadius:duo.radiusSm, background:busy?"#a8d98b":duo.green, border:`2px solid ${busy?"#8ab870":duo.greenDark}`, color:"#fff", fontWeight:900, fontSize:13, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":`0 5px 0 rgba(70,163,2,0.5)`, fontFamily:"'Nunito',sans-serif" }}>{busy?"Saving...":"Save details"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ActionModal({ accessToken,action,courses=[],students=[],leads=[],invoices=[],onClose,onComplete }:{
  accessToken:string;action:string;courses?:CourseRow[];students?:UserRow[];leads?:LeadRow[];invoices?:InvoiceRow[];onClose:()=>void;onComplete:(m:string,data?:unknown)=>void;
}) {
  const config=getActionConfig(action);
  const [values,setValues]=useState<Record<string,string>>(()=>Object.fromEntries(config.fields.map(f=>[f.name,f.defaultValue??""])));
  const [responseText,setResponseText]=useState("");
  const [historyRows,setHistoryRows]=useState<HistoryEventRow[]|null>(null);
  const [busy,setBusy]=useState(false);
  const runningRef=useRef(false);
  const isAutoLoad=config.method==="GET"&&config.fields.length===0;
  if(action==="Schedule demo") {
    return <DemoBookingWizard mode="counsellor" accessToken={accessToken} leads={leads} courses={courses} onClose={onClose} onBooked={onComplete} />;
  }

  function updateValue(name:string,val:string){
    setValues(cur=>{
      const next={...cur,[name]:val};
      if(name==="student_id"){const s=students.find(x=>x.id===val);if(s){next.branch_id=s.branch_id||"";next.course_name=s.course_enrolled||next.course_name||"";}}
      if(name==="user_id"){const s=students.find(x=>x.id===val);if(s){next.branch_id=s.branch_id||"";next.batch_name=s.batch_name||"";next.trainer_name=s.trainer_name||"";}}
      if(name==="invoice_id"){const inv=invoices.find(x=>x.id===val);if(inv){next.student_id=inv.student_id;}}
      return next;
    });
  }

  async function readError(r:Response){try{const d=await r.json();return typeof d.detail==="string"?d.detail:JSON.stringify(d.detail??d);}catch{return "Request failed";}}

  async function runAction(){
    if(runningRef.current)return;
    if(config.planned||!config.endpoint){onComplete(`${config.title}: not available yet.`);return;}
    runningRef.current=true;
    setBusy(true);setResponseText("Sending... ðŸš€");setHistoryRows(null);
    try{
      const ep=config.endpoint.replace("{course_id}",values.course_id??"").replace("{lead_id}",values.lead_id??"");
      const body=config.buildBody?config.buildBody(values):values;
      const r=await fetch(`${API_URL}${ep}`,{method:config.method??"POST",headers:{Authorization:`Bearer ${accessToken}`,...(config.method==="GET"?{}:{"Content-Type":"application/json"})},...(config.method==="GET"?{}:{body:JSON.stringify(body)})});
      if(!r.ok)throw new Error(await readError(r));
      const data=await r.json();
      if(isAutoLoad&&Array.isArray(data)){setHistoryRows(data as HistoryEventRow[]);setResponseText("");}
      else{setResponseText(JSON.stringify(data,null,2));}
      if(config.method!=="GET")onComplete(config.successMessage??`${config.title} completed.`, data);
    }catch(e){setResponseText(e instanceof Error?e.message:"Action failed");}finally{runningRef.current=false;setBusy(false);}
  }

  async function handleSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();await runAction();}
  useEffect(()=>{if(isAutoLoad){const t=window.setTimeout(()=>{void runAction();},0);return()=>window.clearTimeout(t);}}, [action]);

  function getSelectOptions(field:FormField){
    if((action==="Assign batch"||action==="Upload lesson"||action==="Publish quiz"||action==="Mark attendance")&&field.name==="course_id") return courses.map(c=>({label:`${c.title} (${c.display_code||c.id})`,value:c.id}));
    if((action==="Assign batch"||action==="Create invoice")&&field.name==="student_id") return students.filter(s=>s.is_active).map(s=>({label:`${s.full_name} (${s.display_code||s.id})`,value:s.id}));
    if(action==="Update status"&&field.name==="user_id") return students.filter(s=>s.is_active).map(s=>({label:`${s.full_name} (${s.display_code||s.id})`,value:s.id}));
    if((action==="Follow up"||action==="Schedule demo")&&field.name==="lead_id") return leads.filter(l=>action==="Schedule demo"?!["lost","converted","enrolled"].includes(l.status):!["converted","enrolled"].includes(l.status)).map(l=>({label:`${l.student_name} - ${l.course_interest||"No course"} (${l.id})`,value:l.id}));
    if(action==="Record payment"&&field.name==="invoice_id") return invoices.filter(i=>i.status!=="paid").map(i=>({label:`${i.invoice_number} - Rs ${i.amount.toLocaleString("en-IN")} (${i.id})`,value:i.id}));
    if((action==="Create invoice"||action==="Add lead"||action==="Add student")&&(field.name==="course_name"||field.name==="course_interest"||field.name==="course_enrolled")) return courses.map(c=>({label:c.title,value:c.title}));
    return field.options??[];
  }

  const needsSelect=(f:FormField)=>f.type==="select"||(action==="Assign batch"&&f.name==="course_id")||(action==="Update status"&&f.name==="user_id")||((action==="Follow up"||action==="Schedule demo")&&f.name==="lead_id")||(action==="Record payment"&&f.name==="invoice_id");

  const inputStyle:CSSProperties={ height:48, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#FAFAFA", color:duo.text, padding:"0 14px", fontSize:14, outline:"none", width:"100%", fontFamily:"'Nunito',sans-serif", fontWeight:700 };

  return (
    <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", padding:16 }}>
      <div style={{ width:"100%", maxWidth:600, maxHeight:"90vh", overflowY:"auto", background:"#FFFFFF", border:`3px solid ${duo.border}`, borderRadius:duo.radiusXl, padding:32, boxShadow:"0 12px 0 rgba(0,0,0,0.12)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <h2 style={{ margin:0, fontSize:22, fontWeight:900, color:duo.text, letterSpacing:"-0.3px" }}>{config.title}</h2>
            <p style={{ margin:"6px 0 0", fontSize:13, color:duo.textMuted, fontWeight:600 }}>{config.description}</p>
          </div>
          <button onClick={onClose} style={{ width:40, height:40, borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:duo.bgAlt, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:duo.text }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {config.fields.map(f=>(
            <label key={f.name} style={{ display:"flex", flexDirection:"column", gap:6, fontSize:12, fontWeight:900, color:duo.text, letterSpacing:"0.3px", textTransform:"uppercase" }}>
              {f.label}
              {f.type==="textarea"?(
                <textarea value={values[f.name]??""} onChange={e=>updateValue(f.name,e.target.value)} required={f.required} style={{ ...inputStyle, height:80, padding:"10px 14px", resize:"vertical", textTransform:"none" }}/>
              ):needsSelect(f)?(
                <select value={values[f.name]??""} onChange={e=>updateValue(f.name,e.target.value)} required={f.required} style={{ ...inputStyle, cursor:"pointer", textTransform:"none" }}>
                  <option value="">Select {f.label}</option>
                  {getSelectOptions(f).map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ):(
                <input value={values[f.name]??""} onChange={e=>updateValue(f.name,e.target.value)} type={f.type??"text"} required={f.required} style={{ ...inputStyle, textTransform:"none" }}/>
              )}
            </label>
          ))}
          {historyRows&&<HistoryTable rows={historyRows}/>}
          {responseText&&<pre style={{ maxHeight:200, overflowY:"auto", background:duo.bgAlt, borderRadius:duo.radiusSm, padding:14, fontSize:11, color:duo.purpleDark, margin:0, border:`2px solid ${duo.border}` }}>{responseText}</pre>}
          <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:8 }}>
            <button type="button" onClick={onClose} style={{ padding:"12px 22px", borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, background:"#fff", color:duo.textMuted, fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"'Nunito',sans-serif" }}>Cancel</button>
            {!isAutoLoad&&<button type="submit" disabled={busy} style={{ padding:"12px 28px", borderRadius:duo.radiusSm, background:busy?"#a8d98b":duo.green, border:`2px solid ${busy?"#8ab870":duo.greenDark}`, color:"#fff", fontWeight:900, fontSize:13, cursor:busy?"not-allowed":"pointer", boxShadow:busy?"none":`0 5px 0 rgba(70,163,2,0.5)`, fontFamily:"'Nunito',sans-serif" }}>{busy?"Saving... ðŸš€":"Submit âœ…"}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

function HistoryTable({ rows }:{ rows:HistoryEventRow[] }) {
  if(!rows.length) return <div style={{ padding:"24px", borderRadius:duo.radiusSm, border:`2px dashed ${duo.border}`, textAlign:"center", fontSize:13, color:duo.textMuted, fontWeight:700 }}>ðŸŒ± No history found yet.</div>;
  return (
    <div style={{ borderRadius:duo.radiusSm, border:`2px solid ${duo.border}`, overflow:"hidden" }}>
      <div style={{ maxHeight:320, overflowY:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, minWidth:600 }}>
          <thead style={{ background:duo.bgAlt }}>
            <tr>{["Date","Action","Title","Details","Record ID"].map(h=><th key={h} style={{ padding:"10px 14px", textAlign:"left", color:duo.textMuted, fontWeight:900, borderBottom:`2px solid ${duo.border}`, textTransform:"uppercase", letterSpacing:"0.5px", fontSize:10 }}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} style={{ borderBottom:`1px solid ${duo.border}` }}>
                <td style={{ padding:"10px 14px", color:duo.textMuted, fontWeight:600 }}>{formatDate(r.created_at)}</td>
                <td style={{ padding:"10px 14px" }}><span style={{ background:duo.purpleSoft, color:duo.purpleDark, padding:"3px 10px", borderRadius:50, fontSize:11, fontWeight:800, border:`1px solid ${duo.purpleDark}` }}>{r.action}</span></td>
                <td style={{ padding:"10px 14px", color:duo.text, fontWeight:800 }}>{r.title}</td>
                <td style={{ padding:"10px 14px", color:duo.textMuted, maxWidth:200, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:600 }}>{r.details||"-"}</td>
                <td style={{ padding:"10px 14px", color:duo.textMuted, fontFamily:"monospace", fontSize:11 }}>{r.record_id||"-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ title,onCancel,onConfirm }:{ title:string;onCancel:()=>void;onConfirm:()=>void }) {
  return <ConfirmActionModal title="Confirm Delete" message={`This action cannot be undone. Are you sure you want to continue? Selected record: ${title}.`} confirmLabel="Yes, Delete" onCancel={onCancel} onConfirm={onConfirm}/>;
}
