"""
PINESPHERE ERP
Module      : LMS Module
File        : lms.py
Purpose     : Defines Lms API endpoints and request handling
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

from datetime import datetime

# =====================================================
# SECTION: ERROR HANDLING
# PURPOSE:
# This section handles expected failures and converts them into useful responses.
# Good error handling keeps the app stable when something goes wrong.
# =====================================================

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.core.roles import UserRole
from app.db.database import get_db
from app.models.lms import Course, Enrollment, Lesson, LessonProgress, Quiz, QuizAttempt, QuizQuestion
from app.models.trainer import TrainerLessonMaterial
from app.schemas.lms import AiTutorRequest, CourseCreate, CourseResponse, CourseUpdate, EnrollmentAssign, EnrollmentResponse, LessonCreate, LessonResponse, ProgressUpdate, QuizAttemptSubmit, QuizCreate, StudentCourseDetailResponse, StudentCourseListItemResponse
from app.models.user import User
from app.services.history import add_history
from app.services.students.lms import get_student_course_with_materials, get_student_lms_courses
from app.services.trainers.lms import material_storage_path

router = APIRouter(
    prefix="/lms",
    tags=["Course & LMS"],
    dependencies=[Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER, UserRole.STUDENT, UserRole.PARENT))],
)


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _parent_student_ids(db: Session, current_user: User) -> list[str]:
    if not current_user.phone:
        return []
    return [student_id for (student_id,) in db.query(User.id).filter(User.role == UserRole.STUDENT, User.parent_phone == current_user.phone).all()]


def _recalculate_progress(db: Session, course_id: str, student_id: str) -> int:
    lessons = db.query(Lesson).filter(Lesson.course_id == course_id).all()
    if not lessons:
        return 0
    lesson_ids = [lesson.id for lesson in lessons]
    completed = db.query(LessonProgress).filter(LessonProgress.student_id == student_id, LessonProgress.lesson_id.in_(lesson_ids), LessonProgress.is_completed == True).count()  # noqa: E712
    progress = round((completed / len(lessons)) * 100)
    enrollment = db.query(Enrollment).filter(Enrollment.course_id == course_id, Enrollment.student_id == student_id).first()
    if enrollment:
        enrollment.progress_percent = progress
        db.commit()
    return progress


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/courses", response_model=list[CourseResponse])
def list_courses(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Course).order_by(Course.created_at.desc())
    if current_user.role in {UserRole.STUDENT, UserRole.PARENT}:
        query = query.filter(Course.status == "published")
    return query.all()


@router.post("/courses", response_model=CourseResponse)
def create_course(body: CourseCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    course = Course(**body.dict())
    if current_user.role == UserRole.TRAINER and not course.trainer_id:
        course.trainer_id = current_user.id
    db.add(course)
    db.flush()
    add_history(
        db,
        module="lms",
        action="created",
        title=f"Course created: {course.title}",
        details=f"Duration: {course.duration or '-'} | Level: {course.difficulty_level} | Status: {course.status}",
        record_id=course.id,
        created_by_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.commit()
    db.refresh(course)
    return course


@router.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(course_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.patch("/courses/{course_id}", response_model=CourseResponse)
def update_course(course_id: str, body: CourseUpdate, db: Session = Depends(get_db), _=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in body.dict(exclude_unset=True).items():
        setattr(course, key, value)
    add_history(
        db,
        module="lms",
        action="updated",
        title=f"Course updated: {course.title}",
        details=f"Level: {course.difficulty_level} | Status: {course.status}",
        record_id=course.id,
        created_by_id=_.id,
        branch_id=_.branch_id,
    )
    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}")
def delete_course(course_id: str, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    add_history(
        db,
        module="lms",
        action="deleted",
        title=f"Course deleted: {course.title}",
        details=f"Duration: {course.duration or '-'} | Level: {course.difficulty_level} | Status: {course.status}",
        record_id=course.id,
        created_by_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.delete(course)
    db.commit()
    return {"message": "Course deleted successfully", "id": course_id}


@router.post("/courses/{course_id}/lessons", response_model=LessonResponse)
def create_lesson(course_id: str, body: LessonCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    if not db.query(Course).filter(Course.id == course_id).first():
        raise HTTPException(status_code=404, detail="Course not found")
    lesson = Lesson(course_id=course_id, **body.dict())
    db.add(lesson)
    db.flush()
    add_history(
        db,
        module="lms",
        action="created",
        title=f"Lesson added: {lesson.title}",
        details=f"Course ID: {course_id} | Type: {lesson.content_type} | Due: {lesson.due_at or '-'} | Marks: {lesson.max_marks}",
        record_id=lesson.id,
        created_by_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.commit()
    db.refresh(lesson)
    return lesson


@router.get("/courses/{course_id}/lessons", response_model=list[LessonResponse])
def list_lessons(course_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Lesson).filter(Lesson.course_id == course_id).order_by(Lesson.sort_order).all()


@router.get("/student/courses", response_model=list[StudentCourseListItemResponse])
def student_enrolled_courses(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    return get_student_lms_courses(db, current_user)


@router.get("/student/courses/{course_id}", response_model=StudentCourseDetailResponse)
def student_course_detail(course_id: str, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    return get_student_course_with_materials(db, current_user.id, course_id)


@router.get("/student/materials/{material_id}/download")
def download_student_lms_material(material_id: str, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    material = db.query(TrainerLessonMaterial).filter(TrainerLessonMaterial.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="Material not found")

    course = db.query(Course).filter(Course.id == material.course_id).first()
    if not course or course.status.lower() not in {"published", "active"}:
        raise HTTPException(status_code=403, detail="Material is not available")

    get_student_course_with_materials(db, current_user.id, material.course_id)

    material.download_count = (material.download_count or 0) + 1
    db.commit()
    return FileResponse(
        material_storage_path(material),
        filename=material.filename,
        media_type="application/octet-stream",
    )


@router.post("/courses/{course_id}/enroll")
def enroll(course_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can enroll")
    existing = db.query(Enrollment).filter(Enrollment.course_id == course_id, Enrollment.student_id == current_user.id).first()
    if existing:
        return {"message": "Already enrolled", "progress_percent": existing.progress_percent}
    db.add(Enrollment(course_id=course_id, student_id=current_user.id))
    db.commit()
    return {"message": "Enrollment created", "progress_percent": 0}

@router.post("/enrollments/assign")
def assign_enrollment(
    body: EnrollmentAssign,
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER)),
):
    course = db.query(Course).filter(Course.id == body.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = db.query(User).filter(User.id == body.student_id, User.role == UserRole.STUDENT).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role != UserRole.SUPER_ADMIN and student.branch_id != current_user.branch_id:
        raise HTTPException(status_code=403, detail="Not allowed to assign this student")

    existing = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == body.course_id,
            Enrollment.student_id == body.student_id,
        )
        .first()
    )

    if existing:
        return {
            "message": "Student already assigned to this batch",
            "enrollment_id": existing.id,
            "progress_percent": existing.progress_percent,
        }

    enrollment = Enrollment(course_id=body.course_id, student_id=body.student_id, batch_name=body.batch_name)
    if body.batch_name:
        student.batch_name = body.batch_name
        student.course_enrolled = course.title
    db.add(enrollment)
    db.flush()
    add_history(
        db,
        module="lms",
        action="assigned",
        title=f"Student assigned: {student.full_name}",
        details=f"Course: {course.title} | Batch: {body.batch_name or '-'} | Progress: {enrollment.progress_percent}%",
        record_id=enrollment.id,
        created_by_id=current_user.id,
        branch_id=student.branch_id,
    )
    db.commit()
    db.refresh(enrollment)

    return {
        "message": "Student assigned to batch successfully",
        "enrollment_id": enrollment.id,
        "progress_percent": enrollment.progress_percent,
    }


@router.get("/enrollments", response_model=list[EnrollmentResponse])
def list_enrollments(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    query = db.query(Enrollment).order_by(Enrollment.enrolled_at.desc())
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Enrollment.student_id == current_user.id)
    elif current_user.role == UserRole.PARENT:
        query = query.filter(Enrollment.student_id.in_(_parent_student_ids(db, current_user)))
    elif current_user.role != UserRole.SUPER_ADMIN:
        query = query.join(User, Enrollment.student_id == User.id).filter(User.branch_id == current_user.branch_id)
    return query.all()


@router.post("/lessons/{lesson_id}/progress")
def update_progress(lesson_id: str, body: ProgressUpdate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    lesson = db.query(Lesson).filter(Lesson.id == lesson_id).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    progress = db.query(LessonProgress).filter(LessonProgress.lesson_id == lesson_id, LessonProgress.student_id == current_user.id).first()
    if not progress:
        progress = LessonProgress(lesson_id=lesson_id, student_id=current_user.id)
        db.add(progress)
    progress.is_completed = body.is_completed
    progress.completed_at = datetime.utcnow() if body.is_completed else None
    db.commit()
    return {"progress_percent": _recalculate_progress(db, lesson.course_id, current_user.id)}


@router.post("/courses/{course_id}/quizzes")
def create_quiz(course_id: str, body: QuizCreate, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER))):
    quiz = Quiz(course_id=course_id, title=body.title, description=body.description, passing_score=body.passing_score, total_marks=body.total_marks, status=body.status)
    db.add(quiz)
    db.flush()
    for question in body.questions:
        db.add(QuizQuestion(quiz_id=quiz.id, **question.dict()))
    add_history(
        db,
        module="lms",
        action="created",
        title=f"Quiz created: {quiz.title}",
        details=f"Course ID: {course_id} | Passing score: {quiz.passing_score} | Questions: {len(body.questions)}",
        record_id=quiz.id,
        created_by_id=current_user.id,
        branch_id=current_user.branch_id,
    )
    db.commit()
    db.refresh(quiz)
    return {"message": "Quiz created", "id": quiz.id}


@router.get("/courses/{course_id}/quizzes")
def list_quizzes(course_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    return [{"id": quiz.id, "title": quiz.title, "description": quiz.description, "passing_score": quiz.passing_score, "total_marks": quiz.total_marks, "status": quiz.status, "questions": [{"id": question.id, "question": question.question, "option_a": question.option_a, "option_b": question.option_b, "option_c": question.option_c, "option_d": question.option_d, "marks": question.marks} for question in quiz.questions]} for quiz in quizzes]


@router.post("/quizzes/{quiz_id}/attempt")
def submit_quiz(quiz_id: str, body: QuizAttemptSubmit, db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    score = 0
    possible = 0
    for question in quiz.questions:
        possible += question.marks
        if body.answers.get(question.id, "").upper() == question.correct_option.upper():
            score += question.marks
    percent = round((score / possible) * 100) if possible else 0
    attempt = QuizAttempt(quiz_id=quiz_id, student_id=current_user.id, score=percent, passed=percent >= quiz.passing_score)
    db.add(attempt)
    db.commit()
    return {"score": percent, "passed": attempt.passed}


@router.post("/ai-tutor")
def ai_tutor(body: AiTutorRequest, _=Depends(require_roles(UserRole.STUDENT))):
    return {"answer": "Start by reviewing the lesson objective, then break the topic into small steps.", "suggested_actions": ["Review lesson notes", "Attempt the quiz", "Ask your trainer for a live clarification"], "question": body.question}

@router.post("/uploads")
async def upload_learning_file(
    file: UploadFile = File(...),
    _=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.TRAINER)),
):
    max_size = 100 * 1024 * 1024  # 100 MB
    content = await file.read()

    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="File size must be 100MB or less")

    allowed_types = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
        "application/pdf",
    ]

    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only MP4, WebM, MOV, and PDF files are allowed")

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_mb": round(len(content) / (1024 * 1024), 2),
        "url": f"/media/{file.filename}",
        "message": "File accepted",
    }
