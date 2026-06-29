import { API_URL, apiRequest, getStoredSessionValue, parseRequestError, refreshStoredAccessToken } from "@/lib/api"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

export type BranchDashboard = {
  branch_id: string | null
  branch_name: string
  total_students: number
  active_students: number
  active_batches: number
  active_trainers: number
  new_admissions: number
  pending_admissions: number
  attendance_today_percent: number
  fee_revenue_mtd: number
  pending_fees: number
  recent_admissions: AdmissionRecord[]
  upcoming_classes: Array<{ id: string; batch: string; course: string; trainer: string; time: string; room: string }>
  branch_alerts: Array<{ title: string; detail: string; severity: "Critical" | "Warning" | "Info" }>
  recent_activity: Array<{ title: string; detail: string; time: string; module?: string }>
}

export type AdmissionRecord = {
  branch_id: string
  branch_name?: string
  id: string
  application_id: string
  student_name: string
  phone: string
  email: string
  course: string
  batch: string
  counsellor: string
  application_date: string
  admission_status: "New" | "Pending" | "Approved" | "Rejected" | "Student Created" | "Batch Assigned"
  batch_status?: string
  assigned_trainer?: string
  last_updated?: string
  admission_stage?: string
  notes: string
  student_id?: string | null
  trainer?: string
  timing?: string
}

export type StudentRecord = {
  branch_id: string
  id: string
  full_name: string
  email: string
  phone?: string | null
  course_enrolled?: string | null
  batch_name?: string | null
  student_status?: string | null
  is_active?: boolean
  role?: string
  attendance_percent?: number
  fees_paid?: number
  fees_pending?: number
  display_code?: string | null
}

export type AttendanceOverview = {
  branch_id: string | null
  kpis: {
    today_attendance_rate: number
    present_students: number
    absent_students: number
    late_checkins: number
    attendance_compliance: number
  }
  trend: Array<{ day: string; rate: number }>
  batches: Array<{ branch_id: string | null; batch: string; course: string; attendance_rate: number; students: number }>
  trainers: Array<{ branch_id: string | null; trainer: string; classes_assigned: number; attendance_submitted: number; status: "Compliant" | "Pending" | "At Risk" }>
  alerts: Array<{ title: string; detail: string; severity: "Critical" | "Warning" | "Info" }>
  risk_students: Array<{ branch_id: string | null; student: string; course: string; batch: string; attendance_rate: number; last_present: string; risk_level: "High" | "Medium" | "Low" }>
  heatmap: Array<{ day: string; slot: string; rate: number }>
  activity: Array<{ title: string; detail: string; time: string }>
}

export type InvoiceRecord = {
  branch_id: string
  id: string
  invoice_number: string
  student_id: string
  student: string
  course: string
  amount: number
  paid_amount: number
  pending_amount: number
  status: string
  due_date: string
  notes: string
}

export type FeeLedgerRecord = {
  student_name: string
  course: string
  invoice_no: string
  total_fee: number
  amount_paid: number
  pending_amount: number
  last_payment_date: string | null
  status: string
}

export type FeeLedgerResponse = {
  ledger: FeeLedgerRecord[]
  total_count: number
  page: number
  limit: number
}

export type EmiRecord = {
  id: string
  student_name: string
  course: string
  invoice_no: string
  total_fee: number
  installment_amount: number
  paid_installments: number
  pending_installments: number
  next_due_date: string
  overdue_installments: number
  emi_status: string
}

export type PendingFeeRecord = {
  id: string
  student_name: string
  course: string
  batch: string
  total_fee: number
  paid_amount: number
  pending_amount: number
  due_date: string
  status: string
}

export type DefaulterFeeRecord = {
  id: string
  student_name: string
  course: string
  batch: string
  pending_amount: number
  due_date: string
  days_overdue: number
  phone: string
  email: string
  follow_up_status: string
}

export type FeesOverview = {
  branch_id: string | null
  total_collected?: number
  collected_today: number
  revenue_mtd: number
  invoice_count: number
  pending_fees: number
  overdue_count: number
}

export type FeeReceiptRecord = {
  id: string
  payment_id: string
  receipt_no: string
  student_name: string
  invoice_no: string
  invoice_number?: string
  course: string
  amount_paid: number
  payment_mode: string
  payment_date: string
  reference_number?: string
  branch_id?: string | null
}

