/* =====================================================
PINESPHERE ERP
Module      : Profile Module
Component   : Page
Purpose     : Renders and coordinates Page UI behavior
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

import { Mail, Phone, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

import { API_URL, getStoredSessionValue, storeSessionValue } from "@/app/shared/api"
import { ProfileAvatarDropdown, getProfileInitials, type ProfileDropdownUser } from "@/components/profile/ProfileAvatarDropdown"

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function readCachedProfile(): ProfileDropdownUser | null {
  if (typeof window === "undefined") return null
  const raw = window.localStorage.getItem("pinesphere_profile") ?? window.sessionStorage.getItem("pinesphere_profile")
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProfileDropdownUser
  } catch {
    return null
  }
}

export default function ProfilePage() {
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
      if (cached) setProfile(cached)
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
      if (!alive) return
      if (response?.ok) {
        const fresh = await response.json() as ProfileDropdownUser
        setProfile(fresh)
        const remember = window.localStorage.getItem("pinesphere_access_token") === accessToken
        storeSessionValue("pinesphere_profile", JSON.stringify(fresh), remember)
      }
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

  const name = profile?.full_name ?? "Pinesphere User"
  const initials = getProfileInitials(profile?.full_name, profile?.email)

  return (
    <main className="min-h-screen bg-[#f3f7f0] px-4 py-6 text-[#17210f]">
      <div className="mx-auto max-w-5xl">
        <header className="relative z-[9998] flex items-center justify-between rounded-lg border border-[#dde8d2] bg-white px-4 py-3 shadow-sm">
          <Link href="/student/dashboard" className="text-lg font-black">Pinesphere</Link>
          <ProfileAvatarDropdown user={profile} compact />
        </header>
        <section className="mt-5 rounded-lg border border-[#dde8d2] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[var(--pinesphere-green-light)] text-2xl font-black text-[var(--pinesphere-green)]">
              {profile?.profile_photo ? <Image src={profile.profile_photo} alt={name} width={80} height={80} unoptimized className="h-full w-full object-cover" /> : initials}
            </div>
            <div>
              <h1 className="text-2xl font-black">{name}</h1>
              <p className="mt-1 text-sm font-semibold text-[#64748b]">{profile?.role?.replaceAll("_", " ") ?? "Account"}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-[#edf3e8] bg-[#fbfdf8] p-4">
              <Mail className="text-[var(--pinesphere-green)]" size={20} />
              <p className="mt-3 text-xs font-bold text-[#64748b]">Email</p>
              <p className="mt-1 break-words text-sm font-black">{profile?.email ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-[#edf3e8] bg-[#fbfdf8] p-4">
              <Phone className="text-[var(--pinesphere-green)]" size={20} />
              <p className="mt-3 text-xs font-bold text-[#64748b]">Phone</p>
              <p className="mt-1 text-sm font-black">{profile?.phone ?? "-"}</p>
            </div>
            <div className="rounded-lg border border-[#edf3e8] bg-[#fbfdf8] p-4">
              <ShieldCheck className="text-[var(--pinesphere-green)]" size={20} />
              <p className="mt-3 text-xs font-bold text-[#64748b]">Role</p>
              <p className="mt-1 text-sm font-black">{profile?.role?.replaceAll("_", " ") ?? "-"}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
