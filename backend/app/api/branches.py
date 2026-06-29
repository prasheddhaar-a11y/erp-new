"""
PINESPHERE ERP
Module      : Backend Platform
File        : branches.py
Purpose     : Defines Branches API endpoints and request handling
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

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.branch import Branch
from app.models.franchise import Franchise
from app.models.user import User
from app.schemas.branch import BranchComparisonResponse, BranchCreate, BranchResponse, BranchUpdate, CapacityReportResponse

router = APIRouter(prefix="/branches", tags=["Branches"])


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _visible_branches(db: Session, current_user: User):
    query = db.query(Branch)
    if current_user.role == UserRole.BRANCH_ADMIN:
        return query.filter(Branch.id == current_user.branch_id)
    if current_user.role == UserRole.FRANCHISE_OWNER:
        franchise_query = db.query(Franchise)
        if current_user.franchise_id:
            franchise_query = franchise_query.filter(Franchise.id == current_user.franchise_id)
        else:
            franchise_query = franchise_query.filter(Franchise.owner_email == current_user.email)
        branch_ids = {
            str(branch_id)
            for franchise in franchise_query.all()
            for branch_id in (franchise.linked_branch_ids or [])
            if branch_id
        }
        return query.filter(Branch.id.in_(branch_ids))
    return query


def _branch_stats(db: Session, branch: Branch) -> BranchComparisonResponse:
    users = db.query(User).filter(User.branch_id == branch.id).all()
    students = len([user for user in users if user.role == UserRole.STUDENT])
    staff = len([user for user in users if user.role != UserRole.STUDENT])
    utilization = round((students / branch.capacity) * 100, 2) if branch.capacity else 0
    return BranchComparisonResponse(id=branch.id, name=branch.name, code=branch.code, city=branch.city, capacity=branch.capacity or 0, students=students, staff=staff, total_users=len(users), utilization_percent=utilization, status=branch.status)


def _branch_stats_rows(db: Session, current_user: User) -> list[BranchComparisonResponse]:
    branches = _visible_branches(db, current_user).order_by(Branch.name.asc()).all()
    if not branches:
        return []

    branch_ids = [branch.id for branch in branches]
    count_rows = (
        db.query(User.branch_id, User.role, func.count(User.id))
        .filter(User.branch_id.in_(branch_ids))
        .group_by(User.branch_id, User.role)
        .all()
    )
    counts: dict[str, dict[str, int]] = {}
    for branch_id, role, total in count_rows:
        role_key = role.value if hasattr(role, "value") else str(role)
        counts.setdefault(branch_id, {})[role_key] = int(total or 0)

    rows = []
    for branch in branches:
        branch_counts = counts.get(branch.id, {})
        students = branch_counts.get(UserRole.STUDENT.value, 0)
        total_users = sum(branch_counts.values())
        staff = max(total_users - students, 0)
        capacity = branch.capacity or 0
        utilization = round((students / capacity) * 100, 2) if capacity else 0
        rows.append(
            BranchComparisonResponse(
                id=branch.id,
                name=branch.name,
                code=branch.code,
                city=branch.city,
                capacity=capacity,
                students=students,
                staff=staff,
                total_users=total_users,
                utilization_percent=utilization,
                status=branch.status,
            )
        )
    return rows


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("", response_model=list[BranchResponse])
def list_branches(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _visible_branches(db, current_user).order_by(Branch.name.asc()).all()


@router.post("", response_model=BranchResponse)
def create_branch(body: BranchCreate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    branch = Branch(**body.dict())
    db.add(branch)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Branch name or code already exists") from exc
    db.refresh(branch)
    return branch


@router.patch("/{branch_id}", response_model=BranchResponse)
def update_branch(branch_id: str, body: BranchUpdate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    for key, value in body.dict(exclude_unset=True).items():
        setattr(branch, key, value)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Branch name or code already exists") from exc
    db.refresh(branch)
    return branch


@router.delete("/{branch_id}")
def delete_branch(branch_id: str, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN))):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    has_users = db.query(User).filter(User.branch_id == branch.id).count()
    if has_users:
        raise HTTPException(status_code=400, detail="Move users out of this branch before deleting it")
    db.delete(branch)
    db.commit()
    return {"message": "Branch deleted successfully", "id": branch_id}


@router.get("/compare", response_model=list[BranchComparisonResponse])
def compare_branches(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRANCHISE_OWNER))):
    return _branch_stats_rows(db, current_user)


@router.get("/capacity-report", response_model=CapacityReportResponse)
def capacity_report(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.FRANCHISE_OWNER))):
    branch_rows = _branch_stats_rows(db, current_user)
    total_capacity = sum(branch.capacity for branch in branch_rows)
    total_students = sum(branch.students for branch in branch_rows)
    utilization = round((total_students / total_capacity) * 100, 2) if total_capacity else 0
    return CapacityReportResponse(total_capacity=total_capacity, total_students=total_students, utilization_percent=utilization, branches=branch_rows)
