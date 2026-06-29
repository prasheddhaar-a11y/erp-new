/* =====================================================
PINESPHERE ERP
Module      : HR Module
Component   : Hr
Purpose     : Renders and coordinates Hr UI behavior
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
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Eye,
  FileCheck2,
  Filter,
  Gauge,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

/* =====================================================
   SECTION: API CALLS
   PURPOSE:
   This section talks to backend or server endpoints.
   It sends requests, receives responses, and prepares data for the UI.
===================================================== */

import { apiRequest } from "../shared/api";
import { ConfirmActionModal } from "../shared/confirm-modal";

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

type IconType = ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;

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

type UserRow = {
  id: string;
  email: string;
  phone?: string | null;
  full_name: string;
  role: string;
  branch_id?: string | null;
  branch_name?: string | null;
  is_active: boolean;
  last_login?: string | null;
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
  courses: CourseRow[];
  sessions: AttendanceSessionRow[];
  students: UserRow[];
  users: UserRow[];
  branches: BranchResponse[];
};

type EmployeeRow = {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  role: string;
  department?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  reporting_manager?: string | null;
  joining_date?: string | null;
  salary: string | number;
  status: string;
  emergency_contact?: string | null;
  bank_account?: string | null;
  documents_status: string;
  attendance_status?: string | null;
  created_at: string;
  updated_at?: string | null;
};

type DocumentRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  document_type: string;
  file_url: string;
  verification_status: string;
  remarks?: string | null;
  uploaded_at: string;
};

type AttendanceRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  attendance_date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: string;
  mode: string;
  remarks?: string | null;
  created_at: string;
};

type LeaveRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  branch_id?: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: string | number;
  reason: string;
  status: string;
  approved_by?: string | null;
  remarks?: string | null;
  leave_balance: string | number;
  created_at: string;
};

type PayrollRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  branch_id?: string | null;
  month: number;
  year: number;
  base_salary: string | number;
  allowances: string | number;
  deductions: string | number;
  leave_deduction: string | number;
  pf: string | number;
  tds: string | number;
  net_salary: string | number;
  status: string;
  approved_by_hr: boolean;
  approved_by_finance: boolean;
  approved_by_super_admin: boolean;
  created_at: string;
};

type WorkloadRow = {
  id: string;
  trainer_id: string;
  trainer_name?: string | null;
  branch_id?: string | null;
  branch_name?: string | null;
  total_batches: number;
  total_students: number;
  weekly_classes: number;
  pending_assignments: number;
  workload_status: string;
  updated_at: string;
};

type PerformanceRow = {
  id: string;
  employee_id: string;
  employee_name?: string | null;
  branch_id?: string | null;
  review_period: string;
  attendance_score: number;
  productivity_score: number;
  student_feedback_score: number;
  session_completion_score: number;
  manager_rating: number;
  ai_score: number;
  strengths?: string | null;
  improvements?: string | null;
  status: string;
  created_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  description?: string | null;
  assigned_to: string;
  assigned_to_name?: string | null;
  assigned_by?: string | null;
  priority: string;
  due_date?: string | null;
  status: string;
  completed_at?: string | null;
  created_at: string;
};

type InsightRow = {
  title: string;
  detail: string;
  severity: string;
  category: string;
  employee_id?: string | null;
};

type HRData = {
  employees: EmployeeRow[];
  attendance: AttendanceRow[];
  leaves: LeaveRow[];
  payroll: PayrollRow[];
  workload: WorkloadRow[];
  performance: PerformanceRow[];
  tasks: TaskRow[];
  insights: InsightRow[];
};

const emptyData: HRData = {
  employees: [],
  attendance: [],
  leaves: [],
  payroll: [],
  workload: [],
  performance: [],
  tasks: [],
  insights: [],
};

