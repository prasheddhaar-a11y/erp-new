"""admission documents"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0f1e2d3c4b5a"
down_revision: Union[str, Sequence[str], None] = "a9b8c7d6e543"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = inspector.get_table_names()

    if "admission_documents" not in tables:
        op.create_table(
            "admission_documents",
            sa.Column("id", sa.String(), nullable=False),
            sa.Column("admission_id", sa.String(), nullable=False),
            sa.Column("document_name", sa.String(), nullable=False),
            sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
            sa.Column("reviewed_by", sa.String(), nullable=True),
            sa.Column("reviewed_at", sa.DateTime(), nullable=True),
            sa.Column("remarks", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            sa.Column("updated_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["admission_id"], ["leads.id"]),
            sa.ForeignKeyConstraint(["reviewed_by"], ["users.id"]),
            sa.PrimaryKeyConstraint("id"),
        )

    existing_indexes = {index["name"] for index in inspector.get_indexes("admission_documents")}
    indexes = [
        (op.f("ix_admission_documents_admission_id"), ["admission_id"]),
        (op.f("ix_admission_documents_document_name"), ["document_name"]),
        (op.f("ix_admission_documents_status"), ["status"]),
    ]
    for index_name, columns in indexes:
        if index_name not in existing_indexes:
            op.create_index(index_name, "admission_documents", columns, unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_admission_documents_status"), table_name="admission_documents")
    op.drop_index(op.f("ix_admission_documents_document_name"), table_name="admission_documents")
    op.drop_index(op.f("ix_admission_documents_admission_id"), table_name="admission_documents")
    op.drop_table("admission_documents")
