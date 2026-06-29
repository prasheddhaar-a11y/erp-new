"""
PINESPHERE ERP
Module      : Admission Module
File        : admission.py
Purpose     : Defines Admission database models
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

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, Numeric
from sqlalchemy.orm import relationship

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Admission(Base):
    __tablename__ = "admissions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    student_name = Column(String, nullable=False, index=True)
    course_interest = Column(String, nullable=True)
    phone = Column(String, nullable=False, index=True)
    email = Column(String, nullable=True)
    counsellor_id = Column(String, ForeignKey("users.id"), nullable=True)
    branch_id = Column(String, nullable=True, index=True)
    stage = Column(String, default="Counselling", index=True)
    expected_fee = Column(Numeric(10, 2), nullable=True)
    fee_collected = Column(Numeric(10, 2), default=0)
    score = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    counsellor = relationship("User", foreign_keys=[counsellor_id])
