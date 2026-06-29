"""
PINESPHERE ERP
Module      : Admission Module
File        : crm.py
Purpose     : Defines Crm API endpoints and request handling
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

from datetime import date, datetime, time

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.crm import Lead
from app.schemas.crm import CrmSummaryResponse, LeadAssignRequest, LeadCreate, LeadNoteRequest, LeadResponse, LeadStatusRequest, LeadUpdate
from app.services.history import add_history

router = APIRouter(prefix="/crm", tags=["CRM"])


def _get_scoped_lead(lead_id: str, db: Session, current_user) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role != UserRole.SUPER_ADMIN and lead.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to access this lead")
    if current_user.role == UserRole.COUNSELLOR and lead.counsellor_id not in (None, current_user.id):
        raise HTTPException(status_code=403, detail="Not allowed to access this lead")
    return lead


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.post("/public/enquiries", response_model=LeadResponse)
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def create_public_enquiry(body: LeadCreate, db: Session = Depends(get_db)):
    duplicate_filters = [Lead.phone == body.phone]
    if body.email:
        duplicate_filters.append(Lead.email == body.email)
    if db.query(Lead).filter(or_(*duplicate_filters)).first():
        raise HTTPException(status_code=409, detail="Enquiry already exists with this phone or email")

    lead = Lead(**body.dict(exclude={"counsellor_id"}))
    lead.counsellor_id = None
    db.add(lead)
    db.flush()
    add_history(
        db,
        module="crm",
        action="created",
        title=f"Public enquiry: {lead.student_name}",
        details=f"Phone: {lead.phone} | Course: {lead.course_interest or '-'} | Source: {lead.source} | Status: {lead.status}",
        record_id=lead.id,
        branch_id=lead.branch_id,
    )
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/leads", response_model=list[LeadResponse])
def list_leads(
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
        )
    ),
):
    query = db.query(Lead).order_by(Lead.created_at.desc())

    if status:
        query = query.filter(Lead.status == status)

    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Lead.branch_id == current_user.branch_id)

    if current_user.role == UserRole.COUNSELLOR:
        query = query.filter(Lead.counsellor_id == current_user.id)

    return query.limit(500).all()


@router.post("/leads", response_model=LeadResponse)
def create_lead(
    body: LeadCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
            UserRole.PUBLIC,
        )
    ),
):
    duplicate_filters = [Lead.phone == body.phone]
    if body.email:
        duplicate_filters.append(Lead.email == body.email)
    duplicate = db.query(Lead).filter(or_(*duplicate_filters)).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Lead already exists with this phone or email")

    lead = Lead(**body.dict())

    if current_user.role == UserRole.COUNSELLOR:
        lead.counsellor_id = current_user.id
        lead.branch_id = current_user.branch_id
    elif current_user.role == UserRole.BRANCH_ADMIN:
        lead.branch_id = current_user.branch_id
    elif current_user.role == UserRole.PUBLIC:
        lead.counsellor_id = None

    db.add(lead)
    db.flush()
    add_history(
        db,
        module="crm",
        action="created",
        title=f"Lead added: {lead.student_name}",
        details=f"Phone: {lead.phone} | Course: {lead.course_interest or '-'} | Source: {lead.source} | Status: {lead.status}",
        record_id=lead.id,
        created_by_id=current_user.id,
        branch_id=lead.branch_id,
    )
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if current_user.role != UserRole.SUPER_ADMIN and lead.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to view this lead")

    return lead


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    body: LeadUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,

        )
    ),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    if current_user.role != UserRole.SUPER_ADMIN and lead.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to update this lead")

    for key, value in body.dict(exclude_unset=True).items():
        setattr(lead, key, value)

    add_history(
        db,
        module="crm",
        action="updated",
        title=f"Lead updated: {lead.student_name}",
        details=f"Status: {lead.status} | Demo: {lead.demo_at or '-'} | Follow-up: {lead.next_follow_up_at or '-'} | Lost reason: {lead.lost_reason or '-'}",
        record_id=lead.id,
        created_by_id=current_user.id,
        branch_id=lead.branch_id,
    )
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/leads/{lead_id}/assign", response_model=LeadResponse)
def assign_lead(
    lead_id: str,
    body: LeadAssignRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    lead = _get_scoped_lead(lead_id, db, current_user)
    if body.counsellor_id is not None:
        lead.counsellor_id = body.counsellor_id
    if body.branch_id is not None and current_user.role == UserRole.SUPER_ADMIN:
        lead.branch_id = body.branch_id
    add_history(db, module="crm", action="assigned", title=f"Lead assigned: {lead.student_name}", details=f"Counsellor: {lead.counsellor_id or '-'}", record_id=lead.id, created_by_id=current_user.id, branch_id=lead.branch_id)
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/leads/{lead_id}/status", response_model=LeadResponse)
def change_lead_status(
    lead_id: str,
    body: LeadStatusRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    lead = _get_scoped_lead(lead_id, db, current_user)
    lead.status = body.status
    lead.lost_reason = body.lost_reason
    add_history(db, module="crm", action="status_changed", title=f"Lead status changed: {lead.student_name}", details=f"Status: {lead.status} | Lost reason: {lead.lost_reason or '-'}", record_id=lead.id, created_by_id=current_user.id, branch_id=lead.branch_id)
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/leads/{lead_id}/notes", response_model=LeadResponse)
def add_lead_note(
    lead_id: str,
    body: LeadNoteRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    lead = _get_scoped_lead(lead_id, db, current_user)
    stamped_note = f"[{datetime.utcnow().strftime('%Y-%m-%d %H:%M')}] {body.note.strip()}"
    lead.notes = f"{lead.notes}\n{stamped_note}" if lead.notes else stamped_note
    add_history(db, module="crm", action="note_added", title=f"Lead note added: {lead.student_name}", details=body.note.strip(), record_id=lead.id, created_by_id=current_user.id, branch_id=lead.branch_id)
    db.commit()
    db.refresh(lead)
    return lead


@router.delete("/leads/{lead_id}")
def delete_lead(
    lead_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role != UserRole.SUPER_ADMIN and lead.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to delete this lead")

    add_history(
        db,
        module="crm",
        action="deleted",
        title=f"Lead deleted: {lead.student_name}",
        details=f"Phone: {lead.phone} | Course: {lead.course_interest or '-'} | Status: {lead.status}",
        record_id=lead.id,
        created_by_id=current_user.id,
        branch_id=lead.branch_id,
    )
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully", "id": lead_id}


@router.get("/summary", response_model=CrmSummaryResponse)
def crm_summary(
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
        )
    ),
):
    today_start = datetime.combine(date.today(), time.min)
    today_end = datetime.combine(date.today(), time.max)

    query = db.query(Lead)

    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Lead.branch_id == current_user.branch_id)

    if current_user.role == UserRole.COUNSELLOR:
        query = query.filter(Lead.counsellor_id == current_user.id)

    total_leads = query.count()
    new_leads_today = query.filter(Lead.created_at >= today_start, Lead.created_at <= today_end).count()
    followups_pending = query.filter(Lead.status.in_(["new", "contacted", "follow_up"])).count()
    converted_leads = query.filter(Lead.status.in_(["converted", "enrolled"])).count()

    conversion_rate = round((converted_leads / total_leads) * 100, 2) if total_leads else 0

    return CrmSummaryResponse(
        total_leads=total_leads,
        new_leads_today=new_leads_today,
        followups_pending=followups_pending,
        converted_leads=converted_leads,
        conversion_rate=conversion_rate,
    )
