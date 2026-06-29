"use client"

import {
  API_URL,
  clearStoredSession,
  getStoredSessionValue,
  refreshStoredAccessToken,
} from "@/lib/api"
import type {
  TrainerAssignment,
  TrainerAssignmentFormValues,
  TrainerAssignmentFeatureStatus,
  TrainerAssignmentSubmission,
  TrainerAssignmentsApiResponse,
} from "../types"

const FEATURE_STATUS: TrainerAssignmentFeatureStatus[] = [
  {
    s_no: 39,
    feature: "Assignment Submission Portal",
    phase: "Phase 5",
    status: "Assignment records available",
  },
  {
    s_no: 99,
    feature: "GitHub Repository Integration",
    phase: "Phase 5",
    status: "No repository records yet",
  },
]

const EMPTY_RESPONSE: TrainerAssignmentsApiResponse = {
  summary: {
    total_assignments: 0,
    published_assignments: 0,
    pending_submissions: 0,
    grading_queue: 0,
  },
  assignments: [],
  feature_status: FEATURE_STATUS,
  updated_at: new Date().toISOString(),
  connected: false,
  can_create_assignments: null,
  create_assignment_api_connected: false,
  github_repository_linking: false,
}

async function fetchWithAuth(endpoint: string, init?: RequestInit): Promise<Response> {
  const token = getStoredSessionValue("pinesphere_access_token")
  if (!token) {
    clearStoredSession()
    throw new Error("Please log in again.")
  }

  const makeRequest = (bearerToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        ...(init?.headers ?? {}),
      },
    })

  let response = await makeRequest(token)
  if (response.status === 401) {
    const refreshed = await refreshStoredAccessToken()
    if (refreshed) response = await makeRequest(refreshed)
  }
  return response
}

function numberOrNull(value: unknown) {
  return typeof value === "number" ? value : null
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizeAssignment(row: Record<string, unknown>): TrainerAssignment {
  const batch =
    row.batch ??
    row.batch_name ??
    row.batch_title ??
    row.assigned_batch ??
    null
  const course =
    row.course ??
    row.course_name ??
    row.course_title ??
    null

  return {
    id: String(row.id ?? row.assignment_id ?? ""),
    title: String(row.title ?? row.assignment ?? "Untitled assignment"),
    batch: stringOrNull(batch),
    course: stringOrNull(course),
    course_id: stringOrNull(row.course_id),
    due_date: stringOrNull(row.due_date ?? row.due_at ?? row.deadline),
    submitted: numberOrNull(row.submitted ?? row.submitted_count ?? row.submissions),
    pending: numberOrNull(row.pending ?? row.pending_count ?? row.pending_submissions),
    status: String(row.status ?? "draft"),
    can_view_details: row.can_view_details !== false,
    description: stringOrNull(row.description ?? row.summary),
    content: stringOrNull(row.content),
    max_marks: numberOrNull(row.max_marks),
    assignment_url: stringOrNull(row.assignment_url),
    github_repository_url: stringOrNull(row.github_repository_url),
  }
}

function normalizeSubmission(row: Record<string, unknown>): TrainerAssignmentSubmission {
  return {
    id: String(row.id ?? row.submission_id ?? ""),
    assignment_id: String(row.assignment_id ?? ""),
    student_id: stringOrNull(row.student_id),
    student: stringOrNull(row.student ?? row.student_name ?? row.full_name),
    submitted_at: stringOrNull(row.submitted_at ?? row.created_at),
    status: String(row.status ?? "not_submitted"),
    marks: numberOrNull(row.marks ?? row.score),
    feedback_status: String(row.feedback_status ?? "Pending"),
  }
}

function encodePathSegment(value: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(value))
  } catch {
    return encodeURIComponent(value)
  }
}

function assignmentBody(values: TrainerAssignmentFormValues) {
  return {
    title: values.title.trim(),
    summary: values.description.trim() || null,
    course_id: values.course_id,
    batch_name: values.batch_name.trim(),
    due_at: values.due_at,
    max_marks: Number(values.max_marks),
    assignment_url: values.assignment_url.trim() || null,
    content: values.instructions.trim() || null,
    status: "draft",
  }
}

