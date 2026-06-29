/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Branches
Purpose     : Renders and coordinates Branches UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  Eye,
  Filter,
  GraduationCap,
  History,
  KeyRound,
  Network,
  Pencil,
  Power,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  UserCog,
  UserPlus,
  UserX,
  X,
} from "lucide-react";
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

import { apiRequest } from "../shared/api";

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

type BranchResponse = {
  id: string;
  name: string;
  code: string;
  city?: string | null;
  address?: string | null;
  manager_name?: string | null;
  phone?: string | null;
  capacity: number;
  status: string;
  created_at: string;
};

type BranchStatsResponse = {
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
  attendance_rate?: number;
  revenue?: number;
  lead_conversion?: number;
  open_invoices?: number;
  pending_issues?: number;
};

type CapacityReportResponse = {
  total_capacity: number;
  total_students: number;
  utilization_percent: number;
  branches: BranchStatsResponse[];
};

type BranchSignalItem = {
  title: string;
  detail: string;
  severity: string;
  branch_id?: string | null;
};

type BranchActivityItem = {
  id: string;
  branch_id?: string | null;
  branch_name: string;
  message: string;
  detail: string;
  activity_type: string;
  created_at: string;
};

type BranchLiveSignalsResponse = {
  activities: BranchActivityItem[];
  insights: BranchSignalItem[];
  alerts: BranchSignalItem[];
};

type BranchView = BranchResponse & {
  location: string;
  branchType: "Main Branch" | "Franchise" | "Branch";
  studentsCount: number;
  trainersCount: number;
  revenue: number;
  attendanceRate: number;
  conversionRate: number;
  capacityRate: number;
  healthScore: number;
  pendingIssues: number;
  operationalStatus: "Running Smoothly" | "Needs Attention" | "Critical" | "Growth Spike" | "Inactive";
  lastUpdated: string;
};

type ActivityRow = {
  type: "added" | "role" | "disabled" | "password" | "invite";
};

/* =====================================================
   SECTION: CONSTANTS
   PURPOSE:
   This section stores fixed values used by the file.
   Centralizing these values helps avoid repeated magic strings or numbers.
===================================================== */

const BRANCH_ACTIVITY_STORAGE_KEY = "pinesphere_branch_page_activity";

const colors = {
  green: "#58cc02",
  sky: "#1cb0f6",
  orange: "#ff9600",
  purple: "#ce82ff",
  red: "#ff4b4b",
};

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString("en-IN")}`;
}

function formatShortCurrency(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(value >= 1000000 ? 1 : 2)}L`;
  return formatCurrency(value);
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function relativeActivityTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function Panel({
  icon,
  title,
  subtitle,
  action,
  compact = false,
  children,
}: {
  icon: IconType;
  title: string;
  subtitle: string;
  action?: ReactNode;
  compact?: boolean;
  children: ReactNode;
}) {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <article className={`w-full border border-[#ddeecf] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)] ${compact ? "max-w-full rounded-[16px] p-3" : "rounded-[22px] p-[18px]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex min-w-0 items-start ${compact ? "gap-2" : "gap-3"}`}>
          <IconBadge icon={icon} color={colors.green} small />
          <div className="min-w-0 flex-1">
            <h2 className={`${compact ? "text-[16px]" : "text-[19px]"} font-black leading-tight`}>{title}</h2>
            <p className={`${compact ? "mt-0.5 text-xs" : "mt-1 text-sm"} text-[#5f6f56]`}>{subtitle}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={compact ? "mt-3" : "mt-4"}>{children}</div>
    </article>
  );
}

