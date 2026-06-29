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

import {
  Bell,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Save,
  Settings2,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"
import { useEffect, useState } from "react"

import { getStoredSessionValue } from "@/app/shared/api"
import { useToast } from "@/components/ui/toast"

import {
  changeProfilePassword,
  defaultPreferences,
  emptyProfileForm,
  loadProfilePreferences,
  loadProfileSettings,
  saveProfilePreferences,
  saveProfileSettings,
  trySetAutomaticTimezone,
  /* =====================================================
     SECTION: TYPES AND INTERFACES
     PURPOSE:
     This section describes the shape of data used by the code.
     Clear types make component props, API payloads, and state easier to understand.
  ===================================================== */

  type ProfileForm,
  type ProfilePreferences,
} from "./settingsProfileService"

type ActiveTab = "profile" | "password" | "preferences"
type ProfileFieldKey = keyof ProfileForm

const requiredFields: ProfileFieldKey[] = [
  "studentUserName",
  "username",
  "dateOfBirth",
  "gender",
  "mobileNumber",
  "email",
  "residentialAddress",
  "city",
  "state",
  "pincode",
]

const fieldLabels: Record<ProfileFieldKey, string> = {
  studentUserName: "Student/User Name",
  username: "Username",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  parentName: "Parent Name",
  parentEmail: "Parent Email",
  parentContactNumber: "Parent Contact Number",
  standardCourseBatch: "Standard / Course / Batch",
  mobileNumber: "Mobile Number",
  alternateContact: "Alternate Contact",
  email: "Email",
  residentialAddress: "Residential Address",
  city: "City",
  state: "State",
  pincode: "Pincode",
  permanentAddress: "Permanent Address",
  area: "Area",
  schoolCollegeName: "School/College Name",
}

const tabs: Array<{ id: ActiveTab; label: string; icon: typeof UserRound }> = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "password", label: "Change Password", icon: KeyRound },
  { id: "preferences", label: "Preferences", icon: Settings2 },
]

const timezones = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
]

const inputClass = "h-10 w-full rounded-md border border-[var(--pinesphere-green-border)] bg-white px-3 text-sm font-semibold text-[var(--pinesphere-navy)] shadow-inner shadow-[#edf6e8]/60 transition placeholder:text-[#9aa8a0] focus:border-[var(--pinesphere-green)] focus:outline-none focus:ring-2 focus:ring-[rgba(11,122,90,0.18)] disabled:cursor-not-allowed disabled:bg-[#f6faf3] disabled:text-[#64748b]"
const textareaClass = `${inputClass} min-h-20 resize-y py-2`

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

function validateProfile(form: ProfileForm) {
  const errors: Partial<Record<ProfileFieldKey, string>> = {}
  for (const field of requiredFields) {
    if (!form[field].trim()) errors[field] = `${fieldLabels[field]} is required`
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address"
  if (form.parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.parentEmail)) errors.parentEmail = "Enter a valid parent email"
  if (form.pincode && !/^\d{4,10}$/.test(form.pincode)) errors.pincode = "Enter a valid pincode"
  return errors
}

