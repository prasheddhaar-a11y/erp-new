"""
PINESPHERE ERP
Module      : Backend Platform
File        : franchise.py
Purpose     : Defines Franchise request and response schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/schemas/franchise.py
# PURPOSE: Pydantic contracts for franchise dashboard, analytics, agreements, alerts, and realtime payloads.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class FranchiseCreate(BaseModel):
    name: str
    owner_name: str
    owner_email: str | None = None
    owner_phone: str | None = None
    city: str | None = None
    status: str = "active"
    royalty_percent: float = 10
    linked_branch_ids: list[str] | None = None


class FranchiseResponse(FranchiseCreate):
    id: str

    class Config:
        from_attributes = True


class FranchiseRoyaltyCreate(BaseModel):
    franchise_id: str
    period: str
    gross_revenue: float
    royalty_percent: float
    payment_status: str = "pending"
    due_date: str | None = None


class FranchiseComplianceCreate(BaseModel):
    franchise_id: str
    category: str
    score: float
    status: str = "open"
    notes: str | None = None


class FranchiseAgreementCreate(BaseModel):
    franchise_id: str
    status: str = "active"
    renewal_date: str | None = None
    duration: str | None = None
    pending_signatures: int = 0
    uploaded_documents: int = 0
    kyc_verified: bool = False
    gst_verified: bool = False


class FranchiseAlertCreate(BaseModel):
    franchise_id: str | None = None
    title: str
    detail: str
    severity: str = "info"
    action: str | None = None


class FranchiseKpi(BaseModel):
    key: str
    label: str
    value: str
    trend: str
    status: str
    series: list[int]


class FranchiseDirectoryRow(BaseModel):
    id: str
    name: str
    owner: str
    linked_branches: int
    students: int
    revenue: float
    royalty_percent: float
    compliance_score: int
    agreement_status: str
    last_activity: str
    health: str


class FranchiseAlertItem(BaseModel):
    id: str
    title: str
    detail: str
    severity: str
    timestamp: str
    action: str


class FranchiseChartPoint(BaseModel):
    label: str
    revenue: float
    royalty: float
    students: int
    attendance: float
    conversion: float


class FranchiseComplianceMetric(BaseModel):
    label: str
    value: int
    insight: str


class FranchiseAgreementItem(BaseModel):
    id: str
    franchise: str
    status: str
    renewal_date: str
    duration: str
    pending_signatures: int
    uploaded_documents: int
    kyc_status: str
    gst_status: str


class FranchiseAiInsight(BaseModel):
    id: str
    title: str
    detail: str
    confidence: int
    recommendation: str
    direction: str


class FranchiseDashboardResponse(BaseModel):
    last_sync_time: str
    system_status: str
    active_franchises: int
    kpis: list[FranchiseKpi]
    franchises: list[FranchiseDirectoryRow]
    alerts: list[FranchiseAlertItem]
    charts: list[FranchiseChartPoint]
    compliance: list[FranchiseComplianceMetric]
    agreements: list[FranchiseAgreementItem]
    insights: list[FranchiseAiInsight]
