/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : types.ts
 * Purpose     : TypeScript types for Trainer dashboard API responses.
 *               TrainerDashboardV1Response matches GET /api/v1/trainer/dashboard.
 *               TrainerDashboardResponse (legacy) matches GET /api/trainer/dashboard
 *               (role_dashboards.py) for backward compatibility.
 */

// ─── Legacy response shape (GET /api/trainer/dashboard) ──────────────────────

export interface ApiMetric {
  key: string
  label: string
  value: string
  helper: string
  module: string
}


export interface ApiAttendance {
  rate: number
  present: number
  total: number
  series: Array<{ label: string; rate: number }>
}


export interface ApiCourseSummary {
  total_courses: number
  published_courses: number
  lessons: number
  enrollments: number
  quizzes: number
  items: Array<{
    id: string
    title: string
    status: string
    difficulty: string
  }>
}


export interface ApiRecentActivity {
  title: string
  detail: string
  time: string
  module: string
}


export interface ApiNotification {
  title: string
  message: string
  tone: "success" | "info" | "warning"
}


export interface ApiTask {
  title: string
  status: string
  module: string
}


export interface ApiCalendarEvent {
  title: string
  date: string
  module: string
}


export interface ApiReport {
  title: string
  value: string
  module: string
}


/** Response from legacy GET /api/trainer/dashboard */
export interface TrainerDashboardResponse {
  role: string
  title: string
  scope: string
  metrics: ApiMetric[]
  recent_activity: ApiRecentActivity[]
  notifications: ApiNotification[]
  attendance: ApiAttendance
  fees: {
    collected: number
    pending: number
    overdue: number
  }
  courses: ApiCourseSummary
  tasks: ApiTask[]
  calendar: ApiCalendarEvent[]
  reports: ApiReport[]
  updated_at: string
}


// ─── V1 response shape (GET /api/v1/trainer/dashboard) ───────────────────────

export interface V1Metrics {
  total_batches: number | null
  total_students: number
  classes_today: number | null
  attendance_today: number | null
  pending_tasks: number | null
}


export interface V1TodayClass {
  id: string
  title: string
  session_date: string
  course_id: string | null
  total_records: number
  present_count: number
  attendance_rate: number | null
}


export interface V1Batch {
  id: string
  title: string
  course?: string | null
  course_id?: string | null
  status: string
  difficulty: string | null
  student_count: number
  attendance_rate?: number | null
  display_code: string | null
}


export interface V1AttendanceSummary {
  today_rate: number | null
  weekly_series: Array<{ label: string; rate: number }>
  pending_sessions: number
  submitted_sessions: number
  total_marked: number
}


export interface V1Assignment {
  id: string
  title: string
  course_id: string
  due_at: string | null
  max_marks: number
}


export interface V1TestResult {
  id: string
  title: string
  course_id: string
  status: string
  total_marks: number
  passing_score: number
}


/** Response from GET /api/v1/trainer/dashboard */
export interface TrainerDashboardV1Response {
  metrics: V1Metrics
  today_classes: V1TodayClass[]
  assigned_batches: V1Batch[]
  attendance_summary: V1AttendanceSummary
  recent_assignments: V1Assignment[]
  recent_test_results: V1TestResult[]
  pending_tasks: unknown[]
  updated_at: string
}


/** Single batch item – matches TrainerBatchItem Pydantic schema */
export interface TrainerBatch {
  id: string
  /** Batch display name */
  name: string
  /** Course name string */
  course: string
  course_id: string
  /** Enrolled student count */
  students: number
  /** Capacity is null when not explicitly configured by admin */
  capacity: number | null
  schedule: string
  mode: string
  status: string
  attendance_rate: number | null
  /** How this batch record was derived */
  source:
    | "enrollment_batch_name"
    | "user_batch_name"
    | "config"
    | "real_batch_table"
    | "placeholder"
}


/** KPI summary row – matches TrainerBatchSummary Pydantic schema */
export interface TrainerBatchSummaryKPI {
  assigned_batches: number
  active_batches: number
  total_students: number
  average_attendance: number | null
}


/** Full envelope returned by GET /api/v1/trainer/batches */
export interface TrainerBatchesApiResponse {
  summary: TrainerBatchSummaryKPI
  batches: TrainerBatch[]
  updated_at: string
}


/** Legacy UI-only summary type (used for "Not connected yet" display states) */
export interface TrainerBatchSummary {
  assigned_batches: number | "Not connected yet"
  active_batches: number | "Not connected yet"
  total_students: number | "Not connected yet"
  average_attendance: number | "Not connected yet" | null
}


export interface TrainerBatchStudent {
  id: string
  full_name: string
  email: string
  phone: string | null
  display_code: string | null
  enrollment_status: string
  attendance_rate: number | null
}


export interface TrainerBatchAttendanceSummary {
  average_rate: number | null
  pending_sessions: number
  submitted_sessions: number
}


export interface TrainerBatchLmsProgress {
  average_progress: number | null
  completed_lessons: number
  total_lessons: number
}


export interface TrainerBatchAssignment {
  id: string
  title: string
  course_id: string
  due_at: string | null
  max_marks: number
}