function summaryFromAssignments(assignments: TrainerAssignment[]) {
  const submittedValues = assignments
    .map((assignment) => assignment.submitted)
    .filter((value): value is number => value !== null)
  const pendingValues = assignments
    .map((assignment) => assignment.pending)
    .filter((value): value is number => value !== null)

  return {
    total_assignments: assignments.length,
    published_assignments: assignments.filter(
      (assignment) => assignment.status.toLowerCase() === "published"
    ).length,
    pending_submissions: pendingValues.length
      ? pendingValues.reduce((sum, value) => sum + value, 0)
      : 0,
    grading_queue: submittedValues.length
      ? submittedValues.reduce((sum, value) => sum + value, 0)
      : 0,
  }
}

async function readError(response: Response) {
  let errorMessage = `${response.status} ${response.statusText}`
  try {
    const errorData = await response.json()
    if (typeof errorData.detail === "string") errorMessage = errorData.detail
  } catch {
    /* keep response status */
  }
  if (response.status === 401) clearStoredSession()
  return errorMessage
}

export async function getTrainerAssignments(): Promise<TrainerAssignmentsApiResponse> {
  const response = await fetchWithAuth("/api/v1/trainer/assignments")

  if (response.status === 404) return EMPTY_RESPONSE

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  if (data && typeof data === "object" && "assignments" in data) {
    const assignments = Array.isArray(data.assignments)
      ? data.assignments.map((row: Record<string, unknown>) => normalizeAssignment(row))
      : []

    return {
      summary: {
        total_assignments:
          numberOrNull(data.summary?.total_assignments) ?? assignments.length,
        published_assignments: numberOrNull(data.summary?.published_assignments),
        pending_submissions: numberOrNull(data.summary?.pending_submissions),
        grading_queue: numberOrNull(data.summary?.grading_queue),
      },
      assignments,
      feature_status: Array.isArray(data.feature_status)
        ? data.feature_status
        : FEATURE_STATUS,
      updated_at:
        typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
      connected: true,
      can_create_assignments:
        typeof data.can_create_assignments === "boolean"
          ? data.can_create_assignments
          : null,
      create_assignment_api_connected: data.create_assignment_api_connected === true,
      github_repository_linking: data.github_repository_linking === true,
    }
  }

  if (Array.isArray(data)) {
    const assignments = data.map((row: Record<string, unknown>) => normalizeAssignment(row))
    return {
      ...EMPTY_RESPONSE,
      summary: summaryFromAssignments(assignments),
      assignments,
      connected: true,
    }
  }

  return EMPTY_RESPONSE
}

export async function getTrainerAssignmentDetails(assignmentId: string): Promise<TrainerAssignment | null> {
  if (!assignmentId) return null

  const response = await fetchWithAuth(
    `/api/v1/trainer/assignments/${encodePathSegment(assignmentId)}`
  )

  if (response.status === 404) return null

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  if (data && typeof data === "object") {
    return normalizeAssignment(data)
  }

  return null
}

export async function getTrainerAssignmentSubmissions(
  assignmentId: string
): Promise<TrainerAssignmentSubmission[]> {
  if (!assignmentId) return []

  const response = await fetchWithAuth(
    `/api/v1/trainer/assignments/${encodePathSegment(assignmentId)}/submissions`
  )

  if (response.status === 404) return []

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  if (!Array.isArray(data)) return []

  return data.map((row: Record<string, unknown>) => normalizeSubmission(row))
}

export const getTrainerAssignmentDetail = getTrainerAssignmentDetails

export async function createTrainerAssignment(
  values: TrainerAssignmentFormValues
): Promise<TrainerAssignment> {
  const response = await fetchWithAuth("/api/v1/trainer/assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(assignmentBody(values)),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeAssignment(data)
}

export async function updateTrainerAssignment(
  assignmentId: string,
  values: TrainerAssignmentFormValues
): Promise<TrainerAssignment> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/assignments/${encodePathSegment(assignmentId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(assignmentBody(values)),
    }
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeAssignment(data)
}