const tabs = ["Overview", "Staff Directory", "Attendance", "Leave Requests", "Payroll", "Trainer Workload", "Performance", "Documents", "HR Tasks"];
const employeeStatuses = ["Active", "Inactive", "Probation", "Resigned"];
const attendanceStatuses = ["Present", "Absent", "Late", "Half Day", "On Leave"];
const documentTypes = ["Aadhaar", "PAN", "Degree Certificate", "Resume", "Experience Letter"];
const taskPriorities = ["Low", "Medium", "High", "Critical"];
const taskStatuses = ["Pending", "In Progress", "Completed", "Delayed"];

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function monthLabel(month: number, year: number) {
  return `${new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(year, month - 1, 1))} ${year}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function money(value: string | number | null | undefined) {
  const amount = Number(value ?? 0);
  return `Rs ${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function percent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

export function HRCommandCenter({
  accessToken,
  snapshot,
  loading: shellLoading,
  notice,
  setNotice,
  activeAction,
  setActiveAction,
}: {
  accessToken: string;
  snapshot: ApiSnapshot;
  setSnapshot: (updater: (current: ApiSnapshot) => ApiSnapshot) => void;
  loading: boolean;
  notice: string;
  setNotice: (message: string) => void;
  activeAction: string | null;
  setActiveAction: (action: string | null) => void;
  ActionModalComponent: (props: { accessToken: string; action: string; onClose: () => void; onComplete: (message: string) => void }) => ReactNode;
}) {
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<HRData>(emptyData);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("Not synced yet");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const branchOptions = useMemo(() => snapshot.branches.map((branch) => ({ label: branch.name, value: branch.id })), [snapshot.branches]);
  const employeeOptions = useMemo(() => data.employees.map((employee) => ({ label: employee.full_name, value: employee.id })), [data.employees]);
  const selectedDocumentsEmployee = data.employees.find((employee) => employee.id === selectedEmployeeId) ?? data.employees[0];
  const displayedInsights = showAllInsights ? data.insights : data.insights.slice(0, 5);

  async function loadHRData(showSkeleton = false) {
    if (showSkeleton) setLoading(true);
    setError("");
    try {
      const employees = await apiRequest<EmployeeRow[]>("/hr/employees", accessToken);
      setData((current) => ({ ...current, employees }));
      if (!selectedEmployeeId && employees[0]) setSelectedEmployeeId(employees[0].id);
      setLoading(false);

      const [attendance, leaves, payroll, workload, performance, tasks, insights] = await Promise.allSettled([
        apiRequest<AttendanceRow[]>("/hr/attendance", accessToken),
        apiRequest<LeaveRow[]>("/hr/leaves", accessToken),
        apiRequest<PayrollRow[]>("/hr/payroll", accessToken),
        apiRequest<WorkloadRow[]>("/hr/trainer-workload", accessToken),
        apiRequest<PerformanceRow[]>("/hr/performance", accessToken),
        apiRequest<TaskRow[]>("/hr/tasks", accessToken),
        apiRequest<InsightRow[]>("/hr/ai-insights", accessToken),
      ]);
      setData((current) => ({
        employees,
        attendance: attendance.status === "fulfilled" ? attendance.value : current.attendance,
        leaves: leaves.status === "fulfilled" ? leaves.value : current.leaves,
        payroll: payroll.status === "fulfilled" ? payroll.value : current.payroll,
        workload: workload.status === "fulfilled" ? workload.value : current.workload,
        performance: performance.status === "fulfilled" ? performance.value : current.performance,
        tasks: tasks.status === "fulfilled" ? tasks.value : current.tasks,
        insights: insights.status === "fulfilled" ? insights.value : current.insights,
      }));
      setLastUpdated("Last updated just now");
      setNotice("HR module connected to live backend");
    /* =====================================================
       SECTION: ERROR HANDLING
       PURPOSE:
       This section handles expected failures and converts them into useful responses.
       Good error handling keeps the app stable when something goes wrong.
    ===================================================== */

    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "HR backend data is unavailable");
    } finally {
      setLoading(false);
    }
  }

  async function loadDocuments(employeeId: string) {
    if (!employeeId) {
      setDocuments([]);
      return;
    }
    setDocumentLoading(true);
    try {
      const rows = await apiRequest<DocumentRow[]>(`/hr/employees/${employeeId}/documents`, accessToken);
      setDocuments(rows);
    } catch {
      setDocuments([]);
    } finally {
      setDocumentLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    async function start() {
      if (!alive) return;
      await loadHRData(true);
    }
    start();
    const timer = window.setInterval(() => {
      if (alive) loadHRData(false);
    }, 30000);
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [accessToken]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      await Promise.resolve();
      if (!alive) return;
      if (!selectedEmployeeId) {
        setDocuments([]);
        return;
      }
      setDocumentLoading(true);
      try {
        const rows = await apiRequest<DocumentRow[]>(`/hr/employees/${selectedEmployeeId}/documents`, accessToken);
        if (alive) setDocuments(rows);
      } catch {
        if (alive) setDocuments([]);
      } finally {
        if (alive) setDocumentLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [accessToken, selectedEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return data.employees.filter((employee) => {
      const matchesSearch = !term || employee.full_name.toLowerCase().includes(term) || employee.email.toLowerCase().includes(term) || employee.employee_id.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || employee.role === roleFilter;
      const matchesBranch = branchFilter === "all" || employee.branch_id === branchFilter || employee.branch_name === branchFilter;
      const matchesStatus = statusFilter === "all" || employee.status === statusFilter;
      return matchesSearch && matchesRole && matchesBranch && matchesStatus;
    });
  }, [branchFilter, data.employees, roleFilter, search, statusFilter]);

  const today = todayInputValue();
  const todayAttendance = data.attendance.filter((row) => row.attendance_date === today);
  const presentToday = todayAttendance.filter((row) => row.status === "Present").length;
  const absentToday = todayAttendance.filter((row) => row.status === "Absent").length;
  const lateToday = todayAttendance.filter((row) => row.status === "Late").length;
  const onLeaveToday = todayAttendance.filter((row) => row.status === "On Leave").length;
  const pendingLeaves = data.leaves.filter((row) => row.status === "Pending").length;
  const pendingPayroll = data.payroll.filter((row) => row.status !== "Paid").length;
  const activeTrainers = data.employees.filter((employee) => employee.role.toLowerCase().includes("trainer") && employee.status === "Active").length;
  const overloadedTrainers = data.workload.filter((row) => row.workload_status === "Overloaded").length;
  const healthScore = data.employees.length ? Math.round(((presentToday + onLeaveToday) / Math.max(1, data.employees.length)) * 70 + (pendingLeaves ? 10 : 18) + (overloadedTrainers ? 4 : 12)) : 0;
  const isLoading = loading || shellLoading;

  const roleOptions = Array.from(new Set(data.employees.map((employee) => employee.role))).sort().map((role) => ({ label: role, value: role }));
  const branchFilterOptions = branchOptions.length ? branchOptions : Array.from(new Set(data.employees.map((employee) => employee.branch_name || employee.branch_id).filter(Boolean))).map((branch) => ({ label: String(branch), value: String(branch) }));

  async function runSimpleAction(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      setNotice(message);
      await loadHRData(false);
    } catch (actionError) {
      setNotice(actionError instanceof Error ? actionError.message : "Action failed");
    }
  }

  async function approveLeave(id: string) {
    await runSimpleAction(() => apiRequest(`/hr/leaves/${id}/approve`, accessToken, { method: "PATCH", body: JSON.stringify({ remarks: "Approved from HR command center" }) }), "Leave request approved");
  }

  async function rejectLeave(id: string) {
    await runSimpleAction(() => apiRequest(`/hr/leaves/${id}/reject`, accessToken, { method: "PATCH", body: JSON.stringify({ remarks: "Rejected from HR command center" }) }), "Leave request rejected");
  }

  async function approvePayroll(id: string) {
    await runSimpleAction(() => apiRequest(`/hr/payroll/${id}/approve`, accessToken, { method: "PATCH" }), "Payroll approval moved forward");
  }

  async function markPayrollPaid(id: string) {
    await runSimpleAction(() => apiRequest(`/hr/payroll/${id}/mark-paid`, accessToken, { method: "PATCH" }), "Payroll marked paid");
  }

  async function deleteEmployee(id: string) {
    if (deleteBusy) return;
    setDeleteBusy(true);
    await runSimpleAction(() => apiRequest(`/hr/employees/${id}`, accessToken, { method: "DELETE" }), "Employee removed");
    setDeleteBusy(false);
    setPendingDeleteId("");
  }

  const kpis = [
    { label: "Total Staff", value: data.employees.length, helper: "HR employee records", icon: Users, tone: "text-[#3e9e00]" },
    { label: "Present Today", value: presentToday, helper: "Staff checked in", icon: UserCheck, tone: "text-[#047857]" },
    { label: "On Leave Today", value: onLeaveToday, helper: "Approved or marked leave", icon: CalendarDays, tone: "text-[#c2410c]" },
    { label: "Pending Leave", value: pendingLeaves, helper: "Awaiting decision", icon: AlertTriangle, tone: "text-[#b45309]" },
    { label: "Pending Payroll", value: pendingPayroll, helper: "Not paid yet", icon: CreditCard, tone: "text-[#0ea5e9]" },
    { label: "Active Trainers", value: activeTrainers, helper: "Available trainers", icon: ClipboardCheck, tone: "text-[#3e9e00]" },
    { label: "Overloaded Trainers", value: overloadedTrainers, helper: "Needs balancing", icon: Gauge, tone: "text-[#b91c1c]" },
    { label: "HR Health Score", value: healthScore ? `${healthScore}%` : "Ready", helper: "Rule-based health", icon: Activity, tone: "text-[#3e9e00]" },
  ];

  return (
    <div className="space-y-3">
      <section className="rounded-lg border border-[#cceabf] bg-[linear-gradient(135deg,#12310f,#2f7d00_46%,#6fe31d)] px-4 py-3 text-white shadow-[0_18px_44px_rgba(47,125,0,0.22)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-white/18">
              <ClipboardCheck size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[22px] font-black leading-tight">HR Command Center</h2>
              <p className="mt-0.5 max-w-2xl text-xs font-semibold leading-5 text-white/90">Onboarding, attendance, leave, payroll, workload, performance, documents, tasks, and AI signals.</p>
              <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/80">{lastUpdated}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => loadHRData(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-black text-[#3e9e00] transition hover:bg-[#eefbe7]">
              <RefreshCw size={14} />
              Refresh
            </button>
            <HeaderAction label="Add Staff" icon={UserPlus} onClick={() => setActiveAction("add-staff")} />
            <HeaderAction label="Mark Attendance" icon={ClipboardCheck} onClick={() => setActiveAction("mark-attendance")} />
            <HeaderAction label="Generate Payroll" icon={CreditCard} onClick={() => setActiveAction("generate-payroll")} />
            <HeaderAction label="Create Task" icon={CheckCircle2} onClick={() => setActiveAction("create-task")} />
          </div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-[#fecaca] bg-[#fee2e2] p-3 text-sm font-black text-[#b91c1c]">{error}</div> : null}

      <section className="grid gap-1 rounded-xl border border-[#ddeecf] bg-white p-1 sm:grid-cols-3 lg:grid-cols-9">
        {tabs.map((tab) => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`min-w-0 truncate rounded-lg px-2 py-1.5 text-[10px] font-black transition ${activeTab === tab ? "bg-[#58cc02] text-white" : "text-[#5f6f56] hover:bg-[#f6fff0] hover:text-[#3e9e00]"}`} title={tab}>
            {tab}
          </button>
        ))}
      </section>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8">
        {kpis.map((item) => (
          <article key={item.label} className="h-[78px] rounded-[8px] border border-[#ddeecf] bg-white p-2.5 shadow-[0_5px_14px_rgba(15,23,42,0.045)] transition hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-black uppercase text-[#5f6f56]">{item.label}</p>
              <item.icon className={item.tone} size={14} />
            </div>
            <p className="mt-1.5 text-[22px] font-black leading-none">{isLoading ? "..." : item.value}</p>
            <p className="mt-0.5 truncate text-[10px] font-bold text-[#5f6f56]">{item.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,2.15fr)_minmax(280px,0.85fr)]">
        <main className="space-y-3">
          {(activeTab === "Overview" || activeTab === "Staff Directory") && (
            <Panel icon={Users} title="Staff Directory" subtitle={`${filteredEmployees.length} staff records`} action={<span className="rounded-full bg-[#eefbe7] px-2.5 py-1 text-[11px] font-black text-[#3e9e00]">{notice}</span>}>
              <Filters
                search={search}
                setSearch={setSearch}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                branchFilter={branchFilter}
                setBranchFilter={setBranchFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                roleOptions={roleOptions}
                branchOptions={branchFilterOptions}
              />
              <StaffTable rows={filteredEmployees} loading={isLoading} onView={setSelectedEmployee} onEdit={(employee) => { setSelectedEmployee(employee); setActiveAction("edit-staff"); }} onDelete={setPendingDeleteId} />
            </Panel>
          )}

          {(activeTab === "Overview" || activeTab === "Attendance") && (
            <Panel icon={CalendarDays} title="Staff Attendance" subtitle="Daily staff presence and manual attendance">
              <AttendanceCards present={presentToday} absent={absentToday} late={lateToday} leave={onLeaveToday} />
              <AttendanceTable rows={data.attendance} loading={isLoading} />
            </Panel>
          )}

          {activeTab === "Leave Requests" && <LeaveTable rows={data.leaves} loading={isLoading} onApprove={approveLeave} onReject={rejectLeave} />}
          {activeTab === "Payroll" && <PayrollTable rows={data.payroll} loading={isLoading} onApprove={approvePayroll} onPaid={markPayrollPaid} />}
          {activeTab === "Trainer Workload" && <WorkloadPanel rows={data.workload} loading={isLoading} />}
          {activeTab === "Performance" && <PerformancePanel rows={data.performance} loading={isLoading} />}
          {(activeTab === "Overview" || activeTab === "Documents") && (
            <DocumentsPanel
              employees={employeeOptions}
              selectedEmployeeId={selectedDocumentsEmployee?.id ?? ""}
              setSelectedEmployeeId={setSelectedEmployeeId}
              rows={documents}
              loading={documentLoading}
              onUpload={() => setActiveAction("upload-document")}
              onVerify={(id, status) => runSimpleAction(() => apiRequest(`/hr/documents/${id}/verify`, accessToken, { method: "PATCH", body: JSON.stringify({ verification_status: status }) }), `Document ${status.toLowerCase()}`).then(() => loadDocuments(selectedEmployeeId))}
            />
          )}
          {activeTab === "HR Tasks" && <TaskPanel rows={data.tasks} loading={isLoading} onAdvance={(task) => runSimpleAction(() => apiRequest(`/hr/tasks/${task.id}`, accessToken, { method: "PATCH", body: JSON.stringify({ status: task.status === "Pending" ? "In Progress" : "Completed" }) }), "Task status updated")} />}
        </main>

        <aside className="space-y-3">
          <Panel icon={Activity} title="Live HR Activity" subtitle="Recent operating updates">
            <div className="space-y-2">
              {[
                ...data.attendance.slice(0, 2).map((row) => `${row.employee_name ?? "Staff"} marked ${row.status}`),
                ...data.leaves.slice(0, 2).map((row) => `${row.employee_name ?? "Staff"} leave is ${row.status}`),
                ...data.tasks.slice(0, 2).map((row) => `${row.title} is ${row.status}`),
              ].slice(0, 5).map((text, index) => <FeedItem key={`${text}-${index}`} text={text} meta={index === 0 ? "Just now" : "Live sync"} />)}
              {!data.attendance.length && !data.leaves.length && !data.tasks.length ? <EmptyState text="No HR activity yet." /> : null}
            </div>
          </Panel>

          <Panel icon={Sparkles} title="AI HR Insights" subtitle="Rule-based productivity signals">
            <div className="max-h-[220px] space-y-1.5 overflow-y-auto pr-1">
              {displayedInsights.map((insight, index) => <InsightCard key={`${insight.title}-${index}`} insight={insight} />)}
              {!data.insights.length ? <EmptyState text="No insights available yet." /> : null}
            </div>
            {data.insights.length > 5 ? (
              <button type="button" onClick={() => setShowAllInsights((current) => !current)} className="mt-2 h-7 w-full rounded-md border border-[#ddeecf] bg-white text-[10px] font-black text-[#3e9e00] transition hover:border-[#58cc02]">
                {showAllInsights ? "View Less" : `View More (${data.insights.length - 5})`}
              </button>
            ) : null}
          </Panel>

          <Panel icon={CreditCard} title="Leave & Payroll Summary" subtitle="Approval workflow">
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="Pending leaves" value={pendingLeaves} />
              <MiniStat label="Approved leaves" value={data.leaves.filter((row) => row.status === "Approved").length} />
              <MiniStat label="Payroll draft" value={data.payroll.filter((row) => row.status === "Draft").length} />
              <MiniStat label="Paid" value={data.payroll.filter((row) => row.status === "Paid").length} />
            </div>
            <div className="mt-3 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-3 text-xs font-black text-[#5f6f56]">HR &rarr; Finance &rarr; Super Admin &rarr; Paid</div>
          </Panel>

          <Panel icon={BarChart3} title="Trainer Workload Summary" subtitle="Batches, classes, assignments">
            <div className="space-y-2">
              {data.workload.slice(0, 5).map((row) => (
                <div key={row.id} className="rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-black">{row.trainer_name ?? "Trainer"}</p>
                    <StatusBadge label={row.workload_status} />
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ddeecf]">
                    <div className="h-full rounded-full bg-[#58cc02]" style={{ width: percent((row.weekly_classes / Math.max(1, 12)) * 100) }} />
                  </div>
                </div>
              ))}
              {!data.workload.length ? <EmptyState text="No workload rows yet." /> : null}
            </div>
          </Panel>
        </aside>
      </section>

      {selectedEmployee ? <EmployeeDetailModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} /> : null}
      {activeAction === "add-staff" ? <EmployeeFormModal accessToken={accessToken} branches={branchOptions} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); loadHRData(false); }} /> : null}
      {activeAction === "edit-staff" && selectedEmployee ? <EmployeeFormModal accessToken={accessToken} branches={branchOptions} employee={selectedEmployee} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); setSelectedEmployee(null); loadHRData(false); }} /> : null}
      {activeAction === "mark-attendance" ? <AttendanceFormModal accessToken={accessToken} employees={employeeOptions} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); loadHRData(false); }} /> : null}
      {activeAction === "generate-payroll" ? <PayrollGenerateModal accessToken={accessToken} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); loadHRData(false); }} /> : null}
      {activeAction === "create-task" ? <TaskFormModal accessToken={accessToken} employees={employeeOptions} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); loadHRData(false); }} /> : null}
      {activeAction === "upload-document" && selectedDocumentsEmployee ? <DocumentFormModal accessToken={accessToken} employee={selectedDocumentsEmployee} onClose={() => setActiveAction(null)} onSaved={() => { setActiveAction(null); loadDocuments(selectedDocumentsEmployee.id); loadHRData(false); }} /> : null}
      {pendingDeleteId ? <ConfirmActionModal title="Confirm Delete" message="This action cannot be undone. Are you sure you want to continue?" confirmLabel="Yes, Delete" onCancel={() => setPendingDeleteId("")} onConfirm={() => void deleteEmployee(pendingDeleteId)} busy={deleteBusy} /> : null}
    </div>
  );
}

