"""
PINESPHERE ERP
Module      : Services - Students LMS
File        : lms.py  (backend/app/services/students/lms.py)
Purpose     : Student-scoped LMS service functions.
              Fetches course detail with lessons and materials,
              verifying enrollment before access.
              Recalculates enrollment progress after lesson completion.

AUDIT RESULT  (no functional changes from original):
  - is_completed and completed_at are already sourced from LessonProgress  ✓
  - is_preview is NOT used for any progress or status logic                 ✓
  - recalculate_enrollment_progress() is defined here and called by the
    API POST /lms/lessons/{lesson_id}/progress endpoint                     ✓
  - Formula: completed_lessons / total_lessons * 100                        ✓

Author      : Pinesphere Development Team
Last Updated: Auto Generated
"""

from fastapi import HTTPException
from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.lms import Course, Enrollment, Lesson, LessonProgress
from app.models.trainer import TrainerLessonMaterial
from app.schemas.lms import (
    StudentCourseDetailResponse,
    StudentCourseListItemResponse,
    StudentLessonResponse,
    StudentMaterialResponse,
)
from app.services.trainers.lms import material_storage_path


# =====================================================
# SECTION: HELPERS
# =====================================================

def _material_response(material: TrainerLessonMaterial) -> StudentMaterialResponse:
    """Convert trainer_lesson_material ORM to StudentMaterialResponse schema."""
    return StudentMaterialResponse(
        id=material.id,
        lesson_id=material.lesson_id,
        filename=material.filename,
        file_url=f"/lms/student/materials/{material.id}/download",
        file_size=material.file_size,
        content_type=material.content_type,
        download_count=material.download_count,
        created_at=material.created_at,
    )


def _material_file_exists(material: TrainerLessonMaterial) -> bool:
    """Return whether a material row resolves to an existing protected file."""
    try:
        material_storage_path(material)
    except HTTPException as exc:
        if exc.status_code == 404:
            return False
        raise
    return True


def _initials(name: str | None) -> str | None:
    """Return initials from a display name."""
    if not name:
        return None
    return "".join(part[:1] for part in name.split()[:2]).upper() or None


def _lesson_response(
    lesson: Lesson,
    materials: list[StudentMaterialResponse],
    progress: LessonProgress | None,
) -> StudentLessonResponse:
    """
    Convert Lesson ORM + materials + LessonProgress to StudentLessonResponse.

    NOTE: is_completed and completed_at come exclusively from LessonProgress.
    lesson.is_preview is preserved in the response but is NOT used for any
    completion or status logic — it is a trainer flag only.
    """
    return StudentLessonResponse(
        id=lesson.id,
        course_id=lesson.course_id,
        title=lesson.title,
        summary=lesson.summary,
        content=lesson.content,
        video_url=lesson.video_url,
        pdf_url=lesson.pdf_url,
        assignment_url=lesson.assignment_url,
        content_type=lesson.content_type,
        due_at=lesson.due_at,
        max_marks=lesson.max_marks,
        sort_order=lesson.sort_order,
        is_preview=lesson.is_preview,
        # ── Real progress from LessonProgress table ──────────────────────────
        is_completed=bool(progress and progress.is_completed),
        completed_at=progress.completed_at if progress else None,
        # ─────────────────────────────────────────────────────────────────────
        created_at=lesson.created_at,
        materials=materials,
    )


# =====================================================
# SECTION: PROGRESS RECALCULATION
# =====================================================

def recalculate_enrollment_progress(
    db: Session,
    student_id: str,
    course_id: str,
) -> None:
    """
    Recalculate and persist enrollment.progress_percent for a student in a course.

    Formula:
        round(completed_lessons / total_lessons * 100)

    Called by POST /lms/lessons/{lesson_id}/progress in the API layer.
    Updates enrollment.progress_percent which is what the student dashboard
    reads via _student_payload() in role_dashboards.py.

    No-op if the enrollment row does not exist.
    """
    enrollment = (
        db.query(Enrollment)
        .filter(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.student_id == student_id,
            )
        )
        .first()
    )
    if not enrollment:
        return

    total_lessons: int = (
        db.query(func.count(Lesson.id))
        .filter(Lesson.course_id == course_id)
        .scalar()
        or 0
    )

    if total_lessons == 0:
        enrollment.progress_percent = 0
        db.commit()
        return

    completed_lessons: int = (
        db.query(func.count(LessonProgress.id))
        .join(Lesson, Lesson.id == LessonProgress.lesson_id)
        .filter(
            and_(
                Lesson.course_id == course_id,
                LessonProgress.student_id == student_id,
                LessonProgress.is_completed == True,  # noqa: E712
            )
        )
        .scalar()
        or 0
    )

    enrollment.progress_percent = round((completed_lessons / total_lessons) * 100)
    db.commit()


# =====================================================
# SECTION: MAIN SERVICE FUNCTION
# =====================================================

