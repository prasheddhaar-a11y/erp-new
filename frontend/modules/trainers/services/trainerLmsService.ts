"use client"

import {
  API_URL,
  clearStoredSession,
  getStoredSessionValue,
  refreshStoredAccessToken,
} from "@/lib/api"
import type {
  TrainerLessonMaterial,
  TrainerLessonMaterialListResponse,
  TrainerLmsCourse,
  TrainerLmsCourseCreate,
  TrainerLmsCourseUpdate,
  TrainerLmsFeatureStatus,
  TrainerLmsLesson,
  TrainerLmsLessonCreate,
  TrainerLmsLessonUpdate,
  TrainerLmsApiResponse,
  TrainerMaterialUploadInput,
} from "../types"

// ─── Static feature status list ──────────────────────────────────────────────

const FEATURE_STATUS: TrainerLmsFeatureStatus[] = [
  {
    s_no: 35,
    feature: "Course Creation Wizard",
    phase: "Phase 5",
    status: "Available for assigned courses",
  },
  {
    s_no: 36,
    feature: "Video Lesson Upload & HLS Streaming",
    phase: "Phase 5",
    status: "Uses saved lesson video links",
  },
  {
    s_no: 37,
    feature: "PDF / Document Attachment",
    phase: "Phase 5",
    status: "Uses saved lesson PDF links",
  },
  {
    s_no: 45,
    feature: "AI Quiz Generator",
    phase: "Phase 5",
    status: "No quiz generator records yet",
  },
  {
    s_no: 99,
    feature: "GitHub Repository Integration",
    phase: "Phase 5",
    status: "No repository records yet",
  },
]

const EMPTY_RESPONSE: TrainerLmsApiResponse = {
  summary: {
    total_courses: 0,
    published_courses: 0,
    draft_courses: 0,
    total_lessons: 0,
    total_materials: 0,
    quiz_tools: 0,
  },
  courses: [],
  feature_status: FEATURE_STATUS,
  updated_at: new Date().toISOString(),
  connected: false,
  can_create_courses: null,
  upload_api_connected: false,
}

// ─── Auth-aware fetch ─────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function numberOrNull(value: unknown): number | null {
  return typeof value === "number" ? value : null
}

function numberOrZero(value: unknown): number {
  return typeof value === "number" ? value : 0
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

async function readError(response: Response): Promise<string> {
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

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeCourse(row: Record<string, unknown>): TrainerLmsCourse {
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? row.name ?? "Untitled course"),
    description: stringOrNull(row.description),
    status: String(row.status ?? "draft"),
    difficulty_level: stringOrNull(row.difficulty_level ?? row.difficulty),
    duration: stringOrNull(row.duration),
    thumbnail_url: stringOrNull(row.thumbnail_url),
    display_code: stringOrNull(row.display_code),
    lesson_count: numberOrNull(row.lesson_count ?? row.lessons_count ?? row.lessons),
    material_count: numberOrNull(row.material_count ?? row.materials_count ?? row.materials),
    quiz_count: numberOrNull(row.quiz_count ?? row.quizzes_count ?? row.quizzes),
    enrolled_students: numberOrNull(row.enrolled_students ?? row.student_count ?? row.students),
    can_create_lessons: row.can_create_lessons === true,
    can_upload_materials: row.can_upload_materials === true,
    created_at: stringOrNull(row.created_at),
    updated_at: stringOrNull(row.updated_at),
  }
}

function normalizeLesson(row: Record<string, unknown>): TrainerLmsLesson {
  return {
    id: String(row.id ?? ""),
    course_id: String(row.course_id ?? ""),
    title: String(row.title ?? "Untitled lesson"),
    summary: stringOrNull(row.summary),
    content_type: String(row.content_type ?? "lesson"),
    video_url: stringOrNull(row.video_url),
    pdf_url: stringOrNull(row.pdf_url),
    assignment_url: stringOrNull(row.assignment_url),
    due_at: stringOrNull(row.due_at),
    max_marks: numberOrZero(row.max_marks),
    sort_order: numberOrZero(row.sort_order),
    is_preview: row.is_preview === true,
    created_at: stringOrNull(row.created_at),
  }
}

/**
 * Maps a raw API row from trainer_lesson_materials to TrainerLessonMaterial.
 * Mirrors TrainerLessonMaterialResponse Pydantic schema.
 */
