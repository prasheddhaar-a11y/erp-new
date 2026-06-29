"""
PINESPHERE ERP
Module      : Services - Trainers Assignments
File        : assignments.py
Purpose     : Trainer-scoped assignment service functions.
              Uses assignment lesson records until dedicated assignment
              persistence is available.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.roles import UserRole
from app.models.lms import Course, Enrollment, Lesson
from app.models.user import User
from app.schemas.trainer import (
    TrainerAssignmentCreate,
    TrainerAssignmentDetail,
    TrainerAssignmentFeatureStatusItem,
    TrainerAssignmentItem,
    TrainerAssignmentSubmissionItem,
    TrainerAssignmentSummary,
    TrainerAssignmentUpdate,
    TrainerAssignmentsResponse,
)


FEATURE_STATUS = [
    TrainerAssignmentFeatureStatusItem(
        s_no=39,
        feature="Assignment Submission Portal",
        phase="Phase 5",
        status="Assignment records available",
    ),
    TrainerAssignmentFeatureStatusItem(
        s_no=99,
        feature="GitHub Repository Integration",
        phase="Phase 5",
        status="No repository records yet",
    ),
]


def _status_from_lesson(lesson: Lesson) -> str:
    return "draft" if lesson.is_preview else "published"


def _assignment_item(lesson: Lesson) -> TrainerAssignmentItem:
    course = lesson.course
    return TrainerAssignmentItem(
        id=lesson.id,
        title=lesson.title,
        batch=None,
        course=course.title if course else None,
        course_id=lesson.course_id,
        due_date=lesson.due_at.isoformat() if lesson.due_at else None,
        submitted=0,
        pending=0,
        status=_status_from_lesson(lesson),
        can_view_details=True,
        created_at=lesson.created_at.isoformat() if lesson.created_at else None,
        updated_at=None,
    )


def _assignment_detail(lesson: Lesson) -> TrainerAssignmentDetail:
    item = _assignment_item(lesson)
    return TrainerAssignmentDetail(
        **item.dict(),
        summary=lesson.summary,
        content=lesson.content,
        max_marks=lesson.max_marks or 0,
        assignment_url=lesson.assignment_url,
        github_repository_url=None,
    )


def _trainer_assignments_query(db: Session, trainer_id: str):
    return (
        db.query(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .filter(
            Lesson.content_type == "assignment",
            Course.trainer_id == trainer_id,
        )
    )


def _verify_course_ownership(db: Session, trainer_id: str, course_id: str) -> Course:
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.trainer_id == trainer_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Trainer course not found")
    return course


def _verify_active_trainer(db: Session, trainer_id: str) -> User:
    trainer = (
        db.query(User)
        .filter(
            User.id == trainer_id,
            User.role == UserRole.TRAINER,
            User.is_active == True,  # noqa: E712
        )
        .first()
    )
    if not trainer:
        raise HTTPException(status_code=403, detail="Active trainer access required")
    return trainer


def _clean_required(value: str | None, field_name: str) -> str:
    cleaned = value.strip() if isinstance(value, str) else ""
    if not cleaned:
        raise HTTPException(status_code=422, detail=f"{field_name} is required")
    return cleaned


def _validate_assignment_payload(
    course_id: str | None,
    title: str | None,
    batch_name: str | None,
    due_at,
    max_marks: int | None,
) -> tuple[str, str, str]:
    cleaned_course_id = _clean_required(course_id, "Course")
    cleaned_title = _clean_required(title, "Title")
    # batch_name is optional; allow empty string or None
    cleaned_batch_name = batch_name.strip() if isinstance(batch_name, str) else None
    if due_at is None:
        raise HTTPException(status_code=422, detail="Due date is required")
    if max_marks is None or max_marks <= 0:
        raise HTTPException(status_code=422, detail="Max marks must be greater than 0")
    return cleaned_course_id, cleaned_title, cleaned_batch_name


def _verify_batch_membership(
    db: Session,
    course_id: str,
    batch_name: str | None,
) -> None:
    if not batch_name:
        return
    exists = (
        db.query(Enrollment.id)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.batch_name == batch_name,
            func.lower(Enrollment.status) == "active",
        )
        .first()
    )
    if not exists:
        raise HTTPException(
            status_code=422,
            detail="Trainer batch not found for this course",
        )


def verify_assignment_ownership(
    db: Session,
    trainer_id: str,
    assignment_id: str,
) -> Lesson:
    assignment = (
        _trainer_assignments_query(db, trainer_id)
        .filter(Lesson.id == assignment_id)
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Trainer assignment not found")
    return assignment


def get_trainer_assignments(db: Session, trainer_id: str) -> TrainerAssignmentsResponse:
    _verify_active_trainer(db, trainer_id)
    assignments = (
        _trainer_assignments_query(db, trainer_id)
        .order_by(Lesson.due_at.asc(), Lesson.created_at.desc())
        .all()
    )
    items = [_assignment_item(assignment) for assignment in assignments]

    return TrainerAssignmentsResponse(
        summary=TrainerAssignmentSummary(
            total_assignments=len(items),
            published_assignments=sum(
                1 for item in items if item.status == "published"
            ),
            pending_submissions=0,
            grading_queue=0,
        ),
        assignments=items,
        feature_status=FEATURE_STATUS,
        updated_at=datetime.utcnow().isoformat(),
    )


def get_trainer_assignment_detail(
    db: Session,
    trainer_id: str,
    assignment_id: str,
) -> TrainerAssignmentDetail:
    _verify_active_trainer(db, trainer_id)
    assignment = verify_assignment_ownership(db, trainer_id, assignment_id)
    return _assignment_detail(assignment)


def create_trainer_assignment(
    db: Session,
    trainer_id: str,
    body: TrainerAssignmentCreate,
) -> TrainerAssignmentDetail:
    _verify_active_trainer(db, trainer_id)
    course_id, title, batch_name = _validate_assignment_payload(
        body.course_id,
        body.title,
        body.batch_name,
        body.due_at,
        body.max_marks,
    )
    _verify_course_ownership(db, trainer_id, course_id)
    _verify_batch_membership(db, course_id, batch_name)

    assignment = Lesson(
        course_id=course_id,
        title=title,
        # batch_name column does not exist in DB; ignore it
        summary=body.summary,
        content=body.content,
        assignment_url=body.assignment_url,
        content_type="assignment",
        due_at=body.due_at,
        max_marks=body.max_marks,
        is_preview=body.status != "published",
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return _assignment_detail(assignment)


def update_trainer_assignment(
    db: Session,
    trainer_id: str,
    assignment_id: str,
    body: TrainerAssignmentUpdate,
) -> TrainerAssignmentDetail:
    _verify_active_trainer(db, trainer_id)
    assignment = verify_assignment_ownership(db, trainer_id, assignment_id)

    updates = body.dict(exclude_unset=True)
    if "title" in updates:
        assignment.title = _clean_required(updates["title"], "Title")
        updates.pop("title")
    if "batch_name" in updates:
        # batch_name is optional; ignore and do not persist
        updates.pop("batch_name")
    if "due_at" in updates and updates["due_at"] is None:
        raise HTTPException(status_code=422, detail="Due date is required")
    if "max_marks" in updates and (
        updates["max_marks"] is None or updates["max_marks"] <= 0
    ):
        raise HTTPException(status_code=422, detail="Max marks must be greater than 0")

    for field in ["title", "summary", "content", "due_at", "max_marks", "assignment_url"]:
        if field in updates:
            setattr(assignment, field, updates[field])
    if "status" in updates and updates["status"] is not None:
        assignment.is_preview = updates["status"] != "published"

    db.commit()
    db.refresh(assignment)
    return _assignment_detail(assignment)


def get_trainer_assignment_submissions(
    db: Session,
    trainer_id: str,
    assignment_id: str,
) -> list[TrainerAssignmentSubmissionItem]:
    _verify_active_trainer(db, trainer_id)
    verify_assignment_ownership(db, trainer_id, assignment_id)
    # Dedicated assignment submissions are not migrated yet. Keep the endpoint
    # trainer-scoped and empty until that table exists.
    return []
