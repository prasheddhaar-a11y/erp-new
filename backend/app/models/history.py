"""
PINESPHERE ERP
Module      : Backend Platform
File        : history.py
Purpose     : Defines History database models
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
import uuid

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class HistoryEvent(Base):
    __tablename__ = "history_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    module = Column(String, nullable=False, index=True)
    action = Column(String, nullable=False)
    title = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    record_id = Column(String, nullable=True, index=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    branch_id = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    created_by = relationship("User", foreign_keys=[created_by_id])
