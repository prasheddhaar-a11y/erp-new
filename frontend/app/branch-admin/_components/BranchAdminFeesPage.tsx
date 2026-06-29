"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileBarChart,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Plus,
  ReceiptText,
  Settings2,
  ShieldCheck,
  Table2,
  UserCheck,
  UserRound,
  Users,
  IndianRupee,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  TrendingUp,
} from "lucide-react"

import { readBranchAdminSession } from "./BranchAdminShell"
import { BranchAdminSelect } from "./BranchAdminSelect"
import {
  collectFee,
  getFeeReceipts,
  getFeeDefaulters,
  getFeeEmi,
  getFeeLedger,
  getFeesOverview,
  getInvoices,
  getPendingFees,
  getPayments,
  type DefaulterFeeRecord,
  type EmiRecord,
  type FeeReceiptRecord,
  type FeeLedgerRecord,
  type FeesOverview,
  type InvoiceRecord,
  type PendingFeeRecord,
  type StudentRecord,
  downloadFeeReceiptPdf,
  downloadFeeReceiptsReport,
  downloadFeeEmiReport,
  downloadFeeDefaultersReport,
  downloadPendingFeesReport,
} from "@/lib/api/branchAdmin"
import { getPaymentMethodOptions, getStudentOptions, type PaymentMethodOption, type StudentOption } from "@/lib/api/branchAdminOptions"
import { resolveBranchScope } from "@/lib/api/branchAdminData"

type FeePaymentRecord = Record<string, unknown>

type FeeTableColumn<T> = {
  header: string
  className?: string
  cell: (row: T) => ReactNode
}

function useBranchScope() {
  const session = useMemo(() => readBranchAdminSession(), [])
  return useMemo(() => session?.branch ?? resolveBranchScope(), [session])
}

function formatCurrency(value: unknown) {
  const amount = Number(value ?? 0)
  return `Rs ${Math.round(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN")}`
}

function formatFeeDate(value: unknown) {
  return formatSettingValue(value)
}

function invoiceStatusLabel(invoice: InvoiceRecord) {
  const status = invoice.status.toLowerCase()
  if (status === "paid" || invoice.pending_amount <= 0) return "Paid"
  if (invoice.due_date && new Date(invoice.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) return "Overdue"
  if (status === "partial" || invoice.paid_amount > 0) return "Partial"
  return "Pending"
}

function invoiceMatches(invoice: InvoiceRecord, query: string) {
  const text = `${invoice.student} ${invoice.course} ${invoice.invoice_number} ${invoice.status} ${invoice.due_date}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function paymentMatches(payment: FeePaymentRecord, query: string) {
  const text = `${String(payment.student ?? "")} ${String(payment.invoice_number ?? "")} ${String(payment.payment_method ?? "")} ${String(payment.reference_number ?? "")} ${String(payment.paid_at ?? "")}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function invoiceCsvRows(rows: InvoiceRecord[]) {
  return rows.map((fee) => [fee.student, fee.course, fee.invoice_number, fee.amount, fee.paid_amount, fee.pending_amount, invoiceStatusLabel(fee), fee.due_date])
}

function paymentCsvRows(rows: FeePaymentRecord[]) {
  return rows.map((payment) => [
    String(payment.student ?? "Student"),
    String(payment.invoice_number ?? ""),
    Number(payment.amount ?? 0),
    String(payment.payment_method ?? ""),
    String(payment.reference_number ?? ""),
    String(payment.paid_at ?? ""),
  ])
}

function receiptMatches(receipt: FeeReceiptRecord, query: string) {
  const text = `${receipt.student_name} ${receipt.receipt_no}`.toLowerCase()
  return text.includes(query.toLowerCase())
}

function receiptCsvRows(rows: FeeReceiptRecord[]) {
  return rows.map((receipt) => [
    receipt.receipt_no,
    receipt.student_name,
    receipt.invoice_no || receipt.invoice_number || "",
    receipt.course || "Course pending",
    receipt.amount_paid,
    receipt.payment_mode,
    receipt.payment_date,
  ])
}

function downloadFeeReport(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  downloadCsv(filename, headers, rows)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<string | number>>) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function formatSettingValue(value: unknown) {
  if (value === undefined || value === null || value === "") return "-"
  if (typeof value === "string") {
    const date = new Date(value)
    return /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : value
  }
  return String(value)
}

function PageHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction?: () => void }) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">{title}</h2>
        <p className="mt-1.5 text-sm font-semibold text-[#475569]">{subtitle}</p>
      </div>
      <button type="button" onClick={onAction} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white shadow-[0_8px_18px_rgba(11,122,90,0.24)] transition hover:bg-[#096349]">
        <Plus size={17} />
        {action}
      </button>
    </section>
  )
}

function ApiState({ loading, error }: { loading: boolean; error: string }) {
  if (error) {
    return <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div>
  }
  if (loading) {
    return <div className="rounded-lg border border-[#DDE9E4] bg-white px-4 py-3 text-sm font-black text-[#64748B]">Loading live data...</div>
  }
  return null
}

function EmptyTableRow({ columns, label }: { columns: number; label: string }) {
  return (
    <tr>
      <td colSpan={columns} className="px-3 py-8 text-center text-sm font-bold text-[#64748B]">{label}</td>
    </tr>
  )
}

