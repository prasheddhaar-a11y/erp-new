"""
PINESPHERE ERP
Module      : Fees Module
File        : finance.py
Purpose     : Defines Finance API endpoints and request handling
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

from datetime import date, datetime, time

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.finance import Invoice, Payment
from app.models.user import User
from app.services.shared.history import add_history
from app.schemas.finance import (
    FinanceSummaryResponse,
    InvoiceCreate,
    InvoiceResponse,
    PaymentCreate,
    PaymentResponse,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _parent_student_ids(db: Session, current_user: User) -> list[str]:
    if not current_user.phone:
        return []
    return [
        student_id
        for (student_id,) in db.query(User.id).filter(
            User.role == UserRole.STUDENT,
            User.parent_phone == current_user.phone,
        ).all()
    ]


def _scope_invoices(query, db: Session, current_user: User):
    if current_user.role == UserRole.STUDENT:
        return query.filter(Invoice.student_id == current_user.id)
    if current_user.role == UserRole.PARENT:
        return query.filter(Invoice.student_id.in_(_parent_student_ids(db, current_user)))
    if current_user.role != UserRole.SUPER_ADMIN:
        return query.filter(Invoice.branch_id == current_user.branch_id)
    return query


def update_invoice_status(invoice: Invoice):
    paid_amount = invoice.paid_amount or 0

    if paid_amount >= invoice.amount:
        invoice.status = "paid"
    elif paid_amount > 0:
        invoice.status = "partial"
    elif invoice.due_date < date.today():
        invoice.status = "overdue"
    else:
        invoice.status = "unpaid"


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.FINANCE,
            UserRole.STUDENT,
            UserRole.PARENT,
        )
    ),
):
    query = db.query(Invoice).order_by(Invoice.created_at.desc())

    query = _scope_invoices(query, db, current_user)

    invoices = query.limit(500).all()

    for invoice in invoices:
        update_invoice_status(invoice)

    db.commit()
    return invoices


@router.delete("/invoices/{invoice_id}")
def delete_invoice(
    invoice_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE)),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role != UserRole.SUPER_ADMIN and invoice.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this invoice")

    add_history(
        db,
        module="finance",
        action="deleted",
        title=f"Invoice deleted: {invoice.invoice_number}",
        details=f"Student ID: {invoice.student_id} | Amount: Rs {invoice.amount:.0f} | Paid: Rs {(invoice.paid_amount or 0):.0f}",
        record_id=invoice.id,
        created_by_id=current_user.id,
        branch_id=invoice.branch_id,
    )
    db.delete(invoice)
    db.commit()
    return {"message": "Invoice deleted successfully", "id": invoice_id}


@router.post("/invoices", response_model=InvoiceResponse)
def create_invoice(
    body: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.FINANCE,

        )
    ),
):
    student = (
        db.query(User)
        .filter(User.id == body.student_id, User.role == UserRole.STUDENT)
        .first()
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    invoice = Invoice(**body.dict())
    invoice.branch_id = student.branch_id

    if current_user.role != UserRole.SUPER_ADMIN and student.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to create invoice for this student")

    update_invoice_status(invoice)

    db.add(invoice)

    try:
        db.flush()
        add_history(
            db,
            module="finance",
            action="created",
            title=f"Invoice created: {invoice.invoice_number}",
            details=f"Student ID: {invoice.student_id} | Course: {invoice.course_name or '-'} | Amount: Rs {invoice.amount:.0f} | Due: {invoice.due_date}",
            record_id=invoice.id,
            created_by_id=current_user.id,
            branch_id=invoice.branch_id,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Invoice number already exists") from exc

    db.refresh(invoice)
    return invoice


@router.post("/payments", response_model=PaymentResponse)
def record_payment(
    body: PaymentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.FINANCE,
        )
    ),
):
    invoice = db.query(Invoice).filter(Invoice.id == body.invoice_id).first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if current_user.role != UserRole.SUPER_ADMIN and invoice.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to record payment for this invoice")

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero")

    payment = Payment(
        invoice_id=invoice.id,
        student_id=invoice.student_id,
        amount=body.amount,
        payment_method=body.payment_method,
        reference_number=body.reference_number,
        notes=body.notes,
    )

    invoice.paid_amount = (invoice.paid_amount or 0) + body.amount
    update_invoice_status(invoice)

    db.add(payment)
    db.flush()
    add_history(
        db,
        module="finance",
        action="paid",
        title=f"Payment recorded: Rs {payment.amount:.0f}",
        details=f"Invoice ID: {invoice.id} | Student ID: {invoice.student_id} | Method: {payment.payment_method} | Invoice status: {invoice.status}",
        record_id=payment.id,
        created_by_id=current_user.id,
        branch_id=invoice.branch_id,
    )
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments", response_model=list[PaymentResponse])
def list_payments(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.FINANCE,
            UserRole.STUDENT,
            UserRole.PARENT,
        )
    ),
):
    query = (
        db.query(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .order_by(Payment.paid_at.desc())
    )

    if current_user.role == UserRole.STUDENT:
        query = query.filter(Invoice.student_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        query = query.filter(Invoice.student_id.in_(_parent_student_ids(db, current_user)))
    elif current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Invoice.branch_id == current_user.branch_id)

    return query.limit(500).all()


@router.get("/defaulters", response_model=list[InvoiceResponse])
def fee_defaulters(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.FINANCE,
            UserRole.STUDENT,
            UserRole.PARENT,
        )
    ),
):
    query = db.query(Invoice).filter(
        Invoice.due_date < date.today(),
        Invoice.status != "paid",
    )

    query = _scope_invoices(query, db, current_user)

    invoices = query.order_by(Invoice.due_date.asc()).limit(500).all()

    for invoice in invoices:
        update_invoice_status(invoice)

    db.commit()
    return invoices


@router.post("/send-reminders")
def send_fee_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE)),
):
    query = db.query(Invoice).filter(Invoice.status != "paid")
    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Invoice.branch_id == current_user.branch_id)

    invoices = query.order_by(Invoice.due_date.asc()).all()
    reminders = []
    for invoice in invoices:
        update_invoice_status(invoice)
        if invoice.status == "paid":
            continue
        student = db.query(User).filter(User.id == invoice.student_id).first()
        if not student:
            continue
        balance = max(invoice.amount - (invoice.paid_amount or 0), 0)
        message = (
            f"Dear {student.full_name}, this is a fee reminder for invoice "
            f"{invoice.invoice_number}. Pending amount: Rs {balance:.0f}. "
            f"Due date: {invoice.due_date}."
        )
        reminders.append({
            "invoice_id": invoice.id,
            "invoice_number": invoice.invoice_number,
            "email": student.email,
            "student_name": student.full_name,
            "pending_amount": balance,
            "message": message,
            "status": "queued",
        })
        add_history(
            db,
            module="finance",
            action="reminder_email_queued",
            title=f"Reminder queued: {invoice.invoice_number}",
            details=f"Email: {student.email} | Pending: Rs {balance:.0f} | Due: {invoice.due_date}",
            record_id=invoice.id,
            created_by_id=current_user.id,
            branch_id=invoice.branch_id,
        )

    db.commit()
    return {"message": f"{len(reminders)} fee reminder email(s) queued.", "reminders": reminders}


@router.get("/summary", response_model=FinanceSummaryResponse)
def finance_summary(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE, UserRole.STUDENT, UserRole.PARENT)),
):
    invoice_query = db.query(Invoice)

    invoice_query = _scope_invoices(invoice_query, db, current_user)

    invoices = invoice_query.all()

    for invoice in invoices:
        update_invoice_status(invoice)

    db.commit()

    month_start = datetime.combine(date.today().replace(day=1), time.min)

    payment_query = db.query(func.coalesce(func.sum(Payment.amount), 0))

    if current_user.role == UserRole.STUDENT:
        payment_query = (
            payment_query
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .filter(Invoice.student_id == current_user.id)
        )
    elif current_user.role == UserRole.PARENT:
        payment_query = (
            payment_query
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .filter(Invoice.student_id.in_(_parent_student_ids(db, current_user)))
        )
    elif current_user.role != UserRole.SUPER_ADMIN:
        payment_query = (
            payment_query
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .filter(Invoice.branch_id == current_user.branch_id)
        )

    revenue_this_month = payment_query.filter(Payment.paid_at >= month_start).scalar() or 0

    total_invoice_amount = sum(invoice.amount for invoice in invoices)
    total_collected = sum(invoice.paid_amount or 0 for invoice in invoices)
    total_pending = max(total_invoice_amount - total_collected, 0)

    fee_defaulters_count = len(
        [
            invoice
            for invoice in invoices
            if invoice.due_date < date.today() and invoice.status != "paid"
        ]
    )

    paid_invoices = len([invoice for invoice in invoices if invoice.status == "paid"])
    unpaid_invoices = len([invoice for invoice in invoices if invoice.status != "paid"])

    return FinanceSummaryResponse(
        revenue_this_month=float(revenue_this_month),
        total_invoice_amount=float(total_invoice_amount),
        total_collected=float(total_collected),
        total_pending=float(total_pending),
        fee_defaulters_count=fee_defaulters_count,
        unpaid_invoices=unpaid_invoices,
        paid_invoices=paid_invoices,
    )
