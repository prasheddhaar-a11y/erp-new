"""
PINESPHERE ERP
Module      : Services – Trainers
File        : batches.py
Purpose     : Pure service layer that resolves trainer-scoped batches.
              Keeps all business logic out of the router so the router
              stays thin and this layer is independently testable.

              Source (Phase 2 — real relational tables):
                batches  →  batch_trainer_assignments  →  batch_student_enrollments

              Safety rules:
                • Trainer sees ONLY batches linked via batch_trainer_assignments
                  where BatchTrainerAssignment.trainer_id == trainer_id.
                • Branch-wide batch lists are never exposed.
                • attendance_rate is null unless proven by real records.
                • students count comes from batch_student_enrollments (active only).
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from urllib.parse import unquote

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.branch import Branch
from app.models.lms import Course, Lesson, LessonProgress
from app.models.user import User
from app.core.roles import UserRole
from app.schemas.trainer import (
    TrainerBatchAssignment,
    TrainerBatchAttendanceSummary,
    TrainerBatchDetailsResponse,
    TrainerBatchFeatureStatus,
    TrainerBatchItem,
    TrainerBatchLmsProgress,
    TrainerBatchResponse,
    TrainerBatchStudent,
    TrainerBatchSummary,
)


# ─── Internal helpers ─────────────────────────────────────────────────────────

def _slug(name: str) -> str:
    """Normalise batch name to a stable dict key (lowercase, collapsed spaces)."""
    return re.sub(r"\s+", " ", name.strip().lower())


def _decode_identifier(value: str) -> str:
    decoded = value
    for _ in range(2):
        next_decoded = unquote(decoded)
        if next_decoded == decoded:
            break
        decoded = next_decoded
    return decoded


def _compute_attendance_rate(
    db: Session,
    trainer_id: str,
    course_id: str,
    student_ids: list[str],
) -> Optional[float]:
    """
    Compute attendance rate for a set of students in a specific course
    using only the trainer's own session records.  Returns None when no
    sessions have been marked yet.
    """
    if not student_ids or not course_id:
        return None

    total = (
        db.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceRecord.student_id.in_(student_ids),
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id == course_id,
        )
        .scalar()
        or 0
    )
    if total == 0:
        return None

    present = (
        db.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceRecord.student_id.in_(student_ids),
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id == course_id,
            AttendanceRecord.status.in_(["present", "late", "Present", "Late"]),
        )
        .scalar()
        or 0
    )
    return round((present / total) * 100, 1)


def _batch_student_ids(
    db: Session,
    batch_id: str,
) -> list[str]:
    """
    Return IDs of active students enrolled in a specific batch via
    batch_student_enrollments.
    """
    return [
        row[0]
        for row in (
            db.query(BatchStudentEnrollment.student_id)
            .join(User, BatchStudentEnrollment.student_id == User.id)
            .filter(
                BatchStudentEnrollment.batch_id == batch_id,
                BatchStudentEnrollment.status == "active",
                User.role == UserRole.STUDENT,
                User.is_active == True,  # noqa: E712
            )
            .all()
        )
    ]


# ─── schedule extraction helper ──────────────────────────────────────────────

def _schedule_string(batch: Batch) -> str:
    """
    Extract a human-readable schedule string from Batch.schedule (JSON dict).
    Falls back to 'Schedule pending' when the field is absent or empty.
    """
    if not batch.schedule:
        return "Schedule pending"
    if isinstance(batch.schedule, str):
        return batch.schedule if batch.schedule.strip() else "Schedule pending"
    if isinstance(batch.schedule, dict):
        return batch.schedule.get("schedule") or batch.schedule.get("label") or "Schedule pending"
    return "Schedule pending"


def _mode_string(batch: Batch) -> str:
    """
    Extract the delivery mode from Batch.schedule (JSON dict) or default to 'Offline'.
    """
    if not batch.schedule:
        return "Offline"
    if isinstance(batch.schedule, dict):
        return batch.schedule.get("mode") or "Offline"
    return "Offline"


# ─── Public entry points ──────────────────────────────────────────────────────

def resolve_trainer_batches(
    db: Session,
    trainer_id: str,
    branch_id: Optional[str],
) -> TrainerBatchResponse:
    """
    Resolve and return the full TrainerBatchResponse for a given trainer.

    Phase 2 architecture:
      - Query batch_trainer_assignments where trainer_id == trainer_id
      - Join to batches for metadata
      - Join to batch_student_enrollments for per-batch student counts
      - Join to courses for course names
      - Compute attendance using existing _compute_attendance_rate()
    """
    # 1. Find all batches assigned to this trainer
    assignments = (
        db.query(BatchTrainerAssignment)
        .filter(BatchTrainerAssignment.trainer_id == trainer_id)
        .all()
    )

    if not assignments:
        return TrainerBatchResponse(
            summary=TrainerBatchSummary(
                assigned_batches=0,
                active_batches=0,
                total_students=0,
                average_attendance=None,
            ),
            batches=[],
            updated_at=datetime.utcnow().isoformat(),
        )

    assigned_batch_ids = [a.batch_id for a in assignments]

    # 2. Load batch rows with their courses
    batch_rows = (
        db.query(Batch, Course)
        .join(Course, Batch.course_id == Course.id)
        .filter(Batch.id.in_(assigned_batch_ids))
        .all()
    )

    # 3. Count active students per batch from batch_student_enrollments
    student_count_rows = (
        db.query(
            BatchStudentEnrollment.batch_id,
            func.count(BatchStudentEnrollment.id).label("cnt"),
        )
        .join(User, BatchStudentEnrollment.student_id == User.id)
        .filter(
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .group_by(BatchStudentEnrollment.batch_id)
        .all()
    )
    student_count_map: dict[str, int] = {row.batch_id: int(row.cnt) for row in student_count_rows}
    student_id_rows = (
        db.query(
            BatchStudentEnrollment.batch_id,
            BatchStudentEnrollment.student_id,
        )
        .join(User, BatchStudentEnrollment.student_id == User.id)
        .filter(
            BatchStudentEnrollment.batch_id.in_(assigned_batch_ids),
            BatchStudentEnrollment.status == "active",
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .all()
    )
    student_ids_by_batch: dict[str, list[str]] = {}
    for row in student_id_rows:
        student_ids_by_batch.setdefault(row.batch_id, []).append(row.student_id)

    # 4. Build TrainerBatchItem list with attendance enrichment
    items: list[TrainerBatchItem] = []
    seen_student_ids: set[str] = set()

    for batch, course in batch_rows:
        batch_sid = student_ids_by_batch.get(batch.id, [])
        seen_student_ids.update(batch_sid)

        attendance_rate = _compute_attendance_rate(
            db,
            trainer_id=trainer_id,
            course_id=batch.course_id,
            student_ids=batch_sid,
        )

        items.append(
            TrainerBatchItem(
                id=batch.id,
                name=batch.name,
                course=course.title,
                course_id=batch.course_id,
                students=student_count_map.get(batch.id, 0),
                capacity=None,
                schedule=_schedule_string(batch),
                mode=_mode_string(batch),
                status=batch.status or "active",
                attendance_rate=attendance_rate,
                source="batch_table",
            )
        )

    items.sort(key=lambda x: x.name)

    # 5. Compute summary KPIs
    assigned = len(items)
    active = sum(1 for b in items if b.status.lower() == "active")
    total_students = len(seen_student_ids)

    rates = [b.attendance_rate for b in items if b.attendance_rate is not None]
    avg_attendance = round(sum(rates) / len(rates), 1) if rates else None

    summary = TrainerBatchSummary(
        assigned_batches=assigned,
        active_batches=active,
        total_students=total_students,
        average_attendance=avg_attendance,
    )

    return TrainerBatchResponse(
        summary=summary,
        batches=items,
        updated_at=datetime.utcnow().isoformat(),
    )


def resolve_trainer_batch_details(
    db: Session,
    trainer_id: str,
    branch_id: Optional[str],
    batch_id: str,
) -> TrainerBatchDetailsResponse:
    """
    Resolve and return details for a trainer-scoped batch.

    Phase 2 architecture:
      - Ownership validated directly against batch_trainer_assignments.
      - Students loaded from batch_student_enrollments (real UUIDs, no string matching).
      - Attendance, LMS, and assignment computation logic preserved from Phase 1.
    """
    # 1. Decode and validate ownership via batch_trainer_assignments
    requested_batch_id = _decode_identifier(batch_id)

    assignment = (
        db.query(BatchTrainerAssignment)
        .filter(
            BatchTrainerAssignment.trainer_id == trainer_id,
            BatchTrainerAssignment.batch_id == requested_batch_id,
        )
        .first()
    )
    if not assignment:
        raise PermissionError("Access to this batch is restricted or batch does not exist.")

    # 2. Load the batch record with its course
    batch = db.query(Batch).filter(Batch.id == requested_batch_id).first()
    if not batch:
        raise ValueError("Batch record not found.")

    course = db.query(Course).filter(Course.id == batch.course_id).first()
    if not course:
        raise ValueError("Course linked to batch not found.")

    course_id = batch.course_id

    # 3. Load students from batch_student_enrollments
    enrollment_rows = (
        db.query(BatchStudentEnrollment, User)
        .join(User, BatchStudentEnrollment.student_id == User.id)
        .filter(
            BatchStudentEnrollment.batch_id == requested_batch_id,
            User.role == UserRole.STUDENT,
            User.is_active == True,  # noqa: E712
        )
        .order_by(User.full_name)
        .all()
    )

    students_response: list[TrainerBatchStudent] = []
    batch_student_ids: list[str] = []
    attendance_rows = (
        db.query(
            AttendanceRecord.student_id,
            func.count(AttendanceRecord.id).label("total_count"),
            func.sum(
                case(
                    (
                        AttendanceRecord.status.in_(["present", "late", "Present", "Late"]),
                        1,
                    ),
                    else_=0,
                )
            ).label("present_count"),
        )
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id == course_id,
            AttendanceRecord.student_id.in_([student.id for _enrollment, student in enrollment_rows]),
        )
        .group_by(AttendanceRecord.student_id)
        .all()
        if enrollment_rows
        else []
    )
    attendance_by_student = {
        row.student_id: (int(row.total_count or 0), int(row.present_count or 0))
        for row in attendance_rows
    }

    for enrollment, student in enrollment_rows:
        batch_student_ids.append(student.id)

        total_rec, present_rec = attendance_by_student.get(student.id, (0, 0))
        rate: Optional[float] = None
        if total_rec > 0:
            rate = round((present_rec / total_rec) * 100, 1)

        students_response.append(
            TrainerBatchStudent(
                id=student.id,
                full_name=student.full_name,
                email=student.email,
                phone=student.phone,
                display_code=student.display_code,
                enrollment_status=enrollment.status,
                attendance_rate=rate,
            )
        )

    # 4. Attendance summary metrics
    sessions = (
        db.query(AttendanceSession)
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id == course_id,
        )
        .all()
    )

    submitted_sessions = 0
    pending_sessions = 0

    if batch_student_ids:
        for session in sessions:
            total_records_count = (
                db.query(func.count(AttendanceRecord.id))
                .filter(AttendanceRecord.session_id == session.id)
                .scalar()
                or 0
            )
            if total_records_count == 0:
                pending_sessions += 1
            else:
                has_batch_record = (
                    db.query(func.count(AttendanceRecord.id))
                    .filter(
                        AttendanceRecord.session_id == session.id,
                        AttendanceRecord.student_id.in_(batch_student_ids),
                    )
                    .scalar()
                    or 0
                )
                if has_batch_record > 0:
                    submitted_sessions += 1

    total_batch_records = (
        db.query(func.count(AttendanceRecord.id))
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(
            AttendanceSession.trainer_id == trainer_id,
            AttendanceSession.course_id == course_id,
            AttendanceRecord.student_id.in_(batch_student_ids),
        )
        .scalar()
        or 0
    ) if batch_student_ids else 0

    average_rate: Optional[float] = None
    if total_batch_records > 0:
        present_batch_records = (
            db.query(func.count(AttendanceRecord.id))
            .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
            .filter(
                AttendanceSession.trainer_id == trainer_id,
                AttendanceSession.course_id == course_id,
                AttendanceRecord.student_id.in_(batch_student_ids),
                AttendanceRecord.status.in_(["present", "late", "Present", "Late"]),
            )
            .scalar()
            or 0
        )
        average_rate = round((present_batch_records / total_batch_records) * 100, 1)

    attendance_summary = TrainerBatchAttendanceSummary(
        average_rate=average_rate,
        pending_sessions=pending_sessions,
        submitted_sessions=submitted_sessions,
    )

    # 5. LMS progress metrics
    total_lessons_per_student = (
        db.query(func.count(Lesson.id))
        .filter(Lesson.course_id == course_id)
        .scalar()
        or 0
    )
    total_lessons = total_lessons_per_student * len(batch_student_ids)

    completed_lessons = 0
    if batch_student_ids and total_lessons_per_student > 0:
        completed_lessons = (
            db.query(func.count(LessonProgress.id))
            .join(Lesson, LessonProgress.lesson_id == Lesson.id)
            .filter(
                Lesson.course_id == course_id,
                LessonProgress.student_id.in_(batch_student_ids),
                LessonProgress.is_completed == True,  # noqa: E712
            )
            .scalar()
            or 0
        )

    average_progress: Optional[float] = None
    if total_lessons > 0:
        average_progress = round((completed_lessons / total_lessons) * 100, 1)

    lms_progress = TrainerBatchLmsProgress(
        average_progress=average_progress,
        completed_lessons=completed_lessons,
        total_lessons=total_lessons,
    )

    # 6. Recent assignments (still sourced from Lesson until assignments table is migrated)
    assignments_query = (
        db.query(Lesson)
        .filter(
            Lesson.course_id == course_id,
            Lesson.content_type == "assignment",
        )
        .order_by(Lesson.created_at.desc())
        .limit(5)
        .all()
    )
    assignments = [
        TrainerBatchAssignment(
            id=a.id,
            title=a.title,
            course_id=a.course_id,
            due_at=a.due_at.isoformat() if a.due_at else None,
            max_marks=a.max_marks,
        )
        for a in assignments_query
    ]

    # 7. Branch name resolution
    branch_name = "Default Branch"
    if batch.branch_id:
        branch = db.query(Branch).filter(Branch.id == batch.branch_id).first()
        if branch:
            branch_name = branch.name

    # 8. Feature status list
    feature_status = [
        TrainerBatchFeatureStatus(
            s_no=52,
            feature="Mode Toggle (Online/Offline/Hybrid)",
            phase="Phase 3D",
            status="Active (Read-Only)",
        ),
        TrainerBatchFeatureStatus(
            s_no=55,
            feature="Calendar Sync Foundation (Google/iCal export)",
            phase="Phase 3D",
            status="Foundation Included",
        ),
        TrainerBatchFeatureStatus(
            s_no=116,
            feature="Equipment Booking Calendar",
            phase="Phase 3D",
            status="Visual Placeholder",
        ),
    ]

    # 9. Schedule list for detail response
    schedule_list: list[str] = []
    if batch.schedule:
        if isinstance(batch.schedule, dict):
            days = batch.schedule.get("days") or []
            if isinstance(days, list) and days:
                schedule_list = [str(d) for d in days]
            else:
                label = batch.schedule.get("schedule") or batch.schedule.get("label")
                if label:
                    schedule_list = [str(label)]
        elif isinstance(batch.schedule, str) and batch.schedule.strip():
            schedule_list = [batch.schedule]
    if not schedule_list:
        schedule_list = ["Schedule pending"]

    return TrainerBatchDetailsResponse(
        id=batch.id,
        name=batch.name,
        code=batch.name,
        course=course.title,
        branch=branch_name,
        mode=_mode_string(batch),
        status=batch.status or "active",
        schedule=schedule_list,
        students=students_response,
        attendance_summary=attendance_summary,
        lms_progress=lms_progress,
        assignments=assignments,
        feature_status=feature_status,
        updated_at=datetime.utcnow().isoformat(),
    )
