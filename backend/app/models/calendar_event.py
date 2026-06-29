"""
PINESPHERE ERP
Module      : Calendar Management
File        : calendar_event.py
Purpose     : Defines CalendarEvent database model
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from datetime import datetime
import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


# =====================================================
# SECTION: DATABASE MODELS
# =====================================================

class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id            = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title         = Column(String, nullable=False, index=True)
    description   = Column(Text, nullable=True)

    # Date & Time
    start_time    = Column(DateTime, nullable=False)
    end_time      = Column(DateTime, nullable=False)
    all_day       = Column(Boolean, default=False)

    # Event type — determines color on calendar
    # follow_up / demo_class / meeting / counselling_session / task / other
    event_type    = Column(String, default="meeting", index=True)

    # Status
    # scheduled / completed / cancelled / rescheduled
    status        = Column(String, default="scheduled", index=True)

    # Location (physical or online link)
    location      = Column(String, nullable=True)

    # Links to lead or student (optional)
    linked_type   = Column(String, default="none")   # lead / student / none
    linked_id     = Column(String, nullable=True)
    linked_name   = Column(String, nullable=True)

    # Reminder
    reminder_at   = Column(DateTime, nullable=True)
    reminder_sent = Column(Boolean, default=False)

    # Notes after event
    notes         = Column(Text, nullable=True)

    # Ownership
    created_by    = Column(String, ForeignKey("users.id"), nullable=True)
    assigned_to   = Column(String, ForeignKey("users.id"), nullable=True)
    branch_id     = Column(String, nullable=True, index=True)

    created_at    = Column(DateTime, default=datetime.utcnow)
    updated_at    = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    creator       = relationship("User", foreign_keys=[created_by])
    assignee      = relationship("User", foreign_keys=[assigned_to])