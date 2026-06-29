"""
PINESPHERE ERP
Module      : Task Management
File        : task.py
Purpose     : Defines Task database model
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from datetime import datetime
import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# =====================================================

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(String, default="Medium")       # Low / Medium / High / Urgent
    category = Column(String, default="Admin")        # Call / Follow-up / Demo / Admin / Other
    status = Column(String, default="pending", index=True)  # pending / in_progress / completed / overdue
    linked_type = Column(String, default="none")      # lead / student / none
    linked_id = Column(String, nullable=True)
    linked_name = Column(String, nullable=True)
    assigned_to = Column(String, ForeignKey("users.id"), nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    branch_id = Column(String, nullable=True, index=True)
    reminder_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = relationship("User", foreign_keys=[assigned_to])
    creator = relationship("User", foreign_keys=[created_by])