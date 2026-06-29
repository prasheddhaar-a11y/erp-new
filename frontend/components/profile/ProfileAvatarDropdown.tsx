/* =====================================================
PINESPHERE ERP
Module      : Profile Module
Component   : Profile Avatar Dropdown
Purpose     : Renders and coordinates Profile Avatar Dropdown UI behavior
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
   PURPOSE:
   This section loads external libraries, framework tools, and local helpers.
   Keeping imports together makes dependencies easy to review.
===================================================== */

import { Bell, Check, Globe2, LogOut, Settings, UserRound } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"

import { API_URL, clearStoredSession, getStoredSessionValue } from "@/app/shared/api"
import { clearAuthSession } from "@/app/shared/auth"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export type ProfileDropdownUser = {
  id?: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  role?: string | null
  profile_photo?: string | null
}

type ProfileAvatarDropdownProps = {
  user?: ProfileDropdownUser | null
  className?: string
  compact?: boolean
  isHydrated?: boolean
}

const ROLE_FALLBACK_INITIALS: Record<string, string> = {
  super_admin: "SA",
  branch_admin: "BA",
  counsellor: "CL",
  trainer: "TR",
  parent: "PA",
  student: "ST",
  hr: "HR",
  finance: "FN",
  franchise_owner: "FO",
  company_hr: "CH",
  public: "PB",
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function readStoredProfile(): ProfileDropdownUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem("pinesphere_profile")
    ?? window.sessionStorage.getItem("pinesphere_profile")
    ?? window.localStorage.getItem("pinesphere_user")
    ?? window.sessionStorage.getItem("pinesphere_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProfileDropdownUser
  } catch {
    return null
  }
}

export function getProfileInitials(name?: string | null, email?: string | null, role?: string | null) {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  if (role && ROLE_FALLBACK_INITIALS[role]) return ROLE_FALLBACK_INITIALS[role]
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (email ?? "PS").slice(0, 2).toUpperCase()
}

