"""
PINESPHERE ERP
Module      : Trainer Models
File        : trainer.py
Purpose     : Defines trainer-related database models.
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

class TrainerLessonMaterial(Base):
    __tablename__ = "trainer_lesson_materials"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Ownership and linking
    course_id = Column(
        String,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    lesson_id = Column(
        String,
        ForeignKey("lessons.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    trainer_id = Column(
        String,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # File metadata
    filename = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_size = Column(Integer, nullable=True)
    content_type = Column(String, default="pdf", nullable=False)
    download_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    course = relationship("Course")
    lesson = relationship("Lesson")
    trainer = relationship("User")


class TrainerTask(Base):
    """A task assigned to a trainer - visible on the trainer dashboard."""

    __tablename__ = "trainer_tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trainer_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True, index=True)
    status = Column(String, default="pending", index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    trainer = relationship("User", foreign_keys=[trainer_id])