function HeaderAction({ label, icon: Icon, onClick }: { label: string; icon: IconType; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[11px] font-black text-[#3e9e00] transition hover:bg-[#eefbe7]">
      <Icon size={13} />
      {label}
    </button>
  );
}

function Panel({ icon: Icon, title, subtitle, action, children }: { icon: IconType; title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <article className="w-full rounded-[8px] border border-[#ddeecf] bg-white p-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#d7ff70] text-[#58cc02]"><Icon size={17} /></div>
          <div className="min-w-0">
            <h2 className="text-[14px] font-black leading-tight">{title}</h2>
            <p className="mt-0.5 truncate text-[11px] font-bold text-[#5f6f56]">{subtitle}</p>
          </div>
        </div>
        {action}
      </div>
      <div className="mt-2.5">{children}</div>
    </article>
  );
}

function Filters(props: {
  search: string;
  setSearch: (value: string) => void;
  roleFilter: string;
  setRoleFilter: (value: string) => void;
  branchFilter: string;
  setBranchFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  roleOptions: Array<{ label: string; value: string }>;
  branchOptions: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="mb-2 grid gap-2 lg:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr]">
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={15} />
        <input value={props.search} onChange={(event) => props.setSearch(event.target.value)} placeholder="Search staff" className="h-8 w-full rounded-lg border border-[#ddeecf] bg-white pl-8 pr-3 text-[11px] font-bold outline-none focus:border-[#58cc02]" />
      </label>
      <SelectFilter value={props.roleFilter} onChange={props.setRoleFilter} options={[{ label: "All roles", value: "all" }, ...props.roleOptions]} />
      <SelectFilter value={props.branchFilter} onChange={props.setBranchFilter} options={[{ label: "All branches", value: "all" }, ...props.branchOptions]} />
      <SelectFilter value={props.statusFilter} onChange={props.setStatusFilter} options={[{ label: "All status", value: "all" }, ...employeeStatuses.map((status) => ({ label: status, value: status }))]} />
    </div>
  );
}

function SelectFilter({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return (
    <label className="relative block">
      <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={14} />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-8 w-full rounded-lg border border-[#ddeecf] bg-white pl-8 pr-2 text-[11px] font-black outline-none focus:border-[#58cc02]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function StaffTable({ rows, loading, onView, onEdit, onDelete }: { rows: EmployeeRow[]; loading: boolean; onView: (row: EmployeeRow) => void; onEdit: (row: EmployeeRow) => void; onDelete: (id: string) => void }) {
  if (loading) return <SkeletonRows />;
  if (!rows.length) return <EmptyState text="No staff records found." />;
  return (
    <>
    <ResponsiveTable
      headings={["Staff", "Role", "Branch", "Status", "Salary", "Attendance", "Docs", "Actions"]}
      mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.full_name} meta={`${row.role} / ${row.branch_name ?? "Unassigned"}`} badge={row.status} />)}
    >
      {rows.map((row) => (
        <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
          <td className="min-w-0 px-2 py-1.5"><p className="truncate font-black">{row.full_name}</p><p className="truncate text-[10px] text-[#5f6f56]">{row.employee_id} / {row.email}</p></td>
          <td className="px-2 py-1.5"><StatusBadge label={row.role} /></td>
          <td className="truncate px-2 py-1.5 text-[#5f6f56]">{row.branch_name ?? row.branch_id ?? "Unassigned"}</td>
          <td className="px-2 py-1.5"><StatusBadge label={row.status} /></td>
          <td className="px-2 py-1.5 font-black text-[#5f6f56]">{money(row.salary)}</td>
          <td className="px-2 py-1.5"><StatusBadge label={row.attendance_status ?? "Not marked"} /></td>
          <td className="px-2 py-1.5"><StatusBadge label={row.documents_status} /></td>
          <td className="px-2 py-1.5"><IconActions actions={[["View", Eye, () => onView(row)], ["Edit", Pencil, () => onEdit(row)], ["Delete", Trash2, () => onDelete(row.id)]]} /></td>
        </tr>
      ))}
    </ResponsiveTable>
    <TableFooter count={rows.length} label="staff records" />
    </>
  );
}

function AttendanceCards({ present, absent, late, leave }: { present: number; absent: number; late: number; leave: number }) {
  return (
    <div className="mb-2 grid gap-2 sm:grid-cols-4">
      <MiniStat label="Present Today" value={present} />
      <MiniStat label="Absent Today" value={absent} />
      <MiniStat label="Late Staff" value={late} />
      <MiniStat label="On Leave" value={leave} />
    </div>
  );
}

function AttendanceTable({ rows, loading }: { rows: AttendanceRow[]; loading: boolean }) {
  if (loading) return <SkeletonRows />;
  if (!rows.length) return <EmptyState text="No staff attendance has been marked yet." />;
  return (
    <>
    <ResponsiveTable headings={["Staff Name", "Branch", "Date", "Check In", "Check Out", "Status", "Mode", "Actions"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.employee_name ?? "Staff"} meta={`${formatDate(row.attendance_date)} / ${row.branch_name ?? "Unassigned"}`} badge={row.status} />)}>
      {rows.map((row) => (
        <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
          <td className="truncate px-2 py-1.5 font-black">{row.employee_name ?? row.employee_id}</td>
          <td className="truncate px-2 py-1.5 text-[#5f6f56]">{row.branch_name ?? row.branch_id ?? "Unassigned"}</td>
          <td className="px-2 py-1.5 text-[#5f6f56]">{formatDate(row.attendance_date)}</td>
          <td className="px-2 py-1.5 text-[#5f6f56]">{row.check_in ?? "-"}</td>
          <td className="px-2 py-1.5 text-[#5f6f56]">{row.check_out ?? "-"}</td>
          <td className="px-2 py-1.5"><StatusBadge label={row.status} /></td>
          <td className="px-2 py-1.5"><StatusBadge label={row.mode} /></td>
          <td className="px-2 py-1.5"><StatusBadge label="Live" /></td>
        </tr>
      ))}
    </ResponsiveTable>
    <TableFooter count={rows.length} label="attendance rows" />
    </>
  );
}

