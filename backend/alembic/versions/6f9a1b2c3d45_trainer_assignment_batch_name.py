"""trainer assignment batch name"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "6f9a1b2c3d45"
down_revision: Union[str, Sequence[str], None] = "0f1e2d3c4b5a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    bind = op.get_bind()
    columns = {item["name"] for item in sa.inspect(bind).get_columns(table_name)}
    if column.name not in columns:
        op.add_column(table_name, column)


def upgrade() -> None:
    _add_column_if_missing("lessons", sa.Column("batch_name", sa.String(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    columns = {item["name"] for item in sa.inspect(bind).get_columns("lessons")}
    if "batch_name" in columns:
        op.drop_column("lessons", "batch_name")
