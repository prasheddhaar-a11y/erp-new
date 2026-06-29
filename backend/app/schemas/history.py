"""
PINESPHERE ERP
Module      : Backend Platform
File        : history.py
Purpose     : Defines History request and response schemas
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

class HistoryEventResponse(BaseModel):
    id: str
    module: str
    action: str
    title: str
    details: str | None
    record_id: str | None
    created_by_id: str | None
    branch_id: str | None
    created_at: datetime

    class Config:
        from_attributes = True
