/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Reports
Purpose     : Renders and coordinates Reports UI behavior
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
  Activity,
  BarChart3,
  BellRing,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Cloud,
  Database,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  LineChart as LineChartIcon,
  Mail,
  Network,
  Printer,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

import { API_URL, apiRequest } from "../shared/api";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type ReportsAnalyticsPayload = {
  generated_at: string;
  scope: {
    role: string;
    branch_id?: string | null;
    modules: string[];
    all_branches: boolean;
  };
  kpis: Record<string, number>;
  revenue_series: Array<{ label: string; revenue: number; madurai: number; chennai: number; online: number }>;
  attendance: {
    rate: number;
    alerts: number;
    heatmap: Array<{ day: string; value: number }>;
  };
  branch_performance: Array<{ name: string; revenue: number; students: number; attendance: number }>;
  crm_funnel: Array<{ stage: string; value: number }>;
  lms: {
    courses: number;
    completion: number;
    quiz_score: number;
    engagement: number;
  };
  fee_collection: Array<{ name: string; value: number }>;
  insights: Array<{ title: string; severity: string; timestamp: string; action: string; detail: string }>;
  monitoring: Record<string, number | string>;
};

type IconType = typeof Users;
type ReportFormat = "PDF" | "CSV" | "Excel";
type ReportBuilderState = {
  module: string;
  branch: string;
  dateRange: string;
  category: string;
  format: ReportFormat;
  search: string;
};
type ActivityRow = {
  avatar: string;
  action: string;
  module: string;
  badge: string;
  time: string;
};
type ScheduledReportRow = {
  name: string;
  next: string;
  channels: string;
  enabled: boolean;
};

const green = "#58cc02";
const greenDark = "#2f7d00";
const muted = "#5f6f56";
const chartColors = ["#58cc02", "#16a34a", "#0ea5e9", "#f59e0b", "#ef4444", "#8b5cf6"];

const fallbackPayload: ReportsAnalyticsPayload = {
  generated_at: new Date().toISOString(),
  scope: { role: "super_admin", branch_id: null, modules: ["crm", "students", "lms", "attendance", "finance", "hr", "franchise", "ai"], all_branches: true },
  kpis: {
    total_students: 1248,
    active_branches: 8,
    monthly_revenue: 1860000,
    attendance_rate: 91.8,
    pending_fees: 261000,
    new_leads_today: 37,
    lms_completion_rate: 78.4,
    staff_productivity_score: 88.6,
  },
  revenue_series: [
    { label: "18 May", revenue: 142000, madurai: 48000, chennai: 62000, online: 32000 },
    { label: "19 May", revenue: 168000, madurai: 54000, chennai: 72000, online: 42000 },
    { label: "20 May", revenue: 152000, madurai: 51000, chennai: 64000, online: 37000 },
    { label: "21 May", revenue: 191000, madurai: 62000, chennai: 84000, online: 45000 },
    { label: "22 May", revenue: 214000, madurai: 70000, chennai: 91000, online: 53000 },
    { label: "23 May", revenue: 206000, madurai: 68000, chennai: 87000, online: 51000 },
    { label: "24 May", revenue: 231000, madurai: 76000, chennai: 98000, online: 57000 },
    { label: "25 May", revenue: 248000, madurai: 82000, chennai: 104000, online: 62000 },
  ],
  attendance: {
    rate: 91.8,
    alerts: 23,
    heatmap: [
      { day: "Mon", value: 94 },
      { day: "Tue", value: 89 },
      { day: "Wed", value: 96 },
      { day: "Thu", value: 78 },
      { day: "Fri", value: 92 },
      { day: "Sat", value: 86 },
    ],
  },
  branch_performance: [
    { name: "Madurai", revenue: 420000, students: 410, attendance: 89 },
    { name: "Chennai", revenue: 530000, students: 386, attendance: 94 },
    { name: "Coimbatore", revenue: 310000, students: 214, attendance: 91 },
    { name: "Online", revenue: 390000, students: 238, attendance: 87 },
  ],
  crm_funnel: [
    { stage: "Inquiry", value: 420 },
    { stage: "Demo", value: 286 },
    { stage: "Proposal", value: 162 },
    { stage: "Enrolled", value: 98 },
  ],
  lms: { courses: 46, completion: 78, quiz_score: 84, engagement: 87 },
  fee_collection: [
    { name: "Paid", value: 1560000 },
    { name: "Pending", value: 214000 },
    { name: "Overdue", value: 87000 },
  ],
  insights: [
    { title: "Branch Madurai revenue dropped by 12%", severity: "High", timestamp: "8 min ago", action: "Open branch recovery", detail: "Collections dropped across two premium batches. AI recommends counsellor-led renewal follow-up and fee reminder automation." },
    { title: "23 students below 75% attendance", severity: "Warning", timestamp: "14 min ago", action: "Send attendance nudges", detail: "Risk is concentrated in weekend Python and full-stack cohorts. Notify students and parents before the next class window." },
    { title: "Finance recovery required for overdue fees", severity: "Critical", timestamp: "21 min ago", action: "Create recovery queue", detail: "Overdue exposure is rising faster than paid invoices. Prioritize students with upcoming certification milestones." },
    { title: "AI predicts 18% growth next month", severity: "Positive", timestamp: "31 min ago", action: "Review forecast", detail: "CRM demo velocity, LMS completion, and franchise demand indicate stronger enrollment conversion next month." },
    { title: "Trainer productivity decreased this week", severity: "Warning", timestamp: "46 min ago", action: "Review HR workload", detail: "Session completion stayed healthy, but pending assignments increased. Balance workload before the next payroll cycle." },
  ],
  monitoring: {
    api_health: 99.98,
    database_status: "Online",
    active_sessions: 312,
    report_queue: 7,
    ai_engine_status: "Learning",
    notification_delivery_rate: 98.6,
    employees: 74,
  },
};

const kpiConfig: Array<{ key: string; label: string; icon: IconType; trend: string; compare: string; status: string; tone: string }> = [
  { key: "total_students", label: "Total Students", icon: GraduationCap, trend: "+8.4%", compare: "vs previous month", status: "Live", tone: "#58cc02" },
  { key: "active_branches", label: "Active Branches", icon: Network, trend: "+2", compare: "branch capacity expanded", status: "Stable", tone: "#16a34a" },
  { key: "monthly_revenue", label: "Monthly Revenue", icon: CircleDollarSign, trend: "+18.2%", compare: "vs previous month", status: "Strong", tone: "#0ea5e9" },
  { key: "attendance_rate", label: "Attendance Rate", icon: CheckCircle2, trend: "+3.1%", compare: "vs previous month", status: "Healthy", tone: "#58cc02" },
  { key: "pending_fees", label: "Pending Fees", icon: TrendingDown, trend: "-6.7%", compare: "recovery improving", status: "Watch", tone: "#f59e0b" },
  { key: "new_leads_today", label: "New Leads Today", icon: Sparkles, trend: "+12", compare: "from all CRM sources", status: "Hot", tone: "#8b5cf6" },
  { key: "lms_completion_rate", label: "LMS Completion Rate", icon: BarChart3, trend: "+5.8%", compare: "vs previous month", status: "Rising", tone: "#14b8a6" },
  { key: "staff_productivity_score", label: "Staff Productivity Score", icon: BriefcaseBusiness, trend: "-2.4%", compare: "needs HR review", status: "Review", tone: "#ef4444" },
];

