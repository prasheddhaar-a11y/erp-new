/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Student Portal Layout
Purpose     : Shared shell for all /student/* routes.
              Renders the top navbar, left sidebar, and
              scrollable content area. Each child page
              renders only its inner content — no
              duplicate shells.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
===================================================== */

import {
  Award,
  Bell,
  BookOpen,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  CreditCard,
  Home,
  Megaphone,
  Search,
  Settings,
  Clock,
  type LucideIcon,
} from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"

import { API_URL, getStoredSessionValue, storeSessionValue } from "@/lib/api"
import { getRoleDashboardPath, type UserRole } from "@/lib/auth"
import {
  ProfileAvatarDropdown,
  getProfileInitials,
  type ProfileDropdownUser,
} from "@/components/profile/ProfileAvatarDropdown"

/* =====================================================
   SECTION: CONSTANTS
===================================================== */

const navLinks = ["Explore Programs", "Events", "Placement Portal"]

const sidebarItems: Array<{
  label: string
  icon: LucideIcon
  href: string
  targetId?: string
  count?: number
}> = [
  { label: "Dashboard",   icon: Home,       href: "/student/dashboard" },
  { label: "My Courses",  icon: BookOpen,   href: "/student/lms" },
  { label: "Attendance",  icon: Clock,      href: "/student/attendance" },
  { label: "Fees",        icon: CreditCard, href: "/student/fees" },
  { label: "Settings",    icon: Settings,   href: "/student/settings" },
]

/* =====================================================
   SECTION: HELPER FUNCTIONS
===================================================== */

function readCachedProfile(): ProfileDropdownUser | null {
  // Only safe to call on the client (inside useEffect or event handlers).
  // Never call during render — causes SSR/client hydration mismatch.
  const raw =
    window.localStorage.getItem("pinesphere_profile") ??
    window.sessionStorage.getItem("pinesphere_profile") ??
    window.localStorage.getItem("pinesphere_user") ??
    window.sessionStorage.getItem("pinesphere_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProfileDropdownUser
  } catch {
    return null
  }
}

function enforceStudentRole(role?: string | null): boolean {
  if (!role || role === "student") return true
  window.location.href = getRoleDashboardPath(role as UserRole)
  return false
}

/* =====================================================
   SECTION: LAYOUT COMPONENT
===================================================== */

