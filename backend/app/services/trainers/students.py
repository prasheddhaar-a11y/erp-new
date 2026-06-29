"""
PINESPHERE ERP
Module      : Services - Trainers
File        : students.py
Purpose     : Resolve read-only trainer-scoped assigned students.

Safety rules:
  - Trainer sees only students enrolled in batches that are assigned to
    the trainer via batch_trainer_assignments.
  - Branch-wide student lists are never used as a roster source.
  - Students are deduplicated by user.id when they appear in multiple
    trainer-assigned batches.
  - Progress, attendance, risk, projects, and AI fields are returned only
    when safely supported by existing trainer-scoped data.
"""

from __future__ import annotations

from collections import OrderedDict
from datetime import datetime
from typing import Optional
from urllib.parse import unquote

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.lms import Course, Enrollment, Lesson, LessonProgress, Quiz, QuizAttempt
from app.models.user import User
from app.schemas.trainer import (
    TrainerFeatureStatusItem,
    TrainerStudentAIInsights,
    TrainerStudentAttendanceSummary,
    TrainerStudentBatchRef,
    TrainerStudentCourseRef,
    TrainerStudentDetailsResponse,
    TrainerStudentItem,
    TrainerStudentLmsProgress,
    TrainerStudentProjects,
    TrainerStudentRiskAlerts,
    TrainerStudentSkillProgress,
    TrainerStudentsResponse,
    TrainerStudentSummary,
)

PRESENT_STATUSES = ("present", "late", "Present", "Late")


# ─── Preserved helpers (unchanged) ───────────────────────────────────────────

def _decode_identifier(value: str) -> str:
    decoded = value
    for _ in range(2):
        next_decoded = unquote(decoded)
        if next_decoded == decoded:
            break
        decoded = next_decoded
    return decoded


def _feature_status() -> list[TrainerFeatureStatusItem]:
    return [
        TrainerFeatureStatusItem(
            s_no=29,
            feature="Skill Progress Meter",
            phase="Phase 4",
            status="Available after LMS progress setup",
        ),
        TrainerFeatureStatusItem(
            s_no=30,
            feature="Projects Completed Tracker",
            phase="Phase 4",
            status="Available after LMS progress setup",
        ),
        TrainerFeatureStatusItem(
            s_no=33,
            feature="AI Learning Analytics Insights",
            phase="Phase 4",
            status="AI insights pending",
        ),
        TrainerFeatureStatusItem(
            s_no=126,
            feature="Student Performance Alert Engine",
            phase="Phase 4",
            status="Risk engine pending",
        ),
    ]


def _profile_feature_status() -> list[TrainerFeatureStatusItem]:
    return [
        TrainerFeatureStatusItem(
            s_no=29,
            feature="Skill Progress Meter",
            phase="Phase 4D",
            status="Available after LMS progress setup",
        ),
        TrainerFeatureStatusItem(
            s_no=30,
            feature="Projects Completed Tracker",
            phase="Phase 4D",
            status="Available after LMS progress setup",
        ),
        TrainerFeatureStatusItem(
            s_no=33,
            feature="AI Learning Analytics Insights",
            phase="Phase 4D",
            status="AI insights pending",
        ),
        TrainerFeatureStatusItem(
            s_no=126,
            feature="Student Performance Alert Engine",
            phase="Phase 4D",
            status="Risk engine pending",
        ),
    ]


def _empty_response() -> TrainerStudentsResponse:
    return TrainerStudentsResponse(
        summary=TrainerStudentSummary(),
        students=[],
        feature_status=_feature_status(),
        updated_at=datetime.utcnow().isoformat(),
    )


def _validate_active_trainer(current_user: User) -> None:
    if not current_user or not current_user.is_active:
        raise PermissionError("Inactive or missing trainer")
    if current_user.role != UserRole.TRAINER:
        raise PermissionError("Only trainers can view assigned students")


def _trainer_courses(db: Session, trainer_id: str) -> tuple[list[str], dict[str, str]]:
    courses = db.query(Course).filter(Course.trainer_id == trainer_id).all()
    course_map = {course.id: course.title for course in courses}
    return list(course_map.keys()), course_map


