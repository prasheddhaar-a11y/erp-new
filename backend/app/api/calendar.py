"""
PINESPHERE ERP
Module      : Calendar Management
File        : calendar.py
Purpose     : Calendar API endpoints — CRUD, KPIs, agenda, reminders
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.calendar_event import CalendarEvent
from app.schemas.calendar_event import (
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventResponse,
    CalendarKPIResponse,
    DailyAgendaResponse,
)

router = APIRouter(prefix="/calendar", tags=["Calendar"])


# =====================================================
# SECTION: HELPER
# =====================================================

def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _serialize(event: CalendarEvent) -> CalendarEventResponse:
    assignee_name = None
    if event.assignee:
        assignee_name = (
            getattr(event.assignee, "full_name", None)
            or getattr(event.assignee, "email", None)
        )

    return CalendarEventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        start_time=event.start_time.isoformat() if event.start_time else "",
        end_time=event.end_time.isoformat() if event.end_time else "",
        all_day=event.all_day or False,
        event_type=event.event_type or "meeting",
        status=event.status or "scheduled",
        location=event.location,
        linked_type=event.linked_type or "none",
        linked_id=event.linked_id,
        linked_name=event.linked_name,
        reminder_at=event.reminder_at.isoformat() if event.reminder_at else None,
        reminder_sent=event.reminder_sent or False,
        notes=event.notes,
        created_by=event.created_by,
        assigned_to=event.assigned_to,
        assignee_name=assignee_name,
        branch_id=event.branch_id,
        created_at=event.created_at.isoformat() if event.created_at else datetime.utcnow().isoformat(),
        updated_at=event.updated_at.isoformat() if event.updated_at else datetime.utcnow().isoformat(),
    )


# =====================================================
# SECTION: KPI ENDPOINT
# =====================================================

@router.get("/kpis", response_model=CalendarKPIResponse)
def get_calendar_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    today = date.today()
    week_end = today + timedelta(days=7)
    all_events = db.query(CalendarEvent).all()

    scheduled = sum(1 for e in all_events if e.status == "scheduled")
    completed = sum(1 for e in all_events if e.status == "completed")
    cancelled = sum(1 for e in all_events if e.status == "cancelled")
    today_events = sum(
        1 for e in all_events
        if e.start_time and e.start_time.date() == today
    )
    upcoming_this_week = sum(
        1 for e in all_events
        if e.start_time
        and today <= e.start_time.date() <= week_end
        and e.status == "scheduled"
    )

    return CalendarKPIResponse(
        total=len(all_events),
        scheduled=scheduled,
        completed=completed,
        cancelled=cancelled,
        today_events=today_events,
        upcoming_this_week=upcoming_this_week,
    )


# =====================================================
# SECTION: DAILY AGENDA
# =====================================================

@router.get("/agenda/today", response_model=DailyAgendaResponse)
def get_today_agenda(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    today = date.today()
    events = db.query(CalendarEvent).all()
    today_events = [
        _serialize(e) for e in events
        if e.start_time and e.start_time.date() == today
    ]
    today_events.sort(key=lambda e: e.start_time)
    return DailyAgendaResponse(date=today.isoformat(), events=today_events)


@router.get("/agenda", response_model=DailyAgendaResponse)
def get_agenda_by_date(
    date_str: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    try:
        target_date = date.fromisoformat(date_str)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    events = db.query(CalendarEvent).all()
    day_events = [
        _serialize(e) for e in events
        if e.start_time and e.start_time.date() == target_date
    ]
    day_events.sort(key=lambda e: e.start_time)
    return DailyAgendaResponse(date=date_str, events=day_events)


# =====================================================
# SECTION: REMINDERS ENDPOINT
# =====================================================

@router.get("/reminders", response_model=list[CalendarEventResponse])
def get_event_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    now = datetime.utcnow()
    events = db.query(CalendarEvent).all()
    reminders = [
        _serialize(e) for e in events
        if e.reminder_at
        and e.reminder_at <= now
        and not e.reminder_sent
        and e.status == "scheduled"
    ]
    return reminders


# =====================================================
# SECTION: LIST EVENTS
# =====================================================

@router.get("", response_model=list[CalendarEventResponse])
def list_events(
    event_type: str | None = None,
    status: str | None = None,
    start_date: str | None = None,   # YYYY-MM-DD
    end_date: str | None = None,     # YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    query = db.query(CalendarEvent)

    if event_type:
        query = query.filter(CalendarEvent.event_type == event_type)
    if status:
        query = query.filter(CalendarEvent.status == status)
    if start_date:
        try:
            sd = datetime.fromisoformat(start_date)
            query = query.filter(CalendarEvent.start_time >= sd)
        except Exception:
            pass
    if end_date:
        try:
            ed = datetime.fromisoformat(end_date)
            query = query.filter(CalendarEvent.start_time <= ed)
        except Exception:
            pass

    events = query.order_by(CalendarEvent.start_time.asc()).all()
    return [_serialize(e) for e in events]


# =====================================================
# SECTION: CREATE EVENT
# =====================================================

@router.post("", response_model=CalendarEventResponse)
def create_event(
    body: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    start = _parse_dt(body.start_time)
    end = _parse_dt(body.end_time)

    if not start or not end:
        raise HTTPException(status_code=400, detail="start_time and end_time are required")
    if end <= start:
        raise HTTPException(status_code=400, detail="end_time must be after start_time")

    event = CalendarEvent(
        title=body.title,
        description=body.description,
        start_time=start,
        end_time=end,
        all_day=body.all_day or False,
        event_type=body.event_type or "meeting",
        status=body.status or "scheduled",
        location=body.location,
        linked_type=body.linked_type or "none",
        linked_id=body.linked_id,
        linked_name=body.linked_name,
        reminder_at=_parse_dt(body.reminder_at),
        notes=body.notes,
        assigned_to=body.assigned_to,
        created_by=getattr(current_user, "id", None),
        branch_id=body.branch_id,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return _serialize(event)


# =====================================================
# SECTION: GET SINGLE EVENT
# =====================================================

@router.get("/{event_id}", response_model=CalendarEventResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return _serialize(event)


# =====================================================
# SECTION: UPDATE EVENT
# =====================================================

@router.patch("/{event_id}", response_model=CalendarEventResponse)
def update_event(
    event_id: str,
    body: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if body.title is not None:
        event.title = body.title
    if body.description is not None:
        event.description = body.description
    if body.start_time is not None:
        event.start_time = _parse_dt(body.start_time)
    if body.end_time is not None:
        event.end_time = _parse_dt(body.end_time)
    if body.all_day is not None:
        event.all_day = body.all_day
    if body.event_type is not None:
        event.event_type = body.event_type
    if body.status is not None:
        event.status = body.status
    if body.location is not None:
        event.location = body.location
    if body.linked_type is not None:
        event.linked_type = body.linked_type
    if body.linked_id is not None:
        event.linked_id = body.linked_id
    if body.linked_name is not None:
        event.linked_name = body.linked_name
    if body.reminder_at is not None:
        event.reminder_at = _parse_dt(body.reminder_at)
    if body.notes is not None:
        event.notes = body.notes
    if body.assigned_to is not None:
        event.assigned_to = body.assigned_to
    if body.branch_id is not None:
        event.branch_id = body.branch_id

    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    return _serialize(event)


# =====================================================
# SECTION: DELETE EVENT
# =====================================================

@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully", "id": event_id}


# =====================================================
# SECTION: COMPLETE EVENT
# =====================================================

@router.patch("/{event_id}/complete", response_model=CalendarEventResponse)
def complete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = "completed"
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    return _serialize(event)


# =====================================================
# SECTION: CANCEL EVENT
# =====================================================

@router.patch("/{event_id}/cancel", response_model=CalendarEventResponse)
def cancel_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    event = db.query(CalendarEvent).filter(CalendarEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    event.status = "cancelled"
    event.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(event)
    return _serialize(event)