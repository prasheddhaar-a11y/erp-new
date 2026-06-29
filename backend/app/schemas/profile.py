"""
PINESPHERE ERP
Module      : Profile Module
File        : profile.py
Purpose     : Defines Profile request and response schemas
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

from pydantic import BaseModel, ConfigDict, Field

from app.core.roles import UserRole


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class ProfileResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str | None = None
    role: UserRole
    role_abbreviation: str | None = None
    branch_id: str | None = None
    franchise_id: str | None = None
    profile_photo: str | None = None
    email_verified: bool | None = None
    email_verified_at: datetime | None = None
    is_active: bool
    last_login_at: datetime | None = None
    updated_at: datetime | None = None
    last_login_device: str | None = None
    last_login_ip: str | None = None
    last_login_browser: str | None = None
    last_login_operating_system: str | None = None


class ProfileUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    phone: str | None = Field(default=None, max_length=32)
    profile_photo: str | None = Field(default=None, max_length=2_000_000)


class ProfilePhotoRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    profile_photo: str | None = Field(default=None, max_length=2_000_000)


class ChangePasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    current_password: str
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str
    logout_other_devices: bool = True