const initialRecentReports = [
  ["Finance export downloaded", "Finance", "CSV", "2 min ago"],
  ["Attendance report emailed", "Attendance", "PDF", "11 min ago"],
  ["Branch analytics viewed", "Branches", "Live", "18 min ago"],
  ["AI report created", "AI", "PDF", "34 min ago"],
];

const initialScheduledReports: ScheduledReportRow[] = [
  { name: "Daily Finance Summary", next: "6:30 PM", channels: "Email, PDF", enabled: true },
  { name: "Weekly Attendance Report", next: "Mon 8:00 AM", channels: "Email, CSV", enabled: true },
  { name: "Monthly Branch Analytics", next: "1 Jun 9:00 AM", channels: "PDF, Excel", enabled: true },
  { name: "Franchise Revenue Report", next: "Fri 5:00 PM", channels: "Email", enabled: false },
  { name: "HR Productivity Report", next: "Wed 10:00 AM", channels: "Excel", enabled: true },
];

const initialActivityRows: ActivityRow[] = [
  { avatar: "AK", action: "Report generated", module: "Reports", badge: "Super Admin", time: "now" },
  { avatar: "FM", action: "Finance export downloaded", module: "Finance", badge: "CSV", time: "2m" },
  { avatar: "BA", action: "Branch analytics viewed", module: "Branches", badge: "Live", time: "8m" },
  { avatar: "AT", action: "Attendance report emailed", module: "Attendance", badge: "PDF", time: "15m" },
  { avatar: "AI", action: "AI report created", module: "AI", badge: "Forecast", time: "28m" },
];

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function ReportsAnalyticsPanel({ accessToken, role }: { accessToken: string; role: string }) {
  const [payload, setPayload] = useState<ReportsAnalyticsPayload>(fallbackPayload);
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [status, setStatus] = useState("Connecting to analytics engine...");
  const [period, setPeriod] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  const [openInsight, setOpenInsight] = useState<string | null>(fallbackPayload.insights[0]?.title ?? null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [actionStatus, setActionStatus] = useState("All report actions are ready.");
  const [recentRows, setRecentRows] = useState(initialRecentReports);
  const [activityRows, setActivityRows] = useState<ActivityRow[]>(initialActivityRows);
  const [scheduledRows, setScheduledRows] = useState<ScheduledReportRow[]>(initialScheduledReports);
  const [builder, setBuilder] = useState<ReportBuilderState>({
    module: "All modules",
    branch: "All branches",
    dateRange: "Last 7 days",
    category: "Executive",
    format: "PDF",
    search: "",
  });

  useEffect(() => {
    let alive = true;

    async function loadAnalytics() {
      try {
        const data = await apiRequest<ReportsAnalyticsPayload>("/reports/analytics", accessToken);
        if (!alive) return;
        setPayload({ ...fallbackPayload, ...data });
        setStatus("Live from FastAPI reports engine");
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      } catch (error) {
        if (!alive) return;
        setStatus(error instanceof Error ? `Fallback mode: ${error.message}` : "Fallback analytics mode");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAnalytics();
    const refresh = window.setInterval(loadAnalytics, 30000);
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => {
      alive = false;
      window.clearInterval(refresh);
    };
  }, [accessToken]);

  useEffect(() => {
    const wsUrl = `${API_URL.replace(/^http/, "ws")}/reports/live?token=${encodeURIComponent(accessToken)}`;
    const socket = new WebSocket(wsUrl);
    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as Partial<ReportsAnalyticsPayload> & { type?: string };
      if (data.kpis || data.monitoring) {
        setPayload((current) => ({
          ...current,
          generated_at: data.generated_at ?? current.generated_at,
          kpis: { ...current.kpis, ...(data.kpis ?? {}) },
          monitoring: { ...current.monitoring, ...(data.monitoring ?? {}) },
        }));
        setStatus("Real-time WebSocket sync active");
      }
    };
    socket.onerror = () => setStatus((current) => (current.includes("FastAPI") ? current : "Auto-refresh mode active"));
    return () => socket.close();
  }, [accessToken]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const effectiveRole = payload.scope?.role ?? role;
  const roleLabel = effectiveRole.replaceAll("_", " ");
  const isSuperAdmin = effectiveRole === "super_admin";
  const isFinance = effectiveRole === "finance";
  const isHr = effectiveRole === "hr";
  const isBranch = effectiveRole === "branch_admin";

  const visibleKpis = useMemo(() => {
    if (isFinance) return kpiConfig.filter((item) => ["monthly_revenue", "pending_fees"].includes(item.key));
    if (isHr) return kpiConfig.filter((item) => item.key === "staff_productivity_score");
    if (isBranch) return kpiConfig.filter((item) => !["active_branches", "staff_productivity_score"].includes(item.key));
    return kpiConfig;
  }, [isBranch, isFinance, isHr]);
  const revenueChartData = useMemo(() => buildRevenueView(payload.revenue_series, period), [payload.revenue_series, period]);

  const branchStack = payload.branch_performance.map((item) => ({
    name: item.name,
    revenue: Math.max(8, Math.round(item.revenue / 10000)),
    students: Math.max(8, Math.round(item.students / 5)),
    attendance: Math.max(8, Math.round(item.attendance)),
  }));
  const lastUpdated = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", day: "2-digit", month: "short" }).format(now);
  const moduleOptions = roleOptions(effectiveRole, "module");
  const safeBuilder = {
    ...builder,
    module: moduleOptions.includes(builder.module) ? builder.module : moduleOptions[0],
  };
  const savedTemplates = [
    ["CEO Snapshot", "All modules", "PDF", "Pinned"],
    ["Finance Recovery", "Finance", "Excel", "Pinned"],
    ["Trainer Scorecard", "HR", "CSV", "Pinned"],
  ];
  const filteredRecentRows = filterRows(recentRows, safeBuilder.search);
  const filteredTemplates = filterRows(savedTemplates, safeBuilder.search);
  const exportActions: Array<{ icon: IconType; label: string; onClick: () => void }> = [
    { icon: FileSpreadsheet, label: "Download CSV", onClick: () => exportReport("CSV") },
    { icon: FileText, label: "Download PDF", onClick: () => exportReport("PDF") },
    { icon: FileSpreadsheet, label: "Download Excel", onClick: () => exportReport("Excel") },
    { icon: Mail, label: "Email Report", onClick: emailReport },
    { icon: Printer, label: "Print Report", onClick: printReport },
    { icon: Share2, label: "Share to Branch Admin", onClick: shareReport },
  ];
  const studentGrowth = revenueChartData.map((item, index) => ({ label: item.label, students: 84 + index * 12 + Math.round((item.revenue % 19000) / 2200) }));
  const revenueSplit = [
    { name: "Fees", value: payload.kpis.monthly_revenue || 780000 },
    { name: "LMS", value: Math.max(92000, (payload.kpis.monthly_revenue || 780000) * 0.18) },
    { name: "Franchise", value: Math.max(134000, (payload.kpis.monthly_revenue || 780000) * 0.24) },
  ];
  const leadSources = [
    { name: "Facebook", value: 32 },
    { name: "WhatsApp", value: 27 },
    { name: "Website", value: 18 },
    { name: "Referral", value: 14 },
    { name: "Walk-in", value: 9 },
  ];
  const aiForecast = revenueChartData.map((item, index) => ({ label: item.label, forecast: Math.round(item.revenue * (1.08 + index * 0.015)), students: 92 + index * 9 }));
  const feeRecovery = [
    { label: "0-7 days", value: 82, tone: "#58cc02" },
    { label: "8-15 days", value: 64, tone: "#f59e0b" },
    { label: "16+ overdue", value: 38, tone: "#ef4444" },
  ];
  const batchPerformance = [
    ["Python AI", "94%", "+12"],
    ["Full Stack", "89%", "+8"],
    ["Data Analytics", "86%", "+6"],
  ];
  const lmsTimeline = revenueChartData.map((item, index) => ({ label: item.label, learners: 210 + index * 22, completions: 54 + index * 8 }));
  const parentUsage = revenueChartData.map((item, index) => ({
    label: item.label,
    parents: 118 + index * 14,
    logins: 420 + index * 36,
    payments: 42 + index * 5,
    attendance: 96 + index * 9,
    reports: 58 + index * 7,
    messages: 24 + index * 4,
  }));
  const parentUsageMetrics = [
    ["Daily active parents", "64%"],
    ["Weekly parent logins", "2.8k"],
    ["Fee payment clicks", "318"],
    ["Attendance views", "1.4k"],
    ["Progress report views", "892"],
    ["Parent message activity", "246"],
  ];
  const franchiseLeaderboard = payload.branch_performance.slice(0, 5).map((item, index) => ({
    name: item.name,
    revenue: Math.round(item.revenue / 1000) || 180 - index * 18,
    growth: [18, 14, 11, 9, 7][index] ?? 6,
    progress: Math.max(42, 92 - index * 9),
    status: index < 2 ? "Growing" : index === 2 ? "Stable" : "Watch",
  }));
  const courseCompletion = [
    { name: "Cloud", value: 84, completed: 214, inProgress: 48, atRisk: 9, fill: "#58cc02" },
    { name: "AI", value: 78, completed: 186, inProgress: 62, atRisk: 14, fill: "#0ea5e9" },
    { name: "ERP", value: 72, completed: 158, inProgress: 71, atRisk: 21, fill: "#f59e0b" },
  ];
  const systemUsage = [
    ["Active users", String(payload.kpis.total_students || 1248)],
    ["API requests", "48.2k"],
    ["Reports generated", "126"],
    ["Notifications sent", "9.8k"],
    ["AI insights created", "38"],
    ["Avg session", "18m"],
  ];
  const databaseHealth = [
    ["Latency", "18ms"],
    ["Queries", "12.8k"],
    ["Uptime", "99.99%"],
  ];

  function addActivity(action: string, module: string, badge: string) {
    setActivityRows((current) => [{ avatar: module.slice(0, 2).toUpperCase(), action, module, badge, time: "now" }, ...current.slice(0, 4)]);
  }

  function updateBuilder(key: keyof ReportBuilderState, value: string) {
    setBuilder((current) => ({ ...current, [key]: value }));
  }

  function exportReport(format: ReportFormat, source = "Export Center") {
    const normalized = { ...safeBuilder, format };
    downloadReport(payload, normalized);
    setActionStatus(`${source}: ${normalized.category} ${normalized.module} report exported as ${format}.`);
    setRecentRows((current) => [[`${normalized.module} report exported`, normalized.category, format, "now"], ...current.slice(0, 5)]);
    addActivity(`${normalized.module} export downloaded`, normalized.category, format);
  }

  function generateReport() {
    downloadReport(payload, safeBuilder);
    setActionStatus(`Generated ${safeBuilder.category} report for ${safeBuilder.module} (${safeBuilder.branch}, ${safeBuilder.dateRange}).`);
    setRecentRows((current) => [[`${safeBuilder.category} report generated`, safeBuilder.module, safeBuilder.format, "now"], ...current.slice(0, 5)]);
    addActivity(`${safeBuilder.category} report generated`, safeBuilder.module, safeBuilder.format);
  }

  function scheduleAutomation(name = `${safeBuilder.category} ${safeBuilder.module} Automation`) {
    const next = safeBuilder.dateRange === "This month" ? "1 Jun 9:00 AM" : "Tomorrow 8:00 AM";
    setScheduledRows((current) => {
      const existing = current.find((item) => item.name === name);
      if (existing) {
        return current.map((item) => item.name === name ? { ...item, enabled: true, next, channels: `Email, ${safeBuilder.format}` } : item);
      }
      return [{ name, next, channels: `Email, ${safeBuilder.format}`, enabled: true }, ...current.slice(0, 5)];
    });
    setActionStatus(`${name} scheduled for ${next}.`);
    addActivity("Report automation scheduled", safeBuilder.module, safeBuilder.format);
  }

  function toggleScheduledReport(name: string) {
    const selected = scheduledRows.find((item) => item.name === name);
    setScheduledRows((current) => current.map((item) => item.name === name ? { ...item, enabled: !item.enabled } : item));
    setActionStatus(`${name} ${selected?.enabled ? "paused" : "enabled"}.`);
    addActivity(`${name} ${selected?.enabled ? "paused" : "enabled"}`, "Automation", "Schedule");
  }

  function applyTemplate(row: string[]) {
    const format = normalizeFormat(row[2]);
    setBuilder((current) => ({
      ...current,
      module: moduleOptions.includes(row[1]) ? row[1] : moduleOptions[0],
      category: row[0].includes("Finance") ? "Finance" : row[0].includes("Trainer") ? "HR" : "Executive",
      format,
    }));
    setActionStatus(`${row[0]} template loaded.`);
    addActivity(`${row[0]} template opened`, row[1], format);
  }

  /* =====================================================
     SECTION: EVENT HANDLERS
     PURPOSE:
     This section responds to user actions such as clicks, typing, and form submission.
     Handlers connect interface events to state updates or API calls.
  ===================================================== */

  function handleInsightAction(insight: ReportsAnalyticsPayload["insights"][number]) {
    setOpenInsight(insight.title);
    setActionStatus(`${insight.action} started from AI Insights.`);
    addActivity(insight.action, "AI", insight.severity);
  }

  function emailReport() {
    const subject = encodeURIComponent(`Pinesphere ${safeBuilder.category} Report`);
    const body = encodeURIComponent(buildReportText(payload, safeBuilder));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setActionStatus("Email draft opened with the selected report summary.");
    addActivity("Report email drafted", safeBuilder.module, "Email");
  }

  function printReport() {
    setActionStatus("Opening print dialog for the current report view.");
    addActivity("Report sent to print dialog", safeBuilder.module, "Print");
    window.setTimeout(() => window.print(), 50);
  }

  async function shareReport() {
    const text = buildReportText(payload, safeBuilder);
    if (navigator.share) {
      await navigator.share({ title: "Pinesphere Report", text }).catch(() => undefined);
      setActionStatus("Report shared through the browser share sheet.");
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setActionStatus("Report summary copied for Branch Admin sharing.");
    } else {
      setActionStatus("Report summary is ready, but browser sharing is unavailable.");
    }
    addActivity("Report shared to Branch Admin", safeBuilder.module, "Share");
  }

  return (
    <div className="min-w-0 space-y-3 text-[#17210f]">
      <section className="relative overflow-hidden rounded-lg border border-[#cceabf] bg-[linear-gradient(135deg,#12310f,#2f7d00_46%,#6fe31d)] p-4 text-white shadow-[0_18px_44px_rgba(47,125,0,0.22)] sm:p-5">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 24%), radial-gradient(circle at 78% 12%, rgba(215,255,112,0.34), transparent 20%)" }} />
        {[BarChart3, LineChartIcon, Activity, BrainCircuit].map((Icon, index) => (
          <motion.div
            key={index}
            className="absolute hidden rounded-lg border border-white/20 bg-white/10 p-2 text-white/80 backdrop-blur md:block"
            animate={{ y: [0, -10, 0], opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 4 + index, repeat: Infinity, ease: "easeInOut" }}
            style={{ right: `${6 + index * 10}%`, top: `${18 + (index % 2) * 42}%` }}
          >
            <Icon size={20} />
          </motion.div>
        ))}
        <div className="relative z-10 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-[#d7ff70] shadow-[0_0_14px_rgba(215,255,112,0.9)]" />
                Real-time sync
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] backdrop-blur">
                <Bot size={13} /> AI analytics online
              </span>
              <span className="rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-black uppercase tracking-[0.08em] backdrop-blur">
                {roleLabel}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Reports & Analytics</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/88">
              Generate exports, monitor institute performance, and view AI-powered business insights in real time.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-white/82">
              <span>Last updated {lastUpdated}</span>
              <span className="h-1 w-1 rounded-full bg-white/60" />
              <span>{status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button onClick={() => exportReport(safeBuilder.format, "Quick export")} className="h-9 gap-2 rounded-lg bg-white text-[#2f7d00] hover:bg-[#efffe9]">
              <Download size={16} /> Quick export
            </Button>
            <Button onClick={() => scheduleAutomation("Quick Scheduled Report")} className="h-9 gap-2 rounded-lg border border-white/30 bg-white/12 text-white hover:bg-white/20">
              <CalendarClock size={16} /> Schedule report
            </Button>
          </div>
        </div>
      </section>

      {loading ? <LoadingSkeleton /> : null}

      <section className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {visibleKpis.map((item, index) => (
          <KpiCard key={item.key} config={item} value={payload.kpis[item.key] ?? 0} series={payload.revenue_series} index={index} />
        ))}
      </section>

      <section className="grid min-w-0 grid-flow-dense items-stretch gap-2.5 xl:grid-cols-12">
        {(isSuperAdmin || isFinance || isBranch) && (
          <AnalyticsCard className="h-full xl:col-span-7" icon={CircleDollarSign} title="Revenue Analytics" action={<Segmented value={period} onChange={setPeriod} />}>
            <div className="h-[202px] min-w-0">
              <ResponsiveContainer width="100%" height={202}>
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor={green} stopOpacity={0.38} />
                      <stop offset="95%" stopColor={green} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e5f2dc" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: muted }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: muted }} tickFormatter={(value) => `${Number(value) / 1000}k`} tickLine={false} axisLine={false} width={42} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                  <Area type="monotone" dataKey="revenue" stroke={greenDark} strokeWidth={3} fill="url(#revenueFill)" animationDuration={900} />
                  <Line type="monotone" dataKey="chennai" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="madurai" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        )}

        {(isSuperAdmin || isBranch) && (
          <AnalyticsCard className="h-full xl:col-span-5" icon={CheckCircle2} title="Attendance Analytics" action={<Badge tone="green">{payload.attendance.alerts} alerts</Badge>}>
            <div className="grid h-full gap-2.5 sm:grid-cols-[132px_1fr] xl:items-center">
              <div className="h-[142px] min-w-0">
                <ResponsiveContainer width="100%" height={142}>
                  <RadialBarChart innerRadius="68%" outerRadius="96%" data={[{ name: "Attendance", value: payload.attendance.rate, fill: green }]}>
                    <RadialBar dataKey="value" cornerRadius={8} background />
                    <Tooltip contentStyle={tooltipStyle} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black">{payload.attendance.rate.toFixed(1)}%</p>
                <p className="mt-1 text-xs font-bold text-[#5f6f56]">Live attendance across active sessions</p>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
                  {payload.attendance.heatmap.map((item) => (
                    <div key={item.day} className="rounded-lg border border-[#dbeecf] p-1.5 text-center" style={{ backgroundColor: `rgba(88,204,2,${Math.max(0.12, item.value / 180)})` }}>
                      <p className="text-[11px] font-black">{item.day}</p>
                      <p className="text-xs font-bold">{item.value}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnalyticsCard>
        )}

        {isSuperAdmin && (
          <AnalyticsCard className="h-full xl:col-span-4" icon={Building2} title="Branch Performance" action={<Badge tone="blue">All branches</Badge>}>
            <div className="h-[176px] min-w-0">
              <ResponsiveContainer width="100%" height={176}>
                <BarChart data={branchStack} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <CartesianGrid stroke="#e5f2dc" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: muted }} tickLine={false} axisLine={false} width={82} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="revenue" stackId="a" fill="#58cc02" radius={[6, 0, 0, 6]} />
                  <Bar dataKey="students" stackId="a" fill="#0ea5e9" />
                  <Bar dataKey="attendance" stackId="a" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        )}

        {(isSuperAdmin || isBranch) && (
          <AnalyticsCard className="h-full xl:col-span-3" icon={Sparkles} title="CRM Conversion Funnel" action={<Badge tone="purple">AI scored</Badge>}>
            <div className="h-[176px] min-w-0">
              <ResponsiveContainer width="100%" height={176}>
                <FunnelChart>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Funnel dataKey="value" data={payload.crm_funnel} nameKey="stage" animationDuration={900}>
                    {payload.crm_funnel.map((_, index) => <Cell key={index} fill={chartColors[index]} />)}
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        )}

        {(isSuperAdmin || isBranch) && (
          <AnalyticsCard className="h-full xl:col-span-2" icon={GraduationCap} title="LMS Analytics" action={<Badge tone="green">{payload.lms.courses} courses</Badge>}>
            <MiniScore label="Course completion" value={payload.lms.completion} />
            <MiniScore label="Quiz performance" value={payload.lms.quiz_score} />
            <MiniScore label="AI engagement" value={payload.lms.engagement} />
          </AnalyticsCard>
        )}

        {(isSuperAdmin || isFinance || isBranch) && (
          <AnalyticsCard className="h-full xl:col-span-3" icon={FileSpreadsheet} title="Fee Collection Analytics" action={<Badge tone="orange">Live trend</Badge>}>
            <div className="h-[132px] min-w-0">
              <ResponsiveContainer width="100%" height={132}>
                <PieChart>
                  <Pie data={payload.fee_collection} innerRadius={38} outerRadius={58} paddingAngle={4} dataKey="value">
                    {payload.fee_collection.map((_, index) => <Cell key={index} fill={chartColors[index]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={(value) => formatMoney(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </AnalyticsCard>
        )}

      </section>

      <section className="grid items-stretch gap-2.5 xl:grid-cols-12">
        <CompactLineWidget className="h-full xl:col-span-3" icon={Users} title="Student Growth Trend" data={studentGrowth} dataKey="students" stroke="#58cc02" value="+18%" helper="Monthly admissions" />
        <DonutWidget className="h-full xl:col-span-3" icon={CircleDollarSign} title="Revenue Split" data={revenueSplit} />
        <DonutWidget className="h-full xl:col-span-3" icon={Sparkles} title="Lead Sources" data={leadSources} />
        <CompactLineWidget className="h-full xl:col-span-3" icon={BrainCircuit} title="AI Prediction Chart" data={aiForecast} dataKey="forecast" stroke="#0ea5e9" value="+18%" helper="Forecasted revenue" />
      </section>

      <section className="grid items-stretch gap-2.5 xl:grid-cols-12">
        <ParentPortalWidget className="h-full xl:col-span-4" data={parentUsage} metrics={parentUsageMetrics} />
        <ProgressWidget className="h-full xl:col-span-4" icon={TrendingDown} title="Fee Recovery Tracker" rows={feeRecovery} />
        <LeaderboardWidget className="h-full xl:col-span-4" icon={GraduationCap} title="Batch Performance" rows={batchPerformance} />
      </section>

      <section className="grid items-stretch gap-2.5 xl:grid-cols-3">
        <FranchiseLeaderboardWidget rows={franchiseLeaderboard} />
        <CompletionWidget rows={courseCompletion} />
        <DailySystemUsageWidget rows={systemUsage} />
      </section>

      {(isSuperAdmin || isFinance || isHr || isBranch) && (
        <section className="grid items-start gap-2.5 xl:grid-cols-[5fr_7fr]">
          {isSuperAdmin && (
            <AnalyticsCard icon={BrainCircuit} title="AI Insights Panel" action={<Badge tone="green">Glow active</Badge>}>
              <div className="space-y-2">
                {payload.insights.map((insight) => (
                  <InsightCard
                    key={insight.title}
                    insight={insight}
                    open={openInsight === insight.title}
                    onAction={() => handleInsightAction(insight)}
                    onToggle={() => setOpenInsight(openInsight === insight.title ? null : insight.title)}
                  />
                ))}
              </div>
            </AnalyticsCard>
          )}

          <AnalyticsCard icon={Filter} title="Report Generator" action={<Badge tone="blue">Automation ready</Badge>}>
            <div className="grid gap-2.5 lg:grid-cols-4">
              <SelectBox label="Module" value={safeBuilder.module} options={moduleOptions} onChange={(value) => updateBuilder("module", value)} />
              <SelectBox label="Branch" value={safeBuilder.branch} options={["All branches", "Madurai", "Chennai", "Online"]} onChange={(value) => updateBuilder("branch", value)} />
              <SelectBox label="Date range" value={safeBuilder.dateRange} options={["Last 7 days", "This month", "Last quarter"]} onChange={(value) => updateBuilder("dateRange", value)} />
              <SelectBox label="Category" value={safeBuilder.category} options={["Executive", "Finance", "Attendance", "LMS", "HR"]} onChange={(value) => updateBuilder("category", value)} />
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {(["PDF", "CSV", "Excel"] as const).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => updateBuilder("format", chip)}
                  className={`rounded-full border px-3 py-1 text-xs font-black transition ${safeBuilder.format === chip ? "border-[#58cc02] bg-[#58cc02] text-white" : "border-[#dbeecf] bg-[#f6fff0] text-[#2f7d00] hover:border-[#58cc02]"}`}
                >
                  {chip}
                </button>
              ))}
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={15} />
                <input
                  value={safeBuilder.search}
                  onChange={(event) => updateBuilder("search", event.target.value)}
                  className="h-9 w-full rounded-lg border border-[#dbeecf] bg-white pl-9 pr-3 text-xs font-bold outline-none focus:border-[#58cc02]"
                  placeholder="Search reports, templates, exports"
                />
              </div>
              <Button onClick={generateReport} className="h-9 gap-2 rounded-lg bg-[#58cc02] text-white hover:bg-[#3e9e00]"><FileText size={15} /> Generate report</Button>
              <Button onClick={() => scheduleAutomation()} variant="outline" className="h-9 gap-2 rounded-lg border-[#cde8bf]"><CalendarClock size={15} /> Schedule automation</Button>
            </div>
            <p className="mt-2.5 rounded-lg border border-[#dbeecf] bg-[#f6fff0] px-3 py-2 text-xs font-bold text-[#5f6f56]">{actionStatus}</p>
            <div className="mt-2.5 grid gap-2.5 md:grid-cols-2">
              <CompactList title="Recent reports" rows={filteredRecentRows} onRowClick={(row) => exportReport(normalizeFormat(row[2]), "Recent report")} />
              <CompactList title="Saved templates" rows={filteredTemplates} onRowClick={applyTemplate} />
            </div>
          </AnalyticsCard>
        </section>
      )}

      <section className="grid items-stretch gap-2.5 xl:grid-cols-3">
        <AnalyticsCard className="h-full" icon={BellRing} title="Live Activity & Report Logs" action={<Badge tone="green">Streaming</Badge>}>
          <Timeline rows={activityRows} />
        </AnalyticsCard>

        <AnalyticsCard className="h-full" icon={CalendarClock} title="Scheduled Reports" action={<Badge tone="blue">{scheduledRows.length} automations</Badge>}>
          <div className="grid gap-1.5 xl:min-h-[438px] xl:auto-rows-fr">
            {scheduledRows.map(({ name, next, channels, enabled }) => (
              <button key={name} type="button" onClick={() => toggleScheduledReport(name)} className="flex w-full items-center justify-between gap-2.5 rounded-lg border border-[#dbeecf] bg-white/72 p-2 text-left transition hover:border-[#58cc02]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{name}</p>
                  <p className="mt-0.5 text-xs font-bold text-[#5f6f56]">{next} - {channels}</p>
                </div>
                <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? "bg-[#58cc02]" : "bg-[#cbd5c0]"}`} aria-label={`${name} ${enabled ? "enabled" : "paused"}`}>
                  <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${enabled ? "left-6" : "left-1"}`} />
                </span>
              </button>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard className="h-full" icon={Download} title="Export Center" action={<Badge tone="orange">Secure</Badge>}>
          <div className="grid grid-cols-2 gap-1.5 xl:min-h-[438px] xl:auto-rows-fr">
            {exportActions.map(({ icon: Icon, label, onClick }) => (
              <button key={label} onClick={onClick} className="group flex min-h-[58px] flex-col items-start justify-between rounded-lg border border-[#dbeecf] bg-white/72 p-2.5 text-left transition hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_12px_24px_rgba(47,125,0,0.12)]">
                <Icon className="text-[#2f7d00]" size={18} />
                <span className="text-xs font-black">{label}</span>
              </button>
            ))}
          </div>
        </AnalyticsCard>
      </section>

      <section className="grid items-stretch gap-2.5 xl:grid-cols-12">
        <AnalyticsCard className="h-full xl:col-span-4" icon={ShieldCheck} title="Real-Time System Monitoring" action={<Badge tone="green">Operational</Badge>}>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              [Cloud, "API health", `${payload.monitoring.api_health}%`],
              [Database, "Database", String(payload.monitoring.database_status)],
              [Clock3, "Queue", String(payload.monitoring.report_queue)],
              [Bot, "AI engine", String(payload.monitoring.ai_engine_status)],
            ].map(([Icon, label, value]) => (
              <div key={String(label)} className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] p-2">
                <div className="flex items-center justify-between">
                  <Icon className="text-[#2f7d00]" size={16} />
                  <span className="h-2 w-2 rounded-full bg-[#58cc02] shadow-[0_0_12px_rgba(88,204,2,0.85)]" />
                </div>
                <p className="mt-2 text-[11px] font-bold text-[#5f6f56]">{String(label)}</p>
                <p className="truncate text-base font-black">{String(value)}</p>
              </div>
            ))}
          </div>
        </AnalyticsCard>
        <CompactLineWidget className="h-full xl:col-span-3" icon={BellRing} title="Notification Analytics" data={lmsTimeline} dataKey="completions" stroke="#58cc02" value={`${payload.monitoring.notification_delivery_rate}%`} helper="Delivery success" />
        <UsageWidget className="h-full xl:col-span-3" icon={Activity} title="API Usage" rows={[["Requests", "48.2k"], ["Avg latency", "42ms"], ["Errors", "0.08%"]]} />
        <UsageWidget className="h-full xl:col-span-2" icon={Database} title="Database Health" rows={databaseHealth} />
      </section>
    </div>
  );
}

function KpiCard({ config, value, series, index }: { config: (typeof kpiConfig)[number]; value: number; series: ReportsAnalyticsPayload["revenue_series"]; index: number }) {
  const Icon = config.icon;
  const sparkline = series.map((item, itemIndex) => ({ label: item.label, value: config.key.includes("revenue") ? item.revenue : 42 + ((itemIndex + index) * 7) % 38 }));
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group min-h-[154px] rounded-lg border border-[#dbeecf] bg-white/72 p-3.5 shadow-[0_10px_28px_rgba(15,35,10,0.07)] backdrop-blur transition hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_18px_38px_rgba(47,125,0,0.13)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${config.tone}18`, color: config.tone }}>
            <Icon size={18} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#5f6f56]">{config.label}</p>
            <p className="mt-1 text-xl font-black leading-none">{formatValue(config.key, value)}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[#f6fff0] px-2 py-1 text-[11px] font-black text-[#2f7d00]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#58cc02]" />
          {config.status}
        </span>
      </div>
      <div className="mt-3 h-[34px]">
        <ResponsiveContainer width="100%" height={34}>
          <LineChart data={sparkline}>
            <Line dataKey="value" stroke={config.tone} strokeWidth={2} dot={false} type="monotone" animationDuration={700} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
        <span className="font-black" style={{ color: config.tone }}>{config.trend}</span>
        <span className="truncate font-bold text-[#5f6f56]">{config.compare}</span>
      </div>
    </motion.article>
  );
}

function AnalyticsCard({ icon: Icon, title, action, className = "", children }: { icon: IconType; title: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <Card className={`min-w-0 rounded-lg border-[#dbeecf] bg-white/78 py-0 shadow-[0_10px_28px_rgba(15,35,10,0.07)] backdrop-blur ${className}`}>
      <CardContent className="p-3">
        <div className="mb-2.5 flex items-start justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#efffe8] text-[#2f7d00]">
              <Icon size={16} />
            </span>
            <h3 className="truncate text-sm font-black">{title}</h3>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function CompactLineWidget({
  className = "",
  data,
  dataKey,
  helper,
  icon,
  stroke,
  title,
  value,
}: {
  className?: string;
  data: Array<Record<string, number | string>>;
  dataKey: string;
  helper: string;
  icon: IconType;
  stroke: string;
  title: string;
  value: string;
}) {
  return (
    <AnalyticsCard className={className} icon={icon} title={title} action={<Badge tone="green">{value}</Badge>}>
      <div className="grid grid-cols-[76px_1fr] items-center gap-2">
        <div>
          <p className="text-xl font-black leading-none">{value}</p>
          <p className="mt-1 text-[11px] font-bold leading-4 text-[#5f6f56]">{helper}</p>
        </div>
        <div className="h-[92px] min-w-0">
          <ResponsiveContainer width="100%" height={92}>
            <LineChart data={data}>
              <Tooltip contentStyle={tooltipStyle} />
              <Line dataKey={dataKey} stroke={stroke} strokeWidth={2.5} dot={false} type="monotone" animationDuration={700} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function DonutWidget({ className = "", data, icon, title }: { className?: string; data: Array<{ name: string; value: number }>; icon: IconType; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  return (
    <AnalyticsCard className={className} icon={icon} title={title}>
      <div className="grid grid-cols-[96px_1fr] items-center gap-2">
        <div className="h-[102px]">
          <ResponsiveContainer width="100%" height={102}>
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius={28} outerRadius={44} paddingAngle={3}>
                {data.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center justify-between gap-2 text-[11px] font-bold">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-[#5f6f56]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
                {item.name}
              </span>
              <span className="font-black">{Math.round((item.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </AnalyticsCard>
  );
}

function ProgressWidget({ className = "", icon, rows, title }: { className?: string; icon: IconType; rows: Array<{ label: string; value: number; tone: string }>; title: string }) {
  return (
    <AnalyticsCard className={className} icon={icon} title={title} action={<Badge tone="orange">Recovery</Badge>}>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-bold text-[#5f6f56]">{row.label}</span>
              <span className="font-black">{row.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#e6f4df]">
              <motion.div className="h-full rounded-full" style={{ backgroundColor: row.tone }} initial={{ width: 0 }} animate={{ width: `${row.value}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function LeaderboardWidget({ className = "", icon, rows, title }: { className?: string; icon: IconType; rows: string[][]; title: string }) {
  return (
    <AnalyticsCard className={className} icon={icon} title={title}>
      <div className="space-y-1.5">
        {rows.slice(0, 4).map((row, index) => (
          <div key={row.join("-")} className="grid grid-cols-[24px_1fr_auto] items-center gap-2 rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-1.5 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#12310f] text-[10px] font-black text-[#d7ff70]">{index + 1}</span>
            <span className="truncate font-black">{row[0]}</span>
            <span className="font-black text-[#2f7d00]">{row[1]}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function ParentPortalWidget({
  className = "",
  data,
  metrics,
}: {
  className?: string;
  data: Array<Record<string, number | string>>;
  metrics: string[][];
}) {
  return (
    <AnalyticsCard className={className} icon={Users} title="Parent Portal Usage" action={<Badge tone="green">Growing</Badge>}>
      <div className="grid grid-cols-[1fr_118px] gap-2">
        <div className="grid grid-cols-2 gap-1.5">
          {metrics.map((metric) => (
            <div key={metric[0]} className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-1.5">
              <p className="truncate text-[10px] font-bold text-[#5f6f56]">{metric[0]}</p>
              <p className="text-sm font-black">{metric[1]}</p>
            </div>
          ))}
        </div>
        <div className="min-w-0">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xl font-black leading-none">64%</span>
            <span className="rounded-full bg-[#efffe8] px-2 py-0.5 text-[10px] font-black text-[#2f7d00]">Active</span>
          </div>
          <div className="h-[96px]">
            <ResponsiveContainer width="100%" height={96}>
              <BarChart data={data}>
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="parents" fill="#58cc02" radius={[4, 4, 0, 0]} />
                <Bar dataKey="messages" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AnalyticsCard>
  );
}

function FranchiseLeaderboardWidget({
  rows,
}: {
  rows: Array<{ name: string; revenue: number; growth: number; progress: number; status: string }>;
}) {
  return (
    <AnalyticsCard className="h-full" icon={Building2} title="Franchise Revenue Leaderboard" action={<Badge tone="green">Top 5</Badge>}>
      <div className="space-y-1.5">
        {rows.slice(0, 5).map((row, index) => (
          <div key={row.name} className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-1.5">
            <div className="grid grid-cols-[24px_1fr_auto] items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#12310f] text-[10px] font-black text-[#d7ff70]">{index + 1}</span>
              <div className="min-w-0">
                <p className="truncate text-xs font-black">{row.name}</p>
                <p className="text-[10px] font-bold text-[#5f6f56]">{row.status} - +{row.growth}%</p>
              </div>
              <p className="text-xs font-black text-[#2f7d00]">Rs {row.revenue}k</p>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#e6f4df]">
              <div className="h-full rounded-full bg-[#58cc02]" style={{ width: `${row.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function CompletionWidget({ className = "", rows }: { className?: string; rows: Array<{ name: string; value: number; completed: number; inProgress: number; atRisk: number; fill: string }> }) {
  const completed = rows.reduce((total, row) => total + row.completed, 0);
  const inProgress = rows.reduce((total, row) => total + row.inProgress, 0);
  const atRisk = rows.reduce((total, row) => total + row.atRisk, 0);
  return (
    <AnalyticsCard className={`${className} h-full`} icon={CheckCircle2} title="Student Course Completion" action={<Badge tone="green">Compact</Badge>}>
      <div className="mb-2 grid grid-cols-3 gap-1.5">
        {[["Completed", completed], ["In progress", inProgress], ["At risk", atRisk]].map((item) => (
          <div key={String(item[0])} className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-1.5 text-center">
            <p className="text-[10px] font-bold text-[#5f6f56]">{item[0]}</p>
            <p className="text-sm font-black">{item[1]}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-black">{row.name}</span>
              <span className="font-black text-[#2f7d00]">{row.value}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#e6f4df]">
              <div className="h-full rounded-full" style={{ width: `${row.value}%`, backgroundColor: row.fill }} />
            </div>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function DailySystemUsageWidget({ rows }: { rows: string[][] }) {
  return (
    <AnalyticsCard className="h-full" icon={Activity} title="Daily System Usage" action={<Badge tone="blue">Live</Badge>}>
      <div className="grid grid-cols-2 gap-1.5">
        {rows.map((row) => (
          <div key={row[0]} className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-2">
            <p className="truncate text-[10px] font-bold text-[#5f6f56]">{row[0]}</p>
            <p className="text-base font-black leading-tight">{row[1]}</p>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function UsageWidget({ className = "", icon, rows, title }: { className?: string; icon: IconType; rows: string[][]; title: string }) {
  return (
    <AnalyticsCard className={className} icon={icon} title={title} action={<Badge tone="blue">Live</Badge>}>
      <div className="grid gap-1.5">
        {rows.map((row) => (
          <div key={row[0]} className="flex items-center justify-between rounded-lg border border-[#dbeecf] bg-[#f8fff4] px-2 py-1.5">
            <span className="text-xs font-bold text-[#5f6f56]">{row[0]}</span>
            <span className="text-sm font-black">{row[1]}</span>
          </div>
        ))}
      </div>
    </AnalyticsCard>
  );
}

function InsightCard({ insight, open, onAction, onToggle }: { insight: ReportsAnalyticsPayload["insights"][number]; open: boolean; onAction: () => void; onToggle: () => void }) {
  return (
    <div className="rounded-lg border border-[#cfe9c3] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(242,255,236,0.86))] p-2.5 shadow-[0_0_24px_rgba(88,204,2,0.12)]">
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-2.5 text-left">
        <div className="flex min-w-0 gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#12310f] text-[#d7ff70]"><Bot size={16} /></span>
          <div className="min-w-0">
            <p className="text-sm font-black">{insight.title}</p>
            <p className="mt-1 text-xs font-bold text-[#5f6f56]">{insight.timestamp}</p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-black text-[#2f7d00]">
          {insight.severity} <ChevronDown size={12} className={open ? "rotate-180 transition" : "transition"} />
        </span>
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <p className="mt-2 text-xs font-semibold leading-5 text-[#5f6f56]">{insight.detail}</p>
            <Button onClick={onAction} className="mt-2 h-8 rounded-lg bg-[#58cc02] text-xs font-black text-white hover:bg-[#3e9e00]">{insight.action}</Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Segmented({ value, onChange }: { value: "Daily" | "Weekly" | "Monthly"; onChange: (value: "Daily" | "Weekly" | "Monthly") => void }) {
  return (
    <div className="flex rounded-lg border border-[#dbeecf] bg-[#f6fff0] p-0.5">
      {(["Daily", "Weekly", "Monthly"] as const).map((item) => (
        <button key={item} onClick={() => onChange(item)} className={`h-7 rounded-md px-2 text-[11px] font-black transition ${value === item ? "bg-[#58cc02] text-white" : "text-[#5f6f56] hover:text-[#17210f]"}`} type="button">
          {item}
        </button>
      ))}
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-[#5f6f56]">{label}</span>
        <span className="font-black">{value.toFixed(0)}%</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-[#e6f4df]">
        <motion.div className="h-full rounded-full bg-[#58cc02]" initial={{ width: 0 }} animate={{ width: `${Math.min(100, value)}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function SelectBox({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0 text-xs font-black text-[#5f6f56]">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-[#dbeecf] bg-white px-2 text-xs font-bold text-[#17210f] outline-none focus:border-[#58cc02]">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function CompactList({ title, rows, onRowClick }: { title: string; rows: string[][]; onRowClick?: (row: string[]) => void }) {
  return (
    <div className="rounded-lg border border-[#dbeecf] bg-[#f8fff4] p-2.5">
      <p className="mb-2 text-xs font-black uppercase tracking-[0.08em] text-[#5f6f56]">{title}</p>
      <div className="space-y-1.5">
        {rows.length ? rows.map((row) => (
          <button key={row.join("-")} type="button" onClick={() => onRowClick?.(row)} className="grid w-full grid-cols-[1fr_auto] gap-1.5 rounded-md bg-white px-2 py-1.5 text-left text-xs transition hover:bg-[#efffe8]">
            <span className="truncate font-black">{row[0]}</span>
            <span className="font-bold text-[#2f7d00]">{row[2]}</span>
            <span className="truncate font-bold text-[#5f6f56]">{row[1]}</span>
            <span className="font-bold text-[#5f6f56]">{row[3]}</span>
          </button>
        )) : <p className="rounded-md bg-white px-2 py-3 text-xs font-bold text-[#5f6f56]">No matching reports found.</p>}
      </div>
    </div>
  );
}

function Timeline({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="space-y-1.5">
      {rows.slice(0, 5).map(({ avatar, action, module, badge, time }, index) => (
        <div key={`${action}-${time}-${badge}-${index}`} className="flex gap-2 rounded-lg border border-[#dbeecf] bg-white/72 p-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#12310f] text-[11px] font-black text-[#d7ff70]">{avatar}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-black">{action}</p>
              <span className="text-[11px] font-bold text-[#5f6f56]">{time}</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge tone="green">{module}</Badge>
              <Badge tone="blue">{badge}</Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: "green" | "blue" | "orange" | "purple" }) {
  const map = {
    green: "bg-[#efffe8] text-[#2f7d00]",
    blue: "bg-[#eef8ff] text-[#0369a1]",
    orange: "bg-[#fff7ed] text-[#c2410c]",
    purple: "bg-[#f5f0ff] text-[#6d28d9]",
  };
  return <span className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-black ${map[tone]}`}>{children}</span>;
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-[154px] animate-pulse rounded-lg border border-[#dbeecf] bg-[#f3fde9]" />
      ))}
    </div>
  );
}

function roleOptions(role: string, field: "module") {
  if (field !== "module") return [];
  if (role === "finance") return ["Finance", "Revenue", "Fee Collection", "Invoices"];
  if (role === "hr") return ["HR", "Staff Productivity", "Trainer Workload"];
  if (role === "branch_admin") return ["Branch Summary", "Attendance", "Students", "Finance"];
  return ["All modules", "CRM", "Students", "LMS", "Attendance", "Finance", "HR", "Franchise", "AI"];
}

function filterRows(rows: string[][], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return rows;
  return rows.filter((row) => row.join(" ").toLowerCase().includes(normalized));
}

function normalizeFormat(value: string): ReportFormat {
  if (value === "CSV" || value === "Excel" || value === "PDF") return value;
  return "PDF";
}

function buildRevenueView(series: ReportsAnalyticsPayload["revenue_series"], period: "Daily" | "Weekly" | "Monthly") {
  if (period === "Daily") return series;
  if (period === "Weekly") {
    return [
      { label: "Week 1", revenue: sumSeries(series.slice(0, 2), "revenue"), madurai: sumSeries(series.slice(0, 2), "madurai"), chennai: sumSeries(series.slice(0, 2), "chennai"), online: sumSeries(series.slice(0, 2), "online") },
      { label: "Week 2", revenue: sumSeries(series.slice(2, 4), "revenue"), madurai: sumSeries(series.slice(2, 4), "madurai"), chennai: sumSeries(series.slice(2, 4), "chennai"), online: sumSeries(series.slice(2, 4), "online") },
      { label: "Week 3", revenue: sumSeries(series.slice(4, 6), "revenue"), madurai: sumSeries(series.slice(4, 6), "madurai"), chennai: sumSeries(series.slice(4, 6), "chennai"), online: sumSeries(series.slice(4, 6), "online") },
      { label: "Week 4", revenue: sumSeries(series.slice(6, 8), "revenue"), madurai: sumSeries(series.slice(6, 8), "madurai"), chennai: sumSeries(series.slice(6, 8), "chennai"), online: sumSeries(series.slice(6, 8), "online") },
    ];
  }
  const total = sumSeries(series, "revenue");
  return ["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((label, index) => ({
    label,
    revenue: Math.round(total * (0.72 + index * 0.08)),
    madurai: Math.round(sumSeries(series, "madurai") * (0.72 + index * 0.08)),
    chennai: Math.round(sumSeries(series, "chennai") * (0.72 + index * 0.08)),
    online: Math.round(sumSeries(series, "online") * (0.72 + index * 0.08)),
  }));
}

function sumSeries(series: ReportsAnalyticsPayload["revenue_series"], key: "revenue" | "madurai" | "chennai" | "online") {
  return series.reduce((total, item) => total + Number(item[key] ?? 0), 0);
}

function downloadReport(payload: ReportsAnalyticsPayload, builder: ReportBuilderState) {
  const name = `pinesphere-${builder.category}-${builder.module}-${builder.format}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (builder.format === "CSV") {
    downloadBlob(`${name}.csv`, "text/csv;charset=utf-8", buildReportCsv(payload, builder));
    return;
  }
  if (builder.format === "Excel") {
    downloadBlob(`${name}.xls`, "application/vnd.ms-excel;charset=utf-8", buildReportCsv(payload, builder));
    return;
  }
  downloadBlob(`${name}.pdf`, "application/pdf", buildSimplePdf(buildReportText(payload, builder)));
}

function downloadBlob(filename: string, type: string, content: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildReportCsv(payload: ReportsAnalyticsPayload, builder: ReportBuilderState) {
  const rows = [
    ["Pinesphere ERP Report"],
    ["Module", builder.module],
    ["Branch", builder.branch],
    ["Date Range", builder.dateRange],
    ["Category", builder.category],
    [],
    ["KPI", "Value"],
    ["Total Students", payload.kpis.total_students],
    ["Active Branches", payload.kpis.active_branches],
    ["Monthly Revenue", payload.kpis.monthly_revenue],
    ["Attendance Rate", payload.kpis.attendance_rate],
    ["Pending Fees", payload.kpis.pending_fees],
    ["New Leads Today", payload.kpis.new_leads_today],
    ["LMS Completion Rate", payload.kpis.lms_completion_rate],
    ["Staff Productivity Score", payload.kpis.staff_productivity_score],
    [],
    ["Branch", "Revenue", "Students", "Attendance"],
    ...payload.branch_performance.map((item) => [item.name, item.revenue, item.students, item.attendance]),
  ];
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll("\"", "\"\"")}"`).join(",")).join("\n");
}

function buildReportText(payload: ReportsAnalyticsPayload, builder: ReportBuilderState) {
  return [
    "Pinesphere ERP Reports & Analytics",
    `Module: ${builder.module}`,
    `Branch: ${builder.branch}`,
    `Date range: ${builder.dateRange}`,
    `Category: ${builder.category}`,
    `Generated: ${new Date(payload.generated_at).toLocaleString("en-IN")}`,
    "",
    `Total students: ${payload.kpis.total_students}`,
    `Monthly revenue: ${formatMoney(payload.kpis.monthly_revenue ?? 0)}`,
    `Attendance rate: ${(payload.kpis.attendance_rate ?? 0).toFixed(1)}%`,
    `Pending fees: ${formatMoney(payload.kpis.pending_fees ?? 0)}`,
    `New leads today: ${payload.kpis.new_leads_today}`,
    `LMS completion: ${(payload.kpis.lms_completion_rate ?? 0).toFixed(1)}%`,
    `Staff productivity: ${(payload.kpis.staff_productivity_score ?? 0).toFixed(1)}%`,
    "",
    "AI Insights:",
    ...payload.insights.slice(0, 4).map((item) => `- ${item.title} (${item.severity})`),
  ].join("\n");
}

function buildSimplePdf(text: string) {
  const lines = text.split("\n").slice(0, 34).map((line) => line.replace(/[()\\]/g, "\\$&"));
  const content = [
    "BT",
    "/F1 12 Tf",
    "50 780 Td",
    ...lines.flatMap((line, index) => [`${index === 0 ? "" : "0 -18 Td"}(${line}) Tj`]),
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}

function formatMoney(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  return `Rs ${Math.round(value).toLocaleString("en-IN")}`;
}

function formatValue(key: string, value: number) {
  if (key.includes("revenue") || key.includes("fees")) return formatMoney(value);
  if (key.includes("rate") || key.includes("score")) return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString("en-IN");
}

const tooltipStyle = {
  border: "1px solid #dbeecf",
  borderRadius: 8,
  boxShadow: "0 16px 32px rgba(15,35,10,0.12)",
  fontSize: 12,
};
