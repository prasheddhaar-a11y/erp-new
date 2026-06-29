"""
PINESPHERE ERP
Module      : Backend Platform
File        : operations.py
Purpose     : Defines Operations request and response schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/schemas/operations.py
# PURPOSE: Pydantic request and response schemas shared by API routes.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import datetime
from typing import Any

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class OperationCreate(BaseModel):
    title: str
    status: str = "open"
    priority: str | None = None
    assigned_to_id: str | None = None
    related_user_id: str | None = None
    related_branch_id: str | None = None
    amount: str | None = None
    due_date: str | None = None
    notes: str | None = None
    payload: dict[str, Any] | None = None


class OperationResponse(OperationCreate):
    id: str
    module: str
    action: str
    created_by_id: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class OperationSummary(BaseModel):
    module: str
    total: int
    open: int
    closed: int
    records: list[OperationResponse]
