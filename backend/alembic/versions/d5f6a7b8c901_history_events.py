"""
PINESPHERE ERP
Module      : Backend Platform
File        : d5f6a7b8c901_history_events.py
Purpose     : Provides D5f6a7b8c901 History Events backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""history events"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d5f6a7b8c901"
down_revision: Union[str, Sequence[str], None] = "b7a4c2d9e101"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "history_events" not in tables:
        op.create_table(
            "history_events",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("module", sa.String(), nullable=False),
            sa.Column("action", sa.String(), nullable=False),
            sa.Column("title", sa.String(), nullable=False),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("record_id", sa.String(), nullable=True),
            sa.Column("created_by_id", sa.String(), nullable=True),
            sa.Column("branch_id", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["created_by_id"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {index["name"] for index in inspector.get_indexes("history_events")}
    indexes = [
        (op.f("ix_history_events_branch_id"), ["branch_id"]),
        (op.f("ix_history_events_created_at"), ["created_at"]),
        (op.f("ix_history_events_module"), ["module"]),
        (op.f("ix_history_events_record_id"), ["record_id"]),
    ]
    for index_name, columns in indexes:
        if index_name not in existing_indexes:
            op.create_index(index_name, "history_events", columns, unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_history_events_record_id"), table_name="history_events")
    op.drop_index(op.f("ix_history_events_module"), table_name="history_events")
    op.drop_index(op.f("ix_history_events_created_at"), table_name="history_events")
    op.drop_index(op.f("ix_history_events_branch_id"), table_name="history_events")
    op.drop_table("history_events")
