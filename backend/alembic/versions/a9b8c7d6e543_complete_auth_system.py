"""
PINESPHERE ERP
Module      : Authentication Module
File        : a9b8c7d6e543_complete_auth_system.py
Purpose     : Provides A9b8c7d6e543 Complete Auth System backend functionality
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

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a9b8c7d6e543"
down_revision: Union[str, Sequence[str], None] = "f5a6b7c8d901"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _column_names(table_name: str) -> set[str]:
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def upgrade() -> None:
    columns = _column_names("auth_action_tokens")
    if "metadata_json" not in columns:
        op.add_column("auth_action_tokens", sa.Column("metadata_json", sa.Text(), nullable=True))


def downgrade() -> None:
    columns = _column_names("auth_action_tokens")
    if "metadata_json" in columns:
        op.drop_column("auth_action_tokens", "metadata_json")
