"""
PINESPHERE ERP
Module      : Fees Module
File        : finance.py
Purpose     : Defines Finance request and response schemas
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

from datetime import date, datetime

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class InvoiceCreate(BaseModel):
    invoice_number: str
    student_id: str
    branch_id: str | None = None
    course_name: str | None = None
    amount: float
    due_date: date
    notes: str | None = None


class InvoiceUpdate(BaseModel):
    invoice_number: str | None = None
    student_id: str | None = None
    branch_id: str | None = None
    course_name: str | None = None
    amount: float | None = None
    paid_amount: float | None = None
    status: str | None = None
    due_date: date | None = None
    notes: str | None = None


class InvoiceResponse(BaseModel):
    id: str
    invoice_number: str
    student_id: str
    branch_id: str | None
    course_name: str | None
    amount: float
    paid_amount: float
    status: str
    due_date: date
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_method: str = "cash"
    reference_number: str | None = None
    notes: str | None = None


class PaymentUpdate(BaseModel):
    amount: float | None = None
    payment_method: str | None = None
    reference_number: str | None = None
    notes: str | None = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    student_id: str
    amount: float
    payment_method: str
    reference_number: str | None
    paid_at: datetime
    notes: str | None

    class Config:
        from_attributes = True


class FinanceSummaryResponse(BaseModel):
    revenue_this_month: float
    total_invoice_amount: float
    total_collected: float
    total_pending: float
    fee_defaulters_count: int
    unpaid_invoices: int
    paid_invoices: int
