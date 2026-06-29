/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Student Fees Page
Purpose     : Read-only fee summary, invoices, and payments.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

"use client"

import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  FileText,
  IndianRupee,
  Loader2,
  ReceiptText,
  WalletCards,
} from "lucide-react"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { useEffect, useState } from "react"

import { apiRequest, getStoredSessionValue, storeSessionValue } from "@/lib/api"

type StudentProfile = {
  id?: string | null
  student_id?: string | null
  display_code?: string | null
  full_name?: string | null
  email?: string | null
}

type Invoice = {
  id: string
  invoice_number: string
  student_id: string
  branch_id: string | null
  course_name: string | null
  amount: number
  paid_amount: number
  status: string
  due_date: string
  notes: string | null
  created_at: string
}

type Payment = {
  id: string
  invoice_id: string
  student_id: string
  amount: number
  payment_method: string
  reference_number: string | null
  paid_at: string
  notes: string | null
}

type FeesState = {
  invoices: Invoice[]
  payments: Payment[]
  paymentsUnavailable: boolean
}

const brandGreen = "var(--pinesphere-green)"

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

function getStudentId(profile: StudentProfile | null): string | null {
  return profile?.student_id ?? profile?.id ?? profile?.display_code ?? null
}

async function resolveCurrentStudentId(): Promise<string> {
  const cachedProfile = readCachedProfile()
  const cachedStudentId = getStudentId(cachedProfile)
  if (cachedStudentId) return cachedStudentId

  const accessToken = getStoredSessionValue("pinesphere_access_token")
  if (!accessToken) throw new Error("You are not signed in. Please log in again.")

  const freshProfile = await apiRequest<StudentProfile>("/profile/me", accessToken)
  const rememberMe = Boolean(window.localStorage.getItem("pinesphere_access_token"))
  storeSessionValue("pinesphere_profile", JSON.stringify(freshProfile), rememberMe)

  const freshStudentId = getStudentId(freshProfile)
  if (!freshStudentId) throw new Error("Student ID was not found in your profile.")

  return freshStudentId
}

function formatCurrency(amount: number | null | undefined) {
  const value = Number(amount ?? 0)
  return `Rs ${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatMethod(value: string | null | undefined) {
  if (!value) return "-"
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function invoiceDueAmount(invoice: Invoice) {
  return Math.max((invoice.amount ?? 0) - (invoice.paid_amount ?? 0), 0)
}

function getStatusStyle(status: string, dueAmount: number) {
  const normalized = status?.toLowerCase()

  if (normalized === "paid" || dueAmount <= 0) {
    return { label: "Paid", bg: "#dcfce7", text: "#166534", border: "#bbf7d0" }
  }

  if (normalized === "partial") {
    return { label: "Partial", bg: "#dbeafe", text: "#1e40af", border: "#bfdbfe" }
  }

  if (normalized === "overdue") {
    return { label: "Overdue", bg: "#fee2e2", text: "#991b1b", border: "#fecaca" }
  }

  return { label: normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Pending", bg: "#fef3c7", text: "#92400e", border: "#fde68a" }
}

function Card({
  title,
  children,
  className = "",
  bodyClassName = "p-4",
}: {
  title?: string
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)] ${className}`}
    >
      {title ? (
        <div className="border-b border-[#edf3f1] px-4 py-3">
          <h2 className="text-[15px] font-black text-[#071129]">{title}</h2>
        </div>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </motion.section>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  helper,
  color,
  delay,
}: {
  icon: ReactNode
  label: string
  value: string | number
  helper: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      className="rounded-[18px] border border-[#dfe8e5] bg-white p-4 shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${color}18` }}>
          {icon}
        </span>
        <p className="text-xs font-bold uppercase text-[#64748b]">{label}</p>
      </div>
      <p className="break-words text-2xl font-black text-[#071129]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#64748b]">{helper}</p>
    </motion.div>
  )
}

