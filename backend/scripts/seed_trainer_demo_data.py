"""
Seed demo data for the Trainer portal.

Run from backend:
    python scripts/seed_trainer_demo_data.py
"""

import os
import sys
import uuid
from datetime import date, datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.roles import UserRole, role_abbreviation
from app.core.security import hash_password
from app.db.database import Base, SessionLocal, engine
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.batch import Batch, BatchStudentEnrollment, BatchTrainerAssignment
from app.models.branch import Branch
from app.models.lms import Course, Enrollment, Lesson, Quiz, QuizQuestion
from app.models.trainer import TrainerLessonMaterial, TrainerTask
from app.models.user import User
from app.services.trainers.lms import UPLOADS_ROOT

DEMO_PASSWORD = "Admin@123"
BRANCH_CODE = "MAIN"
BRANCH_ID = "main"
TRAINER_EMAIL = "trainer@pinesphere.com"


def _ensure_branch(db) -> Branch:
    branch = db.query(Branch).filter(Branch.id == BRANCH_ID).first()
    if branch:
        branch.name = branch.name or "Pinesphere Kochi"
        branch.code = branch.code or BRANCH_CODE
        branch.city = branch.city or "Kochi"
        branch.status = "active"
        return branch

    branch = Branch(
        id=BRANCH_ID,
        name="Pinesphere Kochi",
        code=BRANCH_CODE,
        city="Kochi",
        address="Demo campus for trainer testing",
        manager_name="Branch Admin",
        phone="9876500001",
        capacity=120,
        status="active",
        display_code="BR-MAIN",
    )
    db.add(branch)
    db.flush()
    return branch


def _ensure_user(db, email: str, full_name: str, role: UserRole, display_code: str, branch_id: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            hashed_password=hash_password(DEMO_PASSWORD),
            role=role,
            role_abbreviation=role_abbreviation(role),
            branch_id=branch_id,
            display_code=display_code,
            is_active=True,
            email_verified=True,
        )
        db.add(user)

    user.full_name = full_name
    user.role = role
    user.role_abbreviation = role_abbreviation(role)
    user.branch_id = branch_id
    user.display_code = display_code
    user.is_active = True
    user.email_verified = True
    if role == UserRole.STUDENT:
        user.student_status = "active"
        user.document_status = "verified"
        user.admission_date = date.today() - timedelta(days=18)
    db.flush()
    return user


def _ensure_course(db, trainer: User, title: str, code: str, difficulty: str) -> Course:
    course = db.query(Course).filter(Course.display_code == code).first()
    if not course:
        course = Course(
            id=str(uuid.uuid4()),
            title=title,
            description=f"Demo trainer course for checking {title}.",
            display_code=code,
        )
        db.add(course)

    course.title = title
    course.description = f"Demo trainer course for checking {title}."
    course.trainer_id = trainer.id
    course.duration = "16 weeks"
    course.difficulty_level = difficulty
    course.status = "published"
    db.flush()
    return course


def _ensure_batch(db, branch: Branch, course: Course, name: str) -> Batch:
    batch = db.query(Batch).filter(Batch.name == name, Batch.branch_id == branch.id).first()
    if not batch:
        batch = Batch(
            id=str(uuid.uuid4()),
            name=name,
            branch_id=branch.id,
            course_id=course.id,
        )
        db.add(batch)

    batch.course_id = course.id
    batch.start_date = datetime.utcnow() - timedelta(days=24)
    batch.end_date = datetime.utcnow() + timedelta(days=84)
    batch.schedule = {"days": ["Mon", "Wed", "Fri"], "time": "10:00 AM"}
    batch.status = "active"
    db.flush()
    return batch


def _ensure_batch_trainer(db, batch: Batch, trainer: User) -> None:
    exists = (
        db.query(BatchTrainerAssignment)
        .filter(
            BatchTrainerAssignment.batch_id == batch.id,
            BatchTrainerAssignment.trainer_id == trainer.id,
        )
        .first()
    )
    if not exists:
        db.add(BatchTrainerAssignment(batch_id=batch.id, trainer_id=trainer.id))
        db.flush()


