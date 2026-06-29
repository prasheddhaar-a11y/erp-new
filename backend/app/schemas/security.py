"""
PINESPHERE ERP
Module      : Security Module
File        : security.py
Purpose     : Defines Security request and response schemas
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

class AuditLogResponse(BaseModel):
    id: str
    user_id: str
    action: str
    ip_address: str | None
    module: str | None
    action_type: str | None
    old_value: str | None
    new_value: str | None
    user_agent: str | None
    severity: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class SessionResponse(BaseModel):
    id: str
    user_id: str
    email: str | None
    role: str | None
    ip_address: str | None
    user_agent: str | None
    device_info: str | None
    browser: str | None = None
    operating_system: str | None = None
    revoked: bool
    status: str | None
    expires_at: datetime
    login_at: datetime | None
    logout_at: datetime | None
    created_at: datetime | None
    last_used_at: datetime | None

    class Config:
        from_attributes = True


class SecurityEventResponse(BaseModel):
    id: str
    user_id: str | None
    event_type: str
    severity: str | None
    ip_address: str | None
    user_agent: str | None
    details: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class PermissionResponse(BaseModel):
    role: str
    permissions: dict[str, list[str]]


class SecuritySummaryResponse(BaseModel):
    audit_logs: int
    active_sessions: int
    revoked_sessions: int
    failed_logins: int
    suspicious_events: int
    security_score: int
    concepts: list[dict[str, str]]
