"""
PINESPHERE ERP
Module      : Settings Module
File        : settings.py
Purpose     : Defines Settings API endpoints and request handling
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

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.settings import SystemSetting
from app.schemas.settings import SettingResponse, SettingsSummaryResponse, SettingUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])


class SaveProfileRequest(BaseModel):
    institute_name: str
    primary_contact: str | None = None


class UpdateCalendarRequest(BaseModel):
    academic_year: str
    default_attendance_mode: str | None = None


class ConfigureAlertsRequest(BaseModel):
    fee_reminder_enabled: str
    absence_alert_enabled: str | None = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def upsert_setting(db: Session, key: str, value: str, is_enabled: bool = True) -> SystemSetting:
    seed_default_settings(db)
    setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
    if not setting:
        setting = SystemSetting(key=key, label=key.replace("_", " ").title(), category="custom", value=value)
        db.add(setting)
    setting.value = value
    setting.is_enabled = is_enabled
    return setting


# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

DEFAULT_SETTINGS = [
    {
        "key": "institute_name",
        "label": "Institute name",
        "category": "institute_profile",
        "value": "Pinesphere ERP",
        "description": "Shown in headers, reports, invoices, and parent/student communication.",
    },
    {
        "key": "primary_contact",
        "label": "Primary contact number",
        "category": "institute_profile",
        "value": "+91 98765 43210",
        "description": "Main phone number used by office staff and automated messages.",
    },
    {
        "key": "academic_year",
        "label": "Academic year",
        "category": "academic_defaults",
        "value": "2026-2027",
        "description": "Default year used for batches, reports, admissions, and fee planning.",
    },
    {
        "key": "default_attendance_mode",
        "label": "Default attendance mode",
        "category": "academic_defaults",
        "value": "QR + manual fallback",
        "description": "How trainers usually mark class attendance.",
    },
    {
        "key": "fee_reminder_enabled",
        "label": "Fee reminder messages",
        "category": "notifications",
        "value": "Send 3 days before due date",
        "description": "Controls when parents or students are reminded about pending fees.",
    },
    {
        "key": "absence_alert_enabled",
        "label": "Absence alerts",
        "category": "notifications",
        "value": "Notify parent after 2 missed classes",
        "description": "Helps the institute follow up with students who miss classes.",
    },
    {
        "key": "backup_frequency",
        "label": "Backup frequency",
        "category": "backup_security",
        "value": "Daily at 11:00 PM",
        "description": "Keeps a routine copy of important ERP records.",
    },
    {
        "key": "session_timeout",
        "label": "Session timeout",
        "category": "backup_security",
        "value": "8 hours",
        "description": "How long a user can stay signed in before re-login is required.",
    },
]


def seed_default_settings(db: Session) -> None:
    existing_keys = {row.key for row in db.query(SystemSetting.key).all()}
    changed = False
    for item in DEFAULT_SETTINGS:
        if item["key"] not in existing_keys:
            db.add(SystemSetting(**item))
            changed = True
    if changed:
        db.commit()


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/items", response_model=list[SettingResponse])
def settings_items(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    seed_default_settings(db)
    return db.query(SystemSetting).order_by(SystemSetting.category.asc(), SystemSetting.label.asc()).all()


@router.get("/summary", response_model=SettingsSummaryResponse)
def settings_summary(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    seed_default_settings(db)
    rows = db.query(SystemSetting).all()
    counts = {category: 0 for category in ["institute_profile", "academic_defaults", "notifications", "backup_security"]}
    enabled = 0
    for row in rows:
        counts[row.category] = counts.get(row.category, 0) + 1
        if row.is_enabled:
            enabled += 1
    return SettingsSummaryResponse(
        institute_profile=counts["institute_profile"],
        academic_defaults=counts["academic_defaults"],
        notifications=counts["notifications"],
        backup_security=counts["backup_security"],
        enabled_settings=enabled,
    )


@router.patch("/items/{setting_id}", response_model=SettingResponse)
def update_setting(setting_id: str, payload: SettingUpdateRequest, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    setting = db.query(SystemSetting).filter(SystemSetting.id == setting_id).first()
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    setting.value = payload.value
    if payload.is_enabled is not None:
        setting.is_enabled = payload.is_enabled
    db.commit()
    db.refresh(setting)
    return setting


@router.post("/save-profile")
def save_profile(body: SaveProfileRequest, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    rows = [upsert_setting(db, "institute_name", body.institute_name)]
    if body.primary_contact is not None:
        rows.append(upsert_setting(db, "primary_contact", body.primary_contact))
    db.commit()
    return {"message": "Institute profile saved.", "settings": rows}


@router.post("/update-calendar")
def update_calendar(body: UpdateCalendarRequest, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    rows = [upsert_setting(db, "academic_year", body.academic_year)]
    if body.default_attendance_mode is not None:
        rows.append(upsert_setting(db, "default_attendance_mode", body.default_attendance_mode))
    db.commit()
    return {"message": "Academic calendar updated.", "settings": rows}


@router.post("/configure-alerts")
def configure_alerts(body: ConfigureAlertsRequest, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    rows = [upsert_setting(db, "fee_reminder_enabled", body.fee_reminder_enabled)]
    if body.absence_alert_enabled is not None:
        rows.append(upsert_setting(db, "absence_alert_enabled", body.absence_alert_enabled))
    db.commit()
    return {"message": "Alert settings configured.", "settings": rows}
