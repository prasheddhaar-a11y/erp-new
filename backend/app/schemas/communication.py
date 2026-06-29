"""
PINESPHERE ERP
Module      : Communication Module
File        : communication.py
Purpose     : Defines Communication request and response schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr


CommunicationChannel = Literal["call", "whatsapp", "email", "sms"]


class CommunicationLogCreate(BaseModel):
    channel: CommunicationChannel
    recipient_name: str
    recipient_phone: str | None = None
    recipient_email: EmailStr | None = None
    subject: str | None = None
    message: str | None = None
    status: str = "pending"
    related_type: str | None = None
    related_id: str | None = None
    template_id: str | None = None
    branch_id: str | None = None
    counsellor_id: str | None = None
    notes: str | None = None
    failed_reason: str | None = None


class CommunicationLogUpdate(BaseModel):
    status: str | None = None
    subject: str | None = None
    message: str | None = None
    related_type: str | None = None
    related_id: str | None = None
    template_id: str | None = None
    branch_id: str | None = None
    counsellor_id: str | None = None
    notes: str | None = None
    failed_reason: str | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None
    read_at: datetime | None = None


class CommunicationTemplateCreate(BaseModel):
    name: str
    channel: CommunicationChannel
    category: str | None = None
    subject: str | None = None
    body: str
    branch_id: str | None = None
    is_active: bool = True


class CommunicationTemplateUpdate(BaseModel):
    name: str | None = None
    channel: CommunicationChannel | None = None
    category: str | None = None
    subject: str | None = None
    body: str | None = None
    branch_id: str | None = None
    is_active: bool | None = None


class CommunicationLogResponse(BaseModel):
    id: str
    channel: str
    recipient_name: str
    recipient_phone: str | None = None
    recipient_email: str | None = None
    subject: str | None = None
    message: str | None = None
    status: str
    related_type: str | None = None
    related_id: str | None = None
    template_id: str | None = None
    template_name: str | None = None
    branch_id: str | None = None
    counsellor_id: str | None = None
    initiated_by: str | None = None
    notes: str | None = None
    failed_reason: str | None = None
    sent_at: datetime | None = None
    delivered_at: datetime | None = None
    read_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    timeline: list[dict[str, str]]

    class Config:
        from_attributes = True


class CommunicationTemplateResponse(BaseModel):
    id: str
    name: str
    channel: str
    category: str | None = None
    subject: str | None = None
    body: str
    branch_id: str | None = None
    created_by: str | None = None
    is_active: bool
    usage_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CommunicationAnalyticsResponse(BaseModel):
    total_communications: int
    sent: int
    delivered: int
    read: int
    failed: int
    pending: int
    by_channel: list[dict[str, int | str]]
    recent_communications: list[CommunicationLogResponse]
    templates: list[CommunicationTemplateResponse]


class CommunicationQueryParams(BaseModel):
    search: str | None = None
    channel: str | None = None
    status: str | None = None
    branch_id: str | None = None
    counsellor_id: str | None = None
    start_date: date | None = None
    end_date: date | None = None
