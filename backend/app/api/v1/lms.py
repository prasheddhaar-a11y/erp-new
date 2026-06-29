"""
PINESPHERE ERP
Module      : LMS Module
File        : lms.py  (backend/app/api/lms.py)
Purpose     : LMS API endpoints — student & trainer routes.
              KEY CHANGE: POST /lms/lessons/{lesson_id}/progress
              now calls recalculate_enrollment_progress() after
              marking a lesson complete, so enrollment.progress_percent
              stays in sync with the dashboard.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# =====================================================

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.lms import (
    Course,
    Enrollment,
    Lesson,
    LessonProgress,
    Quiz,
    QuizAttempt,
    QuizQuestion,
)
from app.models.trainer import TrainerLessonMaterial
from app.schemas.lms import (
    AiTutorRequest,
    CourseCreate,
    CourseResponse,
    CourseUpdate,
    EnrollmentAssign,
    EnrollmentResponse,
    LessonCreate,
    LessonResponse,
    ProgressUpdate,
    QuizAttemptSubmit,
    QuizCreate,
    StudentCourseDetailResponse,
    StudentCourseListItemResponse,
)
from app.services.students.lms import (
    get_student_course_with_materials,
    get_student_lms_courses,
    recalculate_enrollment_progress,
)
from app.services.trainers.lms import material_storage_path

import uuid
from datetime import datetime

router = APIRouter(prefix="/lms", tags=["LMS"])


# =====================================================
# SECTION: COURSE ENDPOINTS (Trainer / Admin)
# =====================================================

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    """List all courses. Trainers see only their own courses."""
    query = db.query(Course)
    if current_user.role == UserRole.TRAINER:
        query = query.filter(Course.trainer_id == current_user.id)
    return query.order_by(Course.created_at.desc()).limit(500).all()


@router.post("/courses", response_model=CourseResponse)
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    course = Course(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(
        UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN, UserRole.STUDENT,
    )),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: str,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    course.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}", status_code=204)
def delete_course(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()


# =====================================================
# SECTION: LESSON ENDPOINTS (Trainer)
# =====================================================

@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def list_lessons(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    return (
        db.query(Lesson)
        .filter(Lesson.course_id == course_id)
        .order_by(Lesson.sort_order.asc())
        .all()
    )


@router.post("/courses/{course_id}/lessons", response_model=LessonResponse)
def create_lesson(
    course_id: str,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    lesson = Lesson(
        id=str(uuid.uuid4()),
        course_id=course_id,
        **payload.model_dump(),
        created_at=datetime.utcnow(),
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.patch("/courses/{course_id}/lessons/{lesson_id}", response_model=LessonResponse)
def update_lesson(
    course_id: str,
    lesson_id: str,
    payload: LessonCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == course_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lesson, field, value)
    db.commit()
    db.refresh(lesson)
    return lesson


@router.delete("/courses/{course_id}/lessons/{lesson_id}", status_code=204)
def delete_lesson(
    course_id: str,
    lesson_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id, Lesson.course_id == course_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    db.delete(lesson)
    db.commit()


# =====================================================
# SECTION: ENROLLMENT ENDPOINTS
# =====================================================

@router.post("/enroll", response_model=EnrollmentResponse)
def enroll_student(
    payload: EnrollmentAssign,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == payload.course_id,
            Enrollment.student_id == payload.student_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")

    enrollment = Enrollment(
        id=str(uuid.uuid4()),
        course_id=payload.course_id,
        student_id=payload.student_id,
        batch_name=payload.batch_name,
        enrolled_at=datetime.utcnow(),
    )
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


# =====================================================
# SECTION: STUDENT — COURSE DETAIL WITH MATERIALS
# =====================================================

@router.get(
    "/student/courses/{course_id}",
    response_model=StudentCourseDetailResponse,
)
def student_course_detail(
    course_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.STUDENT)),
):
    """
    Return full course detail for the authenticated student.
    Lessons include:
      - is_completed   (from LessonProgress)
      - completed_at   (from LessonProgress)
      - materials      (from trainer_lesson_materials)
    """
    return get_student_course_with_materials(db, current_user.id, course_id)


@router.get("/student/materials/{material_id}/download")
def download_student_lms_material(
    material_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.STUDENT)),
):
    material = db.query(TrainerLessonMaterial).filter(TrainerLessonMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    get_student_course_with_materials(db, current_user.id, material.course_id)

    material.download_count = (material.download_count or 0) + 1
    db.commit()
    return FileResponse(
        material_storage_path(material),
        filename=material.filename,
        media_type="application/octet-stream",
    )


# =====================================================
# SECTION: STUDENT — LESSON PROGRESS
# =====================================================

@router.post("/lessons/{lesson_id}/progress", status_code=200)
def update_lesson_progress(
    lesson_id: str,
    payload: ProgressUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.STUDENT)),
):
    """
    Mark a lesson as complete (is_completed=True) for the authenticated student.

    Workflow:
    1. Look up or create a LessonProgress row.
    2. Set is_completed and completed_at.
    3. Commit the progress record.
    4. Call recalculate_enrollment_progress() so enrollment.progress_percent
       is updated immediately — this is what the student dashboard reads.

    The frontend calls this endpoint only after ALL materials in the lesson
    have been viewed/watched (material-based completion).
    """
    # Resolve which course this lesson belongs to (needed for progress recalc)
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    progress = (
        db.query(LessonProgress)
        .filter(
            LessonProgress.lesson_id == lesson_id,
            LessonProgress.student_id == current_user.id,
        )
        .first()
    )

    if progress is None:
        progress = LessonProgress(
            id=str(uuid.uuid4()),
            lesson_id=lesson_id,
            student_id=current_user.id,
        )
        db.add(progress)

    progress.is_completed = payload.is_completed
    if payload.is_completed and progress.completed_at is None:
        progress.completed_at = datetime.utcnow()

    db.commit()

    # ── KEY: Recalculate enrollment progress so dashboard stays in sync ──────
    recalculate_enrollment_progress(db, current_user.id, lesson.course_id)

    return {
        "lesson_id": lesson_id,
        "is_completed": progress.is_completed,
        "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
    }


# =====================================================
# SECTION: STUDENT — ENROLLED COURSES LIST
# =====================================================

@router.get("/student/courses", response_model=list[StudentCourseListItemResponse])
def student_enrolled_courses(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.STUDENT)),
):
    """Return LMS course listing data for the authenticated student."""
    return get_student_lms_courses(db, current_user)


# =====================================================
# SECTION: QUIZ ENDPOINTS (Trainer)
# =====================================================

@router.post("/courses/{course_id}/quizzes", status_code=201)
def create_quiz(
    course_id: str,
    payload: QuizCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.TRAINER, UserRole.BRANCH_ADMIN, UserRole.SUPER_ADMIN)),
):
    quiz = Quiz(
        id=str(uuid.uuid4()),
        course_id=course_id,
        title=payload.title,
        description=payload.description,
        passing_score=payload.passing_score,
        total_marks=payload.total_marks,
        status=payload.status,
        created_at=datetime.utcnow(),
    )
    db.add(quiz)
    db.flush()

    for q in payload.questions:
        question = QuizQuestion(
            id=str(uuid.uuid4()),
            quiz_id=quiz.id,
            **q.model_dump(),
        )
        db.add(question)

    db.commit()
    return {"id": quiz.id, "message": "Quiz created"}


@router.post("/quizzes/{quiz_id}/attempt")
def submit_quiz_attempt(
    quiz_id: str,
    payload: QuizAttemptSubmit,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.STUDENT)),
):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    score = sum(
        q.marks
        for q in questions
        if payload.answers.get(q.id, "").lower() == q.correct_option.lower()
    )
    passed = score >= quiz.passing_score

    attempt = QuizAttempt(
        id=str(uuid.uuid4()),
        quiz_id=quiz_id,
        student_id=current_user.id,
        score=score,
        passed=passed,
        submitted_at=datetime.utcnow(),
    )
    db.add(attempt)
    db.commit()

    return {"score": score, "passed": passed, "total_marks": quiz.total_marks}
