import { apiRequest, getStoredSessionValue } from "@/lib/api"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

export type BranchUserRecord = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  role: string
  branch_id: string
  branch_name: string
  is_active: boolean
  status: string
  display_code?: string | null
  created_at: string
  course_enrolled?: string | null
  batch_name?: string | null
  student_status?: string | null
  
  // Student Specific fields
  attendance_percent?: number
  fees_paid?: number
  fees_pending?: number
  fee_status?: string
  lms_progress?: {
    average_progress?: number
    active_enrollments?: number
  }
  
  // Trainer Specific fields
  specialization?: string
  assigned_batches?: string
  weekly_classes?: number
  workload_status?: string
  
  // Counsellor Specific fields
  assigned_leads?: number
  admissions_converted?: number
  follow_up_count?: number
  
  // Finance Specific fields
  fee_records_handled?: number
  receipts_generated?: number
}

export type OptionRecord = {
  id: string
  value: string
  label: string
  [key: string]: unknown
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

function json(method: string, body?: unknown): RequestInit {
  return { method, body: body === undefined ? undefined : JSON.stringify(body) }
}

export function getBranchUsers(filters?: QueryParams) {
  return request<BranchUserRecord[]>("/users", filters)
}

export function getBranchUser(userId: string) {
  return request<BranchUserRecord>(`/users/${userId}`)
}

export function createBranchUser(payload: Partial<BranchUserRecord>) {
  return request<BranchUserRecord>("/users", undefined, json("POST", payload))
}

export function updateBranchUser(userId: string, payload: Partial<BranchUserRecord>) {
  return request<BranchUserRecord>(`/users/${userId}`, undefined, json("PUT", payload))
}

export function assignBranchUser(userId: string, payload: QueryParams) {
  return request<BranchUserRecord>(`/users/${userId}/assign`, undefined, json("PUT", payload))
}

export function updateBranchUserStatus(userId: string, isActive: boolean) {
  return request<{ id: string; is_active: boolean; status: string }>(`/users/${userId}/status`, undefined, json("PUT", { is_active: isActive }))
}

export async function exportBranchUsers(filters?: QueryParams) {
  const tokenVal = token()
  const res = await fetch(endpoint("/users/export", filters), {
    headers: {
      Authorization: tokenVal ? `Bearer ${tokenVal}` : "",
    },
  })
  if (!res.ok) throw new Error("Failed to export users")
  return res.blob()
}

export function getRoleOptions() {
  return request<OptionRecord[]>("/options/roles")
}

export function getCourseOptions() {
  return request<OptionRecord[]>("/options/courses")
}

export function getBatchOptions(courseId?: string) {
  return request<OptionRecord[]>("/options/batches", { course_id: courseId })
}
