"""
PINESPHERE ERP
Module      : Backend Platform
File        : f5a6b7c8d901_invite_status_fields.py
Purpose     : Provides F5a6b7c8d901 Invite Status Fields backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""add invite status fields to users"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "f5a6b7c8d901"
down_revision: Union[str, Sequence[str], None] = "e4f5a6b7c890"
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
    columns = _column_names("users")
    additions = {
        "invite_token_hash": sa.Column("invite_token_hash", sa.String(), nullable=True),
        "invite_sent_at": sa.Column("invite_sent_at", sa.DateTime(), nullable=True),
        "invite_expires_at": sa.Column("invite_expires_at", sa.DateTime(), nullable=True),
        "invite_accepted_at": sa.Column("invite_accepted_at", sa.DateTime(), nullable=True),
        "invite_status": sa.Column("invite_status", sa.String(), nullable=True),
    }
    for name, column in additions.items():
        if name not in columns:
            op.add_column("users", column)

    indexes = _index_names("users")
    if "ix_users_invite_token_hash" not in indexes:
        op.create_index("ix_users_invite_token_hash", "users", ["invite_token_hash"], unique=True)
    if "ix_users_invite_status" not in indexes:
        op.create_index("ix_users_invite_status", "users", ["invite_status"], unique=False)


def downgrade() -> None:
    pass
