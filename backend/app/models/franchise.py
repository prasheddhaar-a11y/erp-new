"""
PINESPHERE ERP
Module      : Backend Platform
File        : franchise.py
Purpose     : Defines Franchise database models
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# ============================================================
# FILE: backend/app/models/franchise.py
# PURPOSE: SQLAlchemy models for franchise ownership, agreements, royalty, compliance, and alerts.
# ============================================================

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import datetime
import uuid

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, Text

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Franchise(Base):
    __tablename__ = "franchises"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    owner_name = Column(String, nullable=False)
    owner_email = Column(String, nullable=True)
    owner_phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    status = Column(String, nullable=False, default="active", index=True)
    royalty_percent = Column(Float, nullable=False, default=10)
    linked_branch_ids = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FranchiseAgreement(Base):
    __tablename__ = "franchise_agreements"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    franchise_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, default="active", index=True)
    renewal_date = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    pending_signatures = Column(Integer, default=0)
    uploaded_documents = Column(Integer, default=0)
    kyc_verified = Column(Boolean, default=False)
    gst_verified = Column(Boolean, default=False)
    audit_log = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FranchiseRoyaltyLedger(Base):
    __tablename__ = "franchise_royalty_ledger"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    franchise_id = Column(String, nullable=False, index=True)
    period = Column(String, nullable=False, index=True)
    gross_revenue = Column(Float, default=0)
    royalty_percent = Column(Float, default=0)
    royalty_amount = Column(Float, default=0)
    payment_status = Column(String, default="pending", index=True)
    due_date = Column(String, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FranchiseComplianceCheck(Base):
    __tablename__ = "franchise_compliance_checks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    franchise_id = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    score = Column(Float, default=0)
    status = Column(String, default="open", index=True)
    notes = Column(Text, nullable=True)
    evidence = Column(JSON, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow)


class FranchiseNotification(Base):
    __tablename__ = "franchise_notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    franchise_id = Column(String, nullable=True, index=True)
    title = Column(String, nullable=False)
    detail = Column(Text, nullable=False)
    severity = Column(String, default="info", index=True)
    action = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
