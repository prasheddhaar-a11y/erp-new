"""
PINESPHERE ERP
Module      : Branch Admin API
File        : branch_admin.py
Purpose     : Branch-scoped live APIs for the Branch Admin portal.
"""

from datetime import date, datetime, timedelta
import json
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import func, or_
from sqlalchemy.orm import Session, aliased

from app.auth.dependencies import require_roles
from app.auth.service import validate_password_strength
from app.core.roles import UserRole, role_abbreviation
from app.core.security import hash_password
from app.db.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.branch import Branch
from app.models.crm import Lead
from app.models.finance import Invoice, Payment
from app.models.hr import Employee, TrainerWorkload
from app.models.lms import Course, Enrollment, Lesson, LessonProgress
from app.models.settings import SystemSetting
from app.models.user import User
from app.services.shared.history import add_history

router = APIRouter(prefix="/api/v1/branch-admin", tags=["Branch Admin"])

PRESENT_STATUSES = ("present", "late", "Present", "Late")
PAID_STATUSES = ("paid", "PAID", "Paid")


def _temporary_password(prefix: str = "Temp") -> str:
    return f"{prefix}@{secrets.token_urlsafe(8)}1"


def _scope(db: Session, current_user: User, branch_id: str | None = None):
    if current_user.role == UserRole.SUPER_ADMIN:
        branch = db.query(Branch).filter(Branch.id == branch_id).first() if branch_id else None
        return branch_id, branch

    if not current_user.branch_id:
        raise HTTPException(status_code=403, detail="Branch Admin does not have an assigned branch")
    if branch_id and branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Cannot access another branch")

    branch = db.query(Branch).filter(Branch.id == current_user.branch_id).first()
    return current_user.branch_id, branch


def _current_branch_scope(db: Session, current_user: User):
    return _scope(db, current_user, None)


def _branch_name(branch: Branch | None, branch_id: str | None):
    return branch.name if branch else (branch_id or "All branches")


def _student_query(db: Session, branch_id: str | None):
    query = db.query(User).filter(User.role == UserRole.STUDENT)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    return query


def _lead_query(db: Session, branch_id: str | None):
    query = db.query(Lead)
    if branch_id:
        query = query.filter(Lead.branch_id == branch_id)
    return query


def _invoice_query(db: Session, branch_id: str | None):
    query = db.query(Invoice)
    if branch_id:
        query = query.filter(Invoice.branch_id == branch_id)
    return query


def _payment_query(db: Session, branch_id: str | None):
    query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id)
    if branch_id:
        query = query.filter(Invoice.branch_id == branch_id)
    return query


def _branch_student_ids(db: Session, branch_id: str | None):
    query = db.query(User.id).filter(User.role == UserRole.STUDENT)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    return [row[0] for row in query.all()]


def _course_for_name(db: Session, course_name: str | None):
    if not course_name:
        return None
    return db.query(Course).filter(func.lower(Course.title) == course_name.lower()).first()


def _lead_status(lead: Lead, student: User | None, enrollment: Enrollment | None):
    normalized = (lead.status or "new").strip().lower()
    if normalized in {"student_created"} or (student and enrollment and enrollment.batch_name):
        return "Batch Assigned"
    if normalized in {"approved", "converted"} or student:
        return "Student Created" if student else "Approved"
    if normalized in {"rejected", "lost"}:
        return "Rejected"
    if normalized == "pending" or normalized.endswith("_pending") or normalized.endswith("_verified"):
        return "Pending"
    if normalized == "new":
        return "New"
    return "New"


def _student_for_lead(db: Session, lead: Lead, branch_id: str | None = None):
    filters = []
    if lead.email:
        filters.append(func.lower(User.email) == lead.email.lower())
    if lead.phone:
        filters.append(User.phone == lead.phone)
    if not filters:
        return None
    query = db.query(User).filter(User.role == UserRole.STUDENT, or_(*filters))
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    return query.first()


def _lead_payload(db: Session, lead: Lead, branch: Branch | None = None):
    student = _student_for_lead(db, lead, lead.branch_id)
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id).order_by(Enrollment.enrolled_at.desc()).first() if student else None
    course = enrollment.course if enrollment else _course_for_name(db, lead.course_interest)
    trainer_name = course.trainer.full_name if course and course.trainer else ""
    branch_id = lead.branch_id or student.branch_id if student else lead.branch_id
    
    status_label = _lead_status(lead, student, enrollment)
    
    return {
        "branch_id": branch_id,
        "branch_name": _branch_name(branch, branch_id),
        "id": lead.id,
        "application_id": f"APP-{(branch.code if branch else branch_id or 'BR').upper()}-{lead.created_at.year if lead.created_at else date.today().year}-{lead.id[:6].upper()}",
        "student_name": lead.student_name,
        "phone": lead.phone,
        "email": lead.email or "",
        "course": lead.course_interest or (course.title if course else "Pending"),
        "batch": enrollment.batch_name if enrollment and enrollment.batch_name else "Pending",
        "counsellor": lead.counsellor.full_name if lead.counsellor else "Unassigned",
        "application_date": (lead.created_at.date() if lead.created_at else date.today()).isoformat(),
        "admission_status": status_label,
        "batch_status": "Assigned" if enrollment and enrollment.batch_name else "Pending",
        "assigned_trainer": trainer_name or student.trainer_name if student else trainer_name or "Not Assigned",
        "last_updated": (lead.updated_at or lead.created_at or datetime.utcnow()).isoformat(),
        "admission_stage": status_label,
        "notes": lead.notes or "",
        "student_id": student.id if student else None,
        "trainer": trainer_name,
        "timing": "",
    }


def _student_display_code(db: Session, branch: Branch | None, branch_id: str | None):
    prefix = f"PS-{(branch.code if branch else branch_id or 'BR').upper()}-{date.today().year}"
    count = _student_query(db, branch_id).count() + 1
    while True:
        code = f"{prefix}-{count:04d}"
        if not db.query(User).filter(User.display_code == code).first():
            return code
        count += 1


def _active_course_query(db: Session):
    return db.query(Course).filter(func.lower(Course.status).in_(["active", "published"]))


def _branch_course_ids(db: Session, branch_id: str | None):
    if not branch_id:
        return [row[0] for row in _active_course_query(db).with_entities(Course.id).all()]
    student_ids = _branch_student_ids(db, branch_id)
    ids = set(row[0] for row in db.query(Enrollment.course_id).filter(Enrollment.student_id.in_(student_ids)).distinct().all()) if student_ids else set()
    for batch in _batch_rows(db, branch_id):
        if batch.get("course_id"):
            ids.add(batch["course_id"])
        elif batch.get("course"):
            course = _course_for_name(db, str(batch["course"]))
            if course:
                ids.add(course.id)
    return list(ids)


def _timing_options(schedule: str | None, mode: str | None = None):
    text = f"{schedule or ''} {mode or ''}".lower()
    options = []
    if "morning" in text:
        options.append("Morning")
    if "evening" in text:
        options.append("Evening")
    if "weekend" in text or "sat" in text or "sun" in text:
        options.append("Weekend")
    if "online" in text:
        options.append("Online")
    if options:
        return options
    if schedule and schedule.strip().lower() not in {"schedule pending", "pending"}:
        return [schedule.strip()]
    return []


def _student_payload(db: Session, student: User):
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id).order_by(Enrollment.enrolled_at.desc()).first()
    course = enrollment.course if enrollment else None
    invoices = db.query(Invoice).filter(Invoice.student_id == student.id)
    paid = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.student_id == student.id).scalar() or 0)
    pending = float(invoices.with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)
    attendance_total = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).count()
    attendance_present = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id, AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
    return {
        "branch_id": student.branch_id,
        "id": student.id,
        "full_name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "course_enrolled": student.course_enrolled or (course.title if course else None),
        "batch_name": student.batch_name or (enrollment.batch_name if enrollment else None),
        "student_status": student.student_status or ("active" if student.is_active else "inactive"),
        "is_active": student.is_active,
        "role": student.role.value if hasattr(student.role, "value") else str(student.role),
        "attendance_percent": round((attendance_present / attendance_total) * 100, 2) if attendance_total else 0,
        "fees_paid": paid,
        "fees_pending": pending,
        "parent_name": student.parent_name,
        "parent_phone": student.parent_phone,
    }


def _invoice_payload(invoice: Invoice):
    return {
        "branch_id": invoice.branch_id,
        "id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "student_id": invoice.student_id,
        "student": invoice.student.full_name if invoice.student else "Student",
        "course": invoice.course_name or (invoice.student.course_enrolled if invoice.student else ""),
        "amount": invoice.amount,
        "paid_amount": invoice.paid_amount,
        "pending_amount": max((invoice.amount or 0) - (invoice.paid_amount or 0), 0),
        "status": invoice.status,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
        "notes": invoice.notes or "",
    }


def _payment_payload(payment: Payment):
    return {
        "id": payment.id,
        "invoice_id": payment.invoice_id,
        "invoice_number": payment.invoice.invoice_number if payment.invoice else "",
        "branch_id": payment.invoice.branch_id if payment.invoice else None,
        "student_id": payment.student_id,
        "student": payment.student.full_name if payment.student else "Student",
        "amount": payment.amount,
        "payment_method": payment.payment_method,
        "reference_number": payment.reference_number,
        "paid_at": payment.paid_at.isoformat() if payment.paid_at else "",
        "notes": payment.notes or "",
    }


def _receipt_number(payment: Payment):
    paid_at = payment.paid_at or datetime.utcnow()
    return f"RCT-{paid_at.year}-{payment.id[:8].upper()}"


def _receipt_payload(payment: Payment):
    invoice = payment.invoice
    student = payment.student
    return {
        "id": payment.id,
        "payment_id": payment.id,
        "receipt_no": _receipt_number(payment),
        "student_name": student.full_name if student else "Student",
        "invoice_no": invoice.invoice_number if invoice else "",
        "invoice_number": invoice.invoice_number if invoice else "",
        "course": invoice.course_name or (student.course_enrolled if student else ""),
        "amount_paid": float(payment.amount or 0),
        "payment_mode": payment.payment_method or "cash",
        "payment_date": payment.paid_at.isoformat() if payment.paid_at else "",
        "reference_number": payment.reference_number or "",
        "branch_id": invoice.branch_id if invoice else None,
    }


def _csv_cell(value):
    return f"\"{str(value if value is not None else '').replace('\"', '\"\"')}\""