export default function StudentPortalLayout({ children }: { children: ReactNode }) {
  /* ── State ──
     Initial value is null so SSR and the first client render agree,
     preventing the hydration mismatch. The cache read and API fetch
     both happen inside useEffect (client-only), after hydration.
     
     isHydrated tracks when hydration completes, preventing profile-dependent
     UI from rendering until server and client are in sync.
  ── */
  const [profile, setProfile] = useState<ProfileDropdownUser | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const pathname = usePathname()

  /* ── Resolve active sidebar item by current route ── */
  const activeHref = useMemo(() => {
    // Dashboard: exact match only
    if (pathname === "/student/dashboard") {
      return "/student/dashboard"
    }

    // My Courses: match /student/lms and /student/lms/[courseId]
    if (pathname.startsWith("/student/lms")) {
      return "/student/lms"
    }

    // Others: exact match on base path (before hash)
    const match = sidebarItems.find((item) => item.href.split("#")[0] === pathname)
    return match?.href ?? sidebarItems[0].href
  }, [pathname])

  /* ── Derived display values ── */
  const studentName = profile?.full_name?.trim() || ""
  const initials = useMemo(
    () => getProfileInitials(studentName, profile?.email),
    [profile?.email, studentName],
  )

  /* ── Auth + profile fetch ──
     Execution order inside this effect:
       1. Mark hydration as complete so profile UI can now render safely.
       2. Redirect to /login if no token (fast exit).
       3. Apply cached profile immediately so the sidebar shows real data
          on the very next frame — before the network round-trip completes.
       4. Enforce role on the cached profile (redirects non-students).
       5. Fetch /auth/me and update state + storage with fresh data.
          Also re-enforces role in case it changed server-side.
  ── */
  useEffect(() => {
    let alive = true

    async function load() {
      // Mark hydration complete — now profile UI can render
      if (alive) setIsHydrated(true)

      const accessToken = getStoredSessionValue("pinesphere_access_token")
      if (!accessToken) {
        window.location.href = "/login"
        return
      }

      // Step 3 + 4: paint cached profile immediately, enforce role on it
      const cached = readCachedProfile()
      if (cached) {
        if (!enforceStudentRole(cached.role)) return
        if (alive) setProfile(cached)
      }

      // Step 5: refresh from API
      const profileResponse = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => null)

      if (!alive) return

      if (profileResponse?.ok) {
        const freshProfile = (await profileResponse.json()) as ProfileDropdownUser
        if (!enforceStudentRole(freshProfile.role)) return
        setProfile(freshProfile)
        const remember =
          window.localStorage.getItem("pinesphere_access_token") === accessToken
        storeSessionValue(
          "pinesphere_profile",
          JSON.stringify(freshProfile),
          remember,
        )
      }
    }

    void load()
    return () => {
      alive = false
    }
  }, [])

  /* ── Render ── */
  return (
    <main className="h-screen overflow-hidden bg-[var(--pinesphere-neutral-bg)] text-[var(--pinesphere-navy)]">

      {/* ════════════════════════════════════════════
          TOP NAVBAR
      ════════════════════════════════════════════ */}
      <header className="relative z-[9998] h-[70px] border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1640px] items-center gap-5 px-5">

          {/* Logo */}
          <Link href="/student/dashboard" className="flex shrink-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[var(--pinesphere-green)] text-base font-black text-white">
              P
            </span>
            <span className="text-xl font-black tracking-tight">Pinesphere</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-9 text-sm font-black text-[#0f172a] lg:flex">
            {navLinks.map((link) => (
              <a
                key={link}
                href="#"
                className="inline-flex items-center gap-1.5 whitespace-nowrap transition hover:text-[var(--pinesphere-green)]"
              >
                {link}
                {link === "Explore Programs" ? <ChevronDown size={15} /> : null}
              </a>
            ))}
          </nav>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-3">
            {/* Search */}
            <label className="hidden h-11 w-[310px] items-center gap-3 rounded-[12px] bg-[#f1f3f8] px-4 text-sm text-[#64748b] xl:flex">
              <Search size={18} />
              <input
                aria-label="Search courses"
                placeholder="Search for courses, topics..."
                className="min-w-0 flex-1 border-none bg-transparent text-sm font-semibold outline-none placeholder:text-[#64748b]"
              />
            </label>

            {/* Notifications */}
            <button
              type="button"
              aria-label="Notifications"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#071129] transition hover:bg-[#f1f5f9]"
            >
              <Bell size={20} />
              {/* TODO Phase 2: replace hardcoded count with API notification count */}
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef4444] text-[10px] font-black text-white">
                3
              </span>
            </button>

            {/* Profile avatar — null on SSR/first paint, populates after effect runs */}
            <ProfileAvatarDropdown
              user={profile ? { ...profile, full_name: studentName, role: profile.role ?? "student" } : null}
              isHydrated={isHydrated}
              compact
            />
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════
          BODY: SIDEBAR + CONTENT
      ════════════════════════════════════════════ */}
      <div className="mx-auto grid h-[calc(100vh-70px)] max-w-[1640px] grid-cols-1 gap-5 overflow-hidden px-5 py-5 xl:grid-cols-[250px_minmax(0,1fr)]">

        {/* ── Left sidebar ── */}
        <aside className="hidden h-full overflow-y-auto xl:block">
          <section className="flex min-h-full flex-col overflow-hidden rounded-[20px] border border-[#dfe8e5] bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.07)]">

            {/* Campus banner */}
            <div className="h-28 overflow-hidden rounded-[16px] bg-[#dbeafe]">
              <Image
                src="/pinesphere-hero.png"
                alt="Pinesphere campus"
                width={420}
                height={180}
                priority
                className="h-full w-full object-cover"
              />
            </div>

            {/* Student card */}
            <div className="-mt-11 flex flex-col items-center px-3 text-center">
              <div className={`flex h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-4 border-white text-xl font-black shadow-md ${
                isHydrated
                  ? "bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]"
                  : "animate-pulse bg-[#e2e8f0] text-[#cbd5e1]"
              }`}>
                {isHydrated && (profile?.profile_photo ? (
                  <Image
                    src={profile.profile_photo}
                    alt={studentName}
                    width={76}
                    height={76}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                ))}
                {!isHydrated && <span className="text-transparent">—</span>}
              </div>
              <h1 className="mt-3 max-w-full truncate text-lg font-black">
                {isHydrated ? (studentName || "Loading...") : ""}
              </h1>
              {/* TODO Phase 2: render designation from profile API (e.g. profile.program_name) */}
              {/* TODO Phase 2: render batch from profile API (e.g. profile.batch_name) */}
            </div>

            {/* Nav items — active item resolved from current pathname */}
            <nav className="mt-5 grid gap-1">
              {sidebarItems.map(({ label, icon: Icon, href, count }) => {
                const isActive = href === activeHref
                return (
                  <Link
                    key={label}
                    href={href}
                    className={`flex items-center justify-between rounded-[11px] px-3 py-2.5 text-[13px] font-black transition ${
                      isActive
                        ? "bg-[var(--pinesphere-green-light)] text-[var(--pinesphere-green)]"
                        : "text-[#0f172a] hover:bg-[var(--pinesphere-green-light)] hover:text-[var(--pinesphere-green)]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={16} />
                      {label}
                    </span>
                    {count ? (
                      <span className="rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] text-[#ef4444]">
                        {count}
                      </span>
                    ) : null}
                  </Link>
                )
              })}
            </nav>
          </section>
        </aside>

        {/* ── Main content area — each child page renders here ── */}
        <section className="min-w-0 overflow-y-auto pr-1 scroll-smooth">
          {children}
        </section>
      </div>
    </main>
  )
}