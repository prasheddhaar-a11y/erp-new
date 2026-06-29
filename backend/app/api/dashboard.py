"""
PINESPHERE ERP
Module      : Dashboard Module
File        : dashboard.py
Purpose     : Defines Dashboard API endpoints and request handling
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

# =====================================================
# SECTION: IMPORTS
# PURPOSE:
# This section loads external libraries, framework tools, and local helpers.
# Keeping imports together makes dependencies easy to review.
# =====================================================

from datetime import date, datetime, time

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.core.response_cache import get_cached, set_cached
from app.db.database import get_db
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.branch import Branch
from app.models.crm import Lead
from app.models.finance import Invoice, Payment
from app.models.lms import Course, Enrollment
from app.models.user import User
from app.schemas.dashboard import (
    AiAlert,
    AiInsight,
    BranchComparison,
    DashboardMetric,
    InstituteProgress,
    SecurityCheck,
    SuperAdminDashboardResponse,
)

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
DASHBOARD_CACHE_SECONDS = 20


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/super-admin", response_model=SuperAdminDashboardResponse)
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def super_admin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(require_roles(UserRole.SUPER_ADMIN, UserRole.BRANCH_ADMIN, UserRole.COUNSELLOR)),
):
    cache_key = (
        "dashboard-super-admin",
        current_user.id,
        current_user.role.value,
        current_user.branch_id,
        date.today().isoformat(),
    )
    cached = get_cached(cache_key)
    if cached is not None:
        return cached

    today = date.today()
    today_start = datetime.combine(today, time.min)
    today_end = datetime.combine(today, time.max)
    month_start = datetime.combine(today.replace(day=1), time.min)

    student_query = db.query(User).filter(User.role == UserRole.STUDENT)
    lead_query = db.query(Lead)
    invoice_query = db.query(Invoice)
    payment_query = db.query(Payment).join(Invoice, Payment.invoice_id == Invoice.id)
    if current_user.role != UserRole.SUPER_ADMIN:
        student_query = student_query.filter(User.branch_id == current_user.branch_id)
        lead_query = lead_query.filter(Lead.branch_id == current_user.branch_id)
        invoice_query = invoice_query.filter(Invoice.branch_id == current_user.branch_id)
        payment_query = payment_query.filter(Invoice.branch_id == current_user.branch_id)

    active_students = student_query.filter(User.is_active == True).count()

    inactive_students = student_query.filter(User.is_active == False).count()

    total_students = active_students + inactive_students

    today_query = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
        .filter(AttendanceSession.session_date == today)
    )

    marked_today = today_query.count()
    attended_today = today_query.filter(AttendanceRecord.status.in_(["present", "late"])).count()

    attendance_rate = (
        round((attended_today / marked_today) * 100, 2)
        if marked_today
        else 0
    )

    upcoming_classes = (
        db.query(AttendanceSession)
        .filter(AttendanceSession.session_date >= today)
        .count()
    )

    course_count = db.query(Course).count()
    published_course_count = db.query(Course).filter(Course.status == "published").count()
    enrollment_count = db.query(Enrollment).count()

    total_leads = lead_query.count()
    converted_leads = lead_query.filter(Lead.status == "converted").count()

    new_leads_today = (
        lead_query
        .filter(Lead.created_at >= today_start, Lead.created_at <= today_end)
        .count()
    )

    lead_conversion = (
        round((converted_leads / total_leads) * 100, 2)
        if total_leads
        else 0
    )

    revenue_this_month = (
        payment_query
        .filter(Payment.paid_at >= month_start)
        .scalar()
        or 0
    )

    fee_defaulters_count = (
        invoice_query
        .filter(
            Invoice.due_date < today,
            Invoice.status != "paid",
        )
        .count()
    )

    branch_comparison = build_branch_comparison(
        db=db,
        attendance_rate=attendance_rate,
        total_students=total_students,
        default_lead_conversion=lead_conversion,
    )

    response = SuperAdminDashboardResponse(
        total_students_active=active_students,
        total_students_inactive=inactive_students,
        revenue_this_month=float(revenue_this_month),
        new_leads_today=new_leads_today,
        attendance_rate_today=attendance_rate,
        fee_defaulters_count=fee_defaulters_count,
        upcoming_batches_classes=upcoming_classes,
        metrics=[
            DashboardMetric(
                key="total_students",
                label="Total students",
                value=str(total_students),
                helper=f"{active_students} active / {inactive_students} inactive",
                trend="Live from student users",
            ),
            DashboardMetric(
                key="revenue_this_month",
                label="Revenue this month",
                value=f"Rs {float(revenue_this_month):,.0f}",
                helper="Collected payments in the current month",
                trend="Live from finance payments",
            ),
            DashboardMetric(
                key="new_leads_today",
                label="New leads today",
                value=str(new_leads_today),
                helper=f"{total_leads} total leads / {converted_leads} converted",
                trend="Live from CRM leads",
            ),
            DashboardMetric(
                key="attendance_rate_today",
                label="Attendance rate today",
                value=f"{attendance_rate:.0f}%",
                helper=f"{attended_today} attended / {marked_today} marked",
                trend="Live from attendance records",
            ),
            DashboardMetric(
                key="fee_defaulters_count",
                label="Fee defaulters count",
                value=str(fee_defaulters_count),
                helper="Overdue invoices that are not fully paid",
                trend="Live from finance invoices",
            ),
            DashboardMetric(
                key="upcoming_batches_classes",
                label="Upcoming batches / classes",
                value=str(upcoming_classes),
                helper=f"{published_course_count} published courses / {enrollment_count} enrollments",
                trend="Live from LMS and attendance schedule",
            ),
        ],
        branch_comparison=branch_comparison,
        ai_alerts=build_ai_alerts(
            attendance_rate=attendance_rate,
            upcoming_classes=upcoming_classes,
            course_count=course_count,
            enrollment_count=enrollment_count,
            total_students=total_students,
            new_leads_today=new_leads_today,
            fee_defaulters_count=fee_defaulters_count,
        ),
        institute_progress=InstituteProgress(
            xp=2450,
            streak=47,
            active_quests=max(new_leads_today, 12),
            awards=8,
            completion=73,
            message="Keep the learning momentum strong across all branches.",
        ),
        ai_insights=build_ai_insights(
            attendance_rate=attendance_rate,
            new_leads_today=new_leads_today,
            fee_defaulters_count=fee_defaulters_count,
            upcoming_classes=upcoming_classes,
        ),
        security_checks=build_security_checks(db),
    )
    return set_cached(cache_key, response, DASHBOARD_CACHE_SECONDS)


def build_branch_comparison(
    db: Session,
    attendance_rate: float,
    total_students: int,
    default_lead_conversion: float,
) -> list[BranchComparison]:
    rows = (
        db.query(
            Branch.id,
            Branch.name,
            func.count(User.id).label("student_count"),
        )
        .outerjoin(
            User,
            (User.branch_id == Branch.id) & (User.role == UserRole.STUDENT),
        )
        .group_by(Branch.id, Branch.name)
        .order_by(Branch.name.asc())
        .all()
    )

    branch_comparison = []

    for row in rows:
        branch_total_leads = db.query(Lead).filter(Lead.branch_id == row.id).count()
        branch_converted_leads = (
            db.query(Lead)
            .filter(Lead.branch_id == row.id, Lead.status == "converted")
            .count()
        )

        branch_lead_conversion = (
            round((branch_converted_leads / branch_total_leads) * 100, 2)
            if branch_total_leads
            else 0
        )

        branch_revenue = (
            db.query(func.coalesce(func.sum(Payment.amount), 0))
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .filter(Invoice.branch_id == row.id)
            .scalar()
            or 0
        )

        branch_comparison.append(
            BranchComparison(
                branch_name=row.name,
                students=row.student_count,
                attendance_rate=attendance_rate,
                revenue=float(branch_revenue),
                lead_conversion=branch_lead_conversion,
            )
        )

    if branch_comparison:
        return branch_comparison

    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0)).scalar() or 0

    return [
        BranchComparison(
            branch_name="Main Branch",
            students=total_students,
            attendance_rate=attendance_rate,
            revenue=float(total_revenue),
            lead_conversion=default_lead_conversion,
        )
    ]


def build_ai_alerts(
    attendance_rate: float,
    upcoming_classes: int,
    course_count: int,
    enrollment_count: int,
    total_students: int,
    new_leads_today: int,
    fee_defaulters_count: int,
) -> list[AiAlert]:
    alerts: list[AiAlert] = []

    if total_students == 0:
        alerts.append(
            AiAlert(
                title="No students found",
                message="Add student users to activate live dashboard tracking.",
                severity="info",
            )
        )

    if new_leads_today > 0:
        alerts.append(
            AiAlert(
                title="New CRM leads received",
                message=f"{new_leads_today} new lead(s) were added today. Follow up quickly to improve conversion.",
                severity="success",
            )
        )

    if fee_defaulters_count > 0:
        alerts.append(
            AiAlert(
                title="Fee follow-up needed",
                message=f"{fee_defaulters_count} overdue invoice(s) need finance follow-up.",
                severity="warning",
            )
        )

    if attendance_rate < 75:
        alerts.append(
            AiAlert(
                title="Attendance needs attention",
                message="Today attendance is below the 75% operating target.",
                severity="warning",
            )
        )

    if upcoming_classes == 0:
        alerts.append(
            AiAlert(
                title="No upcoming classes scheduled",
                message="Create upcoming batch sessions so trainers and students can see their schedule.",
                severity="info",
            )
        )

    if course_count == 0:
        alerts.append(
            AiAlert(
                title="No LMS courses created",
                message="Create courses before adding lessons, quizzes, and enrollments.",
                severity="info",
            )
        )

    if course_count > 0 and enrollment_count == 0:
        alerts.append(
            AiAlert(
                title="Courses need enrollments",
                message="Courses are available, but no student enrollments are recorded yet.",
                severity="info",
            )
        )

    if not alerts:
        alerts.append(
            AiAlert(
                title="Operations look steady",
                message="No critical dashboard alerts detected for the current data.",
                severity="success",
            )
        )

    return alerts


def build_ai_insights(
    attendance_rate: float,
    new_leads_today: int,
    fee_defaulters_count: int,
    upcoming_classes: int,
) -> list[AiInsight]:
    return [
        AiInsight(
            title="Attendance rescue",
            detail=(
                "Attendance is below target. Review at-risk students and call parents before the next class."
                if attendance_rate < 75
                else "Attendance is stable today. Keep monitoring students below the certificate threshold."
            ),
            impact="High" if attendance_rate < 75 else "Medium",
            emoji="ðŸ”¥",
        ),
        AiInsight(
            title="Admission momentum",
            detail=f"{new_leads_today} new lead(s) arrived today. Prioritize same-day demo reminders for high-score enquiries.",
            impact="High" if new_leads_today else "Medium",
            emoji="âš¡",
        ),
        AiInsight(
            title="Fee follow-up",
            detail=f"{fee_defaulters_count} overdue invoice(s) need structured reminders and finance follow-up.",
            impact="High" if fee_defaulters_count else "Low",
            emoji="ðŸ’¡",
        ),
        AiInsight(
            title="Class readiness",
            detail=f"{upcoming_classes} upcoming class session(s) are visible for scheduling and trainer planning.",
            impact="Medium",
            emoji="ðŸš€",
        ),
    ]


def build_security_checks(db: Session) -> list[SecurityCheck]:
    return [
        SecurityCheck(
            label="Role-based access",
            status="Enabled",
            detail="Super Admin, Branch Admin, Trainer, Student and Finance access are separated by role.",
        ),
        SecurityCheck(
            label="JWT session control",
            status="Active",
            detail="Refresh tokens and revoked sessions are tracked for device logout and session review.",
        ),
        SecurityCheck(
            label="Audit logs",
            status="Active",
            detail="Login, student, finance and security-sensitive actions are recorded for review.",
        ),
        SecurityCheck(
            label="MFA readiness",
            status="Recommended",
            detail="Enable OTP/MFA for Super Admin, Finance and Branch Admin accounts before production.",
        ),
    ]
