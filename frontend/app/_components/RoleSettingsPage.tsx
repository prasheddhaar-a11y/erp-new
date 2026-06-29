"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import ProfileSettingsPage from "@/app/settings/profile/page"
import { getRoleDashboardPath, getStoredSession, normalizeUserRole, type UserRole } from "@/lib/auth"

const ROLE_SETTINGS_PATHS: Partial<Record<UserRole, string>> = {
  super_admin: "/super-admin/settings",
  branch_admin: "/branch-admin/settings",
  counsellor: "/counsellor/settings",
  trainer: "/trainer/settings",
  student: "/student/settings",
  parent: "/parent/settings",
  finance: "/finance/settings",
  hr: "/hr/settings",
}

export function RoleSettingsPage({ expectedRole }: { expectedRole: UserRole }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    const session = getStoredSession()
    if (!session) {
      router.replace("/login")
      return
    }

    const role = normalizeUserRole(session.user.role) ?? normalizeUserRole(session.user.role_abbreviation)
    if (role !== expectedRole) {
      router.replace((role && ROLE_SETTINGS_PATHS[role]) || getRoleDashboardPath(role))
      return
    }

    setAllowed(true)
  }, [expectedRole, router])

  if (!allowed) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#F8FAF8] text-[#071B4A]">
        <div className="rounded-lg border border-[#DDE9E4] bg-white px-5 py-4 text-sm font-black shadow-sm">
          Loading settings...
        </div>
      </main>
    )
  }

  return <ProfileSettingsPage />
}
