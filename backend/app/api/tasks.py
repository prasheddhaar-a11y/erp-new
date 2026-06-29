"""
PINESPHERE ERP
Module      : Task Management
File        : tasks.py
Purpose     : Task API endpoints — CRUD, complete, assign, reminders, KPIs
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.task import Task
from app.schemas.task import TaskAssign, TaskCreate, TaskKPIResponse, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])


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


def _serialize(task: Task) -> TaskResponse:
    assignee_name = None
    if task.assignee:
        assignee_name = getattr(task.assignee, "full_name", None) or getattr(task.assignee, "email", None)

    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        due_date=task.due_date.isoformat() if task.due_date else None,
        priority=task.priority,
        category=task.category,
        status=task.status,
        linked_type=task.linked_type,
        linked_id=task.linked_id,
        linked_name=task.linked_name,
        assigned_to=task.assigned_to,
        assignee_name=assignee_name,
        created_by=task.created_by,
        branch_id=task.branch_id,
        reminder_at=task.reminder_at.isoformat() if task.reminder_at else None,
        created_at=task.created_at.isoformat() if task.created_at else datetime.utcnow().isoformat(),
        updated_at=task.updated_at.isoformat() if task.updated_at else datetime.utcnow().isoformat(),
    )


# =====================================================
# SECTION: KPI ENDPOINT
# =====================================================

@router.get("/kpis", response_model=TaskKPIResponse)
def get_task_kpis(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    today = date.today()
    all_tasks = db.query(Task).all()

    pending = sum(1 for t in all_tasks if t.status == "pending")
    in_progress = sum(1 for t in all_tasks if t.status == "in_progress")
    completed = sum(1 for t in all_tasks if t.status == "completed")
    overdue = sum(1 for t in all_tasks if t.status == "overdue")
    due_today = sum(
        1 for t in all_tasks
        if t.due_date and t.due_date.date() == today and t.status not in ("completed",)
    )

    return TaskKPIResponse(
        pending=pending,
        in_progress=in_progress,
        completed=completed,
        overdue=overdue,
        due_today=due_today,
        total=len(all_tasks),
    )


# =====================================================
# SECTION: REMINDERS ENDPOINT
# =====================================================

@router.get("/reminders")
def get_task_reminders(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    today = date.today()
    tasks = db.query(Task).all()
    reminders = [
        _serialize(t) for t in tasks
        if t.status in ("pending", "in_progress", "overdue")
        or (t.due_date and t.due_date.date() == today)
    ]
    return reminders


# =====================================================
# SECTION: LIST TASKS
# =====================================================

@router.get("", response_model=list[TaskResponse])
def list_tasks(
    status: str | None = None,
    priority: str | None = None,
    category: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)
    tasks = query.order_by(Task.created_at.desc()).all()
    return [_serialize(t) for t in tasks]


# =====================================================
# SECTION: CREATE TASK
# =====================================================

@router.post("", response_model=TaskResponse)
def create_task(
    body: TaskCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    task = Task(
        title=body.title,
        description=body.description,
        due_date=_parse_dt(body.due_date),
        priority=body.priority,
        category=body.category,
        status=body.status,
        linked_type=body.linked_type,
        linked_id=body.linked_id,
        linked_name=body.linked_name,
        assigned_to=body.assigned_to,
        created_by=getattr(current_user, "id", None),
        branch_id=body.branch_id,
        reminder_at=_parse_dt(body.reminder_at),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return _serialize(task)


# =====================================================
# SECTION: UPDATE TASK
# =====================================================

@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    body: TaskUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if body.title is not None:
        task.title = body.title
    if body.description is not None:
        task.description = body.description
    if body.due_date is not None:
        task.due_date = _parse_dt(body.due_date)
    if body.priority is not None:
        task.priority = body.priority
    if body.category is not None:
        task.category = body.category
    if body.status is not None:
        task.status = body.status
    if body.linked_type is not None:
        task.linked_type = body.linked_type
    if body.linked_id is not None:
        task.linked_id = body.linked_id
    if body.linked_name is not None:
        task.linked_name = body.linked_name
    if body.assigned_to is not None:
        task.assigned_to = body.assigned_to
    if body.branch_id is not None:
        task.branch_id = body.branch_id
    if body.reminder_at is not None:
        task.reminder_at = _parse_dt(body.reminder_at)

    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return _serialize(task)


# =====================================================
# SECTION: DELETE TASK
# =====================================================

@router.delete("/{task_id}")
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully", "id": task_id}


# =====================================================
# SECTION: COMPLETE TASK
# =====================================================

@router.patch("/{task_id}/complete", response_model=TaskResponse)
def complete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.status = "completed"
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return _serialize(task)


# =====================================================
# SECTION: ASSIGN TASK
# =====================================================

@router.patch("/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: str,
    body: TaskAssign,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.assigned_to = body.assigned_to
    task.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(task)
    return _serialize(task)