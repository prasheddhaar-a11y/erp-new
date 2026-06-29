"""Add compound indexes for hot ERP queries.

Revision ID: 20260623_0715
Revises: 0f1e2d3c4b5a
Create Date: 2026-06-23 07:15:00.000000
"""

from alembic import op


revision = "20260623_0715"
down_revision = "0f1e2d3c4b5a"
branch_labels = None
depends_on = None


INDEXES = (
    ("ix_users_role_active_branch", "users", ["role", "is_active", "branch_id"]),
    ("ix_users_role_active_status", "users", ["role", "is_active", "student_status"]),
    ("ix_courses_trainer_updated", "courses", ["trainer_id", "updated_at", "created_at"]),
    ("ix_courses_status_trainer", "courses", ["status", "trainer_id"]),
    ("ix_lessons_course_sort_created", "lessons", ["course_id", "sort_order", "created_at"]),
    ("ix_lessons_course_type_created", "lessons", ["course_id", "content_type", "created_at"]),
    ("ix_enrollments_student_status_created", "enrollments", ["student_id", "status", "enrolled_at"]),
    ("ix_enrollments_course_status_student", "enrollments", ["course_id", "status", "student_id"]),
    ("ix_lesson_progress_student_lesson_completed", "lesson_progress", ["student_id", "lesson_id", "is_completed"]),
    ("ix_quiz_attempts_student_quiz_submitted", "quiz_attempts", ["student_id", "quiz_id", "submitted_at"]),
    ("ix_attendance_sessions_trainer_course_date", "attendance_sessions", ["trainer_id", "course_id", "session_date"]),
    ("ix_attendance_records_student_session_status", "attendance_records", ["student_id", "session_id", "status"]),
    ("ix_attendance_records_session_student", "attendance_records", ["session_id", "student_id"]),
    ("ix_batch_trainer_assignments_trainer_batch", "batch_trainer_assignments", ["trainer_id", "batch_id"]),
    ("ix_batch_student_enrollments_batch_status_student", "batch_student_enrollments", ["batch_id", "status", "student_id"]),
    ("ix_batch_student_enrollments_student_status_batch", "batch_student_enrollments", ["student_id", "status", "batch_id"]),
    ("ix_trainer_lesson_materials_course_lesson_created", "trainer_lesson_materials", ["course_id", "lesson_id", "created_at"]),
    ("ix_trainer_lesson_materials_trainer_created", "trainer_lesson_materials", ["trainer_id", "created_at"]),
    ("ix_trainer_lesson_materials_course_trainer_created", "trainer_lesson_materials", ["course_id", "trainer_id", "created_at"]),
    ("ix_trainer_tasks_trainer_status_due", "trainer_tasks", ["trainer_id", "status", "due_date"]),
    ("ix_leads_counsellor_status_followup", "leads", ["counsellor_id", "status", "next_follow_up_at"]),
    ("ix_leads_branch_status_created", "leads", ["branch_id", "status", "created_at"]),
    ("ix_admissions_counsellor_stage_created", "admissions", ["counsellor_id", "stage", "created_at"]),
    ("ix_admissions_branch_stage_created", "admissions", ["branch_id", "stage", "created_at"]),
    ("ix_calendar_events_assigned_status_start", "calendar_events", ["assigned_to", "status", "start_time"]),
    ("ix_calendar_events_branch_status_start", "calendar_events", ["branch_id", "status", "start_time"]),
    ("ix_tasks_assigned_status_due", "tasks", ["assigned_to", "status", "due_date"]),
    ("ix_tasks_branch_status_due", "tasks", ["branch_id", "status", "due_date"]),
)


def upgrade() -> None:
    bind = op.get_bind()
    existing_tables = set(bind.dialect.get_table_names(bind))
    for index_name, table_name, columns in INDEXES:
        if table_name in existing_tables:
            op.create_index(index_name, table_name, columns, unique=False, if_not_exists=True)


def downgrade() -> None:
    bind = op.get_bind()
    existing_tables = set(bind.dialect.get_table_names(bind))
    for index_name, table_name, _columns in reversed(INDEXES):
        if table_name in existing_tables:
            op.drop_index(index_name, table_name=table_name, if_exists=True)
