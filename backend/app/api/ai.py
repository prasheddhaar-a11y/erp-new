"""
PINESPHERE ERP
Module      : AI Module
File        : ai.py
Purpose     : Defines Ai API endpoints and request handling
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

from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.attendance import AttendanceRecord
from app.models.crm import Lead
from app.models.finance import Invoice
from app.models.lms import Course
from app.models.user import User
from app.schemas.ai import AiChatRequest, AiChatResponse

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.post("/chat", response_model=AiChatResponse)
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def chat(body: AiChatRequest, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.STUDENT, UserRole.PARENT))):
    question = body.message.strip()
    q = question.lower()
    branch_filter = []
    if current_user.role != UserRole.SUPER_ADMIN:
        branch_filter.append(User.branch_id == current_user.branch_id)
    if current_user.role == UserRole.STUDENT:
        branch_filter.append(User.id == current_user.id)
    if current_user.role == UserRole.PARENT:
        branch_filter.append(User.parent_phone == current_user.phone if current_user.phone else User.id == "")

    students_query = db.query(User).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,  # noqa: E712
        or_(User.student_status == None, User.student_status != "removed"),  # noqa: E711
        *branch_filter,
    )
    active_students = students_query.all()
    student_count = len(active_students)
    course_count = db.query(Course).count()
    lead_query = db.query(Lead)
    invoice_query = db.query(Invoice).filter(Invoice.due_date < date.today(), Invoice.status != "paid")
    if current_user.role != UserRole.SUPER_ADMIN:
        lead_query = lead_query.filter(Lead.branch_id == current_user.branch_id)
        invoice_query = invoice_query.filter(Invoice.branch_id == current_user.branch_id)
    if current_user.role == UserRole.STUDENT:
        invoice_query = invoice_query.filter(Invoice.student_id == current_user.id)
    if current_user.role == UserRole.PARENT:
        invoice_query = invoice_query.filter(Invoice.student_id.in_([student.id for student in active_students]))
    lead_count = 0 if current_user.role in {UserRole.STUDENT, UserRole.PARENT} else lead_query.count()
    overdue_invoices = invoice_query.all()

    low_attendance_names = _low_attendance_students(db, active_students)
    matching_students = _matching_students(active_students, q)

    if not question:
        answer = "Ask me about students, fees, attendance, CRM leads, LMS courses, security, or parent updates."
    elif any(word in q for word in ["low attendance", "attendance", "absent"]):
        if low_attendance_names:
            answer = "Low attendance students: " + ", ".join(low_attendance_names[:8]) + ". Recommended action: call parents and schedule a catch-up class."
        else:
            answer = "No low-attendance students found from current attendance records. Keep monitoring students below 75%."
    elif any(word in q for word in ["fee", "payment", "due", "invoice", "defaulter"]):
        if overdue_invoices:
            rows = [f"{invoice.invoice_number} pending Rs {max(invoice.amount - invoice.paid_amount, 0):,.0f}" for invoice in overdue_invoices[:6]]
            answer = "Fee follow-up list: " + "; ".join(rows) + ". Send reminders and record payments after collection."
        else:
            answer = "No overdue fee invoices found right now. Finance status looks clear."
    elif any(word in q for word in ["lead", "crm", "demo", "admission"]):
        answer = f"CRM summary: {lead_count} lead(s) are in the system. Prioritize fresh enquiries, demo scheduled leads, and high-score leads first."
    elif any(word in q for word in ["course", "lms", "lesson", "batch"]):
        answer = f"LMS summary: {course_count} course(s) are available. Check unpublished courses, batch assignment, and student enrollments."
    elif any(word in q for word in ["parent", "summary", "update"]):
        if matching_students:
            student = matching_students[0]
            answer = f"Parent update for {student.full_name}: course {student.course_enrolled or 'pending'}, batch {student.batch_name or 'pending'}, documents {student.document_status or 'pending'}, status {student.student_status or 'active'}."
        else:
            answer = "Parent update template: mention attendance, course progress, pending fees, homework, and one focus area for this week."
    elif any(word in q for word in ["student", "find", "search", "who is"]):
        if matching_students:
            rows = [f"{student.full_name} ({student.display_code or student.id}) - {student.course_enrolled or 'course pending'}" for student in matching_students[:5]]
            answer = "Student matches: " + "; ".join(rows)
        else:
            answer = f"There are {student_count} active student(s). I could not find a matching name/code in your question."
    elif any(word in q for word in ["security", "login", "audit", "session", "mfa"]):
        answer = "Security means role-based access, JWT session control, audit logs, revoked-session tracking, and MFA readiness for Super Admin, Finance and Branch Admin users."
    else:
        answer = (
            f"Pinesphere ERP snapshot: {student_count} active student(s), {lead_count} CRM lead(s), "
            f"{course_count} LMS course(s), and {len(overdue_invoices)} overdue invoice(s). "
            "Ask a specific question like 'find Riya', 'fee follow-up list', or 'low attendance students'."
        )

    return AiChatResponse(
        answer=answer,
        suggestions=[
            "Find low attendance students",
            "Show fee follow-up list",
            "Create parent update summary",
        ],
    )


def _matching_students(students: list[User], query: str) -> list[User]:
    if not query:
        return []

    def score(student: User) -> int:
        values = [
            student.full_name,
            student.email,
            student.phone,
            student.display_code,
            student.parent_name,
            student.parent_phone,
            student.course_enrolled,
            student.batch_name,
        ]
        text = " ".join(str(value or "") for value in values).lower()
        name = (student.full_name or "").lower()
        code = (student.display_code or "").lower()
        if name and name in query or code and code in query:
            return 0
        words = [word for word in query.split() if len(word) >= 3]
        if any(word in text for word in words):
            return 1
        return 99

    matches = [student for student in students if score(student) < 99]
    return sorted(matches, key=score)


def _low_attendance_students(db: Session, students: list[User]) -> list[str]:
    names = []
    for student in students:
        rows = (
            db.query(AttendanceRecord.status, func.count(AttendanceRecord.id))
            .filter(AttendanceRecord.student_id == student.id)
            .group_by(AttendanceRecord.status)
            .all()
        )
        counts = {status: count for status, count in rows}
        total = sum(counts.values())
        if total == 0:
            continue
        attended = counts.get("present", 0) + counts.get("late", 0)
        percentage = (attended / total) * 100
        if percentage < 75:
            names.append(f"{student.full_name} ({percentage:.0f}%)")
    return names
