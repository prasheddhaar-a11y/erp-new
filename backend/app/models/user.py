"""
PINESPHERE ERP
Module      : Users Module
File        : user.py
Purpose     : Defines User database models
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

from datetime import date, datetime
import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Enum as SAEnum, String, Text

from app.core.roles import UserRole
from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, unique=True, nullable=True)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    role_abbreviation = Column(String(2), nullable=True)
    branch_id = Column(String, nullable=True)
    franchise_id = Column(String, nullable=True, index=True)
    is_active = Column(Boolean, default=True)
    profile_photo = Column(Text, nullable=True)
    display_code = Column(String, unique=True, nullable=True, index=True)
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime, nullable=True)
    invite_token_hash = Column(String, nullable=True, unique=True, index=True)
    invite_sent_at = Column(DateTime, nullable=True)
    invite_expires_at = Column(DateTime, nullable=True)
    invite_accepted_at = Column(DateTime, nullable=True)
    invite_status = Column(String, nullable=True, index=True)
    failed_login_attempts = Column(String, default="0")
    locked_until = Column(DateTime, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    parent_name = Column(String, nullable=True)
    parent_phone = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    course_enrolled = Column(String, nullable=True)
    batch_name = Column(String, nullable=True)
    trainer_name = Column(String, nullable=True)
    student_status = Column(String, default="active", index=True)
    document_status = Column(String, default="pending")
    admission_date = Column(Date, nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
