"""
PINESPHERE ERP
Module      : Communication Module
File        : communication.py
Purpose     : Defines Communication database models
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from datetime import datetime
import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.database import Base


class CommunicationTemplate(Base):
    __tablename__ = "communication_templates"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, index=True)
    channel = Column(String, nullable=False, index=True)
    category = Column(String, nullable=True, index=True)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    branch_id = Column(String, nullable=True, index=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    creator = relationship("User", foreign_keys=[created_by])
    logs = relationship("CommunicationLog", back_populates="template")


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    channel = Column(String, nullable=False, index=True)
    recipient_name = Column(String, nullable=False, index=True)
    recipient_phone = Column(String, nullable=True, index=True)
    recipient_email = Column(String, nullable=True, index=True)
    subject = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, default="pending", index=True)
    related_type = Column(String, nullable=True, index=True)
    related_id = Column(String, nullable=True, index=True)
    template_id = Column(String, ForeignKey("communication_templates.id"), nullable=True, index=True)
    branch_id = Column(String, nullable=True, index=True)
    counsellor_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    initiated_by = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    failed_reason = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    template = relationship("CommunicationTemplate", back_populates="logs")
    counsellor = relationship("User", foreign_keys=[counsellor_id])
    creator = relationship("User", foreign_keys=[initiated_by])


class CommunicationAnalytics(Base):
    __tablename__ = "communication_analytics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    metric_date = Column(Date, nullable=False, index=True)
    channel = Column(String, nullable=False, index=True)
    branch_id = Column(String, nullable=True, index=True)
    counsellor_id = Column(String, nullable=True, index=True)
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    read_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    pending_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
