"""
PINESPHERE ERP
Module      : Trainer Module
File        : trainer.py
Purpose     : Pydantic schemas for Trainer-scoped read-only API responses.
              TrainerBatchItem     – single batch entry returned by /batches
              TrainerBatchSummary  – aggregate KPIs row
              TrainerBatchResponse – full envelope returned by GET /api/v1/trainer/batches
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel


# ─── Batch Item ───────────────────────────────────────────────────────────────

class TrainerBatchItem(BaseModel):
    """One batch entry visible to the authenticated trainer."""

    id: str
    name: str
    course: str
    course_id: str
    students: int
    capacity: Optional[int] = None  # None when not explicitly configured
    schedule: str
    mode: str
    status: str
    attendance_rate: Optional[float] = None
    # Source flag – how this batch record was derived:
    #   "enrollment_batch_name" – from enrollments.batch_name
    #   "user_batch_name"       – from users.batch_name
    #   "config"                – from branch system-setting metadata
    source: str

    class Config:
        from_attributes = True


# ─── Summary ─────────────────────────────────────────────────────────────────

class TrainerBatchSummary(BaseModel):
    """Aggregate KPI metrics across all visible trainer batches."""

    assigned_batches: int
    active_batches: int
    total_students: int
    average_attendance: Optional[float] = None


# ─── Response Envelope ────────────────────────────────────────────────────────

class TrainerBatchResponse(BaseModel):
    """Full envelope returned by GET /api/v1/trainer/batches."""

    summary: TrainerBatchSummary
    batches: list[TrainerBatchItem]
    updated_at: str  # ISO-8601 datetime string


# ─── Batch Details ────────────────────────────────────────────────────────────

class TrainerBatchStudent(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    display_code: Optional[str] = None
    enrollment_status: str
    attendance_rate: Optional[float] = None


class TrainerBatchAttendanceSummary(BaseModel):
    average_rate: Optional[float] = None
    pending_sessions: int = 0
    submitted_sessions: int = 0


class TrainerBatchLmsProgress(BaseModel):
    average_progress: Optional[float] = None
    completed_lessons: int = 0
    total_lessons: int = 0


class TrainerBatchAssignment(BaseModel):
    id: str
    title: str
    course_id: str
    due_at: Optional[str] = None
    max_marks: int


class TrainerBatchFeatureStatus(BaseModel):
    s_no: int
    feature: str
    phase: str
    status: str


class TrainerFeatureStatusItem(BaseModel):
    s_no: int
    feature: str
    phase: str
    status: str


class TrainerStudentSummary(BaseModel):
    total_students: int = 0
    active_students: int = 0
    at_risk_students: int = 0
    average_progress: Optional[float] = None
    projects_completed: Optional[int] = None


class TrainerStudentItem(BaseModel):
    id: str
    display_code: Optional[str] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    batch_id: Optional[str] = None
    batch_name: Optional[str] = None
    course: Optional[str] = None
    skill_progress: Optional[float] = None
    completed_modules: Optional[int] = None
    remaining_modules: Optional[int] = None
    test_average: Optional[float] = None
    test_attempts: int = 0
    projects_completed: Optional[int] = None
    attendance_rate: Optional[float] = None
    risk_status: str = "unknown"
    ai_insight: Optional[str] = None
    source: str


class TrainerStudentsResponse(BaseModel):
    summary: TrainerStudentSummary
    students: list[TrainerStudentItem]
    feature_status: list[TrainerFeatureStatusItem]
    updated_at: str


class TrainerStudentBatchRef(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None


class TrainerStudentCourseRef(BaseModel):
    id: str
    name: str


class TrainerStudentSkillProgress(BaseModel):
    percentage: Optional[float] = None
    completed_modules: int = 0
    total_modules: int = 0
    status: str = "not_connected"


class TrainerStudentProjects(BaseModel):
    completed: int = 0
    pending: int = 0
    recent_projects: list[dict] = []


class TrainerStudentAttendanceSummary(BaseModel):
    attendance_rate: Optional[float] = None
    present: int = 0
    absent: int = 0
    late: int = 0


class TrainerStudentLmsProgress(BaseModel):
    average_progress: Optional[float] = None
    completed_lessons: int = 0
    total_lessons: int = 0
    test_average: Optional[float] = None
    test_attempts: int = 0


class TrainerStudentAIInsights(BaseModel):
    summary: Optional[str] = None
    recommendations: list[str] = []
    status: str = "awaiting_analytics_api"


class TrainerStudentRiskAlerts(BaseModel):
    risk_status: str = "unknown"
    alerts: list[str] = []
    status: str = "awaiting_risk_engine"


class TrainerStudentDetailsResponse(BaseModel):
    id: str
    display_code: Optional[str] = None
    full_name: str
    email: str
    phone: Optional[str] = None
    batch: TrainerStudentBatchRef
    course: TrainerStudentCourseRef
    skill_progress: TrainerStudentSkillProgress
    projects: TrainerStudentProjects
    attendance_summary: TrainerStudentAttendanceSummary
    lms_progress: TrainerStudentLmsProgress
    ai_insights: TrainerStudentAIInsights
    risk_alerts: TrainerStudentRiskAlerts
    feature_status: list[TrainerFeatureStatusItem]
    updated_at: str


class TrainerBatchDetailsResponse(BaseModel):
    id: str
    name: str
    code: str
    course: str
    branch: str
    mode: str
    status: str
    schedule: list[str] = []
    students: list[TrainerBatchStudent]
    attendance_summary: TrainerBatchAttendanceSummary
    lms_progress: TrainerBatchLmsProgress
    assignments: list[TrainerBatchAssignment] = []
    feature_status: list[TrainerBatchFeatureStatus]
    updated_at: str


class TrainerLmsFeatureStatusItem(BaseModel):
    s_no: int
    feature: str
    phase: str
    status: str


class TrainerLmsCourseItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    difficulty_level: Optional[str] = None
    duration: Optional[str] = None
    thumbnail_url: Optional[str] = None
    display_code: Optional[str] = None
    lesson_count: int = 0
    material_count: int = 0
    quiz_count: int = 0
    enrolled_students: int = 0
    can_create_lessons: bool = True
    can_upload_materials: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TrainerLmsCourseDetail(TrainerLmsCourseItem):
    pass


class TrainerLmsCourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration: Optional[str] = None
    difficulty_level: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    status: Literal["draft", "published"] = "draft"


class TrainerLmsLessonItem(BaseModel):
    id: str
    course_id: str
    title: str
    summary: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    assignment_url: Optional[str] = None
    content_type: str = "lesson"
    due_at: Optional[str] = None
    max_marks: int = 0
    sort_order: int = 1
    is_preview: bool = False
    created_at: Optional[str] = None


class TrainerLmsMaterialItem(BaseModel):
    id: str
    course_id: str
    filename: str
    content_type: Optional[str] = None
    url: Optional[str] = None
    created_at: Optional[str] = None


class TrainerLmsCoursesResponse(BaseModel):
    summary: dict[str, int]
    courses: list[TrainerLmsCourseItem]
    feature_status: list[TrainerLmsFeatureStatusItem]
    updated_at: str


class TrainerLmsLessonsResponse(BaseModel):
    lessons: list[TrainerLmsLessonItem]
    updated_at: str


class TrainerLmsLessonUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    assignment_url: Optional[str] = None
    content_type: Optional[str] = None
    due_at: Optional[datetime] = None
    max_marks: Optional[int] = None
    sort_order: Optional[int] = None
    is_preview: Optional[bool] = None


class TrainerLmsCourseUpdate(BaseModel):
    status: Optional[Literal["draft", "published"]] = None


class TrainerAssignmentFeatureStatusItem(BaseModel):
    s_no: int
    feature: str
    phase: str
    status: str


class TrainerAssignmentSummary(BaseModel):
    total_assignments: int = 0
    published_assignments: int = 0
    pending_submissions: int = 0
    grading_queue: int = 0


class TrainerAssignmentItem(BaseModel):
    id: str
    title: str
    batch: Optional[str] = None
    course: Optional[str] = None
    course_id: str
    due_date: Optional[str] = None
    submitted: int = 0
    pending: int = 0
    status: str = "draft"
    can_view_details: bool = True
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class TrainerAssignmentDetail(TrainerAssignmentItem):
    summary: Optional[str] = None
    content: Optional[str] = None
    max_marks: int = 0
    assignment_url: Optional[str] = None
    github_repository_url: Optional[str] = None


class TrainerAssignmentsResponse(BaseModel):
    summary: TrainerAssignmentSummary
    assignments: list[TrainerAssignmentItem]
    feature_status: list[TrainerAssignmentFeatureStatusItem]
    updated_at: str
    can_create_assignments: bool = True
    create_assignment_api_connected: bool = True
    github_repository_linking: bool = False


class TrainerAssignmentCreate(BaseModel):
    course_id: str
    title: str
    batch_name: str
    summary: Optional[str] = None
    content: Optional[str] = None
    due_at: datetime
    max_marks: int
    assignment_url: Optional[str] = None
    status: str = "draft"


class TrainerAssignmentUpdate(BaseModel):
    title: Optional[str] = None
    batch_name: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    due_at: Optional[datetime] = None
    max_marks: Optional[int] = None
    assignment_url: Optional[str] = None
    status: Optional[str] = None


class TrainerAssignmentSubmissionItem(BaseModel):
    id: str
    assignment_id: str
    student_id: Optional[str] = None
    student: Optional[str] = None
    submitted_at: Optional[str] = None
    status: str
    marks: Optional[int] = None
    feedback_status: str = "Pending"


# ─── Attendance Schemas ───────────────────────────────────────────────────────
# All schemas below are additive — no existing schema above is modified.
# ─────────────────────────────────────────────────────────────────────────────


class TrainerAttendanceSessionCreate(BaseModel):
    """POST body for creating an attendance session."""

    title: str
    session_date: date
    course_id: Optional[str] = None
    batch_id: Optional[str] = None


class TrainerAttendanceSessionItem(BaseModel):
    """Single row returned in the session list and history endpoints."""

    id: str
    title: str
    session_date: date
    status: str = "pending"          # "pending" | "submitted"
    course_id: Optional[str] = None
    course_name: Optional[str] = None
    batch_id: Optional[str] = None
    batch_name: Optional[str] = None
    total_students: int
    present_count: int
    absent_count: int
    late_count: int
    attendance_rate: Optional[float] = None  # None when total_students == 0
    created_at: datetime

    class Config:
        from_attributes = True


class TrainerAttendanceSessionsSummary(BaseModel):
    """KPI summary returned with the session list (matches TrainerAttendanceSummary in types.ts)."""

    total_sessions: int
    today_attendance_rate: Optional[float] = None
    pending_sessions: int


class TrainerAttendanceSessionsResponse(BaseModel):
    """Paginated response for GET /api/v1/trainer/attendance/sessions."""

    summary: TrainerAttendanceSessionsSummary
    sessions: list[TrainerAttendanceSessionItem]
    total: int
    page: int
    limit: int


class TrainerAttendanceStudentRecord(BaseModel):
    """One student row inside a session detail response."""

    student_id: str
    full_name: str
    display_code: Optional[str] = None
    status: Literal["present", "absent", "late", "unmarked"]
    minutes_late: int
    remarks: Optional[str] = None
    marked_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TrainerAttendanceSessionDetail(BaseModel):
    """Full session envelope — metadata + student record list."""

    session: TrainerAttendanceSessionItem
    students: list[TrainerAttendanceStudentRecord]


class TrainerAttendanceMarkRecord(BaseModel):
    """One student record inside a bulk-mark request body."""

    student_id: str
    status: Literal["present", "absent", "late"]
    minutes_late: int = 0
    remarks: Optional[str] = None


class TrainerAttendanceMarkBody(BaseModel):
    """POST body for bulk-marking attendance on a session."""

    records: list[TrainerAttendanceMarkRecord]


class TrainerAttendanceHistorySummary(BaseModel):
    """Aggregate stats returned alongside the history session list."""

    total_sessions: int
    total_records: int
    overall_attendance_rate: Optional[float] = None  # None when no records exist


class TrainerAttendanceHistoryResponse(BaseModel):
    """Paginated response for GET /api/v1/trainer/attendance/history."""

    summary: TrainerAttendanceHistorySummary
    sessions: list[TrainerAttendanceSessionItem]
    total: int
    page: int
    limit: int


# ─── LMS Material Schemas ─────────────────────────────────────────────────────
# All schemas below are additive — no existing schema above is modified.
# ─────────────────────────────────────────────────────────────────────────────


class TrainerLessonMaterialResponse(BaseModel):
    """Single material row returned after upload or in list responses.
    Mirrors the trainer_lesson_materials table columns exactly."""

    id: str
    course_id: str
    lesson_id: Optional[str] = None
    trainer_id: str
    filename: str
    file_url: str
    file_size: Optional[int] = None
    content_type: str = "pdf"
    download_count: int = 0
    created_at: Optional[str] = None


class TrainerLessonMaterialListResponse(BaseModel):
    """Envelope returned by GET /lms/materials and GET /lms/courses/{course_id}/materials."""

    materials: list[TrainerLessonMaterialResponse]
    total: int
    updated_at: str
