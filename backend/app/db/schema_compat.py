"""
PINESPHERE ERP
Module      : Backend Platform
File        : schema_compat.py
Purpose     : Adds missing auth columns for older local databases
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from sqlalchemy import inspect, text
from sqlalchemy.schema import CreateColumn

from app.db.database import Base, engine
from app.models.token import AuditLog, AuthActionToken, RefreshToken, SecurityEvent
from app.models.user import User


AUTH_COMPAT_MODELS = (User, RefreshToken, AuthActionToken, AuditLog, SecurityEvent)


def ensure_auth_schema_compatibility() -> None:
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    with engine.begin() as connection:
        for model in AUTH_COMPAT_MODELS:
            table = model.__table__
            if table.name not in table_names:
                continue

            existing_columns = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name in existing_columns:
                    continue
                column_sql = str(CreateColumn(column).compile(dialect=engine.dialect))
                connection.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN {column_sql}'))

        if "refresh_tokens" in table_names:
            connection.execute(text('ALTER TABLE "refresh_tokens" ALTER COLUMN "token" DROP NOT NULL'))

        if "users" in table_names:
            connection.execute(
                text(
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
                    failed_login_attempts = COALESCE(failed_login_attempts, '0'),
                    email_verified = COALESCE(email_verified, false),
                    two_factor_enabled = COALESCE(two_factor_enabled, false),
                    student_status = COALESCE(student_status, 'active'),
                    document_status = COALESCE(document_status, 'pending'),
                    created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
                    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
                    WHERE role_abbreviation IS NULL
                       OR failed_login_attempts IS NULL
                       OR email_verified IS NULL
                       OR two_factor_enabled IS NULL
                       OR student_status IS NULL
                       OR document_status IS NULL
                       OR created_at IS NULL
                       OR updated_at IS NULL
                    """
                )
            )

    Base.metadata.create_all(bind=engine)