function normalizeMaterial(row: Record<string, unknown>): TrainerLessonMaterial {
  return {
    id: String(row.id ?? ""),
    course_id: String(row.course_id ?? ""),
    lesson_id: stringOrNull(row.lesson_id),
    trainer_id: String(row.trainer_id ?? ""),
    filename: String(row.filename ?? ""),
    file_url: String(row.file_url ?? ""),
    file_size: numberOrNull(row.file_size),
    content_type: String(row.content_type ?? "pdf"),
    download_count: numberOrZero(row.download_count),
    created_at: stringOrNull(row.created_at),
  }
}

function summaryFromCourses(courses: TrainerLmsCourse[]) {
  const lessonValues = courses
    .map((course) => course.lesson_count)
    .filter((value): value is number => value !== null)
  const materialValues = courses
    .map((course) => course.material_count)
    .filter((value): value is number => value !== null)
  const quizValues = courses
    .map((course) => course.quiz_count)
    .filter((value): value is number => value !== null)

  return {
    total_courses: courses.length,
    published_courses: courses.filter((course) => course.status.toLowerCase() === "published").length,
    draft_courses: courses.filter((course) => course.status.toLowerCase() === "draft").length,
    total_lessons: lessonValues.reduce((sum, value) => sum + value, 0),
    total_materials: materialValues.reduce((sum, value) => sum + value, 0),
    quiz_tools: quizValues.reduce((sum, value) => sum + value, 0),
  }
}

// ─── Course functions ─────────────────────────────────────────────────────────

export async function getTrainerCourses(): Promise<TrainerLmsApiResponse> {
  const response = await fetchWithAuth("/api/v1/trainer/lms/courses")

  if (response.status === 404) return EMPTY_RESPONSE

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  if (data && typeof data === "object" && "courses" in data) {
    const courses = Array.isArray(data.courses)
      ? data.courses.map((row: Record<string, unknown>) => normalizeCourse(row))
      : []

    return {
      summary: {
        total_courses: numberOrNull(data.summary?.total_courses) ?? courses.length,
        published_courses: numberOrNull(data.summary?.published_courses),
        draft_courses: numberOrNull(data.summary?.draft_courses),
        total_lessons: numberOrNull(data.summary?.total_lessons),
        total_materials: numberOrNull(data.summary?.total_materials ?? data.summary?.uploaded_materials),
        quiz_tools: numberOrNull(data.summary?.quiz_tools ?? data.summary?.total_quizzes),
      },
      courses,
      feature_status: Array.isArray(data.feature_status) ? data.feature_status : FEATURE_STATUS,
      updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
      connected: true,
      can_create_courses:
        typeof data.can_create_courses === "boolean" ? data.can_create_courses : null,
      upload_api_connected: data.upload_api_connected === true,
    }
  }

  if (Array.isArray(data)) {
    const courses = data.map((row: Record<string, unknown>) => normalizeCourse(row))
    return {
      ...EMPTY_RESPONSE,
      summary: summaryFromCourses(courses),
      courses,
      connected: true,
    }
  }

  return EMPTY_RESPONSE
}

/**
 * GET /api/v1/trainer/lms/courses/{courseId}
 * Returns a single trainer-owned course. Server validates ownership — 404 if not found or not owned.
 */
export async function getTrainerCourseDetail(courseId: string): Promise<TrainerLmsCourse> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}`
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeCourse(data as Record<string, unknown>)
}

export async function createTrainerCourse(
  payload: TrainerLmsCourseCreate
): Promise<TrainerLmsCourse> {
  const response = await fetchWithAuth("/api/v1/trainer/lms/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeCourse(data as Record<string, unknown>)
}

export async function getTrainerCourseLessons(courseId: string): Promise<TrainerLmsLesson[]> {
  if (!courseId) return []

  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}/lessons`
  )

  if (response.status === 404) return []

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  if (Array.isArray(data)) {
    return data.map((row: Record<string, unknown>) => normalizeLesson(row))
  }
  if (data && typeof data === "object" && Array.isArray(data.lessons)) {
    return data.lessons.map((row: Record<string, unknown>) => normalizeLesson(row))
  }
  return []
}

// ─── Lesson mutation functions ────────────────────────────────────────────────

/**
 * POST /api/v1/trainer/lms/courses/{courseId}/lessons
 * Creates a lesson for a trainer-owned course.
 * Returns the created lesson normalised from the server response.
 */
