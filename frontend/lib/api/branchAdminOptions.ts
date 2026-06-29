import { apiRequest, getStoredSessionValue } from "@/lib/api"
import type { BatchRecord, InvoiceRecord, StudentRecord } from "./branchAdmin"

export type BranchContext = {
  branch_id: string | null
  branch_name: string
  branch_code: string
  city: string
  logged_in_user_name: string
  role: string
}

export type OptionRecord = {
  id: string
  value: string
  label: string
  branch_id?: string | null
  [key: string]: unknown
}

export type CourseOption = OptionRecord & {
  title: string
  status: string
  trainer_id?: string | null
}

export type BatchOption = BatchRecord & OptionRecord & {
  available_seats?: number
  timings?: string[]
}

export type TrainerOption = OptionRecord & {
  full_name: string
  email?: string | null
  source: "users" | "hr_employees"
}

export type StudentOption = StudentRecord & OptionRecord
export type InvoiceOption = InvoiceRecord & OptionRecord
export type PaymentMethodOption = OptionRecord
export type StatusOption = OptionRecord
export type TimingOption = OptionRecord
export type ModeOption = OptionRecord

const BASE = "/api/v1/branch-admin"

function token() {
  return getStoredSessionValue("pinesphere_access_token")
}

function endpoint(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  const search = new URLSearchParams()
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value))
  })
  const query = search.toString()
  return `${BASE}${path}${query ? `?${query}` : ""}`
}

function request<T>(path: string, params?: Record<string, string | number | boolean | null | undefined>) {
  return apiRequest<T>(endpoint(path, params), token())
}

export function getBranchContext() {
  return request<BranchContext>("/me")
}

export function getCourseOptions() {
  return request<CourseOption[]>("/options/courses")
}

export function getBatchOptions(courseId?: string) {
  return request<BatchOption[]>("/options/batches", { course_id: courseId })
}

export function getTrainerOptions() {
  return request<TrainerOption[]>("/options/trainers")
}

export function getStudentOptions() {
  return request<StudentOption[]>("/options/students")
}

export function getInvoiceOptions(studentId?: string) {
  return request<InvoiceOption[]>("/options/invoices", { student_id: studentId })
}

export function getPaymentMethodOptions() {
  return request<PaymentMethodOption[]>("/options/payment-methods")
}

export function getStatusOptions(module: string) {
  return request<StatusOption[]>("/options/statuses", { module })
}

export function getTimingOptions(batchId?: string) {
  return request<TimingOption[]>("/options/timings", { batch_id: batchId })
}

export function getModeOptions() {
  return request<ModeOption[]>("/options/modes")
}
