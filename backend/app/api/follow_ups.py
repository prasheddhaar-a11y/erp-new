from datetime import datetime, timedelta
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth.dependencies import require_roles
from app.core.roles import UserRole

router = APIRouter(prefix="/follow-ups", tags=["Follow Ups"])


class FollowUpPayload(BaseModel):
    id: str | None = None
    studentName: str
    course: str
    followUpAt: str
    communicationType: str = "Call"
    priority: str = "Medium"
    status: str = "upcoming"
    leadStatus: str = "New"
    counsellor: str = "Counsellor"
    notes: str | None = None
    history: list[str] = []
    branch_id: str | None = None
    counsellor_id: str | None = None


FOLLOW_UPS: dict[str, FollowUpPayload] = {}

BRANCH_FOLLOWUP_SAMPLES = {
    "kochi": [
        ("Meera Nair", "Full Stack Development", "today", "High"),
        ("Arjun Menon", "Data Science", "upcoming", "Medium"),
    ],
    "chennai": [
        ("Ananya Raman", "Java Full Stack", "today", "High"),
        ("Karthik Subramanian", "Cloud Computing", "upcoming", "Medium"),
    ],
    "madurai": [
        ("Harini Pandian", "Python Full Stack", "today", "High"),
        ("Vignesh Kumar", "Digital Marketing", "upcoming", "Medium"),
    ],
    "coimbatore": [
        ("Sanjay Krishnan", "MERN Stack", "today", "High"),
        ("Aishwarya Devi", "Cyber Security", "upcoming", "Medium"),
    ],
}


def _seed_followups() -> None:
    if FOLLOW_UPS:
        return
    now = datetime.utcnow()
    for branch_id, samples in BRANCH_FOLLOWUP_SAMPLES.items():
        for index, (student_name, course, status, priority) in enumerate(samples, start=1):
            follow_up_at = now if status == "today" else now + timedelta(days=index)
            follow_up_id = f"FU-{branch_id.upper()}-{index:03d}"
            FOLLOW_UPS[follow_up_id] = FollowUpPayload(
                id=follow_up_id,
                studentName=student_name,
                course=course,
                followUpAt=follow_up_at.isoformat(),
                status=status,
                priority=priority,
                communicationType="WhatsApp" if index == 2 else "Call",
                counsellor=f"{branch_id.title()} Counsellor",
                branch_id=branch_id,
                counsellor_id=None,
                notes=f"{branch_id.title()} branch follow-up sample.",
                history=["Branch follow-up created"],
            )


def _visible_items(current_user):
    _seed_followups()
    items = list(FOLLOW_UPS.values())
    if current_user.role == UserRole.SUPER_ADMIN:
        return items
    items = [item for item in items if item.branch_id == current_user.branch_id]
    if current_user.role == UserRole.COUNSELLOR:
        items = [item for item in items if item.counsellor_id in (None, current_user.id)]
    return items


def _get_scoped_follow_up(follow_up_id: str, current_user) -> FollowUpPayload:
    _seed_followups()
    if follow_up_id not in FOLLOW_UPS:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    item = FOLLOW_UPS[follow_up_id]
    if current_user.role != UserRole.SUPER_ADMIN and item.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to access this follow-up")
    if current_user.role == UserRole.COUNSELLOR and item.counsellor_id not in (None, current_user.id):
        raise HTTPException(status_code=403, detail="Not allowed to access this follow-up")
    return item


def _apply_scope(body: FollowUpPayload, current_user) -> FollowUpPayload:
    if current_user.role != UserRole.SUPER_ADMIN:
        body.branch_id = current_user.branch_id
    if current_user.role == UserRole.COUNSELLOR:
        body.counsellor_id = current_user.id
        body.counsellor = current_user.full_name
    return body


@router.get("")
def list_follow_ups(current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    return _visible_items(current_user)


@router.post("")
def create_follow_up(body: FollowUpPayload, current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    follow_up_id = body.id or f"FU-{uuid4().hex[:8].upper()}"
    body.id = follow_up_id
    body = _apply_scope(body, current_user)
    body.history = [*body.history, "Follow-up created"]
    FOLLOW_UPS[follow_up_id] = body
    return body


@router.patch("/{follow_up_id}")
def update_follow_up(follow_up_id: str, body: FollowUpPayload, current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    existing = _get_scoped_follow_up(follow_up_id, current_user)
    body.id = follow_up_id
    body.branch_id = existing.branch_id
    body.counsellor_id = existing.counsellor_id
    body.counsellor = existing.counsellor
    body.history = [*existing.history, *body.history, "Follow-up updated"]
    FOLLOW_UPS[follow_up_id] = body
    return body


@router.patch("/{follow_up_id}/complete")
def complete_follow_up(follow_up_id: str, current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    item = _get_scoped_follow_up(follow_up_id, current_user)
    item.status = "completed"
    item.history = [*item.history, "Follow-up completed"]
    return item


@router.get("/{follow_up_id}/history")
def get_follow_up_history(follow_up_id: str, current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    item = _get_scoped_follow_up(follow_up_id, current_user)
    return {"id": follow_up_id, "history": item.history}


@router.get("/notifications/reminders")
def notification_reminders(current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR))):
    return [item for item in _visible_items(current_user) if item.status in {"today", "overdue", "upcoming"}]
