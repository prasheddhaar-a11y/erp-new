"""
PINESPHERE ERP
Module      : API V1 – Trainer
File        : trainer.py
Purpose     : Defines all /api/v1/trainer/* endpoints for the Trainer portal.
              Routes are thin: they validate auth, delegate to service functions,
              and translate service exceptions into HTTP responses.
              Does NOT break the legacy endpoint GET /api/trainer/dashboard
              which lives in role_dashboards.py.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Response, UploadFile
from fastapi.responses import FileResponse
from fastapi import status
from app.schemas.trainer import (
    TrainerAssignmentCreate,
    TrainerAssignmentDetail,
    TrainerAssignmentsResponse,
    TrainerAssignmentSubmissionItem,
    TrainerAssignmentUpdate,
    TrainerAttendanceHistoryResponse,
    TrainerAttendanceMarkBody,
    TrainerAttendanceSessionCreate,
    TrainerAttendanceSessionDetail,
    TrainerAttendanceSessionItem,
    TrainerAttendanceSessionsResponse,
    TrainerBatchDetailsResponse,
    TrainerBatchResponse,
    TrainerLmsCourseCreate,
    TrainerLmsCourseDetail,
    TrainerLmsCourseUpdate,
    TrainerLmsCoursesResponse,
    TrainerLmsLessonItem,
    TrainerLmsLessonUpdate,
    TrainerLmsLessonsResponse,
    TrainerLessonMaterialListResponse,
    TrainerLessonMaterialResponse,
    TrainerStudentDetailsResponse,
    TrainerStudentsResponse,
)
from app.schemas.lms import LessonCreate
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.lms import Course, Lesson, Quiz
from app.models.trainer import TrainerTask
from app.models.trainer import TrainerLessonMaterial
from app.models.user import User

# =====================================================
# SECTION: ROUTER
# =====================================================

router = APIRouter(prefix="/api/v1/trainer", tags=["Trainer V1"])


@router.get("/lms/courses", response_model=TrainerLmsCoursesResponse)
def trainer_lms_courses(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import get_trainer_courses

    return get_trainer_courses(db, current_user.id)


@router.post("/lms/courses", response_model=TrainerLmsCourseDetail, status_code=201)
def trainer_lms_create_course(
    body: TrainerLmsCourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import create_trainer_course

    return create_trainer_course(db, current_user.id, body)


@router.get("/lms/courses/{course_id}", response_model=TrainerLmsCourseDetail)
def trainer_lms_course_detail(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import get_trainer_course_detail

    return get_trainer_course_detail(db, current_user.id, course_id)


@router.get("/lms/courses/{course_id}/lessons", response_model=TrainerLmsLessonsResponse)
def trainer_lms_course_lessons(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import get_trainer_lessons

    return get_trainer_lessons(db, current_user.id, course_id)


@router.post("/lms/courses/{course_id}/lessons", response_model=TrainerLmsLessonItem)
def trainer_lms_create_lesson(
    course_id: str,
    body: LessonCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import create_trainer_lesson

    return create_trainer_lesson(db, current_user.id, course_id, body)


@router.patch("/lms/courses/{course_id}", response_model=TrainerLmsCourseDetail)
def patch_trainer_course(
    course_id: str,
    body: TrainerLmsCourseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import update_trainer_course_status

    return update_trainer_course_status(db, current_user.id, course_id, body)


@router.patch(
    "/lms/courses/{course_id}/lessons/{lesson_id}",
    response_model=TrainerLmsLessonItem,
)
def patch_trainer_lesson(
    course_id: str,
    lesson_id: str,
    body: TrainerLmsLessonUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import update_trainer_lesson

    return update_trainer_lesson(db, current_user.id, course_id, lesson_id, body)


@router.delete(
    "/lms/courses/{course_id}/lessons/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_trainer_lesson(
    course_id: str,
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import delete_trainer_lesson

    delete_trainer_lesson(db, current_user.id, course_id, lesson_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/lms/materials", response_model=TrainerLessonMaterialResponse, status_code=201)
async def trainer_lms_upload_material(
    course_id: str = Form(...),
    lesson_id: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    """
    POST /api/v1/trainer/lms/materials

    Accepts multipart/form-data with:
      - course_id  (required)  — UUID of the trainer-owned course
      - lesson_id  (optional)  — UUID of a lesson within that course
      - file       (required)  — PDF, MP4, WebM, or MOV (max 50 MB)

    Validates course ownership, optional lesson ownership, MIME type, and
    file size before writing to disk and inserting a metadata row.
    Returns the created TrainerLessonMaterialResponse on success.
    """
    from app.services.trainers.lms import upload_trainer_material

    return await upload_trainer_material(
        db=db,
        trainer_id=current_user.id,
        course_id=course_id,
        file=file,
        lesson_id=lesson_id,
    )


@router.get("/lms/materials", response_model=TrainerLessonMaterialListResponse)
def trainer_lms_materials(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/lms/materials

    Returns all materials uploaded by the authenticated trainer across all
    their courses. Reads from trainer_lesson_materials — not derived from
    lesson URL fields.
    """
    from app.services.trainers.lms import get_trainer_materials

    return get_trainer_materials(db, current_user.id)


