"""Add trainer portal tables — batches, batch_trainer_assignments, batch_student_enrollments, trainer_tasks

Revision ID: 20260610_0224
Revises: <replace_with_latest_revision_id>
Create Date: 2026-06-10T02:24:00

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20260610_0224"
down_revision = None  # <-- replace with actual latest revision ID
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============================================================
    # TABLE: batches
    # ============================================================
    op.create_table(
        "batches",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("branch_id", sa.String(), nullable=False),
        sa.Column("course_id", sa.String(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=True),
        sa.Column("end_date", sa.DateTime(), nullable=True),
        sa.Column("schedule", sa.JSON(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["course_id"], ["courses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_batches_branch_id"), "batches", ["branch_id"], unique=False)
    op.create_index(op.f("ix_batches_course_id"), "batches", ["course_id"], unique=False)
    op.create_index(op.f("ix_batches_name"), "batches", ["name"], unique=False)
    op.create_index(op.f("ix_batches_status"), "batches", ["status"], unique=False)

    # ============================================================
    # TABLE: batch_trainer_assignments
    # ============================================================
    op.create_table(
        "batch_trainer_assignments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("batch_id", sa.String(), nullable=False),
        sa.Column("trainer_id", sa.String(), nullable=False),
        sa.Column("assigned_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["trainer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id", "trainer_id"),
    )
    op.create_index(op.f("ix_batch_trainer_assignments_batch_id"), "batch_trainer_assignments", ["batch_id"], unique=False)
    op.create_index(op.f("ix_batch_trainer_assignments_trainer_id"), "batch_trainer_assignments", ["trainer_id"], unique=False)

    # ============================================================
    # TABLE: batch_student_enrollments
    # ============================================================
    op.create_table(
        "batch_student_enrollments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("batch_id", sa.String(), nullable=False),
        sa.Column("student_id", sa.String(), nullable=False),
        sa.Column("enrolled_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("batch_id", "student_id"),
    )
    op.create_index(op.f("ix_batch_student_enrollments_batch_id"), "batch_student_enrollments", ["batch_id"], unique=False)
    op.create_index(op.f("ix_batch_student_enrollments_status"), "batch_student_enrollments", ["status"], unique=False)
    op.create_index(op.f("ix_batch_student_enrollments_student_id"), "batch_student_enrollments", ["student_id"], unique=False)

    # ============================================================
    # TABLE: trainer_tasks
    # ============================================================
    op.create_table(
        "trainer_tasks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("trainer_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_date", sa.DateTime(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["trainer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trainer_tasks_due_date"), "trainer_tasks", ["due_date"], unique=False)
    op.create_index(op.f("ix_trainer_tasks_status"), "trainer_tasks", ["status"], unique=False)
    op.create_index(op.f("ix_trainer_tasks_title"), "trainer_tasks", ["title"], unique=False)
    op.create_index(op.f("ix_trainer_tasks_trainer_id"), "trainer_tasks", ["trainer_id"], unique=False)


def downgrade() -> None:
    # ============================================================
    # DROP: trainer_tasks
    # ============================================================
    op.drop_index(op.f("ix_trainer_tasks_trainer_id"), table_name="trainer_tasks")
    op.drop_index(op.f("ix_trainer_tasks_title"), table_name="trainer_tasks")
    op.drop_index(op.f("ix_trainer_tasks_status"), table_name="trainer_tasks")
    op.drop_index(op.f("ix_trainer_tasks_due_date"), table_name="trainer_tasks")
    op.drop_table("trainer_tasks")

    # ============================================================
    # DROP: batch_student_enrollments
    # ============================================================
    op.drop_index(op.f("ix_batch_student_enrollments_student_id"), table_name="batch_student_enrollments")
    op.drop_index(op.f("ix_batch_student_enrollments_status"), table_name="batch_student_enrollments")
    op.drop_index(op.f("ix_batch_student_enrollments_batch_id"), table_name="batch_student_enrollments")
    op.drop_table("batch_student_enrollments")

    # ============================================================
    # DROP: batch_trainer_assignments
    # ============================================================
    op.drop_index(op.f("ix_batch_trainer_assignments_trainer_id"), table_name="batch_trainer_assignments")
    op.drop_index(op.f("ix_batch_trainer_assignments_batch_id"), table_name="batch_trainer_assignments")
    op.drop_table("batch_trainer_assignments")

    # ============================================================
    # DROP: batches
    # ============================================================
    op.drop_index(op.f("ix_batches_status"), table_name="batches")
    op.drop_index(op.f("ix_batches_name"), table_name="batches")
    op.drop_index(op.f("ix_batches_course_id"), table_name="batches")
    op.drop_index(op.f("ix_batches_branch_id"), table_name="batches")
    op.drop_table("batches")