def get_student_lms_courses(
    db: Session,
    current_user,
) -> list[StudentCourseListItemResponse]:
    """
    Return published/active LMS courses for the authenticated student.

    Uses live Lesson and LessonProgress counts for progress instead of relying
    only on Enrollment.progress_percent.
    """
    student_id = current_user.id

    enrollments = (
        db.query(Enrollment)
        .join(Course, Enrollment.course_id == Course.id)
        .filter(
            and_(
                Enrollment.student_id == student_id,
                func.lower(Enrollment.status) == "active",
                func.lower(Course.status).in_(["published", "active"]),
            )
        )
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )

    course_items: list[StudentCourseListItemResponse] = []

    for enrollment in enrollments:
        course = enrollment.course
        if not course:
            continue

        total_lessons = (
            db.query(func.count(Lesson.id))
            .filter(Lesson.course_id == course.id)
            .scalar()
            or 0
        )

        completed_lessons = (
            db.query(func.count(LessonProgress.id))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .filter(
                and_(
                    Lesson.course_id == course.id,
                    LessonProgress.student_id == student_id,
                    LessonProgress.is_completed == True,  # noqa: E712
                )
            )
            .scalar()
            or 0
        )

        progress_percent = (
            round((completed_lessons / total_lessons) * 100)
            if total_lessons
            else 0
        )

        course_materials = (
            db.query(TrainerLessonMaterial)
            .filter(TrainerLessonMaterial.course_id == course.id)
            .all()
        )
        material_count = sum(1 for material in course_materials if _material_file_exists(material))

        video_count = (
            db.query(func.count(Lesson.id))
            .filter(
                and_(
                    Lesson.course_id == course.id,
                    Lesson.video_url.isnot(None),
                    Lesson.video_url != "",
                )
            )
            .scalar()
            or 0
        )

        trainer_name = course.trainer.full_name if course.trainer else None

        course_items.append(
            StudentCourseListItemResponse(
                id=course.id,
                title=course.title,
                description=course.description,
                duration=course.duration,
                difficulty_level=course.difficulty_level,
                status=course.status,
                trainer=trainer_name,
                trainer_initials=_initials(trainer_name),
                total_lessons=total_lessons,
                completed_lessons=completed_lessons,
                progress_percent=progress_percent,
                material_count=material_count,
                video_count=video_count,
            )
        )

    return course_items


def get_student_course_with_materials(
    db: Session,
    student_id: str,
    course_id: str,
) -> StudentCourseDetailResponse:
    """
    Fetch course detail with lessons and materials for a student.

    Verification:
    - Course must exist and be available for students
    - Student must be enrolled in the course
    - Lessons are sorted by sort_order, then created_at
    - Materials include both lesson-specific and course-level (lesson_id IS NULL)
    - is_completed / completed_at sourced from LessonProgress, never from is_preview

    Raises:
    - 404 if course not found
    - 403 if course is not published/active (unavailable = trainer-only)
    - 403 if student is not enrolled
    """
    # 1. Verify course exists and is available to students.
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course.status.lower() not in {"published", "active"}:
        raise HTTPException(
            status_code=403, detail="Course is not available for students"
        )

    # 2. Verify student is enrolled
    enrollment = (
        db.query(Enrollment)
        .filter(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.student_id == student_id,
            )
        )
        .first()
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # 3. Fetch all lessons sorted by sort_order, then created_at
    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.sort_order.asc(), Lesson.created_at.asc())
        .all()
    )
    lesson_ids = [lesson.id for lesson in lessons]

    # 4. Batch-load all LessonProgress for this student in one query
    progress_by_lesson_id: dict[str, LessonProgress] = {
        progress.lesson_id: progress
        for progress in (
            db.query(LessonProgress)
            .filter(
                and_(
                    LessonProgress.student_id == student_id,
                    LessonProgress.lesson_id.in_(lesson_ids),
                )
            )
            .all()
            if lesson_ids
            else []
        )
    }

    # 5. Batch-load materials once, then attach lesson-specific + course-level rows.
    materials_by_lesson_id: dict[str | None, list[TrainerLessonMaterial]] = {}
    course_materials = (
        db.query(TrainerLessonMaterial)
        .filter(TrainerLessonMaterial.course_id == course_id)
        .order_by(TrainerLessonMaterial.created_at.desc())
        .all()
    )
    for material in course_materials:
        materials_by_lesson_id.setdefault(material.lesson_id, []).append(material)

    lesson_responses = []
    for lesson in lessons:
        materials = materials_by_lesson_id.get(lesson.id, []) + materials_by_lesson_id.get(None, [])
        material_responses = [_material_response(m) for m in materials if _material_file_exists(m)]
        lesson_response = _lesson_response(
            lesson,
            material_responses,
            progress_by_lesson_id.get(lesson.id),
        )
        lesson_responses.append(lesson_response)

    # 6. Build and return final response
    return StudentCourseDetailResponse(
        id=course.id,
        title=course.title,
        description=course.description,
        thumbnail_url=course.thumbnail_url,
        trainer_id=course.trainer_id,
        duration=course.duration,
        difficulty_level=course.difficulty_level,
        status=course.status,
        created_at=course.created_at,
        lessons=lesson_responses,
    )
