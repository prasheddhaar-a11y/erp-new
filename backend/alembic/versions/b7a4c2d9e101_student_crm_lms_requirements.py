"""
PINESPHERE ERP
Module      : Student Module
File        : b7a4c2d9e101_student_crm_lms_requirements.py
Purpose     : Provides B7a4c2d9e101 Student Crm Lms Requirements backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""student crm lms requirement fields"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7a4c2d9e101"
down_revision: Union[str, Sequence[str], None] = "8c2f1d4e7a90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    columns = {item["name"] for item in sa.inspect(bind).get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def _create_index_if_missing(table_name: str, index_name: str, columns: list[str]) -> None:
    bind = op.get_bind()
    indexes = {item["name"] for item in sa.inspect(bind).get_indexes(table_name)}
    if index_name not in indexes:
        op.create_index(index_name, table_name, columns, unique=False)


def upgrade() -> None:
    _add_column_if_missing("users", sa.Column("date_of_birth", sa.Date(), nullable=True))
    _add_column_if_missing("users", sa.Column("gender", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("address", sa.Text(), nullable=True))
    _add_column_if_missing("users", sa.Column("parent_name", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("parent_phone", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("emergency_contact", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("course_enrolled", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("batch_name", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("trainer_name", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("student_status", sa.String(), server_default="active", nullable=True))
    _add_column_if_missing("users", sa.Column("document_status", sa.String(), server_default="pending", nullable=True))
    _add_column_if_missing("users", sa.Column("admission_date", sa.Date(), nullable=True))
    _add_column_if_missing("users", sa.Column("updated_at", sa.DateTime(), nullable=True))
    _create_index_if_missing("users", op.f("ix_users_student_status"), ["student_status"])

    _add_column_if_missing("leads", sa.Column("lost_reason", sa.String(), nullable=True))
    _add_column_if_missing("leads", sa.Column("demo_at", sa.DateTime(), nullable=True))
    _add_column_if_missing("leads", sa.Column("demo_mode", sa.String(), nullable=True))
    _add_column_if_missing("leads", sa.Column("demo_link", sa.String(), nullable=True))
    _add_column_if_missing("leads", sa.Column("demo_attended", sa.String(), server_default="pending", nullable=True))

    _add_column_if_missing("lessons", sa.Column("content_type", sa.String(), server_default="lesson", nullable=True))
    _add_column_if_missing("lessons", sa.Column("due_at", sa.DateTime(), nullable=True))
    _add_column_if_missing("lessons", sa.Column("max_marks", sa.Integer(), server_default="0", nullable=True))
    _add_column_if_missing("enrollments", sa.Column("batch_name", sa.String(), nullable=True))
    _add_column_if_missing("enrollments", sa.Column("status", sa.String(), server_default="active", nullable=True))
    _create_index_if_missing("enrollments", op.f("ix_enrollments_status"), ["status"])


def downgrade() -> None:
    op.drop_index(op.f("ix_enrollments_status"), table_name="enrollments")
    op.drop_column("enrollments", "status")
    op.drop_column("enrollments", "batch_name")
    op.drop_column("lessons", "max_marks")
    op.drop_column("lessons", "due_at")
    op.drop_column("lessons", "content_type")

    op.drop_column("leads", "demo_attended")
    op.drop_column("leads", "demo_link")
    op.drop_column("leads", "demo_mode")
    op.drop_column("leads", "demo_at")
    op.drop_column("leads", "lost_reason")

    op.drop_index(op.f("ix_users_student_status"), table_name="users")
    op.drop_column("users", "updated_at")
    op.drop_column("users", "admission_date")
    op.drop_column("users", "document_status")
    op.drop_column("users", "student_status")
    op.drop_column("users", "trainer_name")
    op.drop_column("users", "batch_name")
    op.drop_column("users", "course_enrolled")
    op.drop_column("users", "emergency_contact")
    op.drop_column("users", "parent_phone")
    op.drop_column("users", "parent_name")
    op.drop_column("users", "address")
    op.drop_column("users", "gender")
    op.drop_column("users", "date_of_birth")