def _attendance_rate(
    db: Session,
    trainer_id: str,
    student_id: str,
    course_ids: list[str],
) -> Optional[float]:
    if not course_ids:
        return None

    base = (
        db.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceRecord.student_id == student_id,
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id.in_(course_ids),
        )
    )
    total = base.scalar() or 0
    if total == 0:
        return None

    present = base.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).scalar() or 0
    return round((present / total) * 100, 1)


def _lesson_counts(
    db: Session,
    student_id: str,
    course_ids: list[str],
) -> tuple[Optional[float], int, int]:
    if not course_ids:
        return None, 0, 0

    lesson_ids = [
        row[0]
        for row in db.query(Lesson.id).filter(Lesson.course_id.in_(course_ids)).all()
    ]
    total_lessons = len(lesson_ids)
    if total_lessons == 0:
        return None, 0, 0

    completed_lessons = (
        db.query(func.count(LessonProgress.id))
        .filter(
            LessonProgress.student_id == student_id,
            LessonProgress.lesson_id.in_(lesson_ids),
            LessonProgress.is_completed == True,  # noqa: E712
        )
        .scalar()
        or 0
    )
    progress = round((completed_lessons / total_lessons) * 100, 1)
    return progress, int(completed_lessons), total_lessons


def _quiz_progress(
    db: Session,
    student_id: str,
    course_ids: list[str],
) -> tuple[Optional[float], int]:
    if not course_ids:
        return None, 0

    quiz_ids = [
        row[0]
        for row in db.query(Quiz.id).filter(Quiz.course_id.in_(course_ids)).all()
    ]
    if not quiz_ids:
        return None, 0

    attempts = (
        db.query(QuizAttempt.score)
        .filter(
            QuizAttempt.student_id == student_id,
            QuizAttempt.quiz_id.in_(quiz_ids),
        )
        .all()
    )
    if not attempts:
        return None, 0

    scores = [float(row[0] or 0) for row in attempts]
    return round(sum(scores) / len(scores), 1), len(scores)


def _attendance_summary_for_student(
    db: Session,
    trainer_id: str,
    student_id: str,
    course_ids: list[str],
) -> TrainerStudentAttendanceSummary:
    if not course_ids:
        return TrainerStudentAttendanceSummary()

    rows = (
        db.query(AttendanceRecord.status, func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceRecord.student_id == student_id,
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id.in_(course_ids),
        )
        .group_by(AttendanceRecord.status)
        .all()
    )

    counts: dict[str, int] = {}
    for status, count in rows:
        key = str(status or "").lower()
        counts[key] = counts.get(key, 0) + int(count or 0)
    present = counts.get("present", 0)
    late = counts.get("late", 0)
    absent = counts.get("absent", 0)
    total = sum(counts.values())
    attendance_rate = round(((present + late) / total) * 100, 1) if total else None

    return TrainerStudentAttendanceSummary(
        attendance_rate=attendance_rate,
        present=present,
        absent=absent,
        late=late,
    )


def _student_item(
    db: Session,
    trainer_id: str,
    user: User,
    course_ids: list[str],
    course_map: dict[str, str],
    batch_name: Optional[str],
    source: str,
    batch_id: Optional[str] = None,
) -> TrainerStudentItem:
    first_course_id = course_ids[0] if course_ids else None
    progress, completed_lessons, total_lessons = _lesson_counts(
        db=db,
        student_id=user.id,
        course_ids=course_ids,
    )
    test_average, test_attempts = _quiz_progress(
        db=db,
        student_id=user.id,
        course_ids=course_ids,
    )
    return TrainerStudentItem(
        id=user.id,
        display_code=user.display_code,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        batch_id=batch_id,
        batch_name=batch_name,
        course=course_map.get(first_course_id) if first_course_id else None,
        skill_progress=progress,
        completed_modules=completed_lessons if total_lessons else None,
        remaining_modules=(total_lessons - completed_lessons) if total_lessons else None,
        test_average=test_average,
        test_attempts=test_attempts,
        projects_completed=None,
        attendance_rate=_attendance_rate(db, trainer_id, user.id, course_ids),
        risk_status="unknown",
        ai_insight=None,
        source=source,
    )