export function ProfileAvatarDropdown({ user, className = "", compact = false, isHydrated }: ProfileAvatarDropdownProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [open, setOpen] = useState(false)
  const [storedUser, setStoredUser] = useState<ProfileDropdownUser | null>(null)
  const [internalHydrated, setInternalHydrated] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    setInternalHydrated(true)
    setStoredUser(readStoredProfile())

    /* =====================================================
       SECTION: EVENT HANDLERS
       PURPOSE:
       This section responds to user actions such as clicks, typing, and form submission.
       Handlers connect interface events to state updates or API calls.
    ===================================================== */

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  const hydrated = isHydrated ?? internalHydrated
  const currentUser = hydrated ? user ?? storedUser : null
  const initials = useMemo(
    () => hydrated ? getProfileInitials(currentUser?.full_name, currentUser?.email, currentUser?.role) : "PS",
    [currentUser?.email, currentUser?.full_name, currentUser?.role, hydrated],
  )
  const fullName = currentUser?.full_name || "Pinesphere User"
  const email = currentUser?.email || "Signed in"
  const roleLabel = currentUser?.role?.replaceAll("_", " ") || "Account"

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    const accessToken = getStoredSessionValue("pinesphere_access_token")
    const refreshToken = getStoredSessionValue("pinesphere_refresh_token")
    clearAuthSession()
    clearStoredSession()
    window.location.href = "/login"
    if (accessToken && refreshToken) {
      const controller = new AbortController()
      window.setTimeout(() => controller.abort(), 1500)
      void fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
        signal: controller.signal,
      }).catch(() => undefined)
    }
  }

  function openPanel(nextPanel: "profile" | "settings") {
    setOpen(false)
    window.dispatchEvent(new CustomEvent("pinesphere:open-account-panel", { detail: { mode: nextPanel } }))
  }

  return (
    <div ref={containerRef} className={`relative z-30 ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-[var(--pinesphere-green-border)] bg-white/95 p-1 shadow-sm transition hover:border-[var(--pinesphere-green)] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pinesphere-green)]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--pinesphere-green-light)] text-sm font-black text-[var(--pinesphere-green)] ring-1 ring-[var(--pinesphere-green-border)]">
          {hydrated && currentUser?.profile_photo ? (
            <Image src={currentUser.profile_photo} alt={fullName} width={44} height={44} unoptimized className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        {!compact ? (
          <span className="hidden min-w-0 pr-2 text-left md:block">
            <span className="block max-w-[150px] truncate text-sm font-black text-[#17210f]">{fullName}</span>
            <span className="block max-w-[150px] truncate text-xs font-semibold text-[#64748b]">{roleLabel}</span>
          </span>
        ) : null}
      </button>

      <div
        role="menu"
        className={`absolute right-0 top-[calc(100%+6px)] z-30 isolate h-auto w-[min(300px,calc(100vw-1.5rem))] origin-top-right rounded-xl border border-[#dce8d4]/90 bg-white/95 p-2.5 text-[#17210f] shadow-[0_16px_38px_rgba(15,23,42,0.18)] backdrop-blur-md transition duration-150 ${open ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"}`}
      >
        <span className="pointer-events-none absolute -top-2 right-[18px] z-0 h-4 w-4 rotate-45 border-l border-t border-[#dce8d4]/90 bg-white/95" />
        <div className="relative z-10 flex min-w-0 items-center gap-3 border-b border-[#edf3e8] px-2 pb-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--pinesphere-green-light)] text-xs font-black text-[var(--pinesphere-green)] ring-1 ring-[var(--pinesphere-green-border)]">
            {hydrated && currentUser?.profile_photo ? (
              <Image src={currentUser.profile_photo} alt="" width={44} height={44} unoptimized className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-black">{fullName}</p>
            <p className="mt-1 truncate text-xs font-semibold text-[#64748b]">{email}</p>
            <p className="mt-1 truncate text-xs font-black capitalize text-[var(--pinesphere-green)]">{roleLabel}</p>
          </div>
        </div>
        <div className="relative z-10 mt-1.5 grid gap-0.5">
          <button type="button" role="menuitem" onClick={() => openPanel("profile")} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[#1f2b18] transition hover:bg-[#f2faee]">
            <UserRound size={16} />
            My Profile
          </button>
          <button type="button" role="menuitem" onClick={() => openPanel("settings")} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[#1f2b18] transition hover:bg-[#f2faee]">
            <Settings size={16} />
            Settings
          </button>
          <button type="button" role="menuitem" onClick={() => void logout()} disabled={loggingOut} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-[#b42318] transition hover:bg-[#fff1f0] disabled:cursor-wait disabled:opacity-60">
            <LogOut size={16} />
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </div>
  )
}

function InlineAccountPanel({ mode, user, initials, onClose }: { mode: "profile" | "settings"; user?: ProfileDropdownUser | null; initials: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">(mode === "settings" ? "preferences" : "profile")
  const fullName = user?.full_name || "Pinesphere User"
  const roleLabel = user?.role?.replaceAll("_", " ") || "Account"

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-slate-950/30 p-4 pt-20 backdrop-blur-sm">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#dce8d4] bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-[#edf3e8] p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-[var(--pinesphere-green-light)] text-sm font-black text-[var(--pinesphere-green)] ring-1 ring-[var(--pinesphere-green-border)]">{initials}</span>
            <div>
              <p className="text-lg font-black text-[#17210f]">{activeTab === "profile" ? "My Profile" : "Preferences"}</p>
              <p className="text-sm font-semibold capitalize text-[#64748b]">{fullName} - {roleLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg border border-[#dce8d4] px-3 py-2 text-sm font-black text-[#17210f] hover:bg-[#f2faee]">Close</button>
        </header>

        <div className="border-b border-[#edf3e8] p-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab("profile")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${activeTab === "profile" ? "bg-[#0B7A5A] text-white" : "bg-[#f7fbf4] text-[#1f2b18]"}`}><UserRound size={16} /> Profile</button>
            <button onClick={() => setActiveTab("preferences")} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black ${activeTab === "preferences" ? "bg-[#0B7A5A] text-white" : "bg-[#f7fbf4] text-[#1f2b18]"}`}><Settings size={16} /> Preferences</button>
          </div>
        </div>

        <div className="max-h-[68vh] overflow-y-auto p-5">
          {activeTab === "profile" ? <InlineProfile user={user} /> : <InlinePreferences />}
        </div>
      </section>
    </div>
  )
}

function InlineProfile({ user }: { user?: ProfileDropdownUser | null }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ReadOnlyField label="Student/User Name" value={user?.full_name || "Counsellor"} />
      <ReadOnlyField label="Username" value={user?.email?.split("@")[0] || "counsellor"} />
      <ReadOnlyField label="Email" value={user?.email || "counsellor@pinesphere.com"} />
      <ReadOnlyField label="Role" value={user?.role?.replaceAll("_", " ") || "Counsellor"} />
      <ReadOnlyField label="Phone" value={user?.phone || "Not added"} />
      <ReadOnlyField label="Branch" value="Pinesphere Branch" />
    </div>
  )
}

function InlinePreferences() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#dce8d4] p-4">
        <div className="mb-3 flex items-center gap-2 font-black"><Globe2 size={17} className="text-[#0B7A5A]" /> Timezone</div>
        <select className="h-11 w-full rounded-lg border border-[#bfe4d5] bg-white px-3 text-sm font-bold outline-none"><option>Asia/Kolkata</option></select>
      </div>
      <div className="rounded-xl border border-[#dce8d4] p-4">
        <div className="mb-3 flex items-center gap-2 font-black"><Bell size={17} className="text-[#0B7A5A]" /> Notification Settings</div>
        <div className="grid gap-3 md:grid-cols-2">
          {["Session reminder 1 hour before", "Session reminder 1 day before", "Session start notification", "Promotional campaigns"].map((item, index) => <ToggleRow key={item} label={item} enabled={index !== 3} />)}
        </div>
      </div>
      <div className="rounded-xl border border-[#dce8d4] p-4">
        <p className="mb-3 font-black">Notification Channels</p>
        <div className="grid gap-3 md:grid-cols-2">
          {["WhatsApp", "Email", "SMS", "Push"].map((item, index) => <ToggleRow key={item} label={item} enabled={index !== 2} />)}
        </div>
      </div>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <label className="grid gap-2 text-xs font-black uppercase text-[#415038]">{label}<input readOnly value={value} className="h-11 rounded-lg border border-[#bfe4d5] bg-[#fbfdf9] px-3 text-sm font-bold normal-case outline-none" /></label>
}

function ToggleRow({ label, enabled }: { label: string; enabled: boolean }) {
  return <div className="flex items-center justify-between rounded-lg border border-[#e2eedc] bg-[#fbfdf9] px-3 py-3 text-sm font-bold"><span>{label}</span><span className={`grid h-7 w-12 place-items-center rounded-full ${enabled ? "bg-[#0B7A5A] text-white" : "bg-[#c8d4c1] text-white"}`}>{enabled ? <Check size={15} /> : null}</span></div>
}