def _pdf_escape(value):
    return str(value if value is not None else "").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _receipt_pdf(payment: Payment):
    receipt = _receipt_payload(payment)
    lines = [
        "PINESPHERE ERP",
        "Fee Receipt",
        f"Receipt No: {receipt['receipt_no']}",
        f"Student Name: {receipt['student_name']}",
        f"Invoice No: {receipt['invoice_no']}",
        f"Course: {receipt['course'] or 'Course pending'}",
        f"Amount Paid: Rs {receipt['amount_paid']:,.2f}",
        f"Payment Mode: {receipt['payment_mode']}",
        f"Payment Date: {receipt['payment_date']}",
        f"Reference No: {receipt['reference_number'] or 'Not recorded'}",
    ]
    text = "BT /F1 12 Tf 50 780 Td 16 TL " + " T* ".join(f"({_pdf_escape(line)}) Tj" for line in lines) + " ET"
    stream = text.encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    filename = f"{receipt['receipt_no']}.pdf"
    return Response(bytes(pdf), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


def _simple_pdf(filename: str, title: str, headers: list[str], rows: list[list[object]]):
    lines = ["PINESPHERE ERP", title, " | ".join(headers)]
    for row in rows[:80]:
        lines.append(" | ".join(str(value if value is not None else "") for value in row))
    text = "BT /F1 8 Tf 36 800 Td 11 TL " + " T* ".join(f"({_pdf_escape(line)}) Tj" for line in lines) + " ET"
    stream = text.encode("latin-1", "replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    pdf = bytearray(b"%PDF-1.4\n")
    offsets = []
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode())
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")
    xref = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets:
        pdf.extend(f"{offset:010d} 00000 n \n".encode())
    pdf.extend(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return Response(bytes(pdf), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


def _emi_payload(invoice: Invoice, today_val: date | None = None):
    today_val = today_val or date.today()
    total_fee = float(invoice.amount or 0)
    paid_amount = float(invoice.paid_amount or 0)
    pending_amount = max(total_fee - paid_amount, 0)
    installment_count = 3
    installment_amount = round(total_fee / installment_count, 2) if total_fee else 0
    paid_installments = min(installment_count, int(paid_amount // installment_amount) if installment_amount else 0)
    pending_installments = max(installment_count - paid_installments, 0)
    overdue_installments = pending_installments if invoice.due_date and invoice.due_date < today_val and pending_amount > 0 else 0
    if pending_amount <= 0:
        emi_status = "Completed"
    elif overdue_installments:
        emi_status = "Overdue"
    elif paid_installments > 0:
        emi_status = "Active"
    else:
        emi_status = "Pending"
    return {
        "id": invoice.id,
        "student_name": invoice.student.full_name if invoice.student else "Student",
        "course": invoice.course_name or (invoice.student.course_enrolled if invoice.student else ""),
        "invoice_no": invoice.invoice_number,
        "total_fee": total_fee,
        "installment_amount": installment_amount,
        "paid_installments": paid_installments,
        "pending_installments": pending_installments,
        "next_due_date": invoice.due_date.isoformat() if invoice.due_date and pending_amount > 0 else "",
        "overdue_installments": overdue_installments,
        "emi_status": emi_status,
    }


def _emi_rows(db: Session, branch_id: str | None):
    query = _invoice_query(db, branch_id).join(User, Invoice.student_id == User.id)
    invoices = query.order_by(Invoice.due_date.asc(), Invoice.invoice_number.asc()).all()
    rows = [_emi_payload(invoice) for invoice in invoices]
    return [row for row in rows if row["pending_installments"] > 0 or row["paid_installments"] > 0]


def _pending_fee_status(invoice: Invoice, pending_amount: float, today_val: date | None = None):
    today_val = today_val or date.today()
    if pending_amount <= 0:
        return "Paid"
    if invoice.due_date and invoice.due_date < today_val:
        return "Overdue"
    if (invoice.paid_amount or 0) > 0 or (invoice.status or "").lower() == "partial":
        return "Partial"
    return "Pending"


def _pending_fee_payload(db: Session, invoice: Invoice, today_val: date | None = None):
    student = invoice.student
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == invoice.student_id).order_by(Enrollment.enrolled_at.desc()).first()
    total_fee = float(invoice.amount or 0)
    paid_amount = float(invoice.paid_amount or 0)
    pending_amount = max(total_fee - paid_amount, 0)
    return {
        "id": invoice.id,
        "student_name": student.full_name if student else "Student",
        "course": invoice.course_name or (student.course_enrolled if student else "") or (enrollment.course.title if enrollment and enrollment.course else "") or "Course pending",
        "batch": (student.batch_name if student else "") or (enrollment.batch_name if enrollment else "") or "Unassigned",
        "total_fee": total_fee,
        "paid_amount": paid_amount,
        "pending_amount": pending_amount,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
        "status": _pending_fee_status(invoice, pending_amount, today_val),
    }


def _pending_fee_rows(db: Session, branch_id: str | None, course: str | None = None, batch: str | None = None, min_pending: float | None = None):
    invoices = _invoice_query(db, branch_id).join(User, Invoice.student_id == User.id).order_by(Invoice.due_date.asc(), Invoice.invoice_number.asc()).all()
    rows = [_pending_fee_payload(db, invoice) for invoice in invoices]
    rows = [row for row in rows if row["pending_amount"] > 0]
    if course:
        rows = [row for row in rows if row["course"].lower() == course.lower()]
    if batch:
        rows = [row for row in rows if row["batch"].lower() == batch.lower()]
    if min_pending is not None:
        rows = [row for row in rows if row["pending_amount"] >= min_pending]
    return rows


def _defaulter_follow_up_status(days_overdue: int):
    if days_overdue >= 30:
        return "Escalated Follow-up"
    if days_overdue >= 15:
        return "Priority Follow-up"
    return "Reminder Due"


def _defaulter_payload(db: Session, invoice: Invoice, today_val: date | None = None):
    today_val = today_val or date.today()
    student = invoice.student
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == invoice.student_id).order_by(Enrollment.enrolled_at.desc()).first()
    pending_amount = max(float(invoice.amount or 0) - float(invoice.paid_amount or 0), 0)
    days_overdue = max((today_val - invoice.due_date).days, 0) if invoice.due_date else 0
    return {
        "id": invoice.id,
        "student_name": student.full_name if student else "Student",
        "course": invoice.course_name or (student.course_enrolled if student else "") or (enrollment.course.title if enrollment and enrollment.course else "") or "Course pending",
        "batch": (student.batch_name if student else "") or (enrollment.batch_name if enrollment else "") or "Unassigned",
        "pending_amount": pending_amount,
        "due_date": invoice.due_date.isoformat() if invoice.due_date else "",
        "days_overdue": days_overdue,
        "phone": (student.phone if student else "") or "",
        "email": (student.email if student else "") or "",
        "follow_up_status": _defaulter_follow_up_status(days_overdue),
    }


def _defaulter_rows(db: Session, branch_id: str | None, search: str | None = None, min_days: int | None = None, max_days: int | None = None):
    invoices = (
        _invoice_query(db, branch_id)
        .join(User, Invoice.student_id == User.id)
        .filter(Invoice.status.notin_(PAID_STATUSES), Invoice.due_date < date.today())
        .order_by(Invoice.due_date.asc(), Invoice.invoice_number.asc())
        .all()
    )
    rows = [_defaulter_payload(db, invoice) for invoice in invoices]
    rows = [row for row in rows if row["pending_amount"] > 0]
    if search:
        rows = [row for row in rows if search.lower() in row["student_name"].lower()]
    if min_days is not None:
        rows = [row for row in rows if row["days_overdue"] >= min_days]
    if max_days is not None:
        rows = [row for row in rows if row["days_overdue"] <= max_days]
    return rows


def _batch_rows(db: Session, branch_id: str | None):
    StudentUser = aliased(User)
    TrainerUser = aliased(User)
    query = (
        db.query(
            Enrollment.batch_name,
            Course.id.label("course_id"),
            Course.title.label("course"),
            TrainerUser.full_name.label("trainer"),
            func.count(Enrollment.id).label("enrolled"),
        )
        .join(StudentUser, Enrollment.student_id == StudentUser.id)
        .join(Course, Enrollment.course_id == Course.id)
        .outerjoin(TrainerUser, Course.trainer_id == TrainerUser.id)
        .filter(Enrollment.batch_name != None)  # noqa: E711
    )
    if branch_id:
        query = query.filter(StudentUser.branch_id == branch_id)
    rows = query.group_by(Enrollment.batch_name, Course.id, Course.title, TrainerUser.full_name).all()
    enrollment_rows = [
        {
            "branch_id": branch_id,
            "batch": row.batch_name,
            "batch_name": row.batch_name,
            "course_id": row.course_id,
            "course": row.course,
            "trainer": row.trainer or "Unassigned",
            "capacity": max(int(row.enrolled or 0), 30),
            "enrolled": int(row.enrolled or 0),
            "available_seats": max(max(int(row.enrolled or 0), 30) - int(row.enrolled or 0), 0),
            "schedule": "Schedule pending",
        }
        for row in rows
    ]
    by_name = {row["batch"]: row for row in enrollment_rows}
    if branch_id:
        metadata_rows = db.query(SystemSetting).filter(SystemSetting.category == f"branch:{branch_id}:batches").all()
        for setting in metadata_rows:
            try:
                data = json.loads(setting.value)
            except json.JSONDecodeError:
                data = {}
            name = data.get("batch_name") or data.get("batch") or setting.label
            existing = by_name.get(name, {"branch_id": branch_id, "batch": name, "batch_name": name, "course_id": data.get("course_id"), "course": data.get("course") or "Course pending", "trainer": data.get("trainer") or "Unassigned", "capacity": int(data.get("capacity") or 30), "enrolled": 0, "schedule": data.get("schedule") or "Schedule pending"})
            existing.update({
                "batch": name,
                "batch_name": name,
                "course_id": data.get("course_id") or existing.get("course_id"),
                "course": data.get("course") or existing.get("course"),
                "trainer": data.get("trainer") or existing.get("trainer"),
                "capacity": int(data.get("capacity") or existing.get("capacity") or 30),
                "schedule": data.get("schedule") or existing.get("schedule"),
                "mode": data.get("mode") or existing.get("mode") or "Offline",
            })
            existing["available_seats"] = max(int(existing.get("capacity") or 0) - int(existing.get("enrolled") or 0), 0)
            by_name[name] = existing
        for batch in db.query(Batch).filter(Batch.branch_id == branch_id).all():
            metadata = by_name.get(batch.name, {})
            normalized_enrolled = db.query(BatchStudentEnrollment).filter(BatchStudentEnrollment.batch_id == batch.id, BatchStudentEnrollment.status == "active").count()
            trainer_assignment = (
                db.query(BatchTrainerAssignment, User)
                .join(User, BatchTrainerAssignment.trainer_id == User.id)
                .filter(BatchTrainerAssignment.batch_id == batch.id)
                .order_by(BatchTrainerAssignment.assigned_at.asc())
                .first()
            )
            trainer = trainer_assignment[1].full_name if trainer_assignment else (batch.course.trainer.full_name if batch.course and batch.course.trainer else metadata.get("trainer") or "Unassigned")
            schedule = metadata.get("schedule")
            if not schedule and isinstance(batch.schedule, dict):
                schedule = batch.schedule.get("label") or batch.schedule.get("summary") or batch.schedule.get("text")
            if not schedule:
                schedule = "Schedule pending"
            capacity = int(metadata.get("capacity") or max(normalized_enrolled, 30))
            by_name[batch.name] = {
                **metadata,
                "id": batch.id,
                "name": batch.name,
                "branch_id": batch.branch_id,
                "batch": batch.name,
                "batch_name": batch.name,
                "course_id": batch.course_id,
                "course": batch.course.title if batch.course else metadata.get("course") or "Course pending",
                "course_title": batch.course.title if batch.course else metadata.get("course") or "Course pending",
                "trainer_id": trainer_assignment[1].id if trainer_assignment else metadata.get("trainer_id"),
                "trainer": trainer,
                "capacity": capacity,
                "enrolled": normalized_enrolled,
                "available_seats": max(capacity - normalized_enrolled, 0),
                "schedule": schedule,
                "schedule_json": batch.schedule or {},
                "mode": metadata.get("mode") or "Offline",
                "status": batch.status or "active",
            }
    for row in by_name.values():
        row["available_seats"] = max(int(row.get("capacity") or 0) - int(row.get("enrolled") or 0), 0)
    return list(by_name.values())


def _batch_setting_key(branch_id: str, batch_name: str):
    return f"branch:{branch_id}:batch:{batch_name.strip().lower()}"


def _save_batch_metadata(db: Session, branch_id: str, batch_name: str, payload: dict):
    key = _batch_setting_key(branch_id, batch_name)
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = db.query(SystemSetting).filter(
            SystemSetting.category == f"branch:{branch_id}:batches",
            SystemSetting.label == batch_name,
        ).first()
    existing = {}
    if setting:
        try:
            existing = json.loads(setting.value)
        except json.JSONDecodeError:
            existing = {}
    data = {
        **existing,
        "batch_name": payload.get("batch_name") or payload.get("batch") or batch_name,
        "course": payload.get("course") or existing.get("course") or "Course pending",
        "course_id": payload.get("course_id") or existing.get("course_id"),
        "trainer": payload.get("trainer") or existing.get("trainer") or "Unassigned",
        "trainer_id": payload.get("trainer_id") or existing.get("trainer_id"),
        "capacity": int(payload.get("capacity") or existing.get("capacity") or 30),
        "schedule": payload.get("schedule") or existing.get("schedule") or "Schedule pending",
        "mode": payload.get("mode") or existing.get("mode") or "Offline",
    }
    if not setting:
        setting = SystemSetting(
            id=str(uuid.uuid4()),
            key=key,
            label=data["batch_name"],
            category=f"branch:{branch_id}:batches",
            value=json.dumps(data),
        )
        db.add(setting)
    else:
        setting.key = _batch_setting_key(branch_id, data["batch_name"])
        setting.label = data["batch_name"]
        setting.value = json.dumps(data)
    return data


def _batch_metadata(db: Session, branch_id: str | None, batch_name: str):
    if not branch_id:
        return {}
    setting = db.query(SystemSetting).filter(SystemSetting.key == _batch_setting_key(branch_id, batch_name)).first()
    if not setting:
        setting = db.query(SystemSetting).filter(
            SystemSetting.category == f"branch:{branch_id}:batches",
            SystemSetting.label == batch_name,
        ).first()
    if not setting:
        return {}
    try:
        return json.loads(setting.value)
    except json.JSONDecodeError:
        return {}


def _positive_int(value, default: int = 30):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return default
    return parsed if parsed > 0 else default


def _batch_schedule_label(batch: Batch, metadata: dict):
    if metadata.get("schedule"):
        return metadata["schedule"]
    if isinstance(batch.schedule, dict):
        for key in ("label", "summary", "text"):
            if batch.schedule.get(key):
                return str(batch.schedule[key])
        if batch.schedule:
            return json.dumps(batch.schedule)
    if batch.schedule:
        return str(batch.schedule)
    return "Schedule pending"


def _scoped_batch_by_id(db: Session, batch_id: str, branch_id: str | None):
    query = db.query(Batch).filter(Batch.id == batch_id)
    if branch_id:
        query = query.filter(Batch.branch_id == branch_id)
    return query.first()


def _normalized_batch_students(db: Session, batch: Batch):
    rows = (
        db.query(BatchStudentEnrollment, User)
        .join(User, BatchStudentEnrollment.student_id == User.id)
        .filter(
            BatchStudentEnrollment.batch_id == batch.id,
            User.role == UserRole.STUDENT,
        )
        .order_by(User.full_name.asc())
        .all()
    )
    return [
        {
            "student_id": student.id,
            "id": student.id,
            "student_name": student.full_name,
            "full_name": student.full_name,
            "email": student.email,
            "phone": student.phone,
            "enrollment_status": enrollment.status or "active",
            "status": enrollment.status or "active",
            "enrolled_at": enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
        }
        for enrollment, student in rows
    ]


def _normalized_batch_payload(db: Session, batch: Batch):
    metadata = _batch_metadata(db, batch.branch_id, batch.name)
    trainer_rows = (
        db.query(BatchTrainerAssignment, User)
        .join(User, BatchTrainerAssignment.trainer_id == User.id)
        .filter(BatchTrainerAssignment.batch_id == batch.id)
        .order_by(BatchTrainerAssignment.assigned_at.asc())
        .all()
    )
    trainers = [
        {
            "trainer_id": trainer.id,
            "id": trainer.id,
            "trainer_name": trainer.full_name,
            "full_name": trainer.full_name,
            "email": trainer.email,
            "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        }
        for assignment, trainer in trainer_rows
    ]
    primary_trainer = trainers[0] if trainers else None
    course = batch.course or db.query(Course).filter(Course.id == batch.course_id).first()
    course_trainer = course.trainer if course and course.trainer else None
    enrolled = (
        db.query(BatchStudentEnrollment)
        .filter(BatchStudentEnrollment.batch_id == batch.id, BatchStudentEnrollment.status == "active")
        .count()
    )
    capacity = _positive_int(metadata.get("capacity"), max(enrolled, 30))
    trainer_id = primary_trainer["trainer_id"] if primary_trainer else metadata.get("trainer_id") or (course_trainer.id if course_trainer else None)
    trainer_name = primary_trainer["trainer_name"] if primary_trainer else metadata.get("trainer") or (course_trainer.full_name if course_trainer else "Unassigned")
    return {
        "id": batch.id,
        "branch_id": batch.branch_id,
        "name": batch.name,
        "batch": batch.name,
        "batch_name": batch.name,
        "course_id": batch.course_id,
        "course": course.title if course else metadata.get("course") or "Course pending",
        "course_title": course.title if course else metadata.get("course") or "Course pending",
        "trainer_id": trainer_id,
        "trainer": trainer_name,
        "trainers": trainers,
        "capacity": capacity,
        "enrolled": enrolled,
        "available_seats": max(capacity - enrolled, 0),
        "schedule": _batch_schedule_label(batch, metadata),
        "schedule_json": batch.schedule or {},
        "mode": metadata.get("mode") or "Offline",
        "status": batch.status or "active",
        "created_at": batch.created_at.isoformat() if batch.created_at else None,
        "updated_at": batch.updated_at.isoformat() if batch.updated_at else None,
    }


def _course_for_payload(db: Session, course_id: str | None):
    if not course_id:
        return None
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


def _update_normalized_batch(db: Session, batch: Batch, payload: dict):
    old_name = batch.name
    course = batch.course or db.query(Course).filter(Course.id == batch.course_id).first()
    next_name = payload.get("name") or payload.get("batch_name") or payload.get("batch")
    if next_name:
        batch.name = str(next_name).strip()
    if payload.get("course_id"):
        course = _course_for_payload(db, payload.get("course_id"))
        batch.course_id = course.id
    if "status" in payload and payload.get("status"):
        batch.status = str(payload.get("status"))
    if "schedule_json" in payload and isinstance(payload.get("schedule_json"), dict):
        batch.schedule = payload.get("schedule_json")
    elif "schedule" in payload:
        batch.schedule = {"label": str(payload.get("schedule") or "")}

    metadata_payload = {
        **payload,
        "batch_name": batch.name,
        "batch": batch.name,
        "course_id": batch.course_id,
        "course": course.title if course else payload.get("course"),
        "schedule": payload.get("schedule") or _batch_schedule_label(batch, {}),
        "capacity": payload.get("capacity"),
        "mode": payload.get("mode"),
    }
    _save_batch_metadata(db, batch.branch_id, old_name, metadata_payload)

    if old_name != batch.name:
        student_ids = [
            row[0]
            for row in db.query(BatchStudentEnrollment.student_id).filter(
                BatchStudentEnrollment.batch_id == batch.id,
                BatchStudentEnrollment.status == "active",
            ).all()
        ]
        if student_ids:
            db.query(User).filter(User.id.in_(student_ids), User.role == UserRole.STUDENT).update({User.batch_name: batch.name}, synchronize_session=False)
            db.query(Enrollment).filter(Enrollment.student_id.in_(student_ids), Enrollment.batch_name == old_name).update({Enrollment.batch_name: batch.name}, synchronize_session=False)
    return batch


def _assign_normalized_batch_trainer(db: Session, batch: Batch, payload: dict):
    trainer_id = payload.get("trainer_id")
    if not trainer_id:
        raise HTTPException(status_code=422, detail="trainer_id is required")
    trainer = db.query(User).filter(User.id == trainer_id, User.branch_id == batch.branch_id).first()
    if not trainer:
        raise HTTPException(status_code=404, detail="Trainer not found")
    if trainer.role != UserRole.TRAINER:
        raise HTTPException(status_code=422, detail="Selected user is not a trainer")

    db.query(BatchTrainerAssignment).filter(BatchTrainerAssignment.batch_id == batch.id).delete(synchronize_session=False)
    db.add(BatchTrainerAssignment(id=str(uuid.uuid4()), batch_id=batch.id, trainer_id=trainer.id))

    course = batch.course or db.query(Course).filter(Course.id == batch.course_id).first()
    if course:
        course.trainer_id = trainer.id
    _save_batch_metadata(db, batch.branch_id, batch.name, {**payload, "batch_name": batch.name, "trainer": trainer.full_name, "trainer_id": trainer.id, "course_id": batch.course_id, "course": course.title if course else None})
    return trainer


def _active_batch_student_count(db: Session, batch_id: str):
    return db.query(BatchStudentEnrollment).filter(BatchStudentEnrollment.batch_id == batch_id, BatchStudentEnrollment.status == "active").count()


def _batch_capacity(db: Session, batch: Batch):
    metadata = _batch_metadata(db, batch.branch_id, batch.name)
    return _positive_int(metadata.get("capacity"), max(_active_batch_student_count(db, batch.id), 30))


def _transfer_normalized_batch_student(db: Session, source_batch: Batch, payload: dict):
    student_id = payload.get("student_id")
    target_batch_id = payload.get("target_batch_id") or payload.get("target_batch")
    if not student_id or not target_batch_id:
        raise HTTPException(status_code=422, detail="student_id and target_batch_id are required")
    target_batch = _scoped_batch_by_id(db, str(target_batch_id), source_batch.branch_id)
    if not target_batch:
        raise HTTPException(status_code=404, detail="Target batch not found")
    if target_batch.id == source_batch.id:
        raise HTTPException(status_code=422, detail="Target batch must be different from source batch")

    student = _student_query(db, source_batch.branch_id).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    source_membership = db.query(BatchStudentEnrollment).filter(
        BatchStudentEnrollment.batch_id == source_batch.id,
        BatchStudentEnrollment.student_id == student.id,
        BatchStudentEnrollment.status == "active",
    ).first()
    legacy_source_match = student.batch_name == source_batch.name or db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.batch_name == source_batch.name).first() is not None
    if not source_membership and not legacy_source_match:
        raise HTTPException(status_code=404, detail="Student is not enrolled in source batch")

    target_membership = db.query(BatchStudentEnrollment).filter(BatchStudentEnrollment.batch_id == target_batch.id, BatchStudentEnrollment.student_id == student.id).first()
    if not target_membership or target_membership.status != "active":
        capacity = _batch_capacity(db, target_batch)
        if _active_batch_student_count(db, target_batch.id) >= capacity:
            raise HTTPException(status_code=409, detail="Target batch is full")

    if source_membership:
        source_membership.status = "transferred"
    if target_membership:
        target_membership.status = "active"
    else:
        db.add(BatchStudentEnrollment(id=str(uuid.uuid4()), batch_id=target_batch.id, student_id=student.id, status="active"))

    student.batch_name = target_batch.name
    student.course_enrolled = target_batch.course.title if target_batch.course else student.course_enrolled
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == target_batch.course_id).first()
    if not enrollment:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.batch_name == source_batch.name).first()
    if enrollment:
        enrollment.course_id = target_batch.course_id
        enrollment.batch_name = target_batch.name
        enrollment.status = "active"
    else:
        db.add(Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=target_batch.course_id, batch_name=target_batch.name, status="active", progress_percent=0))
    return student, target_batch