def _ensure_student(db, index: int, course: Course, batch: Batch, trainer: User) -> User:
    names = [
        "Arun Demo Student",
        "Meera Demo Student",
        "Nikhil Demo Student",
        "Priya Demo Student",
        "Rahul Demo Student",
        "Sneha Demo Student",
    ]
    name = names[index - 1]
    email = f"trainer.demo.student{index}@pinesphere.com"
    student = _ensure_user(db, email, name, UserRole.STUDENT, f"TDS-{index:03d}", BRANCH_ID)
    student.course_enrolled = course.title
    student.batch_name = batch.name
    student.trainer_name = trainer.full_name
    student.phone = f"90909010{index:02d}"
    student.parent_name = f"Parent {index}"
    student.parent_phone = f"80808010{index:02d}"

    enrollment = (
        db.query(BatchStudentEnrollment)
        .filter(
            BatchStudentEnrollment.batch_id == batch.id,
            BatchStudentEnrollment.student_id == student.id,
        )
        .first()
    )
    if not enrollment:
        db.add(BatchStudentEnrollment(batch_id=batch.id, student_id=student.id, status="active"))
    else:
        enrollment.status = "active"

    lms_enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.course_id == course.id, Enrollment.student_id == student.id)
        .first()
    )
    if not lms_enrollment:
        db.add(
            Enrollment(
                course_id=course.id,
                student_id=student.id,
                progress_percent=35 + index * 8,
                batch_name=batch.name,
                status="active",
            )
        )
    else:
        lms_enrollment.status = "active"
        lms_enrollment.batch_name = batch.name
    db.flush()
    return student


def _ensure_lms_items(db, course: Course) -> None:
    lessons = [
        ("Intro Lesson", "lesson", 1, 0),
        ("Hands-on Assignment", "assignment", 2, 100),
        ("Project Submission", "assignment", 3, 100),
    ]
    for title, content_type, sort_order, max_marks in lessons:
        lesson = (
            db.query(Lesson)
            .filter(Lesson.course_id == course.id, Lesson.title == title)
            .first()
        )
        if not lesson:
            lesson = Lesson(course_id=course.id, title=title)
            db.add(lesson)
        lesson.summary = f"Demo {content_type} for trainer checking."
        lesson.content = "Demo content for portal verification."
        lesson.content_type = content_type
        lesson.sort_order = sort_order
        lesson.max_marks = max_marks
        lesson.due_at = datetime.utcnow() + timedelta(days=sort_order * 3) if content_type == "assignment" else None

    quiz = db.query(Quiz).filter(Quiz.course_id == course.id, Quiz.title == "Demo Quiz").first()
    if not quiz:
        quiz = Quiz(course_id=course.id, title="Demo Quiz")
        db.add(quiz)
        db.flush()
    quiz.description = "Demo quiz for trainer dashboard."
    quiz.total_marks = 50
    quiz.passing_score = 30
    quiz.status = "published"

    question = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).first()
    if not question:
        db.add(
            QuizQuestion(
                quiz_id=quiz.id,
                question="Which item is used for demo trainer checking?",
                option_a="Batch",
                option_b="Invoice",
                option_c="Vendor",
                option_d="Asset",
                correct_option="A",
                marks=5,
            )
        )
    db.flush()


def _ensure_demo_materials(db, trainer: User, course: Course) -> None:
    lessons = (
        db.query(Lesson)
        .filter(Lesson.course_id == course.id)
        .order_by(Lesson.sort_order.asc())
        .all()
    )
    if not lessons:
        return

    dest_dir = os.path.join(UPLOADS_ROOT, trainer.id, course.id)
    os.makedirs(dest_dir, exist_ok=True)

    for index, lesson in enumerate(lessons[:2], start=1):
        filename = f"{course.display_code.lower()}-lesson-{index}-demo-material.txt"
        material = (
            db.query(TrainerLessonMaterial)
            .filter(
                TrainerLessonMaterial.trainer_id == trainer.id,
                TrainerLessonMaterial.course_id == course.id,
                TrainerLessonMaterial.lesson_id == lesson.id,
                TrainerLessonMaterial.filename == filename,
            )
            .first()
        )
        if not material:
            material = TrainerLessonMaterial(
                id=str(uuid.uuid4()),
                trainer_id=trainer.id,
                course_id=course.id,
                lesson_id=lesson.id,
                filename=filename,
                file_url="",
                content_type="text/plain",
                download_count=0,
            )
            db.add(material)
            db.flush()

        file_body = (
            f"Demo material uploaded by trainer for {course.title}\n"
            f"Lesson: {lesson.title}\n"
            "This file verifies trainer-to-student LMS material visibility.\n"
        ).encode("utf-8")
        material_path = os.path.join(dest_dir, f"{material.id}_{filename}")
        with open(material_path, "wb") as handle:
            handle.write(file_body)

        material.file_url = f"/api/v1/trainer/lms/materials/{material.id}/download"
        material.file_size = len(file_body)
        material.content_type = "text/plain"
    db.flush()


