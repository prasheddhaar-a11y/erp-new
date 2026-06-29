"use client"

import { useState, useEffect, type ReactNode } from "react"
import { Check, ChevronRight, CheckCircle2, User, BookOpen, FileText, UploadCloud, ChevronLeft, Building2 } from "lucide-react"
import { apiRequest } from "@/app/shared/api"

// Helper for conditional classes
function cx(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ")
}

type AdmissionDraft = {
  student_name: string
  phone: string
  email: string
  city: string
  course: string
  batch: string
  mode: string
  branch: string
  remarks: string
  notes: string
}

const defaultDraft: AdmissionDraft = {
  student_name: "",
  phone: "",
  email: "",
  city: "",
  course: "",
  batch: "",
  mode: "Offline",
  branch: "",
  remarks: "",
  notes: ""
}

export function MultiStepAdmissionForm({ onSuccess, onCancel }: { onSuccess?: (id: string) => void; onCancel?: () => void }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<AdmissionDraft>(defaultDraft)
  const [loading, setLoading] = useState(true) // For mounting and loading draft
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [error, setError] = useState("")

  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("admission_draft")
      if (saved) {
        setFormData(JSON.parse(saved))
      }
    } catch (e) {
      console.error("Failed to load draft")
    }
    setLoading(false)
  }, [])

  // Auto-save draft when formData changes
  useEffect(() => {
    if (!loading && !successId) {
      localStorage.setItem("admission_draft", JSON.stringify(formData))
    }
  }, [formData, loading, successId])

  const handleInput = (key: keyof AdmissionDraft, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const nextStep = () => {
    if (step === 1 && (!formData.student_name || !formData.phone)) {
      setError("Name and Phone are required.")
      return
    }
    if (step === 2 && (!formData.course || !formData.branch)) {
      setError("Course and Branch are required.")
      return
    }
    setError("")
    setStep((s) => Math.min(4, s + 1))
  }

  const prevStep = () => {
    setError("")
    setStep((s) => Math.max(1, s - 1))
  }

  const handleBack = () => {
    if (step === 1) {
      if (onCancel) onCancel()
    } else {
      prevStep()
    }
  }

  const handleSubmit = async () => {
    if (!formData.student_name || !formData.course) {
      setError("Please fill all required fields before submitting.")
      return
    }
    
    setSubmitting(true)
    setError("")
    
    try {
      // Simulate API call using apiRequest if backend exists, or just simulate
      const response = await apiRequest<{ id: string }>(`/admissions`, "", {
        method: "POST",
        body: JSON.stringify({
          student_name: formData.student_name,
          phone: formData.phone,
          email: formData.email,
          course_interest: formData.course,
          notes: `Batch: ${formData.batch || "Not specified"}\nMode: ${formData.mode || "Not specified"}\nRemarks: ${formData.remarks || "None"}\n\nNotes:\n${formData.notes || "None"}`,
          branch_id: formData.branch,
          stage: "Approved"
        }),
      })

      const newId = response.id || `ADM-${Math.floor(1000 + Math.random() * 9000)}`
      setSuccessId(newId)
      localStorage.removeItem("admission_draft")
      if (onSuccess) {
        onSuccess(newId)
      }
    } catch (err: any) {
      setError(err.message || "Failed to submit admission.")
    } finally {
      setSubmitting(false)
    }
  }

  const startNew = () => {
    setFormData(defaultDraft)
    setStep(1)
    setSuccessId(null)
  }

  if (loading) return null

  if (successId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-500">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50 mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-3xl font-black text-[#071B4A] tracking-tight">Admission Registered!</h2>
        <p className="mt-3 max-w-md text-sm font-semibold text-slate-500">
          The admission workflow has been successfully initiated. The student details have been recorded securely in the CRM.
        </p>
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Admission ID</p>
          <p className="text-xl font-black text-[#071B4A] tracking-widest">{successId}</p>
        </div>
        <div className="mt-8 flex gap-4">
          <button onClick={startNew} className="rounded-lg bg-[#0B7A5A] px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#096349]">
            Register Another Student
          </button>
          {onCancel && (
            <button onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-md transition hover:bg-slate-50">
              Go to Admission List
            </button>
          )}
        </div>
      </div>
    )
  }

  const steps = [
    { num: 1, title: "Student Info", icon: User },
    { num: 2, title: "Course Details", icon: BookOpen },
    { num: 3, title: "Additional", icon: FileText },
    { num: 4, title: "Review", icon: CheckCircle2 },
  ]

  return (
    <div className="mx-auto max-w-3xl rounded-[16px] bg-white p-6 shadow-xl shadow-[#071B4A]/5 sm:p-10 border border-slate-100">
      
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-black text-[#071B4A] md:text-3xl tracking-tight">New Admission Workflow</h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">Complete the steps below to securely enroll a new student.</p>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-12 flex justify-between">
        <div className="absolute left-0 top-1/2 -z-10 h-1 w-full -translate-y-1/2 rounded-full bg-slate-100">
          <div 
            className="h-full rounded-full bg-[#0B7A5A] transition-all duration-500 ease-in-out" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
        </div>
        {steps.map((s) => {
          const isActive = step === s.num
          const isPast = step > s.num
          const Icon = s.icon
          return (
            <div key={s.num} className="flex flex-col items-center gap-2">
              <div className={cx(
                "grid h-12 w-12 place-items-center rounded-full border-4 bg-white transition-all duration-300",
                isActive ? "border-[#0B7A5A] text-[#0B7A5A] scale-110 shadow-md" : 
                isPast ? "border-[#0B7A5A] bg-[#0B7A5A] text-white" : 
                "border-slate-100 text-slate-300"
              )}>
                {isPast ? <Check size={20} strokeWidth={3} /> : <Icon size={20} strokeWidth={isActive ? 3 : 2} />}
              </div>
              <span className={cx(
                "absolute -bottom-6 text-[11px] font-black tracking-wide uppercase transition-colors duration-300",
                isActive ? "text-[#0B7A5A]" : isPast ? "text-slate-700" : "text-slate-400"
              )}>
                {s.title}
              </span>
            </div>
          )
        })}
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100 animate-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="min-h-[320px]">
        {/* Step 1: Student Info */}
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-black text-[#071B4A] mb-4 border-b border-slate-100 pb-2">Student Information</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <FloatingInput id="student_name" label="Full Name *" value={formData.student_name} onChange={(v) => handleInput("student_name", v)} />
              <FloatingInput id="phone" label="Phone Number *" value={formData.phone} onChange={(v) => handleInput("phone", v)} type="tel" />
              <FloatingInput id="email" label="Email Address" value={formData.email} onChange={(v) => handleInput("email", v)} type="email" />
              <FloatingInput id="city" label="City / Region" value={formData.city} onChange={(v) => handleInput("city", v)} />
            </div>
          </div>
        )}

        {/* Step 2: Course Info */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-black text-[#071B4A] mb-4 border-b border-slate-100 pb-2">Course Details</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <FloatingSelect id="course" label="Select Course *" value={formData.course} onChange={(v) => handleInput("course", v)} options={["Full Stack Development", "Data Science", "Digital Marketing", "AI & Robotics", "Cloud Computing"]} />
              <FloatingSelect id="branch" label="Branch / Campus *" value={formData.branch} onChange={(v) => handleInput("branch", v)} options={["Pinesphere Kochi", "Pinesphere Bangalore", "Pinesphere Dubai", "Online Remote"]} />
              <FloatingSelect id="mode" label="Learning Mode" value={formData.mode} onChange={(v) => handleInput("mode", v)} options={["Online", "Offline", "Hybrid"]} />
              <FloatingInput id="batch" label="Preferred Batch" value={formData.batch} onChange={(v) => handleInput("batch", v)} placeholder="e.g. Weekend Batch" />
            </div>
          </div>
        )}

        {/* Step 3: Additional */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-black text-[#071B4A] mb-4 border-b border-slate-100 pb-2">Additional Details & Documents</h3>
            <div className="grid gap-6">
              <div className="relative">
                <textarea id="notes" rows={3} value={formData.notes} onChange={(e) => handleInput("notes", e.target.value)} className="peer block w-full resize-none rounded-lg border-2 border-slate-200 bg-transparent px-4 pb-3 pt-6 text-sm font-semibold text-slate-900 transition focus:border-[#0B7A5A] focus:outline-none" placeholder=" " />
                <label htmlFor="notes" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm font-black text-slate-500 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#0B7A5A]">Counsellor Notes</label>
              </div>
              <div className="relative">
                <textarea id="remarks" rows={2} value={formData.remarks} onChange={(e) => handleInput("remarks", e.target.value)} className="peer block w-full resize-none rounded-lg border-2 border-slate-200 bg-transparent px-4 pb-3 pt-6 text-sm font-semibold text-slate-900 transition focus:border-[#0B7A5A] focus:outline-none" placeholder=" " />
                <label htmlFor="remarks" className="absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm font-black text-slate-500 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#0B7A5A]">Special Remarks / Fee Discounts</label>
              </div>

              {/* Mock Upload Box */}
              <div className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-8 transition hover:border-[#0B7A5A] hover:bg-[#0B7A5A]/5">
                <UploadCloud className="mb-3 text-slate-400" size={32} />
                <p className="text-sm font-black text-slate-600">Click to upload student documents</p>
                <p className="mt-1 text-xs font-semibold text-slate-400">PDF, JPG up to 10MB</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-black text-[#071B4A] mb-4 border-b border-slate-100 pb-2">Review & Submit</h3>
            <div className="grid gap-4 md:grid-cols-2 rounded-xl bg-slate-50 p-6 border border-slate-100">
              <ReviewRow label="Student Name" value={formData.student_name} />
              <ReviewRow label="Phone" value={formData.phone} />
              <ReviewRow label="Email" value={formData.email} />
              <ReviewRow label="City" value={formData.city} />
              <div className="col-span-full my-2 border-t border-slate-200" />
              <ReviewRow label="Course" value={formData.course} />
              <ReviewRow label="Branch" value={formData.branch} />
              <ReviewRow label="Mode" value={formData.mode} />
              <ReviewRow label="Batch" value={formData.batch} />
              <div className="col-span-full my-2 border-t border-slate-200" />
              <ReviewRow label="Notes" value={formData.notes || "None"} className="col-span-full" />
              <ReviewRow label="Remarks" value={formData.remarks || "None"} className="col-span-full" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
        <button 
          onClick={handleBack} 
          disabled={(step === 1 && !onCancel) || submitting}
          className="flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-black text-slate-500 transition hover:bg-slate-100 disabled:opacity-0"
        >
          <ChevronLeft size={16} /> Back
        </button>
        
        {step < 4 ? (
          <button 
            onClick={nextStep}
            className="flex h-11 items-center gap-2 rounded-lg bg-[#071B4A] px-6 text-sm font-black text-white shadow-md transition hover:bg-slate-800"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={submitting}
            className="flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-8 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#096349] disabled:opacity-70"
          >
            {submitting ? "Processing..." : "Confirm & Submit Admission"} <CheckCircle2 size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function FloatingInput({ id, label, value, onChange, type = "text", placeholder = " " }: { id: string; label: string; value: string; onChange: (val: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="relative">
      <input type={type} id={id} value={value} onChange={(e) => onChange(e.target.value)} className="peer block w-full appearance-none rounded-lg border-2 border-slate-200 bg-transparent px-4 pb-2.5 pt-6 text-sm font-semibold text-slate-900 transition focus:border-[#0B7A5A] focus:outline-none focus:ring-0" placeholder={placeholder} />
      <label htmlFor={id} className="absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm font-black text-slate-500 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#0B7A5A]">{label}</label>
    </div>
  )
}

function FloatingSelect({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (val: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="peer block w-full appearance-none rounded-lg border-2 border-slate-200 bg-transparent px-4 pb-2.5 pt-6 text-sm font-semibold text-slate-900 transition focus:border-[#0B7A5A] focus:outline-none focus:ring-0">
        <option value="" disabled hidden></option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <label htmlFor={id} className="absolute left-4 top-4 z-10 origin-[0] -translate-y-3 scale-75 transform text-sm font-black text-slate-500 transition-all duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-3 peer-focus:scale-75 peer-focus:text-[#0B7A5A]">{label}</label>
      <ChevronDown className="absolute right-4 top-5 pointer-events-none text-slate-400" size={16} />
    </div>
  )
}

function ChevronDown(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>
}

function ReviewRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-1", className)}>
      <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm font-bold text-[#071B4A]">{value || <span className="text-slate-300 italic">Not provided</span>}</span>
    </div>
  )
}