export async function createTrainerLesson(
  courseId: string,
  payload: TrainerLmsLessonCreate
): Promise<TrainerLmsLesson> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}/lessons`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeLesson(data as Record<string, unknown>)
}

/**
 * PATCH /api/v1/trainer/lms/courses/{courseId}/lessons/{lessonId}
 * Sends only the fields present in `payload` (partial update).
 * Returns the updated lesson normalised from the server response.
 */
export async function updateTrainerLesson(
  courseId: string,
  lessonId: string,
  payload: TrainerLmsLessonUpdate
): Promise<TrainerLmsLesson> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeLesson(data as Record<string, unknown>)
}

/**
 * DELETE /api/v1/trainer/lms/courses/{courseId}/lessons/{lessonId}
 * Resolves on 200/204; throws on any non-ok status.
 */
export async function deleteTrainerLesson(
  courseId: string,
  lessonId: string
): Promise<void> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
    { method: "DELETE" }
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }
}

// ─── Course status function ───────────────────────────────────────────────────

/**
 * PATCH /api/v1/trainer/lms/courses/{courseId}
 * Updates course status to "draft" or "published".
 * Returns the updated course normalised from the server response.
 */
export async function updateTrainerCourseStatus(
  courseId: string,
  payload: TrainerLmsCourseUpdate
): Promise<TrainerLmsCourse> {
  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeCourse(data as Record<string, unknown>)
}

// ─── Material functions (Phase 3) ─────────────────────────────────────────────

/**
 * GET /api/v1/trainer/lms/materials
 * Returns all materials across all trainer-owned courses.
 * Mirrors TrainerLessonMaterialListResponse envelope: { materials, total, updated_at }.
 */
export async function getTrainerMaterials(): Promise<TrainerLessonMaterialListResponse> {
  const response = await fetchWithAuth("/api/v1/trainer/lms/materials")

  if (response.status === 404) {
    return { materials: [], total: 0, updated_at: new Date().toISOString() }
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()

  // Handle envelope: { materials: [...], total: N, updated_at: "..." }
  if (data && typeof data === "object" && Array.isArray(data.materials)) {
    return {
      materials: data.materials.map((row: Record<string, unknown>) => normalizeMaterial(row)),
      total: typeof data.total === "number" ? data.total : data.materials.length,
      updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
    }
  }

  // Fallback: bare array
  if (Array.isArray(data)) {
    const materials = data.map((row: Record<string, unknown>) => normalizeMaterial(row))
    return { materials, total: materials.length, updated_at: new Date().toISOString() }
  }

  return { materials: [], total: 0, updated_at: new Date().toISOString() }
}

/**
 * GET /api/v1/trainer/lms/courses/{courseId}/materials
 * Returns materials scoped to a single trainer-owned course.
 * Used by TrainerMaterialUploadPanel and the course detail material list.
 */
export async function getCourseMaterials(courseId: string): Promise<TrainerLessonMaterialListResponse> {
  if (!courseId) return { materials: [], total: 0, updated_at: new Date().toISOString() }

  const response = await fetchWithAuth(
    `/api/v1/trainer/lms/courses/${encodeURIComponent(courseId)}/materials`
  )

  if (response.status === 404) {
    return { materials: [], total: 0, updated_at: new Date().toISOString() }
  }

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()

  if (data && typeof data === "object" && Array.isArray(data.materials)) {
    return {
      materials: data.materials.map((row: Record<string, unknown>) => normalizeMaterial(row)),
      total: typeof data.total === "number" ? data.total : data.materials.length,
      updated_at: typeof data.updated_at === "string" ? data.updated_at : new Date().toISOString(),
    }
  }

  if (Array.isArray(data)) {
    const materials = data.map((row: Record<string, unknown>) => normalizeMaterial(row))
    return { materials, total: materials.length, updated_at: new Date().toISOString() }
  }

  return { materials: [], total: 0, updated_at: new Date().toISOString() }
}

/**
 * POST /api/v1/trainer/lms/materials
 * Uploads a file as multipart/form-data.
 * Accepts courseId (required) and optional lessonId from TrainerMaterialUploadInput.
 * Returns the saved TrainerLessonMaterial row from the database.
 */
export async function uploadTrainerMaterial(
  input: TrainerMaterialUploadInput
): Promise<TrainerLessonMaterial> {
  const formData = new FormData()
  formData.append("course_id", input.courseId)
  formData.append("file", input.file)
  if (input.lessonId) {
    formData.append("lesson_id", input.lessonId)
  }

  const response = await fetchWithAuth("/api/v1/trainer/lms/materials", {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type — browser sets multipart boundary automatically
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  const data = await response.json()
  return normalizeMaterial(data as Record<string, unknown>)
}
