"""
PINESPHERE ERP
Module      : Trainer Portal — Batch Module
File        : batch.py
Purpose     : Defines Batch, BatchTrainerAssignment, and BatchStudentEnrollment
              database models for the Trainer Portal.
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

from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# PURPOSE:
# This section defines database table structures.
# Each model maps Python objects to rows stored by the database.
# =====================================================

class Batch(Base):
    """A training batch — a cohort of students under a course, branch, and trainer(s)."""

    __tablename__ = "batches"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    branch_id = Column(String, ForeignKey("branches.id"), nullable=False, index=True)
    course_id = Column(String, ForeignKey("courses.id"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    schedule = Column(JSON, nullable=True, default=dict)
    status = Column(String, default="active", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("Branch")
    course = relationship("Course")
    trainers = relationship(
        "BatchTrainerAssignment",
        cascade="all, delete-orphan",
        back_populates="batch",
    )
    students = relationship(
        "BatchStudentEnrollment",
        cascade="all, delete-orphan",
        back_populates="batch",
    )


class BatchTrainerAssignment(Base):
    """Junction table linking trainers to batches (many-to-many)."""

    __tablename__ = "batch_trainer_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, index=True)
    trainer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    batch = relationship("Batch", back_populates="trainers")
    trainer = relationship("User", foreign_keys=[trainer_id])

    __table_args__ = (
        UniqueConstraint("batch_id", "trainer_id", name="uq_batch_trainer"),
    )


class BatchStudentEnrollment(Base):
    """Junction table linking students to batches (many-to-many)."""

    __tablename__ = "batch_student_enrollments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False, index=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active", index=True)

    # Relationships
    batch = relationship("Batch", back_populates="students")
    student = relationship("User", foreign_keys=[student_id])

    __table_args__ = (
        UniqueConstraint("batch_id", "student_id", name="uq_batch_student"),
    )