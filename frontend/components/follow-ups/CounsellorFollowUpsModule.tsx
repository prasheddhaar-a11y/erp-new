"use client"

import { Bell, CalendarClock, CheckCircle2, ChevronRight, Clock, Mail, MessageSquare, Phone, Plus, Search, UserRound, XCircle, type LucideIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { apiRequest } from "@/app/shared/api"

type FollowStatus = "today" | "upcoming" | "completed" | "overdue" | "missed"
type Priority = "High" | "Medium" | "Low"
type FollowUp = {
  id: string
  studentName: string
  course: string
  followUpAt: string
  communicationType: "Call" | "WhatsApp" | "Email" | "In-person"
  priority: Priority
  status: FollowStatus
  leadStatus: string
  counsellor: string
  notes: string
  history: string[]
}

const demoFollowUps: FollowUp[] = [
  { id: "FU-1001", studentName: "Meera Nair", course: "Full Stack Development", followUpAt: new Date().toISOString(), communicationType: "Call", priority: "High", status: "today", leadStatus: "New", counsellor: "Counsellor", notes: "Discuss weekend batch and fee options.", history: ["Lead created from website", "Welcome WhatsApp sent"] },
  { id: "FU-1002", studentName: "Arjun Menon", course: "Data Science", followUpAt: "2026-06-10T10:30:00", communicationType: "WhatsApp", priority: "Medium", status: "upcoming", leadStatus: "Contacted", counsellor: "Counsellor", notes: "Send syllabus and demo slot.", history: ["Phone call completed", "Asked for evening batch"] },
  { id: "FU-1003", studentName: "Fathima Roshni", course: "Digital Marketing", followUpAt: "2026-06-08T14:00:00", communicationType: "Email", priority: "High", status: "overdue", leadStatus: "Qualified", counsellor: "Counsellor", notes: "Demo confirmation pending.", history: ["Demo link shared", "No response after email"] },
  { id: "FU-1004", studentName: "Nikhil Varma", course: "Python Pro", followUpAt: "2026-06-07T16:15:00", communicationType: "Call", priority: "Low", status: "completed", leadStatus: "Follow up", counsellor: "Counsellor", notes: "Asked to reconnect next month.", history: ["Call completed", "Budget mismatch noted"] },
  { id: "FU-1005", studentName: "Ananya Krishnan", course: "UI/UX Design", followUpAt: "2026-06-06T11:00:00", communicationType: "In-person", priority: "Medium", status: "missed", leadStatus: "Lost", counsellor: "Counsellor", notes: "Missed campus visit.", history: ["Visit scheduled", "Reminder notification sent"] },
]

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

export function CounsellorFollowUpsModule() {
  const [items, setItems] = useState<FollowUp[]>(demoFollowUps)
  const [tab, setTab] = useState<"today" | "upcoming" | "completed" | "overdue">("today")
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState(demoFollowUps[0].id)
  const [showCreate, setShowCreate] = useState(false)
  const [notice, setNotice] = useState("")

  const counts = getCounts(items)
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    return items.filter((item) => item.status === tab).filter((item) => !text || `${item.studentName} ${item.course} ${item.communicationType} ${item.priority} ${item.leadStatus}`.toLowerCase().includes(text))
  }, [items, query, tab])
  const selected = items.find((item) => item.id === selectedId) || items[0]

  function updateItem(next: FollowUp, message: string) {
    setItems((current) => current.map((item) => item.id === next.id ? next : item))
    setSelectedId(next.id)
    setNotice(message)
  }

  async function createFollowUp(draft: Partial<FollowUp>) {
    const created: FollowUp = {
      id: `FU-${Date.now().toString().slice(-5)}`,
      studentName: draft.studentName || "New Lead",
      course: draft.course || "Course pending",
      followUpAt: draft.followUpAt || new Date().toISOString(),
      communicationType: draft.communicationType || "Call",
      priority: draft.priority || "Medium",
      status: "upcoming",
      leadStatus: draft.leadStatus || "New",
      counsellor: "Counsellor",
      notes: draft.notes || "",
      history: ["Follow-up created"],
    }
    setItems((current) => [created, ...current])
    setSelectedId(created.id)
    setShowCreate(false)
    setNotice("Follow-up created.")
    await apiRequest("/follow-ups", "", { method: "POST", body: JSON.stringify(created) }).catch(() => undefined)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-slate-500"><span>Counsellor</span><ChevronRight size={13} /><span>Follow Ups</span><ChevronRight size={13} /><span className="text-[#0B7A5A]">Task Center</span></div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Follow-Up Management</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">Modern CRM task center for reminders, notes, communication, and lead status updates.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-11 min-w-[280px] items-center gap-2 rounded-2xl border border-slate-200 px-3"><Search size={17} className="text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-bold outline-none" placeholder="Search follow-ups..." /></div>
            <button onClick={() => setShowCreate(true)} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[#0B7A5A] px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/20"><Plus size={17} /> New Follow-Up</button>
          </div>
        </div>
      </section>

      {notice ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">{notice}</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <FollowKpi label="Today's Follow-Ups" value={counts.today} icon={CalendarClock} tone="green" />
        <FollowKpi label="Upcoming Follow-Ups" value={counts.upcoming} icon={Clock} tone="blue" />
        <FollowKpi label="Overdue Follow-Ups" value={counts.overdue} icon={Bell} tone="amber" />
        <FollowKpi label="Completed Follow-Ups" value={counts.completed} icon={CheckCircle2} tone="violet" />
        <FollowKpi label="Missed Follow-Ups" value={counts.missed} icon={XCircle} tone="rose" />
      </div>

      <section className="rounded-[24px] border border-slate-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-4">{(["today", "upcoming", "completed", "overdue"] as const).map((key) => <button key={key} onClick={() => setTab(key)} className={cx("rounded-2xl px-4 py-3 text-sm font-black capitalize transition", tab === key ? "bg-[#E9F8F1] text-[#0B7A5A] ring-1 ring-emerald-100" : "text-slate-600 hover:bg-slate-50")}>{key}</button>)}</div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <FollowUpList items={filtered} selectedId={selectedId} onSelect={setSelectedId} />
        <FollowUpDetails item={selected} onUpdate={updateItem} />
      </section>

      {showCreate ? <FollowUpCreateDialog onClose={() => setShowCreate(false)} onSubmit={createFollowUp} /> : null}
    </div>
  )
}

function FollowKpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: "green" | "blue" | "amber" | "violet" | "rose" }) {
  const tones = { green: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700", rose: "bg-rose-50 text-rose-700" }
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"><div className={cx("grid h-11 w-11 place-items-center rounded-2xl", tones[tone])}><Icon size={20} /></div><p className="mt-4 text-3xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-500">{label}</p></div>
}

function FollowUpList({ items, selectedId, onSelect }: { items: FollowUp[]; selectedId: string; onSelect: (id: string) => void }) {
  return <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><h2 className="text-lg font-black">Follow-Up Queue</h2><p className="text-sm font-bold text-slate-500">Student, course, communication, priority, and current status.</p><div className="mt-4 grid gap-3">{items.map((item) => <button key={item.id} onClick={() => onSelect(item.id)} className={cx("grid gap-3 rounded-2xl border p-4 text-left transition md:grid-cols-[1.2fr_1fr_150px_120px]", selectedId === item.id ? "border-[#0B7A5A] bg-[#F2FBF7]" : "border-slate-200 bg-slate-50 hover:border-emerald-200")}><div><p className="font-black text-slate-950">{item.studentName}</p><p className="mt-1 text-sm font-bold text-slate-500">{item.course}</p></div><div><p className="text-xs font-black uppercase text-slate-400">Follow-up date</p><p className="mt-1 text-sm font-black">{formatDateTime(item.followUpAt)}</p></div><FollowBadge label={item.communicationType} /><PriorityBadge priority={item.priority} /></button>)}{!items.length ? <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-black text-slate-500">No follow-ups in this tab.</div> : null}</div></section>
}

function FollowUpDetails({ item, onUpdate }: { item: FollowUp; onUpdate: (item: FollowUp, message: string) => void }) {
  const [note, setNote] = useState("")
  if (!item) return null
  async function complete() {
    const updated = { ...item, status: "completed" as FollowStatus, history: [...item.history, "Follow-up completed"] }
    onUpdate(updated, "Follow-up completed.")
    await apiRequest(`/follow-ups/${item.id}/complete`, "", { method: "PATCH" }).catch(() => undefined)
  }
  async function scheduleNext() {
    const next = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const updated = { ...item, status: "upcoming" as FollowStatus, followUpAt: next, history: [...item.history, "Next follow-up scheduled"] }
    onUpdate(updated, "Next follow-up scheduled for tomorrow.")
    await apiRequest(`/follow-ups/${item.id}`, "", { method: "PATCH", body: JSON.stringify(updated) }).catch(() => undefined)
  }
  function addNote() {
    if (!note.trim()) return
    onUpdate({ ...item, notes: `${item.notes}\n[${new Date().toLocaleString("en-IN")}] ${note.trim()}`.trim(), history: [...item.history, "Counsellor note added"] }, "Note added.")
    setNote("")
  }
  return <aside className="space-y-4"><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B7A5A]">Follow-Up Detail</p><h2 className="mt-1 text-2xl font-black text-slate-950">{item.studentName}</h2><p className="mt-1 text-sm font-bold text-slate-500">{item.course}</p></div><PriorityBadge priority={item.priority} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><DetailTile icon={CalendarClock} label="Follow-up" value={formatDateTime(item.followUpAt)} /><DetailTile icon={MessageSquare} label="Communication" value={item.communicationType} /><DetailTile icon={UserRound} label="Lead Status" value={item.leadStatus} /><DetailTile icon={Bell} label="Reminder" value="Notification enabled" /></div><div className="mt-5 flex flex-wrap gap-2"><QuickAction icon={Phone} label="Call" /><QuickAction icon={MessageSquare} label="WhatsApp" /><QuickAction icon={Mail} label="Email" /><button onClick={complete} className="rounded-xl bg-[#0B7A5A] px-3 py-2 text-xs font-black text-white">Complete</button><button onClick={scheduleNext} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black">Schedule Next</button></div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Notes</h3><textarea value={note} onChange={(event) => setNote(event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-bold outline-none focus:border-[#0B7A5A]" placeholder="Add follow-up note..." /><button onClick={addNote} className="mt-3 rounded-xl bg-[#0B7A5A] px-4 py-2 text-sm font-black text-white">Add Note</button><div className="mt-4 whitespace-pre-wrap rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-600">{item.notes}</div></section><section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-black">Communication History</h3>{item.history.map((row, index) => <div key={`${item.id}-${index}`} className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">{row}</div>)}</section></aside>
}

function FollowUpCreateDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (draft: Partial<FollowUp>) => void }) {
  const [draft, setDraft] = useState<Partial<FollowUp>>({ communicationType: "Call", priority: "Medium", leadStatus: "New" })
  function update(key: keyof FollowUp, value: string) { setDraft((current) => ({ ...current, [key]: value })) }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><section className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-2xl font-black">Create Follow-Up</h2><button onClick={onClose} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-black">Close</button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><FormInput label="Student Name" value={draft.studentName || ""} onChange={(v) => update("studentName", v)} /><FormInput label="Course" value={draft.course || ""} onChange={(v) => update("course", v)} /><FormInput label="Follow-Up Date" type="datetime-local" value={(draft.followUpAt || "").slice(0, 16)} onChange={(v) => update("followUpAt", v)} /><FormSelect label="Communication" value={draft.communicationType || "Call"} options={["Call", "WhatsApp", "Email", "In-person"]} onChange={(v) => update("communicationType", v)} /><FormSelect label="Priority" value={draft.priority || "Medium"} options={["High", "Medium", "Low"]} onChange={(v) => update("priority", v)} /><FormInput label="Lead Status" value={draft.leadStatus || "New"} onChange={(v) => update("leadStatus", v)} /></div><textarea value={draft.notes || ""} onChange={(event) => update("notes", event.target.value)} className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-bold outline-none" placeholder="Notes" /><button onClick={() => onSubmit(draft)} className="mt-4 w-full rounded-2xl bg-[#0B7A5A] px-5 py-3 text-sm font-black text-white">Create Follow-Up</button></section></div>
}

function DetailTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="rounded-2xl bg-slate-50 p-3"><Icon size={17} className="text-[#0B7A5A]" /><p className="mt-2 text-xs font-black uppercase text-slate-400">{label}</p><p className="mt-1 text-sm font-black text-slate-800">{value}</p></div>
}
function QuickAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) { return <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black"><Icon size={15} />{label}</button> }
function FollowBadge({ label }: { label: string }) { return <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200">{label}</span> }
function PriorityBadge({ priority }: { priority: Priority }) { const c = priority === "High" ? "bg-rose-50 text-rose-700 ring-rose-200" : priority === "Medium" ? "bg-amber-50 text-amber-700 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"; return <span className={cx("inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-black ring-1", c)}>{priority}</span> }
function FormInput({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="grid gap-2 text-xs font-black uppercase text-slate-500">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-3 text-sm font-bold normal-case outline-none focus:border-[#0B7A5A]" /></label> }
function FormSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <label className="grid gap-2 text-xs font-black uppercase text-slate-500">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-3 text-sm font-bold normal-case outline-none focus:border-[#0B7A5A]">{options.map((option) => <option key={option}>{option}</option>)}</select></label> }
function getCounts(items: FollowUp[]) { return { today: items.filter((i) => i.status === "today").length, upcoming: items.filter((i) => i.status === "upcoming").length, overdue: items.filter((i) => i.status === "overdue").length, completed: items.filter((i) => i.status === "completed").length, missed: items.filter((i) => i.status === "missed").length } }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) }