export interface TrainerBatchFeatureStatus {
  s_no: number
  feature: string
  phase: string
  status: string
}


export interface TrainerBatchDetailsResponse {
  id: string
  name: string
  code: string
  course: string
  branch: string
  mode: string
  status: string
  schedule: string[]
  students: TrainerBatchStudent[]
  attendance_summary: TrainerBatchAttendanceSummary
  lms_progress: TrainerBatchLmsProgress
  assignments: TrainerBatchAssignment[]
  feature_status: TrainerBatchFeatureStatus[]
  updated_at: string
  capacity?: number | null
}


export type TrainerStudentRiskStatus =
  | "unknown"
  | "low"
  | "medium"
  | "high"
  | "at_risk"

export type TrainerStudentSource =
  | "batch_students"
  | "enrollments"
  | "users.batch_name"

export interface TrainerStudentSummary {
  total_students: number | null
  active_students: number | null
  at_risk_students: number | null
  average_progress: number | null
  projects_completed: number | null
}


export interface TrainerStudent {
  id: string
  display_code: string | null
  full_name: string
  email: string
  phone: string | null
  batch_id: string | null
  batch_name: string | null
  course: string | null
  skill_progress: number | null
  completed_modules?: number | null
  remaining_modules?: number | null
  test_average?: number | null
  test_attempts?: number
  projects_completed: number | null
  pending_projects?: number | null
  attendance_rate: number | null
  risk_status: TrainerStudentRiskStatus
  ai_insight: string | null
  source: TrainerStudentSource
  student_status?: string | null
}


export interface TrainerStudentFeatureStatus {
  s_no: number
  feature: string
  phase: string
  status: string
}


export interface TrainerStudentsApiResponse {
  summary: TrainerStudentSummary
  students: TrainerStudent[]
  feature_status: TrainerStudentFeatureStatus[]
  updated_at: string
  connected: boolean
}


export interface TrainerStudentDetailsResponse {
  id: string
  display_code: string | null
  full_name: string
  email: string
  phone: string | null
  batch: {
    id: string | null
    name: string | null
  }
  course: {
    id: string
    name: string
  }
  skill_progress: {
    percentage: number | null
    completed_modules: number
    total_modules: number
    status: "connected" | "not_connected" | string
  }
  projects: {
    completed: number
    pending: number
    recent_projects: Array<Record<string, unknown>>
  }
  attendance_summary: {
    attendance_rate: number | null
    present: number
    absent: number
    late: number
  }
  lms_progress: {
    average_progress: number | null
    completed_lessons: number
    total_lessons: number
    test_average: number | null
    test_attempts: number
  }
  ai_insights: {
    summary: string | null
    recommendations: string[]
    status: "awaiting_analytics_api" | string
  }
  risk_alerts: {
    risk_status: TrainerStudentRiskStatus
    alerts: string[]
    status: "awaiting_risk_engine" | string
  }
  feature_status: TrainerStudentFeatureStatus[]
  updated_at: string
}


export interface TrainerLmsSummary {
  total_courses: number | null
  published_courses: number | null
  draft_courses: number | null
  total_lessons: number | null
  total_materials: number | null
  quiz_tools: number | null
}


export interface TrainerLmsCourse {
  id: string
  title: string
  description: string | null
  status: string
  difficulty_level: string | null
  duration: string | null
  thumbnail_url: string | null
  display_code: string | null
  lesson_count: number | null
  material_count: number | null
  quiz_count: number | null
  enrolled_students: number | null
  can_create_lessons?: boolean
  can_upload_materials?: boolean
  created_at?: string | null
  updated_at?: string | null
}


export interface TrainerLmsCourseCreate {
  title: string
  description?: string | null
  duration?: string | null
  difficulty_level: "Beginner" | "Intermediate" | "Advanced"
  status: "draft" | "published"
}


export type TrainerLmsCourseStatus = "draft" | "published"

export interface TrainerLmsCourseUpdate {
  status: TrainerLmsCourseStatus
}


export interface TrainerLmsLesson {
  id: string
  course_id: string
  title: string
  summary: string | null
  content_type: string
  video_url: string | null
  pdf_url: string | null
  assignment_url: string | null
  due_at: string | null
  max_marks: number
  sort_order: number
  is_preview: boolean
  created_at?: string | null
}


/**
 * Payload for POST /api/v1/trainer/lms/courses/{courseId}/lessons
 * Mirrors the trainer-scoped LessonCreate schema while preserving
 * optional legacy URL fields for backward compatibility.
 */
export interface TrainerLmsLessonCreate {
  title: string
  summary?: string | null
  content?: string | null
  sort_order?: number
  video_url?: string | null
  pdf_url?: string | null
  assignment_url?: string | null
}


/**
 * Payload for PATCH /api/v1/trainer/lms/courses/{courseId}/lessons/{lessonId}
 * Mirrors TrainerLmsLessonUpdate Pydantic schema in trainer.py.
 * All fields are optional — only include fields that should be updated.
 */