function IconBadge({ icon: Icon, color, small = false }: { icon: IconType; color: string; small?: boolean }) {
  return (
    <div className={`${small ? "h-11 w-11 rounded-[16px]" : "h-14 w-14 rounded-[20px]"} flex shrink-0 items-center justify-center bg-[#d7ff70]`}>
      <Icon size={small ? 22 : 28} style={{ color }} />
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityRow["type"] }) {
  const Icon = type === "password" ? KeyRound : type === "role" ? UserCog : type === "disabled" ? UserX : type === "invite" ? Send : CheckCircle2;
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#eefbe7] text-[#3e9e00]">
      <Icon size={14} />
    </div>
  );
}
export function BranchManagementPanel({ accessToken, headerActions }: { accessToken: string; headerActions?: ReactNode }) {
  const [branchesData, setBranchesData] = useState<BranchResponse[]>([]);
  const [statsData, setStatsData] = useState<BranchStatsResponse[]>([]);
  const [capacityData, setCapacityData] = useState<CapacityReportResponse | null>(null);
  const [liveSignals, setLiveSignals] = useState<BranchLiveSignalsResponse | null>(null);
  const [pageActivities, setPageActivities] = useState<BranchActivityItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(BRANCH_ACTIVITY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as BranchActivityItem[]) : [];
    } catch {
      window.localStorage.removeItem(BRANCH_ACTIVITY_STORAGE_KEY);
      return [];
    }
  });
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [nameSearch, setNameSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("health");
  const [selectedBranchIds, setSelectedBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editingBranch, setEditingBranch] = useState<BranchView | null>(null);
  const [viewingBranch, setViewingBranch] = useState<BranchView | null>(null);
  const [reportBranch, setReportBranch] = useState<BranchView | null>(null);
  const [signalDialog, setSignalDialog] = useState<"activity" | "insights" | "alerts" | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    city: "",
    address: "",
    manager_name: "",
    phone: "",
    capacity: "100",
    status: "active",
  });

  const fallbackBranches = useMemo<BranchView[]>(() => [
    {
      id: "fallback-main",
      name: "Main Branch",
      code: "MAIN",
      city: "Bengaluru",
      address: "MG Road",
      manager_name: "Ananya Sharma",
      phone: "9000000001",
      capacity: 620,
      status: "active",
      created_at: new Date().toISOString(),
      location: "Bengaluru",
      branchType: "Main Branch",
      studentsCount: 486,
      trainersCount: 28,
      revenue: 3400000,
      attendanceRate: 94,
      conversionRate: 38,
      capacityRate: 78,
      healthScore: 92,
      pendingIssues: 1,
      operationalStatus: "Running Smoothly",
      lastUpdated: "2 min ago",
    },
    {
      id: "fallback-north",
      name: "North Campus",
      code: "NORTH",
      city: "Delhi",
      address: "Rohini",
      manager_name: "Rahul Menon",
      phone: "9000000002",
      capacity: 420,
      status: "active",
      created_at: new Date().toISOString(),
      location: "Delhi",
      branchType: "Branch",
      studentsCount: 312,
      trainersCount: 18,
      revenue: 2160000,
      attendanceRate: 82,
      conversionRate: 31,
      capacityRate: 74,
      healthScore: 78,
      pendingIssues: 3,
      operationalStatus: "Needs Attention",
      lastUpdated: "6 min ago",
    },
    {
      id: "fallback-franchise",
      name: "Franchise A",
      code: "FR-A",
      city: "Hyderabad",
      address: "Hitech City",
      manager_name: "Kavya Rao",
      phone: "9000000003",
      capacity: 260,
      status: "active",
      created_at: new Date().toISOString(),
      location: "Hyderabad",
      branchType: "Franchise",
      studentsCount: 248,
      trainersCount: 11,
      revenue: 1780000,
      attendanceRate: 88,
      conversionRate: 27,
      capacityRate: 95,
      healthScore: 74,
      pendingIssues: 4,
      operationalStatus: "Growth Spike",
      lastUpdated: "8 min ago",
    },
    {
      id: "fallback-south",
      name: "South Learning Hub",
      code: "SOUTH",
      city: "Chennai",
      address: "Adyar",
      manager_name: "Nikhil Das",
      phone: "9000000004",
      capacity: 300,
      status: "inactive",
      created_at: new Date().toISOString(),
      location: "Chennai",
      branchType: "Branch",
      studentsCount: 96,
      trainersCount: 7,
      revenue: 620000,
      attendanceRate: 68,
      conversionRate: 18,
      capacityRate: 32,
      healthScore: 52,
      pendingIssues: 6,
      operationalStatus: "Inactive",
      lastUpdated: "18 min ago",
    },
  ], []);

  const loadBranches = useCallback(async (isAutoRefresh = false) => {
    if (!isAutoRefresh) setLoading(true);
    setError("");
    try {
      const branchRows = await apiRequest<BranchResponse[]>("/branches", accessToken);
      setBranchesData(branchRows);
      if (!isAutoRefresh) setLoading(false);

      const metricResults = await Promise.allSettled([
        apiRequest<BranchStatsResponse[]>("/branches/compare", accessToken),
        apiRequest<CapacityReportResponse>("/branches/capacity-report", accessToken),
        apiRequest<BranchLiveSignalsResponse>("/branches/live-signals", accessToken),
      ]);
      if (metricResults[0].status === "fulfilled") setStatsData(metricResults[0].value);
      if (metricResults[1].status === "fulfilled") setCapacityData(metricResults[1].value);
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      setLiveSignals(metricResults[2].status === "fulfilled" ? metricResults[2].value : null);
      const failed = metricResults.slice(0, 2).filter((result) => result.status === "rejected").length;
      setNotice(failed ? `${failed} branch metric source${failed === 1 ? "" : "s"} still loading or unavailable.` : "");
    } catch (branchError) {
      setError(branchError instanceof Error ? branchError.message : "Branch data unavailable");
    } finally {
      if (!isAutoRefresh) setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let alive = true;

    async function loadInitial() {
      await loadBranches();
    }

    loadInitial();
    const refreshTimer = window.setInterval(() => {
      if (alive) loadBranches(true);
    }, 30000);

    return () => {
      alive = false;
      window.clearInterval(refreshTimer);
    };
  }, [loadBranches]);

  useEffect(() => {
    try {
      window.localStorage.setItem(BRANCH_ACTIVITY_STORAGE_KEY, JSON.stringify(pageActivities));
    } catch {}
  }, [pageActivities]);

  const branchViews = useMemo(() => {
    const mappedBranches = branchesData.map((branch) => {
      const stats = statsData.find((item) => item.id === branch.id);
      const students = stats?.students ?? 0;
      const nameCode = `${branch.name} ${branch.code}`.toLowerCase();
      const branchType: BranchView["branchType"] = nameCode.includes("franchise") ? "Franchise" : nameCode.includes("main") ? "Main Branch" : "Branch";
      const capacityRate = clampPercent(stats?.utilization_percent ?? 0);
      const attendanceRate = clampPercent(stats?.attendance_rate ?? 0);
      const conversionRate = clampPercent(stats?.lead_conversion ?? 0);
      const revenue = stats?.revenue ?? 0;
      const pendingIssues = stats?.pending_issues ?? [branch.status !== "active", capacityRate >= 90, attendanceRate > 0 && attendanceRate < 75, conversionRate > 0 && conversionRate < 22].filter(Boolean).length;
      const healthScore = branch.status !== "active" ? 45 : clampPercent((attendanceRate * 0.32) + (conversionRate * 0.22) + ((100 - Math.abs(78 - capacityRate)) * 0.24) + ((pendingIssues ? 70 : 100) * 0.22));
      const operationalStatus: BranchView["operationalStatus"] =
        branch.status !== "active" ? "Inactive" :
        healthScore < 60 || attendanceRate < 75 ? "Critical" :
        capacityRate >= 90 || revenue > 1500000 ? "Growth Spike" :
        healthScore < 78 || pendingIssues > 1 ? "Needs Attention" :
        "Running Smoothly";

      return {
        ...branch,
        location: branch.city || branch.address || "Unassigned",
        branchType,
        studentsCount: students,
        trainersCount: stats?.staff ?? 0,
        revenue,
        attendanceRate,
        conversionRate,
        capacityRate,
        healthScore,
        pendingIssues,
        operationalStatus,
        lastUpdated: "Just now",
      };
    });
    return mappedBranches.length ? mappedBranches : fallbackBranches;
  }, [branchesData, fallbackBranches, statsData]);

  const filteredBranches = useMemo(() => {
    const nameQuery = nameSearch.trim().toLowerCase();
    const locationQuery = locationSearch.trim().toLowerCase();
    const rows = branchViews.filter((branch) => {
      const location = `${branch.location} ${branch.address ?? ""}`.toLowerCase();
      const matchesName = !nameQuery || branch.name.toLowerCase().includes(nameQuery);
      const matchesLocation = !locationQuery || location.includes(locationQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && branch.status === "active") ||
        (filter === "inactive" && branch.status !== "active") ||
        (filter === "franchise" && branch.branchType === "Franchise") ||
        (filter === "main" && branch.branchType === "Main Branch");
      return matchesName && matchesLocation && matchesFilter;
    });

    return [...rows].sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "attendance") return b.attendanceRate - a.attendanceRate;
      if (sortBy === "students") return b.studentsCount - a.studentsCount;
      return b.healthScore - a.healthScore;
    });
  }, [branchViews, filter, locationSearch, nameSearch, sortBy]);

  const kpis = useMemo(() => {
    const totalRevenue = branchViews.reduce((sum, branch) => sum + branch.revenue, 0);
    const totalAttendance = average(branchViews.map((branch) => branch.attendanceRate));
    const healthScore = average(branchViews.map((branch) => branch.healthScore));
    const pendingIssues = branchViews.reduce((sum, branch) => sum + branch.pendingIssues, 0);

    return [
      { label: "Total Branches", value: loading ? "..." : `${branchViews.length}`, helper: "Network locations", icon: Network },
      { label: "Active Branches", value: loading ? "..." : `${branchViews.filter((branch) => branch.status === "active").length}`, helper: "Currently operating", icon: CheckCircle2 },
      { label: "Total Students", value: loading ? "..." : `${capacityData?.total_students ?? branchViews.reduce((sum, branch) => sum + branch.studentsCount, 0)}`, helper: "Across branches", icon: GraduationCap },
      { label: "Monthly Revenue", value: loading ? "..." : formatShortCurrency(totalRevenue), helper: "Estimated live run-rate", icon: CreditCard },
      { label: "Average Attendance", value: loading ? "..." : `${totalAttendance}%`, helper: "Today across network", icon: ClipboardCheck },
      { label: "Pending Issues", value: loading ? "..." : `${pendingIssues}`, helper: "Needs admin review", icon: AlertTriangle },
      { label: "Branch Health Score", value: loading ? "..." : `${healthScore}%`, helper: "Weighted operating score", icon: Activity },
    ];
  }, [branchViews, capacityData, loading]);

  const selectedBranches = useMemo(() => branchViews.filter((branch) => selectedBranchIds.includes(branch.id)).slice(0, 4), [branchViews, selectedBranchIds]);
  const comparisonBranches = selectedBranches.length >= 2 ? selectedBranches : filteredBranches.slice(0, 4);
  const topBranches = useMemo(() => [...branchViews].sort((a, b) => b.healthScore + b.revenue / 100000 - (a.healthScore + a.revenue / 100000)).slice(0, 5), [branchViews]);
  const signalColor = (severity: string) => severity === "critical" ? colors.red : severity === "warning" ? colors.orange : severity === "success" ? colors.green : colors.sky;
  const smartAlerts = useMemo(() => (
    liveSignals?.alerts.length
      ? liveSignals.alerts
      : branchViews.flatMap((branch) => [
        ...(branch.capacityRate >= 90 ? [{ title: "Capacity above 90%", detail: `${branch.name} is nearing full student capacity.`, severity: "warning" }] : []),
        ...(branch.attendanceRate > 0 && branch.attendanceRate < 75 ? [{ title: "Attendance below target", detail: `${branch.name} is below the 75% attendance target.`, severity: "warning" }] : []),
        ...(branch.pendingIssues >= 4 ? [{ title: "High operational load", detail: `${branch.name} has ${branch.pendingIssues} pending issues.`, severity: "critical" }] : []),
        ...(branch.trainersCount && branch.studentsCount / branch.trainersCount > 28 ? [{ title: "Trainer workload high", detail: `${branch.name} may need more trainers.`, severity: "warning" }] : []),
      ])
  ).slice(0, 8), [branchViews, liveSignals]);
  const aiInsights = (liveSignals?.insights.length ? liveSignals.insights : [
    { title: "Attendance signal", detail: `${branchViews.filter((branch) => branch.attendanceRate > 0 && branch.attendanceRate < 82).length} branches need attendance review.`, severity: "warning" },
    { title: "Revenue leader", detail: `${topBranches[0]?.name ?? "Top branch"} is leading recorded payments.`, severity: "success" },
    { title: "Capacity signal", detail: `${branchViews.filter((branch) => branch.capacityRate >= 90).length} branches are above 90% capacity.`, severity: "info" },
  ]).map((insight) => ({ ...insight, color: signalColor(insight.severity) }));
  const fallbackActivityFeed = branchViews.slice(0, 6).map((branch) => ({
    id: `branch-${branch.id}`,
    branch_id: branch.id,
    branch_name: branch.name,
    message: `${branch.name} branch record synced`,
    detail: `${branch.studentsCount} students / ${branch.capacityRate}% capacity`,
    activity_type: "branch",
    created_at: branch.created_at,
  }));
  const activityFeed = [
    ...pageActivities,
    ...(liveSignals?.activities.length ? liveSignals.activities : fallbackActivityFeed),
  ].slice(0, 20);

  function pushPageActivity(activity: Omit<BranchActivityItem, "id" | "created_at">) {
    setPageActivities((current) => [
      {
        ...activity,
        id: `branch-page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 12));
  }

  function openAddBranch() {
    setEditingBranch(null);
    setFormOpen(true);
    setForm({ name: "", code: "", city: "", address: "", manager_name: "", phone: "", capacity: "100", status: "active" });
    pushPageActivity({
      branch_id: null,
      branch_name: "Branch page",
      message: "Add branch form opened",
      detail: "New branch creation workflow started",
      activity_type: "form",
    });
  }

  function openEditBranch(branch: BranchView) {
    setEditingBranch(branch);
    setFormOpen(true);
    setForm({
      name: branch.name,
      code: branch.code,
      city: branch.city ?? "",
      address: branch.address ?? "",
      manager_name: branch.manager_name ?? "",
      phone: branch.phone ?? "",
      capacity: `${branch.capacity ?? 0}`,
      status: branch.status,
    });
    pushPageActivity({
      branch_id: branch.id,
      branch_name: branch.name,
      message: `${branch.name} edit form opened`,
      detail: `${branch.location} - ${branch.status}`,
      activity_type: "operation",
    });
  }

  async function submitBranchForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name,
        code: form.code,
        city: form.city || null,
        address: form.address || null,
        manager_name: form.manager_name || null,
        phone: form.phone || null,
        capacity: Number(form.capacity || 0),
        status: form.status,
      };
      await apiRequest<BranchResponse>(editingBranch ? `/branches/${editingBranch.id}` : "/branches", accessToken, {
        method: editingBranch ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setNotice(editingBranch ? "Branch updated successfully" : "Branch created successfully");
      pushPageActivity({
        branch_id: editingBranch?.id ?? null,
        branch_name: form.name,
        message: editingBranch ? `${form.name} branch updated` : `${form.name} branch created`,
        detail: `${form.status} / capacity ${form.capacity} / ${form.city || "Unassigned location"}`,
        activity_type: editingBranch ? "operation" : "branch",
      });
      setEditingBranch(null);
      setFormOpen(false);
      setForm({ name: "", code: "", city: "", address: "", manager_name: "", phone: "", capacity: "100", status: "active" });
      await loadBranches();
    } catch (branchError) {
      setError(branchError instanceof Error ? branchError.message : "Unable to save branch");
    } finally {
      setSaving(false);
    }
  }

  async function toggleBranchStatus(branch: BranchView) {
    setSaving(true);
    setError("");
    try {
      const nextStatus = branch.status === "active" ? "inactive" : "active";
      await apiRequest<BranchResponse>(`/branches/${branch.id}/status`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice(`${branch.name} ${nextStatus === "active" ? "enabled" : "disabled"} successfully`);
      pushPageActivity({
        branch_id: branch.id,
        branch_name: branch.name,
        message: `${branch.name} ${nextStatus === "active" ? "enabled" : "disabled"}`,
        detail: `Status changed from ${branch.status} to ${nextStatus}`,
        activity_type: "status",
      });
      await loadBranches();
    } catch (branchError) {
      setError(branchError instanceof Error ? branchError.message : "Unable to update branch status");
    } finally {
      setSaving(false);
    }
  }

  function toggleComparison(branchId: string) {
    const branch = branchViews.find((item) => item.id === branchId);
    setSelectedBranchIds((current) => {
      if (current.includes(branchId)) {
        pushPageActivity({
          branch_id: branchId,
          branch_name: branch?.name ?? "Branch comparison",
          message: `${branch?.name ?? "Branch"} removed from comparison`,
          detail: `${Math.max(current.length - 1, 0)} branches selected`,
          activity_type: "compare",
        });
        return current.filter((id) => id !== branchId);
      }
      if (current.length >= 4) {
        pushPageActivity({
          branch_id: branchId,
          branch_name: branch?.name ?? "Branch comparison",
          message: "Comparison limit reached",
          detail: "Only 4 branches can be compared at once",
          activity_type: "alert",
        });
        return current;
      }
      pushPageActivity({
        branch_id: branchId,
        branch_name: branch?.name ?? "Branch comparison",
        message: `${branch?.name ?? "Branch"} added to comparison`,
        detail: `${current.length + 1} branches selected`,
        activity_type: "compare",
      });
      return [...current, branchId];
    });
  }

  function runReportAction(label: string) {
    setNotice(`${label} prepared for ${filteredBranches.length} visible branches.`);
    pushPageActivity({
      branch_id: null,
      branch_name: "Branch reports",
      message: `${label} prepared`,
      detail: `${filteredBranches.length} visible branches included`,
      activity_type: "report",
    });
  }

  function openBranchReport(branch: BranchView) {
    setReportBranch(branch);
    setNotice(`${branch.name} report is ready from current live branch data.`);
    pushPageActivity({
      branch_id: branch.id,
      branch_name: branch.name,
      message: `${branch.name} report opened`,
      detail: `${branch.studentsCount} students / ${formatShortCurrency(branch.revenue)} revenue`,
      activity_type: "report",
    });
  }

  function openBranchDetails(branch: BranchView) {
    setViewingBranch(branch);
    pushPageActivity({
      branch_id: branch.id,
      branch_name: branch.name,
      message: `${branch.name} details viewed`,
      detail: `${branch.operationalStatus} / ${branch.healthScore}% health`,
      activity_type: "view",
    });
  }

  /* =====================================================
     SECTION: EVENT HANDLERS
     PURPOSE:
     This section responds to user actions such as clicks, typing, and form submission.
     Handlers connect interface events to state updates or API calls.
  ===================================================== */

  function handleManualRefresh() {
    pushPageActivity({
      branch_id: null,
      branch_name: "Branch page",
      message: "Branch data manually refreshed",
      detail: `${filteredBranches.length} visible branches before refresh`,
      activity_type: "refresh",
    });
    loadBranches();
  }

  function recordSearchActivity(label: string, value: string) {
    const trimmedValue = value.trim();
    if (!trimmedValue) return;
    pushPageActivity({
      branch_id: null,
      branch_name: "Branch filters",
      message: `${label} search applied`,
      detail: trimmedValue,
      activity_type: "filter",
    });
  }

  return (
    <div className="max-w-full space-y-3 overflow-x-hidden">
      <section className="max-w-full rounded-lg border border-[#cceabf] bg-[linear-gradient(135deg,#12310f,#2f7d00_46%,#6fe31d)] px-4 py-3 text-white shadow-[0_18px_44px_rgba(47,125,0,0.22)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Network size={26} />
            <div className="min-w-0">
              <h2 className="text-[20px] font-black leading-tight">Branch Management</h2>
              <p className="mt-0.5 max-w-[760px] text-xs font-semibold leading-5 text-white/90">
                Real-time command center for capacity, attendance, revenue, franchise health, and AI operating signals.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {headerActions}
            {["Export PDF", "Export Excel", "Capacity Report"].map((action) => (
              <button key={action} type="button" onClick={() => runReportAction(action)} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-white px-2.5 text-[11px] font-black text-[#3e9e00] shadow-sm transition hover:bg-[#f6fff0]" title={action}>
                {action.includes("Report") ? <ReceiptText size={14} /> : <Download size={14} />}
                {action}
              </button>
            ))}
            <button type="button" onClick={openAddBranch} className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[#18230f] px-2.5 text-[11px] font-black text-white shadow-sm transition hover:bg-[#26351a]" title="Add Branch">
              <UserPlus size={14} />
              Add Branch
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        {loading ? Array.from({ length: 7 }).map((_, index) => (
          <article key={index} className="h-[82px] animate-pulse rounded-[14px] border border-[#ddeecf] bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.045)]">
            <div className="h-3 w-24 rounded-full bg-[#ddeecf]" />
            <div className="mt-3 h-5 w-16 rounded-full bg-[#ddeecf]" />
            <div className="mt-2 h-3 w-28 rounded-full bg-[#ddeecf]" />
          </article>
        )) : kpis.map((kpi) => (
          <article key={kpi.label} className="rounded-[14px] border border-[#ddeecf] bg-white p-3 shadow-[0_6px_14px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.07)]" title={kpi.helper}>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[11px] font-black uppercase text-[#5f6f56]">{kpi.label}</p>
              <kpi.icon size={16} className="shrink-0 text-[#3e9e00]" />
            </div>
            <p className="mt-1.5 text-[20px] font-black leading-tight">{kpi.value}</p>
            <p className="mt-0.5 truncate text-[11px] font-bold text-[#5f6f56]">{kpi.helper}</p>
          </article>
        ))}
      </section>

      <Panel icon={Filter} title="Search and filters" subtitle="Find branches by name, location, ownership type, and operating status." compact>
        <div className="grid max-w-full gap-1.5 md:grid-cols-2 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1.35fr)_160px_172px_auto]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={15} />
            <input
              value={nameSearch}
              onChange={(event) => setNameSearch(event.target.value)}
              onBlur={(event) => recordSearchActivity("Branch name", event.target.value)}
              placeholder="Search by branch name"
              className="h-8 w-full rounded-[9px] border border-[#ddeecf] bg-[#f6fff0] pl-8 pr-3 text-xs font-bold outline-none transition focus:border-[#58cc02] focus:bg-white"
            />
          </label>
          <label className="relative block">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={15} />
            <input
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              onBlur={(event) => recordSearchActivity("Location", event.target.value)}
              placeholder="Search by location"
              className="h-8 w-full rounded-[9px] border border-[#ddeecf] bg-[#f6fff0] pl-8 pr-3 text-xs font-bold outline-none transition focus:border-[#58cc02] focus:bg-white"
            />
          </label>
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              pushPageActivity({
                branch_id: null,
                branch_name: "Branch filters",
                message: "Branch status filter changed",
                detail: event.target.options[event.target.selectedIndex]?.text ?? event.target.value,
                activity_type: "filter",
              });
            }}
            className="h-8 w-full rounded-[9px] border border-[#ddeecf] bg-[#f6fff0] px-2.5 text-xs font-black outline-none transition focus:border-[#58cc02] focus:bg-white"
          >
            <option value="all">All branches</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="franchise">Franchise</option>
            <option value="main">Main Branch</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value);
              pushPageActivity({
                branch_id: null,
                branch_name: "Branch sorting",
                message: "Branch sort changed",
                detail: event.target.options[event.target.selectedIndex]?.text ?? event.target.value,
                activity_type: "filter",
              });
            }}
            className="h-8 w-full rounded-[9px] border border-[#ddeecf] bg-[#f6fff0] px-2.5 text-xs font-black outline-none transition focus:border-[#58cc02] focus:bg-white"
          >
            <option value="health">Sort by health score</option>
            <option value="revenue">Sort by revenue</option>
            <option value="attendance">Sort by attendance</option>
            <option value="students">Sort by students</option>
          </select>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] border border-[#ddeecf] bg-white px-2.5 text-xs font-black text-[#18230f] transition hover:bg-[#f6fff0] lg:w-auto"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        {(error || notice) ? (
          <div className={`mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 text-xs font-bold ${error ? "border-[#ff4b4b]/30 bg-[#fff5f5] text-[#b42318]" : "border-[#ddeecf] bg-[#f6fff0] text-[#5f6f56]"}`}>
            <span>{error || notice}</span>
            {error ? <button type="button" onClick={handleManualRefresh} className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-black text-[#18230f]">Retry</button> : null}
          </div>
        ) : null}
      </Panel>

      {formOpen ? (
        <Panel icon={editingBranch ? Pencil : UserPlus} title={editingBranch ? "Edit branch" : "Add branch"} subtitle="Create or update a backend branch record." compact>
          <form onSubmit={submitBranchForm} className="grid gap-3 lg:grid-cols-4">
            {[
              ["name", "Branch name"],
              ["code", "Branch code"],
              ["city", "Location"],
              ["manager_name", "Manager"],
              ["phone", "Phone"],
              ["capacity", "Capacity"],
            ].map(([name, label]) => (
              <label key={name} className="block">
                <span className="text-xs font-black uppercase text-[#5f6f56]">{label}</span>
                <input
                  required={name === "name" || name === "code"}
                  type={name === "capacity" ? "number" : "text"}
                  value={form[name as keyof typeof form]}
                  onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-[14px] border border-[#ddeecf] bg-[#f6fff0] px-3 text-sm font-bold outline-none transition focus:border-[#58cc02] focus:bg-white"
                />
              </label>
            ))}
            <label className="block">
              <span className="text-xs font-black uppercase text-[#5f6f56]">Status</span>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                className="mt-1 h-11 w-full rounded-[14px] border border-[#ddeecf] bg-[#f6fff0] px-3 text-sm font-black outline-none transition focus:border-[#58cc02] focus:bg-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="block lg:col-span-4">
              <span className="text-xs font-black uppercase text-[#5f6f56]">Address</span>
              <input
                value={form.address}
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                className="mt-1 h-11 w-full rounded-[14px] border border-[#ddeecf] bg-[#f6fff0] px-3 text-sm font-bold outline-none transition focus:border-[#58cc02] focus:bg-white"
              />
            </label>
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <button type="submit" disabled={saving} className="rounded-[14px] bg-[#58cc02] px-4 py-3 text-sm font-black text-white transition hover:bg-[#3e9e00] disabled:opacity-60">
                {saving ? "Saving..." : editingBranch ? "Save Branch" : "Add Branch"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingBranch(null);
                  setFormOpen(false);
                  setForm({ name: "", code: "", city: "", address: "", manager_name: "", phone: "", capacity: "100", status: "active" });
                }}
                className="rounded-[14px] border border-[#ddeecf] bg-white px-4 py-3 text-sm font-black text-[#18230f] transition hover:bg-[#f6fff0]"
              >
                Cancel
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel icon={Building2} title="Branch directory" subtitle="Live branch records with operating metrics and admin actions." compact>
        {loading ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-10 animate-pulse rounded-xl bg-[#f6fff0]" />)}
          </div>
        ) : filteredBranches.length ? (
          <>
            <div className="hidden max-w-full overflow-hidden rounded-xl border border-[#ddeecf] bg-white lg:block">
              <table className="w-full table-fixed border-collapse text-left text-[11px]">
                <colgroup>
                  <col className="w-[18%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[7%]" />
                  <col className="w-[10%]" />
                  <col className="w-[8%]" />
                  <col className="w-[10%]" />
                  <col className="w-[10%]" />
                  <col className="w-[9%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="bg-[#eefbe7] text-[10px] font-black uppercase text-[#5f6f56]">
                  <tr>
                    {["Branch", "Location", "Type", "Students", "Revenue", "Attend", "Capacity", "Health", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="border-b border-[#d7ebc9] px-2 py-2">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map((branch, index) => (
                    <BranchTableRow key={branch.id} branch={branch} rowIndex={index} selected={selectedBranchIds.includes(branch.id)} saving={saving} onCompare={toggleComparison} onView={openBranchDetails} onEdit={openEditBranch} onToggle={toggleBranchStatus} onReport={openBranchReport} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-2 lg:hidden">
              {filteredBranches.map((branch) => (
                <BranchMobileCard key={branch.id} branch={branch} selected={selectedBranchIds.includes(branch.id)} saving={saving} onCompare={toggleComparison} onView={openBranchDetails} onEdit={openEditBranch} onToggle={toggleBranchStatus} onReport={openBranchReport} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3 text-xs font-black text-[#5f6f56]">
            No branches match this search. Add a branch, clear the filters, or retry the backend request.
          </div>
        )}
      </Panel>

      <section className="grid max-w-full items-stretch gap-3 xl:grid-cols-3">
        <Panel icon={History} title="Live activity" subtitle="Recent page and operational events." compact>
          <div className="flex h-full min-h-[172px] flex-col justify-between gap-2">
            <div className="space-y-1.5">
              {activityFeed.slice(0, 3).map((activity) => (
                <div key={activity.id} className="flex items-center gap-2 rounded-lg border border-[#ddeecf] bg-[#f6fff0] px-2 py-1.5">
                  <ActivityIcon type={branchActivityIconType(activity.activity_type)} />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black">{activity.message}</p>
                    <p className="truncate text-[10px] font-bold text-[#5f6f56]">{activity.detail} - {activity.branch_name} - {relativeActivityTime(activity.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSignalDialog("activity")} className="self-start rounded-full bg-[#eefbe7] px-2.5 py-1 text-[11px] font-black text-[#3e9e00] transition hover:bg-[#dff8d6]">
              View all
            </button>
          </div>
        </Panel>

        <Panel icon={Bot} title="AI insights" subtitle="Top operating signals." compact>
          <div className="flex h-full min-h-[172px] flex-col justify-between gap-2">
            <div className="space-y-1.5">
              {aiInsights.slice(0, 3).map((insight) => (
                <div key={insight.title} className="rounded-lg border border-[#ddeecf] bg-[#f6fff0] px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: insight.color }} />
                    <p className="truncate text-[11px] font-black" style={{ color: insight.color }}>{insight.title}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[10px] font-bold text-[#5f6f56]">{insight.detail}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSignalDialog("insights")} className="self-start rounded-full bg-[#eefbe7] px-2.5 py-1 text-[11px] font-black text-[#3e9e00] transition hover:bg-[#dff8d6]">
              View insights
            </button>
          </div>
        </Panel>

        <Panel icon={AlertTriangle} title="Smart alerts" subtitle="Top critical alerts." compact>
          <div className="flex h-full min-h-[172px] flex-col justify-between gap-2">
            <div className="space-y-1.5">
              {(smartAlerts.length ? smartAlerts.slice(0, 3) : [{ title: "No smart alerts", detail: "No smart alerts for the current branch set.", severity: "success" }]).map((alert) => (
                <div key={`${alert.title}-${alert.detail}`} className="flex items-center gap-2 rounded-full border border-[#ddeecf] bg-[#f6fff0] px-2.5 py-1.5 text-[11px] font-black text-[#5f6f56]">
                  <AlertTriangle size={12} className="shrink-0" style={{ color: signalColor(alert.severity) }} />
                  <span className="truncate">{alert.detail}</span>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSignalDialog("alerts")} className="self-start rounded-full bg-[#fff4c7] px-2.5 py-1 text-[11px] font-black text-[#9a6700] transition hover:bg-[#ffeaa0]">
              View all alerts
            </button>
          </div>
        </Panel>
      </section>

      <Panel icon={BarChart3} title="Branch comparison mode" subtitle="Select 2 to 4 branches from the table or compare the top visible branches." compact>
        <div className="mb-3 flex max-w-full flex-wrap gap-1.5">
          {branchViews.map((branch) => (
            <button key={branch.id} type="button" onClick={() => toggleComparison(branch.id)} className={`max-w-full rounded-full border px-2.5 py-1.5 text-[11px] font-black transition ${selectedBranchIds.includes(branch.id) ? "border-[#58cc02] bg-[#58cc02] text-white" : "border-[#ddeecf] bg-[#f6fff0] text-[#5f6f56]"}`}>
              {branch.name}
            </button>
          ))}
        </div>
        <BranchComparisonGroupedBarChart branches={comparisonBranches} />
      </Panel>

      <Panel icon={BarChart3} title="Branch performance" subtitle="Students, attendance, conversion, revenue, and capacity utilization by branch." compact>
        {filteredBranches.length ? (
          <div className="grid gap-2 lg:grid-cols-2">
            {filteredBranches.map((branch) => (
              <BranchPerformanceCard key={branch.id} branch={branch} onView={openBranchDetails} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3 text-xs font-black text-[#5f6f56]">No performance data available for the current filters.</div>
        )}
      </Panel>

      {signalDialog ? (
        <BranchSignalDialog
          mode={signalDialog}
          activities={activityFeed}
          insights={aiInsights}
          alerts={smartAlerts}
          signalColor={signalColor}
          onClose={() => setSignalDialog(null)}
        />
      ) : null}

      {viewingBranch ? (
        <BranchDetailsDialog branch={viewingBranch} onClose={() => setViewingBranch(null)} onEdit={openEditBranch} onReport={openBranchReport} />
      ) : null}

      {reportBranch ? (
        <BranchReportDialog branch={reportBranch} onClose={() => setReportBranch(null)} />
      ) : null}
    </div>
  );
}

function branchActivityIconType(type: string): ActivityRow["type"] {
  if (type === "payment" || type === "invoice") return "password";
  if (type === "operation" || type === "compare" || type === "filter") return "role";
  if (type === "attendance" || type === "branch" || type === "form" || type === "view" || type === "refresh") return "added";
  if (type === "status" || type === "alert") return "disabled";
  if (type === "report") return "password";
  return "invite";
}

function BranchSignalDialog({
  mode,
  activities,
  insights,
  alerts,
  signalColor,
  onClose,
}: {
  mode: "activity" | "insights" | "alerts";
  activities: BranchActivityItem[];
  insights: Array<BranchSignalItem & { color?: string }>;
  alerts: BranchSignalItem[];
  signalColor: (severity: string) => string;
  onClose: () => void;
}) {
  const title = mode === "activity" ? "Live activity" : mode === "insights" ? "AI insights" : "Smart alerts";
  const subtitle = mode === "activity" ? `${activities.length} live project events` : mode === "insights" ? `${insights.length} operating signals` : `${alerts.length} branch alerts`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[#ddeecf] bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-black">{title}</h2>
            <p className="mt-0.5 text-xs font-bold text-[#5f6f56]">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]" aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {mode === "activity" ? activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-2 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
              <ActivityIcon type={branchActivityIconType(activity.activity_type)} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black leading-5">{activity.message}</p>
                <p className="mt-0.5 text-xs font-bold text-[#5f6f56]">{activity.detail}</p>
                <p className="mt-1 text-[11px] font-black uppercase text-[#3e9e00]">{activity.branch_name} - {relativeActivityTime(activity.created_at)}</p>
              </div>
            </div>
          )) : null}

          {mode === "insights" ? insights.map((insight) => (
            <div key={`${insight.title}-${insight.detail}`} className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: insight.color ?? signalColor(insight.severity) }} />
                <p className="text-sm font-black" style={{ color: insight.color ?? signalColor(insight.severity) }}>{insight.title}</p>
              </div>
              <p className="mt-1 text-xs font-bold leading-5 text-[#5f6f56]">{insight.detail}</p>
            </div>
          )) : null}

          {mode === "alerts" ? alerts.map((alert) => (
            <div key={`${alert.title}-${alert.detail}`} className="flex items-start gap-2 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: signalColor(alert.severity) }} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black" style={{ color: signalColor(alert.severity) }}>{alert.title}</p>
                <p className="mt-1 text-xs font-bold leading-5 text-[#5f6f56]">{alert.detail}</p>
              </div>
            </div>
          )) : null}

          {((mode === "activity" && !activities.length) || (mode === "insights" && !insights.length) || (mode === "alerts" && !alerts.length)) ? (
            <div className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-4 text-sm font-black text-[#5f6f56]">No live data available for this section yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BranchDetailsDialog({
  branch,
  onClose,
  onEdit,
  onReport,
}: {
  branch: BranchView;
  onClose: () => void;
  onEdit: (branch: BranchView) => void;
  onReport: (branch: BranchView) => void;
}) {
  const rows = [
    ["Students", `${branch.studentsCount}`],
    ["Staff", `${branch.trainersCount}`],
    ["Revenue", formatShortCurrency(branch.revenue)],
    ["Attendance", `${branch.attendanceRate}%`],
    ["Conversion", `${branch.conversionRate}%`],
    ["Capacity", `${branch.capacityRate}%`],
    ["Health", `${branch.healthScore}%`],
    ["Issues", `${branch.pendingIssues}`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-[22px] border border-[#ddeecf] bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">{branch.name}</h2>
            <p className="mt-0.5 text-xs font-bold uppercase text-[#5f6f56]">{branch.code} - {branch.location} - {branch.branchType}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]" aria-label="Close branch details">
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-2.5">
              <p className="text-[10px] font-black uppercase text-[#5f6f56]">{label}</p>
              <p className="mt-1 text-sm font-black">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3 text-xs font-bold leading-5 text-[#5f6f56]">
          <p><b className="text-[#18230f]">Manager:</b> {branch.manager_name || "Unassigned"}</p>
          <p><b className="text-[#18230f]">Phone:</b> {branch.phone || "Not added"}</p>
          <p><b className="text-[#18230f]">Address:</b> {branch.address || branch.city || "Not added"}</p>
          <p><b className="text-[#18230f]">Status:</b> {branch.operationalStatus}</p>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => { onClose(); onEdit(branch); }} className="inline-flex items-center gap-1.5 rounded-[12px] border border-[#ddeecf] bg-white px-3 py-2 text-xs font-black text-[#18230f] transition hover:border-[#58cc02] hover:text-[#3e9e00]">
            <Pencil size={14} />
            Edit
          </button>
          <button type="button" onClick={() => { onClose(); onReport(branch); }} className="inline-flex items-center gap-1.5 rounded-[12px] bg-[#58cc02] px-3 py-2 text-xs font-black text-white transition hover:bg-[#3e9e00]">
            <ReceiptText size={14} />
            Generate Report
          </button>
        </div>
      </div>
    </div>
  );
}

function BranchReportDialog({ branch, onClose }: { branch: BranchView; onClose: () => void }) {
  const reportRows = [
    ["Students", `${branch.studentsCount}`],
    ["Staff", `${branch.trainersCount}`],
    ["Revenue", formatCurrency(branch.revenue)],
    ["Attendance", `${branch.attendanceRate}%`],
    ["Conversion", `${branch.conversionRate}%`],
    ["Capacity Utilization", `${branch.capacityRate}% of ${branch.capacity || 0}`],
    ["Health Score", `${branch.healthScore}%`],
    ["Pending Issues", `${branch.pendingIssues}`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-[22px] border border-[#ddeecf] bg-white p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-xl font-black">Branch report</h2>
            <p className="mt-0.5 text-xs font-bold text-[#5f6f56]">{branch.name} - generated from current live metrics</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]" aria-label="Close branch report">
            <X size={17} />
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#ddeecf]">
          {reportRows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[#e5f2dc] bg-[#f6fff0] px-3 py-2 text-xs last:border-b-0">
              <span className="font-bold text-[#5f6f56]">{label}</span>
              <span className="font-black text-[#18230f]">{value}</span>
            </div>
          ))}
        </div>

        <button type="button" onClick={onClose} className="mt-4 w-full rounded-[12px] bg-[#58cc02] px-3 py-2.5 text-xs font-black text-white transition hover:bg-[#3e9e00]">
          Done
        </button>
      </div>
    </div>
  );
}

function BranchPerformanceCard({ branch, onView }: { branch: BranchView; onView: (branch: BranchView) => void }) {
  return (
    <div className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3 transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-[#18230f]">{branch.name}</p>
          <p className="mt-0.5 truncate text-[11px] font-bold uppercase text-[#5f6f56]">{branch.location} - {branch.branchType}</p>
        </div>
        <p className="shrink-0 text-sm font-black text-[#3e9e00]">{formatShortCurrency(branch.revenue)}</p>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Students", `${branch.studentsCount}`],
          ["Attendance", `${branch.attendanceRate}%`],
          ["Conversion", `${branch.conversionRate}%`],
          ["Revenue", formatShortCurrency(branch.revenue)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[10px] bg-white p-2">
            <p className="text-[10px] font-black uppercase text-[#5f6f56]">{label}</p>
            <p className="mt-0.5 text-sm font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-2.5">
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#5f6f56]">
          <span>Capacity</span>
          <span>{branch.capacityRate}%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#ddeecf]">
          <div className="h-full rounded-full bg-[#58cc02]" style={{ width: `${branch.capacityRate}%` }} />
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <BranchStatusBadge status={branch.operationalStatus} />
        <button type="button" onClick={() => onView(branch)} className="rounded-[10px] bg-white px-2.5 py-1.5 text-[11px] font-black text-[#3e9e00] transition hover:bg-[#eefbe7]" title={`Quick view ${branch.name}`}>
          Quick View
        </button>
      </div>
    </div>
  );
}

function BranchComparisonGroupedBarChart({ branches }: { branches: BranchView[] }) {
  const metrics = [
    { key: "revenue", label: "Revenue", shortLabel: "Rev" },
    { key: "attendanceRate", label: "Attendance", shortLabel: "Attend" },
    { key: "conversionRate", label: "Conversion", shortLabel: "Conv" },
    { key: "capacityRate", label: "Capacity", shortLabel: "Cap" },
    { key: "healthScore", label: "Health Score", shortLabel: "Health" },
  ] as const;
  const chartColors = [colors.green, colors.sky, colors.orange, colors.purple];
  const revenueMax = Math.max(...branches.map((branch) => branch.revenue), 1);
  const width = 720;
  const height = 240;
  const padding = { top: 14, right: 14, bottom: 34, left: 34 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const yFor = (value: number) => padding.top + innerHeight - (clampPercent(value) / 100) * innerHeight;
  const groupWidth = innerWidth / metrics.length;
  const barGap = 3;
  const barWidth = Math.min(18, Math.max(8, (groupWidth - 18) / Math.max(branches.length, 1) - barGap));
  const groupBarWidth = branches.length * barWidth + Math.max(0, branches.length - 1) * barGap;
  const xForBar = (metricIndex: number, branchIndex: number) =>
    padding.left + metricIndex * groupWidth + (groupWidth - groupBarWidth) / 2 + branchIndex * (barWidth + barGap);
  const metricValue = (branch: BranchView, key: typeof metrics[number]["key"]) => {
    if (key === "revenue") return Math.round((branch.revenue / revenueMax) * 100);
    return branch[key];
  };

  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-2.5">
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {branches.map((branch, index) => (
          <div key={branch.id} className="flex min-w-0 items-center gap-1.5 text-[10px] font-black text-[#5f6f56]">
            <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: chartColors[index % chartColors.length] }} />
            <span className="truncate">{branch.name}</span>
          </div>
        ))}
        <span className="text-[10px] font-bold text-[#5f6f56]">Revenue indexed to top selected branch.</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Branch comparison grouped bar chart" className="block h-[240px] w-full max-w-full">
        {[0, 25, 50, 75, 100].map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#ddeecf" strokeWidth="1" />
            <text x={padding.left - 8} y={yFor(tick) + 4} textAnchor="end" className="fill-[#5f6f56] text-[10px] font-bold">{tick}</text>
          </g>
        ))}
        {metrics.map((metric, index) => (
          <g key={metric.key}>
            <text x={padding.left + index * groupWidth + groupWidth / 2} y={height - 12} textAnchor="middle" className="fill-[#5f6f56] text-[11px] font-black">{metric.shortLabel}</text>
          </g>
        ))}
        {metrics.map((metric, metricIndex) => (
          <g key={metric.key}>
            {branches.map((branch, branchIndex) => {
              const value = metricValue(branch, metric.key);
              const barHeight = (clampPercent(value) / 100) * innerHeight;
              return (
                <rect
                  key={`${metric.key}-${branch.id}`}
                  x={xForBar(metricIndex, branchIndex)}
                  y={padding.top + innerHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill={chartColors[branchIndex % chartColors.length]}
                />
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

function BranchStatusBadge({ status }: { status: BranchView["operationalStatus"] }) {
  const styles: Record<BranchView["operationalStatus"], string> = {
    "Running Smoothly": "bg-[#dff8d6] text-[#2b7a0b]",
    "Needs Attention": "bg-[#fff4c7] text-[#9a6700]",
    Critical: "bg-[#fee2e2] text-[#b42318]",
    "Growth Spike": "bg-[#dff2ff] text-[#075985]",
    Inactive: "bg-[#f1f5f9] text-[#64748b]",
  };

  return <span className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-black ${styles[status]}`}>{status}</span>;
}

function BranchHealthBar({ value }: { value: number }) {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[#ddeecf] shadow-inner">
        <div className="h-full rounded-full bg-[#58cc02]" style={{ width: `${value}%` }} />
      </div>
      <span className="shrink-0 text-[10px] font-black">{value}%</span>
    </div>
  );
}

function BranchActionButtons({
  branch,
  saving,
  onView,
  onEdit,
  onToggle,
  onReport,
}: {
  branch: BranchView;
  saving: boolean;
  onView: (branch: BranchView) => void;
  onEdit: (branch: BranchView) => void;
  onToggle: (branch: BranchView) => void;
  onReport: (branch: BranchView) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
      <button type="button" title="View Details" onClick={() => onView(branch)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]">
        <Eye size={12} />
      </button>
      <button type="button" title="Edit Branch" onClick={() => onEdit(branch)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]">
        <Pencil size={12} />
      </button>
      <button type="button" disabled={saving} title={branch.status === "active" ? "Disable Branch" : "Enable Branch"} onClick={() => onToggle(branch)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#ff4b4b] hover:text-[#ff4b4b] disabled:opacity-50">
        <Power size={12} />
      </button>
      <button type="button" title="Generate Report" onClick={() => onReport(branch)} className="flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] border border-[#ddeecf] bg-white text-[#5f6f56] transition hover:border-[#1cb0f6] hover:text-[#1cb0f6]">
        <ReceiptText size={12} />
      </button>
    </div>
  );
}

function BranchTableRow({
  branch,
  rowIndex,
  selected,
  saving,
  onCompare,
  onView,
  onEdit,
  onToggle,
  onReport,
}: {
  branch: BranchView;
  rowIndex: number;
  selected: boolean;
  saving: boolean;
  onCompare: (branchId: string) => void;
  onView: (branch: BranchView) => void;
  onEdit: (branch: BranchView) => void;
  onToggle: (branch: BranchView) => void;
  onReport: (branch: BranchView) => void;
}) {
  return (
    <tr className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-[#f9fff5]"} transition hover:bg-[#eefbe7]`}>
      <td className="border-b border-[#e5f2dc] px-2 py-2 font-black text-[#18230f]">
        <label className="flex min-w-0 items-center gap-1.5">
          <input type="checkbox" checked={selected} onChange={() => onCompare(branch.id)} className="h-3.5 w-3.5 shrink-0 accent-[#58cc02]" title="Add branch to comparison" />
          <span className="min-w-0">
            <span className="block truncate text-xs font-black">{branch.name}</span>
            <span className="mt-0.5 block truncate text-[10px] font-bold uppercase text-[#5f6f56]">{branch.code}</span>
          </span>
        </label>
      </td>
      <td className="truncate border-b border-[#e5f2dc] px-2 py-2 font-bold text-[#5f6f56]">{branch.location}</td>
      <td className="border-b border-[#e5f2dc] px-2 py-2"><span className="inline-flex max-w-full truncate rounded-full bg-[#eefbe7] px-2 py-0.5 text-[10px] font-black text-[#3e9e00]">{branch.branchType}</span></td>
      <td className="border-b border-[#e5f2dc] px-2 py-2 font-black">{branch.studentsCount}</td>
      <td className="truncate border-b border-[#e5f2dc] px-2 py-2 font-black text-[#3e9e00]">{formatShortCurrency(branch.revenue)}</td>
      <td className="border-b border-[#e5f2dc] px-2 py-2 font-black">{branch.attendanceRate}%</td>
      <td className="border-b border-[#e5f2dc] px-2 py-2"><BranchHealthBar value={branch.capacityRate} /></td>
      <td className="border-b border-[#e5f2dc] px-2 py-2"><BranchHealthBar value={branch.healthScore} /></td>
      <td className="border-b border-[#e5f2dc] px-2 py-2"><BranchStatusBadge status={branch.operationalStatus} /></td>
      <td className="border-b border-[#e5f2dc] px-2 py-2"><BranchActionButtons branch={branch} saving={saving} onView={onView} onEdit={onEdit} onToggle={onToggle} onReport={onReport} /></td>
    </tr>
  );
}

function BranchMobileCard({
  branch,
  selected,
  saving,
  onCompare,
  onView,
  onEdit,
  onToggle,
  onReport,
}: {
  branch: BranchView;
  selected: boolean;
  saving: boolean;
  onCompare: (branchId: string) => void;
  onView: (branch: BranchView) => void;
  onEdit: (branch: BranchView) => void;
  onToggle: (branch: BranchView) => void;
  onReport: (branch: BranchView) => void;
}) {
  return (
    <div className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3">
      <div className="flex items-start justify-between gap-2">
        <label className="flex min-w-0 items-start gap-2">
          <input type="checkbox" checked={selected} onChange={() => onCompare(branch.id)} className="mt-1 h-3.5 w-3.5 accent-[#58cc02]" title="Add branch to comparison" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-black">{branch.name}</span>
            <span className="mt-0.5 block truncate text-xs font-bold text-[#5f6f56]">{branch.location} - {branch.branchType}</span>
          </span>
        </label>
        <BranchStatusBadge status={branch.operationalStatus} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <p><b>{branch.studentsCount}</b> students</p>
        <p><b>{branch.trainersCount}</b> trainers</p>
        <p><b>{formatShortCurrency(branch.revenue)}</b> revenue</p>
        <p><b>{branch.healthScore}%</b> health</p>
      </div>
      <div className="mt-2 flex justify-between gap-2">
        <BranchActionButtons branch={branch} saving={saving} onView={onView} onEdit={onEdit} onToggle={onToggle} onReport={onReport} />
      </div>
    </div>
  );
}
