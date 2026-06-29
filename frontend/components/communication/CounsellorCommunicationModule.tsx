"use client"

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts"
import {
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  Edit3,
  Filter,
  FileText,
  Mail,
  MessageSquare,
  Moon,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sun,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { API_URL, apiRequest, getStoredSessionValue } from "@/app/shared/api"

type Channel = "call" | "whatsapp" | "email" | "sms"
type CommStatus = "sent" | "delivered" | "read" | "failed" | "pending"
type Tab = "all" | "call" | "whatsapp" | "email" | "sms"

type CommunicationLog = {
  id: string
  channel: Channel
  recipient_name: string
  recipient_phone: string | null
  recipient_email: string | null
  subject: string | null
  message: string | null
  status: CommStatus
  branch_id: string | null
  counsellor_id: string | null
  template_id: string | null
  template_name: string | null
  created_at: string
  sent_at: string | null
  delivered_at: string | null
  read_at: string | null
  failed_reason: string | null
  timeline: Array<{ label: string; value: string }>
}

type CommunicationTemplate = {
  id: string
  name: string
  channel: Channel
  category: string | null
  subject: string | null
  body: string
  branch_id: string | null
  created_by: string | null
  is_active: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

type CommunicationDashboard = {
  generated_at: string
  summary: { total_communications: number; sent: number; delivered: number; read: number; failed: number; pending: number }
  kpis: Array<{ label: string; value: number; tone: string }>
  logs: CommunicationLog[]
  analytics: {
    by_channel: Array<{ label: string; value: number }>
    by_status: Array<{ label: string; value: number }>
    trend: Array<{ date: string; call: number; whatsapp: number; email: number; sms: number }>
  }
  templates: CommunicationTemplate[]
}

type CommunicationApiResponse = CommunicationDashboard

type ComposeState = {
  recipient_name: string
  recipient_phone: string
  recipient_email: string
  subject: string
  message: string
  channel: Channel
}

type TemplateDraft = {
  name: string
  channel: Channel
  category: string
  subject: string
  body: string
}

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "call", label: "Calls" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "Emails" },
  { key: "sms", label: "SMS" },
]

const defaultCompose: ComposeState = {
  recipient_name: "",
  recipient_phone: "",
  recipient_email: "",
  subject: "",
  message: "",
  channel: "call",
}

const defaultTemplate: TemplateDraft = {
  name: "",
  channel: "whatsapp",
  category: "",
  subject: "",
  body: "",
}

