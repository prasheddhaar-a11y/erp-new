"""
PINESPHERE ERP
Module      : Services - Trainers LMS
File        : lms.py
Purpose     : Trainer-scoped LMS service functions.
              All queries are constrained by Course.trainer_id.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime

from fastapi import HTTPException, UploadFile
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.lms import Course, Enrollment, Lesson, Quiz
from app.models.trainer import TrainerLessonMaterial
from app.schemas.lms import LessonCreate
from app.schemas.trainer import (
    TrainerLessonMaterialListResponse,
    TrainerLessonMaterialResponse,
    TrainerLmsCourseCreate,
    TrainerLmsCourseDetail,
    TrainerLmsCourseItem,
    TrainerLmsCourseUpdate,
    TrainerLmsCoursesResponse,
    TrainerLmsFeatureStatusItem,
    TrainerLmsLessonItem,
    TrainerLmsLessonUpdate,
    TrainerLmsLessonsResponse,
    TrainerLmsMaterialItem,
)


# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# Upload directory root. Resolves to backend/uploads/lms/ regardless of
# where the server process is started from, using this file as the anchor.
# =====================================================

_SERVICE_DIR = os.path.dirname(__file__)                          # .../app/services/trainers/
_BACKEND_DIR = os.path.abspath(os.path.join(_SERVICE_DIR, "..", "..", ".."))  # backend/
UPLOADS_ROOT = os.path.join(_BACKEND_DIR, "uploads", "lms")

# Allowed MIME types for MVP upload.
_ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "video/mp4": "video",
    "video/webm": "video",
    "video/quicktime": "video",
}

# 50 MB hard limit per file.
_MAX_FILE_SIZE = 50 * 1024 * 1024


FEATURE_STATUS = [
    TrainerLmsFeatureStatusItem(
        s_no=35,
        feature="Course Creation Wizard",
        phase="Phase 5",
        status="Available for assigned courses",
    ),
    TrainerLmsFeatureStatusItem(
        s_no=36,
        feature="Video Lesson Upload & HLS Streaming",
        phase="Phase 5",
        status="Uses saved lesson video links",
    ),
    TrainerLmsFeatureStatusItem(
        s_no=37,
        feature="PDF / Document Attachment",
        phase="Phase 5",
        status="Uses saved lesson PDF links",
    ),
    TrainerLmsFeatureStatusItem(
        s_no=45,
        feature="AI Quiz Generator",
        phase="Phase 5",
        status="No quiz generator records yet",
    ),
    TrainerLmsFeatureStatusItem(
        s_no=99,
        feature="GitHub Repository Integration",
        phase="Phase 5",
        status="No repository records yet",
    ),
]


# =====================================================
# SECTION: INTERNAL HELPERS
# =====================================================

def _course_counts(db: Session, course_id: str) -> dict[str, int]:
    lesson_count = (
        db.query(func.count(Lesson.id))
        .filter(Lesson.course_id == course_id)
        .scalar()
        or 0
    )
    quiz_count = (
        db.query(func.count(Quiz.id))
        .filter(Quiz.course_id == course_id)
        .scalar()
        or 0
    )
    # Material count now reads from the real materials table.
    material_count = (
        db.query(func.count(TrainerLessonMaterial.id))
        .filter(TrainerLessonMaterial.course_id == course_id)
        .scalar()
        or 0
    )
    enrolled_students = (
        db.query(func.count(Enrollment.id))
        .filter(
            Enrollment.course_id == course_id,
            func.lower(Enrollment.status) == "active",
        )
        .scalar()
        or 0
    )
    return {
        "lesson_count": int(lesson_count),
        "material_count": int(material_count),
        "quiz_count": int(quiz_count),
        "enrolled_students": int(enrolled_students),
    }


def _course_counts_for_courses(db: Session, course_ids: list[str]) -> dict[str, dict[str, int]]:
    if not course_ids:
        return {}

    counts: dict[str, dict[str, int]] = {
        course_id: {
            "lesson_count": 0,
            "material_count": 0,
            "quiz_count": 0,
            "enrolled_students": 0,
        }
        for course_id in course_ids
    }

    for row in (
        db.query(Lesson.course_id, func.count(Lesson.id).label("cnt"))
        .filter(Lesson.course_id.in_(course_ids))
        .group_by(Lesson.course_id)
        .all()
    ):
        counts[row.course_id]["lesson_count"] = int(row.cnt or 0)

    for row in (
        db.query(Quiz.course_id, func.count(Quiz.id).label("cnt"))
        .filter(Quiz.course_id.in_(course_ids))
        .group_by(Quiz.course_id)
        .all()
    ):
        counts[row.course_id]["quiz_count"] = int(row.cnt or 0)

    for row in (
        db.query(TrainerLessonMaterial.course_id, func.count(TrainerLessonMaterial.id).label("cnt"))
        .filter(TrainerLessonMaterial.course_id.in_(course_ids))
        .group_by(TrainerLessonMaterial.course_id)
        .all()
    ):
        counts[row.course_id]["material_count"] = int(row.cnt or 0)

    for row in (
        db.query(Enrollment.course_id, func.count(Enrollment.id).label("cnt"))
        .filter(
            Enrollment.course_id.in_(course_ids),
            func.lower(Enrollment.status) == "active",
        )
        .group_by(Enrollment.course_id)
        .all()
    ):
        counts[row.course_id]["enrolled_students"] = int(row.cnt or 0)

    return counts


def _course_item(
    db: Session,
    course: Course,
    counts: dict[str, int] | None = None,
) -> TrainerLmsCourseItem:
    counts = counts or _course_counts(db, course.id)
    return TrainerLmsCourseItem(
        id=course.id,
        title=course.title,
        description=course.description,
        status=course.status,
        difficulty_level=course.difficulty_level,
        duration=course.duration,
        thumbnail_url=course.thumbnail_url,
        display_code=course.display_code,
        lesson_count=counts["lesson_count"],
        material_count=counts["material_count"],
        quiz_count=counts["quiz_count"],
        enrolled_students=counts["enrolled_students"],
        can_create_lessons=True,
        can_upload_materials=True,          # ← enabled: upload system is live
        created_at=course.created_at.isoformat() if course.created_at else None,
        updated_at=course.updated_at.isoformat() if course.updated_at else None,
    )


def _material_response(material: TrainerLessonMaterial) -> TrainerLessonMaterialResponse:
    """Convert an ORM row to the Pydantic response schema."""
    return TrainerLessonMaterialResponse(
        id=material.id,
        course_id=material.course_id,
        lesson_id=material.lesson_id,
        trainer_id=material.trainer_id,
        filename=material.filename,
        file_url=f"/api/v1/trainer/lms/materials/{material.id}/download",
        file_size=material.file_size,
        content_type=material.content_type,
        download_count=material.download_count,
        created_at=material.created_at.isoformat() if material.created_at else None,
    )


def material_storage_path(material: TrainerLessonMaterial) -> str:
    """Resolve an LMS material to a local file path without exposing /uploads."""
    uploads_root = os.path.abspath(UPLOADS_ROOT)
    candidate_paths = [
        os.path.join(
            UPLOADS_ROOT,
            material.trainer_id,
            material.course_id,
            f"{material.id}_{material.filename}",
        )
    ]

    if material.file_url.startswith("/uploads/lms/"):
        relative_path = material.file_url.removeprefix("/uploads/lms/").replace("/", os.sep)
        candidate_paths.append(os.path.join(UPLOADS_ROOT, relative_path))

    for candidate_path in candidate_paths:
        absolute_path = os.path.abspath(candidate_path)
        if (
            absolute_path.startswith(uploads_root + os.sep)
            and os.path.isfile(absolute_path)
        ):
            return absolute_path

    material_dir = os.path.abspath(os.path.join(
        UPLOADS_ROOT,
        material.trainer_id,
        material.course_id,
    ))
    if material_dir.startswith(uploads_root + os.sep) and os.path.isdir(material_dir):
        safe_filename = os.path.basename(material.filename)
        for stored_filename in os.listdir(material_dir):
            if stored_filename == safe_filename or stored_filename.endswith(f"_{safe_filename}"):
                fallback_path = os.path.abspath(os.path.join(material_dir, stored_filename))
                if fallback_path.startswith(uploads_root + os.sep) and os.path.isfile(fallback_path):
                    return fallback_path

    raise HTTPException(status_code=404, detail="Material file not found")


# =====================================================
# SECTION: OWNERSHIP VALIDATION
# =====================================================

def verify_course_ownership(db: Session, trainer_id: str, course_id: str) -> Course:
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.trainer_id == trainer_id)
        .first()
    )
    if not course:
        raise HTTPException(status_code=404, detail="Trainer course not found")
    return course


def _verify_lesson_ownership(db: Session, course_id: str, lesson_id: str) -> Lesson:
    lesson = (
        db.query(Lesson)
        .filter(Lesson.id == lesson_id, Lesson.course_id == course_id)
        .first()
    )
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return lesson


# =====================================================
# SECTION: COURSE FUNCTIONS
# =====================================================

def get_trainer_courses(db: Session, trainer_id: str) -> TrainerLmsCoursesResponse:
    courses = (
        db.query(Course)
        .filter(Course.trainer_id == trainer_id)
        .order_by(Course.updated_at.desc(), Course.created_at.desc())
        .all()
    )
    course_counts = _course_counts_for_courses(db, [course.id for course in courses])
    items = [_course_item(db, course, course_counts.get(course.id)) for course in courses]
    total_lessons = sum(item.lesson_count or 0 for item in items)
    uploaded_materials = sum(item.material_count or 0 for item in items)

    return TrainerLmsCoursesResponse(
        summary={
            "total_courses": len(items),
            "total_lessons": total_lessons,
            "uploaded_materials": uploaded_materials,
            "quiz_tools": sum(item.quiz_count or 0 for item in items),
        },
        courses=items,
        feature_status=FEATURE_STATUS,
        updated_at=datetime.utcnow().isoformat(),
    )


def get_trainer_course_detail(
    db: Session,
    trainer_id: str,
    course_id: str,
) -> TrainerLmsCourseDetail:
    course = verify_course_ownership(db, trainer_id, course_id)
    item = _course_item(db, course)
    return TrainerLmsCourseDetail(**item.dict())


def create_trainer_course(
    db: Session,
    trainer_id: str,
    body: TrainerLmsCourseCreate,
) -> TrainerLmsCourseDetail:
    course = Course(
        id=str(uuid.uuid4()),
        title=body.title.strip(),
        description=body.description.strip() if body.description else "",
        trainer_id=trainer_id,
        duration=body.duration.strip() if body.duration else None,
        difficulty_level=body.difficulty_level,
        status=body.status,
        display_code=f"TR-{uuid.uuid4().hex[:8].upper()}",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    item = _course_item(db, course)
    return TrainerLmsCourseDetail(**item.dict())


# =====================================================
# SECTION: LESSON FUNCTIONS
# =====================================================

def _lesson_item(lesson: Lesson) -> TrainerLmsLessonItem:
    return TrainerLmsLessonItem(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        summary=lesson.summary,
        content=lesson.content,
        video_url=lesson.video_url,
        pdf_url=lesson.pdf_url,
        assignment_url=lesson.assignment_url,
        content_type=lesson.content_type,
        due_at=lesson.due_at.isoformat() if lesson.due_at else None,
        max_marks=lesson.max_marks or 0,
        sort_order=lesson.sort_order or 1,
        is_preview=bool(lesson.is_preview),
        created_at=lesson.created_at.isoformat() if lesson.created_at else None,
    )


def get_trainer_lessons(
    db: Session,
    trainer_id: str,
    course_id: str,
) -> TrainerLmsLessonsResponse:
    verify_course_ownership(db, trainer_id, course_id)
    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.sort_order.asc(), Lesson.created_at.asc())
        .all()
    )
    return TrainerLmsLessonsResponse(
        lessons=[_lesson_item(lesson) for lesson in lessons],
        updated_at=datetime.utcnow().isoformat(),
    )


def create_trainer_lesson(
    db: Session,
    trainer_id: str,
    course_id: str,
    body: LessonCreate,
) -> TrainerLmsLessonItem:
    verify_course_ownership(db, trainer_id, course_id)
    lesson = Lesson(course_id=course_id, **body.dict())
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return _lesson_item(lesson)


def update_trainer_lesson(
    db: Session,
    trainer_id: str,
    course_id: str,
    lesson_id: str,
    body: TrainerLmsLessonUpdate,
) -> TrainerLmsLessonItem:
    verify_course_ownership(db, trainer_id, course_id)
    lesson = _verify_lesson_ownership(db, course_id, lesson_id)
    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return _lesson_item(lesson)


def delete_trainer_lesson(
    db: Session,
    trainer_id: str,
    course_id: str,
    lesson_id: str,
) -> None:
    verify_course_ownership(db, trainer_id, course_id)
    lesson = _verify_lesson_ownership(db, course_id, lesson_id)
    db.delete(lesson)
    db.commit()


# =====================================================
# SECTION: COURSE STATUS
# =====================================================

def update_trainer_course_status(
    db: Session,
    trainer_id: str,
    course_id: str,
    body: TrainerLmsCourseUpdate,
) -> TrainerLmsCourseDetail:
    course = verify_course_ownership(db, trainer_id, course_id)
    update_data = body.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    item = _course_item(db, course)
    return TrainerLmsCourseDetail(**item.dict())


# =====================================================
# SECTION: MATERIAL FUNCTIONS
# =====================================================

async def upload_trainer_material(
    db: Session,
    trainer_id: str,
    course_id: str,
    file: UploadFile,
    lesson_id: str | None = None,
) -> TrainerLessonMaterialResponse:
    """
    Save an uploaded file to local storage and persist metadata to DB.

    Storage path: backend/uploads/lms/{trainer_id}/{course_id}/{uuid}_{filename}
    Accessible at: /uploads/lms/{trainer_id}/{course_id}/{uuid}_{filename}

    Raises 404 if the course is not owned by trainer_id.
    Raises 404 if lesson_id is provided but does not belong to the course.
    Raises 400 if the file type is not allowed or the file exceeds the size limit.
    """
    # 1. Ownership validation — raises 404 if course not found or not owned.
    verify_course_ownership(db, trainer_id, course_id)

    # 2. Optional lesson validation — lesson must belong to the same course.
    if lesson_id:
        _verify_lesson_ownership(db, course_id, lesson_id)

    # 3. Content type validation.
    mime = file.content_type or ""
    content_type_label = _ALLOWED_CONTENT_TYPES.get(mime)
    if not content_type_label:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File type '{mime}' is not allowed. "
                "Accepted types: PDF, MP4, WebM, MOV."
            ),
        )

    # 4. Read file bytes and enforce size limit.
    file_bytes = await file.read()
    file_size = len(file_bytes)
    if file_size > _MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the 50 MB limit ({file_size // (1024 * 1024)} MB received).",
        )

    # 5. Build destination directory and safe filename.
    dest_dir = os.path.join(UPLOADS_ROOT, trainer_id, course_id)
    os.makedirs(dest_dir, exist_ok=True)

    safe_original = os.path.basename(file.filename or "upload")
    material_id = str(uuid.uuid4())
    unique_filename = f"{material_id}_{safe_original}"
    dest_path = os.path.join(dest_dir, unique_filename)

    # 6. Write to disk.
    with open(dest_path, "wb") as fh:
        fh.write(file_bytes)

    # 7. Build the protected API URL path.
    file_url = f"/api/v1/trainer/lms/materials/{material_id}/download"

    # 8. Insert metadata row into trainer_lesson_materials.
    material = TrainerLessonMaterial(
        id=material_id,
        course_id=course_id,
        lesson_id=lesson_id,
        trainer_id=trainer_id,
        filename=safe_original,
        file_url=file_url,
        file_size=file_size,
        content_type=content_type_label,
        download_count=0,
        created_at=datetime.utcnow(),
    )
    db.add(material)
    db.commit()
    db.refresh(material)

    return _material_response(material)


def get_trainer_materials(
    db: Session,
    trainer_id: str,
) -> TrainerLessonMaterialListResponse:
    """
    Return all materials uploaded by this trainer across all their courses.
    Reads from trainer_lesson_materials — no longer derived from lesson URLs.
    """
    rows = (
        db.query(TrainerLessonMaterial)
        .filter(TrainerLessonMaterial.trainer_id == trainer_id)
        .order_by(TrainerLessonMaterial.created_at.desc())
        .all()
    )
    return TrainerLessonMaterialListResponse(
        materials=[_material_response(row) for row in rows],
        total=len(rows),
        updated_at=datetime.utcnow().isoformat(),
    )


def get_course_materials(
    db: Session,
    trainer_id: str,
    course_id: str,
) -> TrainerLessonMaterialListResponse:
    """
    Return all materials for a specific course.
    Validates course ownership before querying — prevents cross-trainer access.
    """
    verify_course_ownership(db, trainer_id, course_id)
    rows = (
        db.query(TrainerLessonMaterial)
        .filter(
            TrainerLessonMaterial.course_id == course_id,
            TrainerLessonMaterial.trainer_id == trainer_id,
        )
        .order_by(TrainerLessonMaterial.created_at.desc())
        .all()
    )
    return TrainerLessonMaterialListResponse(
        materials=[_material_response(row) for row in rows],
        total=len(rows),
        updated_at=datetime.utcnow().isoformat(),
    )


# =====================================================
# SECTION: LEGACY MATERIAL HELPER
# PURPOSE:
# get_trainer_materials_legacy() preserves the original behaviour of deriving
# material items from lesson pdf_url / video_url fields. Kept here for
# reference only — no route calls this function. Remove in Phase 4 cleanup.
# =====================================================

def _get_trainer_materials_legacy(
    db: Session,
    trainer_id: str,
) -> list[TrainerLmsMaterialItem]:
    """Derives materials from lesson URL fields. Legacy — not called by any route."""
    rows = (
        db.query(Lesson)
        .join(Course, Lesson.course_id == Course.id)
        .filter(
            Course.trainer_id == trainer_id,
            Lesson.content_type != "assignment",
            or_(
                (Lesson.video_url.isnot(None) & (Lesson.video_url != "")),
                (Lesson.pdf_url.isnot(None) & (Lesson.pdf_url != "")),
                (Lesson.assignment_url.isnot(None) & (Lesson.assignment_url != "")),
            ),
        )
        .order_by(Lesson.created_at.desc())
        .all()
    )
    materials: list[TrainerLmsMaterialItem] = []
    for lesson in rows:
        url = lesson.pdf_url or lesson.video_url or lesson.assignment_url
        content_type = (
            "pdf" if lesson.pdf_url else "video" if lesson.video_url else "material"
        )
        materials.append(
            TrainerLmsMaterialItem(
                id=lesson.id,
                course_id=lesson.course_id,
                filename=lesson.title,
                content_type=content_type,
                url=url,
                created_at=lesson.created_at.isoformat() if lesson.created_at else None,
            )
        )
    return materials
