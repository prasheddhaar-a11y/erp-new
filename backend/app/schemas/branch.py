"""
PINESPHERE ERP
Module      : Branches Module
File        : branch.py
Purpose     : Defines Branch request and response schemas
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

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class BranchCreate(BaseModel):
    name: str
    code: str
    city: str | None = None
    address: str | None = None
    manager_name: str | None = None
    phone: str | None = None
    capacity: int = 0
    status: str = "active"


class BranchUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    city: str | None = None
    address: str | None = None
    manager_name: str | None = None
    phone: str | None = None
    capacity: int | None = None
    status: str | None = None


class BranchResponse(BranchCreate):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class BranchComparisonResponse(BaseModel):
    id: str
    name: str
    code: str
    city: str | None = None
    capacity: int
    students: int
    staff: int
    total_users: int
    utilization_percent: float
    status: str


class CapacityReportResponse(BaseModel):
    total_capacity: int
    total_students: int
    utilization_percent: float
    branches: list[BranchComparisonResponse]
