/* =====================================================
PINESPHERE ERP
Module      : Settings Module
Component   : Layout
Purpose     : Renders and coordinates Layout UI behavior
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

import {
  Award,
  Bell,
  BookOpen,
  CircleHelp,
  ClipboardList,
  Home,
  Megaphone,
  Search,
  Settings,
  /* =====================================================
     SECTION: TYPES AND INTERFACES
     PURPOSE:
     This section describes the shape of data used by the code.
     Clear types make component props, API payloads, and state easier to understand.
  ===================================================== */

  type LucideIcon,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { API_URL, getStoredSessionValue, storeSessionValue } from "@/app/shared/api"
import { ProfileAvatarDropdown, getProfileInitials, type ProfileDropdownUser } from "@/components/profile/ProfileAvatarDropdown"

const navLinks = ["Explore Programs", "Events", "Placement Portal"]

const sidebarItems: Array<{ label: string; icon: LucideIcon; count?: number; href: string }> = [
  { label: "Dashboard", icon: Home, href: "/student/dashboard" },
  { label: "My Courses", icon: BookOpen, href: "#" },
  { label: "Assignments", icon: ClipboardList, count: 3, href: "#" },
  { label: "Certificates", icon: Award, href: "#" },
  { label: "Placement", icon: Megaphone, href: "#" },
  { label: "Settings", icon: Settings, href: "/settings/profile" },
  { label: "Help & Support", icon: CircleHelp, href: "#" },
]

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function readCachedProfile(): ProfileDropdownUser | null {
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

export default function SettingsDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileDropdownUser | null>(null)

  useEffect(() => {
    let alive = true

    async function loadProfile() {
      const accessToken = getStoredSessionValue("pinesphere_access_token")
      if (!accessToken) {
        window.location.href = "/login"
        return
      }

      const cached = readCachedProfile()
      if (cached && alive) setProfile(cached)

      /* =====================================================
         SECTION: API CALLS
         PURPOSE:
         This section talks to backend or server endpoints.
         It sends requests, receives responses, and prepares data for the UI.
      ===================================================== */

      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      const response = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${accessToken}` } }).catch(() => null)
      if (!alive || !response?.ok) return

      const freshProfile = await response.json() as ProfileDropdownUser
      setProfile(freshProfile)
      const remember = window.localStorage.getItem("pinesphere_access_token") === accessToken
      storeSessionValue("pinesphere_profile", JSON.stringify(freshProfile), remember)
    }

    void loadProfile()
    /* =====================================================
       SECTION: UI RENDERING
       PURPOSE:
       This section returns the visual layout shown to the user.
       It combines data, state, and components into the final screen.
    ===================================================== */

    return () => {
      alive = false
    }
  }, [])

  const displayName = profile?.full_name || "Pinesphere User"
  const initials = useMemo(() => getProfileInitials(profile?.full_name ?? displayName, profile?.email), [displayName, profile?.email, profile?.full_name])

  function goToSidebarItem(href: string) {
    if (href === "#") return
    router.push(href)
  }

  return (
    <main className="min-h-screen bg-[var(--pinesphere-neutral-bg)] text-[var(--pinesphere-navy)]">
      <header className="sticky top-0 z-[9998] h-[70px] border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1640px] items-center gap-5 px-5">
          <Link href="/student/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--pinesphere-green)] text-base font-black text-white">P</span>
            <span className="text-xl font-black tracking-tight">Pinesphere</span>
          </Link>
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-9 text-sm font-black text-[#0f172a] lg:flex">
            {navLinks.map((link) => (
              <a key={link} href="#" className="inline-flex items-center gap-1.5 whitespace-nowrap transition hover:text-[var(--pinesphere-green)]">
                {link}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <label className="hidden h-11 w-[310px] items-center gap-3 rounded-[12px] bg-[#f1f3f8] px-4 text-sm text-[#64748b] xl:flex">
              <Search size={18} />
              <input aria-label="Search courses" placeholder="Search for courses, topics..." className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-[#64748b]" />
            </label>
            <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#071129] transition hover:bg-[#f1f5f9]">
              <Bell size={20} />
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-black text-white">3</span>
            </button>
            <ProfileAvatarDropdown user={profile} compact />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1640px] grid-cols-1 gap-5 px-5 py-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="block lg:sticky lg:top-[90px] lg:max-h-[calc(100vh-110px)] lg:overflow-y-auto">
          <section className="flex min-h-full flex-col overflow-hidden rounded-[20px] border border-[#dfe8e5] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">
            <div className="h-28 overflow-hidden rounded-[16px] bg-[#dbeafe]">
              <Image src="/pinesphere-hero.png" alt="Pinesphere campus" width={420} height={180} priority className="h-full w-full object-cover" />
            </div>
            <div className="-mt-11 flex flex-col items-center px-3 text-center">
              <div className="flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[var(--pinesphere-green-light)] text-xl font-black text-[var(--pinesphere-green)] shadow-md">
                {profile?.profile_photo ? <Image src={profile.profile_photo} alt={displayName} width={76} height={76} unoptimized className="h-full w-full object-cover" /> : initials}
              </div>
              <h1 className="mt-3 max-w-full truncate text-lg font-black">{displayName}</h1>
              <p className="text-xs font-black text-[var(--pinesphere-green)]">{profile?.role?.replaceAll("_", " ") ?? "Account"}</p>
            </div>
            <nav className="mt-5 grid gap-1">
              {sidebarItems.map(({ label, icon: Icon, count, href }) => {
                const active = label === "Settings"
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => goToSidebarItem(href)}
                    className={`flex items-center justify-between rounded-[11px] px-3 py-2.5 text-[13px] font-black transition ${active ? "bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]" : "text-[#0f172a] hover:bg-[var(--pinesphere-green-light)] hover:text-[var(--pinesphere-green)]"}`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} />
                      {label}
                    </span>
                    {count ? <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] text-[#ef4444]">{count}</span> : null}
                  </button>
                )
              })}
            </nav>
          </section>
        </aside>

        <section className="min-w-0 pr-1 scroll-smooth">
          <div className="space-y-4 pb-5">{children}</div>
        </section>
      </div>
    </main>
  )
}
