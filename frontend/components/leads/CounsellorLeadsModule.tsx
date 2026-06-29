"use client"

import {
  Bell,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  Filter,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  UserCheck,
  UserRound,
  XCircle,
  type LucideIcon,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { apiRequest } from "@/app/shared/api"

type LeadStatus = "new" | "contacted" | "qualified" | "lost" | "follow_up" | "converted"
type LeadRecord = {
  id: string
  student_name: string
  parent_name?: string | null
  phone: string
  email?: string | null
  course_interest?: string | null
  source: string
  status: LeadStatus
  score: number
  branch_id?: string | null
  counsellor_id?: string | null
  next_follow_up_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

type Filters = {
  course: string
  source: string
  status: string
  branch: string
  counsellor: string
  from: string
  to: string
}

const demoLeads: LeadRecord[] = [
  { id: "lead-1001", student_name: "Meera Nair", phone: "+91 98765 43210", email: "meera@example.com", course_interest: "Full Stack Development", source: "website", status: "new", score: 82, branch_id: "Kochi", counsellor_id: "Counsellor", next_follow_up_at: new Date().toISOString(), notes: "Asked for weekend batch details.", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "lead-1002", student_name: "Arjun Menon", phone: "+91 98470 11520", email: "arjun@example.com", course_interest: "Data Science", source: "whatsapp", status: "contacted", score: 68, branch_id: "Madurai", counsellor_id: "Counsellor", next_follow_up_at: "2026-06-10T10:30:00", notes: "Call after office hours.", created_at: "2026-06-08T09:30:00", updated_at: "2026-06-08T10:30:00" },
  { id: "lead-1003", student_name: "Fathima Roshni", phone: "+91 90123 45678", email: "fathima@example.com", course_interest: "Digital Marketing", source: "referral", status: "qualified", score: 91, branch_id: "Chennai", counsellor_id: "Counsellor", next_follow_up_at: "2026-06-11T14:00:00", notes: "Ready for demo class.", created_at: "2026-06-07T11:00:00", updated_at: "2026-06-08T08:00:00" },
  { id: "lead-1004", student_name: "Nikhil Varma", phone: "+91 94460 32145", email: "nikhil@example.com", course_interest: "Python Pro", source: "facebook", status: "lost", score: 44, branch_id: "Coimbatore", counsellor_id: "Counsellor", next_follow_up_at: null, notes: "Budget mismatch.", created_at: "2026-06-05T12:30:00", updated_at: "2026-06-06T16:15:00" },
]

const emptyFilters: Filters = { course: "All", source: "All", status: "All", branch: "All", counsellor: "All", from: "", to: "" }
const courses = ["All", "Full Stack Development", "Data Science", "Digital Marketing", "Python Pro", "MERN Stack"]
const sources = ["All", "website", "whatsapp", "walk-in", "facebook", "referral"]
const statuses = ["All", "new", "contacted", "qualified", "lost", "follow_up", "converted"]
const branches = ["All", "Kochi", "Madurai", "Chennai", "Coimbatore"]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function CounsellorLeadsModule() {
  const [leads, setLeads] = useState<LeadRecord[]>(demoLeads)
  const [selectedId, setSelectedId] = useState(demoLeads[0].id)
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>(emptyFilters)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState("")

  useEffect(() => {
    let mounted = true
    async function loadLeads() {
      setLoading(true)
      try {
        const data = await apiRequest<LeadRecord[]>("/crm/leads", "")
        if (mounted && Array.isArray(data) && data.length) {
          setLeads(data.map((lead) => ({ ...lead, status: normalizeStatus(lead.status) })))
          setSelectedId(data[0].id)
        }
      } catch (error) {
        setNotice(error instanceof Error ? `Live CRM leads unavailable. Showing saved demo leads. ${error.message}` : "Live CRM leads unavailable. Showing saved demo leads.")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadLeads()
    return () => { mounted = false }
  }, [])

  const filteredLeads = useMemo(() => {
    const text = query.trim().toLowerCase()
    return leads.filter((lead) => {
      const created = lead.created_at?.slice(0, 10) || ""
      return (!text || `${lead.student_name} ${lead.phone} ${lead.email} ${lead.course_interest} ${lead.source}`.toLowerCase().includes(text))
        && (filters.course === "All" || lead.course_interest === filters.course)
        && (filters.source === "All" || lead.source === filters.source)
        && (filters.status === "All" || lead.status === filters.status)
        && (filters.branch === "All" || lead.branch_id === filters.branch)
        && (filters.counsellor === "All" || lead.counsellor_id === filters.counsellor)
        && (!filters.from || created >= filters.from)
        && (!filters.to || created <= filters.to)
    })
  }, [filters, leads, query])

  const selectedLead = leads.find((lead) => lead.id === selectedId) || leads[0]
  const counts = getLeadCounts(leads)

  function updateLead(updated: LeadRecord, message: string) {
    setLeads((current) => current.map((lead) => lead.id === updated.id ? updated : lead))
    setSelectedId(updated.id)
    setNotice(message)
  }

  async function createLead(draft: Partial<LeadRecord>) {
    const body = {
      student_name: draft.student_name || "",
      phone: draft.phone || "",
      email: draft.email || null,
      course_interest: draft.course_interest || null,
      source: draft.source || "website",
      status: "new",
      score: Number(draft.score || 50),
      branch_id: draft.branch_id || null,
      next_follow_up_at: draft.next_follow_up_at || null,
      notes: draft.notes || null,
    }
    try {
      const created = await apiRequest<LeadRecord>("/crm/leads", "", { method: "POST", body: JSON.stringify(body) })
      setLeads((current) => [{ ...created, status: normalizeStatus(created.status) }, ...current])
      setSelectedId(created.id)
      setShowCreate(false)
      setNotice("Lead created successfully.")
    } catch {
      const created: LeadRecord = { ...body, id: `lead-${Date.now()}`, status: "new", created_at: new Date().toISOString(), updated_at: new Date().toISOString(), parent_name: null, counsellor_id: "Counsellor" } as LeadRecord
      setLeads((current) => [created, ...current])
      setSelectedId(created.id)
      setShowCreate(false)
      setNotice("Lead created locally. Backend sync unavailable.")
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-slate-500"><span>Counsellor</span><ChevronRight size={13} /><span>Leads</span><ChevronRight size={13} /><span className="text-[#0B7A5A]">Lead Dashboard</span></div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">CRM Leads Management</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">HubSpot-style lead pipeline for counsellor follow-ups, scoring, and conversion.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-11 min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3"><Search size={17} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Search leads..." /></div>
            <button onClick={() => exportLeads(filteredLeads)} className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-black"><Download size={16} /> Export</button>
            <button onClick={() => setShowCreate(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/20"><Plus size={17} /> New Lead</button>
          </div>
        </div>
      </section>

      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">{notice}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <LeadKpi label="Total Leads" value={leads.length} icon={ClipboardList} tone="blue" />
        <LeadKpi label="New Leads" value={counts.new} icon={Sparkles} tone="green" />
        <LeadKpi label="Contacted Leads" value={counts.contacted} icon={Phone} tone="amber" />
        <LeadKpi label="Qualified Leads" value={counts.qualified} icon={UserCheck} tone="violet" />
        <LeadKpi label="Lost Leads" value={counts.lost} icon={XCircle} tone="rose" />
        <LeadKpi label="Today's Leads" value={counts.today} icon={CalendarClock} tone="green" />
      </div>

      <LeadFilters filters={filters} onChange={setFilters} counsellors={["All", ...Array.from(new Set(leads.map((lead) => lead.counsellor_id || "Unassigned")))]} />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LeadTable leads={filteredLeads} loading={loading} onSelect={setSelectedId} selectedId={selectedId} />
        <LeadDetails lead={selectedLead} onUpdate={updateLead} />
      </section>

      {showCreate ? <LeadCreateDialog onClose={() => setShowCreate(false)} onSubmit={createLead} /> : null}
    </div>
  )
}

function LeadKpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "blue" | "green" | "amber" | "violet" | "rose" }) {
  const tones = { blue: "bg-blue-50 text-blue-700", green: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700", rose: "bg-rose-50 text-rose-700" }
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className={cx("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}><Icon size={20} /></div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></div>
}

function LeadFilters({ filters, onChange, counsellors }: { filters: Filters; onChange: (filters: Filters) => void; counsellors: string[] }) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 font-black text-slate-950"><Filter size={17} /> Advanced Filters</div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-7">
        <FilterSelect label="Course" value={filters.course} options={courses} onChange={(course) => onChange({ ...filters, course })} />
        <FilterSelect label="Lead Source" value={filters.source} options={sources} onChange={(source) => onChange({ ...filters, source })} />
        <FilterSelect label="Status" value={filters.status} options={statuses} onChange={(status) => onChange({ ...filters, status })} />
        <FilterSelect label="Branch" value={filters.branch} options={branches} onChange={(branch) => onChange({ ...filters, branch })} />
        <FilterSelect label="Counsellor" value={filters.counsellor} options={counsellors} onChange={(counsellor) => onChange({ ...filters, counsellor })} />
        <FilterInput label="From" type="date" value={filters.from} onChange={(from) => onChange({ ...filters, from })} />
        <FilterInput label="To" type="date" value={filters.to} onChange={(to) => onChange({ ...filters, to })} />
      </div>
    </section>
  )
}

function LeadTable({ leads, loading, selectedId, onSelect }: { leads: LeadRecord[]; loading: boolean; selectedId: string; onSelect: (id: string) => void }) {
  if (loading) return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="h-72 animate-pulse rounded-2xl bg-slate-100" /></div>
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4"><h2 className="text-lg font-black">Lead Pipeline</h2><p className="text-sm font-bold text-slate-500">Large dataset ready table with quick status badges and actions.</p></div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.14em] text-slate-400"><tr>{["Lead Name", "Phone Number", "Interested Course", "Lead Source", "Status", "Assigned Counsellor", "Next Follow-Up Date", "Actions"].map((head) => <th key={head} className="px-3 py-2 font-black">{head}</th>)}</tr></thead>
          <tbody>
            {leads.map((lead) => <tr key={lead.id} className={cx("bg-slate-50 font-bold text-slate-700", selectedId === lead.id && "ring-2 ring-emerald-200")}><td className="rounded-l-2xl px-3 py-4 font-black text-slate-950">{lead.student_name}<p className="text-xs font-bold text-slate-400">{lead.email || "No email"}</p></td><td className="px-3 py-4">{lead.phone}</td><td className="px-3 py-4">{lead.course_interest || "Pending"}</td><td className="px-3 py-4 capitalize">{lead.source}</td><td className="px-3 py-4"><LeadStatusBadge status={lead.status} /></td><td className="px-3 py-4">{lead.counsellor_id || "Unassigned"}</td><td className="px-3 py-4">{lead.next_follow_up_at ? formatDateTime(lead.next_follow_up_at) : "Not scheduled"}</td><td className="rounded-r-2xl px-3 py-4"><button onClick={() => onSelect(lead.id)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black"><Eye size={15} /> View</button></td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function LeadDetails({ lead, onUpdate }: { lead: LeadRecord; onUpdate: (lead: LeadRecord, message: string) => void }) {
  const [note, setNote] = useState("")
  if (!lead) return null

  async function changeStatus(status: LeadStatus) {
    const updated = { ...lead, status, updated_at: new Date().toISOString() }
    onUpdate(updated, `Lead status changed to ${status.replace("_", " ")}.`)
    if (isBackendId(lead.id)) await apiRequest(`/crm/leads/${lead.id}/status`, "", { method: "PATCH", body: JSON.stringify({ status }) }).catch(() => undefined)
  }

  async function assignLead() {
    const updated = { ...lead, counsellor_id: "Counsellor", updated_at: new Date().toISOString() }
    onUpdate(updated, "Lead assigned to counsellor.")
    if (isBackendId(lead.id)) await apiRequest(`/crm/leads/${lead.id}/assign`, "", { method: "PATCH", body: JSON.stringify({ counsellor_id: null }) }).catch(() => undefined)
  }

  async function addNote() {
    if (!note.trim()) return
    const stamped = `[${new Date().toLocaleString("en-IN")}] ${note.trim()}`
    const updated = { ...lead, notes: lead.notes ? `${lead.notes}\n${stamped}` : stamped, updated_at: new Date().toISOString() }
    onUpdate(updated, "Lead note added.")
    setNote("")
    if (isBackendId(lead.id)) await apiRequest(`/crm/leads/${lead.id}/notes`, "", { method: "POST", body: JSON.stringify({ note: note.trim() }) }).catch(() => undefined)
  }

  return (
    <aside className="space-y-4">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B7A5A]">Lead Detail</p><h2 className="mt-1 text-2xl font-black text-slate-950">{lead.student_name}</h2><p className="mt-1 text-sm font-bold text-slate-500">{lead.course_interest || "No course selected"}</p></div><LeadStatusBadge status={lead.status} /></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2"><DetailTile icon={Phone} label="Phone" value={lead.phone} /><DetailTile icon={Mail} label="Email" value={lead.email || "-"} /><DetailTile icon={Target} label="Lead Score" value={`${lead.score}/100`} /><DetailTile icon={CalendarClock} label="Next Follow-Up" value={lead.next_follow_up_at ? formatDateTime(lead.next_follow_up_at) : "Not scheduled"} /></div>
        <div className="mt-5 flex flex-wrap gap-2"><QuickButton icon={Phone} label="Call" /><QuickButton icon={MessageSquare} label="WhatsApp" /><QuickButton icon={Mail} label="Email" /><button onClick={assignLead} className="rounded-xl bg-[#0B7A5A] px-3 py-2 text-xs font-black text-white">Assign Lead</button></div>
      </section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Change Status</h3><div className="mt-3 flex flex-wrap gap-2">{(["new", "contacted", "qualified", "follow_up", "lost", "converted"] as LeadStatus[]).map((status) => <button key={status} onClick={() => changeStatus(status)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black capitalize hover:border-[#0B7A5A] hover:text-[#0B7A5A]">{status.replace("_", " ")}</button>)}</div></section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Notes</h3><textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-[#0B7A5A]" placeholder="Add counsellor note..." /><button onClick={addNote} className="mt-3 rounded-xl bg-[#0B7A5A] px-4 py-2 text-sm font-black text-white">Add Note</button><div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-600">{lead.notes || "No notes yet."}</div></section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Activity Timeline</h3>{["Lead created", `Status: ${lead.status.replace("_", " ")}`, lead.next_follow_up_at ? "Follow-up scheduled" : "Follow-up pending"].map((item) => <div key={item} className="mt-4 flex gap-3 text-sm font-bold text-slate-600"><span className="mt-1 h-2 w-2 rounded-full bg-[#0B7A5A]" />{item}</div>)}</section>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Communication History</h3>{["Phone call logged", "WhatsApp template ready", "Email follow-up pending"].map((item) => <div key={item} className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">{item}</div>)}</section>
    </aside>
  )
}

function LeadCreateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (draft: Partial<LeadRecord>) => void }) {
  const [draft, setDraft] = useState<Partial<LeadRecord>>({ source: "website", status: "new", score: 50 })
  function update(key: keyof LeadRecord, value: string | number) { setDraft((current) => ({ ...current, [key]: value })) }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><section className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Create Lead</h2><button onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black">Close</button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><FormInput label="Lead Name" value={draft.student_name || ""} onChange={(v) => update("student_name", v)} /><FormInput label="Phone Number" value={draft.phone || ""} onChange={(v) => update("phone", v)} /><FormInput label="Email" value={draft.email || ""} onChange={(v) => update("email", v)} /><FormSelect label="Course" value={draft.course_interest || ""} options={courses.slice(1)} onChange={(v) => update("course_interest", v)} /><FormSelect label="Lead Source" value={draft.source || "website"} options={sources.slice(1)} onChange={(v) => update("source", v)} /><FormSelect label="Branch" value={draft.branch_id || ""} options={branches.slice(1)} onChange={(v) => update("branch_id", v)} /><FormInput label="Next Follow-Up" type="datetime-local" value={(draft.next_follow_up_at || "").slice(0, 16)} onChange={(v) => update("next_follow_up_at", v)} /><FormInput label="Lead Score" type="number" value={String(draft.score || 50)} onChange={(v) => update("score", Number(v))} /></div><textarea value={draft.notes || ""} onChange={(event) => update("notes", event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-bold outline-none" placeholder="Notes" /><button onClick={() => onSubmit(draft)} className="mt-4 w-full rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Create Lead</button></section></div>
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-black uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case outline-none">{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}

function FilterInput({ label, type, value, onChange }: { label: string; type: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs font-black uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold normal-case outline-none" /></label>
}

function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <label className="grid gap-2 text-xs font-black uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-3 text-sm font-bold normal-case outline-none focus:border-[#0B7A5A]" /></label>
}

function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-xs font-black uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-3 text-sm font-bold normal-case outline-none focus:border-[#0B7A5A]"><option value="">Select</option>{options.map((option) => <option key={option}>{option}</option>)}</select></label>
}

function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const classes: Record<LeadStatus, string> = { new: "bg-emerald-50 text-emerald-700 ring-emerald-200", contacted: "bg-blue-50 text-blue-700 ring-blue-200", qualified: "bg-violet-50 text-violet-700 ring-violet-200", lost: "bg-rose-50 text-rose-700 ring-rose-200", follow_up: "bg-amber-50 text-amber-700 ring-amber-200", converted: "bg-slate-100 text-slate-700 ring-slate-200" }
  return <span className={cx("inline-flex rounded-full px-3 py-1 text-xs font-black capitalize ring-1", classes[status])}>{status.replace("_", " ")}</span>
}

function DetailTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><Icon size={17} className="text-[#0B7A5A]" /><p className="mt-2 text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-800">{value}</p></div>
}

function QuickButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"><Icon size={15} />{label}</button>
}

function normalizeStatus(status: string): LeadStatus {
  if (["new", "contacted", "qualified", "lost", "follow_up", "converted"].includes(status)) return status as LeadStatus
  if (status === "enrolled") return "converted"
  return "new"
}

function getLeadCounts(leads: LeadRecord[]) {
  const today = new Date().toISOString().slice(0, 10)
  return {
    new: leads.filter((lead) => lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    qualified: leads.filter((lead) => lead.status === "qualified").length,
    lost: leads.filter((lead) => lead.status === "lost").length,
    today: leads.filter((lead) => lead.created_at?.slice(0, 10) === today).length,
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function isBackendId(id: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

function exportLeads(leads: LeadRecord[]) {
  const headers = ["Lead Name", "Phone Number", "Interested Course", "Lead Source", "Status", "Assigned Counsellor", "Next Follow-Up Date"]
  const rows = leads.map((lead) => [lead.student_name, lead.phone, lead.course_interest || "", lead.source, lead.status, lead.counsellor_id || "", lead.next_follow_up_at || ""])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "crm-leads.csv"
  link.click()
  URL.revokeObjectURL(url)
}