export type BatchRecord = {
  id?: string
  branch_id: string | null
  name?: string
  batch: string
  batch_name: string
  course_id?: string
  course: string
  course_title?: string
  trainer_id?: string
  trainer: string
  trainers?: Array<{ trainer_id: string; trainer_name: string; full_name?: string; email?: string | null }>
  capacity: number
  enrolled: number
  available_seats?: number
  schedule: string
  schedule_json?: Record<string, unknown>
  mode?: string
  status?: string
  timings?: string[]
}

export type AdmissionOptions = {
  courses: Array<{ id: string; title: string; status: string; trainer_id?: string | null }>
  batches: BatchRecord[]
  trainers: Array<{ id: string; full_name: string; email: string; branch_id?: string | null }>
}

export type BranchSettings = {
  branch_id: string | null
  branch_name: string
  branch: Record<string, string | number | null>
  preferences: Record<string, string>
}

export type BranchUserRecord = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  role: string
  role_label: string
  is_active: boolean
  status: string
  source: "users" | "hr_employees"
  branch_id: string | null
}

const BASE = "/api/v1/branch-admin"

function token() {
  return getStoredSessionValue("pinesphere_access_token")
}

function endpoint(path: string, params?: QueryParams) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value))
  })
  const query = search.toString()
  return `${BASE}${path}${query ? `?${query}` : ""}`
}

function request<T>(path: string, params?: QueryParams, init: RequestInit = {}) {
  return apiRequest<T>(endpoint(path, params), token(), init)
}

async function requestBlob(path: string, params?: QueryParams) {
  let accessToken = token()
  if (!accessToken) throw new Error("Please log in again.")

  const run = (bearerToken: string) => fetch(`${API_URL}${endpoint(path, params)}`, {
    headers: { Authorization: `Bearer ${bearerToken}` },
  })

  let response = await run(accessToken)
  if (response.status === 401) {
    accessToken = await refreshStoredAccessToken()
    if (accessToken) response = await run(accessToken)
  }
  if (!response.ok) throw new Error(await parseRequestError(response))

  const disposition = response.headers.get("Content-Disposition") ?? ""
  const filename = disposition.match(/filename="?([^"]+)"?/)?.[1] ?? "download"
  return { blob: await response.blob(), filename }
}

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) }
}

export function getBranchDashboard(filters?: QueryParams) {
  return request<BranchDashboard>("/dashboard", filters)
}

export function getAdmissions(filters?: QueryParams) {
  return request<AdmissionRecord[]>("/admissions", filters)
}

export function getPendingAdmissions(filters?: QueryParams) {
  return request<AdmissionRecord[]>("/admissions/pending", filters)
}

export function getApprovedAdmissions(filters?: QueryParams) {
  return request<AdmissionRecord[]>("/admissions/approved", filters)
}

export function getAdmissionOptions(filters?: QueryParams) {
  return request<AdmissionOptions>("/admissions/options", filters)
}

export function getAdmission(id: string) {
  return request<AdmissionRecord>(`/admissions/${id}`)
}

export function updateAdmission(id: string, payload: Partial<AdmissionRecord>) {
  return request<AdmissionRecord>(`/admissions/${id}`, undefined, json("PUT", payload))
}

export function approveAdmission(id: string, payload?: QueryParams) {
  return request<{ student: StudentRecord; admission: AdmissionRecord }>(`/admissions/${id}/approve`, undefined, json("POST", payload ?? {}))
}

export function rejectAdmission(id: string, reason: string) {
  return request<AdmissionRecord>(`/admissions/${id}/reject`, undefined, json("POST", { reason }))
}

export function assignAdmissionBatch(id: string, payload: QueryParams) {
  return request<{ student: StudentRecord; admission: AdmissionRecord }>(`/admissions/${id}/assign-batch`, undefined, json("POST", payload))
}

export function getStudents(filters?: QueryParams) {
  return request<StudentRecord[]>("/students", filters)
}

export function getStudentProfile(id: string) {
  return request<StudentRecord & Record<string, unknown>>(`/students/${id}/profile`)
}

export function createStudent(payload: Partial<StudentRecord>) {
  return request<StudentRecord>("/students", undefined, json("POST", payload))
}

export function updateStudent(id: string, payload: Partial<StudentRecord>) {
  return request<StudentRecord>(`/students/${id}`, undefined, json("PUT", payload))
}

export function assignStudentBatch(id: string, payload: QueryParams) {
  return request<StudentRecord>(`/students/${id}/assign-batch`, undefined, json("PUT", payload))
}

export function getAttendanceOverview(filters?: QueryParams) {
  return request<AttendanceOverview>("/attendance/overview", filters)
}