def _student_trainer_course_ids(
    db: Session,
    student_id: str,
    trainer_course_ids: list[str],
) -> list[str]:
    if not trainer_course_ids:
        return []
    return [
        row[0]
        for row in db.query(Enrollment.course_id)
        .filter(
            Enrollment.student_id == student_id,
            Enrollment.course_id.in_(trainer_course_ids),
            func.lower(Enrollment.status) == "active",
        )
        .all()
    ]


# ─── Phase 2 source: batch_trainer_assignments → batch_student_enrollments ───

def _rows_from_batch_assignments(
    db: Session,
    trainer_id: str,
    trainer_course_ids: list[str],
    course_map: dict[str, str],
) -> OrderedDict[str, TrainerStudentItem]:
    """
    Resolve students visible to a trainer by walking the real relational tables:

      batch_trainer_assignments  →  batches  →  batch_student_enrollments  →  users

    A student who appears in multiple trainer-assigned batches is deduplicated
    by user.id.  The first batch encountered (ordered by batch name) wins for
    the batch_id / batch_name fields on the student item — this is consistent
    and deterministic.

    course_ids for LMS / attendance computations are resolved from the batch's
    course_id, cross-checked against trainer_course_ids so no out-of-scope
    course data can leak.
    """
    rows: OrderedDict[str, TrainerStudentItem] = OrderedDict()

    # 1. Find all batches assigned to this trainer
    assignments = (
        db.query(BatchTrainerAssignment)
        .filter(BatchTrainerAssignment.trainer_id == trainer_id)
        .order_by(BatchTrainerAssignment.assigned_at)
        .all()
    )
    if not assignments:
        return rows

    assigned_batch_ids = [a.batch_id for a in assignments]

    # 2. Load batch records (need course_id and name per batch)
    batch_rows = (
        db.query(Batch)
        .filter(Batch.id.in_(assigned_batch_ids))
        .order_by(Batch.name)
        .all()
    )
    batch_map: dict[str, Batch] = {b.id: b for b in batch_rows}

    # 3. Load all active student enrollments across all assigned batches in one query
    enrollment_rows = (
        db.query(BatchStudentEnrollment, User)
        .join(User, BatchStudentEnrollment.student_id == User.id)
        .filter(
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .order_by(BatchStudentEnrollment.batch_id, User.full_name)
        .all()
    )

    # 4. Build student items, deduplicating by user.id (first batch wins)
    for enrollment, student in enrollment_rows:
        if student.id in rows:
            # Already added from an earlier batch — skip duplicate
            continue

        batch = batch_map.get(enrollment.batch_id)
        if not batch:
            continue

        # Only expose course data that is within the trainer's own course ownership
        batch_course_id = batch.course_id
        if batch_course_id and batch_course_id in trainer_course_ids:
            course_ids = [batch_course_id]
        else:
            # Batch's course is not owned by this trainer — fall back to
            # checking enrollments for any overlap with trainer courses
            course_ids = _student_trainer_course_ids(db, student.id, trainer_course_ids)

        if not course_ids:
            continue

        rows[student.id] = _student_item(
            db=db,
            trainer_id=trainer_id,
            user=student,
            course_ids=course_ids,
            course_map=course_map,
            batch_name=batch.name,
            batch_id=batch.id,
            source="batch_student_enrollments",
        )

    return rows


# ─── Public entry points ──────────────────────────────────────────────────────

def resolve_trainer_students(
    db: Session,
    current_user: User,
) -> TrainerStudentsResponse:
    _validate_active_trainer(current_user)

    trainer_id = current_user.id
    trainer_course_ids, course_map = _trainer_courses(db, trainer_id)

    students = _rows_from_batch_assignments(
        db=db,
        trainer_id=trainer_id,
        trainer_course_ids=trainer_course_ids,
        course_map=course_map,
    )

    if not students:
        return _empty_response()

    student_items = sorted(students.values(), key=lambda item: item.full_name.lower())
    progress_values = [
        item.skill_progress for item in student_items if item.skill_progress is not None
    ]
    average_progress = (
        round(sum(progress_values) / len(progress_values), 1)
        if progress_values
        else None
    )

    summary = TrainerStudentSummary(
        total_students=len(student_items),
        active_students=len(student_items),
        at_risk_students=0,
        average_progress=average_progress,
        projects_completed=None,
    )

    return TrainerStudentsResponse(
        summary=summary,
        students=student_items,
        feature_status=_feature_status(),
        updated_at=datetime.utcnow().isoformat(),
    )


def resolve_trainer_student_details(
    db: Session,
    current_user: User,
    student_id: str,
) -> TrainerStudentDetailsResponse:
    _validate_active_trainer(current_user)

    trainer_id = current_user.id
    trainer_course_ids, course_map = _trainer_courses(db, trainer_id)

    # 1. Resolve the student by UUID or display_code
    student_key = _decode_identifier(student_id)
    student = (
        db.query(User)
        .filter(
            or_(User.id == student_key, User.display_code == student_key),
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not student:
        raise ValueError("Student not found")

    # 2. Ownership check via batch_trainer_assignments → batch_student_enrollments
    #    Find all batch IDs assigned to this trainer
    assigned_batch_ids = [
        row[0]
        for row in (
            db.query(BatchTrainerAssignment.batch_id)
            .filter(BatchTrainerAssignment.trainer_id == trainer_id)
            .all()
        )
    ]
    if not assigned_batch_ids:
        raise PermissionError("Student is not assigned to this trainer")

    #    Check that the student has an active enrollment in at least one of those batches
    student_enrollment = (
        db.query(BatchStudentEnrollment)
        .filter(
            BatchStudentEnrollment.student_id == student.id,
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
        )
        .order_by(BatchStudentEnrollment.enrolled_at)
        .first()
    )
    if not student_enrollment:
        raise PermissionError("Student is not assigned to this trainer")

    # 3. Resolve batch and course for the primary enrollment
    primary_batch = (
        db.query(Batch)
        .filter(Batch.id == student_enrollment.batch_id)
        .first()
    )
    primary_batch_id: Optional[str] = primary_batch.id if primary_batch else None
    primary_batch_name: Optional[str] = primary_batch.name if primary_batch else None
    primary_course_id: str = primary_batch.course_id if primary_batch else ""

    # 4. Build course_ids scoped to trainer ownership
    if primary_course_id and primary_course_id in trainer_course_ids:
        course_ids = [primary_course_id]
    else:
        course_ids = _student_trainer_course_ids(db, student.id, trainer_course_ids)

    if not course_ids:
        raise PermissionError("Student is not assigned to this trainer")

    course_name = course_map.get(primary_course_id, "Course") if primary_course_id else "Course"

    # 5. Compute LMS and quiz progress
    progress, completed_lessons, total_lessons = _lesson_counts(
        db=db,
        student_id=student.id,
        course_ids=course_ids,
    )
    test_average, test_attempts = _quiz_progress(
        db=db,
        student_id=student.id,
        course_ids=course_ids,
    )
    progress_status = "connected" if progress is not None else "not_connected"

    return TrainerStudentDetailsResponse(
        id=student.id,
        display_code=student.display_code,
        full_name=student.full_name,
        email=student.email,
        phone=student.phone,
        batch=TrainerStudentBatchRef(
            id=primary_batch_id,
            name=primary_batch_name,
        ),
        course=TrainerStudentCourseRef(
            id=primary_course_id,
            name=course_name,
        ),
        skill_progress=TrainerStudentSkillProgress(
            percentage=progress,
            completed_modules=completed_lessons,
            total_modules=total_lessons,
            status=progress_status,
        ),
        projects=TrainerStudentProjects(
            completed=0,
            pending=0,
            recent_projects=[],
        ),
        attendance_summary=_attendance_summary_for_student(
            db=db,
            trainer_id=trainer_id,
            student_id=student.id,
            course_ids=course_ids,
        ),
        lms_progress=TrainerStudentLmsProgress(
            average_progress=progress,
            completed_lessons=completed_lessons,
            total_lessons=total_lessons,
            test_average=test_average,
            test_attempts=test_attempts,
        ),
        ai_insights=TrainerStudentAIInsights(
            summary=None,
            recommendations=[],
            status="awaiting_analytics_api",
        ),
        risk_alerts=TrainerStudentRiskAlerts(
            risk_status="unknown",
            alerts=[],
            status="awaiting_risk_engine",
        ),
        feature_status=_profile_feature_status(),
        updated_at=datetime.utcnow().isoformat(),
    )