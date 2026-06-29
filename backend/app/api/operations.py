"""
PINESPHERE ERP
Module      : Backend Platform
File        : operations.py
Purpose     : Defines Operations API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/api/operations.py
# PURPOSE: FastAPI route handlers for one ERP module.
# ============================================================

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
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.core.permissions import has_permission
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.operations import OperationRecord
from app.schemas.operations import OperationCreate, OperationResponse, OperationSummary

router = APIRouter(tags=["Operations"])


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _create_record(
    module: str,
    action: str,
    body: OperationCreate,
    db: Session,
    current_user,
) -> OperationRecord:
    record = OperationRecord(
        module=module,
        action=action,
        created_by_id=current_user.id,
        **body.dict(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def _list_module(module: str, db: Session) -> OperationSummary:
    records = db.query(OperationRecord).filter(OperationRecord.module == module).order_by(OperationRecord.created_at.desc()).all()
    open_count = len([record for record in records if record.status not in {"closed", "completed", "done"}])
    return OperationSummary(
        module=module,
        total=len(records),
        open=open_count,
        closed=len(records) - open_count,
        records=records[:25],
    )


def _normalize_super_admin_action(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/operations/{module}", response_model=OperationSummary)
def list_operations(module: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    normalized_module = module.replace("-", "_")
    if current_user.role == UserRole.PUBLIC:
        raise HTTPException(status_code=403, detail="Access denied")
    if normalized_module in {"ai", "franchise", "reports", "security", "settings"} and current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Access denied")
    if not has_permission(current_user.role, normalized_module, "view"):
        raise HTTPException(status_code=403, detail="Access denied")
    return _list_module(module, db)


@router.post("/operations/super-admin/{module}/{action}", response_model=OperationResponse)
def super_admin_module_action(
    module: str,
    action: str,
    body: OperationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN)),
):
    normalized_module = _normalize_super_admin_action(module)
    normalized_action = _normalize_super_admin_action(action)
    allowed_modules = {"crm", "lead", "finance", "students"}
    allowed_actions = {"view", "edit", "toggle_status", "generate_report"}
    if normalized_module not in allowed_modules or normalized_action not in allowed_actions:
        raise HTTPException(status_code=400, detail="Unsupported Super Admin module action")
    return _create_record(normalized_module, normalized_action, body, db, current_user)


@router.post("/crm/leads", response_model=OperationResponse)
def add_lead(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.COUNSELLOR))):
    return _create_record("crm", "lead", body, db, current_user)


@router.post("/crm/demos", response_model=OperationResponse)
def schedule_demo(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.COUNSELLOR))):
    return _create_record("crm", "demo", body, db, current_user)


@router.post("/crm/follow-ups", response_model=OperationResponse)
def create_follow_up(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.COUNSELLOR))):
    return _create_record("crm", "follow_up", body, db, current_user)


@router.post("/students/batch-assignments", response_model=OperationResponse)
def assign_batch(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    return _create_record("students", "batch_assignment", body, db, current_user)


@router.post("/students/status-updates", response_model=OperationResponse)
def update_student_status(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    return _create_record("students", "status_update", body, db, current_user)


@router.post("/finance/payments", response_model=OperationResponse)
def record_payment(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE))):
    return _create_record("finance", "payment", body, db, current_user)


@router.post("/finance/invoices", response_model=OperationResponse)
def create_invoice(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE))):
    return _create_record("finance", "invoice", body, db, current_user)


@router.post("/finance/reminders", response_model=OperationResponse)
def send_reminder(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FINANCE))):
    return _create_record("finance", "reminder", body, db, current_user)


@router.post("/hr/trainer-assignments", response_model=OperationResponse)
def assign_trainer(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.HR, UserRole.BRANCH_ADMIN))):
    return _create_record("hr", "trainer_assignment", body, db, current_user)


@router.post("/ai/alerts/review", response_model=OperationResponse)
def review_alert(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("ai", "alert_review", body, db, current_user)


@router.post("/ai/configurations", response_model=OperationResponse)
def configure_ai(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("ai", "configuration", body, db, current_user)


@router.post("/franchise/franchises", response_model=OperationResponse)
def add_franchise(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("franchise", "franchise", body, db, current_user)


@router.post("/franchise/compliance-reviews", response_model=OperationResponse)
def review_compliance(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("franchise", "compliance_review", body, db, current_user)


@router.get("/franchise/revenue-comparison", response_model=OperationSummary)
def compare_revenue(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _list_module("franchise", db)


@router.get("/reports/exports", response_model=OperationSummary)
def export_summary(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _list_module("reports", db)


@router.get("/reports/download-csv", response_model=OperationSummary)
def download_csv(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _list_module("reports", db)


@router.post("/reports/scheduled-emails", response_model=OperationResponse)
def schedule_email(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("reports", "scheduled_email", body, db, current_user)


@router.post("/security/roles", response_model=OperationResponse)
def create_role(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("security", "role", body, db, current_user)


@router.get("/security/audit-access", response_model=OperationSummary)
def audit_access(db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _list_module("security", db)


@router.post("/security/key-rotations", response_model=OperationResponse)
def rotate_keys(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("security", "key_rotation", body, db, current_user)


@router.post("/settings/profile", response_model=OperationResponse)
def save_profile(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("settings", "profile", body, db, current_user)


@router.post("/settings/calendar", response_model=OperationResponse)
def update_calendar(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("settings", "calendar", body, db, current_user)


@router.post("/settings/alert-rules", response_model=OperationResponse)
def configure_alerts(body: OperationCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _create_record("settings", "alert_rule", body, db, current_user)
