"""
PINESPHERE ERP
Module      : Backend Platform
File        : history.py
Purpose     : Defines History API endpoints and request handling
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

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.history import HistoryEvent
from app.schemas.history import HistoryEventResponse

router = APIRouter(prefix="/history", tags=["History"])


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("", response_model=list[HistoryEventResponse])
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def list_history(
    module: str | None = Query(default=None),
    limit: int = Query(default=30, le=100),
    include_removed: bool = Query(default=False),
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR, UserRole.TRAINER, UserRole.HR, UserRole.FINANCE)),
):
    query = db.query(HistoryEvent).order_by(HistoryEvent.created_at.desc())

    if module:
        query = query.filter(HistoryEvent.module == module)
        if module == "students" and not include_removed:
            query = query.filter(HistoryEvent.action != "removed")

    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(HistoryEvent.branch_id == current_user.branch_id)

    return query.limit(limit).all()