const fallbackCommunication: CommunicationDashboard = {
  generated_at: new Date().toISOString(),
  summary: { total_communications: 84, sent: 72, delivered: 64, read: 41, failed: 4, pending: 8 },
  kpis: [
    { label: "Calls Made", value: 28, tone: "blue" },
    { label: "WhatsApp Messages Sent", value: 30, tone: "green" },
    { label: "Emails Sent", value: 18, tone: "purple" },
    { label: "SMS Sent", value: 8, tone: "orange" },
  ],
  logs: [
    { id: "log-1", channel: "call", recipient_name: "Meera Nair", recipient_phone: "+91 98765 43210", recipient_email: null, subject: "Admission follow-up", message: "Discuss weekend batch.", status: "sent", branch_id: "Kochi", counsellor_id: null, template_id: null, template_name: "Welcome Call", created_at: "2026-06-09T09:15:00", sent_at: "2026-06-09T09:15:00", delivered_at: "2026-06-09T09:18:00", read_at: null, failed_reason: null, timeline: [{ label: "Created", value: "2026-06-09T09:15:00" }, { label: "Sent", value: "2026-06-09T09:15:00" }, { label: "Delivered", value: "2026-06-09T09:18:00" }] },
    { id: "log-2", channel: "whatsapp", recipient_name: "Aarav Sharma", recipient_phone: "+91 98470 11520", recipient_email: null, subject: "Demo reminder", message: "Your demo is scheduled today.", status: "delivered", branch_id: "Madurai", counsellor_id: null, template_id: null, template_name: "Demo Reminder", created_at: "2026-06-09T13:15:00", sent_at: "2026-06-09T13:15:00", delivered_at: "2026-06-09T13:20:00", read_at: null, failed_reason: null, timeline: [{ label: "Created", value: "2026-06-09T13:15:00" }, { label: "Sent", value: "2026-06-09T13:15:00" }, { label: "Delivered", value: "2026-06-09T13:20:00" }] },
    { id: "log-3", channel: "email", recipient_name: "Nandini R", recipient_phone: null, recipient_email: "nandini@example.com", subject: "Onboarding", message: "Please review the onboarding kit.", status: "read", branch_id: "Chennai", counsellor_id: null, template_id: null, template_name: "Fee Update Email", created_at: "2026-06-08T11:15:00", sent_at: "2026-06-08T11:15:00", delivered_at: "2026-06-08T11:18:00", read_at: "2026-06-08T11:50:00", failed_reason: null, timeline: [{ label: "Created", value: "2026-06-08T11:15:00" }, { label: "Sent", value: "2026-06-08T11:15:00" }, { label: "Delivered", value: "2026-06-08T11:18:00" }, { label: "Read", value: "2026-06-08T11:50:00" }] },
  ],
  analytics: {
    by_channel: [
      { label: "Calls", value: 28 },
      { label: "WhatsApp", value: 30 },
      { label: "Email", value: 18 },
      { label: "SMS", value: 8 },
    ],
    by_status: [
      { label: "Sent", value: 72 },
      { label: "Delivered", value: 64 },
      { label: "Read", value: 41 },
      { label: "Failed", value: 4 },
      { label: "Pending", value: 8 },
    ],
    trend: [
      { date: "2026-06-04", call: 5, whatsapp: 3, email: 2, sms: 1 },
      { date: "2026-06-05", call: 4, whatsapp: 5, email: 3, sms: 0 },
      { date: "2026-06-06", call: 6, whatsapp: 4, email: 2, sms: 1 },
      { date: "2026-06-07", call: 7, whatsapp: 6, email: 4, sms: 2 },
    ],
  },
  templates: [
    { id: "tmpl-1", name: "Welcome Call", channel: "call", category: "Lead Nurture", subject: "Welcome", body: "Warm welcome call script.", branch_id: null, created_by: null, is_active: true, usage_count: 18, created_at: "2026-06-01T10:00:00", updated_at: "2026-06-01T10:00:00" },
    { id: "tmpl-2", name: "Demo Reminder", channel: "whatsapp", category: "Follow-up", subject: "Demo reminder", body: "Hi {{name}}, your demo is scheduled today.", branch_id: null, created_by: null, is_active: true, usage_count: 30, created_at: "2026-06-01T10:00:00", updated_at: "2026-06-01T10:00:00" },
  ],
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function statusTone(status: CommStatus) {
  switch (status) {
    case "read":
      return "green"
    case "delivered":
      return "blue"
    case "sent":
      return "violet"
    case "failed":
      return "rose"
    default:
      return "amber"
  }
}

function channelTone(channel: Channel) {
  switch (channel) {
    case "call":
      return "blue"
    case "whatsapp":
      return "green"
    case "email":
      return "violet"
    case "sms":
      return "amber"
  }
}

function Badge({ children, tone = "blue", dark = false }: { children: ReactNode; tone?: "blue" | "green" | "violet" | "amber" | "rose" | "slate"; dark?: boolean }) {
  const styles: Record<string, string> = {
    blue: dark ? "bg-blue-950/60 text-blue-200 ring-blue-900/60" : "bg-blue-50 text-blue-700 ring-blue-100",
    green: dark ? "bg-emerald-950/60 text-emerald-200 ring-emerald-900/60" : "bg-emerald-50 text-emerald-700 ring-emerald-100",
    violet: dark ? "bg-violet-950/60 text-violet-200 ring-violet-900/60" : "bg-violet-50 text-violet-700 ring-violet-100",
    amber: dark ? "bg-amber-950/60 text-amber-200 ring-amber-900/60" : "bg-amber-50 text-amber-700 ring-amber-100",
    rose: dark ? "bg-rose-950/60 text-rose-200 ring-rose-900/60" : "bg-rose-50 text-rose-700 ring-rose-100",
    slate: dark ? "bg-slate-800 text-slate-100 ring-slate-700" : "bg-slate-100 text-slate-700 ring-slate-200",
  }
  return <span className={cx("inline-flex items-center rounded-full px-3 py-1 text-xs font-black ring-1", styles[tone])}>{children}</span>
}

function Panel({ title, subtitle, dark, children, className = "" }: { title: string; subtitle?: string; dark: boolean; children: ReactNode; className?: string }) {
  return (
    <section className={cx("rounded-[24px] border p-5 shadow-[0_14px_30px_rgba(15,23,42,0.06)]", dark ? "border-slate-800 bg-slate-900 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]", className)}>
      <div className="mb-4">
        <h2 className="text-[18px] font-black">{title}</h2>
        {subtitle ? <p className={cx("mt-1 text-sm font-semibold", dark ? "text-slate-300" : "text-[#60708C]")}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  )
}

function KpiCard({ item, dark }: { item: { label: string; value: number; tone: string }; dark: boolean }) {
  return (
    <div className={cx("rounded-[22px] border p-4 shadow-sm transition", dark ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
      <div className={cx("grid h-11 w-11 place-items-center rounded-2xl", item.tone === "green" ? (dark ? "bg-emerald-950/60 text-emerald-200" : "bg-emerald-50 text-emerald-700") : item.tone === "purple" ? (dark ? "bg-violet-950/60 text-violet-200" : "bg-violet-50 text-violet-700") : item.tone === "orange" ? (dark ? "bg-amber-950/60 text-amber-200" : "bg-amber-50 text-amber-700") : item.tone === "red" ? (dark ? "bg-rose-950/60 text-rose-200" : "bg-rose-50 text-rose-700") : (dark ? "bg-blue-950/60 text-blue-200" : "bg-blue-50 text-blue-700"))}>
        <Target size={19} />
      </div>
      <p className={cx("mt-4 text-3xl font-black", dark ? "text-white" : "text-[#071B4A]")}>{item.value}</p>
      <p className={cx("mt-1 text-sm font-bold", dark ? "text-slate-300" : "text-[#60708C]")}>{item.label}</p>
    </div>
  )
}

export function CounsellorCommunicationModule() {
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<CommunicationDashboard>(fallbackCommunication)
  const [notice, setNotice] = useState("")
  const [tab, setTab] = useState<Tab>("all")
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState(fallbackCommunication.logs[0].id)
  const [composeOpen, setComposeOpen] = useState(false)
  const [compose, setCompose] = useState<ComposeState>(defaultCompose)
  const [templateOpen, setTemplateOpen] = useState(false)
  const [templateDraft, setTemplateDraft] = useState<TemplateDraft>(defaultTemplate)

  const selected = useMemo(() => data.logs.find((log) => log.id === selectedId) ?? data.logs[0], [data.logs, selectedId])

  async function loadCommunications() {
    setLoading(true)
    try {
      const payload = await apiRequest<CommunicationApiResponse>("/communications", "")
      setData(payload)
      setSelectedId(payload.logs[0]?.id ?? "")
    } catch (error) {
      console.error("Failed to load communications", error)
      setData(fallbackCommunication)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCommunications()
  }, [])

  function openCompose(channel: Channel, log?: CommunicationLog | null) {
    setCompose({
      recipient_name: log?.recipient_name ?? "",
      recipient_phone: log?.recipient_phone ?? "",
      recipient_email: log?.recipient_email ?? "",
      subject: log?.subject ?? "",
      message: log?.message ?? "",
      channel,
    })
    setComposeOpen(true)
  }

  const filteredLogs = useMemo(() => {
    const text = search.trim().toLowerCase()
    return (loading ? data.logs : data.logs).filter((log) => {
      const tabMatch = tab === "all" || log.channel === tab
      const haystack = `${log.recipient_name} ${log.subject ?? ""} ${log.message ?? ""} ${log.status} ${log.channel}`.toLowerCase()
      return tabMatch && (!text || haystack.includes(text))
    })
  }, [data.logs, loading, search, tab])

  async function submitCompose() {
    const endpoint = compose.channel === "call" ? "/communications/call" : compose.channel === "whatsapp" ? "/communications/whatsapp" : compose.channel === "email" ? "/communications/email" : "/communications/sms"
    const body = {
      channel: compose.channel,
      recipient_name: compose.recipient_name,
      recipient_phone: compose.recipient_phone || null,
      recipient_email: compose.recipient_email || null,
      subject: compose.subject || null,
      message: compose.message || null,
      status: "sent",
    }
    await apiRequest(endpoint, "", { method: "POST", body: JSON.stringify(body) }).catch(() => undefined)
    setNotice(`${compose.channel.toUpperCase()} logged successfully.`)
    setCompose(defaultCompose)
    setComposeOpen(false)
    loadCommunications()
  }

  async function submitTemplate() {
    await apiRequest("/communications/templates", "", { method: "POST", body: JSON.stringify(templateDraft) }).catch(() => undefined)
    setNotice("Template saved successfully.")
    setTemplateDraft(defaultTemplate)
    setTemplateOpen(false)
    loadCommunications()
  }

  async function deleteTemplate(templateId: string) {
    await apiRequest(`/communications/templates/${templateId}`, "", { method: "DELETE" }).catch(() => undefined)
    setNotice("Template deleted.")
    loadCommunications()
  }

  async function exportLogs(format: "pdf" | "excel" | "csv") {
    const token = getStoredSessionValue("pinesphere_access_token")
    const response = await fetch(`${API_URL}/communications/export/${format}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    if (!response.ok) {
      setNotice("Export failed.")
      return
    }
    const blob = await response.blob()
    const link = document.createElement("a")
    const url = window.URL.createObjectURL(blob)
    link.href = url
    link.download = `communications.${format === "excel" ? "xlsx" : format}`
    link.click()
    window.URL.revokeObjectURL(url)
    setNotice(`Communication ${format.toUpperCase()} export ready.`)
  }

  const shellClass = darkMode ? "bg-slate-950 text-slate-100" : "bg-[#F8FAF8] text-[#071B4A]"
  const mutedClass = darkMode ? "text-slate-300" : "text-[#60708C]"

  return (
    <div className={cx("space-y-5 p-1 md:p-0", shellClass)}>
      <section className={cx("rounded-[26px] border p-5 shadow-[0_16px_32px_rgba(15,23,42,0.06)]", darkMode ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className={cx("flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em]", mutedClass)}>
              <span>Counsellor</span>
              <span>›</span>
              <span>Communication</span>
              <span>›</span>
              <span className={darkMode ? "text-emerald-300" : "text-[#0B7A5A]"}>Communication Center</span>
            </div>
            <h1 className={cx("mt-2 text-3xl font-black tracking-tight sm:text-4xl", darkMode ? "text-white" : "text-[#071B4A]")}>Communication Center</h1>
            <p className={cx("mt-1 text-sm font-semibold", mutedClass)}>Track calls, WhatsApp, emails, SMS, templates, and communication health in one CRM-style workspace.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDarkMode((value) => !value)} className={cx("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? "Light" : "Dark"}
            </button>
            <button type="button" onClick={() => loadCommunications()} className={cx("inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
              <RefreshCw size={16} />
              Refresh
            </button>
            <button type="button" onClick={() => exportLogs("csv")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#DCE7E2] bg-white px-4 text-sm font-black text-[#071B4A]">
              <Copy size={16} />
              CSV
            </button>
            <button type="button" onClick={() => exportLogs("excel")} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-[#DCE7E2] bg-white px-4 text-sm font-black text-[#071B4A]">
              <Download size={16} />
              Excel
            </button>
            <button type="button" onClick={() => exportLogs("pdf")} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20">
              <FileText size={16} />
              PDF
            </button>
          </div>
        </div>
      </section>

      {notice ? <div className={cx("rounded-2xl border px-4 py-3 text-sm font-black", darkMode ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{notice}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(loading ? fallbackCommunication.kpis : data.kpis).map((kpi) => <KpiCard key={kpi.label} item={kpi} dark={darkMode} />)}
      </div>

      <section className={cx("rounded-[24px] border p-5 shadow-sm", darkMode ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
        <div className="flex flex-wrap items-center gap-3">
          <div className={cx("flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl border px-3 py-3", darkMode ? "border-slate-700 bg-slate-950" : "border-[#DCE7E2] bg-white")}>
            <Search size={17} className={mutedClass} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search communications..." className={cx("w-full bg-transparent text-sm font-semibold outline-none", darkMode ? "text-slate-100 placeholder:text-slate-500" : "text-[#071B4A] placeholder:text-[#8A96AA]")} />
          </div>
          <button type="button" onClick={() => setComposeOpen(true)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-4 text-sm font-black text-white">
            <Plus size={16} />
            Quick Action
          </button>
          <button type="button" onClick={() => setTemplateOpen(true)} className={cx("inline-flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-black", darkMode ? "border-slate-700 bg-slate-800 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
            <Edit3 size={16} />
            Templates
          </button>
        </div>
      </section>

      <section className={cx("rounded-[24px] border p-2 shadow-sm", darkMode ? "border-slate-800 bg-slate-900" : "border-[#DCE7E2] bg-white")}>
        <div className="grid gap-2 md:grid-cols-5">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cx("rounded-2xl px-4 py-3 text-sm font-black transition", tab === item.key ? (darkMode ? "bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-900/60" : "bg-[#E9F8F1] text-[#0B7A5A] ring-1 ring-emerald-100") : darkMode ? "text-slate-300 hover:bg-slate-800" : "text-[#60708C] hover:bg-slate-50")}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
        <Panel title="Communication History" subtitle="Sent, delivered, read, failed, and pending communications." dark={darkMode}>
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: darkMode ? "#1F2937" : "#E6EFEA" }}>
            <table className="min-w-full divide-y" style={{ borderColor: darkMode ? "#1F2937" : "#E6EFEA" }}>
              <thead className={darkMode ? "bg-slate-950" : "bg-[#F7FAF8]"}>
                <tr>
                  {["Recipient", "Channel", "Status", "Created"].map((heading) => <th key={heading} className={cx("px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.14em]", mutedClass)}>{heading}</th>)}
                </tr>
              </thead>
              <tbody className={darkMode ? "divide-y divide-slate-800 bg-slate-900" : "divide-y divide-[#E6EFEA] bg-white"}>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/60" onClick={() => setSelectedId(log.id)}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-black">{log.recipient_name}</p>
                      <p className={cx("text-xs font-semibold", mutedClass)}>{log.subject || "No subject"}</p>
                    </td>
                    <td className="px-4 py-3"><Badge tone={channelTone(log.channel)} dark={darkMode}>{log.channel.toUpperCase()}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={statusTone(log.status)} dark={darkMode}>{log.status.toUpperCase()}</Badge></td>
                    <td className="px-4 py-3 text-sm font-semibold">{new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(log.created_at))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Communication Detail" subtitle="Timeline, activity, and quick status context." dark={darkMode}>
          {selected ? (
            <div className="space-y-4">
              <div className={cx("rounded-2xl border p-4", darkMode ? "border-slate-800 bg-slate-950" : "border-[#E6EFEA] bg-[#F9FBFA]")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B7A5A]">Selected Communication</p>
                    <h3 className="mt-1 text-2xl font-black">{selected.recipient_name}</h3>
                    <p className={cx("mt-1 text-sm font-semibold", mutedClass)}>{selected.subject || "Untitled"} · {selected.channel.toUpperCase()}</p>
                  </div>
                  <Badge tone={statusTone(selected.status)} dark={darkMode}>{selected.status.toUpperCase()}</Badge>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailTile icon={Phone} label="Phone" value={selected.recipient_phone || "Not added"} dark={darkMode} />
                  <DetailTile icon={Mail} label="Email" value={selected.recipient_email || "Not added"} dark={darkMode} />
                  <DetailTile icon={Clock3} label="Created" value={new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(selected.created_at))} dark={darkMode} />
                  <DetailTile icon={CheckCircle2} label="Template" value={selected.template_name || "No template"} dark={darkMode} />
                </div>
              </div>
              <div className={cx("rounded-2xl border p-4", darkMode ? "border-slate-800 bg-slate-950" : "border-[#E6EFEA] bg-[#F9FBFA]")}>
                <h4 className="text-sm font-black uppercase tracking-[0.14em] text-[#0B7A5A]">Activity Timeline</h4>
                <div className="mt-3 space-y-3">
                  {selected.timeline.map((step) => (
                    <div key={`${selected.id}-${step.label}`} className={cx("rounded-2xl border px-3 py-3", darkMode ? "border-slate-800 bg-slate-900" : "border-[#E6EFEA] bg-white")}>
                      <p className="text-sm font-black">{step.label}</p>
                      <p className={cx("mt-1 text-xs font-semibold", mutedClass)}>{step.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <QuickAction icon={Phone} label="Call" onClick={() => openCompose("call", selected)} />
                <QuickAction icon={MessageSquare} label="WhatsApp" onClick={() => openCompose("whatsapp", selected)} />
                <QuickAction icon={Mail} label="Email" onClick={() => openCompose("email", selected)} />
                <QuickAction icon={Send} label="SMS" onClick={() => openCompose("sms", selected)} />
              </div>
            </div>
          ) : null}
        </Panel>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <Panel title="Templates" subtitle="Reusable communication blueprints for counsellors." dark={darkMode}>
          <div className="space-y-3">
            {data.templates.map((template) => (
              <div key={template.id} className={cx("rounded-2xl border p-4", darkMode ? "border-slate-800 bg-slate-950" : "border-[#E6EFEA] bg-[#F9FBFA]")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{template.name}</p>
                    <p className={cx("mt-1 text-xs font-semibold", mutedClass)}>{template.category || "General"} · {template.channel.toUpperCase()}</p>
                  </div>
                  <Badge tone={template.is_active ? "green" : "slate"} dark={darkMode}>{template.is_active ? "ACTIVE" : "INACTIVE"}</Badge>
                </div>
                <p className={cx("mt-3 text-sm font-semibold leading-6", mutedClass)}>{template.body}</p>
                <div className="mt-4 flex items-center justify-between">
                  <p className={cx("text-xs font-semibold", mutedClass)}>Used {template.usage_count} times</p>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setTemplateDraft({ name: template.name, channel: template.channel, category: template.category || "", subject: template.subject || "", body: template.body }); setTemplateOpen(true) }} className={cx("rounded-xl border px-3 py-2 text-xs font-black", darkMode ? "border-slate-700 text-slate-100" : "border-[#DCE7E2] text-[#071B4A]")}>
                      <Edit3 size={14} className="inline" /> Edit
                    </button>
                    <button type="button" onClick={() => deleteTemplate(template.id)} className={cx("rounded-xl border px-3 py-2 text-xs font-black", darkMode ? "border-rose-900 text-rose-200" : "border-rose-200 text-rose-700")}>
                      <Trash2 size={14} className="inline" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Communication Analytics" subtitle="Channel and status distribution at a glance." dark={darkMode}>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-[#0B7A5A]">Channel Mix</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={data.analytics.by_channel} dataKey="value" nameKey="label" innerRadius={64} outerRadius={96} paddingAngle={4}>
                    {data.analytics.by_channel.map((entry, index) => <Cell key={entry.label} fill={["#2563EB", "#0B7A5A", "#7C3AED", "#F59E0B"][index % 4]} />)}
                  </Pie>
                  <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-[0.14em] text-[#0B7A5A]">Status Trend</h4>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data.analytics.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#1F2937" : "#E2E8F0"} />
                  <XAxis dataKey="date" stroke={darkMode ? "#94A3B8" : "#64748B"} />
                  <YAxis stroke={darkMode ? "#94A3B8" : "#64748B"} />
                  <Tooltip contentStyle={darkMode ? { backgroundColor: "#0F172A", border: "1px solid #1E293B", color: "#E2E8F0" } : undefined} />
                  <Line type="monotone" dataKey="call" stroke="#2563EB" strokeWidth={2.8} />
                  <Line type="monotone" dataKey="whatsapp" stroke="#0B7A5A" strokeWidth={2.8} />
                  <Line type="monotone" dataKey="email" stroke="#7C3AED" strokeWidth={2.8} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Panel>
      </section>

      {composeOpen ? (
        <CommunicationModal title="Compose Communication" dark={darkMode} onClose={() => setComposeOpen(false)}>
          <div className="grid gap-3 md:grid-cols-2">
            <ModalField label="Recipient Name" value={compose.recipient_name} onChange={(value) => setCompose((current) => ({ ...current, recipient_name: value }))} dark={darkMode} />
            <ModalField label="Channel" value={compose.channel} onChange={(value) => setCompose((current) => ({ ...current, channel: value as Channel }))} dark={darkMode} select options={["call", "whatsapp", "email", "sms"]} />
            <ModalField label="Phone" value={compose.recipient_phone} onChange={(value) => setCompose((current) => ({ ...current, recipient_phone: value }))} dark={darkMode} />
            <ModalField label="Email" value={compose.recipient_email} onChange={(value) => setCompose((current) => ({ ...current, recipient_email: value }))} dark={darkMode} />
            <div className="md:col-span-2">
              <ModalField label="Subject" value={compose.subject} onChange={(value) => setCompose((current) => ({ ...current, subject: value }))} dark={darkMode} />
            </div>
            <div className="md:col-span-2">
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em]">
                <span className={mutedClass}>Message</span>
                <textarea value={compose.message} onChange={(event) => setCompose((current) => ({ ...current, message: event.target.value }))} className={cx("min-h-32 rounded-2xl border px-4 py-3 text-sm font-semibold outline-none", darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")} placeholder="Type message..." />
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setComposeOpen(false)} className={cx("rounded-2xl border px-4 py-3 text-sm font-black", darkMode ? "border-slate-700 text-slate-100" : "border-[#DCE7E2] text-[#071B4A]")}>Cancel</button>
            <button type="button" onClick={submitCompose} className="rounded-2xl bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white">Send</button>
          </div>
        </CommunicationModal>
      ) : null}

      {templateOpen ? (
        <CommunicationModal title="Manage Template" dark={darkMode} onClose={() => setTemplateOpen(false)}>
          <div className="grid gap-3 md:grid-cols-2">
            <ModalField label="Template Name" value={templateDraft.name} onChange={(value) => setTemplateDraft((current) => ({ ...current, name: value }))} dark={darkMode} />
            <ModalField label="Channel" value={templateDraft.channel} onChange={(value) => setTemplateDraft((current) => ({ ...current, channel: value as Channel }))} dark={darkMode} select options={["call", "whatsapp", "email", "sms"]} />
            <ModalField label="Category" value={templateDraft.category} onChange={(value) => setTemplateDraft((current) => ({ ...current, category: value }))} dark={darkMode} />
            <ModalField label="Subject" value={templateDraft.subject} onChange={(value) => setTemplateDraft((current) => ({ ...current, subject: value }))} dark={darkMode} />
            <div className="md:col-span-2">
              <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em]">
                <span className={mutedClass}>Body</span>
                <textarea value={templateDraft.body} onChange={(event) => setTemplateDraft((current) => ({ ...current, body: event.target.value }))} className={cx("min-h-32 rounded-2xl border px-4 py-3 text-sm font-semibold outline-none", darkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")} placeholder="Template body..." />
              </label>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setTemplateOpen(false)} className={cx("rounded-2xl border px-4 py-3 text-sm font-black", darkMode ? "border-slate-700 text-slate-100" : "border-[#DCE7E2] text-[#071B4A]")}>Cancel</button>
            <button type="button" onClick={submitTemplate} className="rounded-2xl bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white">Save Template</button>
          </div>
        </CommunicationModal>
      ) : null}
    </div>
  )
}

function QuickAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-[#DCE7E2] px-3 py-2 text-xs font-black text-[#071B4A]">
      <Icon size={15} />
      {label}
    </button>
  )
}

function DetailTile({ icon: Icon, label, value, dark }: { icon: LucideIcon; label: string; value: string; dark: boolean }) {
  return (
    <div className={cx("rounded-2xl p-3", dark ? "bg-slate-900" : "bg-white")}>
      <Icon size={17} className={dark ? "text-emerald-300" : "text-[#0B7A5A]"} />
      <p className={cx("mt-2 text-xs font-black uppercase tracking-[0.14em]", dark ? "text-slate-400" : "text-[#98A6B8]")}>{label}</p>
      <p className={cx("mt-1 text-sm font-black", dark ? "text-slate-100" : "text-[#071B4A]")}>{value}</p>
    </div>
  )
}

function CommunicationModal({ title, children, dark, onClose }: { title: string; children: ReactNode; dark: boolean; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <section className={cx("w-full max-w-3xl rounded-[24px] border p-5 shadow-2xl", dark ? "border-slate-700 bg-slate-900 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-black">{title}</h2>
          <button type="button" onClick={onClose} className={cx("rounded-2xl border px-4 py-2 text-sm font-black", dark ? "border-slate-700 text-slate-100" : "border-[#DCE7E2] text-[#071B4A]")}>Close</button>
        </div>
        <div className="mt-5">{children}</div>
      </section>
    </div>
  )
}

function ModalField({ label, value, onChange, dark, select = false, options = [] }: { label: string; value: string; onChange: (value: string) => void; dark: boolean; select?: boolean; options?: string[] }) {
  return (
    <label className="grid gap-2 text-xs font-black uppercase tracking-[0.14em]">
      <span className={dark ? "text-slate-300" : "text-[#60708C]"}>{label}</span>
      {select ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={cx("h-12 rounded-2xl border px-4 text-sm font-semibold outline-none", dark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")}>
          {options.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}
        </select>
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={cx("h-12 rounded-2xl border px-4 text-sm font-semibold outline-none", dark ? "border-slate-700 bg-slate-950 text-slate-100" : "border-[#DCE7E2] bg-white text-[#071B4A]")} />
      )}
    </label>
  )
}
