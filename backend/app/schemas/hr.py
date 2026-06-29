"""
PINESPHERE ERP
Module      : HR Module
File        : hr.py
Purpose     : Defines Hr request and response schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/schemas/hr.py
# PURPOSE: Pydantic schemas for HR module APIs.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


EmployeeStatus = Literal["Active", "Inactive", "Probation", "Resigned"]
DocumentStatus = Literal["Pending", "Verified", "Rejected"]
AttendanceStatus = Literal["Present", "Absent", "Late", "Half Day", "On Leave"]
LeaveType = Literal["Casual", "Sick", "Paid", "Unpaid", "Maternity", "Paternity"]
LeaveStatus = Literal["Pending", "Approved", "Rejected"]
PayrollStatus = Literal["Draft", "HR Approved", "Finance Approved", "Super Admin Approved", "Paid"]
WorkloadStatus = Literal["Underloaded", "Balanced", "Overloaded"]
ReviewStatus = Literal["Draft", "In Review", "Completed"]
TaskPriority = Literal["Low", "Medium", "High", "Critical"]
TaskStatus = Literal["Pending", "In Progress", "Completed", "Delayed"]


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class EmployeeBase(BaseModel):
    employee_id: str = Field(min_length=1, max_length=80)
    full_name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    phone: str | None = None
    role: str = Field(min_length=1, max_length=80)
    department: str | None = None
    branch_id: str | None = None
    reporting_manager: str | None = None
    joining_date: date | None = None
    salary: Decimal = Decimal("0")
    status: EmployeeStatus = "Active"
    emergency_contact: str | None = None
    bank_account: str | None = None
    documents_status: DocumentStatus = "Pending"


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_id: str | None = Field(default=None, min_length=1, max_length=80)
    full_name: str | None = Field(default=None, min_length=1, max_length=160)
    email: EmailStr | None = None
    phone: str | None = None
    role: str | None = Field(default=None, min_length=1, max_length=80)
    department: str | None = None
    branch_id: str | None = None
    reporting_manager: str | None = None
    joining_date: date | None = None
    salary: Decimal | None = None
    status: EmployeeStatus | None = None
    emergency_contact: str | None = None
    bank_account: str | None = None
    documents_status: DocumentStatus | None = None


class EmployeeResponse(EmployeeBase):
    id: str
    branch_name: str | None = None
    attendance_status: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class EmployeeDocumentCreate(BaseModel):
    document_type: str = Field(min_length=1, max_length=120)
    file_url: str = Field(min_length=1)
    verification_status: DocumentStatus = "Pending"
    remarks: str | None = None


class EmployeeDocumentVerify(BaseModel):
    verification_status: DocumentStatus
    remarks: str | None = None


class EmployeeDocumentResponse(EmployeeDocumentCreate):
    id: str
    employee_id: str
    employee_name: str | None = None
    uploaded_at: datetime

    class Config:
        from_attributes = True


class StaffAttendanceMark(BaseModel):
    employee_id: str
    branch_id: str | None = None
    attendance_date: date
    check_in: str | None = None
    check_out: str | None = None
    status: AttendanceStatus
    mode: str = "Manual"
    remarks: str | None = None


class StaffAttendanceUpdate(BaseModel):
    attendance_date: date | None = None
    check_in: str | None = None
    check_out: str | None = None
    status: AttendanceStatus | None = None
    mode: str | None = None
    remarks: str | None = None


class StaffAttendanceResponse(StaffAttendanceMark):
    id: str
    employee_name: str | None = None
    branch_name: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class LeaveRequestCreate(BaseModel):
    employee_id: str
    leave_type: LeaveType
    start_date: date
    end_date: date
    total_days: Decimal = Decimal("1")
    reason: str = Field(min_length=1)
    remarks: str | None = None


class LeaveDecision(BaseModel):
    remarks: str | None = None


class LeaveRequestResponse(LeaveRequestCreate):
    id: str
    employee_name: str | None = None
    branch_id: str | None = None
    status: LeaveStatus
    approved_by: str | None = None
    leave_balance: Decimal = Decimal("12")
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollGenerate(BaseModel):
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2000, le=2100)
    employee_ids: list[str] | None = None
    allowances: Decimal = Decimal("0")
    deductions: Decimal = Decimal("0")
    leave_deduction: Decimal = Decimal("0")
    pf: Decimal = Decimal("0")
    tds: Decimal = Decimal("0")


class PayrollResponse(BaseModel):
    id: str
    employee_id: str
    employee_name: str | None = None
    branch_id: str | None = None
    month: int
    year: int
    base_salary: Decimal
    allowances: Decimal
    deductions: Decimal
    leave_deduction: Decimal
    pf: Decimal
    tds: Decimal
    net_salary: Decimal
    status: PayrollStatus
    approved_by_hr: bool
    approved_by_finance: bool
    approved_by_super_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TrainerWorkloadUpdate(BaseModel):
    total_batches: int | None = Field(default=None, ge=0)
    total_students: int | None = Field(default=None, ge=0)
    weekly_classes: int | None = Field(default=None, ge=0)
    pending_assignments: int | None = Field(default=None, ge=0)
    workload_status: WorkloadStatus | None = None


class TrainerWorkloadResponse(BaseModel):
    id: str
    trainer_id: str
    trainer_name: str | None = None
    branch_id: str | None = None
    branch_name: str | None = None
    total_batches: int
    total_students: int
    weekly_classes: int
    pending_assignments: int
    workload_status: WorkloadStatus
    updated_at: datetime

    class Config:
        from_attributes = True


class PerformanceReviewCreate(BaseModel):
    employee_id: str
    review_period: str = Field(min_length=1, max_length=80)
    attendance_score: int = Field(ge=0, le=100)
    productivity_score: int = Field(ge=0, le=100)
    student_feedback_score: int = Field(ge=0, le=100)
    session_completion_score: int = Field(ge=0, le=100)
    manager_rating: int = Field(ge=0, le=100)
    ai_score: int = Field(ge=0, le=100)
    strengths: str | None = None
    improvements: str | None = None
    status: ReviewStatus = "Draft"


class PerformanceReviewResponse(PerformanceReviewCreate):
    id: str
    employee_name: str | None = None
    branch_id: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class StaffTaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    description: str | None = None
    assigned_to: str
    priority: TaskPriority = "Medium"
    due_date: date | None = None
    status: TaskStatus = "Pending"


class StaffTaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    assigned_to: str | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    status: TaskStatus | None = None


class StaffTaskResponse(StaffTaskCreate):
    id: str
    assigned_to_name: str | None = None
    assigned_by: str | None = None
    completed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class HRInsight(BaseModel):
    title: str
    detail: str
    severity: Literal["info", "warning", "critical", "success"] = "info"
    category: str
    employee_id: str | None = None