export function getAttendanceRecords(filters?: QueryParams) {
  return request<Array<Record<string, unknown>>>("/attendance/records", filters)
}

export function getAttendanceDefaulters(filters?: QueryParams) {
  return request<AttendanceOverview["risk_students"]>("/attendance/defaulters", filters)
}

export function getFeesOverview(filters?: QueryParams) {
  return request<FeesOverview>("/fees/dashboard", filters)
}

export function getInvoices(filters?: QueryParams) {
  return request<InvoiceRecord[]>("/fees/invoices", filters)
}

export function getPayments(filters?: QueryParams) {
  return request<Array<Record<string, unknown>>>("/fees/payments", filters)
}

export function getFeeReceipts(filters?: QueryParams) {
  return request<FeeReceiptRecord[]>("/fees/receipts", filters)
}

export function collectFee(payload: QueryParams) {
  return request<Record<string, unknown>>("/fees/collect", undefined, json("POST", payload))
}

export function downloadFeeReceiptPdf(paymentId: string) {
  return requestBlob(`/fees/receipts/${paymentId}`)
}

export function downloadFeeReceiptsReport() {
  return requestBlob("/fees/export", { type: "receipts" })
}

export function getFeeDefaulters(filters?: QueryParams) {
  return request<DefaulterFeeRecord[]>("/fees/defaulters", filters)
}

export function downloadFeeDefaultersReport(format: "csv" | "pdf", filters?: QueryParams) {
  return requestBlob("/fees/export", { ...filters, type: "defaulters", format })
}

export function getFeeLedger(filters?: QueryParams) {
  return request<FeeLedgerResponse>("/fees/ledger", filters)
}

export function getFeeEmi(filters?: QueryParams) {
  return request<EmiRecord[]>("/fees/emi", filters)
}

export function downloadFeeEmiReport(format: "csv" | "pdf", filters?: QueryParams) {
  return requestBlob("/fees/export", { ...filters, type: "emi", format })
}

export function getPendingFees(filters?: QueryParams) {
  return request<PendingFeeRecord[]>("/fees/pending", filters)
}

export function downloadPendingFeesReport(format: "csv" | "pdf", filters?: QueryParams) {
  return requestBlob("/fees/export", { ...filters, type: "pending", format })
}

export function getBatches(filters?: QueryParams) {
  return request<BatchRecord[]>("/batches", filters)
}

export function createBatch(payload: Partial<BatchRecord>) {
  return request<BatchRecord>("/batches", undefined, json("POST", payload))
}

function batchIdentifier(batch: BatchRecord | string) {
  return typeof batch === "string" ? batch : batch.id || batch.batch_name || batch.batch
}

export function updateBatch(batch: BatchRecord | string, payload: Partial<BatchRecord>) {
  return request<BatchRecord>(`/batches/${encodeURIComponent(batchIdentifier(batch))}`, undefined, json("PUT", payload))
}

export function assignTrainer(payload: QueryParams & { batch_id?: string; batch_name?: string; batch?: string }) {
  const batch = encodeURIComponent(String(payload.batch_id ?? payload.batch_name ?? payload.batch ?? ""))
  return request<Record<string, unknown>>(`/batches/${batch}/assign-trainer`, undefined, json("PUT", payload))
}

export function transferBatchStudent(batch: BatchRecord | string, payload: QueryParams & { target_batch_id?: string }) {
  const identifier = encodeURIComponent(batchIdentifier(batch))
  const method = typeof batch !== "string" && batch.id ? "POST" : "PUT"
  return request<StudentRecord>(`/batches/${identifier}/transfer-student`, undefined, json(method, payload))
}

export function getLmsOverview() {
  return request<Record<string, unknown>>("/lms/overview")
}

export function getReports(type: string, filters?: QueryParams) {
  return request<{ branch_id: string | null; type: string; rows: unknown }>(`/reports/${type}`, filters)
}

export function getBranchSettings() {
  return request<BranchSettings>("/settings")
}

export function updateBranchSettings(payload: Partial<BranchSettings>) {
  return request<BranchSettings>("/settings", undefined, json("PUT", payload))
}

export function getBranchSettingsUsers() {
  return request<BranchUserRecord[]>("/settings/users")
}

export function updateBranchSettingsUserStatus(userId: string, isActive: boolean) {
  return request<{ id: string; is_active: boolean; status: string }>(`/settings/users/${userId}/status`, undefined, json("PUT", { is_active: isActive }))
}
