"""
PINESPHERE ERP
Module      : Dashboard Module
File        : dashboard.py
Purpose     : Defines Dashboard request and response schemas
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

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class DashboardMetric(BaseModel):
    key: str
    label: str
    value: str
    helper: str
    trend: str


class BranchComparison(BaseModel):
    branch_name: str
    students: int
    attendance_rate: float
    revenue: float
    lead_conversion: float


class AiAlert(BaseModel):
    title: str
    message: str
    severity: str


class InstituteProgress(BaseModel):
    xp: int
    streak: int
    active_quests: int
    awards: int
    completion: int
    message: str


class AiInsight(BaseModel):
    title: str
    detail: str
    impact: str
    emoji: str


class SecurityCheck(BaseModel):
    label: str
    status: str
    detail: str


class SuperAdminDashboardResponse(BaseModel):
    total_students_active: int
    total_students_inactive: int
    revenue_this_month: float
    new_leads_today: int
    attendance_rate_today: float
    fee_defaulters_count: int
    upcoming_batches_classes: int
    metrics: list[DashboardMetric]
    branch_comparison: list[BranchComparison]
    ai_alerts: list[AiAlert]
    institute_progress: InstituteProgress
    ai_insights: list[AiInsight]
    security_checks: list[SecurityCheck]
