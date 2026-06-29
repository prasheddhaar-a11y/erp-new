"use client"

/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : TrainerSettingsPage.tsx
 * Purpose     : Trainer-specific settings UI.
 *               Profile tab shows only trainer-relevant fields.
 *               Password and Preferences tabs are role-agnostic and behave
 *               identically to the shared settings page.
 */

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

import { useToast } from "@/components/ui/toast"

import {
  changeProfilePassword,
  defaultPreferences,
  emptyTrainerProfileForm,
  loadProfilePreferences,
  loadTrainerProfileSettings,
  saveProfilePreferences,
  saveTrainerProfileSettings,
  trySetAutomaticTimezone,
  type ProfilePreferences,
  type TrainerProfileForm,
} from "@/modules/trainers/services/trainerSettingsService"

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "profile" | "password" | "preferences"
type TrainerProfileFieldKey = keyof TrainerProfileForm

// ─── Field config ─────────────────────────────────────────────────────────────

const requiredFields: TrainerProfileFieldKey[] = [
  "fullName",
  "username",
  "mobileNumber",
  "email",
]

const fieldLabels: Record<TrainerProfileFieldKey, string> = {
  fullName: "Full Name",
  username: "Username",
  dateOfBirth: "Date of Birth",
  gender: "Gender",
  mobileNumber: "Mobile Number",
  alternateContact: "Alternate Contact",
  email: "Email",
  city: "City",
  state: "State",
  pincode: "Pincode",
  residentialAddress: "Residential Address",
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const inputClass =
  "h-10 w-full rounded-md border border-[var(--pinesphere-green-border)] bg-white px-3 text-sm font-semibold text-[var(--pinesphere-navy)] shadow-inner shadow-[#edf6e8]/60 transition placeholder:text-[#9aa8a0] focus:border-[var(--pinesphere-green)] focus:outline-none focus:ring-2 focus:ring-[rgba(11,122,90,0.18)] disabled:cursor-not-allowed disabled:bg-[#f6faf3] disabled:text-[#64748b]"
const textareaClass = `${inputClass} min-h-20 resize-y py-2`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validateTrainerProfile(form: TrainerProfileForm) {
  const errors: Partial<Record<TrainerProfileFieldKey, string>> = {}
  for (const field of requiredFields) {
    if (!form[field].trim()) errors[field] = `${fieldLabels[field]} is required`
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address"
  }
  if (form.pincode && !/^\d{4,10}$/.test(form.pincode)) {
    errors.pincode = "Enter a valid pincode"
  }
  return errors
}

function passwordRequirements(password: string) {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /\d/.test(password) },
    { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
      <h2 className="mb-3 text-base font-black text-[#17210f]">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
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
  fullWidth = false,
}: {
  field: TrainerProfileFieldKey
  value: string
  onChange: (field: TrainerProfileFieldKey, value: string) => void
  editing: boolean
  error?: string
  type?: string
  options?: string[]
  multiline?: boolean
  fullWidth?: boolean
}) {
  const label = fieldLabels[field]
  const isRequired = requiredFields.includes(field)

  return (
    <div className={fullWidth ? "sm:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">
        {label}
        {isRequired && <span className="ml-1 text-red-500">*</span>}
      </label>
      {!editing ? (
        <p className="min-h-10 rounded-md border border-[#e5eedf] bg-[#fbfdf8] px-3 py-2.5 text-sm font-semibold text-[#334155]">
          {value || <span className="text-[#9aa8a0]">—</span>}
        </p>
      ) : options ? (
        <select
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={inputClass}
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={textareaClass}
          placeholder={label}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(field, e.target.value)}
          className={inputClass}
          placeholder={label}
        />
      )}
      {error && <p className="mt-1 text-xs font-bold text-red-500">{error}</p>}
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
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} pr-10`}
          placeholder={label}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#334155]"
          tabIndex={-1}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-[#e5eedf] bg-[#fbfdf8] px-3 py-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-[#cbd5e1] accent-[var(--pinesphere-green)]"
      />
      <div>
        <p className="text-sm font-black text-[#17210f]">{title}</p>
        {description && (
          <p className="text-xs font-semibold text-[#64748b]">{description}</p>
        )}
      </div>
    </label>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TrainerSettingsPage() {
  const { addToast } = useToast()

  const [activeTab, setActiveTab] = useState<ActiveTab>("profile")
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState<TrainerProfileForm>(emptyTrainerProfileForm)
  const [savedForm, setSavedForm] = useState<TrainerProfileForm>(emptyTrainerProfileForm)
  const [errors, setErrors] = useState<Partial<Record<TrainerProfileFieldKey, string>>>({})

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const [changingPassword, setChangingPassword] = useState(false)

  const [preferences, setPreferences] = useState<ProfilePreferences>(defaultPreferences)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const requirements = passwordRequirements(passwordForm.newPassword)

  // ── Load on mount ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [{ form: loadedForm }, loadedPrefs] = await Promise.all([
          loadTrainerProfileSettings(),
          loadProfilePreferences(),
        ])
        if (cancelled) return
        const withTz = await trySetAutomaticTimezone(loadedPrefs)
        setForm(loadedForm)
        setSavedForm(loadedForm)
        setPreferences(withTz)
      } catch (error) {
        if (cancelled) return
        addToast(error instanceof Error ? error.message : "Failed to load settings", "error")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [addToast])

  // ── Form handlers ───────────────────────────────────────────────────────────

  function updateField(field: TrainerProfileFieldKey, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function cancelEdit() {
    setForm(savedForm)
    setErrors({})
    setEditing(false)
  }

  async function submitProfile() {
    const validationErrors = validateTrainerProfile(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setSaving(true)
    try {
      await saveTrainerProfileSettings(form)
      setSavedForm(form)
      setEditing(false)
      addToast("Profile updated successfully", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save profile", "error")
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword() {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      addToast("All password fields are required", "error")
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      addToast("New passwords do not match", "error")
      return
    }
    if (!requirements.every((r) => r.met)) {
      addToast("Password does not meet all requirements", "error")
      return
    }
    setChangingPassword(true)
    try {
      await changeProfilePassword(passwordForm)
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
      addToast("Password changed successfully", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to change password", "error")
    } finally {
      setChangingPassword(false)
    }
  }

  async function submitPreferences() {
    setSavingPreferences(true)
    try {
      await saveProfilePreferences(preferences)
      addToast("Preferences saved", "success")
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to save preferences", "error")
    } finally {
      setSavingPreferences(false)
    }
  }

  async function setAutomaticTimezone(enabled: boolean) {
    const updated = { ...preferences, automaticTimezone: enabled }
    const withTz = enabled ? await trySetAutomaticTimezone(updated) : updated
    setPreferences(withTz)
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <section className="w-full">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#0F172A]">Settings</h1>
          <p className="text-sm font-semibold text-[#64748B]">Manage your profile, password, and preferences</p>
        </div>
        {activeTab === "profile" && !loading && (
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-black text-[#334155] hover:bg-[#f8fafc]"
                >
                  <X size={16} />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void submitProfile()}
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)]"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-1 flex gap-1 rounded-xl border border-[#dde9e4] bg-white p-1 shadow-sm">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => { setActiveTab(id); setEditing(false); setErrors({}) }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-black transition ${
              activeTab === id
                ? "bg-[var(--pinesphere-green)] text-white shadow"
                : "text-[#52634b] hover:bg-[#f0f7f4]"
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-4 rounded-lg border border-[#dde8d2] bg-white p-6 text-sm font-bold text-[#64748b] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          Loading settings...
        </div>
      )}

      {/* Profile tab */}
      {!loading && activeTab === "profile" && (
        <div className="mt-4 grid gap-3">
          <SectionCard title="Personal Details">
            <ProfileField field="fullName" value={form.fullName} onChange={updateField} editing={editing} error={errors.fullName} />
            <ProfileField field="username" value={form.username} onChange={updateField} editing={editing} error={errors.username} />
            <ProfileField field="dateOfBirth" value={form.dateOfBirth} onChange={updateField} editing={editing} error={errors.dateOfBirth} type="date" />
            <ProfileField field="gender" value={form.gender} onChange={updateField} editing={editing} error={errors.gender} options={["Female", "Male", "Non-binary", "Prefer not to say"]} />
          </SectionCard>

          <SectionCard title="Contact Details">
            <ProfileField field="mobileNumber" value={form.mobileNumber} onChange={updateField} editing={editing} error={errors.mobileNumber} />
            <ProfileField field="alternateContact" value={form.alternateContact} onChange={updateField} editing={editing} error={errors.alternateContact} />
            <ProfileField field="email" value={form.email} onChange={updateField} editing={editing} error={errors.email} type="email" />
            <ProfileField field="city" value={form.city} onChange={updateField} editing={editing} error={errors.city} />
            <ProfileField field="state" value={form.state} onChange={updateField} editing={editing} error={errors.state} />
            <ProfileField field="pincode" value={form.pincode} onChange={updateField} editing={editing} error={errors.pincode} />
            <ProfileField field="residentialAddress" value={form.residentialAddress} onChange={updateField} editing={editing} error={errors.residentialAddress} multiline fullWidth />
          </SectionCard>
        </div>
      )}

      {/* Password tab */}
      {!loading && activeTab === "password" && (
        <div className="mt-4 rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="grid gap-3">
              <PasswordInput
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(value) => setPasswordForm((c) => ({ ...c, currentPassword: value }))}
                visible={passwordVisible.current}
                onToggle={() => setPasswordVisible((c) => ({ ...c, current: !c.current }))}
              />
              <PasswordInput
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(value) => setPasswordForm((c) => ({ ...c, newPassword: value }))}
                visible={passwordVisible.next}
                onToggle={() => setPasswordVisible((c) => ({ ...c, next: !c.next }))}
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwordForm.confirmPassword}
                onChange={(value) => setPasswordForm((c) => ({ ...c, confirmPassword: value }))}
                visible={passwordVisible.confirm}
                onToggle={() => setPasswordVisible((c) => ({ ...c, confirm: !c.confirm }))}
              />
              <div className="mt-1 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void submitPassword()}
                  disabled={changingPassword}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70"
                >
                  <ShieldCheck size={16} />
                  {changingPassword ? "Changing..." : "Change Password"}
                </button>
                <button
                  type="button"
                  onClick={() => setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })}
                  className="inline-flex h-10 items-center rounded-md border border-[#cbd5e1] bg-white px-4 text-sm font-black text-[#334155] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
              </div>
            </div>
            <aside className="rounded-md border border-[#e5eedf] bg-[#fbfdf8] p-4">
              <h3 className="text-sm font-black text-[#17210f]">Password requirements</h3>
              <div className="mt-3 grid gap-2">
                {requirements.map((req) => (
                  <p
                    key={req.label}
                    className={`flex items-center gap-2 text-xs font-bold ${req.met ? "text-[var(--pinesphere-green)]" : "text-[#64748b]"}`}
                  >
                    <CheckCircle2 size={15} />
                    {req.label}
                  </p>
                ))}
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* Preferences tab */}
      {!loading && activeTab === "preferences" && (
        <div className="mt-4 grid gap-3">
          <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-base font-black">Timezone</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-[#52634b]">Timezone</span>
                <select
                  value={preferences.timezone}
                  onChange={(e) => setPreferences((c) => ({ ...c, timezone: e.target.value }))}
                  disabled={preferences.automaticTimezone}
                  className={inputClass}
                >
                  {timezones.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-3 rounded-md border border-[#e5eedf] bg-[#fbfdf8] px-3 py-2.5 text-sm font-black text-[#17210f]">
                <input
                  type="checkbox"
                  checked={preferences.automaticTimezone}
                  onChange={(e) => void setAutomaticTimezone(e.target.checked)}
                  className="h-4 w-4 rounded border-[#cbd5e1] accent-[var(--pinesphere-green)]"
                />
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
              <ToggleRow title="Session reminder 1 hour before" checked={preferences.notifications.sessionReminderHour} onChange={(v) => setPreferences((c) => ({ ...c, notifications: { ...c.notifications, sessionReminderHour: v } }))} />
              <ToggleRow title="Session reminder 1 day before" checked={preferences.notifications.sessionReminderDay} onChange={(v) => setPreferences((c) => ({ ...c, notifications: { ...c.notifications, sessionReminderDay: v } }))} />
              <ToggleRow title="Session start notification" checked={preferences.notifications.sessionStart} onChange={(v) => setPreferences((c) => ({ ...c, notifications: { ...c.notifications, sessionStart: v } }))} />
              <ToggleRow title="Promotional campaigns" checked={preferences.notifications.promotionalCampaigns} onChange={(v) => setPreferences((c) => ({ ...c, notifications: { ...c.notifications, promotionalCampaigns: v } }))} />
            </div>
          </section>

          <section className="rounded-lg border border-[#deead6] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-base font-black">Notification Channels</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ToggleRow title="WhatsApp" description="Session reminders and quick alerts" checked={preferences.channels.whatsapp} onChange={(v) => setPreferences((c) => ({ ...c, channels: { ...c.channels, whatsapp: v } }))} />
              <ToggleRow title="Email" description="Receipts, notices, and account updates" checked={preferences.channels.email} onChange={(v) => setPreferences((c) => ({ ...c, channels: { ...c.channels, email: v } }))} />
              <ToggleRow title="SMS" description="Critical updates on mobile" checked={preferences.channels.sms} onChange={(v) => setPreferences((c) => ({ ...c, channels: { ...c.channels, sms: v } }))} />
              <ToggleRow title="Push" description="Browser and app notifications" checked={preferences.channels.push} onChange={(v) => setPreferences((c) => ({ ...c, channels: { ...c.channels, push: v } }))} />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => void submitPreferences()}
                disabled={savingPreferences}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--pinesphere-green)] px-4 text-sm font-black text-white shadow-sm hover:bg-[var(--pinesphere-green-hover)] disabled:cursor-wait disabled:opacity-70"
              >
                <Save size={16} />
                {savingPreferences ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  )
}