"use client"

import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  Home,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { getStoredSession, normalizeUserRole, storeSession, type UserProfile } from "@/lib/auth"
import { getStoredSessionValue } from "@/lib/api"
import { ProfileAvatarDropdown } from "@/components/profile/ProfileAvatarDropdown"
import { getBranchContext } from "@/lib/api/branchAdminOptions"
import { resolveBranchScope, type BranchScope } from "@/lib/api/branchAdminData"

type BranchAdminSession = {
  accessToken: string
  refreshToken?: string
  rememberMe?: boolean
  user: UserProfile
  branch: BranchScope
}

type BranchAdminPreferences = {
  theme_preference?: string
  dashboard_preference?: string
  notification_preference?: string
  language_preference?: string
}

const branchAdminNav = [
  { key: "dashboard", label: "Dashboard", href: "/branch-admin/dashboard", icon: LayoutDashboard },
  { key: "users", label: "Users", href: "/branch-admin/users", icon: Users },
  { key: "admissions", label: "Admissions", href: "/branch-admin/admissions", icon: FileText },
  { key: "attendance", label: "Attendance", href: "/branch-admin/attendance", icon: CalendarDays },
  { key: "fees", label: "Fees", href: "/branch-admin/fees", icon: CreditCard },
  { key: "batch-management", label: "Batch Management", href: "/branch-admin/batch-management", icon: BookOpen },
  { key: "settings", label: "Settings", href: "/branch-admin/settings", icon: Settings },
] satisfies Array<{ key: string; label: string; href: string; icon: LucideIcon }>

export const BRANCH_ADMIN_PREFERENCES_KEY = "pinesphere_branch_admin_preferences"
export const BRANCH_ADMIN_PREFERENCES_EVENT = "branch-admin-preferences-updated"

function branchAdminPreferenceStorageKey() {
  if (typeof window === "undefined") return BRANCH_ADMIN_PREFERENCES_KEY
  const profile = getStoredSession()?.user ?? parseLegacyProfile()
  const identity = profile?.id || profile?.email || "branch-admin"
  return `${BRANCH_ADMIN_PREFERENCES_KEY}:${identity}`
}

export function readBranchAdminPreferences(): BranchAdminPreferences {
  if (typeof window === "undefined") return {}
  const raw = window.localStorage.getItem(branchAdminPreferenceStorageKey())
  if (!raw) return {}
  try {
    return JSON.parse(raw) as BranchAdminPreferences
  } catch {
    return {}
  }
}

export function storeBranchAdminPreferences(preferences: BranchAdminPreferences) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(branchAdminPreferenceStorageKey(), JSON.stringify(preferences))
  window.dispatchEvent(new CustomEvent(BRANCH_ADMIN_PREFERENCES_EVENT, { detail: preferences }))
}

function branchAdminThemeClass(theme?: string) {
  const normalized = (theme || "System").toLowerCase()
  if (normalized === "dark") return "erp-module-dark"
  if (normalized === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) return "erp-module-dark"
  return ""
}

function isBranchAdminDarkTheme(theme?: string) {
  return branchAdminThemeClass(theme).includes("erp-module-dark")
}

function parseLegacyProfile(): UserProfile | null {
  const raw = getStoredSessionValue("pinesphere_profile")
  if (!raw) return null

  try {
    const profile = JSON.parse(raw) as Partial<UserProfile>
    const role = normalizeUserRole(profile.role) ?? normalizeUserRole(profile.role_abbreviation)
    if (!role || !profile.full_name) return null

    return {
      id: profile.id ?? "",
      email: profile.email ?? "",
      full_name: profile.full_name,
      role,
      role_abbreviation: profile.role_abbreviation ?? "",
      branch_id: profile.branch_id,
      branch_name: "branch_name" in profile ? profile.branch_name : undefined,
      branch_code: "branch_code" in profile ? profile.branch_code : undefined,
      is_active: profile.is_active ?? true,
      display_code: profile.display_code,
      phone: profile.phone,
      profile_photo: profile.profile_photo,
    }
  } catch {
    return null
  }
}

export function readBranchAdminSession(): BranchAdminSession | null {
  const session = getStoredSession()
  if (session) return { accessToken: session.accessToken, refreshToken: session.refreshToken, rememberMe: session.rememberMe, user: session.user, branch: resolveBranchScope(session.user) }

  const accessToken = getStoredSessionValue("pinesphere_access_token")
  const profile = parseLegacyProfile()
  if (!accessToken || !profile) return null
  return { accessToken, user: profile, branch: resolveBranchScope(profile) }
}

