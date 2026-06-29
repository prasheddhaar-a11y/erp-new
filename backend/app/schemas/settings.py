"""
PINESPHERE ERP
Module      : Settings Module
File        : settings.py
Purpose     : Defines Settings request and response schemas
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

class SettingResponse(BaseModel):
    id: str
    key: str
    label: str
    category: str
    value: str
    description: str | None
    is_enabled: bool
    updated_at: datetime | None

    class Config:
        from_attributes = True


class SettingsSummaryResponse(BaseModel):
    institute_profile: int
    academic_defaults: int
    notifications: int
    backup_security: int
    enabled_settings: int


class SettingUpdateRequest(BaseModel):
    value: str
    is_enabled: bool | None = None