// Reduced card height by 20% (py-2.5 px-4 instead of py-4 px-4, min-h-[88px] instead of min-h-[112px])
function MetricCard({ label, value, helperText, icon: Icon, iconBg, iconColor }: { label: string; value: string; helperText: string; icon: typeof Users; iconBg: string; iconColor: string }) {
  return (
    <div className="rounded-lg border border-[#CFE8DF] bg-white py-2.5 px-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 min-h-[88px]">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-black uppercase tracking-wider text-[#64748B]">{label}</p>
        <p className="mt-0.5 text-xl font-black text-[#020617]">{value}</p>
        <p className="mt-0.5 text-[10px] font-semibold text-[#64748B]">{helperText}</p>
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
        <Icon size={17} />
      </span>
    </div>
  )
}

function Modal({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#020617]/35 p-4">
      <section className={`max-h-[90vh] w-full overflow-y-auto rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-2xl ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-black text-[#071B4A]">{title}</h3>
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-[#DDE9E4] px-3 text-xs font-black text-[#071B4A]">Close</button>
        </div>
        {children}
      </section>
    </div>
  )
}

function Toast({ message }: { message: string }) {
  return <div className="fixed bottom-5 right-5 z-[60] rounded-lg bg-[#0B7A5A] px-4 py-3 text-sm font-black text-white shadow-xl">{message}</div>
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-semibold normal-case text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
    </label>
  )
}

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <BranchAdminSelect
      label={label}
      value={value}
      onChange={onChange}
      placeholder="Select"
      options={options.map((option, index) => ({ label: labels?.[option] ?? option, value: option || `option-${index}` }))}
    />
  )
}

function ModalActions({ onClose, onSave, saving, disabled = false }: { onClose: () => void; onSave: () => void; saving: boolean; disabled?: boolean }) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <button type="button" onClick={onClose} className="h-10 rounded-lg border border-[#DDE9E4] px-4 text-sm font-black text-[#071B4A]">Cancel</button>
      <button type="button" onClick={onSave} disabled={saving || disabled} className="h-10 rounded-lg bg-[#0B7A5A] px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  )
}

function FeeModalToolbar({
  search,
  onSearch,
  status,
  onStatus,
  statusOptions,
  resultCount,
  loading,
  onDownloadReport,
  onExportCsv,
  searchPlaceholder = "Search student, invoice, course",
  downloadLabel = "Download Report",
  exportCsvLabel = "Export CSV",
}: {
  search: string
  onSearch: (value: string) => void
  status?: string
  onStatus?: (value: string) => void
  statusOptions?: string[]
  resultCount: number
  loading: boolean
  onDownloadReport: () => void
  onExportCsv?: () => void
  searchPlaceholder?: string
  downloadLabel?: string
  exportCsvLabel?: string
}) {
  return (
    <div className="grid gap-3">
      <div className={`grid gap-3 ${statusOptions ? "lg:grid-cols-[minmax(0,1fr)_180px_auto]" : "lg:grid-cols-[minmax(0,1fr)_auto]"}`}>
        <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
          Search
          <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholder} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-semibold normal-case text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
        </label>
        {statusOptions && onStatus ? (
          <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
            Filter
            <select value={status ?? "All"} onChange={(event) => onStatus(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-black normal-case text-[#071B4A] outline-none focus:border-[#0B7A5A]">
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        ) : null}
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" onClick={onDownloadReport} disabled={loading || resultCount === 0} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-3 text-xs font-black text-white disabled:opacity-60">
            <Download size={15} />
            {downloadLabel}
          </button>
          {onExportCsv ? (
            <button type="button" onClick={onExportCsv} disabled={loading || resultCount === 0} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-3 text-xs font-black text-[#071B4A] disabled:opacity-60">
              <FileSpreadsheet size={15} className="text-[#0B7A5A]" />
              {exportCsvLabel}
            </button>
          ) : null}
        </div>
      </div>
      <p className="text-xs font-bold text-[#64748B]">{loading ? "Loading fee data..." : `${resultCount} record${resultCount === 1 ? "" : "s"} ready`}</p>
    </div>
  )
}

function FeeTable<T>({ columns, rows, loading, empty, rowKey }: { columns: FeeTableColumn<T>[]; rows: T[]; loading: boolean; empty: string; rowKey: (row: T, index: number) => string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#E3ECE8]">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="bg-[#F8FAF8] text-xs uppercase text-[#475569]">
          <tr>{columns.map((column) => <th key={column.header} className={`px-3 py-3 font-black ${column.className ?? ""}`}>{column.header}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? <EmptyTableRow columns={columns.length} label="Loading fee data..." /> : null}
          {!loading && rows.map((row, index) => (
            <tr key={rowKey(row, index)} className="border-b border-[#EDF3F1] last:border-b-0">
              {columns.map((column) => <td key={column.header} className={`px-3 py-3 align-top ${column.className ?? ""}`}>{column.cell(row)}</td>)}
            </tr>
          ))}
          {!loading && !rows.length ? <EmptyTableRow columns={columns.length} label={empty} /> : null}
        </tbody>
      </table>
    </div>
  )
}

function FeeStatusBadge({ label }: { label: string }) {
  const style = label === "Paid"
    ? "bg-[#E0F3E9] text-[#0B7A5A]"
    : label === "Overdue"
      ? "bg-[#FFF0F0] text-[#EF4444]"
      : "bg-[#FFF0DC] text-[#F97316]"
  return <span className={`inline-flex w-fit rounded px-2 py-1 text-[11px] font-black ${style}`}>{label}</span>
}

function OperationCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  onClick
}: {
  icon: typeof Users
  iconBg: string
  iconColor: string
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="group flex flex-col justify-between rounded-xl border border-[#EDF3F1] bg-[#FBFDFC] p-5 hover:border-[#0B7A5A] hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer min-h-[140px] transform hover:-translate-y-1 shadow-sm"
    >
      <div className="flex items-start justify-between w-full">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
          <Icon size={24} />
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-50 text-[#94A3B8] transition duration-200 group-hover:bg-[#E8F6F0] group-hover:text-[#0B7A5A]">
          <ArrowRight size={15} className="transition duration-200 group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="mt-4">
        <h4 className="text-sm font-black text-[#071B4A]">{title}</h4>
        <p className="text-[11px] font-semibold text-[#64748B] mt-1 truncate" title={description}>
          {description}
        </p>
      </div>
    </div>
  )
}

export function BranchAdminFeesPage() {
  const branch = useBranchScope()
  const [overview, setOverview] = useState<FeesOverview | null>(null)
  const [fees, setFees] = useState<InvoiceRecord[]>([])
  const [payments, setPayments] = useState<Array<Record<string, unknown>>>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [toast, setToast] = useState("")
  const [modal, setModal] = useState<"collect" | "ledger" | "receipts" | "emi" | "pending" | "defaulters" | null>(null)
  const [downloadingReceipt, setDownloadingReceipt] = useState("")
  const [collectionInvoiceId, setCollectionInvoiceId] = useState("")

  // Table Filters & Pagination State
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  // Operations download loading state
  const [downloadingReport, setDownloadingReport] = useState(false)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  const latestPaymentsByInvoice = useMemo(() => {
    const byInvoice = new Map<string, FeePaymentRecord>()
    payments.forEach((payment) => {
      const invoiceId = String(payment.invoice_id ?? "")
      if (!invoiceId) return
      const existing = byInvoice.get(invoiceId)
      const paidAt = new Date(String(payment.paid_at ?? "")).getTime()
      const existingPaidAt = new Date(String(existing?.paid_at ?? "")).getTime()
      if (!existing || (Number.isFinite(paidAt) && (!Number.isFinite(existingPaidAt) || paidAt > existingPaidAt))) {
        byInvoice.set(invoiceId, payment)
      }
    })
    return byInvoice
  }, [payments])

  const emiInvoiceIds = useMemo(() => new Set(fees.filter((fee) => fee.pending_amount > 0 || fee.paid_amount > 0).map((fee) => fee.id)), [fees])

  const collectionInvoices = useMemo(() => {
    if (!collectionInvoiceId) return fees
    return [...fees].sort((left, right) => (left.id === collectionInvoiceId ? -1 : right.id === collectionInvoiceId ? 1 : 0))
  }, [collectionInvoiceId, fees])

  const collectionStudents = useMemo(() => {
    const invoice = fees.find((fee) => fee.id === collectionInvoiceId)
    if (!invoice) return students
    return [...students].sort((left, right) => (left.id === invoice.student_id ? -1 : right.id === invoice.student_id ? 1 : 0))
  }, [collectionInvoiceId, fees, students])

  // Filter fees Client Side
  const filteredFees = useMemo(() => {
    return fees.filter((fee) => {
      const matchesSearch = !searchQuery.trim() ||
        fee.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
        fee.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (fee.course || "").toLowerCase().includes(searchQuery.toLowerCase())

      const statusLabel = invoiceStatusLabel(fee)
      const matchesStatus = statusFilter === "All" || statusLabel.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [fees, searchQuery, statusFilter])

  // Paginated Fees
  const totalEntries = filteredFees.length
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1
  const paginatedFees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredFees.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredFees, currentPage, itemsPerPage])

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  async function loadFees() {
    setLoading(true)
    try {
      const rows = await getInvoices()
      setFees(rows)
      setError("")
      setLoading(false)

      const [overviewResult, paymentResult, studentResult, methodResult] = await Promise.allSettled([
        getFeesOverview(),
        getPayments(),
        getStudentOptions(),
        getPaymentMethodOptions()
      ])
      if (overviewResult.status === "fulfilled") setOverview(overviewResult.value)
      if (paymentResult.status === "fulfilled") setPayments(paymentResult.value)
      if (studentResult.status === "fulfilled") setStudents(studentResult.value)
      if (methodResult.status === "fulfilled") setPaymentMethods(methodResult.value)
    } catch (err) {
      setOverview(null)
      setFees([])
      setError(err instanceof Error ? `Live API unavailable: ${err.message}` : "Live API unavailable")
    } finally {
      setLoading(false)
    }
  }

  async function downloadLatestReceipt(invoice: InvoiceRecord) {
    const payment = latestPaymentsByInvoice.get(invoice.id)
    const paymentId = String(payment?.id ?? "")
    if (!paymentId) {
      showToast("No receipt is available until a payment is recorded.")
      return
    }
    setDownloadingReceipt(invoice.id)
    try {
      const file = await downloadFeeReceiptPdf(paymentId)
      downloadBlob(file.blob, file.filename)
      showToast("Receipt downloaded successfully.")
    } catch (err) {
      showToast(err instanceof Error ? `Could not download receipt: ${err.message}` : "Could not download receipt.")
    } finally {
      setDownloadingReceipt("")
    }
  }

  async function triggerCollectedFeesReport() {
    if (downloadingReport) return
    setDownloadingReport(true)
    try {
      const file = await downloadFeeReceiptsReport()
      downloadBlob(file.blob, file.filename)
      showToast("Export reports downloaded successfully.")
    } catch (err) {
      showToast(err instanceof Error ? `Could not download reports: ${err.message}` : "Could not download reports.")
    } finally {
      setDownloadingReport(false)
    }
  }

  useEffect(() => {
    loadFees()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fees"
        subtitle={`Monitor fee collection, ledgers, receipts, EMI tracking, and defaulter follow-up for ${branch.branch_name}.`}
        action="Collect Fee"
        onAction={() => { setCollectionInvoiceId(""); setModal("collect") }}
      />
      <ApiState loading={loading} error={error} />

      {/* Reduced KPI cards height row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Collected"
          value={formatCurrency(overview?.total_collected ?? overview?.revenue_mtd ?? 0)}
          helperText="All time"
          icon={CreditCard}
          iconBg="bg-[#E8F6F0]"
          iconColor="text-[#0B7A5A]"
        />
        <MetricCard
          label="Fee Records"
          value={String(overview?.invoice_count ?? fees.length)}
          helperText="Total invoices"
          icon={FileText}
          iconBg="bg-[#E8F6F0]"
          iconColor="text-[#0B7A5A]"
        />
        <MetricCard
          label="Pending Fees"
          value={formatCurrency(overview?.pending_fees ?? 0)}
          helperText="Outstanding"
          icon={Clock3}
          iconBg="bg-[#E8F6F0]"
          iconColor="text-[#0B7A5A]"
        />
        <MetricCard
          label="Overdue Fees"
          value={String(overview?.overdue_count ?? 0)}
          helperText="Requires attention"
          icon={ShieldCheck}
          iconBg="bg-[#FFF0F0]"
          iconColor="text-[#EF4444]"
        />
      </section>

      {/* Row 1: Full-width Table */}
      <div className="rounded-lg border border-[#E3ECE8] bg-white shadow-[0_8px_24px_rgba(15,23,42,0.055)] flex flex-col justify-between overflow-hidden">
        <div>
          <div className="flex items-center justify-between border-b border-[#EDF3F1] p-4 bg-white">
            <h3 className="text-sm font-black text-[#071B4A]">Fee Collection Table</h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-black transition ${showFilters ? "border-[#0B7A5A] bg-[#E8F6F0] text-[#0B7A5A]" : "border-[#DDE9E4] bg-white text-[#071B4A] hover:bg-[#F8FAF8]"}`}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#DDE9E4] bg-white text-[#071B4A] transition hover:bg-[#F8FAF8]"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          </div>

          {/* Collapsible Filter Bar */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-3 border-b border-[#EDF3F1] bg-[#F8FAF8] p-3 transition duration-200">
              <div className="relative min-w-[240px]">
                <input
                  type="text"
                  placeholder="Search student, course, invoice no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#DDE9E4] bg-white px-3 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#0B7A5A]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-[#DDE9E4] bg-white px-3 text-xs font-black text-[#071B4A] outline-none focus:border-[#0B7A5A]"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          )}

          {/* Scrollable Container with Sticky Header */}
          <div className="overflow-x-auto overflow-y-auto max-h-[440px] w-full">
            <table className="w-full border-collapse text-left text-sm relative">
              <thead className="sticky top-0 z-10 bg-[#F8FAF8] text-xs uppercase text-[#475569] border-b border-[#EDF3F1] shadow-[0_1px_0_0_#EDF3F1]">
                <tr>
                  <th className="px-4 py-3 font-black">Student</th>
                  <th className="px-4 py-3 font-black">Course</th>
                  <th className="px-4 py-3 font-black">Invoice No</th>
                  <th className="px-4 py-3 font-black">Total Fee</th>
                  <th className="px-4 py-3 font-black">Paid</th>
                  <th className="px-4 py-3 font-black">Pending</th>
                  <th className="px-4 py-3 font-black">Status</th>
                  <th className="px-4 py-3 font-black">Last Payment Date</th>
                  <th className="px-4 py-3 font-black text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <EmptyTableRow columns={9} label="Loading fee data..." />}
                {!loading && paginatedFees.map((fee) => {
                  const latestPayment = latestPaymentsByInvoice.get(fee.id)
                  const canDownloadReceipt = Boolean(latestPayment?.id)
                  const studentInfo = students.find((s) => s.id === fee.student_id)
                  const studentPhone = studentInfo?.phone || "9876543210"

                  return (
                    <tr key={fee.id} className="border-b border-[#EDF3F1] last:border-b-0 hover:bg-[#FBFDFC]">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-black text-[#071B4A]">{fee.student}</p>
                          <p className="text-xs font-semibold text-[#64748B] mt-0.5">{studentPhone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#475569]">{fee.course || "Course pending"}</td>
                      <td className="px-4 py-3 font-semibold text-[#475569]">{fee.invoice_number}</td>
                      <td className="px-4 py-3 font-black text-[#071B4A]">{formatCurrency(fee.amount)}</td>
                      <td className="px-4 py-3 font-black text-[#0B7A5A]">{formatCurrency(fee.paid_amount)}</td>
                      <td className="px-4 py-3 font-black text-[#EF4444]">{formatCurrency(fee.pending_amount)}</td>
                      <td className="px-4 py-3"><FeeStatusBadge label={invoiceStatusLabel(fee)} /></td>
                      <td className="px-4 py-3 font-semibold text-[#475569]">{latestPayment?.paid_at ? formatFeeDate(latestPayment.paid_at) : "-"}</td>
                      <td className="px-4 py-3">
                        {/* Compact icon action buttons with tooltips */}
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => { setCollectionInvoiceId(fee.id); setModal("collect") }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8F6F0] text-[#0B7A5A] transition hover:bg-[#CFE8DF] active:scale-95"
                            title="Collect Fee"
                          >
                            <IndianRupee size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setModal("ledger") }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E0F2FE] text-[#0284C7] transition hover:bg-[#BAE6FD] active:scale-95"
                            title="View Student Ledger"
                          >
                            <ReceiptText size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={!canDownloadReceipt || downloadingReceipt === fee.id}
                            onClick={() => downloadLatestReceipt(fee)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569] transition hover:bg-[#E2E8F0] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                            title={downloadingReceipt === fee.id ? "Downloading..." : "Download Latest Receipt"}
                          >
                            <Download size={14} />
                          </button>
                          {emiInvoiceIds.has(fee.id) && (
                            <button
                              type="button"
                              onClick={() => setModal("emi")}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F3E8FF] text-[#9333EA] transition hover:bg-[#E9D5FF] active:scale-95"
                              title="View EMI Installments"
                            >
                              <CalendarDays size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!fees.length && !loading && <EmptyTableRow columns={9} label={error ? "Fee data could not be loaded." : "No fee records found for this branch."} />}
                {fees.length > 0 && !filteredFees.length && !loading && <EmptyTableRow columns={9} label="No records match current filters." />}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table Footer / Pagination */}
        <div className="border-t border-[#EDF3F1] bg-[#F8FAF8] px-4 py-3 flex items-center justify-between text-xs text-[#64748B] font-bold">
          <div>
            {totalEntries > 0 ? (
              <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} entries</span>
            ) : (
              <span>Showing 0 to 0 of 0 entries</span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#DDE9E4] bg-white text-[#071B4A] hover:bg-[#FBFDFC] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setCurrentPage(p)}
                  className={`flex h-7 w-7 items-center justify-center rounded border font-black ${p === currentPage ? "border-[#0B7A5A] bg-[#0B7A5A] text-white" : "border-[#DDE9E4] bg-white text-[#071B4A] hover:bg-[#FBFDFC]"}`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="flex h-7 w-7 items-center justify-center rounded border border-[#DDE9E4] bg-white text-[#071B4A] hover:bg-[#FBFDFC] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Bottom Operations Grid (3 cols on Desktop, 2 on Tablet, 1 on Mobile) */}
      <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.055)]">
        <div>
          <h3 className="text-base font-black text-[#071B4A]">Fee Operations</h3>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">Quick access to fee management features</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          <OperationCard
            icon={ReceiptText}
            iconBg="bg-[#E8F6F0]"
            iconColor="text-[#0B7A5A]"
            title="Student Fee Ledger"
            description="View detailed student fee ledger and payment history"
            onClick={() => setModal("ledger")}
          />
          <OperationCard
            icon={FileText}
            iconBg="bg-[#E0F2FE]"
            iconColor="text-[#0284C7]"
            title="Receipt Generation"
            description="Generate and download fee receipts"
            onClick={() => setModal("receipts")}
          />
          <OperationCard
            icon={CalendarDays}
            iconBg="bg-[#F3E8FF]"
            iconColor="text-[#9333EA]"
            title="EMI Tracking"
            description="Track EMI plans and installment details"
            onClick={() => setModal("emi")}
          />
          <OperationCard
            icon={FileBarChart}
            iconBg="bg-[#FFEDD5]"
            iconColor="text-[#D97706]"
            title="Pending Fees Report"
            description="View all pending fee reports and summaries"
            onClick={() => setModal("pending")}
          />
          <OperationCard
            icon={UserRound}
            iconBg="bg-[#FEE2E2]"
            iconColor="text-[#DC2626]"
            title="Defaulter Tracking"
            description="Monitor defaulters and follow-up status"
            onClick={() => setModal("defaulters")}
          />
          <OperationCard
            icon={TrendingUp}
            iconBg="bg-[#CCFBF1]"
            iconColor="text-[#0D9488]"
            title={downloadingReport ? "Downloading..." : "Export Reports"}
            description="Download comprehensive fee collection reports"
            onClick={triggerCollectedFeesReport}
          />
        </div>
      </section>

      {modal === "collect" ? <CollectFeeModal students={collectionStudents} invoices={collectionInvoices} paymentMethods={paymentMethods} onClose={() => { setCollectionInvoiceId(""); setModal(null) }} onSave={async (payload) => { await collectFee(payload); await loadFees(); setCollectionInvoiceId(""); setModal(null); showToast("Fee collected successfully.") }} /> : null}
      {modal === "ledger" ? <FeeLedgerModal onClose={() => setModal(null)} /> : null}
      {modal === "receipts" ? <ReceiptModal onClose={() => setModal(null)} onDownloaded={(message) => showToast(message)} /> : null}
      {modal === "emi" ? <EmiTrackingModal onClose={() => setModal(null)} onDownloaded={(message) => showToast(message)} /> : null}
      {modal === "pending" ? <PendingFeesReportModal onClose={() => setModal(null)} onDownloaded={(message) => showToast(message)} /> : null}
      {modal === "defaulters" ? <DefaulterFeeModal onClose={() => setModal(null)} /> : null}
      {toast ? <Toast message={toast} /> : null}
    </div>
  )
}

// ==========================================
// FEE PAGES MODALS & HELPER COMPONENTS
// ==========================================

export function CollectFeeModal({ students, invoices, paymentMethods, onClose, onSave }: { students: StudentRecord[]; invoices: InvoiceRecord[]; paymentMethods: PaymentMethodOption[]; onClose: () => void; onSave: (payload: Record<string, string | number>) => Promise<void> }) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "")
  const filteredInvoices = invoices.filter((invoice) => !studentId || invoice.student_id === studentId)
  const [invoiceId, setInvoiceId] = useState(filteredInvoices[0]?.id ?? invoices[0]?.id ?? "")
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState(paymentMethods[0]?.value ?? "cash")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Update invoice selection when student changes
  useEffect(() => {
    const first = filteredInvoices[0]
    setInvoiceId(first?.id ?? "")
  }, [studentId])

  const selectedStudent = students.find((s) => s.id === studentId)
  const selectedInvoice = invoices.find((inv) => inv.id === invoiceId)

  async function save() {
    const numAmount = Number(amount)
    if (!numAmount || numAmount <= 0) {
      setError("Enter a positive payment amount.")
      return
    }
    if (selectedInvoice && numAmount > selectedInvoice.pending_amount) {
      setError("Payment amount cannot exceed pending amount.")
      return
    }
    setSaving(true)
    setError("")
    try {
      await onSave({ invoice_id: invoiceId, amount: numAmount, payment_method: method, reference_number: reference, notes })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to collect fee.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Collect Fee" onClose={onClose}>
      <div className="grid gap-3">
        {/* Student selection */}
        <SelectField label="Student" value={studentId} options={students.map((item) => item.id)} onChange={(value) => setStudentId(value)} />
        {/* Invoice selection filtered by student */}
        <SelectField label="Invoice" value={invoiceId} options={filteredInvoices.map((item) => item.id)} onChange={setInvoiceId} />
        {/* Display selected invoice details */}
        {selectedInvoice && (
          <div className="rounded-lg border border-[#EDF3F1] bg-[#FBFDFC] p-3 text-sm">
            <p className="font-black text-[#071B4A]">Student: {selectedInvoice.student}</p>
            <p className="text-[#475569]">Course: {selectedInvoice.course}</p>
            <p className="text-[#475569]">Invoice No: {selectedInvoice.invoice_number}</p>
            <p className="text-[#0B7A5A]">Total Fee: Rs {Math.round(selectedInvoice.amount).toLocaleString("en-IN")}</p>
            <p className="text-[#0B7A5A]">Paid Amount: Rs {Math.round(selectedInvoice.paid_amount).toLocaleString("en-IN")}</p>
            <p className="text-[#EF4444]">Pending Amount: Rs {Math.round(selectedInvoice.pending_amount).toLocaleString("en-IN")}</p>
            <p className="text-[#475569]">Status: {selectedInvoice.status}</p>
          </div>
        )}
        {/* Payment fields */}
        <TextField label="Amount" type="number" value={amount} onChange={setAmount} />
        <SelectField label="Payment Method" value={method} options={(paymentMethods.length ? paymentMethods.map((item) => item.value) : ["cash", "upi", "card", "bank_transfer"])} labels={Object.fromEntries(paymentMethods.map((item) => [item.value, item.label]))} onChange={setMethod} />
        <TextField label="Reference Number" value={reference} onChange={setReference} />
        <TextField label="Remarks" value={notes} onChange={setNotes} />
        {error && <p className="text-xs font-bold text-[#9A3412]">{error}</p>}
        <ModalActions onClose={onClose} onSave={save} saving={saving} disabled={!invoiceId || !amount} />
      </div>
    </Modal>
  )
}

export function FeeLedgerModal({ onClose }: { onClose: () => void }) {
  const [ledger, setLedger] = useState<FeeLedgerRecord[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    getFeeLedger({ page, limit, search, status: status === "All" ? "" : status })
      .then((res) => {
        setLedger(res.ledger || [])
        setTotalCount(res.total_count || 0)
      })
      .catch((err: Error) => {
        setLedger([])
        setError(`Could not load ledger: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [page, limit, search, status])

  const ledgerHeaders = ["Student Name", "Course", "Invoice No", "Total Fee", "Amount Paid", "Pending Amount", "Last Payment Date", "Status"]

  function downloadReport() {
    downloadCsv("fee_ledger.csv", ledgerHeaders, ledger.map((row) => [
      row.student_name,
      row.course,
      row.invoice_no,
      row.total_fee,
      row.amount_paid,
      row.pending_amount,
      row.last_payment_date || "-",
      row.status
    ]))
  }

  return (
    <Modal title="Student Fee Ledger" onClose={onClose} wide>
      <div className="grid gap-4">
        {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        <FeeModalToolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          statusOptions={["All", "Paid", "Pending", "Partial", "Overdue"]}
          resultCount={ledger.length}
          loading={loading}
          onDownloadReport={downloadReport}
          searchPlaceholder="Search student name"
          downloadLabel="Export Ledger CSV"
        />
        <FeeTable
          columns={[
            { header: "Student Name", cell: (row) => <span className="font-black text-[#071B4A]">{row.student_name}</span> },
            { header: "Course", cell: (row) => row.course || "Course pending" },
            { header: "Invoice No", cell: (row) => <span className="font-black text-[#071B4A]">{row.invoice_no}</span> },
            { header: "Total Fee", cell: (row) => formatCurrency(row.total_fee) },
            { header: "Amount Paid", cell: (row) => formatCurrency(row.amount_paid) },
            { header: "Pending Amount", cell: (row) => <span className="font-black text-[#EF4444]">{formatCurrency(row.pending_amount)}</span> },
            { header: "Last Payment Date", cell: (row) => row.last_payment_date ? formatFeeDate(row.last_payment_date) : "-" },
            { header: "Status", cell: (row) => <FeeStatusBadge label={row.status} /> },
          ]}
          rows={ledger}
          loading={loading}
          empty="No ledger records found for the current filters."
          rowKey={(row, index) => `${row.invoice_no}-${index}`}
        />
      </div>
    </Modal>
  )
}

export function ReceiptModal({ onClose, onDownloaded }: { onClose: () => void; onDownloaded: (message: string) => void }) {
  const [receipts, setReceipts] = useState<FeeReceiptRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [mode, setMode] = useState("All")
  const [openingId, setOpeningId] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    getFeeReceipts()
      .then(setReceipts)
      .catch((err: Error) => {
        setReceipts([])
        setError(`Could not load receipts: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  const modeOptions = useMemo(() => ["All", ...Array.from(new Set(receipts.map((receipt) => receipt.payment_mode || "cash")))], [receipts])
  const filteredReceipts = receipts.filter((receipt) => receiptMatches(receipt, search) && (mode === "All" || receipt.payment_mode === mode))
  const receiptHeaders = ["Receipt No", "Student Name", "Invoice No", "Course", "Amount Paid", "Payment Mode", "Payment Date"]

  async function downloadReceipt(id: string) {
    setOpeningId(id)
    try {
      const file = await downloadFeeReceiptPdf(id)
      downloadBlob(file.blob, file.filename)
      onDownloaded("Receipt PDF downloaded.")
    } catch (err) {
      setError(err instanceof Error ? `Could not download receipt: ${err.message}` : "Could not download receipt.")
    } finally {
      setOpeningId("")
    }
  }

  async function downloadReport() {
    try {
      const file = await downloadFeeReceiptsReport()
      downloadBlob(file.blob, file.filename)
      onDownloaded("Receipts report downloaded.")
    } catch (err) {
      setError(err instanceof Error ? `Could not download report: ${err.message}` : "Could not download report.")
    }
  }

  return (
    <Modal title="Receipt Generation" onClose={onClose} wide>
      <div className="grid gap-4">
        {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        <FeeModalToolbar
          search={search}
          onSearch={setSearch}
          status={mode}
          onStatus={setMode}
          statusOptions={modeOptions}
          resultCount={filteredReceipts.length}
          loading={loading}
          onDownloadReport={downloadReport}
          onExportCsv={() => downloadCsv("receipt_generation.csv", receiptHeaders, receiptCsvRows(filteredReceipts))}
          searchPlaceholder="Search student name or receipt no"
          downloadLabel="Download All Receipts Report"
        />
        <FeeTable
          columns={[
            { header: "Receipt No", cell: (receipt) => <span className="font-black text-[#071B4A]">{receipt.receipt_no}</span> },
            { header: "Student Name", cell: (receipt) => <span className="font-black text-[#071B4A]">{receipt.student_name}</span> },
            { header: "Invoice No", cell: (receipt) => receipt.invoice_no || receipt.invoice_number || "Not linked" },
            { header: "Course", cell: (receipt) => receipt.course || "Course pending" },
            { header: "Amount Paid", cell: (receipt) => formatCurrency(receipt.amount_paid) },
            { header: "Payment Mode", cell: (receipt) => receipt.payment_mode || "cash" },
            { header: "Payment Date", cell: (receipt) => formatFeeDate(receipt.payment_date) },
            { header: "Actions", cell: (receipt) => {
              const id = receipt.payment_id || receipt.id
              return <button type="button" onClick={() => downloadReceipt(id)} disabled={!id || openingId === id} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#DDE9E4] bg-white px-2 text-xs font-black text-[#071B4A] disabled:opacity-60"><Download size={14} className="text-[#0B7A5A]" />{openingId === id ? "Downloading..." : "PDF"}</button>
            } },
          ]}
          rows={filteredReceipts}
          loading={loading}
          empty="No receipts found for the current filters."
          rowKey={(receipt, index) => receipt.id || `${receipt.receipt_no}-${index}`}
        />
      </div>
    </Modal>
  )
}

export function EmiTrackingModal({ onClose, onDownloaded }: { onClose: () => void; onDownloaded: (message: string) => void }) {
  const [rows, setRows] = useState<EmiRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("All")
  const [downloading, setDownloading] = useState<"csv" | "pdf" | "">("")

  useEffect(() => {
    setLoading(true)
    setError("")
    getFeeEmi()
      .then(setRows)
      .catch((err: Error) => {
        setRows([])
        setError(`Could not load EMI tracking: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  const statusOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.emi_status || "Pending")))], [rows])
  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || row.student_name.toLowerCase().includes(query)
    return matchesSearch && (status === "All" || row.emi_status === status)
  })
  const exportFilters = {
    search: search.trim(),
    status: status === "All" ? "" : status,
  }

  async function downloadReport(format: "csv" | "pdf") {
    setDownloading(format)
    setError("")
    try {
      const file = await downloadFeeEmiReport(format, exportFilters)
      downloadBlob(file.blob, file.filename)
      onDownloaded(format === "pdf" ? "EMI PDF downloaded." : "EMI CSV downloaded.")
    } catch (err) {
      setError(err instanceof Error ? `Could not download EMI ${format.toUpperCase()}: ${err.message}` : `Could not download EMI ${format.toUpperCase()}.`)
    } finally {
      setDownloading("")
    }
  }

  return (
    <Modal title="EMI Tracking" onClose={onClose} wide>
      <div className="grid gap-4">
        {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        <FeeModalToolbar
          search={search}
          onSearch={setSearch}
          status={status}
          onStatus={setStatus}
          statusOptions={statusOptions}
          resultCount={filteredRows.length}
          loading={loading || Boolean(downloading)}
          onDownloadReport={() => downloadReport("pdf")}
          onExportCsv={() => downloadReport("csv")}
          searchPlaceholder="Search student name"
          downloadLabel={downloading === "pdf" ? "Downloading PDF..." : "Download EMI PDF"}
          exportCsvLabel={downloading === "csv" ? "Downloading CSV..." : "Download EMI CSV"}
        />
        <FeeTable
          columns={[
            { header: "Student Name", cell: (row) => <span className="font-black text-[#071B4A]">{row.student_name}</span> },
            { header: "Course", cell: (row) => row.course || "Course pending" },
            { header: "Invoice No", cell: (row) => <span className="font-black text-[#071B4A]">{row.invoice_no}</span> },
            { header: "Total Fee", cell: (row) => formatCurrency(row.total_fee) },
            { header: "Installment Amount", cell: (row) => formatCurrency(row.installment_amount) },
            { header: "Paid Installments", cell: (row) => row.paid_installments },
            { header: "Pending Installments", cell: (row) => row.pending_installments },
            { header: "Next Due Date", cell: (row) => row.next_due_date ? formatFeeDate(row.next_due_date) : "-" },
            { header: "Overdue Installments", cell: (row) => <span className={row.overdue_installments > 0 ? "font-black text-[#EF4444]" : "font-semibold text-[#475569]"}>{row.overdue_installments}</span> },
            { header: "EMI Status", cell: (row) => <FeeStatusBadge label={row.emi_status} /> },
          ]}
          rows={filteredRows}
          loading={loading}
          empty="No EMI records found for the current filters."
          rowKey={(row, index) => row.id || `${row.invoice_no}-${index}`}
        />
      </div>
    </Modal>
  )
}

export function PendingFeesReportModal({ onClose, onDownloaded }: { onClose: () => void; onDownloaded: (message: string) => void }) {
  const [rows, setRows] = useState<PendingFeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [course, setCourse] = useState("All")
  const [batch, setBatch] = useState("All")
  const [minPending, setMinPending] = useState("")
  const [downloading, setDownloading] = useState<"csv" | "pdf" | "">("")

  useEffect(() => {
    setLoading(true)
    setError("")
    getPendingFees()
      .then(setRows)
      .catch((err: Error) => {
        setRows([])
        setError(`Could not load pending fees: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  const courseOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.course || "Course pending")))], [rows])
  const batchOptions = useMemo(() => ["All", ...Array.from(new Set(rows.map((row) => row.batch || "Unassigned")))], [rows])
  const minimum = Number(minPending)
  const hasMinimum = minPending.trim() !== "" && Number.isFinite(minimum)
  const filteredRows = rows.filter((row) => {
    const matchesCourse = course === "All" || (row.course || "Course pending") === course
    const matchesBatch = batch === "All" || (row.batch || "Unassigned") === batch
    const matchesMinimum = !hasMinimum || row.pending_amount >= minimum
    return matchesCourse && matchesBatch && matchesMinimum
  })
  const exportFilters = {
    course: course === "All" ? "" : course,
    batch: batch === "All" ? "" : batch,
    min_pending: hasMinimum ? minimum : "",
  }

  async function downloadReport(format: "csv" | "pdf") {
    setDownloading(format)
    setError("")
    try {
      const file = await downloadPendingFeesReport(format, exportFilters)
      downloadBlob(file.blob, file.filename)
      onDownloaded(format === "pdf" ? "Pending Fees PDF downloaded." : "Pending Fees CSV downloaded.")
    } catch (err) {
      setError(err instanceof Error ? `Could not download Pending Fees ${format.toUpperCase()}: ${err.message}` : `Could not download Pending Fees ${format.toUpperCase()}.`)
    } finally {
      setDownloading("")
    }
  }

  return (
    <Modal title="Pending Fees Report" onClose={onClose} wide>
      <div className="grid gap-4">
        {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        <div className="grid gap-3">
          <div className="grid gap-3 lg:grid-cols-[180px_180px_220px_auto]">
            <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
              Course
              <select value={course} onChange={(event) => setCourse(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-black normal-case text-[#071B4A] outline-none focus:border-[#0B7A5A]">
                {courseOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
              Batch
              <select value={batch} onChange={(event) => setBatch(event.target.value)} className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-black normal-case text-[#071B4A] outline-none focus:border-[#0B7A5A]">
                {batchOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-black uppercase text-[#64748B]">
              Minimum Pending Amount
              <input type="number" min="0" value={minPending} onChange={(event) => setMinPending(event.target.value)} placeholder="No minimum" className="h-11 rounded-lg border border-[#DDE9E4] bg-[#FBFDFC] px-3 text-sm font-semibold normal-case text-[#0F172A] outline-none focus:border-[#0B7A5A]" />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button type="button" onClick={() => downloadReport("pdf")} disabled={loading || Boolean(downloading) || filteredRows.length === 0} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#0B7A5A] px-3 text-xs font-black text-white disabled:opacity-60">
                <Download size={15} />
                {downloading === "pdf" ? "Downloading PDF..." : "Download Pending Fees PDF"}
              </button>
              <button type="button" onClick={() => downloadReport("csv")} disabled={loading || Boolean(downloading) || filteredRows.length === 0} className="inline-flex h-11 items-center gap-2 rounded-lg border border-[#DDE9E4] bg-white px-3 text-xs font-black text-[#071B4A] disabled:opacity-60">
                <FileSpreadsheet size={15} className="text-[#0B7A5A]" />
                {downloading === "csv" ? "Downloading CSV..." : "Download Pending Fees CSV"}
              </button>
            </div>
          </div>
          <p className="text-xs font-bold text-[#64748B]">{loading ? "Loading pending fees..." : `${filteredRows.length} record${filteredRows.length === 1 ? "" : "s"} ready`}</p>
        </div>
        <FeeTable
          columns={[
            { header: "Student Name", cell: (row) => <span className="font-black text-[#071B4A]">{row.student_name}</span> },
            { header: "Course", cell: (row) => row.course || "Course pending" },
            { header: "Batch", cell: (row) => row.batch || "Unassigned" },
            { header: "Total Fee", cell: (row) => formatCurrency(row.total_fee) },
            { header: "Paid Amount", cell: (row) => formatCurrency(row.paid_amount) },
            { header: "Pending Amount", cell: (row) => <span className="font-black text-[#EF4444]">{formatCurrency(row.pending_amount)}</span> },
            { header: "Due Date", cell: (row) => row.due_date ? formatFeeDate(row.due_date) : "-" },
            { header: "Status", cell: (row) => <FeeStatusBadge label={row.status} /> },
          ]}
          rows={filteredRows}
          loading={loading}
          empty="No pending fees found for the current filters."
          rowKey={(row, index) => row.id || `${row.student_name}-${index}`}
        />
      </div>
    </Modal>
  )
}

export function DefaulterFeeModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<DefaulterFeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [daysFilter, setDaysFilter] = useState("All")
  const [downloading, setDownloading] = useState<"csv" | "pdf" | "">("")

  useEffect(() => {
    setLoading(true)
    setError("")
    getFeeDefaulters()
      .then(setRows)
      .catch((err: Error) => {
        setRows([])
        setError(`Could not load defaulters: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }, [])

  function overdueRange(value: string): { min_days?: number; max_days?: number } {
    if (value === "1-7 Days") return { min_days: 1, max_days: 7 }
    if (value === "8-15 Days") return { min_days: 8, max_days: 15 }
    if (value === "16-30 Days") return { min_days: 16, max_days: 30 }
    if (value === "30+ Days") return { min_days: 31 }
    return {}
  }

  const filteredRows = rows.filter((row) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || row.student_name.toLowerCase().includes(query)
    const range = overdueRange(daysFilter)
    const matchesMin = range.min_days === undefined || row.days_overdue >= range.min_days
    const matchesMax = range.max_days === undefined || row.days_overdue <= range.max_days
    return matchesSearch && matchesMin && matchesMax
  })
  const exportFilters = {
    search: search.trim(),
    ...overdueRange(daysFilter),
  }

  async function downloadReport(format: "csv" | "pdf") {
    setDownloading(format)
    setError("")
    try {
      const file = await downloadFeeDefaultersReport(format, exportFilters)
      downloadBlob(file.blob, file.filename)
    } catch (err) {
      setError(err instanceof Error ? `Could not download defaulter ${format.toUpperCase()}: ${err.message}` : `Could not download defaulter ${format.toUpperCase()}.`)
    } finally {
      setDownloading("")
    }
  }

  return (
    <Modal title="Defaulter Tracking" onClose={onClose} wide>
      <div className="grid gap-4">
        {error ? <div className="rounded-lg border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-xs font-bold text-[#9A3412]">{error}</div> : null}
        <FeeModalToolbar
          search={search}
          onSearch={setSearch}
          status={daysFilter}
          onStatus={setDaysFilter}
          statusOptions={["All", "1-7 Days", "8-15 Days", "16-30 Days", "30+ Days"]}
          resultCount={filteredRows.length}
          loading={loading || Boolean(downloading)}
          onDownloadReport={() => downloadReport("pdf")}
          onExportCsv={() => downloadReport("csv")}
          searchPlaceholder="Search student name"
          downloadLabel={downloading === "pdf" ? "Downloading PDF..." : "Download Defaulter PDF"}
          exportCsvLabel={downloading === "csv" ? "Downloading CSV..." : "Download Defaulter CSV"}
        />
        <FeeTable
          columns={[
            { header: "Student Name", cell: (row) => <span className="font-black text-[#071B4A]">{row.student_name}</span> },
            { header: "Course", cell: (row) => row.course || "Course pending" },
            { header: "Batch", cell: (row) => row.batch || "Unassigned" },
            { header: "Pending Amount", cell: (row) => <span className="font-black text-[#EF4444]">{formatCurrency(row.pending_amount)}</span> },
            { header: "Due Date", cell: (row) => formatFeeDate(row.due_date) },
            { header: "Days Overdue", cell: (row) => <span className="font-black text-[#EF4444]">{row.days_overdue}</span> },
            { header: "Phone", cell: (row) => row.phone || "-" },
            { header: "Email", cell: (row) => row.email || "-" },
            { header: "Follow-up Status", cell: (row) => <FeeStatusBadge label={row.follow_up_status} /> },
          ]}
          rows={filteredRows}
          loading={loading}
          empty="No defaulters found for the current filters."
          rowKey={(row) => row.id}
        />
      </div>
    </Modal>
  )
}
