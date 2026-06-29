"""
PINESPHERE ERP
Module      : Authentication Module
File        : e4f5a6b7c890_auth_action_tokens_and_verification.py
Purpose     : Provides E4f5a6b7c890 Auth Action Tokens And Verification backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""add auth action tokens and verification metadata"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e4f5a6b7c890"
down_revision: Union[str, Sequence[str], None] = "d3e4f5a6b789"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _column_names(table_name: str) -> set[str]:
    if table_name not in _table_names():
        return set()
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def _index_names(table_name: str) -> set[str]:
    if table_name not in _table_names():
        return set()
    return {index["name"] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def upgrade() -> None:
    user_columns = _column_names("users")
    if "email_verified_at" not in user_columns:
        op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))

    token_columns = _column_names("refresh_tokens")
    if "browser" not in token_columns:
        op.add_column("refresh_tokens", sa.Column("browser", sa.String(), nullable=True))
    if "operating_system" not in token_columns:
        op.add_column("refresh_tokens", sa.Column("operating_system", sa.String(), nullable=True))

    if "auth_action_tokens" not in _table_names():
        op.create_table(
            "auth_action_tokens",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=False),
            sa.Column("token_hash", sa.String(), nullable=False),
            sa.Column("purpose", sa.String(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("used_at", sa.DateTime(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )

    indexes = _index_names("auth_action_tokens")
    if "ix_auth_action_tokens_user_id" not in indexes:
        op.create_index("ix_auth_action_tokens_user_id", "auth_action_tokens", ["user_id"], unique=False)
    if "ix_auth_action_tokens_token_hash" not in indexes:
        op.create_index("ix_auth_action_tokens_token_hash", "auth_action_tokens", ["token_hash"], unique=True)
    if "ix_auth_action_tokens_purpose" not in indexes:
        op.create_index("ix_auth_action_tokens_purpose", "auth_action_tokens", ["purpose"], unique=False)


def downgrade() -> None:
    pass
