"""
PINESPHERE ERP
Module      : Trainer Portal — Attendance Module
File        : backend/app/services/trainers/attendance.py
Purpose     : Trainer-scoped attendance service functions.
              All reads filter by trainer_id at the query level.
              All writes verify session ownership before any mutation.
              Session creation enforces batch ownership via batch_trainer_assignments.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================

from datetime import date, datetime
from typing import Optional
import uuid

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.user import User
from app.schemas.trainer import (
    TrainerAttendanceHistoryResponse,
    TrainerAttendanceHistorySummary,
    TrainerAttendanceMarkBody,
    TrainerAttendanceSessionCreate,
    TrainerAttendanceSessionDetail,
    TrainerAttendanceSessionItem,
    TrainerAttendanceSessionsResponse,
    TrainerAttendanceSessionsSummary,
    TrainerAttendanceStudentRecord,
)


# =====================================================
# SECTION: INTERNAL HELPERS
# =====================================================

def _compute_session_item(
    session: AttendanceSession,
    batch_id: Optional[str],
    batch_name: Optional[str] = None,
    course_name: Optional[str] = None,
    status: str = "pending",
) -> TrainerAttendanceSessionItem:
    """
    Build a TrainerAttendanceSessionItem from an ORM session object.

    Counts are derived from the already-loaded session.records relationship.
    attendance_rate is None when there are no students to avoid divide-by-zero.
    batch_id is passed in separately because AttendanceSession has no batch_id
    column — it is resolved from context (session create body or a join).
    batch_name, course_name, and status are optional display fields resolved
    by callers that have access to the relevant lookup tables.
    """
    records = session.records  # list[AttendanceRecord] via relationship

    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent = sum(1 for r in records if r.status == "absent")
    late = sum(1 for r in records if r.status == "late")

    rate: Optional[float] = None
    if total > 0:
        rate = round((present + late) / total * 100, 2)

    return TrainerAttendanceSessionItem(
        id=session.id,
        title=session.title,
        session_date=session.session_date,
        status=status,
        course_id=session.course_id,
        course_name=course_name,
        batch_id=batch_id,
        batch_name=batch_name,
        total_students=total,
        present_count=present,
        absent_count=absent,
        late_count=late,
        attendance_rate=rate,
        created_at=session.created_at,
    )


def _resolve_batch_id_for_session(
    db: Session,
    session_id: str,
) -> Optional[str]:
    """
    Attempt to resolve the batch_id for a session by finding a
    BatchStudentEnrollment whose student appears in the session's records.

    Returns the batch_id of the first matching enrollment, or None.
    This is a best-effort resolution — sessions created without a batch_id
    will return None, which is the correct and expected state.
    """
    # Get any student_id from this session's records
    record = (
        db.execute(
            select(AttendanceRecord.student_id)
            .where(AttendanceRecord.session_id == session_id)
            .limit(1)
        )
        .scalars()
        .first()
    )
    if not record:
        return None

    enrollment = (
        db.execute(
            select(BatchStudentEnrollment.batch_id)
            .where(BatchStudentEnrollment.student_id == record)
            .limit(1)
        )
        .scalars()
        .first()
    )
    return enrollment


def _assert_session_ownership(db, trainer_id, session_id):
    """
    Load a session and assert the requesting trainer owns it.

    Raises:
        ValueError  – session not found (route maps to 404)
        PermissionError – trainer_id mismatch (route maps to 403)
    """
    session = db.execute(
        select(AttendanceSession)
        .where(AttendanceSession.id == session_id)
        .options(selectinload(AttendanceSession.records))
    ).scalars().first()

    if not session:
        raise ValueError(f"Session {session_id} not found.")
    if session.trainer_id != trainer_id:
        raise PermissionError("You do not have access to this session.")
    return session


def _assert_batch_ownership(
    db: Session,
    trainer_id: str,
    batch_id: str,
) -> None:
    """
    Assert the trainer is assigned to the batch via batch_trainer_assignments.

    Raises:
        ValueError   – batch not found (route maps to 404)
        PermissionError – trainer not assigned to batch (route maps to 403)
    """
    batch = db.get(Batch, batch_id)
    if not batch:
        raise ValueError(f"Batch {batch_id} not found.")

    assignment = (
        db.execute(
            select(BatchTrainerAssignment).where(
                BatchTrainerAssignment.batch_id == batch_id,
                BatchTrainerAssignment.trainer_id == trainer_id,
            )
        )
        .scalars()
        .first()
    )
    if not assignment:
        raise PermissionError("You are not assigned to this batch.")


# =====================================================
# SECTION: SERVICE FUNCTIONS
# =====================================================


def get_trainer_attendance_sessions(
    db: Session,
    trainer_id: str,
    batch_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    limit: int = 20,
) -> TrainerAttendanceSessionsResponse:
    """
    Return a paginated list of attendance sessions owned by this trainer.

    Filters:
    - batch_id  : when provided, restricts to sessions whose records include
                  students enrolled in that batch.  Done via a subquery on
                  BatchStudentEnrollment → AttendanceRecord → AttendanceSession
                  to avoid adding a batch_id column to attendance_sessions.
    - date_from / date_to : inclusive range on session_date.

    Returns a plain dict matching the shape expected by the route:
        { "sessions": [...], "total": int, "page": int, "limit": int }
    """
    stmt = (
        select(AttendanceSession)
        .where(AttendanceSession.trainer_id == trainer_id)
        .order_by(AttendanceSession.session_date.desc(), AttendanceSession.created_at.desc())
        .options(selectinload(AttendanceSession.records))
    )

    if date_from:
        stmt = stmt.where(AttendanceSession.session_date >= date_from)
    if date_to:
        stmt = stmt.where(AttendanceSession.session_date <= date_to)

    if batch_id:
        # Subquery: session IDs that have at least one record for a student
        # enrolled in this batch.
        enrolled_student_ids = (
            select(BatchStudentEnrollment.student_id)
            .where(
                BatchStudentEnrollment.batch_id == batch_id,
                BatchStudentEnrollment.status == "active",
            )
        )
        session_ids_in_batch = (
            select(AttendanceRecord.session_id)
            .where(AttendanceRecord.student_id.in_(enrolled_student_ids))
        )
        stmt = stmt.where(AttendanceSession.id.in_(session_ids_in_batch))

    # Total count before pagination
    count_stmt = select(func.count()).select_from(stmt.order_by(None).subquery())
    total: int = db.execute(count_stmt).scalar_one()

    offset = (page - 1) * limit
    sessions = db.execute(stmt.offset(offset).limit(limit)).scalars().all()

    # ── Resolve batch name once (avoids N queries when batch_id is provided) ──
    batch_name_resolved: Optional[str] = None
    if batch_id:
        batch_obj = db.get(Batch, batch_id)
        if batch_obj:
            batch_name_resolved = batch_obj.name

    # ── Build session items with enriched fields ──
    items: list[TrainerAttendanceSessionItem] = []
    for s in sessions:
        resolved_batch_id = batch_id or _resolve_batch_id_for_session(db, s.id)
        # Resolve batch_name for non-filtered sessions (best-effort, 1 query each)
        b_name = batch_name_resolved
        if resolved_batch_id and not b_name:
            b_obj = db.get(Batch, resolved_batch_id)
            b_name = b_obj.name if b_obj else None
        # Resolve course_name directly from session.course_id
        c_name: Optional[str] = None
        if s.course_id:
            from app.models.lms import Course  # local import to avoid circular
            c_obj = db.get(Course, s.course_id)
            c_name = c_obj.title if c_obj else None
        # Derive status: submitted if all records are marked (none are absent-default)
        # Conservative rule: any record present → "submitted"; no records → "pending"
        s_status = "submitted" if s.records else "pending"
        items.append(
            _compute_session_item(
                s,
                batch_id=resolved_batch_id,
                batch_name=b_name,
                course_name=c_name,
                status=s_status,
            )
        )

    # ── Build summary KPIs ──
    today = date.today()
    today_sessions = [it for it in items if it.session_date == today]
    today_rate: Optional[float] = None
    if today_sessions:
        rates = [it.attendance_rate for it in today_sessions if it.attendance_rate is not None]
        if rates:
            today_rate = round(sum(rates) / len(rates), 2)

    pending_count = sum(1 for it in items if it.status == "pending")

    summary = TrainerAttendanceSessionsSummary(
        total_sessions=total,
        today_attendance_rate=today_rate,
        pending_sessions=pending_count,
    )

    return TrainerAttendanceSessionsResponse(
        summary=summary,
        sessions=items,
        total=total,
        page=page,
        limit=limit,
    )


def create_trainer_attendance_session(
    db: Session,
    trainer_id: str,
    body: TrainerAttendanceSessionCreate,
) -> TrainerAttendanceSessionItem:
    """
    Create a new attendance session for this trainer.

    Batch ownership:
    - If batch_id is provided, asserts the trainer is assigned to that batch
      via batch_trainer_assignments before creating the session.
    - Raises PermissionError if not assigned; ValueError if batch not found.

    Auto-population:
    - If batch_id is provided, fetches all active students from
      batch_student_enrollments and creates one AttendanceRecord per student
      with status="absent" as the default starting state.
    - The trainer then marks up from absent → present / late during the
      mark step.

    Returns the created session as a TrainerAttendanceSessionItem.
    """
    if body.batch_id:
        _assert_batch_ownership(db, trainer_id, body.batch_id)

    session = AttendanceSession(
        id=str(uuid.uuid4()),
        trainer_id=trainer_id,
        title=body.title,
        session_date=body.session_date,
        course_id=body.course_id,
        created_at=datetime.utcnow(),
    )
    db.add(session)
    db.flush()  # get session.id before creating records

    if body.batch_id:
        enrollments = (
            db.execute(
                select(BatchStudentEnrollment).where(
                    BatchStudentEnrollment.batch_id == body.batch_id,
                    BatchStudentEnrollment.status == "active",
                )
            )
            .scalars()
            .all()
        )
        for enrollment in enrollments:
            record = AttendanceRecord(
                id=str(uuid.uuid4()),
                session_id=session.id,
                student_id=enrollment.student_id,
                status="absent",
                minutes_late=0,
                marked_by_id=trainer_id,
                method="manual",
                marked_at=datetime.utcnow(),
            )
            db.add(record)

    db.commit()
    db.refresh(session)

    return _compute_session_item(session, batch_id=body.batch_id)


def get_trainer_session_detail(
    db: Session,
    trainer_id: str,
    session_id: str,
) -> TrainerAttendanceSessionItem:
    """
    Return session metadata for a single session.

    Verifies ownership — raises PermissionError if the session belongs to
    another trainer, ValueError if not found.
    """
    session = _assert_session_ownership(db, trainer_id, session_id)
    resolved_batch_id = _resolve_batch_id_for_session(db, session_id)
    return _compute_session_item(session, batch_id=resolved_batch_id)


def get_trainer_session_students(
    db: Session,
    trainer_id: str,
    session_id: str,
) -> TrainerAttendanceSessionDetail:
    """
    Return a session with its full student record list.

    Each student row includes their current attendance status for this session.
    Students with an AttendanceRecord get their stored status; students who
    appear in the session but whose record was somehow missing get "unmarked".

    Verifies ownership before fetching.
    """
    session = _assert_session_ownership(db, trainer_id, session_id)
    resolved_batch_id = _resolve_batch_id_for_session(db, session_id)
    session_item = _compute_session_item(session, batch_id=resolved_batch_id)

    # Build a map of student_id → AttendanceRecord for O(1) lookup
    record_map: dict[str, AttendanceRecord] = {
        r.student_id: r for r in session.records
    }

    # Collect all student_ids present in this session's records
    student_ids = list(record_map.keys())

    # Fetch user details for all students in one query
    users: list[User] = []
    if student_ids:
        users = (
            db.execute(
                select(User).where(User.id.in_(student_ids))
            )
            .scalars()
            .all()
        )

    student_records: list[TrainerAttendanceStudentRecord] = []
    for user in users:
        rec = record_map.get(user.id)
        student_records.append(
            TrainerAttendanceStudentRecord(
                student_id=user.id,
                full_name=user.full_name,
                display_code=user.display_code,
                status=rec.status if rec else "unmarked",
                minutes_late=rec.minutes_late if rec else 0,
                remarks=rec.remarks if rec else None,
                marked_at=rec.marked_at if rec else None,
            )
        )

    # Sort by full_name for consistent ordering in the UI
    student_records.sort(key=lambda s: s.full_name.lower())

    return TrainerAttendanceSessionDetail(
        session=session_item,
        students=student_records,
    )


def mark_trainer_attendance(
    db: Session,
    trainer_id: str,
    session_id: str,
    body: TrainerAttendanceMarkBody,
) -> dict:
    """
    Upsert attendance records for a session.

    Ownership check:
    - Fetches the session and asserts session.trainer_id == trainer_id.
    - Raises PermissionError on mismatch; ValueError if session not found.
    - No record is written until ownership is confirmed.

    Upsert logic:
    - If an AttendanceRecord already exists for (session_id, student_id),
      update status, minutes_late, remarks, marked_at, and marked_by_id.
    - If no record exists, create a new one.

    Returns: { "saved": N } where N is the count of records processed.
    """
    _assert_session_ownership(db, trainer_id, session_id)

    # Build a map of existing records for this session keyed by student_id
    existing_records: dict[str, AttendanceRecord] = {
        r.student_id: r
        for r in db.execute(
            select(AttendanceRecord).where(
                AttendanceRecord.session_id == session_id
            )
        )
        .scalars()
        .all()
    }

    now = datetime.utcnow()
    saved = 0

    for item in body.records:
        existing = existing_records.get(item.student_id)
        if existing:
            existing.status = item.status
            existing.minutes_late = item.minutes_late
            existing.remarks = item.remarks
            existing.marked_at = now
            existing.marked_by_id = trainer_id
        else:
            new_record = AttendanceRecord(
                id=str(uuid.uuid4()),
                session_id=session_id,
                student_id=item.student_id,
                status=item.status,
                minutes_late=item.minutes_late,
                remarks=item.remarks,
                marked_by_id=trainer_id,
                method="manual",
                marked_at=now,
            )
            db.add(new_record)
        saved += 1

    db.commit()
    return {"saved": saved}


def get_trainer_attendance_history(
    db: Session,
    trainer_id: str,
    batch_id: Optional[str] = None,
    course_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    page: int = 1,
    limit: int = 20,
) -> TrainerAttendanceHistoryResponse:
    """
    Return paginated attendance history with aggregate summary stats.

    Filters:
    - batch_id  : same subquery strategy as get_trainer_attendance_sessions.
    - course_id : filters directly on AttendanceSession.course_id.
    - date_from / date_to : inclusive range on session_date.

    Summary stats:
    - total_sessions : count of sessions matching the filters.
    - total_records  : sum of all AttendanceRecord rows across matched sessions.
    - overall_attendance_rate : (present + late) / total_records * 100, or None
                                when total_records == 0.

    Returns a TrainerAttendanceHistoryResponse.
    """
    stmt = (
        select(AttendanceSession)
        .where(AttendanceSession.trainer_id == trainer_id)
        .order_by(AttendanceSession.session_date.desc(), AttendanceSession.created_at.desc())
    )

    if course_id:
        stmt = stmt.where(AttendanceSession.course_id == course_id)
    if date_from:
        stmt = stmt.where(AttendanceSession.session_date >= date_from)
    if date_to:
        stmt = stmt.where(AttendanceSession.session_date <= date_to)

    if batch_id:
        enrolled_student_ids = (
            select(BatchStudentEnrollment.student_id)
            .where(
                BatchStudentEnrollment.batch_id == batch_id,
                BatchStudentEnrollment.status == "active",
            )
            .scalar_subquery()
        )
        session_ids_in_batch = (
            select(AttendanceRecord.session_id)
            .where(AttendanceRecord.student_id.in_(enrolled_student_ids))
            .scalar_subquery()
        )
        stmt = stmt.where(AttendanceSession.id.in_(session_ids_in_batch))

    # Total count before pagination (used in both summary and pagination)
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_sessions: int = db.execute(count_stmt).scalar_one()

    # Paginated sessions
    offset = (page - 1) * limit
    sessions = db.execute(stmt.offset(offset).limit(limit)).scalars().all()

    # Aggregate stats across ALL matched sessions (not just the current page)
    # Re-use the same filter stmt as a subquery for accuracy
    all_session_ids_stmt = select(AttendanceSession.id).where(
        AttendanceSession.trainer_id == trainer_id
    )
    if course_id:
        all_session_ids_stmt = all_session_ids_stmt.where(
            AttendanceSession.course_id == course_id
        )
    if date_from:
        all_session_ids_stmt = all_session_ids_stmt.where(
            AttendanceSession.session_date >= date_from
        )
    if date_to:
        all_session_ids_stmt = all_session_ids_stmt.where(
            AttendanceSession.session_date <= date_to
        )
    if batch_id:
        all_session_ids_stmt = all_session_ids_stmt.where(
            AttendanceSession.id.in_(
                select(AttendanceRecord.session_id)
                .where(
                    AttendanceRecord.student_id.in_(
                        select(BatchStudentEnrollment.student_id)
                        .where(
                            BatchStudentEnrollment.batch_id == batch_id,
                            BatchStudentEnrollment.status == "active",
                        )
                    )
                )
            )
        )

    total_records_count = _count_records_for_sessions(db, all_session_ids_stmt)
    present_late_count = _count_present_late_for_sessions(db, all_session_ids_stmt)

    overall_rate: Optional[float] = None
    if total_records_count > 0:
        overall_rate = round(present_late_count / total_records_count * 100, 2)

    summary = TrainerAttendanceHistorySummary(
        total_sessions=total_sessions,
        total_records=total_records_count,
        overall_attendance_rate=overall_rate,
    )

    items = []
    for s in sessions:
        resolved_batch_id = batch_id or _resolve_batch_id_for_session(db, s.id)
        items.append(_compute_session_item(s, batch_id=resolved_batch_id))

    return TrainerAttendanceHistoryResponse(
        summary=summary,
        sessions=items,
        total=total_sessions,
        page=page,
        limit=limit,
    )


# =====================================================
# SECTION: AGGREGATE HELPERS
# =====================================================

def _count_records_for_sessions(db: Session, session_ids_stmt) -> int:
    result = db.execute(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.session_id.in_(session_ids_stmt)
        )
    ).scalar_one()
    return result or 0


def _count_present_late_for_sessions(db: Session, session_ids_stmt) -> int:
    result = db.execute(
        select(func.count(AttendanceRecord.id)).where(
            AttendanceRecord.session_id.in_(session_ids_stmt),
            AttendanceRecord.status.in_(["present", "late"]),
        )
    ).scalar_one()
    return result or 0