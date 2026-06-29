"""
PINESPHERE ERP
Module      : Security Module
File        : e6f7a8b9c012_security_module.py
Purpose     : Provides E6f7a8b9c012 Security Module backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""security module fields"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e6f7a8b9c012"
down_revision: Union[str, Sequence[str], None] = "d5f6a7b8c901"
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
    inspector = sa.inspect(bind)
    columns = {item["name"] for item in inspector.get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def upgrade() -> None:
    _add_column_if_missing("refresh_tokens", sa.Column("ip_address", sa.String(), nullable=True))
    _add_column_if_missing("refresh_tokens", sa.Column("user_agent", sa.Text(), nullable=True))
    _add_column_if_missing("refresh_tokens", sa.Column("device_fingerprint", sa.String(), nullable=True))
    _add_column_if_missing("refresh_tokens", sa.Column("created_at", sa.DateTime(), nullable=True))
    _add_column_if_missing("refresh_tokens", sa.Column("last_used_at", sa.DateTime(), nullable=True))

    _add_column_if_missing("audit_logs", sa.Column("module", sa.String(), nullable=True))
    _add_column_if_missing("audit_logs", sa.Column("action_type", sa.String(), nullable=True))
    _add_column_if_missing("audit_logs", sa.Column("old_value", sa.Text(), nullable=True))
    _add_column_if_missing("audit_logs", sa.Column("new_value", sa.Text(), nullable=True))
    _add_column_if_missing("audit_logs", sa.Column("user_agent", sa.Text(), nullable=True))
    _add_column_if_missing("audit_logs", sa.Column("severity", sa.String(), nullable=True))

    _add_column_if_missing("users", sa.Column("email_verified", sa.Boolean(), nullable=True))
    _add_column_if_missing("users", sa.Column("failed_login_attempts", sa.String(), nullable=True))
    _add_column_if_missing("users", sa.Column("locked_until", sa.DateTime(), nullable=True))
    _add_column_if_missing("users", sa.Column("two_factor_enabled", sa.Boolean(), nullable=True))

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "security_events" not in inspector.get_table_names():
        op.create_table(
            "security_events",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("user_id", sa.String(), nullable=True),
            sa.Column("event_type", sa.String(), nullable=False),
            sa.Column("severity", sa.String(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
            sa.Column("user_agent", sa.Text(), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
    indexes = {index["name"] for index in inspector.get_indexes("security_events")}
    if "ix_security_events_event_type" not in indexes:
        op.create_index("ix_security_events_event_type", "security_events", ["event_type"], unique=False)
    if "ix_security_events_created_at" not in indexes:
        op.create_index("ix_security_events_created_at", "security_events", ["created_at"], unique=False)


def downgrade() -> None:
    pass
