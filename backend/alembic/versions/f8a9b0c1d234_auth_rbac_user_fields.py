"""
PINESPHERE ERP
Module      : Users Module
File        : f8a9b0c1d234_auth_rbac_user_fields.py
Purpose     : Provides F8a9b0c1d234 Auth Rbac User Fields backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""auth rbac user fields"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f8a9b0c1d234"
down_revision: Union[str, Sequence[str], None] = "e6f7a8b9c012"
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


def upgrade() -> None:
    _add_column_if_missing("users", sa.Column("role_abbreviation", sa.String(length=2), nullable=True))
    _add_column_if_missing("users", sa.Column("franchise_id", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("profile_photo", sa.Text(), nullable=True))
    _add_column_if_missing("users", sa.Column("created_at", sa.DateTime(), nullable=True))

    bind = op.get_bind()
    bind.execute(
        sa.text(
            """
            UPDATE users
            SET role_abbreviation = CASE lower(CAST(role AS text))
                WHEN 'super_admin' THEN 'SA'
                WHEN 'branch_admin' THEN 'BA'
                WHEN 'counsellor' THEN 'CL'
                WHEN 'trainer' THEN 'TR'
                WHEN 'hr' THEN 'HR'
                WHEN 'finance' THEN 'FN'
                WHEN 'student' THEN 'ST'
                WHEN 'parent' THEN 'PA'
                WHEN 'franchise_owner' THEN 'FO'
                WHEN 'company_hr' THEN 'CH'
                WHEN 'public' THEN 'PB'
                ELSE role_abbreviation
            END,
            created_at = COALESCE(created_at, CURRENT_TIMESTAMP)
            WHERE role_abbreviation IS NULL OR created_at IS NULL
            """
        )
    )

    inspector = sa.inspect(bind)
    indexes = {index["name"] for index in inspector.get_indexes("users")}
    if "ix_users_franchise_id" not in indexes:
        op.create_index("ix_users_franchise_id", "users", ["franchise_id"], unique=False)


def downgrade() -> None:
    pass
