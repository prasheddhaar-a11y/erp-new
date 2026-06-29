"""
PINESPHERE ERP
Module      : Admission Module
File        : crm.py
Purpose     : Defines Crm database models
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

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Lead(Base):
    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_name = Column(String, nullable=False, index=True)
    parent_name = Column(String, nullable=True)
    phone = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)
    course_interest = Column(String, nullable=True)
    source = Column(String, default="walk-in")
    status = Column(String, default="new", index=True)
    score = Column(Integer, default=0)
    lost_reason = Column(String, nullable=True)
    demo_at = Column(DateTime, nullable=True)
    demo_mode = Column(String, nullable=True)
    demo_link = Column(String, nullable=True)
    demo_attended = Column(String, default="pending")
    branch_id = Column(String, nullable=True, index=True)
    counsellor_id = Column(String, ForeignKey("users.id"), nullable=True)
    next_follow_up_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    counsellor = relationship("User", foreign_keys=[counsellor_id])