@router.get(
    "/lms/courses/{course_id}/materials",
    response_model=TrainerLessonMaterialListResponse,
)
def trainer_lms_course_materials(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/lms/courses/{course_id}/materials

    Returns all materials for a single trainer-owned course.
    Validates that Course.trainer_id == current_user.id before querying —
    cross-trainer access returns 404.
    """
    from app.services.trainers.lms import get_course_materials

    return get_course_materials(db, current_user.id, course_id)


@router.get("/lms/materials/{material_id}/download")
def download_trainer_lms_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.lms import material_storage_path

    material = (
        db.query(TrainerLessonMaterial)
        .filter(
            TrainerLessonMaterial.id == material_id,
            TrainerLessonMaterial.trainer_id == current_user.id,
        )
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    material.download_count = (material.download_count or 0) + 1
    db.commit()
    return FileResponse(
        material_storage_path(material),
        filename=material.filename,
        media_type="application/octet-stream",
    )


@router.get("/assignments", response_model=TrainerAssignmentsResponse)
def trainer_assignments(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.assignments import get_trainer_assignments

    return get_trainer_assignments(db, current_user.id)


@router.get("/assignments/{assignment_id}", response_model=TrainerAssignmentDetail)
def trainer_assignment_detail(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.assignments import get_trainer_assignment_detail

    return get_trainer_assignment_detail(db, current_user.id, assignment_id)


@router.post("/assignments", response_model=TrainerAssignmentDetail)
def trainer_create_assignment(
    body: TrainerAssignmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.assignments import create_trainer_assignment

    return create_trainer_assignment(db, current_user.id, body)


@router.patch("/assignments/{assignment_id}", response_model=TrainerAssignmentDetail)
def trainer_update_assignment(
    assignment_id: str,
    body: TrainerAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.assignments import update_trainer_assignment

    return update_trainer_assignment(db, current_user.id, assignment_id, body)


@router.get(
    "/assignments/{assignment_id}/submissions",
    response_model=list[TrainerAssignmentSubmissionItem],
)
def trainer_assignment_submissions(
    assignment_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER)),
):
    from app.services.trainers.assignments import get_trainer_assignment_submissions

    return get_trainer_assignment_submissions(db, current_user.id, assignment_id)


# =====================================================
# SECTION: HELPER FUNCTIONS
# =====================================================

def _trainer_course_ids(db: Session, trainer_id: str) -> list[str]:
    """Return a list of course IDs assigned to this trainer."""
    rows = (
        db.query(Course.id)
        .filter(Course.trainer_id == trainer_id)
        .all()
    )
    return [row.id for row in rows]


def _today_classes(db: Session, trainer_id: str, today: date) -> list[dict]:
    """Return today's attendance sessions created by this trainer."""
    sessions = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.session_date == today,
        )
        .order_by(AttendanceSession.created_at.asc())
        .limit(10)
        .all()
    )
    result = []
    for session in sessions:
        record_count = (
            db.query(func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.session_id == session.id)
            .scalar()
            or 0
        )
        present_count = (
            db.query(func.count(AttendanceRecord.id))
            .filter(
                AttendanceRecord.session_id == session.id,
                AttendanceRecord.status.in_(["present", "late", "Present", "Late"]),
            )
            .scalar()
            or 0
        )
        result.append(
            {
                "id": session.id,
                "title": session.title,
                "session_date": session.session_date.isoformat(),
                "course_id": session.course_id,
                "total_records": record_count,
                "present_count": present_count,
                "attendance_rate": (
                    round((present_count / record_count) * 100, 1)
                    if record_count
                    else None
                ),
            }
        )
    return result