export interface TrainerLmsLessonUpdate {
  title?: string
  summary?: string | null
  content?: string | null
  video_url?: string | null
  pdf_url?: string | null
  assignment_url?: string | null
  content_type?: string
  due_at?: string | null
  max_marks?: number
  sort_order?: number
  is_preview?: boolean
}


export interface TrainerLmsFeatureStatus {
  s_no: number
  feature: string
  phase: string
  status: string
}


export interface TrainerLmsApiResponse {
  summary: TrainerLmsSummary
  courses: TrainerLmsCourse[]
  feature_status: TrainerLmsFeatureStatus[]
  updated_at: string
  connected: boolean
  can_create_courses: boolean | null
  upload_api_connected: boolean
}


export interface TrainerAssignmentSummary {
  total_assignments: number | null
  published_assignments: number | null
  pending_submissions: number | null
  grading_queue: number | null
}


export interface TrainerAssignment {
  id: string
  title: string
  batch: string | null
  course: string | null
  course_id?: string | null
  due_date: string | null
  submitted: number | null
  pending: number | null
  status: string
  can_view_details: boolean
  description?: string | null
  content?: string | null
  max_marks?: number | null
  assignment_url?: string | null
  github_repository_url?: string | null
}


export interface TrainerAssignmentFormValues {
  title: string
  description: string
  course_id: string
  batch_name: string
  due_at: string
  max_marks: string
  assignment_url: string
  instructions: string
}


export interface TrainerAssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string | null
  student: string | null
  submitted_at: string | null
  status: string
  marks: number | null
  feedback_status: string
}


export interface TrainerAssignmentFeatureStatus {
  s_no: number
  feature: string
  phase: string
  status: string
}


export interface TrainerAssignmentsApiResponse {
  summary: TrainerAssignmentSummary
  assignments: TrainerAssignment[]
  feature_status: TrainerAssignmentFeatureStatus[]
  updated_at: string
  connected: boolean
  can_create_assignments: boolean | null
  create_assignment_api_connected: boolean
  github_repository_linking: boolean
}


// ─── Attendance Types ─────────────────────────────────────────────────────────

/** Single session item – matches TrainerAttendanceSessionItem Pydantic schema */
export interface TrainerAttendanceSession {
  id: string
  title: string
  session_date: string
  batch_id: string | null
  batch_name: string | null
  course_id: string | null
  course_name: string | null
  status: "pending" | "submitted" | string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  attendance_rate: number | null
  created_at: string | null
}


/** Full session detail with student records – matches TrainerAttendanceSessionDetail */
export interface TrainerAttendanceSessionDetail {
  id: string
  title: string
  session_date: string
  batch_id: string | null
  batch_name: string | null
  course_id: string | null
  course_name: string | null
  status: "pending" | "submitted" | string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  attendance_rate: number | null
  created_at: string | null
  students: TrainerAttendanceStudentRecord[]
}


/** Single student row within a session – matches TrainerAttendanceStudentRecord */
export interface TrainerAttendanceStudentRecord {
  student_id: string
  full_name: string
  display_code: string | null
  status: "present" | "absent" | "late" | "unmarked"
  remarks: string | null
}


/** Single row in the attendance history list */
export interface TrainerAttendanceHistoryItem {
  id: string
  title: string
  session_date: string
  batch_id: string | null
  batch_name: string | null
  course_id: string | null
  course_name: string | null
  status: "pending" | "submitted" | string
  total_students: number
  present_count: number
  absent_count: number
  late_count: number
  attendance_rate: number | null
}


/** KPI summary for attendance landing page */
export interface TrainerAttendanceSummary {
  total_sessions: number
  today_attendance_rate: number | null
  pending_sessions: number
}


/** Single mark record sent in POST …/mark body */
export interface TrainerAttendanceMarkRecord {
  student_id: string
  status: "present" | "absent" | "late"
  remarks: string | null
}

// ─── LMS Material Types ───────────────────────────────────────────────────────

/**
 * Single material row — mirrors TrainerLessonMaterialResponse Pydantic schema
 * and the trainer_lesson_materials DB table exactly.
 */
export interface TrainerLessonMaterial {
  id: string
  course_id: string
  /** null when the material is not linked to a specific lesson */
  lesson_id: string | null
  trainer_id: string
  filename: string
  /** Protected API URL used to download the material with auth headers. */
  file_url: string
  /** File size in bytes; null if not recorded */
  file_size: number | null
  /** "pdf" | "video" */
  content_type: string
  download_count: number
  created_at: string | null
}


/**
 * Envelope returned by:
 *   GET /api/v1/trainer/lms/materials
 *   GET /api/v1/trainer/lms/courses/{courseId}/materials
 * Mirrors TrainerLessonMaterialListResponse Pydantic schema.
 */
export interface TrainerLessonMaterialListResponse {
  materials: TrainerLessonMaterial[]
  total: number
  updated_at: string
}


/**
 * Input shape for the upload call in trainerLmsService.ts.
 * Represents the form fields sent as multipart/form-data to
 * POST /api/v1/trainer/lms/materials.
 */
export interface TrainerMaterialUploadInput {
  courseId: string
  /** Optional — links the material to a specific lesson */
  lessonId?: string | null
  file: File
}
