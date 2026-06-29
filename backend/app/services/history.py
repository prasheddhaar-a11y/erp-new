"""
PINESPHERE ERP
Module      : Backend Platform
File        : history.py
Purpose     : Provides History business logic
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

from sqlalchemy.orm import Session

from app.models.history import HistoryEvent


# =====================================================
# SECTION: SERVICES
# PURPOSE:
# This section contains business logic used by routes or other modules.
# Services keep workflows separate from request handling code.
# =====================================================

# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def add_history(
    db: Session,
    *,
    module: str,
    action: str,
    title: str,
    details: str | None = None,
    record_id: str | None = None,
    created_by_id: str | None = None,
    branch_id: str | None = None,
) -> HistoryEvent:
    event = HistoryEvent(
        module=module,
        action=action,
        title=title,
        details=details,
        record_id=record_id,
        created_by_id=created_by_id,
        branch_id=branch_id,
    )
    db.add(event)
    return event
