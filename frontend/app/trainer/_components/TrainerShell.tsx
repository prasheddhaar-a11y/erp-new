"use client"

import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  TestTube2,
  Users,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import {
  clearAuthSession,
  getCurrentUser,
  getRoleDashboardPath,
  getStoredSession,
  normalizeUserRole,
  type UserProfile,
} from "@/lib/auth"
import { ProfileAvatarDropdown } from "@/components/profile/ProfileAvatarDropdown"
import { trainerSidebar } from "@/components/sidebarConfig/trainerSidebar"

type TrainerSession = {
  accessToken: string
  user: UserProfile
}

type AuthState = "loading" | "authorized" | "redirecting"

const iconMap: Record<string, LucideIcon> = {
  dashboard: Home,
  batches: Users,
  students: GraduationCap,
  attendance: CalendarDays,
  lms: BookOpen,
  assignments: ClipboardList,
  tests: TestTube2,
  calendar: CalendarDays,
  messages: MessageSquare,
  settings: Settings,
}

export function TrainerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<TrainerSession | null>(null)
  const [authState, setAuthState] = useState<AuthState>("loading")
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadSession() {
      try {
        const storedSession = getStoredSession()

        if (!storedSession) {
          if (!cancelled) setAuthState("redirecting")
          router.replace("/")
          return
        }

        const currentUser = await getCurrentUser()
        if (cancelled) return

        if (!currentUser) {
          clearAuthSession()
          setAuthState("redirecting")
          router.replace("/")
          return
        }

        const role = normalizeUserRole(currentUser.role) ?? normalizeUserRole(currentUser.role_abbreviation)
        if (role !== "trainer") {
          setAuthState("redirecting")
          router.replace(getRoleDashboardPath(role))
          return
        }

        const latestSession = getStoredSession() ?? storedSession
        setSession({
          accessToken: latestSession.accessToken,
          user: { ...currentUser, role },
        })
        setAuthState("authorized")
      } catch {
        if (cancelled) return
        clearAuthSession()
        setAuthState("redirecting")
        router.replace("/")
      }
    }
    void loadSession()
    return () => {
      cancelled = true
    }
  }, [router])

  const displayName = session?.user.full_name || "Trainer"
  const branchName = session?.user.branch_name || "Pinesphere Kochi"
  const initials = useMemo(() => {
    return displayName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "TR"
  }, [displayName])

  if (authState !== "authorized" || !session) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8] text-[#071B4A]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black shadow-sm">
          {authState === "redirecting" ? "Redirecting..." : "Loading Trainer Portal..."}
        </div>
      </main>
    )
  }

  return (
    <main className="trainer-portal min-h-screen overflow-x-hidden bg-[#F8FAF8] text-[#071B4A]">
      {/* Mobile Sidebar Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#020617]/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[292px] overflow-hidden bg-[linear-gradient(165deg,#063D36_0%,#004235_48%,#002F2D_100%)] text-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:block"
        }`}
      >
        <div className="flex h-screen flex-col p-4">
          <Link href="/trainer/dashboard" className="flex items-center gap-3 px-1" onClick={() => setMobileOpen(false)}>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-base font-black text-[#0B7A5A]">
              P
            </span>
            <div className="min-w-0">
              <span className="block truncate text-xl font-black leading-tight">Pinesphere ERP</span>
              <span className="text-xs font-semibold text-white/75">Trainer Portal</span>
            </div>
          </Link>

          <div className="mt-7 flex items-center gap-3 rounded-lg bg-white/10 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#DFF5E8] text-lg font-black text-[#0B7A5A]">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{displayName}</p>
              <p className="text-xs font-semibold text-white/75">Trainer</p>
              <p className="truncate text-xs font-semibold text-white/75">{branchName}</p>
            </div>
            <ChevronDown size={15} className="ml-auto text-white/75" />
          </div>

          <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
            {trainerSidebar.filter(item => !item.hidden).map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = iconMap[item.icon] ?? Home
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition ${
                    active
                      ? "bg-[#0B7A5A] text-white shadow-[0_8px_20px_rgba(0,0,0,0.14)]"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={17} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-4 rounded-lg bg-white/10 p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
            <p className="text-sm font-black">Need Help?</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-white/75">Trainer support channel</p>
            <Link
              href="/trainer/messages"
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/35 text-xs font-black text-white transition hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              <MessageSquare size={15} />
              Contact Support
            </Link>
          </div>
          <div className="mt-5 text-xs font-semibold text-white/70">© 2026 Pinesphere ERP</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="min-w-0 lg:pl-[292px]">
        {/* Topbar */}
        <header className="trainer-topbar sticky top-0 z-20 border-b border-[#E2E8F0] bg-white/95 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-h-12 items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <button
                type="button"
                aria-label="Toggle Menu"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="shrink-0 text-[#071B4A] lg:hidden"
              >
                <Menu size={22} />
              </button>
              <h1 className="truncate text-base font-black text-[#0F172A] sm:text-lg">Trainer Dashboard</h1>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-3 sm:gap-4">
              <span className="hidden shrink-0 rounded-full bg-[#E8F6F0] px-3 py-1.5 text-xs font-black text-[#0B7A5A] md:inline-flex">
                Trainer Portal
              </span>
              <button
                type="button"
                disabled
                className="hidden h-10 cursor-default items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-4 text-sm font-black text-[#0F172A] shadow-sm md:flex"
              >
                <Home size={17} />
                <span className="max-w-36 truncate">{branchName}</span>
              </button>
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#071B4A]"
              >
                <Bell size={18} />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-black text-white">
                  6
                </span>
              </button>
              <div className="hidden min-w-0 text-right sm:block">
                <p className="max-w-40 truncate text-sm font-black leading-tight text-[#0F172A]">
                  {displayName}
                </p>
                <p className="whitespace-nowrap text-xs font-semibold text-[#64748B]">Trainer</p>
              </div>
              <ProfileAvatarDropdown user={session.user} isHydrated={true} compact />
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="mx-auto max-w-[1540px] px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </section>
    </main>
  )
}