def _assigned_batches(db: Session, trainer_id: str, branch_id: str | None) -> list[dict]:
    """Return trainer-scoped batches from the real batches table."""
    from app.services.trainers.batches import resolve_trainer_batches

    response = resolve_trainer_batches(db, trainer_id, branch_id)
    return [
        {
            "id": batch.id,
            "title": batch.name,
            "course": batch.course,
            "course_id": batch.course_id,
            "status": batch.status,
            "difficulty": None,
            "student_count": batch.students,
            "attendance_rate": batch.attendance_rate,
            "display_code": batch.id,
        }
        for batch in response.batches[:10]
    ]


def _attendance_summary(db: Session, trainer_id: str, today: date) -> dict:
    """Return 6-day attendance series and today's rate for this trainer's sessions."""
    series = []
    today_rate = None

    for offset in range(5, -1, -1):
        day = today - timedelta(days=offset)
        session_ids = [
            row.id
            for row in db.query(AttendanceSession.id)
            .filter(
                AttendanceSession.trainer_id == trainer_id,
                AttendanceSession.session_date == day,
            )
            .all()
        ]
        if session_ids:
            day_total = (
                db.query(func.count(AttendanceRecord.id))
                .filter(AttendanceRecord.session_id.in_(session_ids))
                .scalar()
                or 0
            )
            day_present = (
                db.query(func.count(AttendanceRecord.id))
                .filter(
                    AttendanceRecord.session_id.in_(session_ids),
                    AttendanceRecord.status.in_(
                        ["present", "late", "Present", "Late"]
                    ),
                )
                .scalar()
                or 0
            )
            rate = round((day_present / day_total) * 100, 1) if day_total else 0
        else:
            rate = 0

        series.append({"label": day.strftime("%d %b"), "rate": rate})
        if offset == 0:
            today_rate = rate if session_ids else None

    # Count sessions submitted (have at least one record) vs pending
    all_session_ids = [
        row.id
        for row in db.query(AttendanceSession.id)
        .filter(AttendanceSession.trainer_id == trainer_id)
        .all()
    ]
    submitted_sessions = 0
    for sid in all_session_ids:
        has_records = (
            db.query(func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.session_id == sid)
            .scalar()
            or 0
        )
        if has_records:
            submitted_sessions += 1

    total_sessions = len(all_session_ids)
    pending_sessions = total_sessions - submitted_sessions

    total_marked = (
        db.query(func.count(AttendanceRecord.id))
        .join(
            AttendanceSession,
            AttendanceRecord.session_id == AttendanceSession.id,
        )
        .filter(AttendanceSession.trainer_id == trainer_id)
        .scalar()
        or 0
    )

    return {
        "today_rate": today_rate,
        "weekly_series": series,
        "pending_sessions": max(0, pending_sessions),
        "submitted_sessions": submitted_sessions,
        "total_marked": total_marked,
    }


def _recent_assignments(db: Session, course_ids: list[str]) -> list[dict]:
    """Return recent assignment-type lessons from trainer's courses."""
    if not course_ids:
        return []
    lessons = (
        db.query(Lesson)
        .filter(
            Lesson.course_id.in_(course_ids),
            Lesson.content_type == "assignment",
        )
        .order_by(Lesson.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": lesson.id,
            "title": lesson.title,
            "course_id": lesson.course_id,
            "due_at": lesson.due_at.isoformat() if lesson.due_at else None,
            "max_marks": lesson.max_marks,
        }
        for lesson in lessons
    ]


def _recent_test_results(db: Session, course_ids: list[str]) -> list[dict]:
    """Return recent quizzes from trainer's courses."""
    if not course_ids:
        return []
    quizzes = (
        db.query(Quiz)
        .filter(Quiz.course_id.in_(course_ids))
        .order_by(Quiz.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": quiz.id,
            "title": quiz.title,
            "course_id": quiz.course_id,
            "status": quiz.status,
            "total_marks": quiz.total_marks,
            "passing_score": quiz.passing_score,
        }
        for quiz in quizzes
    ]


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# =====================================================

