"""
PINESPHERE ERP
Module      : Calendar Management
File        : calendar_event.py  (schemas)
Purpose     : Pydantic schemas for CalendarEvent — request/response validation
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from typing import Optional
from pydantic import BaseModel


# =====================================================
# SECTION: REQUEST SCHEMAS
# =====================================================

class CalendarEventCreate(BaseModel):
    title:        str
    description:  Optional[str]  = None
    start_time:   str                        # ISO string e.g. "2026-06-10T10:00:00"
    end_time:     str                        # ISO string
    all_day:      Optional[bool] = False
    event_type:   Optional[str] = "meeting"  # follow_up / demo_class / meeting / counselling_session / task / other
    status:       Optional[str] = "scheduled"
    location:     Optional[str] = None
    linked_type:  Optional[str] = "none"
    linked_id:    Optional[str] = None
    linked_name:  Optional[str] = None
    reminder_at:  Optional[str] = None
    notes:        Optional[str] = None
    assigned_to:  Optional[str] = None
    branch_id:    Optional[str] = None


class CalendarEventUpdate(BaseModel):
    title:        Optional[str] = None
    description:  Optional[str] = None
    start_time:   Optional[str] = None
    end_time:     Optional[str] = None
    all_day:      Optional[bool] = None
    event_type:   Optional[str] = None
    status:       Optional[str] = None
    location:     Optional[str] = None
    linked_type:  Optional[str] = None
    linked_id:    Optional[str] = None
    linked_name:  Optional[str] = None
    reminder_at:  Optional[str] = None
    notes:        Optional[str] = None
    assigned_to:  Optional[str] = None
    branch_id:    Optional[str] = None


# =====================================================
# SECTION: RESPONSE SCHEMAS
# =====================================================

class CalendarEventResponse(BaseModel):
    id:            str
    title:         str
    description:   Optional[str]
    start_time:    str
    end_time:      str
    all_day:       bool
    event_type:    str
    status:        str
    location:      Optional[str]
    linked_type:   str
    linked_id:     Optional[str]
    linked_name:   Optional[str]
    reminder_at:   Optional[str]
    reminder_sent: bool
    notes:         Optional[str]
    created_by:    Optional[str]
    assigned_to:   Optional[str]
    assignee_name: Optional[str]
    branch_id:     Optional[str]
    created_at:    str
    updated_at:    str


class CalendarKPIResponse(BaseModel):
    total:                  int
    scheduled:              int
    completed:              int
    cancelled:              int
    today_events:           int
    upcoming_this_week:     int


class DailyAgendaResponse(BaseModel):
    date:   str
    events: list[CalendarEventResponse]