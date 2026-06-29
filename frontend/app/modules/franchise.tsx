/* =====================================================
PINESPHERE ERP
Module      : Frontend Platform
Component   : Franchise
Purpose     : Renders and coordinates Franchise UI behavior
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
  AlertTriangle,
  Building2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileClock,
  Filter,
  LineChart,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Upload,
} from "lucide-react";
import type { ComponentType, CSSProperties, FormEvent, ReactNode } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";
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

type IconType = ComponentType<{ size?: number; className?: string; style?: CSSProperties }>;

type FranchiseKpi = {
  key: string;
  label: string;
  value: string;
  trend: string;
  status: "healthy" | "warning" | "critical" | "info";
  series: number[];
};

type FranchiseRow = {
  id: string;
  name: string;
  owner: string;
  linked_branches: number;
  students: number;
  revenue: number;
  royalty_percent: number;
  compliance_score: number;
  agreement_status: string;
  last_activity: string;
  health: "healthy" | "warning" | "critical";
};

type FranchiseAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warning" | "info" | "success";
  timestamp: string;
  action: string;
};

type ChartPoint = {
  label: string;
  revenue: number;
  royalty: number;
  students: number;
  attendance: number;
  conversion: number;
};

type ComplianceMetric = {
  label: string;
  value: number;
  insight: string;
};

type AgreementItem = {
  id: string;
  franchise: string;
  status: string;
  renewal_date: string;
  duration: string;
  pending_signatures: number;
  uploaded_documents: number;
  kyc_status: string;
  gst_status: string;
};

type AiInsight = {
  id: string;
  title: string;
  detail: string;
  confidence: number;
  recommendation: string;
  direction: "up" | "down" | "risk";
};

type FranchiseDashboardResponse = {
  last_sync_time: string;
  system_status: string;
  active_franchises: number;
  kpis: FranchiseKpi[];
  franchises: FranchiseRow[];
  alerts: FranchiseAlert[];
  charts: ChartPoint[];
  compliance: ComplianceMetric[];
  agreements: AgreementItem[];
  insights: AiInsight[];
};

type FranchiseCreateResponse = {
  id: string;
  name: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;
  city?: string | null;
  status: string;
  royalty_percent: number;
  linked_branch_ids?: string[] | null;
};

type ActionModalProps = {
  accessToken: string;
  action: string;
  onClose: () => void;
  onComplete: (message: string) => void;
};

const statusColors = {
  healthy: "#58cc02",
  warning: "#ff9600",
  critical: "#ff4b4b",
  info: "#1cb0f6",
  success: "#58cc02",
};

const emptyDashboard: FranchiseDashboardResponse = {
  last_sync_time: "",
  system_status: "Connecting",
  active_franchises: 0,
  kpis: [
    { key: "franchises", label: "Total Franchises", value: "0", trend: "Live DB", status: "info", series: [0] },
    { key: "branches", label: "Active Branches", value: "0", trend: "Linked branches", status: "info", series: [0] },
    { key: "royalty", label: "Monthly Royalty Revenue", value: "Rs 0.0L", trend: "0 overdue", status: "info", series: [0] },
    { key: "renewals", label: "Pending Renewals", value: "0", trend: "Agreement queue", status: "info", series: [0] },
    { key: "compliance", label: "Compliance Score", value: "0%", trend: "Average checks", status: "info", series: [0] },
    { key: "approvals", label: "Pending Approvals", value: "0", trend: "Risk review", status: "info", series: [0] },
  ],
  franchises: [],
  alerts: [],
  charts: [],
  compliance: [],
  agreements: [],
  insights: [],
};

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export function FranchiseOperationsPanel({
  accessToken,
  ActionModalComponent,
}: {
  accessToken: string;
  ActionModalComponent: ComponentType<ActionModalProps>;
}) {
  const [dashboard, setDashboard] = useState<FranchiseDashboardResponse>(emptyDashboard);
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [status, setStatus] = useState("Connecting to franchise control center...");
  const [lastSync, setLastSync] = useState(new Date());
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadDashboard(isBackground = false) {
      if (!isBackground) setStatus("Loading live franchise data...");
      try {
        const data = await apiRequest<FranchiseDashboardResponse>("/api/franchise/analytics", accessToken);
        if (!alive) return;
        setDashboard(data);
        setLastSync(new Date(data.last_sync_time));
        setStatus("Live from franchise APIs");
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      } catch (error) {
        if (!alive) return;
        setStatus(error instanceof Error ? `Live data unavailable: ${error.message}` : "Live data unavailable");
      }
    }

    loadDashboard();
    const poll = window.setInterval(() => loadDashboard(true), 12000);
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => {
      alive = false;
      window.clearInterval(poll);
    };
  }, [accessToken, refreshKey]);

  useEffect(() => {
    const wsBase = API_URL.replace(/^http/, "ws");
    const socket = new WebSocket(`${wsBase}/api/franchise/realtime`);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<FranchiseDashboardResponse>;
        setDashboard((current) => ({ ...current, ...data }));
        setLastSync(new Date(data.last_sync_time ?? new Date().toISOString()));
        setStatus("Realtime WebSocket stream active");
      } catch {
        setStatus("Realtime message could not be read");
      }
    };
    socket.onerror = () => setStatus("Polling active; realtime socket unavailable");

    return () => socket.close();
  }, []);

  const filteredFranchises = useMemo(() => {
    return dashboard.franchises.filter((franchise) => {
      const matchesQuery = [franchise.name, franchise.owner, franchise.agreement_status].some((value) =>
        value.toLowerCase().includes(query.toLowerCase()),
      );
      const matchesFilter = filter === "all" || franchise.health === filter || franchise.agreement_status.toLowerCase().includes(filter);
      return matchesQuery && matchesFilter;
    });
  }, [dashboard.franchises, filter, query]);

  const activeCount = dashboard.franchises.filter((item) => item.health !== "critical").length;

  return (
    <div className="space-y-3 overflow-x-hidden">
      <section className="rounded-lg border border-[#cceabf] bg-[linear-gradient(135deg,#12310f,#2f7d00_46%,#6fe31d)] px-4 py-3 text-white shadow-[0_18px_44px_rgba(47,125,0,0.22)] sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-white/18">
              <Building2 size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-black leading-tight">Franchise Operations</h2>
                <span className="flex items-center gap-1 rounded-full bg-white/16 px-2.5 py-1 text-[11px] font-black uppercase">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  {dashboard.system_status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-white/90">
                <span>{dashboard.active_franchises || activeCount} active franchises</span>
                <span>Last sync {dashboard.last_sync_time ? lastSync.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "waiting"}</span>
                <span>{status}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <HeaderAction label="Add Franchise" icon={Plus} onClick={() => setActiveAction("Add franchise")} />
            <HeaderAction label="Export Report" icon={Download} onClick={() => setActiveAction("Export Report")} />
            <HeaderAction label="Review Compliance" icon={ClipboardCheck} onClick={() => setActiveAction("Review compliance")} />
            <HeaderAction label="Revenue Analytics" icon={LineChart} onClick={() => setActiveAction("Revenue Analytics")} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {dashboard.kpis.map((kpi) => (
          <KpiCard key={kpi.key} kpi={kpi} />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)]">
        <Panel
          icon={Building2}
          title="Franchise Directory"
          subtitle="Owner, multi-branch health, royalties, agreements, and last operating signal."
          action={
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6f56]" size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="h-9 w-[210px] rounded-[12px] border border-[#ddeecf] bg-white pl-9 pr-3 text-xs font-bold outline-none transition focus:border-[#58cc02]"
                  placeholder="Search franchise"
                />
              </div>
              <label className="flex h-9 items-center gap-2 rounded-[12px] border border-[#ddeecf] bg-white px-3 text-xs font-black text-[#5f6f56]">
                <Filter size={14} />
                <select value={filter} onChange={(event) => setFilter(event.target.value)} className="bg-transparent outline-none">
                  <option value="all">All</option>
                  <option value="healthy">Healthy</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                  <option value="renewal">Renewal</option>
                </select>
              </label>
            </div>
          }
        >
          <FranchiseTable
            rows={filteredFranchises}
            expandedId={expandedId}
            onToggle={setExpandedId}
            onAction={(action, row) => setActiveAction(`${action} ${row.name}`)}
          />
        </Panel>

        <Panel icon={AlertTriangle} title="Smart Alerts" subtitle="Realtime risk queue for agreements, payments, and standards.">
          <div className="max-h-[390px] space-y-2 overflow-y-auto pr-1">
            {dashboard.alerts.length ? dashboard.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onAction={() => setActiveAction(alert.action)} />
            )) : <EmptyState title="No live alerts" text="Franchise notifications, overdue royalties, and agreement risks will appear here when recorded in PostgreSQL." />}
          </div>
        </Panel>
      </section>

      <section className="grid grid-flow-dense items-stretch gap-3 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Panel icon={FileCheck2} title="Agreement Management" subtitle="Renewals, signatures, documents, KYC, GST, and audit visibility.">
          {dashboard.agreements.length ? (
            <div className="grid h-full auto-rows-fr gap-2 md:grid-cols-2 2xl:grid-cols-3">
              {dashboard.agreements.map((agreement) => (
              <AgreementCard key={agreement.id} agreement={agreement} onAction={(action) => setActiveAction(`${action} ${agreement.franchise}`)} />
              ))}
            </div>
          ) : <EmptyState title="No agreements uploaded" text="Agreement, KYC, GST, and renewal records will render here from the franchise agreement table." />}
          </Panel>
        </div>

        <div className="xl:col-span-5">
          <Panel icon={Sparkles} title="AI Business Insights" subtitle="Prediction signals and recommended operating actions.">
          <div className="grid h-full auto-rows-fr gap-2 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            {dashboard.insights.length ? dashboard.insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            )) : <EmptyState title="No AI insights yet" text="Insights are generated only from live franchise revenue, compliance, and royalty records." />}
          </div>
          </Panel>
        </div>
      </section>

      {activeAction === "Add franchise" ? (
        <AddFranchiseModal
          accessToken={accessToken}
          onClose={() => setActiveAction(null)}
          onComplete={() => {
            setActiveAction(null);
            setRefreshKey((current) => current + 1);
          }}
        />
      ) : activeAction ? (
        <ActionModalComponent
          accessToken={accessToken}
          action={activeAction}
          onClose={() => setActiveAction(null)}
          onComplete={() => setActiveAction(null)}
        />
      ) : null}
    </div>
  );
}

function AddFranchiseModal({
  accessToken,
  onClose,
  onComplete,
}: {
  accessToken: string;
  onClose: () => void;
  onComplete: (message: string) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    city: "",
    status: "active",
    royalty_percent: "10",
    linked_branch_ids: "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const linkedBranchIds = form.linked_branch_ids
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      await apiRequest<FranchiseCreateResponse>("/api/franchise/franchises", accessToken, {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          owner_name: form.owner_name.trim(),
          owner_email: form.owner_email.trim() || null,
          owner_phone: form.owner_phone.trim() || null,
          city: form.city.trim() || null,
          status: form.status,
          royalty_percent: Number(form.royalty_percent || 0),
          linked_branch_ids: linkedBranchIds.length ? linkedBranchIds : null,
        }),
      });
      onComplete("Franchise created successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create franchise.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18230f]/55 px-4 backdrop-blur-sm">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#ddeecf] bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#071B4A]">Add franchise</h2>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">Create a live franchise record in PostgreSQL.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDE9E4] px-3 py-2 text-xs font-black text-[#071B4A]">Close</button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <FormInput label="Franchise name" value={form.name} onChange={(value) => updateField("name", value)} required />
          <FormInput label="Owner name" value={form.owner_name} onChange={(value) => updateField("owner_name", value)} required />
          <FormInput label="Owner email" type="email" value={form.owner_email} onChange={(value) => updateField("owner_email", value)} />
          <FormInput label="Owner phone" value={form.owner_phone} onChange={(value) => updateField("owner_phone", value)} />
          <FormInput label="City" value={form.city} onChange={(value) => updateField("city", value)} />
          <label className="space-y-1 text-xs font-black text-[#5f6f56]">
            <span>Status</span>
            <select value={form.status} onChange={(event) => updateField("status", event.target.value)} className="h-10 w-full rounded-lg border border-[#DDE9E4] bg-white px-3 text-sm font-bold text-[#071B4A] outline-none focus:border-[#58cc02]">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <FormInput label="Royalty %" type="number" value={form.royalty_percent} onChange={(value) => updateField("royalty_percent", value)} required />
          <FormInput label="Linked branch IDs" value={form.linked_branch_ids} onChange={(value) => updateField("linked_branch_ids", value)} placeholder="branch-1, branch-2" />
        </div>

        {message ? <div className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff1f2] p-3 text-xs font-bold text-[#b91c1c]">{message}</div> : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-[#DDE9E4] px-4 py-2 text-sm font-black text-[#071B4A]">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-lg bg-[#0B7A5A] px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {busy ? "Saving..." : "Save franchise"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-xs font-black text-[#5f6f56]">
      <span>{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-[#DDE9E4] bg-white px-3 text-sm font-bold text-[#071B4A] outline-none focus:border-[#58cc02]"
      />
    </label>
  );
}

function HeaderAction({ label, icon: Icon, onClick }: { label: string; icon: IconType; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center justify-center gap-2 rounded-[12px] bg-white/18 px-3 text-xs font-black text-white transition hover:bg-white/26"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function KpiCard({ kpi }: { kpi: FranchiseKpi }) {
  const color = statusColors[kpi.status];
  return (
    <article className="group min-h-[96px] rounded-[14px] border border-[#ddeecf] bg-white/92 p-3 shadow-[0_6px_14px_rgba(15,23,42,0.05)] backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_12px_22px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-black uppercase leading-4 text-[#5f6f56]">{kpi.label}</p>
        <span className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[20px] font-black leading-none text-[#18230f] transition-all duration-300 group-hover:tracking-wide">{kpi.value}</p>
          <p className="mt-1.5 text-[11px] font-black" style={{ color }}>{kpi.trend}</p>
        </div>
        <MiniSparkline values={kpi.series} color={color} />
      </div>
    </article>
  );
}

function Panel({ icon: Icon, title, subtitle, action, children }: { icon: IconType; title: string; subtitle: string; action?: ReactNode; children: ReactNode }) {
  return (
    <article className="flex h-full min-w-0 flex-col rounded-[14px] border border-[#ddeecf] bg-white p-3 shadow-[0_6px_16px_rgba(15,23,42,0.055)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#58cc02]/15 text-[#3e9e00]">
            <Icon size={19} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-black leading-tight text-[#18230f]">{title}</h3>
            <p className="mt-0.5 text-xs font-semibold leading-5 text-[#5f6f56]">{subtitle}</p>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-2.5 flex-1">{children}</div>
    </article>
  );
}

function FranchiseTable({
  rows,
  expandedId,
  onToggle,
  onAction,
}: {
  rows: FranchiseRow[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  onAction: (action: string, row: FranchiseRow) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-[#ddeecf]">
      <div className="max-h-[390px] overflow-auto">
        <table className="w-full min-w-[930px] border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-[#f6fff0] text-[11px] uppercase text-[#5f6f56]">
            <tr>
              {["Franchise Name", "Owner", "Linked Branches", "Students", "Revenue", "Royalty %", "Compliance", "Agreement", "Last Activity", "Actions"].map((header) => (
                <th key={header} className="border-b border-[#ddeecf] px-3 py-2 font-black">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={10} className="px-3 py-8">
                  <EmptyState title="No franchise records" text="Create a franchise record in PostgreSQL to populate this live directory." />
                </td>
              </tr>
            ) : null}
            {rows.map((row) => {
              const color = statusColors[row.health];
              return (
                <Fragment key={row.id}>
                  <tr className="border-b border-[#eef7e8] transition hover:bg-[#f6fff0]">
                    <td className="px-3 py-2.5">
                      <button type="button" onClick={() => onToggle(expandedId === row.id ? null : row.id)} className="flex items-center gap-2 font-black text-[#18230f]">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {row.name}
                        <ChevronDown size={14} className={`transition ${expandedId === row.id ? "rotate-180" : ""}`} />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#5f6f56]">{row.owner}</td>
                    <td className="px-3 py-2.5 font-black">{row.linked_branches}</td>
                    <td className="px-3 py-2.5 font-black">{row.students.toLocaleString("en-IN")}</td>
                    <td className="px-3 py-2.5 font-black">{formatCurrency(row.revenue)}</td>
                    <td className="px-3 py-2.5 font-black">{row.royalty_percent}%</td>
                    <td className="px-3 py-2.5">
                      <ScoreBar value={row.compliance_score} />
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge color={row.agreement_status === "Active" ? "healthy" : row.agreement_status.includes("Hold") ? "critical" : "warning"}>{row.agreement_status}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-[#5f6f56]">{row.last_activity}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex gap-1">
                        <IconButton icon={Eye} label="View" onClick={() => onToggle(expandedId === row.id ? null : row.id)} />
                        <IconButton icon={RefreshCw} label="Refresh" onClick={() => onAction("Refresh franchise", row)} />
                        <IconButton icon={MoreHorizontal} label="More" onClick={() => onAction("Open franchise actions for", row)} />
                      </div>
                    </td>
                  </tr>
                  {expandedId === row.id ? (
                    <tr key={`${row.id}-expanded`} className="border-b border-[#ddeecf] bg-[#f6fff0]">
                      <td colSpan={10} className="px-3 py-3">
                        <div className="grid gap-2 text-xs font-bold text-[#5f6f56] md:grid-cols-4">
                          <MiniInfo label="Royalty due" value={formatCurrency(Math.round(row.revenue * (row.royalty_percent / 100)))} />
                          <MiniInfo label="Student density" value={`${Math.round(row.students / Math.max(row.linked_branches, 1))} / branch`} />
                          <MiniInfo label="Agreement control" value={row.agreement_status} />
                          <MiniInfo label="Health state" value={row.health} />
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-[#ddeecf] bg-white px-3 py-2 text-xs font-bold text-[#5f6f56]">
        <span>Showing {rows.length} franchises</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}

function AlertCard({ alert, onAction }: { alert: FranchiseAlert; onAction: () => void }) {
  const color = statusColors[alert.severity];
  const Icon = alert.severity === "critical" ? AlertTriangle : alert.severity === "warning" ? FileClock : Activity;
  return (
    <div className="rounded-[14px] border p-3" style={{ borderColor: `${color}55`, backgroundColor: `${color}10` }}>
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 shrink-0" size={16} style={{ color }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-black text-[#18230f]">{alert.title}</p>
            <span className="text-[10px] font-black uppercase" style={{ color }}>{alert.severity}</span>
          </div>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#5f6f56]">{alert.detail}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-[#5f6f56]"><Clock3 size={12} />{alert.timestamp}</span>
            <button type="button" onClick={onAction} className="rounded-[10px] bg-white px-2.5 py-1.5 text-[11px] font-black text-[#3e9e00] shadow-sm">{alert.action}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AgreementCard({ agreement, onAction }: { agreement: AgreementItem; onAction: (action: string) => void }) {
  return (
    <div className="flex h-full flex-col rounded-[12px] border border-[#ddeecf] bg-[#fbfff8] p-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-black text-[#18230f]">{agreement.franchise}</p>
          <p className="mt-1 text-[11px] font-bold text-[#5f6f56]">Renewal {formatDate(agreement.renewal_date)}</p>
        </div>
        <Badge color={agreement.status === "Active" ? "healthy" : agreement.status.includes("Hold") ? "critical" : "warning"}>{agreement.status}</Badge>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px] font-bold text-[#5f6f56]">
        <MiniInfo label="Duration" value={agreement.duration} />
        <MiniInfo label="Signatures" value={`${agreement.pending_signatures} pending`} />
        <MiniInfo label="Documents" value={`${agreement.uploaded_documents} uploaded`} />
        <MiniInfo label="KYC / GST" value={`${agreement.kyc_status} / ${agreement.gst_status}`} />
      </div>
      <div className="mt-auto flex flex-wrap gap-1.5 pt-2">
        <SmallAction icon={Clock3} label="Reminder" onClick={() => onAction("Agreement reminder")} />
        <SmallAction icon={Upload} label="Upload" onClick={() => onAction("Upload agreement document")} />
        <SmallAction icon={Download} label="Download" onClick={() => onAction("Download agreement")} />
        <SmallAction icon={Eye} label="Audit Log" onClick={() => onAction("Agreement audit log")} />
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: AiInsight }) {
  const [expanded, setExpanded] = useState(false);
  const color = insight.direction === "up" ? "#58cc02" : insight.direction === "down" ? "#ff9600" : "#ff4b4b";
  return (
    <button type="button" onClick={() => setExpanded((current) => !current)} className="h-full rounded-[12px] border border-[#ddeecf] bg-[#fbfff8] p-2.5 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#58cc02] hover:shadow-[0_10px_20px_rgba(15,23,42,0.08)]">
      <div className="flex gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" style={{ backgroundColor: `${color}18`, color }}>
          {insight.direction === "up" ? <TrendingUp size={17} /> : insight.direction === "down" ? <LineChart size={17} /> : <AlertTriangle size={17} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-[#18230f]">{insight.title}</p>
          <p className={`${expanded ? "" : "line-clamp-2"} mt-1 text-xs font-semibold leading-5 text-[#5f6f56]`}>{insight.detail}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#f6fff0] px-2 py-1 text-[10px] font-black text-[#3e9e00]">{insight.recommendation}</span>
            <span className="text-[10px] font-black text-[#5f6f56]">{insight.confidence}% confidence</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#ddeecf]">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${insight.confidence}%`, backgroundColor: color }} />
          </div>
        </div>
      </div>
    </button>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[#ddeecf] bg-[#fbfff8] p-4 text-center">
      <p className="text-xs font-black text-[#18230f]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#5f6f56]">{text}</p>
    </div>
  );
}

function MiniSparkline({ values, color, large = false }: { values: number[]; color: string; large?: boolean }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * 64},${30 - ((value - min) / Math.max(max - min, 1)) * 24 - 3}`).join(" ");
  return (
    <svg viewBox="0 0 64 34" className={large ? "h-16 w-full" : "h-10 w-16"}>
      <polyline points={points} fill="none" stroke={color} strokeWidth={large ? "3.5" : "3"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ScoreBar({ value }: { value: number }) {
  const color = value >= 90 ? "#58cc02" : value >= 80 ? "#ff9600" : "#ff4b4b";
  return (
    <div className="flex min-w-[86px] items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#ddeecf]">
        <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="w-8 font-black">{value}%</span>
    </div>
  );
}

function Badge({ color, children }: { color: "healthy" | "warning" | "critical" | "info"; children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-black uppercase" style={{ backgroundColor: `${statusColors[color]}18`, color: statusColors[color] }}>
      {children}
    </span>
  );
}

function IconButton({ icon: Icon, label, onClick }: { icon: IconType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className="grid h-7 w-7 place-items-center rounded-[9px] border border-[#ddeecf] text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]">
      <Icon size={14} />
    </button>
  );
}

function SmallAction({ icon: Icon, label, onClick }: { icon: IconType; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex h-7 items-center gap-1 rounded-[8px] border border-[#ddeecf] bg-white px-1.5 text-[10px] font-black text-[#5f6f56] transition hover:border-[#58cc02] hover:text-[#3e9e00]">
      <Icon size={12} />
      {label}
    </button>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#ddeecf] bg-white px-2 py-1">
      <p className="text-[10px] font-black uppercase text-[#5f6f56]">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-black text-[#18230f]">{value}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  if (value >= 100000) return `Rs ${(value / 100000).toFixed(1)}L`;
  return `Rs ${value.toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
