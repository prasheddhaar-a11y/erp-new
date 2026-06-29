"""
PINESPHERE ERP
Module      : Backend Platform
File        : d3e4f5a6b789_session_identity_snapshot.py
Purpose     : Provides D3e4f5a6b789 Session Identity Snapshot backend functionality
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

"""add session identity snapshot"""
# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "d3e4f5a6b789"
down_revision: Union[str, Sequence[str], None] = "c2d3e4f5a678"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("refresh_tokens")}
    if "email" not in columns:
        op.add_column("refresh_tokens", sa.Column("email", sa.String(), nullable=True))
    if "role" not in columns:
        op.add_column("refresh_tokens", sa.Column("role", sa.String(), nullable=True))
    op.execute(
        """
        UPDATE refresh_tokens AS refresh
        SET email = COALESCE(refresh.email, users.email),
            role = COALESCE(refresh.role, CAST(users.role AS VARCHAR))
        FROM users
        WHERE users.id = refresh.user_id
        """
    )


def downgrade() -> None:
    pass
