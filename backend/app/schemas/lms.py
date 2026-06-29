"""
PINESPHERE ERP
Module      : LMS Module
File        : lms.py
Purpose     : Defines Lms request and response schemas
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

from pydantic import BaseModel


# =====================================================
# SECTION: SCHEMAS
# PURPOSE:
# This section defines request and response data shapes.
# Schemas validate incoming data and document what endpoints return.
# =====================================================

class CourseBase(BaseModel):
    title: str
    description: str
    thumbnail_url: str | None = None
    trainer_id: str | None = None
    duration: str | None = None
    difficulty_level: str = "Beginner"
    status: str = "draft"


class CourseCreate(CourseBase):
    pass

class EnrollmentAssign(BaseModel):
    student_id: str
    course_id: str
    batch_name: str | None = None


class EnrollmentResponse(BaseModel):
    id: str
    course_id: str
    student_id: str
    progress_percent: int
    batch_name: str | None = None
    status: str | None = None
    enrolled_at: datetime

    class Config:
        from_attributes = True

class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    thumbnail_url: str | None = None
    trainer_id: str | None = None
    duration: str | None = None
    difficulty_level: str | None = None
    status: str | None = None


class CourseResponse(CourseBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    title: str
    summary: str | None = None
    content: str | None = None
    video_url: str | None = None
    pdf_url: str | None = None
    assignment_url: str | None = None
    content_type: str = "lesson"
    due_at: datetime | None = None
    max_marks: int = 0
    sort_order: int = 1
    is_preview: bool = False


class LessonResponse(LessonCreate):
    id: str
    course_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class StudentMaterialResponse(BaseModel):
    id: str
    lesson_id: str | None = None
    filename: str
    file_url: str
    file_size: int | None = None
    content_type: str
    download_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class StudentLessonResponse(LessonResponse):
    is_completed: bool = False
    completed_at: datetime | None = None
    materials: list[StudentMaterialResponse] = []


class StudentCourseDetailResponse(CourseResponse):
    lessons: list[StudentLessonResponse] = []


class StudentCourseListItemResponse(BaseModel):
    id: str
    title: str
    description: str
    duration: str | None = None
    difficulty_level: str
    status: str
    trainer: str | None = None
    trainer_initials: str | None = None
    total_lessons: int
    completed_lessons: int
    progress_percent: int
    material_count: int
    video_count: int


class ProgressUpdate(BaseModel):
    is_completed: bool = True


class QuizQuestionCreate(BaseModel):
    question: str
    option_a: str
    option_b: str
    option_c: str | None = None
    option_d: str | None = None
    correct_option: str
    marks: int = 1


class QuizCreate(BaseModel):
    title: str
    description: str | None = None
    passing_score: int = 60
    total_marks: int = 100
    status: str = "draft"
    questions: list[QuizQuestionCreate] = []


class QuizAttemptSubmit(BaseModel):
    answers: dict[str, str]


class AiTutorRequest(BaseModel):
    course_id: str | None = None
    lesson_id: str | None = None
    question: str