def _ensure_attendance(db, trainer: User, course: Course, students: list[User]) -> None:
    for offset in range(5, -1, -1):
        session_date = date.today() - timedelta(days=offset)
        title = f"{course.title} Demo Class {session_date.strftime('%d %b')}"
        session = (
            db.query(AttendanceSession)
            .filter(
                AttendanceSession.trainer_id == trainer.id,
                AttendanceSession.course_id == course.id,
                AttendanceSession.session_date == session_date,
            )
            .first()
        )
        if not session:
            session = AttendanceSession(
                trainer_id=trainer.id,
                course_id=course.id,
                title=title,
                session_date=session_date,
            )
            db.add(session)
            db.flush()
        session.title = title

        for index, student in enumerate(students, start=1):
            record = (
                db.query(AttendanceRecord)
                .filter(
                    AttendanceRecord.session_id == session.id,
                    AttendanceRecord.student_id == student.id,
                )
                .first()
            )
            status = "late" if index == 2 and offset % 2 == 0 else "present"
            if index == len(students) and offset in (1, 3):
                status = "absent"
            if not record:
                record = AttendanceRecord(session_id=session.id, student_id=student.id)
                db.add(record)
            record.status = status
            record.minutes_late = 10 if status == "late" else 0
            record.marked_by_id = trainer.id
            record.method = "manual"
            record.remarks = "Demo attendance record"
    db.flush()


def _ensure_tasks(db, trainer: User) -> None:
    tasks = [
        ("Review demo assignment submissions", 1),
        ("Prepare tomorrow demo class notes", 2),
        ("Call absent demo student", 0),
    ]
    for title, due_days in tasks:
        task = db.query(TrainerTask).filter(TrainerTask.trainer_id == trainer.id, TrainerTask.title == title).first()
        if not task:
            task = TrainerTask(trainer_id=trainer.id, title=title)
            db.add(task)
        task.description = "Demo trainer task for dashboard testing."
        task.due_date = datetime.utcnow() + timedelta(days=due_days)
        task.status = "pending"
    db.flush()


def seed_trainer_demo_data() -> list[str]:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    messages: list[str] = []
    try:
        branch = _ensure_branch(db)
        trainer = _ensure_user(db, TRAINER_EMAIL, "Trainer", UserRole.TRAINER, "TR-DEMO", branch.id)

        course_one = _ensure_course(db, trainer, "Full Stack Development Demo", "TR-DEMO-FS", "Intermediate")
        course_two = _ensure_course(db, trainer, "Data Science Demo", "TR-DEMO-DS", "Beginner")
        batch_one = _ensure_batch(db, branch, course_one, "FS-Demo-Batch-01")
        batch_two = _ensure_batch(db, branch, course_two, "DS-Demo-Batch-01")
        _ensure_batch_trainer(db, batch_one, trainer)
        _ensure_batch_trainer(db, batch_two, trainer)

        students = []
        for index in range(1, 4):
            students.append(_ensure_student(db, index, course_one, batch_one, trainer))
        for index in range(4, 7):
            students.append(_ensure_student(db, index, course_two, batch_two, trainer))

        _ensure_lms_items(db, course_one)
        _ensure_lms_items(db, course_two)
        _ensure_demo_materials(db, trainer, course_one)
        _ensure_demo_materials(db, trainer, course_two)
        _ensure_attendance(db, trainer, course_one, students[:3])
        _ensure_attendance(db, trainer, course_two, students[3:])
        _ensure_tasks(db, trainer)

        db.commit()
        messages.extend(
            [
                f"Trainer ready: {TRAINER_EMAIL} / {DEMO_PASSWORD}",
                "Created/updated 2 demo courses",
                "Created/updated 2 demo batches",
                "Created/updated 6 demo students",
                "Created/updated attendance, assignments, quizzes, and pending tasks",
            ]
        )
    finally:
        db.close()
    return messages


if __name__ == "__main__":
    for message in seed_trainer_demo_data():
        print(message)