function passwordRequirements(password: string) {
  return [
    { label: "Minimum 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ]
}

function validatePasswordForm(form: { currentPassword: string; newPassword: string; confirmPassword: string }) {
  if (!form.currentPassword) return "Current password is required"
  const unmet = passwordRequirements(form.newPassword).find((requirement) => !requirement.met)
  if (unmet) return `New password must include: ${unmet.label.toLowerCase()}`
  if (form.newPassword !== form.confirmPassword) return "Confirm password must match new password"
  return ""
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  /* =====================================================
     SECTION: UI RENDERING
     PURPOSE:
     This section returns the visual layout shown to the user.
     It combines data, state, and components into the final screen.
  ===================================================== */

  return (
    <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <h2 className="text-base font-black text-[#17210f]">{title}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div>
    </section>
  )
}

function ProfileField({
  field,
  value,
  onChange,
  editing,
  error,
  type = "text",
  options,
  multiline = false,
}: {
  field: ProfileFieldKey
  value: string
  onChange: (field: ProfileFieldKey, value: string) => void
  editing: boolean
  error?: string
  type?: string
  options?: string[]
  multiline?: boolean
}) {
  const required = requiredFields.includes(field)
  return (
    <label className={multiline ? "md:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">
        {fieldLabels[field]} {required ? <span className="text-[#d92d20]">*</span> : null}
      </span>
      {options ? (
        <select value={value} onChange={(event) => onChange(field, event.target.value)} disabled={!editing} className={inputClass}>
          <option value="">Select</option>
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : multiline ? (
        <textarea value={value} onChange={(event) => onChange(field, event.target.value)} disabled={!editing} className={textareaClass} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(field, event.target.value)} readOnly={!editing} className={inputClass} />
      )}
      {error ? <span className="mt-1 block text-xs font-bold text-[#d92d20]">{error}</span> : null}
    </label>
  )
}

function ToggleRow({ title, description, checked, onChange }: { title: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-[#e5eedf] bg-[#fbfdf8] px-3 py-2.5">
      <div>
        <p className="text-sm font-black text-[#17210f]">{title}</p>
        {description ? <p className="mt-0.5 text-xs font-semibold text-[#64748b]">{description}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-[var(--pinesphere-green)]" : "bg-[#cbd5c4]"}`}
      >
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`} />
      </button>
    </div>
  )
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggle: () => void
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">{label}</span>
      <span className="relative block">
        <input type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} className={`${inputClass} pr-10`} />
        <button type="button" onClick={onToggle} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-[#64748b] hover:bg-[var(--pinesphere-green-light)] hover:text-[var(--pinesphere-green)]" aria-label={visible ? "Hide password" : "Show password"}>
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  )
}

export default function ProfileSettingsPage() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile")
  const [form, setForm] = useState<ProfileForm>(emptyProfileForm)
  const [savedForm, setSavedForm] = useState<ProfileForm>(emptyProfileForm)
  /* =====================================================
     SECTION: FORM VALIDATION
     PURPOSE:
     This section checks user input before it is submitted.
     Validation keeps forms predictable and helps show useful error messages.
  ===================================================== */

  const [errors, setErrors] = useState<Partial<Record<ProfileFieldKey, string>>>({})
  /* =====================================================
     SECTION: STATE MANAGEMENT
     PURPOSE:
     This section stores temporary UI data such as loading, errors, filters, and form values.
     State changes here control what the user sees on the screen.
  ===================================================== */

  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<ProfilePreferences>(defaultPreferences)
  const [savingPreferences, setSavingPreferences] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" })
  const [passwordVisible, setPasswordVisible] = useState({ current: false, next: false, confirm: false })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      if (!getStoredSessionValue("pinesphere_access_token")) {
        window.location.href = "/login"
        return
      }
      try {
        const [{ form: loadedForm }, loadedPreferences] = await Promise.all([
          loadProfileSettings(),
          loadProfilePreferences(),
        ])
        if (!alive) return
        setForm(loadedForm)
        setSavedForm(loadedForm)
        setPreferences(loadedPreferences)
      /* =====================================================
         SECTION: ERROR HANDLING
         PURPOSE:
         This section handles expected failures and converts them into useful responses.
         Good error handling keeps the app stable when something goes wrong.
      ===================================================== */

      } catch (error) {
        if (!alive) return
        addToast(error instanceof Error ? error.message : "Profile settings could not be loaded", "error")
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [addToast])

  function updateField(field: ProfileFieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function cancelProfileEdit() {
    setForm(savedForm)
    setErrors({})
    setEditing(false)
  }

  async function submitProfile() {
    const nextErrors = validateProfile(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      addToast("Please fix the highlighted profile fields.", "error")
      return
    }

    setSaving(true)
    try {
      await saveProfileSettings(form)
      setSavedForm(form)
      setEditing(false)
      addToast("Profile updated successfully.", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Profile could not be updated", "error")
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword() {
    const error = validatePasswordForm(passwordForm)
    if (error) {
      addToast(error, "error")
      return
    }
    setChangingPassword(true)
    try {
      await changeProfilePassword(passwordForm)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      addToast("Password changed successfully. Please log in again if prompted.", "success")
    } catch (changeError) {
      addToast(changeError instanceof Error ? changeError.message : "Password could not be changed", "error")
    } finally {
      setChangingPassword(false)
    }
  }

  async function submitPreferences() {
    setSavingPreferences(true)
    try {
      const saved = await saveProfilePreferences(preferences)
      setPreferences(saved)
      addToast("Preferences saved successfully.", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Preferences could not be saved", "error")
    } finally {
      setSavingPreferences(false)
    }
  }

  async function setAutomaticTimezone(value: boolean) {
    const next = value ? await trySetAutomaticTimezone({ ...preferences, automaticTimezone: true }) : { ...preferences, automaticTimezone: false }
    setPreferences(next)
  }

  const requirements = passwordRequirements(passwordForm.newPassword)

  return (
    <section className="min-w-0 text-[#17210f]">
            <div className="rounded-lg border border-[#dde8d2] bg-white px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--pinesphere-green)]">Account Settings</p>
                  <h2 className="mt-1 text-2xl font-black text-[#17210f]">Settings</h2>
                </div>
                {activeTab === "profile" ? (
                  <div className="flex flex-wrap gap-2">
                    {editing ? (
                      <>
                        <button type="button" onClick={cancelProfileEdit} className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-black text-[#334155] hover:bg-[#f8fafc]">
                          <X size={16} />
                          Cancel
                        </button>
                        <button type="button" onClick={() => void submitProfile()} disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70">
                          <Save size={16} />
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => setEditing(true)} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-navy)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-navy-hover)]">
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto border-b border-[#edf3e8] pb-2">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-black transition ${activeTab === id ? "bg-[var(--pinesphere-green)] text-white shadow-sm" : "bg-[#f8fcf4] text-[#52634b] hover:bg-[var(--pinesphere-green-light)] hover:text-[var(--pinesphere-navy)]"}`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="mt-4 rounded-lg border border-[#dde8d2] bg-white p-6 text-sm font-bold text-[#64748b] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">Loading profile settings...</div>
            ) : null}

            {!loading && activeTab === "profile" ? (
              <div className="mt-4 grid gap-4">
                <SectionCard title="Personal Details">
                  <ProfileField field="studentUserName" value={form.studentUserName} onChange={updateField} editing={editing} error={errors.studentUserName} />
                  <ProfileField field="username" value={form.username} onChange={updateField} editing={editing} error={errors.username} />
                  <ProfileField field="dateOfBirth" value={form.dateOfBirth} onChange={updateField} editing={editing} error={errors.dateOfBirth} type="date" />
                  <ProfileField field="gender" value={form.gender} onChange={updateField} editing={editing} error={errors.gender} options={["Female", "Male", "Non-binary", "Prefer not to say"]} />
                </SectionCard>

                <SectionCard title="Parent Details">
                  <ProfileField field="parentName" value={form.parentName} onChange={updateField} editing={editing} error={errors.parentName} />
                  <ProfileField field="parentEmail" value={form.parentEmail} onChange={updateField} editing={editing} error={errors.parentEmail} type="email" />
                  <ProfileField field="parentContactNumber" value={form.parentContactNumber} onChange={updateField} editing={editing} error={errors.parentContactNumber} />
                </SectionCard>

                <SectionCard title="Education Details">
                  <ProfileField field="standardCourseBatch" value={form.standardCourseBatch} onChange={updateField} editing={editing} error={errors.standardCourseBatch} />
                </SectionCard>

                <SectionCard title="Contact Details">
                  <ProfileField field="mobileNumber" value={form.mobileNumber} onChange={updateField} editing={editing} error={errors.mobileNumber} />
                  <ProfileField field="alternateContact" value={form.alternateContact} onChange={updateField} editing={editing} error={errors.alternateContact} />
                  <ProfileField field="email" value={form.email} onChange={updateField} editing={editing} error={errors.email} type="email" />
                  <ProfileField field="city" value={form.city} onChange={updateField} editing={editing} error={errors.city} />
                  <ProfileField field="state" value={form.state} onChange={updateField} editing={editing} error={errors.state} />
                  <ProfileField field="pincode" value={form.pincode} onChange={updateField} editing={editing} error={errors.pincode} />
                  <ProfileField field="area" value={form.area} onChange={updateField} editing={editing} error={errors.area} />
                  <ProfileField field="schoolCollegeName" value={form.schoolCollegeName} onChange={updateField} editing={editing} error={errors.schoolCollegeName} />
                  <ProfileField field="residentialAddress" value={form.residentialAddress} onChange={updateField} editing={editing} error={errors.residentialAddress} multiline />
                  <ProfileField field="permanentAddress" value={form.permanentAddress} onChange={updateField} editing={editing} error={errors.permanentAddress} multiline />
                </SectionCard>
              </div>
            ) : null}

            {!loading && activeTab === "password" ? (
              <div className="mt-4 rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
                  <div className="grid gap-3">
                    <PasswordInput label="Current Password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} visible={passwordVisible.current} onToggle={() => setPasswordVisible((current) => ({ ...current, current: !current.current }))} />
                    <PasswordInput label="New Password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} visible={passwordVisible.next} onToggle={() => setPasswordVisible((current) => ({ ...current, next: !current.next }))} />
                    <PasswordInput label="Confirm New Password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} visible={passwordVisible.confirm} onToggle={() => setPasswordVisible((current) => ({ ...current, confirm: !current.confirm }))} />
                    <div className="mt-1 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void submitPassword()} disabled={changingPassword} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70">
                        <ShieldCheck size={16} />
                        {changingPassword ? "Changing..." : "Change Password"}
                      </button>
                      <button type="button" onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })} className="inline-flex h-10 items-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-black text-[#334155] hover:bg-[#f8fafc]">
                        Cancel
                      </button>
                    </div>
                  </div>
                  <aside className="rounded-md border border-[#e5eedf] bg-[#fbfdf8] p-4">
                    <h3 className="text-sm font-black text-[#17210f]">Password requirements</h3>
                    <div className="mt-3 grid gap-2">
                      {requirements.map((requirement) => (
                        <p key={requirement.label} className={`flex items-center gap-2 text-xs font-bold ${requirement.met ? "text-[var(--pinesphere-green)]" : "text-[#64748b]"}`}>
                          <CheckCircle2 size={15} />
                          {requirement.label}
                        </p>
                      ))}
                    </div>
                  </aside>
                </div>
              </div>
            ) : null}

            {!loading && activeTab === "preferences" ? (
              <div className="mt-4 grid gap-4">
                <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <h2 className="text-base font-black">Timezone</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">Timezone</span>
                      <select value={preferences.timezone} onChange={(event) => setPreferences((current) => ({ ...current, timezone: event.target.value }))} disabled={preferences.automaticTimezone} className={inputClass}>
                        {timezones.map((timezone) => (
                          <option key={timezone} value={timezone}>{timezone}</option>
                        ))}
                      </select>
                    </label>
                    <label className="flex items-center gap-3 rounded-md border border-[#e5eedf] bg-[#fbfdf8] px-3 py-2.5 text-sm font-black text-[#17210f]">
                      <input type="checkbox" checked={preferences.automaticTimezone} onChange={(event) => void setAutomaticTimezone(event.target.checked)} className="h-4 w-4 rounded border-[#cbd5e1] accent-[var(--pinesphere-green)]" />
                      Set timezone automatically
                    </label>
                  </div>
                </section>

                <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-[var(--pinesphere-green)]" />
                    <h2 className="text-base font-black">Notification Settings</h2>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <ToggleRow title="Session reminder 1 hour before" checked={preferences.notifications.sessionReminderHour} onChange={(value) => setPreferences((current) => ({ ...current, notifications: { ...current.notifications, sessionReminderHour: value } }))} />
                    <ToggleRow title="Session reminder 1 day before" checked={preferences.notifications.sessionReminderDay} onChange={(value) => setPreferences((current) => ({ ...current, notifications: { ...current.notifications, sessionReminderDay: value } }))} />
                    <ToggleRow title="Session start notification" checked={preferences.notifications.sessionStart} onChange={(value) => setPreferences((current) => ({ ...current, notifications: { ...current.notifications, sessionStart: value } }))} />
                    <ToggleRow title="Promotional campaigns" checked={preferences.notifications.promotionalCampaigns} onChange={(value) => setPreferences((current) => ({ ...current, notifications: { ...current.notifications, promotionalCampaigns: value } }))} />
                  </div>
                </section>

                <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
                  <h2 className="text-base font-black">Notification Channels</h2>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <ToggleRow title="WhatsApp" description="Session reminders and quick alerts" checked={preferences.channels.whatsapp} onChange={(value) => setPreferences((current) => ({ ...current, channels: { ...current.channels, whatsapp: value } }))} />
                    <ToggleRow title="Email" description="Receipts, notices, and account updates" checked={preferences.channels.email} onChange={(value) => setPreferences((current) => ({ ...current, channels: { ...current.channels, email: value } }))} />
                    <ToggleRow title="SMS" description="Critical updates on mobile" checked={preferences.channels.sms} onChange={(value) => setPreferences((current) => ({ ...current, channels: { ...current.channels, sms: value } }))} />
                    <ToggleRow title="Push" description="Browser and app notifications" checked={preferences.channels.push} onChange={(value) => setPreferences((current) => ({ ...current, channels: { ...current.channels, push: value } }))} />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button type="button" onClick={() => void submitPreferences()} disabled={savingPreferences} className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70">
                      <Save size={16} />
                      {savingPreferences ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </section>
              </div>
            ) : null}
    </section>
  )
}