export function BranchAdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<BranchAdminSession | null>(null)
  const [ready, setReady] = useState(false)
  const [preferences, setPreferences] = useState<BranchAdminPreferences>(() => readBranchAdminPreferences())

  useEffect(() => {
    let cancelled = false
    async function loadSession() {
    const nextSession = readBranchAdminSession()
    if (!nextSession) {
      router.replace("/login")
      return
    }

    const role = normalizeUserRole(nextSession.user.role) ?? normalizeUserRole(nextSession.user.role_abbreviation)
    if (role !== "branch_admin") {
      router.replace("/login")
      return
    }

    const user = { ...nextSession.user, role }
      let branch = resolveBranchScope(user)
      try {
        const context = await getBranchContext()
        branch = {
          branch_id: context.branch_id || user.branch_id || "",
          branch_name: context.branch_name || branch.branch_name,
          branch_code: context.branch_code,
          city: context.city,
        }
        const storedProfile = { ...user, branch_id: branch.branch_id, branch_name: branch.branch_name, branch_code: branch.branch_code, city: branch.city }
        window.localStorage.setItem("pinesphere_profile", JSON.stringify(storedProfile))
        if (nextSession.refreshToken) {
          storeSession({ accessToken: nextSession.accessToken, refreshToken: nextSession.refreshToken, user: storedProfile, rememberMe: nextSession.rememberMe ?? true })
        }
      } catch {
        // Keep the login-session branch fallback if the context endpoint is unavailable.
      }
      if (!cancelled) {
        setSession({ ...nextSession, user: { ...user, branch_id: branch.branch_id, branch_name: branch.branch_name }, branch })
        setReady(true)
      }
    }
    loadSession()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    function refreshPreferences() {
      setPreferences(readBranchAdminPreferences())
    }
    window.addEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, refreshPreferences)
    window.addEventListener("storage", refreshPreferences)
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", refreshPreferences)
    return () => {
      window.removeEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, refreshPreferences)
      window.removeEventListener("storage", refreshPreferences)
      media.removeEventListener("change", refreshPreferences)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const applyBranchAdminTheme = () => {
      root.classList.toggle("branch-admin-dark", isBranchAdminDarkTheme(readBranchAdminPreferences().theme_preference))
    }
    applyBranchAdminTheme()
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", applyBranchAdminTheme)
    window.addEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, applyBranchAdminTheme)
    return () => {
      media.removeEventListener("change", applyBranchAdminTheme)
      window.removeEventListener(BRANCH_ADMIN_PREFERENCES_EVENT, applyBranchAdminTheme)
      root.classList.remove("branch-admin-dark")
    }
  }, [])

  const displayName = session?.user.full_name || "Branch Admin"
  const branchName = session?.branch.branch_name || resolveBranchScope().branch_name
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BA"
  }, [displayName])

  if (!ready || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8] text-[#071B4A]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black shadow-sm">
          Loading Branch Admin...
        </div>
      </main>
    )
  }

  return (
    <main className={`branch-admin-portal min-h-screen overflow-x-hidden bg-[#F8FAF8] text-[#071B4A] ${branchAdminThemeClass(preferences.theme_preference)}`}>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[292px] overflow-hidden bg-[linear-gradient(165deg,#063D36_0%,#004235_48%,#002F2D_100%)] text-white lg:block">
        <div className="flex h-screen flex-col p-4">
          <Link href="/branch-admin/dashboard" className="flex items-center gap-3 px-1">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-[#0B7A5A]">P</span>
            <div className="min-w-0">
              <span className="block truncate text-xl font-black leading-tight">Pinesphere ERP</span>
              <span className="text-xs font-semibold text-white/75">Branch Admin</span>
            </div>
          </Link>

          <div className="mt-7 flex items-center gap-3 rounded-lg bg-white/10 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] text-lg font-black text-[#0B7A5A]">{initials}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="text-xs font-semibold text-white/75">Branch Admin</p>
              <p className="truncate text-xs font-semibold text-white/75">{branchName}</p>
            </div>
            <ChevronDown size={15} className="ml-auto text-white/75" />
          </div>

          <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {branchAdminNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                    active ? "bg-[#0B7A5A] text-white shadow-[0_8px_20px_rgba(0,0,0,0.14)]" : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 rounded-lg bg-white/10 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="text-sm font-black">Need Help?</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/75">Branch operations support</p>
            <Link href="/branch-admin/settings" className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/35 text-xs font-black text-white transition hover:bg-white/10">
              <Settings size={15} />
              Branch Settings
            </Link>
          </div>
          <div className="mt-5 text-xs font-semibold text-white/70">(c) 2026 Pinesphere ERP</div>
        </div>
      </aside>

      <section className="min-w-0 lg:pl-[292px]">
        <header className="branch-admin-topbar sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <Menu size={22} className="shrink-0 text-[#071B4A] lg:hidden" />
              <h1 className="truncate text-base font-black text-[#0F172A] sm:text-lg">Branch Admin</h1>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="hidden shrink-0 rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-black text-[#0B7A5A] md:inline-flex">Branch Admin</span>
              <button type="button" disabled className="hidden h-10 cursor-default items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#0F172A] shadow-sm md:flex">
                <Home size={17} />
                <span className="max-w-36 truncate">{branchName}</span>
              </button>
              <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#071B4A]">
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white">12</span>
              </button>
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-40 truncate text-sm font-black leading-tight text-[#0F172A]">{displayName}</p>
                <p className="whitespace-nowrap text-xs font-semibold text-[#64748B]">Branch Admin</p>
              </div>
              <ProfileAvatarDropdown user={session.user} compact isHydrated={ready} />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </section>
    </main>
  )
}
