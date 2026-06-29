"""
PINESPHERE ERP
Module      : Profile Module
File        : c2d3e4f5a678_profile_session_metadata.py
Purpose     : Provides C2d3e4f5a678 Profile Session Metadata backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""add profile login and hashed session metadata"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "c2d3e4f5a678"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e567"
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


def _index_names(table_name: str) -> set[str]:
    return {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def upgrade() -> None:
    user_columns = _column_names("users")
    if "last_login_at" not in user_columns:
        op.add_column("users", sa.Column("last_login_at", sa.DateTime(), nullable=True))

    token_columns = _column_names("refresh_tokens")
    additions = {
        "token_hash": sa.Column("token_hash", sa.String(), nullable=True),
        "device_info": sa.Column("device_info", sa.Text(), nullable=True),
        "login_at": sa.Column("login_at", sa.DateTime(), nullable=True),
        "logout_at": sa.Column("logout_at", sa.DateTime(), nullable=True),
        "status": sa.Column("status", sa.String(), nullable=True),
    }
    for name, column in additions.items():
        if name not in token_columns:
            op.add_column("refresh_tokens", column)

    token_column = next(column for column in sa.inspect(op.get_bind()).get_columns("refresh_tokens") if column["name"] == "token")
    if not token_column["nullable"]:
        op.alter_column("refresh_tokens", "token", existing_type=sa.String(), nullable=True)

    if "ix_refresh_tokens_token_hash" not in _index_names("refresh_tokens"):
        op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)

    op.execute(
        """
        UPDATE refresh_tokens
        SET login_at = COALESCE(login_at, created_at),
            status = COALESCE(status, CASE WHEN revoked THEN 'revoked' ELSE 'active' END)
        """
    )


def downgrade() -> None:
    pass
