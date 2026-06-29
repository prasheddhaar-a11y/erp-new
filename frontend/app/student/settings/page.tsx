/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Settings
Purpose     : Inner content for /student/settings.
              The portal shell (navbar, sidebar, layout)
              is provided by ../layout.tsx — this file
              renders only the scrollable page content.
              Standalone Settings page matching design.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

/* =====================================================
   SECTION: IMPORTS
===================================================== */

import { Edit3, Eye, EyeOff, KeyRound, Save } from "lucide-react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { apiRequest, getStoredSessionValue, storeSessionValue } from "@/lib/api"
import type { ProfileDropdownUser } from "@/components/profile/ProfileAvatarDropdown"

/* =====================================================
   SECTION: TYPES
===================================================== */

type ActiveTab = "profile" | "password" | "preferences"

type ProfileForm = {
  studentUserName: string
  username: string
  dateOfBirth: string
  gender: string
  parentName: string
  parentEmail: string
  parentContactNumber: string
  standardCourseBatch: string
  mobileNumber: string
  alternateContact: string
  email: string
  residentialAddress: string
  city: string
  state: string
  pincode: string
  permanentAddress: string
  area: string
  schoolCollegeName: string
}

type StudentProfile = ProfileDropdownUser & {
  display_code?: string | null
  date_of_birth?: string | null
  gender?: string | null
  address?: string | null
  parent_name?: string | null
  parent_phone?: string | null
  emergency_contact?: string | null
  course_enrolled?: string | null
  batch_name?: string | null
  trainer_name?: string | null
  document_status?: string | null
}

/* =====================================================
   SECTION: CONSTANTS
===================================================== */

const emptyProfileForm: ProfileForm = {
  studentUserName: "",
  username: "",
  dateOfBirth: "",
  gender: "",
  parentName: "",
  parentEmail: "",
  parentContactNumber: "",
  standardCourseBatch: "",
  mobileNumber: "",
  alternateContact: "",
  email: "",
  residentialAddress: "",
  city: "",
  state: "",
  pincode: "",
  permanentAddress: "",
  area: "",
  schoolCollegeName: "",
}

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Change Password" },
  { id: "preferences", label: "Preferences" },
]

/* =====================================================
   SECTION: HELPER FUNCTIONS
===================================================== */

function readCachedProfile(): StudentProfile | null {
  if (typeof window === "undefined") return null
  const raw =
    window.localStorage.getItem("pinesphere_profile") ??
    window.sessionStorage.getItem("pinesphere_profile") ??
    window.localStorage.getItem("pinesphere_user") ??
    window.sessionStorage.getItem("pinesphere_user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as StudentProfile
  } catch {
    return null
  }
}

function profileToForm(profile: StudentProfile): ProfileForm {
  return {
    ...emptyProfileForm,
    studentUserName: profile.full_name || "",
    username: profile.email?.split("@")[0] || "",
    dateOfBirth: profile.date_of_birth || "",
    gender: profile.gender || "",
    parentName: profile.parent_name || "",
    parentContactNumber: profile.parent_phone || "",
    standardCourseBatch: [profile.course_enrolled, profile.batch_name].filter(Boolean).join(" / "),
    mobileNumber: profile.phone || "",
    alternateContact: profile.emergency_contact || "",
    email: profile.email || "",
    residentialAddress: profile.address || "",
  }
}

/* =====================================================
   SECTION: HELPER COMPONENTS
===================================================== */

function TabButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 font-black text-sm transition ${
        isActive
          ? "border-[var(--pinesphere-green)] text-[var(--pinesphere-green)]"
          : "border-transparent text-[#64748b] hover:text-[#071129]"
      }`}
    >
      {label}
    </button>
  )
}

function FormGroup({
  label,
  children,
  required = false,
  className = "",
}: {
  label: string
  children: ReactNode
  required?: boolean
  className?: string
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-xs font-black uppercase text-[#64748b]">
        {label}
        {required ? <span className="text-[#ef4444]">*</span> : null}
      </label>
      {children}
    </div>
  )
}

function FormInput({
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-[8px] border border-[#dfe8e5] bg-white px-3 py-2.5 text-sm font-black text-[#071129] placeholder:text-[#cbd5e1] focus:border-[var(--pinesphere-green)] focus:outline-none focus:ring-1 focus:ring-[var(--pinesphere-green-light)] disabled:bg-[#f8fafc] disabled:text-[#64748b]"
    />
  )
}

function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  disabled = false,
}: {
  value: string
  onChange: (val: string) => void
  options: Array<{ label: string; value: string }>
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-[8px] border border-[#dfe8e5] bg-white px-3 py-2.5 text-sm font-black text-[#071129] focus:border-[var(--pinesphere-green)] focus:outline-none focus:ring-1 focus:ring-[var(--pinesphere-green-light)] disabled:bg-[#f8fafc] disabled:text-[#64748b]"
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  )
}

/* =====================================================
   SECTION: PAGE COMPONENT
===================================================== */

export default function StudentSettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile")
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfileForm>(emptyProfileForm)
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
    showOld: false,
    showNew: false,
    showConfirm: false,
  })
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)

  /* ── Load profile on mount ── */
  useEffect(() => {
    queueMicrotask(() => {
      const cached = readCachedProfile()
      if (cached) {
        setFormData(profileToForm(cached))
      }
    })
  }, [])

  const handleFormChange = (field: keyof ProfileForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      setErrorMessage("")
      setSuccessMessage("")

      const accessToken = getStoredSessionValue("pinesphere_access_token")
      if (!accessToken) throw new Error("You are not signed in. Please log in again.")

      const payload = {
        full_name: formData.studentUserName.trim(),
        phone: formData.mobileNumber.trim() || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
        address: formData.residentialAddress.trim() || null,
        parent_name: formData.parentName.trim() || null,
        parent_phone: formData.parentContactNumber.trim() || null,
        emergency_contact: formData.alternateContact.trim() || null,
      }

      await apiRequest<StudentProfile>("/profile/me", accessToken, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const freshProfile = await apiRequest<StudentProfile>("/profile/me", accessToken)
      const rememberMe = Boolean(window.localStorage.getItem("pinesphere_access_token"))
      storeSessionValue("pinesphere_profile", JSON.stringify(freshProfile), rememberMe)
      setFormData(profileToForm(freshProfile))
      setSuccessMessage("Profile changes saved successfully!")
      setIsEditing(false)
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save profile changes.")
      setTimeout(() => setErrorMessage(""), 5000)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleChangePassword = () => {
    if (!passwordData.newPassword) {
      alert("Please enter a new password")
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match")
      return
    }
    setSuccessMessage("Password changed successfully!")
    setPasswordData({
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      showOld: false,
      showNew: false,
      showConfirm: false,
    })
    setTimeout(() => setSuccessMessage(""), 3000)
  }

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-[#64748b]">Account Settings</p>
            <h1 className="text-2xl font-black text-[#071129]">Settings</h1>
          </div>
          {isEditing && activeTab === "profile" ? (
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--pinesphere-green)] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0d8a5c]"
            >
              <Save size={16} />
              {savingProfile ? "Saving..." : "Save Changes"}
            </button>
          ) : activeTab === "profile" ? (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#071129] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0a1b35]"
            >
              <Edit3 size={16} />
              Edit
            </button>
          ) : null}
        </div>
      </motion.div>

      {/* Success message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 rounded-[10px] border border-[#dcfce7] bg-[#f0fdf4] px-4 py-3 text-sm font-black text-[#166534]"
        >
          ✓ {successMessage}
        </motion.div>
      )}

      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mb-4 rounded-[10px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-black text-[#dc2626]"
        >
          {errorMessage}
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.28 }}
        className="mb-6 border-b border-[#edf3f1]"
      >
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              isActive={activeTab === tab.id}
              label={tab.label}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Personal Details */}
            <Card>
              <div className="border-b border-[#edf3f1] px-6 py-4">
                <h2 className="text-sm font-black text-[#071129]">Personal Details</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormGroup label="Student/User Name" required>
                    <FormInput
                      value={formData.studentUserName}
                      onChange={(val) => handleFormChange("studentUserName", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Username" required>
                    <FormInput
                      value={formData.username}
                      onChange={(val) => handleFormChange("username", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormGroup label="Date of Birth" required>
                    <FormInput
                      type="text"
                      value={formData.dateOfBirth}
                      onChange={(val) => handleFormChange("dateOfBirth", val)}
                      placeholder="dd-mm-yyyy"
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Gender" required>
                    <FormSelect
                      value={formData.gender}
                      onChange={(val) => handleFormChange("gender", val)}
                      options={[
                        { label: "Male", value: "male" },
                        { label: "Female", value: "female" },
                        { label: "Other", value: "other" },
                      ]}
                      placeholder="Select"
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormGroup label="Mobile Number">
                    <FormInput
                      value={formData.mobileNumber}
                      onChange={(val) => handleFormChange("mobileNumber", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Alternate Contact">
                    <FormInput
                      value={formData.alternateContact}
                      onChange={(val) => handleFormChange("alternateContact", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </div>
                <FormGroup label="Email" required>
                  <FormInput
                    type="email"
                    value={formData.email}
                    onChange={(val) => handleFormChange("email", val)}
                    disabled={!isEditing}
                  />
                </FormGroup>
                <FormGroup label="Residential Address">
                  <FormInput
                    value={formData.residentialAddress}
                    onChange={(val) => handleFormChange("residentialAddress", val)}
                    disabled={!isEditing}
                  />
                </FormGroup>
                <div className="grid gap-4 md:grid-cols-4">
                  <FormGroup label="City">
                    <FormInput
                      value={formData.city}
                      onChange={(val) => handleFormChange("city", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="State">
                    <FormInput
                      value={formData.state}
                      onChange={(val) => handleFormChange("state", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Pincode">
                    <FormInput
                      value={formData.pincode}
                      onChange={(val) => handleFormChange("pincode", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Area">
                    <FormInput
                      value={formData.area}
                      onChange={(val) => handleFormChange("area", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </div>
              </div>
            </Card>

            {/* Parent Details */}
            <Card>
              <div className="border-b border-[#edf3f1] px-6 py-4">
                <h2 className="text-sm font-black text-[#071129]">Parent Details</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormGroup label="Parent Name">
                    <FormInput
                      value={formData.parentName}
                      onChange={(val) => handleFormChange("parentName", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                  <FormGroup label="Parent Email">
                    <FormInput
                      type="email"
                      value={formData.parentEmail}
                      onChange={(val) => handleFormChange("parentEmail", val)}
                      disabled={!isEditing}
                    />
                  </FormGroup>
                </div>
                <FormGroup label="Parent Contact Number">
                  <FormInput
                    value={formData.parentContactNumber}
                    onChange={(val) => handleFormChange("parentContactNumber", val)}
                    disabled={!isEditing}
                  />
                </FormGroup>
              </div>
            </Card>

            {/* Education Details */}
            <Card>
              <div className="border-b border-[#edf3f1] px-6 py-4">
                <h2 className="text-sm font-black text-[#071129]">Education Details</h2>
              </div>
              <div className="space-y-4 p-6">
                <FormGroup label="Standard / Course / Batch">
                  <FormInput
                    value={formData.standardCourseBatch}
                    onChange={(val) => handleFormChange("standardCourseBatch", val)}
                    disabled={!isEditing}
                  />
                </FormGroup>
                <FormGroup label="School/College Name">
                  <FormInput
                    value={formData.schoolCollegeName}
                    onChange={(val) => handleFormChange("schoolCollegeName", val)}
                    disabled={!isEditing}
                  />
                </FormGroup>
              </div>
            </Card>
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <Card>
            <div className="border-b border-[#edf3f1] px-6 py-4">
              <h2 className="text-sm font-black text-[#071129]">Change Password</h2>
            </div>
            <div className="space-y-4 p-6">
              <FormGroup label="Current Password" required>
                <div className="relative">
                  <FormInput
                    type={passwordData.showOld ? "text" : "password"}
                    value={passwordData.oldPassword}
                    onChange={(val) => setPasswordData({ ...passwordData, oldPassword: val })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData({ ...passwordData, showOld: !passwordData.showOld })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#071129]"
                  >
                    {passwordData.showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormGroup>
              <FormGroup label="New Password" required>
                <div className="relative">
                  <FormInput
                    type={passwordData.showNew ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(val) => setPasswordData({ ...passwordData, newPassword: val })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData({ ...passwordData, showNew: !passwordData.showNew })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#071129]"
                  >
                    {passwordData.showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormGroup>
              <FormGroup label="Confirm Password" required>
                <div className="relative">
                  <FormInput
                    type={passwordData.showConfirm ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(val) => setPasswordData({ ...passwordData, confirmPassword: val })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordData({ ...passwordData, showConfirm: !passwordData.showConfirm })}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#071129]"
                  >
                    {passwordData.showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormGroup>
              <div className="pt-4">
                <button
                  onClick={handleChangePassword}
                  className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--pinesphere-green)] px-6 py-2.5 text-sm font-black text-white transition hover:bg-[#0d8a5c]"
                >
                  <KeyRound size={18} />
                  Update Password
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* Preferences Tab */}
        {activeTab === "preferences" && (
          <Card>
            <div className="border-b border-[#edf3f1] px-6 py-4">
              <h2 className="text-sm font-black text-[#071129]">Preferences</h2>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-[10px] border border-[#dbeafe] bg-[#eff6ff] p-4 text-sm text-[#1e40af]">
                <p className="font-black">Notification preferences coming soon.</p>
                <p className="text-xs">We are working on customization options for your learning experience.</p>
              </div>
            </div>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
