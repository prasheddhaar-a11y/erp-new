"""
PINESPHERE ERP
Module      : Security Module
File        : security.py
Purpose     : Defines Security API endpoints and request handling
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

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import service
from app.auth.dependencies import get_current_user, require_roles
from app.core.permissions import get_permissions
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.token import AuditLog, RefreshToken, SecurityEvent
from app.schemas.security import AuditLogResponse, PermissionResponse, SecurityEventResponse, SecuritySummaryResponse, SessionResponse

router = APIRouter(prefix="/security", tags=["Security"])


class CreateRoleRequest(BaseModel):
    role_name: str
    permissions: str = ""
    description: str | None = None


class RotateKeysRequest(BaseModel):
    reason: str | None = None
    revoke_sessions: bool = True


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/permissions", response_model=PermissionResponse)
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def my_permissions(current_user=Depends(get_current_user)):
    return PermissionResponse(role=current_user.role.value, permissions=get_permissions(current_user.role))


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def audit_logs(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(100).all()


@router.get("/sessions", response_model=list[SessionResponse])
def sessions(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return db.query(RefreshToken).order_by(RefreshToken.created_at.desc()).limit(100).all()


@router.get("/events", response_model=list[SecurityEventResponse])
def security_events(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(100).all()


@router.get("/summary", response_model=SecuritySummaryResponse)
def security_summary(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    failed_logins = db.query(AuditLog).filter(AuditLog.action == "failed_login").count()
    suspicious_events = db.query(SecurityEvent).count()
    security_score = max(55, 100 - min(failed_logins * 5 + suspicious_events * 8, 45))
    return SecuritySummaryResponse(
        audit_logs=db.query(AuditLog).count(),
        active_sessions=db.query(RefreshToken).filter(RefreshToken.revoked == False).count(),  # noqa: E712
        revoked_sessions=db.query(RefreshToken).filter(RefreshToken.revoked == True).count(),  # noqa: E712
        failed_logins=failed_logins,
        suspicious_events=suspicious_events,
        security_score=security_score,
        concepts=[
            {"title": "Roles and permissions", "detail": "Controls who can open modules such as Finance, Students, Security, and Settings."},
            {"title": "Audit logs", "detail": "Keeps a record of important actions, so admins can review what changed and who did it."},
            {"title": "Sessions", "detail": "Shows signed-in devices and supports forced logout when an account looks risky."},
            {"title": "Security events", "detail": "Highlights failed login attempts, unusual access, and other items that need review."},
        ],
    )


@router.post("/roles")
def create_role(body: CreateRoleRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    log = AuditLog(
        user_id=current_user.id,
        action="role_created",
        module="security",
        action_type="create_role",
        new_value=f"{body.role_name} | {body.permissions}",
        # =====================================================
        # SECTION: API CALLS
        # PURPOSE:
        # This section talks to backend or server endpoints.
        # It sends requests, receives responses, and prepares data for the UI.
        # =====================================================

        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        severity="info",
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return {"message": f"Role '{body.role_name}' saved.", "audit_log": log}


@router.post("/audit-access")
def audit_access(request: Request, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    active_sessions = db.query(RefreshToken).filter(RefreshToken.revoked == False).count()  # noqa: E712
    failed_logins = db.query(AuditLog).filter(AuditLog.action == "failed_login").count()
    log = AuditLog(
        user_id=current_user.id,
        action="access_audit_run",
        module="security",
        action_type="audit_access",
        new_value=f"Active sessions: {active_sessions} | Failed logins: {failed_logins}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        severity="info",
    )
    db.add(log)
    db.commit()
    return {"message": "Security access audit completed.", "active_sessions": active_sessions, "failed_logins": failed_logins, "audit_log": log}


@router.post("/rotate-keys")
def rotate_keys(body: RotateKeysRequest, request: Request, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    revoked = 0
    if body.revoke_sessions:
        tokens = db.query(RefreshToken).filter(RefreshToken.revoked == False).all()  # noqa: E712
        for token in tokens:
            token.revoked = True
            token.logout_at = datetime.utcnow()
            token.status = "revoked"
            revoked += 1
    event = SecurityEvent(
        user_id=current_user.id,
        event_type="keys_rotated",
        severity="warning",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        details=body.reason or "Manual key rotation from Security module",
    )
    db.add(event)
    db.commit()
    return {"message": "Security keys rotated.", "revoked_sessions": revoked, "security_event": event}


@router.post("/force-logout-all")
def force_logout_all_devices(request: Request, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    service.force_logout_all_devices(current_user.id, db, request.client.host if request.client else None, request.headers.get("user-agent"))
    return {"message": "All device sessions were revoked"}
