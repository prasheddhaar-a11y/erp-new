"""
PINESPHERE ERP
Module      : Admission Module
File        : admissions.py
Purpose     : Defines Admission API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.admission import Admission
from app.schemas.admission import AdmissionCreate, AdmissionResponse, AdmissionUpdate
from app.services.history import add_history
from app.services.email import send_admission_email

router = APIRouter(prefix="/admissions", tags=["Admissions"])


@router.get("", response_model=list[AdmissionResponse])
def list_admissions(
    stage: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
        )
    ),
):
    query = db.query(Admission).order_by(Admission.created_at.desc())

    if stage:
        query = query.filter(Admission.stage == stage)

    if current_user.role != UserRole.SUPER_ADMIN:
        query = query.filter(Admission.branch_id == current_user.branch_id)

    if current_user.role == UserRole.COUNSELLOR:
        query = query.filter(Admission.counsellor_id == current_user.id)

    return query.limit(500).all()


@router.post("", response_model=AdmissionResponse)
def create_admission(
    body: AdmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
        )
    ),
):
    admission = Admission(**body.dict())

    if current_user.role == UserRole.COUNSELLOR:
        admission.counsellor_id = current_user.id
        if not admission.branch_id:
            admission.branch_id = current_user.branch_id
    elif current_user.role == UserRole.BRANCH_ADMIN:
        if not admission.branch_id:
            admission.branch_id = current_user.branch_id

    db.add(admission)
    db.flush()
    add_history(
        db,
        module="admissions",
        action="created",
        title=f"Admission added: {admission.student_name}",
        details=f"Course: {admission.course_interest or '-'} | Stage: {admission.stage}",
        record_id=admission.id,
        created_by_id=current_user.id,
        branch_id=admission.branch_id,
    )
    db.commit()
    db.refresh(admission)

    if admission.email:
        background_tasks.add_task(
            send_admission_email,
            to_email=admission.email,
            full_name=admission.student_name,
            course_interest=admission.course_interest,
        )

    return admission


@router.get("/{admission_id}", response_model=AdmissionResponse)
def get_admission(
    admission_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    admission = db.query(Admission).filter(Admission.id == admission_id).first()

    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")

    if current_user.role != UserRole.SUPER_ADMIN and admission.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to view this admission")

    return admission


@router.patch("/{admission_id}", response_model=AdmissionResponse)
def update_admission(
    admission_id: str,
    body: AdmissionUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_roles(
            UserRole.SUPER_ADMIN,
            UserRole.BRANCH_ADMIN,
            UserRole.COUNSELLOR,
        )
    ),
):
    admission = db.query(Admission).filter(Admission.id == admission_id).first()

    if not admission:
        raise HTTPException(status_code=404, detail="Admission not found")

    if current_user.role != UserRole.SUPER_ADMIN and admission.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to update this admission")

    for key, value in body.dict(exclude_unset=True).items():
        setattr(admission, key, value)

    add_history(
        db,
        module="admissions",
        action="updated",
        title=f"Admission updated: {admission.student_name}",
        details=f"Stage: {admission.stage} | Score: {admission.score}",
        record_id=admission.id,
        created_by_id=current_user.id,
        branch_id=admission.branch_id,
    )
    db.commit()
    db.refresh(admission)
    return admission
