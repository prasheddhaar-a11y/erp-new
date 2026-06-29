"""
PINESPHERE ERP
Module      : HR Module
File        : hr.py
Purpose     : Defines Hr database models
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/models/hr.py
# PURPOSE: SQLAlchemy models for the HR module.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import datetime
import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base
from app.models.branch import Branch  # noqa: F401


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Employee(Base):
    __tablename__ = "hr_employees"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    role = Column(String, nullable=False, index=True)
    department = Column(String, nullable=True, index=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=True, index=True)
    reporting_manager = Column(String, nullable=True)
    joining_date = Column(Date, nullable=True)
    salary = Column(Numeric(12, 2), default=0)
    status = Column(String, nullable=False, default="Active", index=True)
    emergency_contact = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    documents_status = Column(String, nullable=False, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    branch = relationship("Branch")


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    document_type = Column(String, nullable=False, index=True)
    file_url = Column(String, nullable=False)
    verification_status = Column(String, nullable=False, default="Pending", index=True)
    remarks = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")


class StaffAttendance(Base):
    __tablename__ = "staff_attendance"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=True, index=True)
    attendance_date = Column(Date, nullable=False, index=True)
    check_in = Column(String, nullable=True)
    check_out = Column(String, nullable=True)
    status = Column(String, nullable=False, default="Present", index=True)
    mode = Column(String, nullable=False, default="Manual")
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
    branch = relationship("Branch")


class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    leave_type = Column(String, nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Numeric(5, 2), nullable=False, default=1)
    reason = Column(Text, nullable=False)
    status = Column(String, nullable=False, default="Pending", index=True)
    approved_by = Column(String, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")


class Payroll(Base):
    __tablename__ = "payroll"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    month = Column(Integer, nullable=False, index=True)
    year = Column(Integer, nullable=False, index=True)
    base_salary = Column(Numeric(12, 2), nullable=False, default=0)
    allowances = Column(Numeric(12, 2), nullable=False, default=0)
    deductions = Column(Numeric(12, 2), nullable=False, default=0)
    leave_deduction = Column(Numeric(12, 2), nullable=False, default=0)
    pf = Column(Numeric(12, 2), nullable=False, default=0)
    tds = Column(Numeric(12, 2), nullable=False, default=0)
    net_salary = Column(Numeric(12, 2), nullable=False, default=0)
    status = Column(String, nullable=False, default="Draft", index=True)
    approved_by_hr = Column(Boolean, nullable=False, default=False)
    approved_by_finance = Column(Boolean, nullable=False, default=False)
    approved_by_super_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")


class TrainerWorkload(Base):
    __tablename__ = "trainer_workload"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trainer_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=True, index=True)
    total_batches = Column(Integer, nullable=False, default=0)
    total_students = Column(Integer, nullable=False, default=0)
    weekly_classes = Column(Integer, nullable=False, default=0)
    pending_assignments = Column(Integer, nullable=False, default=0)
    workload_status = Column(String, nullable=False, default="Balanced", index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    trainer = relationship("Employee")
    branch = relationship("Branch")


class PerformanceReview(Base):
    __tablename__ = "performance_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    employee_id = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    review_period = Column(String, nullable=False, index=True)
    attendance_score = Column(Integer, nullable=False, default=0)
    productivity_score = Column(Integer, nullable=False, default=0)
    student_feedback_score = Column(Integer, nullable=False, default=0)
    session_completion_score = Column(Integer, nullable=False, default=0)
    manager_rating = Column(Integer, nullable=False, default=0)
    ai_score = Column(Integer, nullable=False, default=0)
    strengths = Column(Text, nullable=True)
    improvements = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="Draft", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")


class StaffTask(Base):
    __tablename__ = "staff_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    assigned_to = Column(String, ForeignKey("hr_employees.id"), nullable=False, index=True)
    assigned_by = Column(String, nullable=True, index=True)
    priority = Column(String, nullable=False, default="Medium", index=True)
    due_date = Column(Date, nullable=True, index=True)
    status = Column(String, nullable=False, default="Pending", index=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee")