@router.get("/dashboard")
def dashboard(branch_id: str | None = Query(default=None), db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    today = date.today()
    month_start = today.replace(day=1)

    students = _student_query(db, scoped_branch_id)
    active_students = students.filter(User.is_active == True).count()  # noqa: E712
    batches = _batch_rows(db, scoped_branch_id)
    trainers = db.query(Employee).filter(Employee.role.ilike("%trainer%"), Employee.status.ilike("active"))
    if scoped_branch_id:
        trainers = trainers.filter(Employee.branch_id == scoped_branch_id)

    leads = _lead_query(db, scoped_branch_id)
    new_admissions = leads.filter(Lead.created_at >= datetime.combine(month_start, datetime.min.time())).count()
    attendance_records = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .join(User, AttendanceRecord.student_id == User.id)
        .filter(AttendanceSession.session_date == today)
    )
    if scoped_branch_id:
        attendance_records = attendance_records.filter(User.branch_id == scoped_branch_id)
    total_attendance = attendance_records.count()
    present_attendance = attendance_records.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).count()

    payments_mtd = _payment_query(db, scoped_branch_id).filter(Payment.paid_at >= datetime.combine(month_start, datetime.min.time()))
    fee_revenue_mtd = float(payments_mtd.with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0)
    pending_fees = float(_invoice_query(db, scoped_branch_id).filter(Invoice.status.notin_(PAID_STATUSES)).with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)

    recent_admissions = [_lead_payload(db, lead, branch) for lead in leads.order_by(Lead.created_at.desc()).limit(5).all()]
    upcoming_sessions = db.query(AttendanceSession).outerjoin(Course, AttendanceSession.course_id == Course.id)
    if scoped_branch_id:
        student_ids = _branch_student_ids(db, scoped_branch_id)
        course_ids = [row[0] for row in db.query(Enrollment.course_id).filter(Enrollment.student_id.in_(student_ids)).distinct().all()] if student_ids else []
        upcoming_sessions = upcoming_sessions.filter(AttendanceSession.course_id.in_(course_ids)) if course_ids else upcoming_sessions.filter(False)
    upcoming_classes = [
        {
            "id": session.id,
            "batch": session.title,
            "course": session.course.title if session.course else "Course",
            "trainer": session.trainer.full_name if session.trainer else "Trainer",
            "time": session.session_date.isoformat(),
            "room": "Branch room",
        }
        for session in upcoming_sessions.filter(AttendanceSession.session_date >= today).order_by(AttendanceSession.session_date.asc()).limit(5).all()
    ]

    overdue_count = _invoice_query(db, scoped_branch_id).filter(Invoice.due_date < today, Invoice.status.notin_(PAID_STATUSES)).count()
    high_workload = db.query(TrainerWorkload).filter(TrainerWorkload.workload_status.ilike("%high%"))
    if scoped_branch_id:
        high_workload = high_workload.filter(TrainerWorkload.branch_id == scoped_branch_id)
    branch_alerts = []
    if total_attendance and (present_attendance / total_attendance) < 0.8:
        branch_alerts.append({"title": "Attendance below 80%", "detail": "Today's attendance is below target.", "severity": "Critical"})
    if overdue_count:
        branch_alerts.append({"title": "Overdue invoices", "detail": f"{overdue_count} invoices are overdue.", "severity": "Warning"})
    if high_workload.count():
        branch_alerts.append({"title": "Trainer workload high", "detail": f"{high_workload.count()} trainer workloads need review.", "severity": "Warning"})
    pending_approvals = len(_admission_rows(db, scoped_branch_id, branch, "pending"))
    if pending_approvals:
        branch_alerts.append({"title": "Pending admission approvals", "detail": f"{pending_approvals} admissions are awaiting action.", "severity": "Info"})

    recent_activity = []
    recent_activity.extend({"title": "Admission updated", "detail": lead.student_name, "time": lead.updated_at.isoformat() if lead.updated_at else "", "module": "Admissions"} for lead in leads.order_by(Lead.updated_at.desc()).limit(3).all())
    recent_activity.extend({"title": "Payment created", "detail": f"Rs {payment.amount:,.0f}", "time": payment.paid_at.isoformat() if payment.paid_at else "", "module": "Fees"} for payment in _payment_query(db, scoped_branch_id).order_by(Payment.paid_at.desc()).limit(3).all())

    return {
        "branch_id": scoped_branch_id,
        "branch_name": _branch_name(branch, scoped_branch_id),
        "total_students": students.count(),
        "active_students": active_students,
        "active_batches": len(batches),
        "active_trainers": trainers.count(),
        "new_admissions": new_admissions,
        "pending_admissions": pending_approvals,
        "attendance_today_percent": round((present_attendance / total_attendance) * 100, 2) if total_attendance else 0,
        "fee_revenue_mtd": fee_revenue_mtd,
        "pending_fees": pending_fees,
        "recent_admissions": recent_admissions,
        "upcoming_classes": upcoming_classes,
        "branch_alerts": branch_alerts,
        "recent_activity": sorted(recent_activity, key=lambda item: item["time"], reverse=True)[:5],
    }


