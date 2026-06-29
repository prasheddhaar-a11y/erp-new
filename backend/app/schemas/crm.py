"""
PINESPHERE ERP
Module      : Admission Module
File        : crm.py
Purpose     : Defines Crm request and response schemas
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

from datetime import datetime

from pydantic import BaseModel, EmailStr


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class LeadCreate(BaseModel):
    student_name: str
    parent_name: str | None = None
    phone: str
    email: EmailStr | None = None
    course_interest: str | None = None
    source: str = "walk-in"
    status: str = "new"
    score: int = 0
    lost_reason: str | None = None
    demo_at: datetime | None = None
    demo_mode: str | None = None
    demo_link: str | None = None
    demo_attended: str = "pending"
    branch_id: str | None = None
    counsellor_id: str | None = None
    next_follow_up_at: datetime | None = None
    notes: str | None = None


class LeadUpdate(BaseModel):
    student_name: str | None = None
    parent_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    course_interest: str | None = None
    source: str | None = None
    status: str | None = None
    score: int | None = None
    lost_reason: str | None = None
    demo_at: datetime | None = None
    demo_mode: str | None = None
    demo_link: str | None = None
    demo_attended: str | None = None
    branch_id: str | None = None
    counsellor_id: str | None = None
    next_follow_up_at: datetime | None = None
    notes: str | None = None


class LeadAssignRequest(BaseModel):
    counsellor_id: str | None = None
    branch_id: str | None = None


class LeadStatusRequest(BaseModel):
    status: str
    lost_reason: str | None = None


class LeadNoteRequest(BaseModel):
    note: str


class LeadResponse(BaseModel):
    id: str
    student_name: str
    parent_name: str | None
    phone: str
    email: str | None
    course_interest: str | None
    source: str
    status: str
    score: int
    lost_reason: str | None
    demo_at: datetime | None
    demo_mode: str | None
    demo_link: str | None
    demo_attended: str | None
    branch_id: str | None
    counsellor_id: str | None
    next_follow_up_at: datetime | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CrmSummaryResponse(BaseModel):
    total_leads: int
    new_leads_today: int
    followups_pending: int
    converted_leads: int
    conversion_rate: float
