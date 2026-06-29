"use client"

import {
  API_URL,
  clearStoredSession,
  getStoredSessionValue,
  refreshStoredAccessToken,
} from "@/lib/api"
import type {
  TrainerStudent,
  TrainerStudentDetailsResponse,
  TrainerStudentFeatureStatus,
  TrainerStudentsApiResponse,
} from "../types"

const FEATURE_STATUS: TrainerStudentFeatureStatus[] = [
  {
    s_no: 29,
    feature: "Skill Progress Meter",
    phase: "Phase 4",
    status: "Uses real lesson progress",
  },
  {
    s_no: 30,
    feature: "Projects Completed Tracker",
    phase: "Phase 4",
    status: "No project records yet",
  },
  {
    s_no: 33,
    feature: "AI Learning Analytics Insights",
    phase: "Phase 4",
    status: "No AI insights recorded",
  },
  {
    s_no: 126,
    feature: "Student Performance Alert Engine",
    phase: "Phase 4",
    status: "No risk alerts recorded",
  },
]

const EMPTY_RESPONSE: TrainerStudentsApiResponse = {
  summary: {
    total_students: 0,
    active_students: 0,
    at_risk_students: 0,
    average_progress: null,
    projects_completed: null,
  },
  students: [],
  feature_status: FEATURE_STATUS,
  updated_at: new Date().toISOString(),
  connected: false,
}

async function fetchWithAuth(endpoint: string): Promise<Response> {
  const token = getStoredSessionValue("pinesphere_access_token")
  if (!token) {
    clearStoredSession()
    throw new Error("Please log in again.")
  }

  const makeRequest = (bearerToken: string) =>
    fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    })

  let response = await makeRequest(token)
  if (response.status === 401) {
    const refreshed = await refreshStoredAccessToken()
    if (refreshed) response = await makeRequest(refreshed)
  }
  return response
}

function normalizeStudent(row: Record<string, unknown>): TrainerStudent {
  return {
    id: String(row.id ?? ""),
    display_code: typeof row.display_code === "string" ? row.display_code : null,
    full_name: String(row.full_name ?? "Student"),
    email: String(row.email ?? ""),
    phone: typeof row.phone === "string" ? row.phone : null,
    batch_id: typeof row.batch_id === "string" ? row.batch_id : null,
    batch_name:
      typeof row.batch_name === "string" && row.batch_name.trim()
        ? row.batch_name
        : null,
    course:
      typeof row.course === "string"
        ? row.course
        : typeof row.course_name === "string"
        ? row.course_name
        : null,
    skill_progress:
      typeof row.skill_progress === "number" ? row.skill_progress : null,
    completed_modules:
      typeof row.completed_modules === "number" ? row.completed_modules : null,
    remaining_modules:
      typeof row.remaining_modules === "number" ? row.remaining_modules : null,
    test_average:
      typeof row.test_average === "number" ? row.test_average : null,
    test_attempts:
      typeof row.test_attempts === "number" ? row.test_attempts : 0,
    projects_completed:
      typeof row.projects_completed === "number" ? row.projects_completed : null,
    pending_projects:
      typeof row.pending_projects === "number" ? row.pending_projects : null,
    attendance_rate:
      typeof row.attendance_rate === "number" ? row.attendance_rate : null,
    risk_status:
      typeof row.risk_status === "string" ? (row.risk_status as TrainerStudent["risk_status"]) : "unknown",
    ai_insight: typeof row.ai_insight === "string" ? row.ai_insight : null,
    source:
      row.source === "batch_students" || row.source === "users.batch_name"
        ? row.source
        : "enrollments",
    student_status:
      typeof row.student_status === "string" ? row.student_status : null,
  }
}

function summaryFromStudents(students: TrainerStudent[]) {
  const activeStudents = students.filter((student) => {
    const status = (student.student_status ?? "active").toLowerCase()
    return status === "active"
  }).length
  const progressValues = students
    .map((student) => student.skill_progress)
    .filter((value): value is number => value !== null)
  const projectValues = students
    .map((student) => student.projects_completed)
    .filter((value): value is number => value !== null)

  return {
    total_students: students.length,
    active_students: activeStudents,
    at_risk_students: 0,
    average_progress:
      progressValues.length > 0
        ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
        : null,
    projects_completed:
      projectValues.length > 0
        ? projectValues.reduce((sum, value) => sum + value, 0)
        : null,
  }
}

export async function getTrainerStudents(): Promise<TrainerStudentsApiResponse> {
  const response = await fetchWithAuth("/api/v1/trainer/students")

  if (response.status === 404) return EMPTY_RESPONSE

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (typeof errorData.detail === "string") errorMessage = errorData.detail
    } catch {
      /* keep response status */
    }
    if (response.status === 401) clearStoredSession()
    throw new Error(errorMessage)
  }

  const data = await response.json()

  if (data && typeof data === "object" && "students" in data && "summary" in data) {
    return {
      summary: {
        total_students: data.summary?.total_students ?? null,
        active_students: data.summary?.active_students ?? null,
        at_risk_students: data.summary?.at_risk_students ?? null,
        average_progress: data.summary?.average_progress ?? null,
        projects_completed: data.summary?.projects_completed ?? null,
      },
      students: Array.isArray(data.students)
        ? data.students.map((row: Record<string, unknown>) => normalizeStudent(row))
        : [],
      feature_status: Array.isArray(data.feature_status)
        ? data.feature_status
        : FEATURE_STATUS,
      updated_at:
        typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
      connected: true,
    }
  }

  if (Array.isArray(data)) {
    const students = data.map((row: Record<string, unknown>) => normalizeStudent(row))
    return {
      summary: summaryFromStudents(students),
      students,
      feature_status: FEATURE_STATUS,
      updated_at: new Date().toISOString(),
      connected: true,
    }
  }

  return EMPTY_RESPONSE
}

