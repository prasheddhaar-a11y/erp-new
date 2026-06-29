"""
PINESPHERE ERP
Module      : Task Management
File        : task.py (schemas)
Purpose     : Defines Task Pydantic request/response schemas
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# =====================================================
# SECTION: REQUEST SCHEMAS
# =====================================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None          # ISO string from frontend
    priority: str = "Medium"                # Low / Medium / High / Urgent
    category: str = "Admin"                 # Call / Follow-up / Demo / Admin / Other
    status: str = "pending"                 # pending / in_progress / completed / overdue
    linked_type: str = "none"               # lead / student / none
    linked_id: Optional[str] = None
    linked_name: Optional[str] = None
    assigned_to: Optional[str] = None
    branch_id: Optional[str] = None
    reminder_at: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    linked_type: Optional[str] = None
    linked_id: Optional[str] = None
    linked_name: Optional[str] = None
    assigned_to: Optional[str] = None
    branch_id: Optional[str] = None
    reminder_at: Optional[str] = None


class TaskAssign(BaseModel):
    assigned_to: str


# =====================================================
# SECTION: RESPONSE SCHEMAS
# =====================================================

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: str
    category: str
    status: str
    linked_type: str
    linked_id: Optional[str] = None
    linked_name: Optional[str] = None
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    created_by: Optional[str] = None
    branch_id: Optional[str] = None
    reminder_at: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class TaskKPIResponse(BaseModel):
    pending: int
    in_progress: int
    completed: int
    overdue: int
    due_today: int
    total: int