@router.get("/me")
def branch_admin_me(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    role = current_user.role.value if hasattr(current_user.role, "value") else str(current_user.role)
    return {
        "branch_id": scoped_branch_id,
        "branch_name": _branch_name(branch, scoped_branch_id),
        "branch_code": branch.code if branch else "",
        "city": branch.city if branch else "",
        "logged_in_user_name": current_user.full_name,
        "role": role,
    }


@router.get("/options/courses")
def option_courses(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    course_ids = _branch_course_ids(db, scoped_branch_id)
    query = _active_course_query(db)
    if scoped_branch_id:
        query = query.filter(Course.id.in_(course_ids)) if course_ids else query.filter(False)
    return [
        {"id": course.id, "label": course.title, "title": course.title, "value": course.id, "status": course.status, "trainer_id": course.trainer_id}
        for course in query.order_by(Course.title.asc()).all()
    ]


@router.get("/options/batches")
def option_batches(course_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    rows = _batch_rows(db, scoped_branch_id)
    if course_id:
        rows = [row for row in rows if row.get("course_id") == course_id]
    return [
        {
            "id": row["batch_name"],
            "value": row["batch_name"],
            "label": f"{row['batch_name']} | Capacity {row.get('capacity', 0)} | Seats {row.get('available_seats', 0)} | {row.get('mode', 'Offline')}",
            **row,
            "timings": _timing_options(row.get("schedule"), row.get("mode")),
        }
        for row in rows
    ]


@router.get("/options/trainers")
def option_trainers(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    user_query = db.query(User).filter(User.role == UserRole.TRAINER)
    employee_query = db.query(Employee).filter(Employee.role.ilike("%trainer%"))
    if scoped_branch_id:
        user_query = user_query.filter(User.branch_id == scoped_branch_id)
        employee_query = employee_query.filter(Employee.branch_id == scoped_branch_id)
    user_rows = [
        {"id": user.id, "value": user.id, "label": user.full_name, "full_name": user.full_name, "email": user.email, "source": "users", "branch_id": user.branch_id}
        for user in user_query.order_by(User.full_name.asc()).all()
    ]
    employee_rows = [
        {"id": employee.id, "value": employee.id, "label": employee.full_name, "full_name": employee.full_name, "email": employee.email, "source": "hr_employees", "branch_id": employee.branch_id}
        for employee in employee_query.order_by(Employee.full_name.asc()).all()
    ]
    return user_rows + employee_rows


@router.get("/options/students")
def option_students(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    return [
        {"id": student.id, "value": student.id, "label": student.full_name, "full_name": student.full_name, "email": student.email, "course": student.course_enrolled, "batch": student.batch_name, "branch_id": student.branch_id}
        for student in _student_query(db, scoped_branch_id).order_by(User.full_name.asc()).all()
    ]


@router.get("/options/invoices")
def option_invoices(student_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    query = _invoice_query(db, scoped_branch_id)
    if student_id:
        query = query.filter(Invoice.student_id == student_id)
    return [
        {"id": invoice.id, "value": invoice.id, "label": f"{invoice.invoice_number} | {invoice.student.full_name if invoice.student else 'Student'} | Rs {invoice.amount:,.0f}", **_invoice_payload(invoice)}
        for invoice in query.order_by(Invoice.created_at.desc()).all()
    ]


@router.get("/options/timings")
def option_timings(batch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    rows = _batch_rows(db, scoped_branch_id)
    if batch_id:
        rows = [row for row in rows if row.get("batch_name") == batch_id or row.get("batch") == batch_id]
    values = []
    for row in rows:
        values.extend(_timing_options(row.get("schedule"), row.get("mode")))
    if not values:
        values = ["Morning", "Evening", "Weekend", "Online"]
    return [{"id": value, "value": value, "label": value} for value in sorted(set(values))]


@router.get("/options/statuses")
def option_statuses(module: str = "students", current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    normalized = module.strip().lower().replace(" ", "_")
    values = {
        "admissions": ["New", "Pending", "Approved", "Rejected", "Student Created", "Batch Assigned"],
        "students": ["active", "pending", "inactive"],
        "attendance": ["present", "absent", "late"],
        "fees": ["PENDING", "PARTIAL", "PAID"],
        "settings_users": ["Active", "Inactive"],
    }.get(normalized, ["active", "inactive"])
    return [{"id": value, "value": value, "label": value.replace("_", " ").title() if value.islower() else value} for value in values]


@router.get("/options/payment-methods")
def option_payment_methods(current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    values = [("cash", "Cash"), ("upi", "UPI"), ("card", "Card"), ("bank_transfer", "Bank Transfer")]
    return [{"id": value, "value": value, "label": label} for value, label in values]


@router.get("/options/modes")
def option_modes(current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    values = ["Online", "Offline", "Hybrid"]
    return [{"id": value, "value": value, "label": value} for value in values]


@router.get("/admissions")
def admissions(status: str | None = None, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    rows = _admission_rows(db, scoped_branch_id, branch, status)
    db.commit()
    return rows


def _admission_rows(db: Session, branch_id: str | None, branch: Branch | None, status: str | None = None):
    rows = [_lead_payload(db, lead, branch) for lead in _lead_query(db, branch_id).order_by(Lead.created_at.desc()).limit(500).all()]
    if not status:
        return rows
    normalized = status.strip().lower().replace("_", " ")
    if normalized == "approved":
        return [row for row in rows if row["admission_status"] == "Approved"]
    if normalized == "pending":
        return [row for row in rows if row["admission_status"] == "Pending"]
    if normalized == "rejected":
        return [row for row in rows if row["admission_status"] == "Rejected"]
    return [row for row in rows if row["admission_status"].lower() == normalized]


@router.get("/admissions/pending")
def pending_admissions(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    return _admission_rows(db, scoped_branch_id, branch, "pending")


@router.get("/admissions/approved")
def approved_admissions(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    return _admission_rows(db, scoped_branch_id, branch, "approved")


@router.get("/admissions/options")
def admission_options(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    courses = option_courses(db, current_user)
    trainers = option_trainers(db, current_user)
    batch_rows = _batch_rows(db, scoped_branch_id)
    return {
        "courses": courses,
        "batches": [
            {
                **batch,
                "available_seats": max(int(batch.get("capacity") or 0) - int(batch.get("enrolled") or 0), 0),
                "timings": _timing_options(batch.get("schedule"), batch.get("mode")),
            }
            for batch in batch_rows
        ],
        "trainers": trainers,
    }


@router.get("/admissions/{lead_id}")
def admission_detail(lead_id: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    lead = _lead_query(db, scoped_branch_id).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Admission not found")
    payload = _lead_payload(db, lead, branch)
    db.commit()
    return payload


@router.put("/admissions/{lead_id}")
def update_admission(lead_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id or payload.get("branch_id"))
    lead = _lead_query(db, scoped_branch_id).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Admission not found")
    field_map = {
        "student_name": "student_name",
        "phone": "phone",
        "email": "email",
        "course": "course_interest",
        "notes": "notes",
    }
    for source, target in field_map.items():
        if source in payload:
            setattr(lead, target, payload[source])
    if "admission_status" in payload:
        lead.status = str(payload["admission_status"]).lower().replace(" ", "_")
    add_history(db, module="Admissions", action="admission_updated", title=f"Admission updated: {lead.student_name}", details=f"Application: {lead.id}", record_id=lead.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(lead)
    return _lead_payload(db, lead, branch)


@router.post("/admissions/{lead_id}/approve")
@router.put("/admissions/{lead_id}/approve")
def approve_admission(lead_id: str, payload: dict | None = None, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    payload = payload or {}
    scoped_branch_id, branch = _scope(db, current_user, branch_id or payload.get("branch_id"))
    lead = _lead_query(db, scoped_branch_id).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Admission not found")

    if _student_for_lead(db, lead):
        raise HTTPException(status_code=409, detail="Student already exists.")

    course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, payload.get("course") or lead.course_interest)
    if not course:
        raise HTTPException(status_code=422, detail="Course is required before approval")

    temporary_password = payload.get("temporary_password") or _temporary_password("Student")
    validate_password_strength(temporary_password)

    student = User(
        id=str(uuid.uuid4()),
        full_name=lead.student_name,
        email=lead.email or f"student-{lead.id[:8]}@pinesphere.local",
        phone=lead.phone,
        hashed_password=hash_password(temporary_password),
        role=UserRole.STUDENT,
        role_abbreviation=role_abbreviation(UserRole.STUDENT),
        branch_id=scoped_branch_id,
        is_active=True,
        display_code=_student_display_code(db, branch, scoped_branch_id),
        course_enrolled=course.title,
        student_status="active",
        admission_date=date.today(),
    )
    db.add(student)
    db.flush()
    add_history(db, module="Students", action="student_created", title=f"Student created: {student.full_name}", details=f"Admission: {lead.id} | Login email: {student.email} | Temporary password generated", record_id=student.id, created_by_id=current_user.id, branch_id=scoped_branch_id)

    enrollment = Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=course.id, batch_name=payload.get("batch_name") or payload.get("batch"), status="active")
    db.add(enrollment)
    add_history(db, module="LMS", action="enrollment_created", title=f"Enrollment created: {student.full_name}", details=f"Course: {course.title} | Batch: {enrollment.batch_name or '-'}", record_id=enrollment.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    student.batch_name = enrollment.batch_name

    lead.status = "approved"
    lead.notes = f"{lead.notes or ''}\nApproved by {current_user.full_name}.".strip()
    add_history(db, module="Admissions", action="admission_approved", title=f"Admission approved: {lead.student_name}", details=f"Student: {student.id}", record_id=lead.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(lead)
    return {
        "student": _student_payload(db, student),
        "admission": _lead_payload(db, lead, branch),
        "temporary_password": temporary_password,
    }


@router.post("/admissions/{lead_id}/reject")
@router.put("/admissions/{lead_id}/reject")
def reject_admission(lead_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    reason = payload.get("reason")
    if not reason:
        raise HTTPException(status_code=422, detail="Rejection reason is required")
    scoped_branch_id, branch = _scope(db, current_user, branch_id or payload.get("branch_id"))
    lead = _lead_query(db, scoped_branch_id).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Admission not found")
    lead.status = "rejected"
    lead.lost_reason = reason
    lead.notes = f"{lead.notes or ''}\nRejection reason: {reason}".strip()
    add_history(db, module="Admissions", action="admission_rejected", title=f"Admission rejected: {lead.student_name}", details=f"Reason: {reason}", record_id=lead.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(lead)
    return _lead_payload(db, lead, branch)


@router.post("/admissions/{lead_id}/assign-batch")
@router.put("/admissions/{lead_id}/assign-batch")
def assign_admission_batch(lead_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id or payload.get("branch_id"))
    lead = _lead_query(db, scoped_branch_id).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Admission not found")

    batch_name = payload.get("batch_name") or payload.get("batch")
    if not batch_name:
        raise HTTPException(status_code=422, detail="Batch is required")

    batch = next((row for row in _batch_rows(db, scoped_branch_id) if row.get("batch_name") == batch_name or row.get("batch") == batch_name), None)
    if not batch:
        raise HTTPException(status_code=422, detail="Batch not found for this branch")

    course_id = payload.get("course_id") or batch.get("course_id")
    course_name = payload.get("course") or batch.get("course") or lead.course_interest
    course = db.query(Course).filter(Course.id == course_id).first() if course_id else _course_for_name(db, course_name)
    if not course:
        raise HTTPException(status_code=422, detail="Course is required before batch assignment")

    trainer = db.query(User).filter(User.id == payload.get("trainer_id"), User.role == UserRole.TRAINER).first() if payload.get("trainer_id") else None
    employee = db.query(Employee).filter(Employee.id == payload.get("trainer_id"), Employee.branch_id == scoped_branch_id).first() if payload.get("trainer_id") else None
    if trainer and scoped_branch_id and trainer.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot assign trainer from another branch")
    if payload.get("trainer_id") and not trainer and not employee:
        raise HTTPException(status_code=422, detail="Trainer not found for this branch")
    trainer_name = payload.get("trainer") or (trainer.full_name if trainer else None) or (employee.full_name if employee else None)
    if not trainer_name:
        raise HTTPException(status_code=422, detail="Trainer is required")

    existing_student = _student_for_lead(db, lead)
    if existing_student and scoped_branch_id and existing_student.branch_id != scoped_branch_id:
        raise HTTPException(status_code=409, detail="Student already exists.")
    student = existing_student
    if not student:
        created = approve_admission(lead_id, {**payload, "course_id": course.id, "course": course.title}, branch_id, db, current_user)
        student = db.query(User).filter(User.id == created["student"]["id"]).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    if scoped_branch_id and student.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot update another branch student")

    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == course.id).first()
    if not enrollment:
        enrollment = Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=course.id, batch_name=batch_name, status="active")
        db.add(enrollment)
    else:
        enrollment.batch_name = batch_name
        enrollment.status = "active"

    student.course_enrolled = course.title
    student.batch_name = batch_name
    student.trainer_name = trainer_name
    if trainer:
        course.trainer_id = trainer.id
    lead.course_interest = course.title
    lead.status = "approved"
    _save_batch_metadata(db, scoped_branch_id, batch_name, {**batch, **payload, "batch_name": batch_name, "course": course.title, "course_id": course.id, "trainer": trainer_name, "trainer_id": payload.get("trainer_id")})
    add_history(db, module="Admissions", action="batch_assigned", title=f"Batch assigned: {student.full_name}", details=f"Course: {student.course_enrolled or '-'} | Batch: {student.batch_name or '-'} | Trainer: {student.trainer_name or '-'}", record_id=lead_id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(student)
    db.refresh(lead)
    return {"student": _student_payload(db, student), "admission": _lead_payload(db, lead, branch)}


@router.get("/students")
def students(branch_id: str | None = None, course_id: str | None = None, batch_name: str | None = None, status: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    query = _student_query(db, scoped_branch_id)
    if status:
        query = query.filter(func.lower(User.student_status) == status.lower())
    if batch_name:
        query = query.filter(User.batch_name == batch_name)
    if course_id:
        query = query.join(Enrollment, Enrollment.student_id == User.id).filter(Enrollment.course_id == course_id)
    return [_student_payload(db, student) for student in query.order_by(User.created_at.desc()).limit(500).all()]


@router.get("/students/{student_id}")
@router.get("/students/{student_id}/profile")
def student_profile(student_id: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    student = _student_query(db, scoped_branch_id).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    payload = _student_payload(db, student)
    payload["enrollments"] = [
        {
            "id": enrollment.id,
            "course_id": enrollment.course_id,
            "course": enrollment.course.title if enrollment.course else "",
            "batch_name": enrollment.batch_name,
            "status": enrollment.status,
            "progress_percent": enrollment.progress_percent,
        }
        for enrollment in db.query(Enrollment).filter(Enrollment.student_id == student.id).all()
    ]
    payload["invoices"] = [_invoice_payload(invoice) for invoice in db.query(Invoice).filter(Invoice.student_id == student.id).all()]
    attendance_total = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).count()
    attendance_present = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id, AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
    latest_attendance = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == student.id).order_by(AttendanceRecord.marked_at.desc()).first()
    paid = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.student_id == student.id).scalar() or 0)
    pending = float(db.query(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).filter(Invoice.student_id == student.id).scalar() or 0)
    payload["attendance_summary"] = {
        "total_records": attendance_total,
        "present_records": attendance_present,
        "attendance_percent": round((attendance_present / attendance_total) * 100, 2) if attendance_total else 0,
        "last_present": latest_attendance.marked_at.isoformat() if latest_attendance and latest_attendance.marked_at else "",
    }
    payload["fee_summary"] = {"paid": paid, "pending": pending}
    payload["lms_progress"] = {
        "active_enrollments": len([enrollment for enrollment in payload["enrollments"] if str(enrollment["status"]).lower() == "active"]),
        "average_progress": round(sum(enrollment["progress_percent"] or 0 for enrollment in payload["enrollments"]) / max(len(payload["enrollments"]), 1), 2),
    }
    return payload


@router.post("/students")
def create_student(payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    if db.query(User).filter(User.email == payload["email"]).first():
        raise HTTPException(status_code=409, detail="Student email already exists")
    password = payload.get("password")
    if not password:
        raise HTTPException(status_code=422, detail="Password is required")
    validate_password_strength(password)
    branch = db.query(Branch).filter(Branch.id == scoped_branch_id).first() if scoped_branch_id else None
    student = User(
        id=str(uuid.uuid4()),
        full_name=payload["full_name"],
        email=payload["email"],
        phone=payload.get("phone"),
        hashed_password=hash_password(password),
        role=UserRole.STUDENT,
        role_abbreviation=role_abbreviation(UserRole.STUDENT),
        branch_id=scoped_branch_id,
        is_active=payload.get("is_active", True),
        display_code=_student_display_code(db, branch, scoped_branch_id),
        course_enrolled=payload.get("course_enrolled"),
        batch_name=payload.get("batch_name"),
        student_status=payload.get("student_status", "active"),
        admission_date=date.today(),
    )
    db.add(student)
    db.flush()
    course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, payload.get("course_enrolled"))
    if course:
        student.course_enrolled = course.title
        db.add(Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=course.id, batch_name=payload.get("batch_name"), status="active", progress_percent=0))
    add_history(db, module="Students", action="student_created", title=f"Student created: {student.full_name}", details=f"Created by Branch Admin: {current_user.full_name}", record_id=student.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(student)
    return _student_payload(db, student)


@router.put("/students/{student_id}")
def update_student(student_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    student = _student_query(db, scoped_branch_id).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    for field in ["full_name", "email", "phone", "course_enrolled", "batch_name", "student_status", "parent_name", "parent_phone"]:
        if field in payload:
            setattr(student, field, payload[field])
    if "is_active" in payload:
        student.is_active = bool(payload["is_active"])
    course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, payload.get("course_enrolled"))
    if course:
        student.course_enrolled = course.title
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == course.id).first()
        if not enrollment:
            enrollment = Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=course.id, batch_name=student.batch_name, status="active", progress_percent=0)
            db.add(enrollment)
        else:
            enrollment.batch_name = student.batch_name or enrollment.batch_name
            enrollment.status = "active"
    add_history(db, module="Students", action="student_updated", title=f"Student updated: {student.full_name}", details="Branch Admin student profile update", record_id=student.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(student)
    return _student_payload(db, student)


@router.put("/students/{student_id}/assign-batch")
def assign_student_batch(student_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    student = _student_query(db, scoped_branch_id).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    batch_name = payload.get("batch_name") or payload.get("batch")
    if not batch_name:
        raise HTTPException(status_code=422, detail="batch_name is required")
    course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, payload.get("course"))
    if course:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.course_id == course.id).first()
        if not enrollment:
            enrollment = Enrollment(id=str(uuid.uuid4()), student_id=student.id, course_id=course.id, batch_name=batch_name, status="active")
            db.add(enrollment)
        else:
            enrollment.batch_name = batch_name
        student.course_enrolled = course.title
    else:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id).order_by(Enrollment.enrolled_at.desc()).first()
        if enrollment:
            enrollment.batch_name = batch_name or enrollment.batch_name
    student.batch_name = batch_name
    add_history(db, module="Students", action="batch_assigned", title=f"Batch assigned: {student.full_name}", details=f"Batch: {batch_name or '-'}", record_id=student.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(student)
    return _student_payload(db, student)


def _user_detail_payload(db: Session, user: User, branch: Branch | None):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    payload = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": role_val,
        "branch_id": user.branch_id,
        "branch_name": branch.name if branch else (user.branch_id or "Branch"),
        "is_active": user.is_active,
        "status": "active" if user.is_active else "inactive",
        "display_code": user.display_code or user.id,
        "created_at": user.created_at.isoformat() if user.created_at else "",
        "course_enrolled": user.course_enrolled,
        "batch_name": user.batch_name,
        "student_status": user.student_status,
    }
    
    if user.role == UserRole.STUDENT:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id).order_by(Enrollment.enrolled_at.desc()).first()
        course_title = enrollment.course.title if enrollment and enrollment.course else user.course_enrolled
        batch_title = enrollment.batch_name if enrollment else user.batch_name
        
        invoices = db.query(Invoice).filter(Invoice.student_id == user.id)
        paid = float(db.query(func.coalesce(func.sum(Payment.amount), 0)).filter(Payment.student_id == user.id).scalar() or 0)
        pending = float(invoices.with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)
        
        attendance_total = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == user.id).count()
        attendance_present = db.query(AttendanceRecord).filter(AttendanceRecord.student_id == user.id, AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
        attendance_pct = round((attendance_present / attendance_total) * 100, 2) if attendance_total else 0
        
        enrollments_list = db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
        avg_progress = round(sum(e.progress_percent or 0 for e in enrollments_list) / max(len(enrollments_list), 1), 2)
        active_enrollments = len([e for e in enrollments_list if str(e.status).lower() == "active"])
        
        payload.update({
            "course_enrolled": course_title or "Pending",
            "batch_name": batch_title or "Pending",
            "student_status": user.student_status or ("active" if user.is_active else "inactive"),
            "attendance_percent": attendance_pct,
            "fees_paid": paid,
            "fees_pending": pending,
            "fee_status": "PAID" if pending <= 0 and paid > 0 else "PARTIAL" if paid > 0 else "PENDING",
            "lms_progress": {
                "average_progress": avg_progress,
                "active_enrollments": active_enrollments
            }
        })
    elif user.role == UserRole.TRAINER:
        specialization = user.course_enrolled or "General"
        courses = db.query(Course).filter(Course.trainer_id == user.id).all()
        course_ids = [c.id for c in courses]
        
        batches = []
        if course_ids:
            batch_rows = db.query(Enrollment.batch_name).filter(Enrollment.course_id.in_(course_ids)).distinct().all()
            batches = [b[0] for b in batch_rows if b[0]]
            
        assigned_batches_str = ", ".join(batches) if batches else user.batch_name or "None"
        
        weekly_classes = 0
        workload_status = "Balanced"
        employee = db.query(Employee).filter(or_(Employee.email == user.email, Employee.phone == user.phone)).first()
        if employee:
            workload = db.query(TrainerWorkload).filter(TrainerWorkload.trainer_id == employee.id).first()
            if workload:
                weekly_classes = workload.weekly_classes
                workload_status = workload.workload_status
                
        payload.update({
            "specialization": specialization,
            "course_enrolled": specialization,
            "assigned_batches": assigned_batches_str,
            "batch_name": assigned_batches_str,
            "weekly_classes": weekly_classes,
            "workload_status": workload_status
        })
    elif user.role == UserRole.COUNSELLOR:
        assigned_leads = db.query(Lead).filter(Lead.counsellor_id == user.id).count()
        converted = db.query(Lead).filter(Lead.counsellor_id == user.id, Lead.status.in_(["student_created", "converted", "approved"])).count()
        follow_ups = db.query(Lead).filter(Lead.counsellor_id == user.id, Lead.next_follow_up_at != None).count()
        
        payload.update({
            "assigned_leads": assigned_leads,
            "admissions_converted": converted,
            "follow_up_count": follow_ups,
            "course_enrolled": user.course_enrolled or "General Counselling",
            "batch_name": "N/A"
        })
    elif user.role == UserRole.FINANCE:
        invoices_count = db.query(Invoice).filter(Invoice.branch_id == user.branch_id).count()
        receipts_count = db.query(Payment).join(Invoice).filter(Invoice.branch_id == user.branch_id).count()
        
        payload.update({
            "fee_records_handled": invoices_count,
            "receipts_generated": receipts_count,
            "course_enrolled": user.course_enrolled or "Branch Finance",
            "batch_name": "N/A"
        })
        
    return payload


def _user_list_payload(user: User, branch: Branch | None):
    role_val = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": role_val,
        "branch_id": user.branch_id,
        "branch_name": branch.name if branch else (user.branch_id or "Branch"),
        "is_active": user.is_active,
        "status": "active" if user.is_active else "inactive",
        "display_code": user.display_code or user.id,
        "created_at": user.created_at.isoformat() if user.created_at else "",
        "course_enrolled": user.course_enrolled,
        "batch_name": user.batch_name,
        "student_status": user.student_status,
    }


@router.get("/users")
def get_branch_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
    course_id: str | None = None,
    batch_name: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    
    query = db.query(User)
    if scoped_branch_id:
        query = query.filter(User.branch_id == scoped_branch_id)
        
    allowed_roles = [UserRole.STUDENT, UserRole.TRAINER, UserRole.COUNSELLOR, UserRole.FINANCE]
    if role and role.lower() != "all":
        try:
            role_enum = UserRole(role.lower())
            if role_enum in allowed_roles:
                query = query.filter(User.role == role_enum)
            else:
                query = query.filter(False)
        except ValueError:
            query = query.filter(False)
    else:
        query = query.filter(User.role.in_(allowed_roles))
        
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.phone.ilike(search_pattern)
            )
        )
        
    if status and status.lower() != "all":
        is_active_val = status.lower() == "active"
        query = query.filter(User.is_active == is_active_val)
        
    if course_id and course_id.lower() != "all":
        course_obj = db.query(Course).filter(Course.id == course_id).first()
        if course_obj:
            query = query.outerjoin(Enrollment, Enrollment.student_id == User.id).filter(
                or_(
                    User.course_enrolled == course_obj.title,
                    Enrollment.course_id == course_id
                )
            )
            
    if batch_name and batch_name.lower() != "all":
        query = query.filter(
            or_(
                User.batch_name == batch_name,
                db.query(Enrollment).filter(Enrollment.student_id == User.id, Enrollment.batch_name == batch_name).exists()
            )
        )
        
    users_list = query.order_by(User.created_at.desc()).limit(500).all()
    return [_user_list_payload(u, branch) for u in users_list]


@router.get("/options/roles")
def get_options_roles(
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    return [
        {"id": "student", "value": "student", "label": "Student"},
        {"id": "trainer", "value": "trainer", "label": "Trainer"},
        {"id": "counsellor", "value": "counsellor", "label": "Counsellor"},
        {"id": "finance", "value": "finance", "label": "Finance"}
    ]


@router.post("/users")
def create_branch_user(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    if not scoped_branch_id:
        raise HTTPException(status_code=403, detail="Branch Admin must have a branch assigned")
        
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=422, detail="Email is required")
        
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="User email already exists")
        
    role_str = payload.get("role")
    if not role_str:
        raise HTTPException(status_code=422, detail="Role is required")
        
    try:
        role_enum = UserRole(role_str.lower())
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid user role")
        
    allowed_roles = [UserRole.STUDENT, UserRole.TRAINER, UserRole.COUNSELLOR, UserRole.FINANCE]
    if role_enum not in allowed_roles:
        raise HTTPException(status_code=403, detail="Not authorized to create users with this role")
        
    password = payload.get("password")
    if not password:
        raise HTTPException(status_code=422, detail="Password is required")
    validate_password_strength(password)
    
    course_enrolled = None
    batch_name = None
    
    if role_enum == UserRole.STUDENT:
        course_enrolled = payload.get("course_enrolled")
        batch_name = payload.get("batch_name")
    elif role_enum == UserRole.TRAINER:
        course_enrolled = payload.get("specialization") or payload.get("course_enrolled")
        batch_name = payload.get("batch_name")
    elif role_enum == UserRole.COUNSELLOR:
        course_enrolled = payload.get("target_course") or payload.get("course_enrolled")
    elif role_enum == UserRole.FINANCE:
        course_enrolled = payload.get("permission_type") or payload.get("course_enrolled")
        
    is_active = payload.get("is_active", True)
    if "status" in payload:
        is_active = payload.get("status").lower() == "active"
        
    branch_code = (branch.code if branch else "BR").upper()
    role_prefix = role_abbreviation(role_enum)
    user_count = db.query(User).filter(User.branch_id == scoped_branch_id, User.role == role_enum).count() + 1
    display_code = f"PS-{branch_code}-{role_prefix}-{user_count:04d}"
    
    user = User(
        id=str(uuid.uuid4()),
        full_name=payload["full_name"],
        email=email,
        phone=payload.get("phone"),
        hashed_password=hash_password(password),
        role=role_enum,
        role_abbreviation=role_prefix,
        branch_id=scoped_branch_id,
        is_active=is_active,
        display_code=display_code,
        course_enrolled=course_enrolled,
        batch_name=batch_name,
        student_status="active" if is_active else "inactive",
        admission_date=date.today(),
    )
    db.add(user)
    db.flush()
    
    if role_enum == UserRole.STUDENT and course_enrolled:
        course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, course_enrolled)
        if course:
            db.add(Enrollment(id=str(uuid.uuid4()), student_id=user.id, course_id=course.id, batch_name=batch_name, status="active", progress_percent=0))
            user.course_enrolled = course.title
            
    add_history(db, module="Users", action="user_created", title=f"User created: {user.full_name} ({role_enum.value.title()})", details=f"Created by Branch Admin: {current_user.full_name}", record_id=user.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(user)
    return _user_detail_payload(db, user, branch)


@router.get("/users/{user_id}")
def get_branch_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if scoped_branch_id and user.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot access user from another branch")
        
    return _user_detail_payload(db, user, branch)


@router.put("/users/{user_id}")
def update_branch_user(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if scoped_branch_id and user.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot edit user from another branch")
        
    if user.id == current_user.id:
        if "role" in payload and payload["role"] != user.role.value:
            raise HTTPException(status_code=403, detail="Cannot change your own role")
            
    if "full_name" in payload:
        user.full_name = payload["full_name"]
    if "phone" in payload:
        user.phone = payload["phone"]
    if "is_active" in payload:
        user.is_active = bool(payload["is_active"])
        user.student_status = "active" if user.is_active else "inactive"
    elif "status" in payload:
        user.is_active = payload["status"].lower() == "active"
        user.student_status = "active" if user.is_active else "inactive"
        
    role_enum = user.role
    if role_enum == UserRole.STUDENT:
        if "course_enrolled" in payload:
            user.course_enrolled = payload["course_enrolled"]
        if "batch_name" in payload:
            user.batch_name = payload["batch_name"]
            
        course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, user.course_enrolled)
        if course:
            user.course_enrolled = course.title
            enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id, Enrollment.course_id == course.id).first()
            if not enrollment:
                db.add(Enrollment(id=str(uuid.uuid4()), student_id=user.id, course_id=course.id, batch_name=user.batch_name, status="active", progress_percent=0))
            else:
                enrollment.batch_name = user.batch_name or enrollment.batch_name
                enrollment.status = "active"
    elif role_enum == UserRole.TRAINER:
        if "specialization" in payload:
            user.course_enrolled = payload["specialization"]
        elif "course_enrolled" in payload:
            user.course_enrolled = payload["course_enrolled"]
        if "batch_name" in payload:
            user.batch_name = payload["batch_name"]
    elif role_enum == UserRole.COUNSELLOR:
        if "target_course" in payload:
            user.course_enrolled = payload["target_course"]
        elif "course_enrolled" in payload:
            user.course_enrolled = payload["course_enrolled"]
    elif role_enum == UserRole.FINANCE:
        if "permission_type" in payload:
            user.course_enrolled = payload["permission_type"]
        elif "course_enrolled" in payload:
            user.course_enrolled = payload["course_enrolled"]
            
    add_history(db, module="Users", action="user_updated", title=f"User updated: {user.full_name}", details="Branch Admin user profile update", record_id=user.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(user)
    return _user_detail_payload(db, user, branch)


@router.put("/users/{user_id}/assign")
def assign_branch_user_fields(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if scoped_branch_id and user.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot modify user from another branch")
        
    role_enum = user.role
    if role_enum == UserRole.STUDENT:
        course_title = payload.get("course") or payload.get("course_enrolled")
        batch_name = payload.get("batch") or payload.get("batch_name")
        
        course = db.query(Course).filter(Course.id == payload.get("course_id")).first() if payload.get("course_id") else _course_for_name(db, course_title)
        if course:
            user.course_enrolled = course.title
            enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id, Enrollment.course_id == course.id).first()
            if not enrollment:
                db.add(Enrollment(id=str(uuid.uuid4()), student_id=user.id, course_id=course.id, batch_name=batch_name, status="active", progress_percent=0))
            else:
                enrollment.batch_name = batch_name or enrollment.batch_name
                enrollment.status = "active"
        if batch_name:
            user.batch_name = batch_name
            if not course:
                enrollment = db.query(Enrollment).filter(Enrollment.student_id == user.id).order_by(Enrollment.enrolled_at.desc()).first()
                if enrollment:
                    enrollment.batch_name = batch_name
    elif role_enum == UserRole.TRAINER:
        course_title = payload.get("course") or payload.get("course_enrolled") or payload.get("specialization")
        batch_name = payload.get("batch") or payload.get("batch_name") or payload.get("assigned_batches")
        
        if course_title:
            user.course_enrolled = course_title
        if batch_name:
            user.batch_name = batch_name
            
        if "weekly_classes" in payload or "workload_status" in payload:
            employee = db.query(Employee).filter(or_(Employee.email == user.email, Employee.phone == user.phone)).first()
            if employee:
                workload = db.query(TrainerWorkload).filter(TrainerWorkload.trainer_id == employee.id).first()
                if not workload:
                    workload = TrainerWorkload(
                        id=str(uuid.uuid4()),
                        trainer_id=employee.id,
                        branch_id=scoped_branch_id,
                        total_batches=1 if batch_name else 0,
                        total_students=0,
                        weekly_classes=int(payload.get("weekly_classes") or 0),
                        workload_status=payload.get("workload_status") or "Balanced"
                    )
                    db.add(workload)
                else:
                    if "weekly_classes" in payload:
                        workload.weekly_classes = int(payload["weekly_classes"])
                    if "workload_status" in payload:
                        workload.workload_status = payload["workload_status"]
    elif role_enum == UserRole.COUNSELLOR:
        target_course = payload.get("target_course") or payload.get("course") or payload.get("course_enrolled")
        if target_course:
            user.course_enrolled = target_course
            
        lead_id = payload.get("lead_id")
        if lead_id:
            lead = db.query(Lead).filter(Lead.id == lead_id, Lead.branch_id == scoped_branch_id).first()
            if lead:
                lead.counsellor_id = user.id
    elif role_enum == UserRole.FINANCE:
        permission = payload.get("permission_type") or payload.get("course") or payload.get("course_enrolled")
        if permission:
            user.course_enrolled = permission
            
    add_history(db, module="Users", action="user_assigned", title=f"User assigned/configured: {user.full_name}", details=f"Role: {role_enum.value}", record_id=user.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(user)
    return _user_detail_payload(db, user, branch)


@router.put("/users/{user_id}/status")
def update_branch_user_active_status(
    user_id: str,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if scoped_branch_id and user.branch_id != scoped_branch_id:
        raise HTTPException(status_code=403, detail="Cannot access user from another branch")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot deactivate yourself")
        
    if user.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot deactivate a Super Admin")
        
    is_active = bool(payload.get("is_active"))
    user.is_active = is_active
    user.student_status = "active" if is_active else "inactive"
    
    add_history(db, module="Users", action="user_status_updated", title=f"User status updated: {user.full_name}", details=f"Active: {is_active}", record_id=user.id, created_by_id=current_user.id, branch_id=scoped_branch_id)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "is_active": user.is_active, "status": "active" if user.is_active else "inactive"}


@router.get("/users/export")
def export_branch_users(
    search: str | None = None,
    role: str | None = None,
    status: str | None = None,
    course_id: str | None = None,
    batch_name: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, branch = _current_branch_scope(db, current_user)
    
    query = db.query(User)
    if scoped_branch_id:
        query = query.filter(User.branch_id == scoped_branch_id)
        
    allowed_roles = [UserRole.STUDENT, UserRole.TRAINER, UserRole.COUNSELLOR, UserRole.FINANCE]
    if role and role.lower() != "all":
        try:
            role_enum = UserRole(role.lower())
            if role_enum in allowed_roles:
                query = query.filter(User.role == role_enum)
            else:
                query = query.filter(False)
        except ValueError:
            query = query.filter(False)
    else:
        query = query.filter(User.role.in_(allowed_roles))
        
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.full_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                User.phone.ilike(search_pattern)
            )
        )
        
    if status and status.lower() != "all":
        is_active_val = status.lower() == "active"
        query = query.filter(User.is_active == is_active_val)
        
    if course_id and course_id.lower() != "all":
        course_obj = db.query(Course).filter(Course.id == course_id).first()
        if course_obj:
            query = query.outerjoin(Enrollment, Enrollment.student_id == User.id).filter(
                or_(
                    User.course_enrolled == course_obj.title,
                    Enrollment.course_id == course_id
                )
            )
            
    if batch_name and batch_name.lower() != "all":
        query = query.filter(
            or_(
                User.batch_name == batch_name,
                db.query(Enrollment).filter(Enrollment.student_id == User.id, Enrollment.batch_name == batch_name).exists()
            )
        )
        
    users_list = query.order_by(User.created_at.desc()).limit(500).all()
    
    csv_rows = ["Name,Email,Phone,Role,Course,Batch,Status,Branch"]
    branch_name_str = branch.name if branch else (scoped_branch_id or "Branch")
    
    for u in users_list:
        role_label = u.role.value.title() if hasattr(u.role, "value") else str(u.role).title()
        
        course_str = u.course_enrolled or "N/A"
        batch_str = u.batch_name or "N/A"
        
        if u.role == UserRole.STUDENT:
            enrollment = db.query(Enrollment).filter(Enrollment.student_id == u.id).order_by(Enrollment.enrolled_at.desc()).first()
            if enrollment:
                course_str = enrollment.course.title if enrollment.course else course_str
                batch_str = enrollment.batch_name if enrollment.batch_name else batch_str
        elif u.role == UserRole.TRAINER:
            courses = db.query(Course).filter(Course.trainer_id == u.id).all()
            if courses:
                course_str = u.course_enrolled or ", ".join([c.title for c in courses])
                batch_rows = db.query(Enrollment.batch_name).filter(Enrollment.course_id.in_([c.id for c in courses])).distinct().all()
                if batch_rows:
                    batch_str = ", ".join([b[0] for b in batch_rows if b[0]])
                    
        status_str = "Active" if u.is_active else "Inactive"
        
        name = f"\"{u.full_name.replace('\"', '\"\"')}\""
        email = f"\"{u.email.replace('\"', '\"\"')}\""
        phone = f"\"{u.phone.replace('\"', '\"\"')}\"" if u.phone else ""
        role_field = f"\"{role_label}\""
        course_field = f"\"{course_str.replace('\"', '\"\"')}\""
        batch_field = f"\"{batch_str.replace('\"', '\"\"')}\""
        status_field = f"\"{status_str}\""
        branch_field = f"\"{branch_name_str.replace('\"', '\"\"')}\""
        
        csv_rows.append(f"{name},{email},{phone},{role_field},{course_field},{batch_field},{status_field},{branch_field}")
        
    csv_content = "\n".join(csv_rows)
    return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_users.csv"})



def _attendance_dashboard(db: Session, branch_id: str | None):
    today = date.today()
    base = db.query(AttendanceRecord).join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id).join(User, AttendanceRecord.student_id == User.id)
    if branch_id:
        base = base.filter(User.branch_id == branch_id)
    today_query = base.filter(AttendanceSession.session_date == today)
    total = today_query.count()
    present = today_query.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
    late = today_query.filter(AttendanceRecord.minutes_late > 0).count()

    trend = []
    for offset in range(29, -1, -1):
        day = today - timedelta(days=offset)
        day_query = base.filter(AttendanceSession.session_date == day)
        day_total = day_query.count()
        day_present = day_query.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
        trend.append({"day": str(30 - offset), "rate": round((day_present / day_total) * 100, 2) if day_total else 0})

    batch_rows = []
    batch_names = [row[0] for row in db.query(Enrollment.batch_name).join(User, Enrollment.student_id == User.id).filter(User.branch_id == branch_id if branch_id else True, Enrollment.batch_name != None).distinct().all()]  # noqa: E711
    for batch in batch_names:
        student_ids = [row[0] for row in db.query(Enrollment.student_id).filter(Enrollment.batch_name == batch).all()]
        batch_query = base.filter(AttendanceRecord.student_id.in_(student_ids)) if student_ids else base.filter(False)
        batch_total = batch_query.count()
        batch_present = batch_query.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
        course = db.query(Course).join(Enrollment, Enrollment.course_id == Course.id).filter(Enrollment.batch_name == batch).first()
        batch_rows.append({"branch_id": branch_id, "batch": batch, "course": course.title if course else "Course", "attendance_rate": round((batch_present / batch_total) * 100, 2) if batch_total else 0, "students": len(student_ids)})

    trainer_rows = []
    trainer_ids = [row[0] for row in db.query(AttendanceSession.trainer_id).distinct().all()]
    for trainer_id in trainer_ids:
        trainer = db.query(User).filter(User.id == trainer_id).first()
        sessions = db.query(AttendanceSession).filter(AttendanceSession.trainer_id == trainer_id)
        assigned = sessions.count()
        submitted = sessions.join(AttendanceRecord, AttendanceRecord.session_id == AttendanceSession.id).distinct().count()
        ratio = submitted / assigned if assigned else 1
        trainer_rows.append({"branch_id": branch_id, "trainer": trainer.full_name if trainer else "Trainer", "classes_assigned": assigned, "attendance_submitted": submitted, "status": "Compliant" if ratio >= 0.95 else "Pending" if ratio >= 0.75 else "At Risk"})

    risk_students = []
    for student in _student_query(db, branch_id).all():
        student_query = base.filter(AttendanceRecord.student_id == student.id)
        total_records = student_query.count()
        present_records = student_query.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).count()
        rate = round((present_records / total_records) * 100, 2) if total_records else 0
        if total_records and rate < 80:
            last_present = student_query.filter(AttendanceRecord.status.in_(PRESENT_STATUSES)).order_by(AttendanceRecord.marked_at.desc()).first()
            risk_students.append({"branch_id": branch_id, "student": student.full_name, "course": student.course_enrolled or "Course", "batch": student.batch_name or "Pending", "attendance_rate": rate, "last_present": last_present.marked_at.date().isoformat() if last_present and last_present.marked_at else "", "risk_level": "High" if rate < 70 else "Medium"})

    alerts = []
    low_batches = [batch for batch in batch_rows if batch["attendance_rate"] and batch["attendance_rate"] < 80]
    alerts.extend({"title": "Batch below 80%", "detail": f"{batch['batch']} is at {batch['attendance_rate']}%.", "severity": "Critical"} for batch in low_batches[:3])
    pending_trainers = [trainer for trainer in trainer_rows if trainer["status"] != "Compliant"]
    if pending_trainers:
        alerts.append({"title": "Missing submissions", "detail": f"{len(pending_trainers)} trainer attendance logs need review.", "severity": "Warning"})

    return {
        "branch_id": branch_id,
        "kpis": {
            "today_attendance_rate": round((present / total) * 100, 2) if total else 0,
            "present_students": present,
            "absent_students": max(total - present, 0),
            "late_checkins": late,
            "attendance_compliance": round((len([t for t in trainer_rows if t["status"] == "Compliant"]) / max(len(trainer_rows), 1)) * 100, 2),
        },
        "trend": trend,
        "batches": batch_rows,
        "trainers": trainer_rows,
        "alerts": alerts,
        "risk_students": risk_students,
        "heatmap": [{"day": day, "slot": slot, "rate": 0} for day in ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] for slot in ["Morning", "Afternoon", "Evening"]],
        "activity": [{"title": "Attendance marked", "detail": record.student.full_name if record.student else "", "time": record.marked_at.isoformat() if record.marked_at else ""} for record in base.order_by(AttendanceRecord.marked_at.desc()).limit(5).all()],
    }


@router.get("/attendance/overview")
def attendance_overview(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return _attendance_dashboard(db, scoped_branch_id)


@router.get("/attendance/records")
def attendance_records(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    query = db.query(AttendanceRecord).join(User, AttendanceRecord.student_id == User.id)
    if scoped_branch_id:
        query = query.filter(User.branch_id == scoped_branch_id)
    return [{"id": record.id, "branch_id": scoped_branch_id, "student": record.student.full_name if record.student else "", "session": record.session.title if record.session else "", "status": record.status, "marked_at": record.marked_at.isoformat() if record.marked_at else "", "method": record.method} for record in query.order_by(AttendanceRecord.marked_at.desc()).limit(250).all()]


@router.get("/attendance/batch-performance")
def attendance_batch_performance(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return _attendance_dashboard(db, scoped_branch_id)["batches"]


@router.get("/attendance/trainer-compliance")
def attendance_trainer_compliance(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return _attendance_dashboard(db, scoped_branch_id)["trainers"]


@router.get("/attendance/defaulters")
def attendance_defaulters(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return _attendance_dashboard(db, scoped_branch_id)["risk_students"]


@router.get("/attendance/export")
def attendance_export(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    rows = attendance_records(scoped_branch_id, db, current_user)
    csv = "Student,Session,Status,Marked At,Method,Branch\n" + "\n".join(f"\"{row['student']}\",\"{row['session']}\",\"{row['status']}\",\"{row['marked_at']}\",\"{row['method']}\",\"{row['branch_id'] or ''}\"" for row in rows)
    return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_attendance.csv"})


@router.get("/fees/overview")
def fees_overview(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    invoices = _invoice_query(db, scoped_branch_id)
    payments = _payment_query(db, scoped_branch_id)
    today = date.today()
    month_start = today.replace(day=1)
    return {
        "branch_id": scoped_branch_id,
        "collected_today": float(payments.filter(func.date(Payment.paid_at) == today).with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0),
        "revenue_mtd": float(payments.filter(Payment.paid_at >= datetime.combine(month_start, datetime.min.time())).with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0),
        "invoice_count": invoices.count(),
        "pending_fees": float(invoices.filter(Invoice.status.notin_(PAID_STATUSES)).with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0),
        "overdue_count": invoices.filter(Invoice.due_date < today, Invoice.status.notin_(PAID_STATUSES)).count(),
    }


@router.get("/fees/dashboard")
def fees_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    overview = fees_overview(branch_id=scoped_branch_id, db=db, current_user=current_user)
    overview["total_collected"] = float(_payment_query(db, scoped_branch_id).with_entities(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0)
    return overview


@router.get("/fees/invoices")
def fee_invoices(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return [_invoice_payload(invoice) for invoice in _invoice_query(db, scoped_branch_id).order_by(Invoice.created_at.desc()).limit(500).all()]


@router.get("/fees/payments")
def fee_payments(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return [_payment_payload(payment) for payment in _payment_query(db, scoped_branch_id).order_by(Payment.paid_at.desc()).limit(500).all()]


@router.post("/fees/collect")
def collect_fee(payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    invoice = _invoice_query(db, scoped_branch_id).filter(Invoice.id == payload.get("invoice_id")).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    amount = float(payload.get("amount") or 0)
    if amount <= 0:
        raise HTTPException(status_code=422, detail="Payment amount must be greater than zero")
    payment = Payment(id=str(uuid.uuid4()), invoice_id=invoice.id, student_id=invoice.student_id, amount=amount, payment_method=payload.get("payment_method", "cash"), reference_number=payload.get("reference_number"), notes=payload.get("notes"))
    db.add(payment)
    invoice.paid_amount = float(invoice.paid_amount or 0) + amount
    if invoice.paid_amount >= invoice.amount:
        invoice.status = "PAID"
    elif invoice.paid_amount > 0:
        invoice.status = "PARTIAL"
    else:
        invoice.status = "PENDING"
    db.commit()
    db.refresh(payment)
    return {"receipt": _payment_payload(payment), "invoice": _invoice_payload(invoice)}


@router.get("/fees/defaulters")
def fee_defaulters(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    return _defaulter_rows(db, scoped_branch_id)


@router.get("/fees/pending")
def fee_pending(
    course: str | None = None,
    batch: str | None = None,
    min_pending: float | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    return _pending_fee_rows(db, scoped_branch_id, course, batch, min_pending)


@router.get("/fees/receipts")
def fee_receipts(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return [_receipt_payload(payment) for payment in _payment_query(db, scoped_branch_id).order_by(Payment.paid_at.desc()).limit(500).all()]


@router.get("/fees/receipts/{payment_id}")
def fee_receipt(payment_id: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    payment = _payment_query(db, scoped_branch_id).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _receipt_pdf(payment)


@router.get("/fees/emi")
def fee_emi(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _current_branch_scope(db, current_user)
    return _emi_rows(db, scoped_branch_id)


@router.get("/fees/ledger")
def get_fee_ledger(
    search: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, _ = _scope(db, current_user)
    
    latest_payment_sub = (
        db.query(Payment.invoice_id, func.max(Payment.paid_at).label("last_payment_date"))
        .group_by(Payment.invoice_id)
        .subquery()
    )
    
    query = (
        db.query(Invoice, latest_payment_sub.c.last_payment_date)
        .outerjoin(latest_payment_sub, Invoice.id == latest_payment_sub.c.invoice_id)
        .join(User, Invoice.student_id == User.id)
    )
    
    if scoped_branch_id:
        query = query.filter(Invoice.branch_id == scoped_branch_id)
        
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%"))
        
    results = query.order_by(Invoice.created_at.desc()).all()
    
    today_val = date.today()
    ledger_records = []
    
    for invoice, last_payment_date in results:
        pending_amount = max((invoice.amount or 0) - (invoice.paid_amount or 0), 0)
        inv_status = (invoice.status or "").lower()
        
        if inv_status == "paid" or pending_amount <= 0:
            status_label = "Paid"
        elif invoice.due_date and invoice.due_date < today_val:
            status_label = "Overdue"
        elif inv_status == "partial" or (invoice.paid_amount or 0) > 0:
            status_label = "Partial"
        else:
            status_label = "Pending"
            
        if status and status.lower() != "all":
            if status_label.lower() != status.lower():
                continue
                
        ledger_records.append({
            "student_name": invoice.student.full_name if invoice.student else "Student",
            "course": invoice.course_name or (invoice.student.course_enrolled if invoice.student else ""),
            "invoice_no": invoice.invoice_number,
            "total_fee": invoice.amount,
            "amount_paid": invoice.paid_amount,
            "pending_amount": pending_amount,
            "last_payment_date": last_payment_date.isoformat() if last_payment_date else None,
            "status": status_label
        })
        
    total_count = len(ledger_records)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_records = ledger_records[start_idx:end_idx]
    
    return {
        "ledger": paginated_records,
        "total_count": total_count,
        "page": page,
        "limit": limit
    }


@router.get("/fees/export")
def fees_export(
    type: str | None = None,
    search: str | None = None,
    status: str | None = None,
    branch_id: str | None = None,
    format: str = "csv",
    course: str | None = None,
    batch: str | None = None,
    min_pending: float | None = Query(default=None, ge=0),
    min_days: int | None = Query(default=None, ge=0),
    max_days: int | None = Query(default=None, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))
):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    if type == "emi":
        rows = _emi_rows(db, scoped_branch_id)
        if search:
            rows = [row for row in rows if search.lower() in row["student_name"].lower()]
        if status and status.lower() != "all":
            rows = [row for row in rows if row["emi_status"].lower() == status.lower()]
        headers = ["Student Name", "Course", "Invoice No", "Total Fee", "Installment Amount", "Paid Installments", "Pending Installments", "Next Due Date", "Overdue Installments", "EMI Status"]
        values = [[
            row["student_name"],
            row["course"],
            row["invoice_no"],
            row["total_fee"],
            row["installment_amount"],
            row["paid_installments"],
            row["pending_installments"],
            row["next_due_date"],
            row["overdue_installments"],
            row["emi_status"],
        ] for row in rows]
        if format.lower() == "pdf":
            return _simple_pdf("branch_emi_tracking.pdf", "EMI Tracking", headers, values)
        csv = ",".join(headers) + "\n" + "\n".join(",".join(_csv_cell(value) for value in row) for row in values)
        return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_emi_tracking.csv"})
    if type == "pending":
        rows = _pending_fee_rows(db, scoped_branch_id, course, batch, min_pending)
        if status and status.lower() != "all":
            rows = [row for row in rows if row["status"].lower() == status.lower()]
        headers = ["Student Name", "Course", "Batch", "Total Fee", "Paid Amount", "Pending Amount", "Due Date", "Status"]
        values = [[
            row["student_name"],
            row["course"],
            row["batch"],
            row["total_fee"],
            row["paid_amount"],
            row["pending_amount"],
            row["due_date"],
            row["status"],
        ] for row in rows]
        if format.lower() == "pdf":
            return _simple_pdf("branch_pending_fees.pdf", "Pending Fees Report", headers, values)
        csv = ",".join(headers) + "\n" + "\n".join(",".join(_csv_cell(value) for value in row) for row in values)
        return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_pending_fees.csv"})
    if type == "defaulters":
        rows = _defaulter_rows(db, scoped_branch_id, search, min_days, max_days)
        headers = ["Student Name", "Course", "Batch", "Pending Amount", "Due Date", "Days Overdue", "Phone", "Email", "Follow-up Status"]
        values = [[
            row["student_name"],
            row["course"],
            row["batch"],
            row["pending_amount"],
            row["due_date"],
            row["days_overdue"],
            row["phone"],
            row["email"],
            row["follow_up_status"],
        ] for row in rows]
        if format.lower() == "pdf":
            return _simple_pdf("branch_fee_defaulters.pdf", "Defaulter Tracking", headers, values)
        csv = ",".join(headers) + "\n" + "\n".join(",".join(_csv_cell(value) for value in row) for row in values)
        return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_fee_defaulters.csv"})
    if type == "ledger":
        latest_payment_sub = (
            db.query(Payment.invoice_id, func.max(Payment.paid_at).label("last_payment_date"))
            .group_by(Payment.invoice_id)
            .subquery()
        )
        
        query = (
            db.query(Invoice, latest_payment_sub.c.last_payment_date)
            .outerjoin(latest_payment_sub, Invoice.id == latest_payment_sub.c.invoice_id)
            .join(User, Invoice.student_id == User.id)
        )
        
        if scoped_branch_id:
            query = query.filter(Invoice.branch_id == scoped_branch_id)
            
        if search:
            query = query.filter(User.full_name.ilike(f"%{search}%"))
            
        results = query.order_by(Invoice.created_at.desc()).all()
        
        today_val = date.today()
        csv_rows = ["Student Name,Course,Invoice No,Total Fee,Amount Paid,Pending Amount,Last Payment Date,Status"]
        
        for invoice, last_payment_date in results:
            pending_amount = max((invoice.amount or 0) - (invoice.paid_amount or 0), 0)
            inv_status = (invoice.status or "").lower()
            
            if inv_status == "paid" or pending_amount <= 0:
                status_label = "Paid"
            elif invoice.due_date and invoice.due_date < today_val:
                status_label = "Overdue"
            elif inv_status == "partial" or (invoice.paid_amount or 0) > 0:
                status_label = "Partial"
            else:
                status_label = "Pending"
                
            if status and status.lower() != "all":
                if status_label.lower() != status.lower():
                    continue
                    
            s_name = f"\"{invoice.student.full_name.replace('\"', '\"\"')}\"" if invoice.student else "\"Student\""
            c_val = invoice.course_name or (invoice.student.course_enrolled if invoice.student else "")
            c_name = f"\"{c_val.replace('\"', '\"\"')}\""
            inv_no = f"\"{invoice.invoice_number.replace('\"', '\"\"')}\""
            tot_fee = str(invoice.amount)
            amt_paid = str(invoice.paid_amount)
            pend_amt = str(pending_amount)
            last_pay_dt = last_payment_date.strftime("%Y-%m-%d") if last_payment_date else "-"
            stat = f"\"{status_label}\""
            
            csv_rows.append(f"{s_name},{c_name},{inv_no},{tot_fee},{amt_paid},{pend_amt},{last_pay_dt},{stat}")
            
        csv = "\n".join(csv_rows)
        return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=student_fee_ledger.csv"})
        
    if type == "receipts":
        rows = fee_receipts(scoped_branch_id, db, current_user)
        headers = ["Receipt No", "Student Name", "Invoice No", "Course", "Amount Paid", "Payment Mode", "Payment Date"]
        csv = ",".join(headers) + "\n" + "\n".join(",".join([
            _csv_cell(row["receipt_no"]),
            _csv_cell(row["student_name"]),
            _csv_cell(row["invoice_no"]),
            _csv_cell(row["course"]),
            _csv_cell(row["amount_paid"]),
            _csv_cell(row["payment_mode"]),
            _csv_cell(row["payment_date"]),
        ]) for row in rows)
        return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_fee_receipts.csv"})
    rows = fee_invoices(scoped_branch_id, db, current_user)
    csv = "Invoice,Student,Course,Amount,Paid,Pending,Status,Due Date,Branch\n" + "\n".join(",".join([_csv_cell(row["invoice_number"]), _csv_cell(row["student"]), _csv_cell(row["course"]), _csv_cell(row["amount"]), _csv_cell(row["paid_amount"]), _csv_cell(row["pending_amount"]), _csv_cell(row["status"]), _csv_cell(row["due_date"]), _csv_cell(row["branch_id"] or "")]) for row in rows)
    return Response(csv, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=branch_fees.csv"})


@router.get("/batches")
def batches(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return _batch_rows(db, scoped_branch_id)


@router.post("/batches")
def create_batch(payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    if not scoped_branch_id:
        raise HTTPException(status_code=422, detail="branch_id is required")
    batch_name = payload.get("batch_name") or payload.get("batch")
    if not batch_name:
        raise HTTPException(status_code=422, detail="Batch name is required")
    data = _save_batch_metadata(db, scoped_branch_id, batch_name, payload)
    db.commit()
    return {"branch_id": scoped_branch_id, "batch": data["batch_name"], "batch_name": data["batch_name"], "course": data["course"], "trainer": data["trainer"], "capacity": data["capacity"], "enrolled": 0, "schedule": data["schedule"], "mode": data["mode"]}


@router.put("/batches/{batch_name}")
def update_batch(batch_name: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    if not scoped_branch_id:
        raise HTTPException(status_code=422, detail="branch_id is required")
    batch = _scoped_batch_by_id(db, batch_name, scoped_branch_id)
    if batch:
        batch = _update_normalized_batch(db, batch, payload)
        db.commit()
        db.refresh(batch)
        return _normalized_batch_payload(db, batch)

    new_name = payload.get("batch_name") or payload.get("batch") or batch_name
    enrollment_ids_query = db.query(Enrollment.id).join(User, Enrollment.student_id == User.id).filter(Enrollment.batch_name == batch_name)
    if scoped_branch_id:
        enrollment_ids_query = enrollment_ids_query.filter(User.branch_id == scoped_branch_id)
    enrollment_ids = [row[0] for row in enrollment_ids_query.all()]
    count = 0
    if enrollment_ids:
        count = db.query(Enrollment).filter(Enrollment.id.in_(enrollment_ids)).update({Enrollment.batch_name: new_name}, synchronize_session=False)
        student_ids = [row[0] for row in db.query(Enrollment.student_id).filter(Enrollment.id.in_(enrollment_ids)).all()]
        if student_ids:
            db.query(User).filter(User.id.in_(student_ids), User.role == UserRole.STUDENT).update({User.batch_name: new_name}, synchronize_session=False)
    data = _save_batch_metadata(db, scoped_branch_id, batch_name, {**payload, "batch_name": new_name})
    db.commit()
    return {"branch_id": scoped_branch_id, "batch": data["batch_name"], "batch_name": data["batch_name"], "course": data["course"], "trainer": data["trainer"], "capacity": data["capacity"], "enrolled": count, "schedule": data["schedule"], "mode": data["mode"], "updated_enrollments": count}


@router.put("/batches/{batch_name}/assign-trainer")
def assign_trainer(batch_name: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    if not scoped_branch_id:
        raise HTTPException(status_code=422, detail="branch_id is required")
    batch = _scoped_batch_by_id(db, batch_name, scoped_branch_id)
    if batch:
        trainer = _assign_normalized_batch_trainer(db, batch, payload)
        db.commit()
        db.refresh(batch)
        return {"branch_id": scoped_branch_id, "batch_id": batch.id, "batch_name": batch.name, "trainer_id": trainer.id, "trainer": trainer.full_name, "batch": _normalized_batch_payload(db, batch)}

    course = db.query(Course).filter(Course.id == payload.get("course_id")).first()
    trainer = db.query(User).filter(User.id == payload.get("trainer_id"), User.branch_id == scoped_branch_id).first() if payload.get("trainer_id") else None
    employee = db.query(Employee).filter(Employee.id == payload.get("trainer_id"), Employee.branch_id == scoped_branch_id).first() if payload.get("trainer_id") else None
    trainer_name = payload.get("trainer") or (trainer.full_name if trainer else None) or (employee.full_name if employee else None) or "Unassigned"
    if course and trainer:
        course.trainer_id = trainer.id
    data = _save_batch_metadata(db, scoped_branch_id, batch_name, {**payload, "trainer": trainer_name})
    db.commit()
    return {"branch_id": scoped_branch_id, "batch_name": batch_name, "trainer": data["trainer"]}


@router.put("/batches/{batch_name}/transfer-student")
def transfer_batch_student(batch_name: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    batch = _scoped_batch_by_id(db, batch_name, scoped_branch_id)
    if batch:
        student, target_batch = _transfer_normalized_batch_student(db, batch, payload)
        db.commit()
        db.refresh(student)
        return {**_student_payload(db, student), "source_batch_id": batch.id, "target_batch_id": target_batch.id, "target_batch": target_batch.name}

    student_id = payload.get("student_id")
    target_batch = payload.get("target_batch") or payload.get("batch_name")
    if not student_id or not target_batch:
        raise HTTPException(status_code=422, detail="student_id and target_batch are required")
    student = _student_query(db, scoped_branch_id).filter(User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id, Enrollment.batch_name == batch_name).first()
    if not enrollment:
        enrollment = db.query(Enrollment).filter(Enrollment.student_id == student.id).order_by(Enrollment.enrolled_at.desc()).first()
    if enrollment:
        enrollment.batch_name = target_batch
    student.batch_name = target_batch
    db.commit()
    db.refresh(student)
    return _student_payload(db, student)


@router.post("/batches/{batch_id}/transfer-student")
def transfer_batch_student_by_id(batch_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    source_batch = _scoped_batch_by_id(db, batch_id, scoped_branch_id)
    if not source_batch:
        raise HTTPException(status_code=404, detail="Source batch not found")
    student, target_batch = _transfer_normalized_batch_student(db, source_batch, payload)
    db.commit()
    db.refresh(student)
    return {**_student_payload(db, student), "source_batch_id": source_batch.id, "target_batch_id": target_batch.id, "target_batch": target_batch.name}


@router.get("/batches/{batch_identifier}/students")
def batch_students(batch_identifier: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    batch = _scoped_batch_by_id(db, batch_identifier, scoped_branch_id)
    if batch:
        return _normalized_batch_students(db, batch)

    query = _student_query(db, scoped_branch_id).filter(User.batch_name == batch_identifier)
    enrollment_students = db.query(User).join(Enrollment, Enrollment.student_id == User.id).filter(Enrollment.batch_name == batch_identifier, User.role == UserRole.STUDENT)
    if scoped_branch_id:
        enrollment_students = enrollment_students.filter(User.branch_id == scoped_branch_id)
    seen = {}
    for student in query.all() + enrollment_students.all():
        seen[student.id] = _student_payload(db, student)
    return list(seen.values())


@router.get("/batches/timetable")
def batch_timetable(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return [{"branch_id": scoped_branch_id, "batch": row["batch"], "course": row["course"], "trainer": row["trainer"], "schedule": row["schedule"]} for row in _batch_rows(db, scoped_branch_id)]


@router.get("/batches/{batch_id}")
def batch_detail(batch_id: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    batch = _scoped_batch_by_id(db, batch_id, scoped_branch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return _normalized_batch_payload(db, batch)


@router.get("/lms/overview")
def lms_overview(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    student_ids = _branch_student_ids(db, scoped_branch_id)
    enrollments = db.query(Enrollment).filter(Enrollment.student_id.in_(student_ids)) if student_ids else db.query(Enrollment).filter(False)
    course_ids = [row[0] for row in enrollments.with_entities(Enrollment.course_id).distinct().all()]
    return {"branch_id": scoped_branch_id, "courses": len(course_ids), "enrollments": enrollments.count(), "lessons": db.query(Lesson).filter(Lesson.course_id.in_(course_ids)).count() if course_ids else 0, "completed_lessons": db.query(LessonProgress).filter(LessonProgress.student_id.in_(student_ids), LessonProgress.is_completed == True).count() if student_ids else 0}  # noqa: E712


@router.get("/lms/courses")
def lms_courses(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    student_ids = _branch_student_ids(db, scoped_branch_id)
    course_ids = [row[0] for row in db.query(Enrollment.course_id).filter(Enrollment.student_id.in_(student_ids)).distinct().all()] if student_ids else []
    return [{"id": course.id, "title": course.title, "status": course.status, "trainer": course.trainer.full_name if course.trainer else "Unassigned"} for course in db.query(Course).filter(Course.id.in_(course_ids)).all()]


@router.get("/lms/lessons")
def lms_lessons(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    courses_payload = lms_courses(branch_id, db, current_user)
    course_ids = [course["id"] for course in courses_payload]
    return [{"id": lesson.id, "course_id": lesson.course_id, "course": lesson.course.title if lesson.course else "", "title": lesson.title, "content_type": lesson.content_type} for lesson in db.query(Lesson).filter(Lesson.course_id.in_(course_ids)).all()]


@router.get("/lms/progress")
def lms_progress(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return [{"student": enrollment.student.full_name if enrollment.student else "", "course": enrollment.course.title if enrollment.course else "", "batch_name": enrollment.batch_name, "progress_percent": enrollment.progress_percent} for enrollment in db.query(Enrollment).join(User, Enrollment.student_id == User.id).filter(User.branch_id == scoped_branch_id if scoped_branch_id else True).all()]


def _report_payload(report_type: str, branch_id: str | None, db: Session):
    if report_type == "admissions":
        return admissions(branch_id=branch_id, db=db, current_user=User(role=UserRole.SUPER_ADMIN, full_name="system", email="system@local", hashed_password="x"))
    if report_type == "students":
        return students(branch_id=branch_id, db=db, current_user=User(role=UserRole.SUPER_ADMIN, full_name="system", email="system@local", hashed_password="x"))
    if report_type == "attendance":
        return _attendance_dashboard(db, branch_id)
    if report_type == "fees":
        return fee_invoices(branch_id=branch_id, db=db, current_user=User(role=UserRole.SUPER_ADMIN, full_name="system", email="system@local", hashed_password="x"))
    if report_type == "batches":
        return _batch_rows(db, branch_id)
    raise HTTPException(status_code=404, detail="Report type not found")


@router.get("/reports/{report_type}")
def reports(report_type: str, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    return {"branch_id": scoped_branch_id, "type": report_type, "rows": _report_payload(report_type, scoped_branch_id, db)}


@router.get("/reports/export")
def reports_export(type: str = "students", branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    rows = _report_payload(type, scoped_branch_id, db)
    return {"branch_id": scoped_branch_id, "type": type, "rows": rows}


@router.get("/settings")
def branch_settings(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id)
    settings = db.query(SystemSetting).filter(SystemSetting.category == f"branch:{scoped_branch_id}").all() if scoped_branch_id else []
    return {
        "branch_id": scoped_branch_id,
        "branch_name": _branch_name(branch, scoped_branch_id),
        "branch": {
            "id": branch.id if branch else scoped_branch_id,
            "name": branch.name if branch else "",
            "code": branch.code if branch else "",
            "city": branch.city if branch else "",
            "address": branch.address if branch else "",
            "manager_name": branch.manager_name if branch else "",
            "phone": branch.phone if branch else "",
            "capacity": branch.capacity if branch else 0,
            "status": branch.status if branch else "",
        },
        "preferences": {setting.key: setting.value for setting in settings},
    }


@router.get("/settings/users")
def branch_settings_users(branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id)
    query = db.query(User)
    if scoped_branch_id:
        query = query.filter(User.branch_id == scoped_branch_id)
    allowed = [UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR, UserRole.TRAINER, UserRole.FINANCE, UserRole.STUDENT]
    users = query.filter(User.role.in_(allowed)).order_by(User.role.asc(), User.full_name.asc()).all()
    employees = db.query(Employee)
    if scoped_branch_id:
        employees = employees.filter(Employee.branch_id == scoped_branch_id)
    employee_rows = [
        {
            "id": employee.id,
            "full_name": employee.full_name,
            "email": employee.email,
            "phone": employee.phone,
            "role": employee.role.lower().replace(" ", "_"),
            "role_label": employee.role,
            "is_active": employee.status.lower() == "active",
            "status": employee.status,
            "source": "hr_employees",
            "branch_id": employee.branch_id,
        }
        for employee in employees.filter(Employee.role.ilike("%trainer%")).all()
    ]
    user_rows = [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role.value if hasattr(user.role, "value") else str(user.role),
            "role_label": (user.role.value if hasattr(user.role, "value") else str(user.role)).replace("_", " ").title(),
            "is_active": user.is_active,
            "status": "Active" if user.is_active else "Inactive",
            "source": "users",
            "branch_id": user.branch_id,
        }
        for user in users
    ]
    return user_rows + employee_rows


@router.put("/settings/users/{user_id}/status")
def update_branch_user_status(user_id: str, payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, _ = _scope(db, current_user, branch_id or payload.get("branch_id"))
    is_active = bool(payload.get("is_active"))
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if scoped_branch_id and user.branch_id != scoped_branch_id:
            raise HTTPException(status_code=403, detail="Cannot update another branch user")
        user.is_active = is_active
        db.commit()
        return {"id": user.id, "is_active": user.is_active, "status": "Active" if user.is_active else "Inactive"}
    employee = db.query(Employee).filter(Employee.id == user_id).first()
    if employee:
        if scoped_branch_id and employee.branch_id != scoped_branch_id:
            raise HTTPException(status_code=403, detail="Cannot update another branch user")
        employee.status = "Active" if is_active else "Inactive"
        db.commit()
        return {"id": employee.id, "is_active": is_active, "status": employee.status}
    raise HTTPException(status_code=404, detail="User not found")


@router.put("/settings")
def update_branch_settings(payload: dict, branch_id: str | None = None, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN))):
    scoped_branch_id, branch = _scope(db, current_user, branch_id or payload.get("branch_id"))
    if branch and "branch" in payload:
        for field in ["name", "city", "address", "manager_name", "phone", "capacity", "status"]:
            if field in payload["branch"]:
                setattr(branch, field, payload["branch"][field])
    for key, value in (payload.get("preferences") or {}).items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key, SystemSetting.category == f"branch:{scoped_branch_id}").first()
        if not setting:
            setting = SystemSetting(id=str(uuid.uuid4()), key=key, label=key.replace("_", " ").title(), category=f"branch:{scoped_branch_id}", value=str(value))
            db.add(setting)
        else:
            setting.value = str(value)
    db.commit()
    return branch_settings(scoped_branch_id, db, current_user)
