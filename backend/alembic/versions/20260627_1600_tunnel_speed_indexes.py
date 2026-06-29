"""Add extra indexes for tunnel-facing ERP screens.

Revision ID: 20260627_1600
Revises: 20260623_0715
Create Date: 2026-06-27 16:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


revision = "20260627_1600"
down_revision = "20260623_0715"
branch_labels = None
depends_on = None


INDEXES = (
    # Login, user search, role dashboards, branch/admin/student views.
    ("ix_users_phone", "users", ["phone"]),
    ("ix_users_parent_phone", "users", ["parent_phone"]),
    ("ix_users_branch_role_active", "users", ["branch_id", "role", "is_active"]),
    ("ix_users_branch_role_status", "users", ["branch_id", "role", "student_status"]),
    ("ix_users_franchise_role_active", "users", ["franchise_id", "role", "is_active"]),
    ("ix_users_created_at", "users", ["created_at"]),

    # Branch and franchise module lists/counts.
    ("ix_branches_status_city", "branches", ["status", "city"]),
    ("ix_franchises_owner_email", "franchises", ["owner_email"]),
    ("ix_franchises_status_updated", "franchises", ["status", "updated_at"]),
    ("ix_franchise_agreements_franchise_status_updated", "franchise_agreements", ["franchise_id", "status", "updated_at"]),
    ("ix_franchise_royalty_franchise_status_period", "franchise_royalty_ledger", ["franchise_id", "payment_status", "period"]),
    ("ix_franchise_royalty_status_period", "franchise_royalty_ledger", ["payment_status", "period"]),
    ("ix_franchise_compliance_franchise_status_checked", "franchise_compliance_checks", ["franchise_id", "status", "checked_at"]),
    ("ix_franchise_notifications_franchise_read_created", "franchise_notifications", ["franchise_id", "is_read", "created_at"]),

    # Finance dashboards and pending-fee/payment screens.
    ("ix_invoices_branch_status_due", "invoices", ["branch_id", "status", "due_date"]),
    ("ix_invoices_student_status_due", "invoices", ["student_id", "status", "due_date"]),
    ("ix_invoices_status_due", "invoices", ["status", "due_date"]),
    ("ix_payments_student_paid_at", "payments", ["student_id", "paid_at"]),
    ("ix_payments_invoice_paid_at", "payments", ["invoice_id", "paid_at"]),

    # Communication screens and analytics.
    ("ix_communication_logs_branch_status_created", "communication_logs", ["branch_id", "status", "created_at"]),
    ("ix_communication_logs_counsellor_status_created", "communication_logs", ["counsellor_id", "status", "created_at"]),
    ("ix_communication_logs_channel_created", "communication_logs", ["channel", "created_at"]),
    ("ix_communication_analytics_branch_channel_date", "communication_analytics", ["branch_id", "channel", "metric_date"]),
    ("ix_communication_analytics_counsellor_channel_date", "communication_analytics", ["counsellor_id", "channel", "metric_date"]),
    ("ix_communication_templates_branch_channel_active", "communication_templates", ["branch_id", "channel", "is_active"]),

    # HR/admin operational screens.
    ("ix_hr_employees_branch_status_role", "hr_employees", ["branch_id", "status", "role"]),
    ("ix_staff_attendance_branch_date_status", "staff_attendance", ["branch_id", "attendance_date", "status"]),
    ("ix_staff_attendance_employee_date", "staff_attendance", ["employee_id", "attendance_date"]),
    ("ix_leave_requests_employee_status_created", "leave_requests", ["employee_id", "status", "created_at"]),
    ("ix_payroll_employee_year_month", "payroll", ["employee_id", "year", "month"]),
    ("ix_payroll_status_year_month", "payroll", ["status", "year", "month"]),
    ("ix_trainer_workload_branch_status_updated", "trainer_workload", ["branch_id", "workload_status", "updated_at"]),
    ("ix_staff_tasks_assigned_status_due", "staff_tasks", ["assigned_to", "status", "due_date"]),

    # History/report timeline filters.
    ("ix_history_events_branch_module_created", "history_events", ["branch_id", "module", "created_at"]),
    ("ix_history_events_created_by_created", "history_events", ["created_by_id", "created_at"]),
)


def _existing_tables(bind) -> set[str]:
    return set(sa.inspect(bind).get_table_names())


def _existing_indexes(bind, table_name: str) -> set[str]:
    return {item["name"] for item in sa.inspect(bind).get_indexes(table_name)}


def _existing_columns(bind, table_name: str) -> set[str]:
    return {item["name"] for item in sa.inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    bind = op.get_bind()
    tables = _existing_tables(bind)
    for index_name, table_name, columns in INDEXES:
        if table_name not in tables:
            continue
        if any(column not in _existing_columns(bind, table_name) for column in columns):
            continue
        if index_name in _existing_indexes(bind, table_name):
            continue
        op.create_index(index_name, table_name, columns, unique=False)


def downgrade() -> None:
    bind = op.get_bind()
    tables = _existing_tables(bind)
    for index_name, table_name, _columns in reversed(INDEXES):
        if table_name not in tables:
            continue
        if index_name not in _existing_indexes(bind, table_name):
            continue
        op.drop_index(index_name, table_name=table_name)
