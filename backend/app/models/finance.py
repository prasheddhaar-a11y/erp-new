"""
PINESPHERE ERP
Module      : Fees Module
File        : finance.py
Purpose     : Defines Finance database models
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

from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_number = Column(String, unique=True, nullable=False, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    branch_id = Column(String, nullable=True, index=True)
    course_name = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0)
    status = Column(String, default="unpaid", index=True)
    due_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    student = relationship("User", foreign_keys=[student_id])
    payments = relationship("Payment", cascade="all, delete-orphan", back_populates="invoice")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, default="cash")
    reference_number = Column(String, nullable=True)
    paid_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)

    invoice = relationship("Invoice", back_populates="payments")
    student = relationship("User", foreign_keys=[student_id])