function numberOrZero(value: unknown) {
  return typeof value === "number" ? value : 0
}

function numberOrNull(value: unknown) {
  return typeof value === "number" ? value : null
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null
}

function normalizeStudentDetails(data: Record<string, unknown>): TrainerStudentDetailsResponse {
  const batch = data.batch && typeof data.batch === "object"
    ? (data.batch as Record<string, unknown>)
    : {}
  const course = data.course && typeof data.course === "object"
    ? (data.course as Record<string, unknown>)
    : {}
  const skillProgress = data.skill_progress && typeof data.skill_progress === "object"
    ? (data.skill_progress as Record<string, unknown>)
    : {}
  const projects = data.projects && typeof data.projects === "object"
    ? (data.projects as Record<string, unknown>)
    : {}
  const attendanceSummary = data.attendance_summary && typeof data.attendance_summary === "object"
    ? (data.attendance_summary as Record<string, unknown>)
    : {}
  const lmsProgress = data.lms_progress && typeof data.lms_progress === "object"
    ? (data.lms_progress as Record<string, unknown>)
    : {}
  const aiInsights = data.ai_insights && typeof data.ai_insights === "object"
    ? (data.ai_insights as Record<string, unknown>)
    : {}
  const riskAlerts = data.risk_alerts && typeof data.risk_alerts === "object"
    ? (data.risk_alerts as Record<string, unknown>)
    : {}

  return {
    id: String(data.id ?? ""),
    display_code: stringOrNull(data.display_code),
    full_name: String(data.full_name ?? "Student"),
    email: String(data.email ?? ""),
    phone: stringOrNull(data.phone),
    batch: {
      id: stringOrNull(batch.id),
      name: stringOrNull(batch.name),
    },
    course: {
      id: String(course.id ?? ""),
      name: String(course.name ?? "Course not connected"),
    },
    skill_progress: {
      percentage: numberOrNull(skillProgress.percentage),
      completed_modules: numberOrZero(skillProgress.completed_modules),
      total_modules: numberOrZero(skillProgress.total_modules),
      status: String(skillProgress.status ?? "not_connected"),
    },
    projects: {
      completed: numberOrZero(projects.completed),
      pending: numberOrZero(projects.pending),
      recent_projects: Array.isArray(projects.recent_projects) ? projects.recent_projects : [],
    },
    attendance_summary: {
      attendance_rate: numberOrNull(attendanceSummary.attendance_rate),
      present: numberOrZero(attendanceSummary.present),
      absent: numberOrZero(attendanceSummary.absent),
      late: numberOrZero(attendanceSummary.late),
    },
    lms_progress: {
      average_progress: numberOrNull(lmsProgress.average_progress),
      completed_lessons: numberOrZero(lmsProgress.completed_lessons),
      total_lessons: numberOrZero(lmsProgress.total_lessons),
      test_average: numberOrNull(lmsProgress.test_average),
      test_attempts: numberOrZero(lmsProgress.test_attempts),
    },
    ai_insights: {
      summary: stringOrNull(aiInsights.summary),
      recommendations: Array.isArray(aiInsights.recommendations)
        ? aiInsights.recommendations.filter((item): item is string => typeof item === "string")
        : [],
      status: String(aiInsights.status ?? "awaiting_analytics_api"),
    },
    risk_alerts: {
      risk_status:
        typeof riskAlerts.risk_status === "string"
          ? (riskAlerts.risk_status as TrainerStudentDetailsResponse["risk_alerts"]["risk_status"])
          : "unknown",
      alerts: Array.isArray(riskAlerts.alerts)
        ? riskAlerts.alerts.filter((item): item is string => typeof item === "string")
        : [],
      status: String(riskAlerts.status ?? "awaiting_risk_engine"),
    },
    feature_status: Array.isArray(data.feature_status)
      ? data.feature_status
      : FEATURE_STATUS,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
  }
}

export async function getTrainerStudentDetails(studentId: string): Promise<TrainerStudentDetailsResponse> {
  const response = await fetchWithAuth(`/api/v1/trainer/students/${encodeURIComponent(studentId)}`)

  if (!response.ok) {
    let errorMessage = `${response.status} ${response.statusText}`
    try {
      const errorData = await response.json()
      if (typeof errorData.detail === "string") errorMessage = errorData.detail
    } catch {
      /* keep response status */
    }
    if (response.status === 401) clearStoredSession()
    throw new Error(errorMessage)
  }

  const data = await response.json()
  if (!data || typeof data !== "object") {
    throw new Error("Invalid student profile response.")
  }

  return normalizeStudentDetails(data as Record<string, unknown>)
}