@router.get("/dashboard")
def trainer_dashboard_v1(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/dashboard

    Returns a structured dashboard payload scoped to the authenticated trainer.
    All queries are filtered by the trainer's own user ID so no cross-trainer
    data leaks.
    """
    trainer_id: str = current_user.id
    today = date.today()

    course_ids = _trainer_course_ids(db, trainer_id)

    # --- Metrics ----------------------------------------------------------

    # total_batches: from batch_trainer_assignments (real batch count, not course count)
    from app.services.trainers.batches import resolve_trainer_batches

    batch_response = resolve_trainer_batches(db, trainer_id, current_user.branch_id)

    # total_students: unique students across all batches assigned to this trainer
    # Sourced from batch_student_enrollments for consistency with /trainer/students
    assigned_batch_ids = [
        row[0]
        for row in (
            db.query(BatchTrainerAssignment.batch_id)
            .filter(BatchTrainerAssignment.trainer_id == trainer_id)
            .all()
        )
    ]
    total_students = (
        db.query(func.count(BatchStudentEnrollment.student_id.distinct()))
        .filter(
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
        )
        .scalar()
        or 0
    ) if assigned_batch_ids else 0

    today_session_count = (
        db.query(func.count(AttendanceSession.id))
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.session_date == today,
        )
        .scalar()
        or 0
    )

    today_sessions = (
        db.query(AttendanceSession.id)
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.session_date == today,
        )
        .all()
    )
    today_session_ids = [row.id for row in today_sessions]

    attendance_today: float | None = None
    if today_session_ids:
        today_total = (
            db.query(func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.session_id.in_(today_session_ids))
            .scalar()
            or 0
        )
        today_present = (
            db.query(func.count(AttendanceRecord.id))
            .filter(
                AttendanceRecord.session_id.in_(today_session_ids),
                AttendanceRecord.status.in_(
                    ["present", "late", "Present", "Late"]
                ),
            )
            .scalar()
            or 0
        )
        attendance_today = (
            round((today_present / today_total) * 100, 1) if today_total else None
        )

    # pending_tasks: from trainer_tasks table (real count, not hardcoded 0)
    pending_tasks_query = (
        db.query(TrainerTask)
        .filter(
            TrainerTask.trainer_id == trainer_id,
            TrainerTask.status == "pending",
        )
        .order_by(TrainerTask.due_date.asc())
        .all()
    )
    pending_tasks_count = len(pending_tasks_query)

    pending_tasks_list = [
        {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "due_date": task.due_date.isoformat() if task.due_date else None,
            "status": task.status,
        }
        for task in pending_tasks_query
    ]

    metrics = {
        "total_batches": batch_response.summary.assigned_batches,
        "total_students": total_students,
        "classes_today": today_session_count,  # 0 is a valid value (no sessions today)
        "attendance_today": attendance_today,
        "pending_tasks": pending_tasks_count,
    }

    return {
        "metrics": metrics,
        "today_classes": _today_classes(db, trainer_id, today),
        "assigned_batches": _assigned_batches(db, trainer_id, current_user.branch_id),
        "attendance_summary": _attendance_summary(db, trainer_id, today),
        "recent_assignments": _recent_assignments(db, course_ids),
        "recent_test_results": _recent_test_results(db, course_ids),
        "pending_tasks": pending_tasks_list,
        "updated_at": datetime.utcnow().isoformat(),
    }


@router.get("/debug/data-map")
def trainer_debug_data_map(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """Return a comprehensive mapping of trainer-related entities.

    Includes owned courses, assigned batches, enrolled students, and recent
    assignments. Intended for troubleshooting UI data-fetch issues.
    """
    trainer_id = current_user.id
    course_ids = _trainer_course_ids(db, trainer_id)
    courses = db.query(Course).filter(Course.id.in_(course_ids)).all()

    # Batches from real relational tables
    assignments = (
        db.query(BatchTrainerAssignment)
        .filter(BatchTrainerAssignment.trainer_id == trainer_id)
        .all()
    )
    assigned_batch_ids = [a.batch_id for a in assignments]
    batches = (
        db.query(Batch)
        .filter(Batch.id.in_(assigned_batch_ids))
        .all()
    ) if assigned_batch_ids else []

    # Students from real relational tables
    student_enrollments = (
        db.query(BatchStudentEnrollment)
        .filter(
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
        )
        .all()
    ) if assigned_batch_ids else []

    recent_assignments = (
        db.query(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .filter(Course.trainer_id == trainer_id, Lesson.content_type == "assignment")
        .order_by(Lesson.created_at.desc())
        .limit(5)
        .all()
    )
    return {
        "trainer_id": trainer_id,
        "courses": [{"id": c.id, "title": c.title} for c in courses],
        "assigned_batches": [
            {
                "batch_id": b.id,
                "batch_name": b.name,
                "course_id": b.course_id,
                "status": b.status,
            }
            for b in batches
        ],
        "student_enrollments": [
            {
                "student_id": e.student_id,
                "batch_id": e.batch_id,
                "status": e.status,
            }
            for e in student_enrollments
        ],
        "recent_assignments": [
            {
                "id": a.id,
                "title": a.title,
                "due_at": a.due_at.isoformat() if a.due_at else None,
                "max_marks": getattr(a, "max_marks", 0),
            }
            for a in recent_assignments
        ],
    }


@router.get("/batches", response_model=TrainerBatchResponse)
def trainer_batches_v1(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/batches

    Read-only. Returns trainer-scoped batches from the real batches table,
    filtered to batches assigned to the authenticated trainer via
    batch_trainer_assignments.

    Authentication: active user, role == trainer.
    Rejects all other roles (401/403 handled by require_roles dependency).

    Response shape:
      { summary: {...}, batches: [...], updated_at: "ISO_DATETIME" }
    """
    from app.services.trainers.batches import resolve_trainer_batches

    result = resolve_trainer_batches(
        db=db,
        trainer_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    return result


@router.get("/students", response_model=TrainerStudentsResponse)
def trainer_students_v1(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/students

    Returns all students enrolled in batches assigned to this trainer via
    batch_student_enrollments. Computes per-student attendance rate from
    sessions conducted by this trainer only.
    Never returns 404 – returns [] when no students are found.
    """
    from app.services.trainers.students import resolve_trainer_students

    try:
        return resolve_trainer_students(db=db, current_user=current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to load trainer assigned students",
                "error": exc.__class__.__name__,
            },
        ) from exc


@router.get("/students/{student_id}", response_model=TrainerStudentDetailsResponse)
def trainer_student_details_v1(
    student_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/students/{student_id}

    Read-only student profile for the authenticated trainer. A student is
    visible only when they are enrolled in a batch assigned to this trainer
    via batch_student_enrollments. Branch-wide student records are never used.
    """
    from app.services.trainers.students import resolve_trainer_student_details

    try:
        return resolve_trainer_student_details(
            db=db,
            current_user=current_user,
            student_id=student_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/batches/{batch_id}", response_model=TrainerBatchDetailsResponse)
def get_trainer_batch_details_endpoint(
    batch_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
):
    """
    GET /api/v1/trainer/batches/{batch_id}

    Returns details of a trainer-scoped batch if the trainer has ownership/access
    via batch_trainer_assignments. Otherwise raises 403 Forbidden or 404 Not Found.
    """
    from app.services.trainers.batches import resolve_trainer_batch_details

    try:
        details = resolve_trainer_batch_details(
            db=db,
            trainer_id=current_user.id,
            branch_id=current_user.branch_id,
            batch_id=batch_id,
        )
        return details
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# =====================================================
# SECTION: ATTENDANCE ROUTES
# =====================================================

@router.get("/attendance/sessions", response_model=TrainerAttendanceSessionsResponse)
def list_trainer_attendance_sessions(
    batch_id: str | None = Query(None, description="Filter by batch ID"),
    date_from: date | None = Query(None, description="Start of date range (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="End of date range (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> TrainerAttendanceSessionsResponse:
    """
    GET /api/v1/trainer/attendance/sessions

    Returns a paginated list of attendance sessions owned by the authenticated
    trainer.  All queries are filtered by trainer_id at the database level —
    cross-trainer data is structurally excluded.

    Filters: batch_id, date_from, date_to, page, limit.
    Response: { sessions: [...], total: int, page: int, limit: int }
    """
    from app.services.trainers.attendance import get_trainer_attendance_sessions

    return get_trainer_attendance_sessions(
        db=db,
        trainer_id=current_user.id,
        batch_id=batch_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )


@router.post("/attendance/sessions", response_model=TrainerAttendanceSessionItem, status_code=201)
def create_attendance_session(
    body: TrainerAttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> TrainerAttendanceSessionItem:
    """
    POST /api/v1/trainer/attendance/sessions

    Creates a new attendance session scoped to the authenticated trainer.

    If batch_id is provided:
    - Asserts the trainer is assigned to that batch via batch_trainer_assignments.
    - Auto-creates one absent AttendanceRecord per active enrolled student.
    - Returns 403 if the trainer is not assigned to the batch.
    - Returns 404 if the batch does not exist.

    Returns the created session as a TrainerAttendanceSessionItem.
    """
    from app.services.trainers.attendance import create_trainer_attendance_session

    try:
        return create_trainer_attendance_session(
            db=db,
            trainer_id=current_user.id,
            body=body,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/attendance/history", response_model=TrainerAttendanceHistoryResponse)
def get_attendance_history(
    batch_id: str | None = Query(None, description="Filter by batch ID"),
    course_id: str | None = Query(None, description="Filter by course ID"),
    date_from: date | None = Query(None, description="Start of date range (YYYY-MM-DD)"),
    date_to: date | None = Query(None, description="End of date range (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> TrainerAttendanceHistoryResponse:
    """
    GET /api/v1/trainer/attendance/history

    Returns paginated attendance history for the authenticated trainer alongside
    aggregate summary stats covering all matched sessions (not just the current page):

    - summary.total_sessions          — count of sessions matching filters
    - summary.total_records           — total student records across those sessions
    - summary.overall_attendance_rate — (present + late) / total * 100, or null

    Filters: batch_id, course_id, date_from, date_to, page, limit.

    NOTE: this route is declared before /{session_id} to prevent FastAPI from
    interpreting the literal path segment "history" as a session_id parameter.
    """
    from app.services.trainers.attendance import get_trainer_attendance_history

    return get_trainer_attendance_history(
        db=db,
        trainer_id=current_user.id,
        batch_id=batch_id,
        course_id=course_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        limit=limit,
    )


@router.get("/attendance/sessions/{session_id}", response_model=TrainerAttendanceSessionItem)
def get_attendance_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> TrainerAttendanceSessionItem:
    """
    GET /api/v1/trainer/attendance/sessions/{session_id}

    Returns metadata for a single attendance session.

    Returns 404 if the session does not exist.
    Returns 403 if the session belongs to a different trainer.
    """
    from app.services.trainers.attendance import get_trainer_session_detail

    try:
        return get_trainer_session_detail(
            db=db,
            trainer_id=current_user.id,
            session_id=session_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get(
    "/attendance/sessions/{session_id}/students",
    response_model=TrainerAttendanceSessionDetail,
)
def get_session_students(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> TrainerAttendanceSessionDetail:
    """
    GET /api/v1/trainer/attendance/sessions/{session_id}/students

    Returns session metadata alongside the full student record list.
    Each student row includes their current attendance status for this session:
    present, absent, late, or unmarked (no record exists yet).

    Returns 404 if the session does not exist.
    Returns 403 if the session belongs to a different trainer.
    """
    from app.services.trainers.attendance import get_trainer_session_students

    try:
        return get_trainer_session_students(
            db=db,
            trainer_id=current_user.id,
            session_id=session_id,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/attendance/sessions/{session_id}/mark")
def mark_attendance(
    session_id: str,
    body: TrainerAttendanceMarkBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.TRAINER)),
) -> dict:
    """
    POST /api/v1/trainer/attendance/sessions/{session_id}/mark

    Upserts attendance records for each student entry in the request body.
    Existing records for (session_id, student_id) are updated in-place;
    missing records are inserted.  Ownership is verified before any write —
    no record is touched until session.trainer_id == current_user.id is confirmed.

    Returns { "saved": N } where N is the count of records processed.

    Returns 404 if the session does not exist.
    Returns 403 if the session belongs to a different trainer.
    """
    from app.services.trainers.attendance import mark_trainer_attendance

    try:
        return mark_trainer_attendance(
            db=db,
            trainer_id=current_user.id,
            session_id=session_id,
            body=body,
        )
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