function LeaveTable({ rows, loading, onApprove, onReject }: { rows: LeaveRow[]; loading: boolean; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  return (
    <Panel icon={CalendarDays} title="Leave Requests" subtitle="Pending, approved, and rejected leave workflows">
      {loading ? <SkeletonRows /> : !rows.length ? <EmptyState text="No leave requests yet." /> : (
        <ResponsiveTable headings={["Staff", "Type", "Dates", "Days", "Balance", "Status", "Reason", "Actions"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.employee_name ?? "Staff"} meta={`${row.leave_type} / ${formatDate(row.start_date)}`} badge={row.status} />)}>
          {rows.slice(0, 10).map((row) => (
            <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
              <td className="truncate px-2 py-2 font-black">{row.employee_name ?? row.employee_id}</td>
              <td className="px-2 py-2"><StatusBadge label={row.leave_type} /></td>
              <td className="px-2 py-2 text-[#5f6f56]">{formatDate(row.start_date)} - {formatDate(row.end_date)}</td>
              <td className="px-2 py-2 font-black">{row.total_days}</td>
              <td className="px-2 py-2 font-black">{row.leave_balance}</td>
              <td className="px-2 py-2"><StatusBadge label={row.status} /></td>
              <td className="truncate px-2 py-2 text-[#5f6f56]">{row.reason}</td>
              <td className="px-2 py-2">{row.status === "Pending" ? <IconActions actions={[["Approve", Check, () => onApprove(row.id)], ["Reject", X, () => onReject(row.id)]]} /> : <StatusBadge label="Closed" />}</td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function PayrollTable({ rows, loading, onApprove, onPaid }: { rows: PayrollRow[]; loading: boolean; onApprove: (id: string) => void; onPaid: (id: string) => void }) {
  return (
    <Panel icon={CreditCard} title="Payroll" subtitle="HR -> Finance -> Super Admin -> Paid approval workflow">
      {loading ? <SkeletonRows /> : !rows.length ? <EmptyState text="No payroll rows yet. Generate payroll to begin." /> : (
        <ResponsiveTable headings={["Staff Name", "Month", "Base Salary", "Deductions", "Net Salary", "Status", "Workflow", "Actions"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.employee_name ?? "Staff"} meta={`${monthLabel(row.month, row.year)} / ${money(row.net_salary)}`} badge={row.status} />)}>
          {rows.slice(0, 10).map((row) => (
            <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
              <td className="truncate px-2 py-2 font-black">{row.employee_name ?? row.employee_id}</td>
              <td className="px-2 py-2 text-[#5f6f56]">{monthLabel(row.month, row.year)}</td>
              <td className="px-2 py-2 font-black">{money(row.base_salary)}</td>
              <td className="px-2 py-2 text-[#5f6f56]">{money(Number(row.deductions) + Number(row.leave_deduction) + Number(row.pf) + Number(row.tds))}</td>
              <td className="px-2 py-2 font-black text-[#3e9e00]">{money(row.net_salary)}</td>
              <td className="px-2 py-2"><StatusBadge label={row.status} /></td>
              <td className="px-2 py-2 text-[11px] font-black text-[#5f6f56]">HR {row.approved_by_hr ? "✓" : "-"} / Finance {row.approved_by_finance ? "✓" : "-"} / Admin {row.approved_by_super_admin ? "✓" : "-"}</td>
              <td className="px-2 py-2"><IconActions actions={[["Approve", Check, () => onApprove(row.id)], ["Paid", CreditCard, () => onPaid(row.id)]]} /></td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function WorkloadPanel({ rows, loading }: { rows: WorkloadRow[]; loading: boolean }) {
  const maxClasses = Math.max(1, ...rows.map((row) => row.weekly_classes));
  return (
    <Panel icon={BarChart3} title="Trainer Workload" subtitle="Trainer load, students, classes, assignments, and workload status">
      {loading ? <SkeletonRows /> : !rows.length ? <CompactWorkloadEmpty /> : (
        <>
          <div className="mb-2 flex h-16 items-end gap-1.5 rounded-xl border border-[#ddeecf] bg-[#f6fff0] p-2">
            {rows.slice(0, 12).map((row) => <div key={row.id} className="flex-1 rounded-t bg-[#58cc02]" style={{ height: percent((row.weekly_classes / maxClasses) * 100) }} title={row.trainer_name ?? "Trainer"} />)}
          </div>
          <ResponsiveTable headings={["Trainer", "Branch", "Batches", "Students", "Weekly Classes", "Pending Assignments", "Workload Status"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.trainer_name ?? "Trainer"} meta={`${row.weekly_classes} classes / ${row.total_students} students`} badge={row.workload_status} />)}>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
                <td className="truncate px-2 py-2 font-black">{row.trainer_name ?? row.trainer_id}</td>
                <td className="truncate px-2 py-2 text-[#5f6f56]">{row.branch_name ?? row.branch_id ?? "Unassigned"}</td>
                <td className="px-2 py-2 font-black">{row.total_batches}</td>
                <td className="px-2 py-2 font-black">{row.total_students}</td>
                <td className="px-2 py-2 font-black">{row.weekly_classes}</td>
                <td className="px-2 py-2 font-black">{row.pending_assignments}</td>
                <td className="px-2 py-2"><StatusBadge label={row.workload_status} /></td>
              </tr>
            ))}
          </ResponsiveTable>
        </>
      )}
    </Panel>
  );
}

function PerformancePanel({ rows, loading }: { rows: PerformanceRow[]; loading: boolean }) {
  const ranked = [...rows].sort((a, b) => b.ai_score - a.ai_score).slice(0, 3);
  return (
    <Panel icon={Gauge} title="Performance" subtitle="Review scores, AI productivity score, trainer ranking, and review status">
      {loading ? <SkeletonRows /> : !rows.length ? <EmptyState text="No performance reviews yet." /> : (
        <>
          <div className="mb-2 grid gap-2 sm:grid-cols-3">
            {ranked.map((row, index) => <MiniStat key={row.id} label={`Rank ${index + 1}: ${row.employee_name ?? "Staff"}`} value={`${row.ai_score}%`} />)}
          </div>
          <ResponsiveTable headings={["Staff", "Period", "Attendance", "Productivity", "Feedback", "Completion", "Manager", "AI Score", "Status"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.employee_name ?? "Staff"} meta={`${row.review_period} / AI ${row.ai_score}%`} badge={row.status} />)}>
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
                <td className="truncate px-2 py-2 font-black">{row.employee_name ?? row.employee_id}</td>
                <td className="px-2 py-2 text-[#5f6f56]">{row.review_period}</td>
                <td className="px-2 py-2 font-black">{row.attendance_score}</td>
                <td className="px-2 py-2 font-black">{row.productivity_score}</td>
                <td className="px-2 py-2 font-black">{row.student_feedback_score}</td>
                <td className="px-2 py-2 font-black">{row.session_completion_score}</td>
                <td className="px-2 py-2 font-black">{row.manager_rating}</td>
                <td className="px-2 py-2"><StatusBadge label={`${row.ai_score}%`} /></td>
                <td className="px-2 py-2"><StatusBadge label={row.status} /></td>
              </tr>
            ))}
          </ResponsiveTable>
        </>
      )}
    </Panel>
  );
}

function DocumentsPanel({ employees, selectedEmployeeId, setSelectedEmployeeId, rows, loading, onUpload, onVerify }: { employees: Array<{ label: string; value: string }>; selectedEmployeeId: string; setSelectedEmployeeId: (id: string) => void; rows: DocumentRow[]; loading: boolean; onUpload: () => void; onVerify: (id: string, status: string) => void }) {
  return (
    <Panel icon={FileCheck2} title="Documents" subtitle="Aadhaar, PAN, degree certificate, resume, and experience letter verification">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <select value={selectedEmployeeId} onChange={(event) => setSelectedEmployeeId(event.target.value)} className="h-8 min-w-48 rounded-lg border border-[#ddeecf] bg-white px-3 text-[11px] font-black outline-none focus:border-[#58cc02]">
          {employees.map((employee) => <option key={employee.value} value={employee.value}>{employee.label}</option>)}
        </select>
        <button type="button" onClick={onUpload} disabled={!selectedEmployeeId} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#58cc02] px-3 text-[11px] font-black text-white transition hover:bg-[#3e9e00] disabled:opacity-50"><Plus size={13} /> Upload Document</button>
      </div>
      {loading ? <SkeletonRows /> : !selectedEmployeeId ? <EmptyState text="Select a staff member to review documents." /> : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {documentTypes.map((type) => {
            const row = rows.find((document) => document.document_type === type);
            return (
              <div key={type} className="min-h-[82px] rounded-[8px] border border-[#ddeecf] bg-[#f6fff0] p-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-black">{type}</p>
                  <StatusBadge label={row?.verification_status ?? "Pending"} />
                </div>
                <p className="mt-1.5 truncate text-[11px] font-bold text-[#5f6f56]">{row?.file_url ?? "No file uploaded"}</p>
                {row ? <div className="mt-2 flex gap-1"><IconActions actions={[["Verify", Check, () => onVerify(row.id, "Verified")], ["Reject", X, () => onVerify(row.id, "Rejected")]]} /></div> : null}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function TaskPanel({ rows, loading, onAdvance }: { rows: TaskRow[]; loading: boolean; onAdvance: (task: TaskRow) => void }) {
  return (
    <Panel icon={CheckCircle2} title="HR Tasks" subtitle="Daily task board with priority and completion tracking">
      {loading ? <SkeletonRows /> : !rows.length ? <EmptyState text="No HR tasks yet." /> : (
        <ResponsiveTable headings={["Task", "Assigned To", "Priority", "Due Date", "Status", "Actions"]} mobileRows={rows.slice(0, 8).map((row) => <MobileRow key={row.id} title={row.title} meta={`${row.assigned_to_name ?? "Staff"} / ${formatDate(row.due_date)}`} badge={row.priority} />)}>
          {rows.slice(0, 10).map((row) => (
            <tr key={row.id} className="border-t border-[#ddeecf] transition hover:bg-[#f6fff0]">
              <td className="truncate px-2 py-2 font-black">{row.title}</td>
              <td className="truncate px-2 py-2 text-[#5f6f56]">{row.assigned_to_name ?? row.assigned_to}</td>
              <td className="px-2 py-2"><StatusBadge label={row.priority} /></td>
              <td className="px-2 py-2 text-[#5f6f56]">{formatDate(row.due_date)}</td>
              <td className="px-2 py-2"><StatusBadge label={row.status} /></td>
              <td className="px-2 py-2"><button type="button" onClick={() => onAdvance(row)} className="rounded-md border border-[#ddeecf] bg-white px-2 py-1 text-[10px] font-black transition hover:border-[#58cc02] hover:text-[#3e9e00]">Advance</button></td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </Panel>
  );
}

function ResponsiveTable({ headings, mobileRows, children }: { headings: string[]; mobileRows: ReactNode[]; children: ReactNode }) {
  return (
    <>
      <div className="hidden max-h-[260px] overflow-y-auto rounded-xl border border-[#ddeecf] bg-white md:block">
        <table className="w-full table-fixed border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-[#f8fafc] text-[10px] font-black uppercase text-[#5f6f56] shadow-[0_1px_0_#ddeecf]">
            <tr>{headings.map((heading) => <th key={heading} className="px-2 py-1.5 text-left">{heading}</th>)}</tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div className="max-h-[320px] space-y-2 overflow-y-auto md:hidden">{mobileRows}</div>
    </>
  );
}

function TableFooter({ count, label }: { count: number; label: string }) {
  return (
    <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[#ddeecf] bg-[#f6fff0] px-2.5 py-1 text-[10px] font-black text-[#5f6f56]">
      <span>{count} {label}</span>
      <span>Live rows</span>
    </div>
  );
}

function MobileRow({ title, meta, badge }: { title: string; meta: string; badge: string }) {
  return (
    <div className="rounded-[8px] border border-[#ddeecf] bg-[#f6fff0] p-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black">{title}</p>
          <p className="mt-1 truncate text-xs font-bold text-[#5f6f56]">{meta}</p>
        </div>
        <StatusBadge label={badge} />
      </div>
    </div>
  );
}

function IconActions({ actions }: { actions: Array<[string, IconType, () => void]> }) {
  return (
    <div className="flex flex-wrap gap-1">
      {actions.map(([label, Icon, handler]) => (
        <button key={label} type="button" onClick={handler} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[#ddeecf] bg-white text-[#18230f] transition hover:border-[#58cc02] hover:text-[#3e9e00]" aria-label={label} title={label}>
          <Icon size={13} />
        </button>
      ))}
    </div>
  );
}

function StatusBadge({ label }: { label: string }) {
  const good = ["Active", "Present", "Verified", "Approved", "Balanced", "Paid", "Completed", "Live"];
  const warn = ["Pending", "Late", "On Leave", "Draft", "In Progress", "Probation", "Medium", "High", "HR Approved", "Finance Approved", "Super Admin Approved"];
  const bad = ["Inactive", "Absent", "Rejected", "Overloaded", "Delayed", "Critical", "Resigned"];
  const tone = good.includes(label) ? "bg-[#d1fae5] text-[#047857]" : bad.includes(label) ? "bg-[#fee2e2] text-[#b91c1c]" : warn.includes(label) ? "bg-[#fff7ed] text-[#c2410c]" : "bg-[#eefbe7] text-[#3e9e00]";
  return <span className={`inline-flex max-w-full truncate rounded-full px-2 py-0.5 text-[10px] font-black ${tone}`}>{label}</span>;
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] border border-[#ddeecf] bg-[#f6fff0] p-2">
      <p className="truncate text-[10px] font-black text-[#5f6f56]">{label}</p>
      <p className="mt-0.5 text-base font-black">{value}</p>
    </div>
  );
}

function FeedItem({ text, meta }: { text: string; meta: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-[#ddeecf] bg-[#f6fff0] p-2">
      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#58cc02]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-black leading-4">{text}</p>
        <p className="mt-0.5 text-[11px] font-bold text-[#5f6f56]">{meta}</p>
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: InsightRow }) {
  const border = insight.severity === "critical" ? "border-[#fecaca] bg-[#fee2e2]" : insight.severity === "warning" ? "border-[#fed7aa] bg-[#fff7ed]" : "border-[#ddeecf] bg-[#f6fff0]";
  return (
    <div className={`rounded-lg border p-2 ${border}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <Sparkles size={12} className="shrink-0 text-[#3e9e00]" />
          <p className="truncate text-[11px] font-black">{insight.title}</p>
        </div>
        <StatusBadge label={insight.category} />
      </div>
      <p className="mt-1 line-clamp-2 text-[10px] font-bold leading-4 text-[#5f6f56]">{insight.detail}</p>
    </div>
  );
}

function SkeletonRows() {
  return <div className="space-y-1.5">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-8 animate-pulse rounded-lg bg-[linear-gradient(90deg,#f8fafc_25%,#e2e8f0_50%,#f8fafc_75%)] bg-[length:200%_100%]" />)}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-[#ddeecf] bg-[#f6fff0] px-3 py-2 text-xs font-bold text-[#5f6f56]">{text}</div>;
}

function CompactWorkloadEmpty() {
  return (
    <div className="rounded-lg border border-[#ddeecf] bg-[#f6fff0] p-2.5">
      <div className="flex h-12 items-end gap-1.5">
        {[35, 52, 44, 68, 40, 58].map((height, index) => (
          <div key={index} className="flex-1 rounded-t bg-[#d7ff70]" style={{ height: `${height}%` }} />
        ))}
      </div>
      <p className="mt-2 text-[11px] font-black text-[#5f6f56]">No trainer workload rows yet.</p>
    </div>
  );
}

function ModalShell({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[22px] border border-[#ddeecf] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-black leading-tight">{title}</h2>
            <p className="mt-1 text-sm font-bold leading-5 text-[#5f6f56]">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#ddeecf] transition hover:border-[#58cc02] hover:text-[#3e9e00]" aria-label="Close"><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmployeeDetailModal({ employee, onClose }: { employee: EmployeeRow; onClose: () => void }) {
  const items = [
    ["Employee ID", employee.employee_id],
    ["Email", employee.email],
    ["Phone", employee.phone ?? "-"],
    ["Role", employee.role],
    ["Department", employee.department ?? "-"],
    ["Branch", employee.branch_name ?? employee.branch_id ?? "Unassigned"],
    ["Joining Date", formatDate(employee.joining_date)],
    ["Salary", money(employee.salary)],
    ["Status", employee.status],
    ["Documents", employee.documents_status],
  ];
  return (
    <ModalShell title={employee.full_name} subtitle="Staff profile details" onClose={onClose}>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">{items.map(([label, value]) => <MiniStat key={label} label={label} value={value} />)}</div>
    </ModalShell>
  );
}

function EmployeeFormModal({ accessToken, branches, employee, onClose, onSaved }: { accessToken: string; branches: Array<{ label: string; value: string }>; employee?: EmployeeRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    employee_id: employee?.employee_id ?? "",
    full_name: employee?.full_name ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    role: employee?.role ?? "Trainer",
    department: employee?.department ?? "Training",
    branch_id: employee?.branch_id ?? branches[0]?.value ?? "",
    reporting_manager: employee?.reporting_manager ?? "",
    joining_date: employee?.joining_date ?? todayInputValue(),
    salary: String(employee?.salary ?? "0"),
    status: employee?.status ?? "Active",
    emergency_contact: employee?.emergency_contact ?? "",
    bank_account: employee?.bank_account ?? "",
    documents_status: employee?.documents_status ?? "Pending",
  });
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const endpoint = employee ? `/hr/employees/${employee.id}` : "/hr/employees";
    await apiRequest(endpoint, accessToken, { method: employee ? "PUT" : "POST", body: JSON.stringify({ ...form, salary: Number(form.salary) }) });
    setBusy(false);
    onSaved();
  }

  return (
    <ModalShell title={employee ? "Edit Staff" : "Add Staff"} subtitle="Employee onboarding and HR profile" onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Employee ID" value={form.employee_id} onChange={(value) => setForm((current) => ({ ...current, employee_id: value }))} required />
          <TextInput label="Full Name" value={form.full_name} onChange={(value) => setForm((current) => ({ ...current, full_name: value }))} required />
          <TextInput label="Email" type="email" value={form.email} onChange={(value) => setForm((current) => ({ ...current, email: value }))} required />
          <TextInput label="Phone" value={form.phone} onChange={(value) => setForm((current) => ({ ...current, phone: value }))} />
          <TextInput label="Role" value={form.role} onChange={(value) => setForm((current) => ({ ...current, role: value }))} required />
          <TextInput label="Department" value={form.department} onChange={(value) => setForm((current) => ({ ...current, department: value }))} />
          <SelectInput label="Branch" value={form.branch_id} onChange={(value) => setForm((current) => ({ ...current, branch_id: value }))} options={[{ label: "Unassigned", value: "" }, ...branches]} />
          <SelectInput label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={employeeStatuses.map((status) => ({ label: status, value: status }))} />
          <TextInput label="Joining Date" type="date" value={form.joining_date} onChange={(value) => setForm((current) => ({ ...current, joining_date: value }))} />
          <TextInput label="Salary" type="number" value={form.salary} onChange={(value) => setForm((current) => ({ ...current, salary: value }))} />
          <TextInput label="Reporting Manager" value={form.reporting_manager} onChange={(value) => setForm((current) => ({ ...current, reporting_manager: value }))} />
          <SelectInput label="Documents Status" value={form.documents_status} onChange={(value) => setForm((current) => ({ ...current, documents_status: value }))} options={["Pending", "Verified", "Rejected"].map((status) => ({ label: status, value: status }))} />
          <TextInput label="Emergency Contact" value={form.emergency_contact} onChange={(value) => setForm((current) => ({ ...current, emergency_contact: value }))} />
          <TextInput label="Bank Account" value={form.bank_account} onChange={(value) => setForm((current) => ({ ...current, bank_account: value }))} />
        </div>
        <ModalActions busy={busy} onClose={onClose} submitLabel={employee ? "Save Changes" : "Create Staff"} />
      </form>
    </ModalShell>
  );
}

function AttendanceFormModal({ accessToken, employees, onClose, onSaved }: { accessToken: string; employees: Array<{ label: string; value: string }>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ employee_id: employees[0]?.value ?? "", attendance_date: todayInputValue(), check_in: "09:30", check_out: "", status: "Present", mode: "Manual", remarks: "" });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await apiRequest("/hr/attendance/mark", accessToken, { method: "POST", body: JSON.stringify(form) });
    setBusy(false);
    onSaved();
  }
  return (
    <ModalShell title="Mark Attendance" subtitle="Manual staff attendance entry" onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <SelectInput label="Staff" value={form.employee_id} onChange={(value) => setForm((current) => ({ ...current, employee_id: value }))} options={employees} />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextInput label="Date" type="date" value={form.attendance_date} onChange={(value) => setForm((current) => ({ ...current, attendance_date: value }))} />
          <SelectInput label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={attendanceStatuses.map((status) => ({ label: status, value: status }))} />
          <TextInput label="Check In" value={form.check_in} onChange={(value) => setForm((current) => ({ ...current, check_in: value }))} />
          <TextInput label="Check Out" value={form.check_out} onChange={(value) => setForm((current) => ({ ...current, check_out: value }))} />
          <TextInput label="Mode" value={form.mode} onChange={(value) => setForm((current) => ({ ...current, mode: value }))} />
          <TextInput label="Remarks" value={form.remarks} onChange={(value) => setForm((current) => ({ ...current, remarks: value }))} />
        </div>
        <ModalActions busy={busy} onClose={onClose} submitLabel="Mark Attendance" />
      </form>
    </ModalShell>
  );
}

function PayrollGenerateModal({ accessToken, onClose, onSaved }: { accessToken: string; onClose: () => void; onSaved: () => void }) {
  const now = new Date();
  const [form, setForm] = useState({ month: String(now.getMonth() + 1), year: String(now.getFullYear()), allowances: "0", deductions: "0", leave_deduction: "0", pf: "0", tds: "0" });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await apiRequest("/hr/payroll/generate", accessToken, { method: "POST", body: JSON.stringify({ month: Number(form.month), year: Number(form.year), allowances: Number(form.allowances), deductions: Number(form.deductions), leave_deduction: Number(form.leave_deduction), pf: Number(form.pf), tds: Number(form.tds) }) });
    setBusy(false);
    onSaved();
  }
  return (
    <ModalShell title="Generate Payroll" subtitle="Create draft payroll rows for active staff" onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(form).map(([key, value]) => <TextInput key={key} label={key.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())} type="number" value={value} onChange={(next) => setForm((current) => ({ ...current, [key]: next }))} />)}
        </div>
        <ModalActions busy={busy} onClose={onClose} submitLabel="Generate Payroll" />
      </form>
    </ModalShell>
  );
}

function TaskFormModal({ accessToken, employees, onClose, onSaved }: { accessToken: string; employees: Array<{ label: string; value: string }>; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", assigned_to: employees[0]?.value ?? "", priority: "Medium", due_date: todayInputValue(), status: "Pending" });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await apiRequest("/hr/tasks", accessToken, { method: "POST", body: JSON.stringify(form) });
    setBusy(false);
    onSaved();
  }
  return (
    <ModalShell title="Create Task" subtitle="Assign a daily HR task to staff" onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <TextInput label="Title" value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} required />
        <TextInput label="Description" value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectInput label="Assigned To" value={form.assigned_to} onChange={(value) => setForm((current) => ({ ...current, assigned_to: value }))} options={employees} />
          <SelectInput label="Priority" value={form.priority} onChange={(value) => setForm((current) => ({ ...current, priority: value }))} options={taskPriorities.map((priority) => ({ label: priority, value: priority }))} />
          <TextInput label="Due Date" type="date" value={form.due_date} onChange={(value) => setForm((current) => ({ ...current, due_date: value }))} />
          <SelectInput label="Status" value={form.status} onChange={(value) => setForm((current) => ({ ...current, status: value }))} options={taskStatuses.map((status) => ({ label: status, value: status }))} />
        </div>
        <ModalActions busy={busy} onClose={onClose} submitLabel="Create Task" />
      </form>
    </ModalShell>
  );
}

function DocumentFormModal({ accessToken, employee, onClose, onSaved }: { accessToken: string; employee: EmployeeRow; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ document_type: "Aadhaar", file_url: "", verification_status: "Pending", remarks: "" });
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    await apiRequest(`/hr/employees/${employee.id}/documents`, accessToken, { method: "POST", body: JSON.stringify(form) });
    setBusy(false);
    onSaved();
  }
  return (
    <ModalShell title="Upload Document" subtitle={`Attach document metadata for ${employee.full_name}`} onClose={onClose}>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <SelectInput label="Document Type" value={form.document_type} onChange={(value) => setForm((current) => ({ ...current, document_type: value }))} options={documentTypes.map((type) => ({ label: type, value: type }))} />
        <TextInput label="File URL" value={form.file_url} onChange={(value) => setForm((current) => ({ ...current, file_url: value }))} required />
        <SelectInput label="Verification Status" value={form.verification_status} onChange={(value) => setForm((current) => ({ ...current, verification_status: value }))} options={["Pending", "Verified", "Rejected"].map((status) => ({ label: status, value: status }))} />
        <TextInput label="Remarks" value={form.remarks} onChange={(value) => setForm((current) => ({ ...current, remarks: value }))} />
        <ModalActions busy={busy} onClose={onClose} submitLabel="Upload Document" />
      </form>
    </ModalShell>
  );
}

function TextInput({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (value: string) => void; type?: "text" | "email" | "date" | "number"; required?: boolean }) {
  return (
    <label className="block text-sm font-black">
      {label}{required ? " *" : ""}
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} required={required} className="mt-2 h-10 w-full rounded-xl border border-[#ddeecf] bg-white px-3 text-sm font-bold outline-none transition focus:border-[#58cc02]" />
    </label>
  );
}

function SelectInput({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ label: string; value: string }> }) {
  return (
    <label className="block text-sm font-black">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-[#ddeecf] bg-white px-3 text-sm font-bold outline-none transition focus:border-[#58cc02]">
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function ModalActions({ busy, onClose, submitLabel }: { busy: boolean; onClose: () => void; submitLabel: string }) {
  return (
    <div className="flex flex-wrap justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="rounded-lg border border-[#ddeecf] px-4 py-2 text-xs font-black">Cancel</button>
      <button type="submit" disabled={busy} className="rounded-lg bg-[#58cc02] px-4 py-2 text-xs font-black text-white transition hover:bg-[#3e9e00] disabled:opacity-60">{busy ? "Saving..." : submitLabel}</button>
    </div>
  );
}
