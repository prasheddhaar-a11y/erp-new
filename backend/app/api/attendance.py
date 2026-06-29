"""
PINESPHERE ERP
Module      : Attendance Module
File        : attendance.py
Purpose     : Defines Attendance API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import datetime, timedelta
import uuid

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.lms import Enrollment
from app.models.user import User
from app.schemas.attendance import AttendanceBulkMark, AttendanceQuickMark, AttendanceReportFilter, AttendanceSessionCreate, AttendanceSessionResponse, QrAttendanceMark

router = APIRouter(prefix="/attendance", tags=["Attendance"])


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _parent_student_ids(db: Session, current_user: User) -> list[str]:
    if not current_user.phone:
        return []
    return [student_id for (student_id,) in db.query(User.id).filter(User.role == UserRole.STUDENT, User.parent_phone == current_user.phone).all()]


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.post("/sessions", response_model=AttendanceSessionResponse)
def create_session(body: AttendanceSessionCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    session = AttendanceSession(title=body.title, session_date=body.session_date, course_id=body.course_id, trainer_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.post("/sessions/quick-mark")
def quick_mark_session(body: AttendanceQuickMark, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    session = AttendanceSession(
        title=body.title,
        session_date=body.session_date,
        course_id=body.course_id,
        trainer_id=current_user.id,
    )
    db.add(session)
    db.flush()

    students_query = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,  # noqa: E712
        or_(User.student_status == None, User.student_status != "removed"),  # noqa: E711
    )
    if current_user.role != UserRole.SUPER_ADMIN:
        students_query = students_query.filter(User.branch_id == current_user.branch_id)
    if body.course_id:
        enrolled_ids = db.query(Enrollment.student_id).filter(Enrollment.course_id == body.course_id)
        students_query = students_query.filter(User.id.in_(enrolled_ids))

    students = students_query.all()
    safe_status = body.status.lower()
    if safe_status not in {"present", "absent", "late"}:
        safe_status = "present"

    for student in students:
        db.add(
            AttendanceRecord(
                session_id=session.id,
                student_id=student.id,
                status=safe_status,
                minutes_late=0,
                remarks=body.remarks,
                marked_by_id=current_user.id,
                method="manual",
                marked_at=datetime.utcnow(),
            )
        )

    db.commit()
    db.refresh(session)
    return {
        "message": "Attendance session created and marked",
        "session_id": session.id,
        "students_marked": len(students),
        "status": safe_status,
    }


@router.get("/sessions", response_model=list[AttendanceSessionResponse])
def list_sessions(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT))):
    query = db.query(AttendanceSession).order_by(AttendanceSession.session_date.desc())
    if current_user.role == UserRole.TRAINER:
        query = query.filter(AttendanceSession.trainer_id == current_user.id)
    elif current_user.role == UserRole.BRANCH_ADMIN:
        query = query.join(User, AttendanceSession.trainer_id == User.id).filter(User.branch_id == current_user.branch_id)
    elif current_user.role == UserRole.STUDENT:
        query = query.join(AttendanceRecord).filter(AttendanceRecord.student_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        query = query.join(AttendanceRecord).filter(AttendanceRecord.student_id.in_(_parent_student_ids(db, current_user)))
    return query.all()


@router.post("/sessions/{session_id}/mark")
def mark_attendance(session_id: str, body: AttendanceBulkMark, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    if current_user.role == UserRole.TRAINER and session.trainer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to mark this attendance session")
    saved = 0
    for item in body.records:
        student = db.query(User).filter(User.id == item.student_id, User.role == UserRole.STUDENT).first()
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        if current_user.role != UserRole.SUPER_ADMIN and student.branch_id != current_user.branch_id:
            raise HTTPException(status_code=403, detail="Not allowed to mark attendance outside your branch")
        record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session_id, AttendanceRecord.student_id == item.student_id).first()
        if not record:
            record = AttendanceRecord(session_id=session_id, student_id=item.student_id)
            db.add(record)
        record.status = item.status.lower()
        record.minutes_late = item.minutes_late
        record.remarks = item.remarks
        record.marked_by_id = current_user.id
        record.method = "manual"
        record.marked_at = datetime.utcnow()
        saved += 1
    db.commit()
    return {"message": "Attendance saved", "records": saved}


@router.post("/sessions/{session_id}/qr")
def generate_qr(session_id: str, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    session = db.query(AttendanceSession).filter(AttendanceSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Attendance session not found")
    session.qr_token = str(uuid.uuid4())
    session.qr_expires_at = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    return {"qr_token": session.qr_token, "expires_at": session.qr_expires_at, "qr_payload": f"pinesphere-attendance://{session.qr_token}"}


@router.post("/qr/mark")
def mark_by_qr(body: QrAttendanceMark, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can mark QR attendance")
    session = db.query(AttendanceSession).filter(AttendanceSession.qr_token == body.qr_token).first()
    if not session or not session.qr_expires_at or session.qr_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="QR code is invalid or expired")
    record = db.query(AttendanceRecord).filter(AttendanceRecord.session_id == session.id, AttendanceRecord.student_id == current_user.id).first()
    if not record:
        record = AttendanceRecord(session_id=session.id, student_id=current_user.id)
        db.add(record)
    record.status = "present"
    record.method = "qr"
    record.marked_by_id = current_user.id
    record.marked_at = datetime.utcnow()
    db.commit()
    return {"message": "Attendance marked", "session_id": session.id}


@router.post("/reports")
def attendance_report(body: AttendanceReportFilter, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT))):
    query = db.query(AttendanceRecord).join(AttendanceSession)
    if current_user.role == UserRole.STUDENT:
        query = query.filter(AttendanceRecord.student_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        query = query.filter(AttendanceRecord.student_id.in_(_parent_student_ids(db, current_user)))
    elif current_user.role == UserRole.BRANCH_ADMIN:
        query = query.join(User, AttendanceRecord.student_id == User.id).filter(User.branch_id == current_user.branch_id)
    elif current_user.role == UserRole.TRAINER:
        query = query.filter(AttendanceSession.trainer_id == current_user.id)
    if body.course_id:
        query = query.filter(AttendanceSession.course_id == body.course_id)
    if body.student_id:
        query = query.filter(AttendanceRecord.student_id == body.student_id)
    if body.date_from:
        query = query.filter(AttendanceSession.session_date >= body.date_from)
    if body.date_to:
        query = query.filter(AttendanceSession.session_date <= body.date_to)
    records = query.all()
    total = len(records)
    present = len([record for record in records if record.status == "present"])
    late = len([record for record in records if record.status == "late"])
    absent = len([record for record in records if record.status == "absent"])
    percentage = round(((present + late) / total) * 100, 2) if total else 0
    return {"summary": {"total": total, "present": present, "late": late, "absent": absent, "attendance_percentage": percentage}, "records": [{"id": record.id, "student_id": record.student_id, "student_name": record.student.full_name if record.student else None, "session_id": record.session_id, "session_title": record.session.title if record.session else None, "status": record.status, "method": record.method, "marked_at": record.marked_at} for record in records]}


@router.get("/students/{student_id}/summary")
def student_summary(student_id: str, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT))):
    if current_user.role == UserRole.STUDENT and student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed to view this attendance summary")
    if current_user.role == UserRole.PARENT and student_id not in _parent_student_ids(db, current_user):
        raise HTTPException(status_code=403, detail="Not allowed to view this attendance summary")
    rows = db.query(AttendanceRecord.status, func.count(AttendanceRecord.id)).filter(AttendanceRecord.student_id == student_id).group_by(AttendanceRecord.status).all()
    counts = {status: count for status, count in rows}
    total = sum(counts.values())
    attended = counts.get("present", 0) + counts.get("late", 0)
    return {"student_id": student_id, "total_sessions": total, "present": counts.get("present", 0), "late": counts.get("late", 0), "absent": counts.get("absent", 0), "attendance_percentage": round((attended / total) * 100, 2) if total else 0}


@router.get("/students")
def list_students(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT, UserRole.FINANCE))):
    if current_user.role == UserRole.STUDENT:
        return (
            db.query(User)
            .filter(
                User.id == current_user.id,
                User.is_active == True,  # noqa: E712
                or_(User.student_status == None, User.student_status != "removed"),  # noqa: E711
            )
            .all()
        )
    query = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,  # noqa: E712
        or_(User.student_status == None, User.student_status != "removed"),  # noqa: E711
    )
    if current_user.role == UserRole.PARENT:
        query = query.filter(User.id.in_(_parent_student_ids(db, current_user)))
    elif current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(User.branch_id == current_user.branch_id)
    return query.all()
