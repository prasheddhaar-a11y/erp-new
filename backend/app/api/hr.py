"""
PINESPHERE ERP
Module      : HR Module
File        : hr.py
Purpose     : Defines Hr API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/api/hr.py
# PURPOSE: FastAPI routes for the HR module.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import date, datetime, timedelta
from decimal import Decimal

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.branch import Branch
from app.models.hr import (
    Employee,
    EmployeeDocument,
    LeaveRequest,
    Payroll,
    PerformanceReview,
    StaffAttendance,
    StaffTask,
    TrainerWorkload,
)
from app.models.user import User
from app.schemas.hr import (
    EmployeeCreate,
    EmployeeDocumentCreate,
    EmployeeDocumentResponse,
    EmployeeDocumentVerify,
    EmployeeResponse,
    EmployeeUpdate,
    HRInsight,
    LeaveDecision,
    LeaveRequestCreate,
    LeaveRequestResponse,
    PayrollGenerate,
    PayrollResponse,
    PerformanceReviewCreate,
    PerformanceReviewResponse,
    StaffAttendanceMark,
    StaffAttendanceResponse,
    StaffAttendanceUpdate,
    StaffTaskCreate,
    StaffTaskResponse,
    StaffTaskUpdate,
    TrainerWorkloadResponse,
    TrainerWorkloadUpdate,
)

router = APIRouter(prefix="/hr", tags=["HR"])

# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

STAFF_ROLES = {UserRole.SUPER_ADMIN, UserRole.HR, UserRole.BRANCH_ADMIN}
STAFF_WRITE_ROLES = {UserRole.SUPER_ADMIN, UserRole.HR, UserRole.BRANCH_ADMIN}
HR_ROLES = {UserRole.SUPER_ADMIN, UserRole.HR}
HR_WRITE_ROLES = {UserRole.SUPER_ADMIN, UserRole.HR}
REQUIRED_DOCUMENTS = {"Aadhaar", "PAN", "Degree Certificate", "Resume", "Experience Letter"}
WORKLOAD_STATUS_ALIASES = {
    "high": "Overloaded",
    "heavy": "Overloaded",
    "overload": "Overloaded",
    "overloaded": "Overloaded",
    "low": "Underloaded",
    "light": "Underloaded",
    "underload": "Underloaded",
    "underloaded": "Underloaded",
    "balanced": "Balanced",
}


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _require_hr_user(current_user):
    if current_user.role not in HR_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user


def _require_hr_write(current_user):
    if current_user.role not in HR_WRITE_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user


def _require_staff_user(current_user):
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user


def _require_staff_write(current_user):
    if current_user.role not in STAFF_WRITE_ROLES:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return current_user


def _is_branch_limited(current_user) -> bool:
    return current_user.role == UserRole.BRANCH_ADMIN


def _scoped_employees(db: Session, current_user):
    query = db.query(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == current_user.branch_id)
    return query


def _sync_auth_staff_to_hr(db: Session) -> None:
    existing_emails = {email for (email,) in db.query(Employee.email).all()}
    branch_ids = {branch_id for (branch_id,) in db.query(Branch.id).all()}
    staff_users = (
        db.query(User)
        .filter(User.role.notin_([UserRole.STUDENT, UserRole.PARENT]))
        .order_by(User.full_name.asc())
        .all()
    )
    created = 0
    for index, user in enumerate(staff_users, start=1):
        if user.email in existing_emails:
            continue
        employee = Employee(
            employee_id=f"EMP-{str(index).zfill(4)}-{user.id[:6]}",
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=user.role.value if hasattr(user.role, "value") else str(user.role),
            department="Operations",
            branch_id=user.branch_id if user.branch_id in branch_ids else None,
            salary=Decimal("0"),
            status="Active" if user.is_active else "Inactive",
            documents_status="Pending",
        )
        db.add(employee)
        created += 1
    if created:
        db.commit()


def _get_employee(db: Session, employee_id: str, current_user) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    if _is_branch_limited(current_user) and employee.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Employee is outside your branch")
    return employee


def _branch_map(db: Session) -> dict[str, str]:
    return {branch.id: branch.name for branch in db.query(Branch).all()}


def _latest_attendance_map(db: Session) -> dict[str, str]:
    rows = (
        db.query(StaffAttendance)
        .order_by(StaffAttendance.attendance_date.desc(), StaffAttendance.created_at.desc())
        .all()
    )
    latest: dict[str, str] = {}
    for row in rows:
        if row.employee_id not in latest:
            latest[row.employee_id] = row.status
    return latest


def _normalize_workload_status(status: str | None) -> str:
    if not status:
        return "Balanced"
    return WORKLOAD_STATUS_ALIASES.get(status.strip().lower(), "Balanced")


def _employee_response(employee: Employee, branches: dict[str, str], attendance: dict[str, str]) -> EmployeeResponse:
    return EmployeeResponse(
        id=employee.id,
        employee_id=employee.employee_id,
        full_name=employee.full_name,
        email=employee.email,
        phone=employee.phone,
        role=employee.role,
        department=employee.department,
        branch_id=employee.branch_id,
        branch_name=branches.get(employee.branch_id or ""),
        reporting_manager=employee.reporting_manager,
        joining_date=employee.joining_date,
        salary=employee.salary or Decimal("0"),
        status=employee.status,
        emergency_contact=employee.emergency_contact,
        bank_account=employee.bank_account,
        documents_status=employee.documents_status,
        attendance_status=attendance.get(employee.id),
        created_at=employee.created_at,
        updated_at=employee.updated_at,
    )


def _attendance_response(row: StaffAttendance, branches: dict[str, str]) -> StaffAttendanceResponse:
    return StaffAttendanceResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=row.employee.full_name if row.employee else None,
        branch_id=row.branch_id,
        branch_name=branches.get(row.branch_id or ""),
        attendance_date=row.attendance_date,
        check_in=row.check_in,
        check_out=row.check_out,
        status=row.status,
        mode=row.mode,
        remarks=row.remarks,
        created_at=row.created_at,
    )


def _leave_response(row: LeaveRequest, leave_balance: Decimal = Decimal("12")) -> LeaveRequestResponse:
    return LeaveRequestResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=row.employee.full_name if row.employee else None,
        branch_id=row.employee.branch_id if row.employee else None,
        leave_type=row.leave_type,
        start_date=row.start_date,
        end_date=row.end_date,
        total_days=row.total_days,
        reason=row.reason,
        status=row.status,
        approved_by=row.approved_by,
        remarks=row.remarks,
        leave_balance=leave_balance,
        created_at=row.created_at,
    )


def _payroll_response(row: Payroll) -> PayrollResponse:
    return PayrollResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=row.employee.full_name if row.employee else None,
        branch_id=row.employee.branch_id if row.employee else None,
        month=row.month,
        year=row.year,
        base_salary=row.base_salary,
        allowances=row.allowances,
        deductions=row.deductions,
        leave_deduction=row.leave_deduction,
        pf=row.pf,
        tds=row.tds,
        net_salary=row.net_salary,
        status=row.status,
        approved_by_hr=row.approved_by_hr,
        approved_by_finance=row.approved_by_finance,
        approved_by_super_admin=row.approved_by_super_admin,
        created_at=row.created_at,
    )


def _workload_response(row: TrainerWorkload, branches: dict[str, str]) -> TrainerWorkloadResponse:
    return TrainerWorkloadResponse(
        id=row.id,
        trainer_id=row.trainer_id,
        trainer_name=row.trainer.full_name if row.trainer else None,
        branch_id=row.branch_id,
        branch_name=branches.get(row.branch_id or ""),
        total_batches=row.total_batches,
        total_students=row.total_students,
        weekly_classes=row.weekly_classes,
        pending_assignments=row.pending_assignments,
        workload_status=_normalize_workload_status(row.workload_status),
        updated_at=row.updated_at,
    )


def _performance_response(row: PerformanceReview) -> PerformanceReviewResponse:
    return PerformanceReviewResponse(
        id=row.id,
        employee_id=row.employee_id,
        employee_name=row.employee.full_name if row.employee else None,
        branch_id=row.employee.branch_id if row.employee else None,
        review_period=row.review_period,
        attendance_score=row.attendance_score,
        productivity_score=row.productivity_score,
        student_feedback_score=row.student_feedback_score,
        session_completion_score=row.session_completion_score,
        manager_rating=row.manager_rating,
        ai_score=row.ai_score,
        strengths=row.strengths,
        improvements=row.improvements,
        status=row.status,
        created_at=row.created_at,
    )


def _task_response(row: StaffTask) -> StaffTaskResponse:
    return StaffTaskResponse(
        id=row.id,
        title=row.title,
        description=row.description,
        assigned_to=row.assigned_to,
        assigned_to_name=row.employee.full_name if row.employee else None,
        assigned_by=row.assigned_by,
        priority=row.priority,
        due_date=row.due_date,
        status=row.status,
        completed_at=row.completed_at,
        created_at=row.created_at,
    )


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/employees", response_model=list[EmployeeResponse])
def list_employees(
    role: str | None = Query(default=None),
    branch_id: str | None = Query(default=None),
    status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_user = _require_staff_user(current_user)
    _sync_auth_staff_to_hr(db)
    query = _scoped_employees(db, current_user)
    if role:
        query = query.filter(Employee.role == role)
    if branch_id and not _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == branch_id)
    if status:
        query = query.filter(Employee.status == status)
    if search:
        term = f"%{search.strip().lower()}%"
        query = query.filter(func.lower(Employee.full_name).like(term) | func.lower(Employee.email).like(term))
    branches = _branch_map(db)
    attendance = _latest_attendance_map(db)
    return [_employee_response(row, branches, attendance) for row in query.order_by(Employee.full_name.asc()).limit(500).all()]


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_user(current_user)
    employee = _get_employee(db, employee_id, current_user)
    return _employee_response(employee, _branch_map(db), _latest_attendance_map(db))


@router.post("/employees", response_model=EmployeeResponse)
def create_employee(body: EmployeeCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    payload = body.dict()
    payload["email"] = payload["email"].lower()
    if _is_branch_limited(current_user):
        if not current_user.branch_id:
            raise HTTPException(status_code=403, detail="Branch Admin does not have an assigned branch")
        payload["branch_id"] = current_user.branch_id
    employee = Employee(**payload)
    db.add(employee)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee ID or email already exists") from exc
    db.refresh(employee)
    return _employee_response(employee, _branch_map(db), _latest_attendance_map(db))


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: str, body: EmployeeUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    employee = _get_employee(db, employee_id, current_user)
    data = body.dict(exclude_unset=True)
    if "email" in data and data["email"]:
        data["email"] = data["email"].lower()
    if _is_branch_limited(current_user):
        data["branch_id"] = current_user.branch_id
    for key, value in data.items():
        setattr(employee, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee ID or email already exists") from exc
    db.refresh(employee)
    return _employee_response(employee, _branch_map(db), _latest_attendance_map(db))


@router.delete("/employees/{employee_id}")
def delete_employee(employee_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    employee = _get_employee(db, employee_id, current_user)
    for model, column in [
        (EmployeeDocument, EmployeeDocument.employee_id),
        (StaffAttendance, StaffAttendance.employee_id),
        (LeaveRequest, LeaveRequest.employee_id),
        (Payroll, Payroll.employee_id),
        (TrainerWorkload, TrainerWorkload.trainer_id),
        (PerformanceReview, PerformanceReview.employee_id),
        (StaffTask, StaffTask.assigned_to),
    ]:
        db.query(model).filter(column == employee.id).delete(synchronize_session=False)
    db.delete(employee)
    db.commit()
    return {"message": "Employee deleted"}


@router.get("/employees/{employee_id}/documents", response_model=list[EmployeeDocumentResponse])
def list_documents(employee_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_user(current_user)
    employee = _get_employee(db, employee_id, current_user)
    rows = db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee.id).order_by(EmployeeDocument.uploaded_at.desc()).all()
    return [
        EmployeeDocumentResponse(
            id=row.id,
            employee_id=row.employee_id,
            employee_name=employee.full_name,
            document_type=row.document_type,
            file_url=row.file_url,
            verification_status=row.verification_status,
            remarks=row.remarks,
            uploaded_at=row.uploaded_at,
        )
        for row in rows
    ]


@router.post("/employees/{employee_id}/documents", response_model=EmployeeDocumentResponse)
def create_document(employee_id: str, body: EmployeeDocumentCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    employee = _get_employee(db, employee_id, current_user)
    document = EmployeeDocument(employee_id=employee.id, **body.dict())
    db.add(document)
    db.commit()
    db.refresh(document)
    return EmployeeDocumentResponse(employee_name=employee.full_name, **document.__dict__)


@router.patch("/documents/{document_id}/verify", response_model=EmployeeDocumentResponse)
def verify_document(document_id: str, body: EmployeeDocumentVerify, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    document = db.query(EmployeeDocument).filter(EmployeeDocument.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    employee = _get_employee(db, document.employee_id, current_user)
    document.verification_status = body.verification_status
    document.remarks = body.remarks
    db.commit()
    db.refresh(document)
    statuses = {row.verification_status for row in db.query(EmployeeDocument).filter(EmployeeDocument.employee_id == employee.id).all()}
    employee.documents_status = "Rejected" if "Rejected" in statuses else "Verified" if statuses == {"Verified"} and statuses else "Pending"
    db.commit()
    return EmployeeDocumentResponse(employee_name=employee.full_name, **document.__dict__)


@router.get("/attendance", response_model=list[StaffAttendanceResponse])
def list_attendance(
    attendance_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_user = _require_staff_user(current_user)
    query = db.query(StaffAttendance).join(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(StaffAttendance.branch_id == current_user.branch_id)
    if attendance_date:
        query = query.filter(StaffAttendance.attendance_date == attendance_date)
    branches = _branch_map(db)
    return [_attendance_response(row, branches) for row in query.order_by(StaffAttendance.attendance_date.desc()).limit(500).all()]


@router.post("/attendance/mark", response_model=StaffAttendanceResponse)
def mark_attendance(body: StaffAttendanceMark, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    employee = _get_employee(db, body.employee_id, current_user)
    branch_id = employee.branch_id if _is_branch_limited(current_user) else body.branch_id or employee.branch_id
    record = (
        db.query(StaffAttendance)
        .filter(StaffAttendance.employee_id == employee.id, StaffAttendance.attendance_date == body.attendance_date)
        .first()
    )
    if not record:
        record = StaffAttendance(employee_id=employee.id, attendance_date=body.attendance_date)
        db.add(record)
    record.branch_id = branch_id
    record.check_in = body.check_in
    record.check_out = body.check_out
    record.status = body.status
    record.mode = body.mode
    record.remarks = body.remarks
    db.commit()
    db.refresh(record)
    return _attendance_response(record, _branch_map(db))


@router.patch("/attendance/{attendance_id}", response_model=StaffAttendanceResponse)
def update_attendance(attendance_id: str, body: StaffAttendanceUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    record = db.query(StaffAttendance).filter(StaffAttendance.id == attendance_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    _get_employee(db, record.employee_id, current_user)
    for key, value in body.dict(exclude_unset=True).items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return _attendance_response(record, _branch_map(db))


@router.get("/leaves", response_model=list[LeaveRequestResponse])
def list_leaves(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_user(current_user)
    query = db.query(LeaveRequest).join(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == current_user.branch_id)
    rows = query.order_by(LeaveRequest.created_at.desc()).limit(500).all()
    approved_rows = (
        db.query(LeaveRequest.employee_id, func.coalesce(func.sum(LeaveRequest.total_days), 0))
        .filter(LeaveRequest.status == "Approved", LeaveRequest.employee_id.in_([row.employee_id for row in rows] or [""]))
        .group_by(LeaveRequest.employee_id)
        .all()
    )
    used_days = {employee_id: Decimal(str(days)) for employee_id, days in approved_rows}
    return [_leave_response(row, max(Decimal("0"), Decimal("12") - used_days.get(row.employee_id, Decimal("0")))) for row in rows]


@router.post("/leaves", response_model=LeaveRequestResponse)
def create_leave(body: LeaveRequestCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_write(current_user)
    _get_employee(db, body.employee_id, current_user)
    if body.end_date < body.start_date:
        raise HTTPException(status_code=400, detail="End date cannot be before start date")
    row = LeaveRequest(**body.dict(), status="Pending")
    db.add(row)
    db.commit()
    db.refresh(row)
    return _leave_response(row)


@router.patch("/leaves/{leave_id}/approve", response_model=LeaveRequestResponse)
def approve_leave(leave_id: str, body: LeaveDecision, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_write(current_user)
    row = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Leave request not found")
    _get_employee(db, row.employee_id, current_user)
    row.status = "Approved"
    row.approved_by = current_user.id
    row.remarks = body.remarks
    db.commit()
    db.refresh(row)
    return _leave_response(row)


@router.patch("/leaves/{leave_id}/reject", response_model=LeaveRequestResponse)
def reject_leave(leave_id: str, body: LeaveDecision, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_write(current_user)
    row = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Leave request not found")
    _get_employee(db, row.employee_id, current_user)
    row.status = "Rejected"
    row.approved_by = current_user.id
    row.remarks = body.remarks
    db.commit()
    db.refresh(row)
    return _leave_response(row)


@router.get("/payroll", response_model=list[PayrollResponse])
def list_payroll(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_user(current_user)
    query = db.query(Payroll).join(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == current_user.branch_id)
    return [_payroll_response(row) for row in query.order_by(Payroll.year.desc(), Payroll.month.desc()).limit(500).all()]


@router.post("/payroll/generate", response_model=list[PayrollResponse])
def generate_payroll(body: PayrollGenerate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_write(current_user)
    employee_query = _scoped_employees(db, current_user).filter(Employee.status == "Active")
    if body.employee_ids:
        employee_query = employee_query.filter(Employee.id.in_(body.employee_ids))
    employees = employee_query.order_by(Employee.full_name.asc()).all()
    rows: list[Payroll] = []
    for employee in employees:
        existing = db.query(Payroll).filter(Payroll.employee_id == employee.id, Payroll.month == body.month, Payroll.year == body.year).first()
        row = existing or Payroll(employee_id=employee.id, month=body.month, year=body.year)
        row.base_salary = employee.salary or Decimal("0")
        row.allowances = body.allowances
        row.deductions = body.deductions
        row.leave_deduction = body.leave_deduction
        row.pf = body.pf
        row.tds = body.tds
        row.net_salary = row.base_salary + row.allowances - row.deductions - row.leave_deduction - row.pf - row.tds
        row.status = "Draft"
        if not existing:
            db.add(row)
        rows.append(row)
    db.commit()
    return [_payroll_response(row) for row in rows]


@router.patch("/payroll/{payroll_id}/approve", response_model=PayrollResponse)
def approve_payroll(payroll_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.HR, UserRole.FINANCE}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    row = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    if _is_branch_limited(current_user):
        _get_employee(db, row.employee_id, current_user)
    if current_user.role == UserRole.HR:
        row.approved_by_hr = True
        row.status = "HR Approved"
    elif current_user.role == UserRole.FINANCE:
        row.approved_by_finance = True
        row.status = "Finance Approved"
    else:
        row.approved_by_super_admin = True
        row.status = "Super Admin Approved"
    db.commit()
    db.refresh(row)
    return _payroll_response(row)


@router.patch("/payroll/{payroll_id}/mark-paid", response_model=PayrollResponse)
def mark_payroll_paid(payroll_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role not in {UserRole.SUPER_ADMIN, UserRole.FINANCE}:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    row = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    row.status = "Paid"
    db.commit()
    db.refresh(row)
    return _payroll_response(row)


@router.get("/trainer-workload", response_model=list[TrainerWorkloadResponse])
def list_trainer_workload(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_user(current_user)
    query = db.query(TrainerWorkload).join(Employee, TrainerWorkload.trainer_id == Employee.id)
    if _is_branch_limited(current_user):
        query = query.filter(TrainerWorkload.branch_id == current_user.branch_id)
    branches = _branch_map(db)
    return [_workload_response(row, branches) for row in query.order_by(TrainerWorkload.updated_at.desc()).limit(500).all()]


@router.patch("/trainer-workload/{workload_id}", response_model=TrainerWorkloadResponse)
def update_trainer_workload(workload_id: str, body: TrainerWorkloadUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    row = db.query(TrainerWorkload).filter(TrainerWorkload.id == workload_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Trainer workload not found")
    _get_employee(db, row.trainer_id, current_user)
    for key, value in body.dict(exclude_unset=True).items():
        setattr(row, key, value)
    row.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _workload_response(row, _branch_map(db))


@router.get("/performance", response_model=list[PerformanceReviewResponse])
def list_performance(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_user(current_user)
    query = db.query(PerformanceReview).join(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == current_user.branch_id)
    return [_performance_response(row) for row in query.order_by(PerformanceReview.created_at.desc()).limit(500).all()]


@router.post("/performance", response_model=PerformanceReviewResponse)
def create_performance(body: PerformanceReviewCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_write(current_user)
    _get_employee(db, body.employee_id, current_user)
    row = PerformanceReview(**body.dict())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _performance_response(row)


@router.get("/performance/{employee_id}", response_model=list[PerformanceReviewResponse])
def get_employee_performance(employee_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_user(current_user)
    _get_employee(db, employee_id, current_user)
    rows = db.query(PerformanceReview).filter(PerformanceReview.employee_id == employee_id).order_by(PerformanceReview.created_at.desc()).all()
    return [_performance_response(row) for row in rows]


@router.get("/tasks", response_model=list[StaffTaskResponse])
def list_tasks(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_user(current_user)
    query = db.query(StaffTask).join(Employee)
    if _is_branch_limited(current_user):
        query = query.filter(Employee.branch_id == current_user.branch_id)
    return [_task_response(row) for row in query.order_by(StaffTask.created_at.desc()).limit(500).all()]


@router.post("/tasks", response_model=StaffTaskResponse)
def create_task(body: StaffTaskCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    _get_employee(db, body.assigned_to, current_user)
    row = StaffTask(**body.dict(), assigned_by=current_user.id)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _task_response(row)


@router.patch("/tasks/{task_id}", response_model=StaffTaskResponse)
def update_task(task_id: str, body: StaffTaskUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_staff_write(current_user)
    row = db.query(StaffTask).filter(StaffTask.id == task_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")
    _get_employee(db, row.assigned_to, current_user)
    data = body.dict(exclude_unset=True)
    if data.get("assigned_to"):
        _get_employee(db, data["assigned_to"], current_user)
    for key, value in data.items():
        setattr(row, key, value)
    if row.status == "Completed" and not row.completed_at:
        row.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(row)
    return _task_response(row)


@router.get("/ai-insights", response_model=list[HRInsight])
def ai_insights(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    current_user = _require_hr_user(current_user)
    employees = _scoped_employees(db, current_user).all()
    employee_ids = [employee.id for employee in employees]
    insights: list[HRInsight] = []
    if not employee_ids:
        return []

    since = date.today() - timedelta(days=30)
    absent_counts = (
        db.query(StaffAttendance.employee_id, func.count(StaffAttendance.id))
        .filter(StaffAttendance.employee_id.in_(employee_ids), StaffAttendance.attendance_date >= since, StaffAttendance.status == "Absent")
        .group_by(StaffAttendance.employee_id)
        .all()
    )
    employee_by_id = {employee.id: employee for employee in employees}
    for employee_id, count in absent_counts:
        if count > 3:
            employee = employee_by_id.get(employee_id)
            insights.append(HRInsight(title="Repeated absence", detail=f"{employee.full_name if employee else 'Staff'} was absent {count} times in the last 30 days.", severity="critical", category="attendance", employee_id=employee_id))

    pending_leaves = db.query(LeaveRequest).filter(LeaveRequest.employee_id.in_(employee_ids), LeaveRequest.status == "Pending").count()
    if pending_leaves:
        insights.append(HRInsight(title="Pending leave requests", detail=f"{pending_leaves} leave request(s) are waiting for approval.", severity="warning", category="leave"))

    pending_payroll = db.query(Payroll).filter(Payroll.employee_id.in_(employee_ids), Payroll.status != "Paid").count()
    if pending_payroll:
        insights.append(HRInsight(title="Payroll approval pending", detail=f"{pending_payroll} payroll record(s) are not marked paid.", severity="warning", category="payroll"))

    overloaded = (
        db.query(TrainerWorkload)
        .filter(TrainerWorkload.trainer_id.in_(employee_ids), TrainerWorkload.workload_status == "Overloaded")
        .all()
    )
    for row in overloaded:
        trainer = employee_by_id.get(row.trainer_id)
        insights.append(HRInsight(title="Trainer overloaded", detail=f"{trainer.full_name if trainer else 'Trainer'} has {row.weekly_classes} weekly classes and {row.pending_assignments} pending assignments.", severity="critical", category="workload", employee_id=row.trainer_id))

    documents = db.query(EmployeeDocument).filter(EmployeeDocument.employee_id.in_(employee_ids)).all()
    docs_by_employee: dict[str, set[str]] = {}
    rejected_or_pending: set[str] = set()
    for document in documents:
        if document.verification_status == "Verified":
            docs_by_employee.setdefault(document.employee_id, set()).add(document.document_type)
        else:
            rejected_or_pending.add(document.employee_id)
    for employee in employees:
        missing = REQUIRED_DOCUMENTS - docs_by_employee.get(employee.id, set())
        if missing or employee.id in rejected_or_pending:
            insights.append(HRInsight(title="Missing employee documents", detail=f"{employee.full_name} has pending or missing documents.", severity="warning", category="documents", employee_id=employee.id))

    attendance_rows = (
        db.query(StaffAttendance.employee_id, StaffAttendance.status)
        .filter(StaffAttendance.employee_id.in_(employee_ids), StaffAttendance.attendance_date >= since)
        .all()
    )
    totals: dict[str, int] = {}
    attended: dict[str, int] = {}
    for employee_id, status in attendance_rows:
        totals[employee_id] = totals.get(employee_id, 0) + 1
        if status in {"Present", "Late"}:
            attended[employee_id] = attended.get(employee_id, 0) + 1
    for employee_id, total in totals.items():
        rate = (attended.get(employee_id, 0) / total) * 100 if total else 100
        if total >= 5 and rate < 75:
            employee = employee_by_id.get(employee_id)
            insights.append(HRInsight(title="Low attendance staff", detail=f"{employee.full_name if employee else 'Staff'} attendance is {rate:.0f}% in the last 30 days.", severity="warning", category="attendance", employee_id=employee_id))

    if not insights:
        insights.append(HRInsight(title="HR health stable", detail="No rule-based HR risks were detected from the current records.", severity="success", category="overview"))
    return insights[:12]