function LoadingState() {
  return (
    <div className="flex min-h-[54vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-[#dfe8e5] bg-white px-8 py-7 shadow-[0_10px_26px_rgba(15,23,42,0.06)]">
        <Loader2 size={30} className="animate-spin" style={{ color: brandGreen }} />
        <p className="text-sm font-black text-[#071129]">Loading fees...</p>
        <p className="text-xs font-semibold text-[#64748b]">Fetching your invoices and payments</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-[#fecaca]">
      <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#dc2626]">
          <AlertCircle size={24} />
        </span>
        <div>
          <p className="text-sm font-black text-[#dc2626]">Failed to load fees</p>
          <p className="mt-1 max-w-md text-xs font-semibold text-[#991b1b]">{message}</p>
        </div>
      </div>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card>
      <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8fafc] text-[#94a3b8]">
          <ReceiptText size={24} />
        </span>
        <div>
          <p className="text-sm font-black text-[#071129]">No fee records</p>
          <p className="mt-1 max-w-md text-xs font-semibold text-[#64748b]">
            Your invoices and payments will appear here once finance records are created.
          </p>
        </div>
      </div>
    </Card>
  )
}

export default function StudentFeesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fees, setFees] = useState<FeesState>({ invoices: [], payments: [], paymentsUnavailable: false })

  useEffect(() => {
    let cancelled = false

    async function loadFees() {
      try {
        const accessToken = getStoredSessionValue("pinesphere_access_token")
        if (!accessToken) throw new Error("You are not signed in. Please log in again.")

        await resolveCurrentStudentId()

        const [invoiceResult, paymentResult] = await Promise.all([
          apiRequest<Invoice[]>("/finance/invoices", accessToken),
          apiRequest<Payment[]>("/finance/payments", accessToken).then(
            (payments) => ({ ok: true as const, payments }),
            () => ({ ok: false as const, payments: [] as Payment[] }),
          ),
        ])

        if (!cancelled) {
          setFees({
            invoices: Array.isArray(invoiceResult) ? invoiceResult : [],
            payments: paymentResult.payments,
            paymentsUnavailable: !paymentResult.ok,
          })
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setFees({ invoices: [], payments: [], paymentsUnavailable: false })
          setError(err instanceof Error ? err.message : "Failed to load fee records.")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadFees()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <LoadingState />

  const hasData = fees.invoices.length > 0 || fees.payments.length > 0

  return (
    <div className="space-y-4 pb-5">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="overflow-hidden rounded-[18px] border border-[#dfe8e5] bg-white shadow-[0_10px_26px_rgba(15,23,42,0.06)]"
      >
        <div
          className="relative flex min-h-36 flex-col justify-center px-5 py-6"
          style={{ background: `linear-gradient(135deg, ${brandGreen}, #111827)` }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.28),transparent_34%)]" />
          <div className="relative max-w-2xl">
            <p className="text-xs font-black uppercase tracking-wide text-white/75">Student Portal</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Fees</h1>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/78">
              View your fee summary, invoices, and recorded payment history.
            </p>
          </div>
        </div>
      </motion.div>

      {error ? <ErrorState message={error} /> : !hasData ? <EmptyState /> : <FeesContent fees={fees} />}
    </div>
  )
}

function FeesContent({ fees }: { fees: FeesState }) {
  const totalFee = fees.invoices.reduce((sum, invoice) => sum + Number(invoice.amount ?? 0), 0)
  const paidAmount = fees.invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount ?? 0), 0)
  const dueAmount = fees.invoices.reduce((sum, invoice) => sum + invoiceDueAmount(invoice), 0)
  const pendingInvoices = fees.invoices.filter((invoice) => invoiceDueAmount(invoice) > 0).length
  const paymentInvoiceNumbers = new Map(fees.invoices.map((invoice) => [invoice.id, invoice.invoice_number]))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={<IndianRupee size={18} style={{ color: "#2563eb" }} />}
          label="Total Fee"
          value={formatCurrency(totalFee)}
          helper={`${fees.invoices.length} invoice${fees.invoices.length === 1 ? "" : "s"}`}
          color="#2563eb"
          delay={0.05}
        />
        <SummaryCard
          icon={<CheckCircle2 size={18} style={{ color: brandGreen }} />}
          label="Paid Amount"
          value={formatCurrency(paidAmount)}
          helper="Recorded payments"
          color="#008767"
          delay={0.1}
        />
        <SummaryCard
          icon={<WalletCards size={18} style={{ color: dueAmount > 0 ? "#ca8a04" : brandGreen }} />}
          label="Due Amount"
          value={formatCurrency(dueAmount)}
          helper={dueAmount > 0 ? "Outstanding balance" : "No dues"}
          color={dueAmount > 0 ? "#ca8a04" : "#008767"}
          delay={0.15}
        />
        <SummaryCard
          icon={<FileText size={18} style={{ color: pendingInvoices > 0 ? "#dc2626" : brandGreen }} />}
          label="Pending Invoices"
          value={pendingInvoices}
          helper="Awaiting full payment"
          color={pendingInvoices > 0 ? "#dc2626" : "#008767"}
          delay={0.2}
        />
      </div>

      <Card title="Invoice List" bodyClassName="p-0">
        {fees.invoices.length === 0 ? (
          <div className="p-5 text-sm font-semibold text-[#64748b]">No invoices available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-[#edf3f1] bg-[#f8fafc] text-left">
                  <th className="px-4 py-3 font-black text-[#071129]">Invoice</th>
                  <th className="px-4 py-3 font-black text-[#071129]">Course</th>
                  <th className="px-4 py-3 text-right font-black text-[#071129]">Amount</th>
                  <th className="px-4 py-3 text-right font-black text-[#071129]">Paid</th>
                  <th className="px-4 py-3 text-right font-black text-[#071129]">Due</th>
                  <th className="px-4 py-3 font-black text-[#071129]">Due Date</th>
                  <th className="px-4 py-3 text-right font-black text-[#071129]">Status</th>
                </tr>
              </thead>
              <tbody>
                {fees.invoices.map((invoice, index) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} delay={0.05 + index * 0.025} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!fees.paymentsUnavailable ? (
        <Card title="Payment History" bodyClassName="p-0">
          {fees.payments.length === 0 ? (
            <div className="p-5 text-sm font-semibold text-[#64748b]">No payments recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-[#edf3f1] bg-[#f8fafc] text-left">
                    <th className="px-4 py-3 font-black text-[#071129]">Payment Date</th>
                    <th className="px-4 py-3 font-black text-[#071129]">Invoice</th>
                    <th className="px-4 py-3 text-right font-black text-[#071129]">Amount</th>
                    <th className="px-4 py-3 font-black text-[#071129]">Method</th>
                    <th className="px-4 py-3 font-black text-[#071129]">Receipt / Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.payments.map((payment, index) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      invoiceNumber={paymentInvoiceNumbers.get(payment.invoice_id)}
                      delay={0.05 + index * 0.025}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  )
}

function InvoiceRow({ invoice, delay }: { invoice: Invoice; delay: number }) {
  const dueAmount = invoiceDueAmount(invoice)
  const status = getStatusStyle(invoice.status, dueAmount)

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay }}
      className="border-b border-[#edf3f1] transition hover:bg-[#f9fbfa]"
    >
      <td className="px-4 py-3">
        <p className="font-black text-[#071129]">{invoice.invoice_number}</p>
      </td>
      <td className="px-4 py-3 font-semibold text-[#64748b]">{invoice.course_name || "-"}</td>
      <td className="px-4 py-3 text-right font-black text-[#071129]">{formatCurrency(invoice.amount)}</td>
      <td className="px-4 py-3 text-right font-black text-[#071129]">{formatCurrency(invoice.paid_amount)}</td>
      <td className="px-4 py-3 text-right font-black text-[#071129]">{formatCurrency(dueAmount)}</td>
      <td className="px-4 py-3 font-semibold text-[#64748b]">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} />
          {formatDate(invoice.due_date)}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black"
          style={{ backgroundColor: status.bg, borderColor: status.border, color: status.text }}
        >
          {status.label}
        </span>
      </td>
    </motion.tr>
  )
}

function PaymentRow({
  payment,
  invoiceNumber,
  delay,
}: {
  payment: Payment
  invoiceNumber?: string
  delay: number
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay }}
      className="border-b border-[#edf3f1] transition hover:bg-[#f9fbfa]"
    >
      <td className="px-4 py-3 font-semibold text-[#64748b]">{formatDate(payment.paid_at)}</td>
      <td className="px-4 py-3 font-black text-[#071129]">{invoiceNumber ?? payment.invoice_id}</td>
      <td className="px-4 py-3 text-right font-black text-[#071129]">{formatCurrency(payment.amount)}</td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe8e5] bg-white px-2.5 py-1 text-xs font-black text-[#475569]">
          <CreditCard size={13} />
          {formatMethod(payment.payment_method)}
        </span>
      </td>
      <td className="px-4 py-3 font-semibold text-[#64748b]">{payment.reference_number || payment.id || "-"}</td>
    </motion.tr>
  )
}
