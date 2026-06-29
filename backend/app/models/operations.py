"""
PINESPHERE ERP
Module      : Backend Platform
File        : operations.py
Purpose     : Defines Operations database models
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/models/operations.py
# PURPOSE: SQLAlchemy database model definitions for persistent ERP data.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import datetime
import uuid

from sqlalchemy import Column, DateTime, JSON, String, Text

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class OperationRecord(Base):
    __tablename__ = "operation_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    module = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="open", index=True)
    priority = Column(String, nullable=True)
    assigned_to_id = Column(String, nullable=True)
    related_user_id = Column(String, nullable=True)
    related_branch_id = Column(String, nullable=True)
    amount = Column(String, nullable=True)
    due_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    payload = Column(JSON, nullable=True)
    created_by_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
