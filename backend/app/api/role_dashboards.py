"""
PINESPHERE ERP
Module      : Role Dashboards
File        : role_dashboards.py
Purpose     : Provides role-based dashboard API endpoints.
Author      : Pinesphere Development Team
Last Updated: Auto Generated
=====================================================
"""

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth.dependencies import require_roles
from app.core.roles import UserRole
from app.core.response_cache import get_cached, set_cached
from app.db.database import get_db
from app.models.admission import Admission
from app.models.attendance import AttendanceRecord, AttendanceSession
from app.models.branch import Branch
from app.models.crm import Lead
from app.models.finance import Invoice, Payment
from app.models.hr import Employee, LeaveRequest, Payroll, StaffTask
from app.models.lms import Course, Enrollment, Lesson, LessonProgress, Quiz
from app.models.trainer import TrainerLessonMaterial
from app.models.user import User

router = APIRouter(prefix="/api", tags=["Role Dashboards"])
DASHBOARD_CACHE_SECONDS = 20

ROLE_MODULES = {
    UserRole.SUPER_ADMIN: [
        "dashboard",
        "users",
        "branches",
        "crm_admissions",
        "crm_leads",
        "students",
        "lms",
        "batch",
        "attendance",
        "finance",
        "finance_payments",
        "finance_invoices",
        "finance_payroll",
        "hr",
        "hr_payroll",
        "hr_leave",
        "hr_performance",
        "placement",
        "ai_platform",
        "franchise",
        "reports",
        "reports_analytics",
        "branch_reports",
        "security",
        "settings",
    ],
    UserRole.BRANCH_ADMIN: [
        "admissions",
        "students",
        "attendance",
        "fees",
        "lms",
        "staff_overview",
        "branch_reports",
        "communication",
    ],
    UserRole.COUNSELLOR: [
        "leads",
        "follow_ups",
        "admissions",
        "student_enquiry",
        "tasks",
        "calendar",
    ],
    UserRole.TRAINER: [
        "my_batches",
        "students",
        "attendance",
        "lms",
        "assignments",
        "tests_exams",
        "reports",
        "calendar",
        "messages",
    ],
    UserRole.HR: [
        "employees",
        "payroll",
        "leave",
        "attendance",
        "performance",
        "recruitment",
        "training",
        "reports",
    ],
    UserRole.PARENT: [
        "child_profile",
        "attendance",
        "fees",
        "academics",
        "exams_results",
        "assignments",
        "notices",
        "messages",
        "calendar",
    ],
    UserRole.STUDENT: [
        "profile",
        "courses_lms",
        "attendance",
        "assignments",
        "exams",
        "certificates",
        "fees",
        "notifications",
        "messages",
        "calendar",
    ],
    UserRole.FINANCE: [
        "fees",
        "invoices",
        "payments",
        "salary",
        "reports",
        "settings",
    ],
    UserRole.FRANCHISE_OWNER: [
        "franchise",
        "branches",
        "reports",
        "settings",
    ],
    UserRole.COMPANY_HR: [
        "placement",
        "students",
        "reports",
        "settings",
    ],
}

ROLE_LABELS = {
    UserRole.BRANCH_ADMIN: "Branch Admin Dashboard",
    UserRole.COUNSELLOR: "Counsellor Dashboard",
    UserRole.TRAINER: "Trainer Dashboard",
    UserRole.HR: "HR Dashboard",
    UserRole.PARENT: "Parent Dashboard",
    UserRole.STUDENT: "Student Dashboard",
    UserRole.SUPER_ADMIN: "Super Admin Overview",
    UserRole.FINANCE: "Finance Dashboard",
    UserRole.FRANCHISE_OWNER: "Franchise Owner Dashboard",
    UserRole.COMPANY_HR: "Company HR Dashboard",
}

SUPER_ADMIN_MODULES = [
    {"key": "dashboard", "label": "Dashboard", "href": "/super-admin/dashboard", "icon": "dashboard"},
    {"key": "users", "label": "Users", "href": "/super-admin/users", "icon": "users"},
    {"key": "branches", "label": "Branches", "href": "/super-admin/branches", "icon": "branches"},
    {"key": "crm", "label": "CRM", "href": "/super-admin/crm", "icon": "admissions"},
    {"key": "crm-admissions", "label": "CRM - Admissions", "href": "/super-admin/crm/admissions", "icon": "admissions"},
    {"key": "crm-leads", "label": "CRM - Lead Management", "href": "/super-admin/crm/lead-management", "icon": "students"},
    {"key": "students", "label": "Students", "href": "/super-admin/students", "icon": "students"},
    {"key": "lms", "label": "LMS", "href": "/super-admin/lms", "icon": "lms"},
    {"key": "batch", "label": "Batch", "href": "/super-admin/lms/batch", "icon": "batches"},
    {"key": "attendance", "label": "Attendance", "href": "/super-admin/lms/attendance", "icon": "attendance"},
    {"key": "finance", "label": "Finance", "href": "/super-admin/finance", "icon": "fees"},
    {"key": "finance-payments", "label": "Finance - Payments", "href": "/super-admin/finance/payments", "icon": "wallet"},
    {"key": "finance-invoices", "label": "Finance - Invoices", "href": "/super-admin/finance/invoices", "icon": "fees"},
    {"key": "finance-payroll", "label": "Finance - Payroll", "href": "/super-admin/finance/payroll", "icon": "payroll"},
    {"key": "hr", "label": "HR", "href": "/super-admin/hr", "icon": "staff"},
    {"key": "hr-payroll", "label": "HR - Payroll", "href": "/super-admin/hr/payroll", "icon": "payroll"},
    {"key": "hr-leave", "label": "HR - Leave Management", "href": "/super-admin/hr/leave-management", "icon": "calendar"},
    {"key": "hr-performance", "label": "HR - Performance", "href": "/super-admin/hr/performance", "icon": "reports"},
    {"key": "placement", "label": "Placement Portal", "href": "/super-admin/placement-portal", "icon": "placement"},
    {"key": "ai-platform", "label": "AI Platform", "href": "/super-admin/ai-platform", "icon": "lms"},
    {"key": "franchise", "label": "Franchise", "href": "/super-admin/franchise", "icon": "franchise"},
    {"key": "reports", "label": "Reports", "href": "/super-admin/reports", "icon": "reports"},
    {"key": "reports-analytics", "label": "Reports - Analytics", "href": "/super-admin/reports/analytics", "icon": "reports"},
    {"key": "branch-reports", "label": "Reports - Branch Reports", "href": "/super-admin/reports/branch-reports", "icon": "branches"},
    {"key": "security", "label": "Security", "href": "/super-admin/security", "icon": "security"},
    {"key": "settings", "label": "Settings", "href": "/super-admin/settings", "icon": "settings"},
]


def _role_guard(current_user: User, allowed_role: UserRole):
    if current_user.role != allowed_role:
        raise HTTPException(status_code=403, detail="Insufficient permissions")


def _branch_id(current_user: User):
    return None if current_user.role == UserRole.SUPER_ADMIN else current_user.branch_id


def _dashboard_cache_key(current_user: User, role: UserRole, name: str):
    return (
        "role-dashboard",
        name,
        role.value,
        current_user.id,
        current_user.role.value,
        current_user.branch_id,
        current_user.franchise_id,
        date.today().isoformat(),
    )


def _cached_dashboard_payload(db: Session, current_user: User, role: UserRole, name: str):
    key = _dashboard_cache_key(current_user, role, name)
    cached = get_cached(key)
    if cached is not None:
        return cached
    return set_cached(key, _dashboard_payload(db, current_user, role), DASHBOARD_CACHE_SECONDS)


def _cached_super_admin_payload(db: Session, current_user: User):
    key = _dashboard_cache_key(current_user, UserRole.SUPER_ADMIN, "super-admin-overview")
    cached = get_cached(key)
    if cached is not None:
        return cached
    return set_cached(key, _super_admin_payload(db, current_user), DASHBOARD_CACHE_SECONDS)


def _cached_student_payload(db: Session, current_user: User):
    key = _dashboard_cache_key(current_user, UserRole.STUDENT, "student-dashboard")
    cached = get_cached(key)
    if cached is not None:
        return cached
    return set_cached(key, _student_payload(db, current_user), DASHBOARD_CACHE_SECONDS)


def _user_query(db: Session, branch_id: str | None = None):
    query = db.query(User)
    if branch_id:
        query = query.filter(User.branch_id == branch_id)
    return query


def _lead_query(db: Session, branch_id: str | None = None, counsellor_id: str | None = None):
    query = db.query(Lead)
    if branch_id:
        query = query.filter(Lead.branch_id == branch_id)
    if counsellor_id:
        query = query.filter(Lead.counsellor_id == counsellor_id)
    return query


def _admission_query(db: Session, branch_id: str | None = None, counsellor_id: str | None = None):
    query = db.query(Admission)
    if branch_id:
        query = query.filter(Admission.branch_id == branch_id)
    if counsellor_id:
        query = query.filter(Admission.counsellor_id == counsellor_id)
    return query


def _lead_status_count(query, status: str) -> int:
    normalized_status = func.lower(func.trim(func.coalesce(Lead.status, "")))
    return query.filter(normalized_status == status).count()


def _invoice_query(db: Session, branch_id: str | None = None, student_id: str | None = None):
    query = db.query(Invoice)
    if branch_id:
        query = query.filter(Invoice.branch_id == branch_id)
    if student_id:
        query = query.filter(Invoice.student_id == student_id)
    return query


def _payment_sum(db: Session, branch_id: str | None = None, student_id: str | None = None):
    query = db.query(func.coalesce(func.sum(Payment.amount), 0)).join(Invoice, Payment.invoice_id == Invoice.id)
    if branch_id:
        query = query.filter(Invoice.branch_id == branch_id)
    if student_id:
        query = query.filter(Payment.student_id == student_id)
    return float(query.scalar() or 0)


def _attendance_summary(db: Session, branch_id: str | None = None, student_id: str | None = None, trainer_id: str | None = None):
    query = db.query(AttendanceRecord).join(AttendanceSession, AttendanceRecord.session_id == AttendanceSession.id)
    if branch_id:
        query = query.join(User, AttendanceRecord.student_id == User.id).filter(User.branch_id == branch_id)
    if student_id:
        query = query.filter(AttendanceRecord.student_id == student_id)
    if trainer_id:
        query = query.filter(AttendanceSession.trainer_id == trainer_id)

    total = query.count()
    present = query.filter(AttendanceRecord.status.in_(["present", "late", "Present", "Late"])).count()
    rate = round((present / total) * 100, 2) if total else 0
    today = date.today()

    series = []
    for offset in range(5, -1, -1):
        day = today - timedelta(days=offset)
        day_query = query.filter(AttendanceSession.session_date == day)
        day_total = day_query.count()
        day_present = day_query.filter(AttendanceRecord.status.in_(["present", "late", "Present", "Late"])).count()
        series.append({
            "label": day.strftime("%d %b"),
            "rate": round((day_present / day_total) * 100, 2) if day_total else 0,
        })

    return {"rate": rate, "present": present, "total": total, "series": series}


def _lms_summary(db: Session, trainer_id: str | None = None, student_id: str | None = None):
    course_query = db.query(Course)
    if trainer_id:
        course_query = course_query.filter(Course.trainer_id == trainer_id)

    enrollment_query = db.query(Enrollment)
    if student_id:
        enrollment_query = enrollment_query.filter(Enrollment.student_id == student_id)
    if trainer_id:
        enrollment_query = enrollment_query.join(Course, Enrollment.course_id == Course.id).filter(Course.trainer_id == trainer_id)

    courses = course_query.order_by(Course.updated_at.desc()).limit(5).all()
    return {
        "total_courses": course_query.count(),
        "published_courses": course_query.filter(Course.status == "published").count(),
        "lessons": db.query(Lesson).join(Course, Lesson.course_id == Course.id).filter(Course.trainer_id == trainer_id).count() if trainer_id else db.query(Lesson).count(),
        "enrollments": enrollment_query.count(),
        "quizzes": db.query(Quiz).count(),
        "items": [
            {
                "id": course.id,
                "title": course.title,
                "status": course.status,
                "difficulty": course.difficulty_level,
            }
            for course in courses
        ],
    }


def _module_cards(role: UserRole, modules: list[str], totals: dict):
    labels = {
        "admissions": "Admissions",
        "students": "Students",
        "attendance": "Attendance",
        "fees": "Fees & Payments",
        "lms": "LMS",
        "staff_overview": "Staff Overview",
        "branch_reports": "Branch Reports",
        "communication": "Communication",
        "leads": "Leads",
        "follow_ups": "Follow-ups",
        "student_enquiry": "Student Enquiry",
        "tasks": "Tasks",
        "calendar": "Calendar",
        "conversion_reports": "Conversion Reports",
        "my_batches": "My Batches",
        "assignments": "Assignments",
        "tests_exams": "Tests / Exams",
        "reports": "Reports",
        "messages": "Messages",
        "employees": "Employees",
        "payroll": "Payroll",
        "leave": "Leave Management",
        "performance": "Performance",
        "recruitment": "Recruitment",
        "training": "Training",
        "child_profile": "Child Profile",
        "academics": "Academics",
        "exams_results": "Exams & Results",
        "notices": "Notices",
        "profile": "Profile",
        "courses_lms": "Courses / LMS",
        "exams": "Exams",
        "certificates": "Certificates",
        "notifications": "Notifications",
        "branches": "Branches",
        "users": "Users",
        "dashboard": "Dashboard",
        "crm_admissions": "CRM - Admissions",
        "crm_leads": "CRM - Lead Management",
        "batch": "Batch",
        "finance_payments": "Finance - Payments",
        "finance_invoices": "Finance - Invoices",
        "finance_payroll": "Finance - Payroll",
        "hr_payroll": "HR - Payroll",
        "hr_leave": "HR - Leave Management",
        "hr_performance": "HR - Performance",
        "ai_platform": "AI Platform",
        "reports_analytics": "Reports - Analytics",
        "branch_reports": "Reports - Branch Reports",
        "finance": "Finance",
        "hr": "HR",
        "franchise": "Franchise",
        "security": "Security",
        "settings": "Settings",
        "invoices": "Invoices",
        "payments": "Payments",
        "salary": "Salary",
        "placement": "Placement",
    }

    return [
        {
            "key": module,
            "label": labels.get(module, module.replace("_", " ").title()),
            "href": f"/{role.value.replace('_', '-')}/dashboard#{module}",
            "summary": str(totals.get(module, "Connected")),
            "enabled": True,
            "description": "Connected to live dashboard aggregation where source tables exist.",
        }
        for module in modules
    ]


def _recent_activity(db: Session, branch_id: str | None = None):
    lead_rows = _lead_query(db, branch_id).order_by(Lead.created_at.desc()).limit(3).all()
    payment_rows = (
        db.query(Payment)
        .join(Invoice, Payment.invoice_id == Invoice.id)
        .filter(Invoice.branch_id == branch_id if branch_id else True)
        .order_by(Payment.paid_at.desc())
        .limit(3)
        .all()
    )

    activity = [
        {
            "title": f"Lead: {lead.student_name}",
            "detail": f"{lead.status.title()} - {lead.course_interest or 'Course not selected'}",
            "time": lead.created_at.isoformat() if lead.created_at else "",
            "module": "Admissions",
        }
        for lead in lead_rows
    ]
    activity.extend(
        {
            "title": f"Payment received: Rs {payment.amount:,.0f}",
            "detail": payment.payment_method.title(),
            "time": payment.paid_at.isoformat() if payment.paid_at else "",
            "module": "Fees",
        }
        for payment in payment_rows
    )
    return activity[:5]


def _super_admin_modules(totals: dict):
    return [
        {
            **module,
            "summary": str(totals.get(module["key"], "Connected")),
            "enabled": True,
            "description": "Super Admin organization-wide access.",
        }
        for module in SUPER_ADMIN_MODULES
    ]


def _super_admin_payload(db: Session, current_user: User):
    today = date.today()
    month_start = datetime.combine(today.replace(day=1), datetime.min.time())
    next_month = (today.replace(day=28) + timedelta(days=4)).replace(day=1)
    next_month_start = datetime.combine(next_month, datetime.min.time())

    users = db.query(User)
    students = users.filter(User.role == UserRole.STUDENT)
    leads = _lead_query(db)
    admissions = _admission_query(db)
    invoices = _invoice_query(db)
    attendance = _attendance_summary(db)
    lms = _lms_summary(db)

    total_students = students.count()
    total_users = users.count()
    active_users = users.filter(User.is_active == True).count()  # noqa: E712
    branch_count = db.query(Branch).count()
    total_leads = leads.count()
    new_leads = _lead_status_count(leads, "new")
    contacted_leads = _lead_status_count(leads, "contacted")
    qualified_leads = _lead_status_count(leads, "qualified")
    proposal_sent_leads = _lead_status_count(leads, "proposal_sent")
    converted_admissions = admissions.count()
    admissions_this_month = admissions.filter(Admission.created_at >= month_start, Admission.created_at < next_month_start).count()
    follow_ups_today = leads.filter(func.date(Lead.next_follow_up_at) == today.isoformat()).count()
    conversion_rate = round((converted_admissions / total_leads) * 100, 2) if total_leads else 0
    revenue = _payment_sum(db)
    pending_fees = float(invoices.filter(Invoice.status != "paid").with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)
    overdue = invoices.filter(Invoice.due_date < today, Invoice.status != "paid").count()
    employees = db.query(Employee).count()
    payroll_total = float(db.query(func.coalesce(func.sum(Payroll.net_salary), 0)).scalar() or 0)
    leave_pending = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    open_tasks = db.query(StaffTask).filter(StaffTask.status != "Done").count()

    totals = {
        "dashboard": "Live",
        "users": total_users,
        "branches": branch_count,
        "crm": total_leads,
        "crm-admissions": admissions_this_month,
        "crm-leads": total_leads,
        "students": total_students,
        "lms": lms["total_courses"],
        "batch": lms["enrollments"],
        "attendance": f"{attendance['rate']:.0f}%",
        "finance": f"Rs {revenue:,.0f}",
        "finance-payments": f"Rs {revenue:,.0f}",
        "finance-invoices": invoices.count(),
        "finance-payroll": f"Rs {payroll_total:,.0f}",
        "hr": employees,
        "hr-payroll": f"Rs {payroll_total:,.0f}",
        "hr-leave": leave_pending,
        "hr-performance": employees,
        "placement": total_students,
        "ai-platform": "Ready",
        "franchise": "Connected",
        "reports": "Live",
        "reports-analytics": "Live",
        "branch-reports": branch_count,
        "security": "Active",
        "settings": "Ready",
    }

    recent_leads = leads.order_by(Lead.created_at.desc()).limit(3).all()
    recent_payments = db.query(Payment).order_by(Payment.paid_at.desc()).limit(3).all()
    recent_activity = [
        {
            "title": f"Lead: {lead.student_name}",
            "detail": f"{(lead.status or 'new').replace('_', ' ').title()} - {lead.course_interest or 'Course not selected'}",
            "time": lead.created_at.isoformat() if lead.created_at else "",
            "module": "CRM",
        }
        for lead in recent_leads
    ]
    recent_activity.extend(
        {
            "title": f"Payment received: Rs {payment.amount:,.0f}",
            "detail": payment.payment_method.title() if payment.payment_method else "Payment",
            "time": payment.paid_at.isoformat() if payment.paid_at else "",
            "module": "Finance",
        }
        for payment in recent_payments
    )

    allowed_modules = [module["key"] for module in SUPER_ADMIN_MODULES]
    return {
        "role": UserRole.SUPER_ADMIN.value,
        "title": "Super Admin Dashboard",
        "scope": "All branches",
        "metrics": [
            {"key": "students", "label": "Total Students", "value": str(total_students), "helper": "All branches in scope", "module": "Students"},
            {"key": "branches", "label": "Branches", "value": str(branch_count), "helper": "Organization branch network", "module": "Branches"},
            {"key": "fees", "label": "Organization Revenue", "value": f"Rs {revenue:,.0f}", "helper": f"Rs {pending_fees:,.0f} pending", "module": "Finance"},
            {"key": "security", "label": "Security Checks", "value": "Active", "helper": f"{active_users}/{total_users} active users", "module": "Security"},
        ],
        "modules": _super_admin_modules(totals),
        "recent_activity": recent_activity[:5],
        "notifications": [
            {"title": "Super Admin access active", "message": "Super Admin can monitor and control every organization module.", "tone": "success"},
            {"title": "Organization scope", "message": "Dashboard data is aggregated across all branches.", "tone": "info"},
        ],
        "attendance": attendance,
        "fees": {"collected": revenue, "pending": pending_fees, "overdue": overdue},
        "courses": lms,
        "tasks": [
            {"title": "Review open operational tasks", "status": str(open_tasks), "module": "HR"},
            {"title": "Review pending leave approvals", "status": str(leave_pending), "module": "HR"},
            {"title": "Review overdue invoices", "status": str(overdue), "module": "Finance"},
        ],
        "calendar": [
            {"title": "Organization operations review", "date": today.isoformat(), "module": "Reports"},
            {"title": "Weekly branch performance sync", "date": (today + timedelta(days=3)).isoformat(), "module": "Branches"},
        ],
        "reports": [
            {"title": "Admissions funnel", "value": f"{converted_admissions}/{total_leads}", "module": "CRM"},
            {"title": "Fee risk", "value": str(overdue), "module": "Finance"},
            {"title": "Learning activity", "value": str(lms["enrollments"]), "module": "LMS"},
        ],
        "lead_stats": {
            "total": total_leads,
            "new": new_leads,
            "contacted": contacted_leads,
            "qualified": qualified_leads,
            "proposal_sent": proposal_sent_leads,
            "converted_admissions": converted_admissions,
            "conversion_rate": conversion_rate,
            "follow_ups_today": follow_ups_today,
        },
        "lead_status_overview": [
            {"label": "New", "value": new_leads, "detail": f"{new_leads} ({round((new_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#0B7A5A"},
            {"label": "Contacted", "value": contacted_leads, "detail": f"{contacted_leads} ({round((contacted_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#3B82F6"},
            {"label": "Qualified", "value": qualified_leads, "detail": f"{qualified_leads} ({round((qualified_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#8B5CF6"},
            {"label": "Proposal Sent", "value": proposal_sent_leads, "detail": f"{proposal_sent_leads} ({round((proposal_sent_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#F59E0B"},
            {"label": "Converted (Admissions)", "value": converted_admissions, "detail": f"{converted_admissions} ({round((converted_admissions / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#FB923C"},
        ],
        "lead_pipeline": [
            {"label": "New Leads", "value": new_leads, "color": "#0B7A5A"},
            {"label": "Contacted", "value": contacted_leads, "color": "#A9DDBD"},
            {"label": "Qualified", "value": qualified_leads, "color": "#B8D8F6"},
            {"label": "Proposal Sent", "value": proposal_sent_leads, "color": "#CDB7F2"},
            {"label": "Converted (Admissions)", "value": converted_admissions, "color": "#FFE0CC"},
        ],
        "permissions": {"allowed_modules": allowed_modules, "denied_modules": []},
        "updated_at": datetime.utcnow().isoformat(),
    }


def _dashboard_payload(db: Session, current_user: User, role: UserRole):
    branch_id = _branch_id(current_user)
    counsellor_id = current_user.id if role == UserRole.COUNSELLOR and current_user.role != UserRole.SUPER_ADMIN else None
    trainer_id = current_user.id if role == UserRole.TRAINER and current_user.role != UserRole.SUPER_ADMIN else None

    student_query = _user_query(db, branch_id).filter(User.role == UserRole.STUDENT)
    if role == UserRole.PARENT:
        student_query = db.query(User).filter(
            User.role == UserRole.STUDENT,
            User.parent_phone == current_user.phone,
        )
    elif role == UserRole.FRANCHISE_OWNER and current_user.franchise_id:
        student_query = db.query(User).filter(
            User.role == UserRole.STUDENT,
            User.franchise_id == current_user.franchise_id,
        )
    leads = _lead_query(db, branch_id, counsellor_id)
    invoices = _invoice_query(db, branch_id)
    if role == UserRole.PARENT:
        parent_student_ids = [student.id for student in student_query.all()]
        invoices = db.query(Invoice).filter(Invoice.student_id.in_(parent_student_ids)) if parent_student_ids else db.query(Invoice).filter(False)
    attendance = _attendance_summary(db, branch_id=branch_id, trainer_id=trainer_id)
    if role == UserRole.PARENT:
        parent_student_ids = [student.id for student in student_query.all()]
        attendance = {"rate": 0, "present": 0, "total": 0, "series": []}
        if parent_student_ids:
            summaries = [_attendance_summary(db, student_id=student_id) for student_id in parent_student_ids]
            total = sum(summary["total"] for summary in summaries)
            present = sum(summary["present"] for summary in summaries)
            attendance = {
                "rate": round((present / total) * 100, 2) if total else 0,
                "present": present,
                "total": total,
                "series": summaries[0]["series"] if summaries else [],
            }
    lms = _lms_summary(db, trainer_id=trainer_id)
    employee_query = db.query(Employee)
    if branch_id:
        employee_query = employee_query.filter(Employee.branch_id == branch_id)

    total_students = student_query.count()
    admissions = _admission_query(db, branch_id, counsellor_id)
    today = date.today()
    month_start = datetime.combine(today.replace(day=1), datetime.min.time())
    next_month = (today.replace(day=28) + timedelta(days=4)).replace(day=1)
    next_month_start = datetime.combine(next_month, datetime.min.time())

    total_leads = leads.count()
    new_leads = _lead_status_count(leads, "new")
    contacted_leads = _lead_status_count(leads, "contacted")
    qualified_leads = _lead_status_count(leads, "qualified")
    proposal_sent_leads = _lead_status_count(leads, "proposal_sent")
    converted_admissions = admissions.count()
    admissions_this_month = admissions.filter(Admission.created_at >= month_start, Admission.created_at < next_month_start).count()
    follow_ups_today = leads.filter(func.date(Lead.next_follow_up_at) == today.isoformat()).count()
    conversion_rate = round((converted_admissions / total_leads) * 100, 2) if total_leads else 0
    revenue = _payment_sum(db, branch_id)
    pending_fees = float(invoices.filter(Invoice.status != "paid").with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)
    overdue = invoices.filter(Invoice.due_date < date.today(), Invoice.status != "paid").count()
    employees = employee_query.count()
    payroll_total = float(db.query(func.coalesce(func.sum(Payroll.net_salary), 0)).scalar() or 0)
    leave_pending = db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").count()
    branch_count = db.query(Branch).count()
    user_count = db.query(User).count()

    modules = ROLE_MODULES[role]
    totals = {
        "admissions": admissions_this_month,
        "students": total_students,
        "users": user_count,
        "branches": branch_count,
        "crm_admissions": admissions_this_month,
        "crm_leads": total_leads,
        "attendance": f"{attendance['rate']:.0f}%",
        "fees": f"Rs {revenue:,.0f}",
        "lms": lms["total_courses"],
        "batch": lms["enrollments"],
        "finance": f"Rs {revenue:,.0f}",
        "finance_payments": f"Rs {revenue:,.0f}",
        "finance_invoices": invoices.count(),
        "finance_payroll": f"Rs {payroll_total:,.0f}",
        "hr": employees,
        "hr_payroll": f"Rs {payroll_total:,.0f}",
        "hr_leave": leave_pending,
        "hr_performance": employees,
        "placement": total_students,
        "ai_platform": "Connected",
        "franchise": "Connected",
        "reports": "Live",
        "reports_analytics": "Live",
        "branch_reports": branch_count,
        "leads": total_leads,
        "new_leads": new_leads,
        "follow_ups": follow_ups_today,
        "tasks": db.query(StaffTask).filter(StaffTask.status != "Done").count(),
        "my_batches": lms["enrollments"],
        "assignments": db.query(Lesson).filter(Lesson.content_type == "assignment").count(),
        "tests_exams": lms["quizzes"],
        "employees": employees,
        "payroll": f"Rs {payroll_total:,.0f}",
        "leave": leave_pending,
    }

    metrics = [
        {"key": "students", "label": "Students", "value": str(total_students), "helper": "Active student users in scope", "module": "Students"},
        {"key": "leads", "label": "Leads", "value": str(total_leads), "helper": f"{converted_admissions} converted to admission", "module": "Admissions"},
        {"key": "new-leads", "label": "New Leads", "value": str(new_leads), "helper": "Leads with status NEW", "module": "Admissions"},
        {"key": "admissions", "label": "Admissions This Month", "value": str(admissions_this_month), "helper": "Converted admissions in the current month", "module": "Admissions"},
        {"key": "follow-ups", "label": "Follow Ups Today", "value": str(follow_ups_today), "helper": "Leads scheduled for today", "module": "Follow-ups"},
        {"key": "conversion", "label": "Conversion Rate", "value": f"{conversion_rate}%", "helper": f"{converted_admissions} converted admissions", "module": "Reports"},
        {"key": "attendance", "label": "Attendance", "value": f"{attendance['rate']:.0f}%", "helper": f"{attendance['present']} present / {attendance['total']} marked", "module": "Attendance"},
        {"key": "fees", "label": "Collected Fees", "value": f"Rs {revenue:,.0f}", "helper": f"Rs {pending_fees:,.0f} pending", "module": "Fees"},
    ]
    if role == UserRole.COUNSELLOR:
        metrics = [metric for metric in metrics if metric["module"] != "Reports"]

    if role == UserRole.SUPER_ADMIN:
        metrics = [
            {"key": "students", "label": "Total Students", "value": str(total_students), "helper": "Active student users in scope", "module": "Students"},
            {"key": "branches", "label": "Branches", "value": str(branch_count), "helper": "Organization branch network", "module": "Branches"},
            {"key": "fees", "label": "Organization Revenue", "value": f"Rs {revenue:,.0f}", "helper": "All collected payments", "module": "Finance"},
            {"key": "security", "label": "Security Checks", "value": "Active", "helper": "RBAC and session controls", "module": "Security"},
        ]
    elif role == UserRole.HR:
        metrics = [
            {"key": "employees", "label": "Employees", "value": str(employees), "helper": "HR employee records", "module": "HR"},
            {"key": "payroll", "label": "Payroll", "value": f"Rs {payroll_total:,.0f}", "helper": "Net salary total", "module": "Payroll"},
            {"key": "leave", "label": "Pending Leave", "value": str(leave_pending), "helper": "Leave requests awaiting action", "module": "Leave"},
            {"key": "training", "label": "Training", "value": str(lms["published_courses"]), "helper": "Published LMS courses", "module": "Training"},
        ]
    elif role == UserRole.TRAINER:
        metrics = [
            {"key": "courses", "label": "My Courses", "value": str(lms["total_courses"]), "helper": "Courses assigned to trainer", "module": "LMS"},
            {"key": "enrollments", "label": "Students", "value": str(lms["enrollments"]), "helper": "Students in assigned courses", "module": "Students"},
            {"key": "attendance", "label": "Attendance", "value": f"{attendance['rate']:.0f}%", "helper": "Trainer session attendance", "module": "Attendance"},
            {"key": "assignments", "label": "Assignments", "value": str(totals["assignments"]), "helper": "Assignment lessons", "module": "Assignments"},
        ]
    elif role == UserRole.FINANCE:
        metrics = [
            {"key": "fees", "label": "Collected Fees", "value": f"Rs {revenue:,.0f}", "helper": "Payments in finance scope", "module": "Finance"},
            {"key": "outstanding", "label": "Outstanding", "value": f"Rs {pending_fees:,.0f}", "helper": "Pending invoice balance", "module": "Finance"},
            {"key": "invoices", "label": "Invoices", "value": str(invoices.count()), "helper": "Invoice records in scope", "module": "Finance"},
            {"key": "overdue", "label": "Overdue", "value": str(overdue), "helper": "Overdue invoices", "module": "Finance"},
        ]
    elif role == UserRole.FRANCHISE_OWNER:
        franchise_branch_ids = []
        if current_user.franchise_id:
            franchise_branch_ids = [
                branch_id
                for (branch_id,) in db.query(User.branch_id)
                .filter(User.franchise_id == current_user.franchise_id, User.branch_id != None)  # noqa: E711
                .distinct()
                .all()
            ]
        metrics = [
            {"key": "branches", "label": "Branches", "value": str(len(franchise_branch_ids)), "helper": "Assigned franchise branches", "module": "Franchise"},
            {"key": "students", "label": "Students", "value": str(total_students), "helper": "Students in franchise scope", "module": "Students"},
            {"key": "fees", "label": "Revenue", "value": f"Rs {revenue:,.0f}", "helper": "Collected payments in scope", "module": "Finance"},
            {"key": "reports", "label": "Reports", "value": "Live", "helper": "Franchise reporting enabled", "module": "Reports"},
        ]
    elif role == UserRole.COMPANY_HR:
        metrics = [
            {"key": "placement", "label": "Placement Pipeline", "value": str(total_students), "helper": "Eligible student records", "module": "Placement"},
            {"key": "students", "label": "Students", "value": str(total_students), "helper": "Students visible to Company HR", "module": "Students"},
            {"key": "reports", "label": "Reports", "value": "Live", "helper": "Placement reporting enabled", "module": "Reports"},
            {"key": "messages", "label": "Messages", "value": "0", "helper": "Placement communication", "module": "Messages"},
        ]

    return {
        "role": role.value,
        "title": ROLE_LABELS[role],
        "scope": "All branches" if current_user.role == UserRole.SUPER_ADMIN else "Assigned role scope",
        "metrics": metrics,
        "modules": _module_cards(role, modules, totals),
        "recent_activity": _recent_activity(db, branch_id),
        "notifications": [
            {"title": "Role permissions active", "message": f"{ROLE_LABELS[role]} modules are filtered by RBAC.", "tone": "success"},
            # TODO: Replace this placeholder notice after admissions, assignments, messages,
            # notifications, receipts, exams, and calendar_events tables are migrated.
            {"title": "Integration note", "message": "Missing source tables use clean placeholders until migrations are added.", "tone": "info"},
        ],
        "attendance": attendance,
        "fees": {"collected": revenue, "pending": pending_fees, "overdue": overdue},
        "courses": lms,
        "tasks": [
            {"title": "Review pending follow-ups", "status": "Open", "module": "CRM"},
            {"title": "Review admission pipeline", "status": "Open", "module": "Admissions"},
        ] if role == UserRole.COUNSELLOR else [
            # TODO: Connect role-specific task tables when operational tasks are split from HR staff_tasks.
            {"title": "Review pending follow-ups", "status": "Open", "module": "CRM"},
            {"title": "Sync reports with Super Admin", "status": "Open", "module": "Reports"},
        ],
        "calendar": [
            {"title": "Today counsellor follow-up review", "date": date.today().isoformat(), "module": "CRM"},
            {"title": "Weekly admissions sync", "date": (date.today() + timedelta(days=3)).isoformat(), "module": "Admissions"},
        ] if role == UserRole.COUNSELLOR else [
            # TODO: Replace with calendar_events rows when the shared calendar module is migrated.
            {"title": "Today operations review", "date": date.today().isoformat(), "module": "Reports"},
            {"title": "Weekly role sync", "date": (date.today() + timedelta(days=3)).isoformat(), "module": "Calendar"},
        ],
        "reports": [] if role == UserRole.COUNSELLOR else [
            {"title": "Admissions funnel", "value": f"{converted_admissions}/{total_leads}", "module": "Admissions"},
            {"title": "Fee risk", "value": str(overdue), "module": "Fees"},
            {"title": "Learning activity", "value": str(lms["enrollments"]), "module": "LMS"},
        ],
        "lead_stats": {
            "total": total_leads,
            "new": new_leads,
            "contacted": contacted_leads,
            "qualified": qualified_leads,
            "proposal_sent": proposal_sent_leads,
            "converted_admissions": converted_admissions,
            "conversion_rate": conversion_rate,
            "follow_ups_today": follow_ups_today,
        },
        "lead_status_overview": [
            {"label": "New", "value": new_leads, "detail": f"{new_leads} ({round((new_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#0B7A5A"},
            {"label": "Contacted", "value": contacted_leads, "detail": f"{contacted_leads} ({round((contacted_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#3B82F6"},
            {"label": "Qualified", "value": qualified_leads, "detail": f"{qualified_leads} ({round((qualified_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#8B5CF6"},
            {"label": "Proposal Sent", "value": proposal_sent_leads, "detail": f"{proposal_sent_leads} ({round((proposal_sent_leads / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#F59E0B"},
            {"label": "Converted (Admissions)", "value": converted_admissions, "detail": f"{converted_admissions} ({round((converted_admissions / total_leads) * 100, 1) if total_leads else 0}%)", "color": "#FB923C"},
        ],
        "lead_pipeline": [
            {"label": "New Leads", "value": new_leads, "color": "#0B7A5A"},
            {"label": "Contacted", "value": contacted_leads, "color": "#A9DDBD"},
            {"label": "Qualified", "value": qualified_leads, "color": "#B8D8F6"},
            {"label": "Proposal Sent", "value": proposal_sent_leads, "color": "#CDB7F2"},
            {"label": "Converted (Admissions)", "value": converted_admissions, "color": "#FFE0CC"},
        ],
        "permissions": {
            "allowed_modules": modules,
            "denied_modules": sorted(set().union(*ROLE_MODULES.values()) - set(modules)),
        },
        "updated_at": datetime.utcnow().isoformat(),
    }


def _student_payload(db: Session, current_user: User):
    if current_user.role == UserRole.STUDENT:
        student_id = current_user.id
    else:
        first_student = db.query(User).filter(User.role == UserRole.STUDENT).first()
        student_id = first_student.id if first_student else current_user.id

    enrollments = (
        db.query(Enrollment)
        .filter(Enrollment.student_id == student_id)
        .order_by(Enrollment.enrolled_at.desc())
        .limit(3)
        .all()
    )
    attendance = _attendance_summary(db, student_id=student_id)
    invoices = _invoice_query(db, student_id=student_id)

    courses = []
    for enrollment in enrollments:
        course = enrollment.course
        if not course:
            continue
        total_lessons = db.query(func.count(Lesson.id)).filter(Lesson.course_id == course.id).scalar() or 0
        assignment_count = (
            db.query(func.count(Lesson.id))
            .filter(Lesson.course_id == course.id, Lesson.content_type == "assignment")
            .scalar()
            or 0
        )
        material_count = (
            db.query(func.count(TrainerLessonMaterial.id))
            .filter(TrainerLessonMaterial.course_id == course.id)
            .scalar()
            or 0
        )
        completed_lessons = round((enrollment.progress_percent / 100) * total_lessons) if total_lessons else 0
        courses.append({
            "id": course.id,
            "title": course.title,
            "track": enrollment.batch_name or "Assigned Batch",
            "trainer": course.trainer.full_name if course.trainer else "Trainer",
            "trainerInitials": "".join(part[:1] for part in (course.trainer.full_name if course.trainer else "TR").split()[:2]).upper(),
            "progress": enrollment.progress_percent,
            "remainingLessons": max(0, total_lessons - completed_lessons),
            "totalLessons": total_lessons,
            "nextClass": f"{material_count} material(s) available",
            "difficulty": course.difficulty_level if course.difficulty_level in ("Beginner", "Intermediate", "Advanced") else "Beginner",
            "accent": "var(--pinesphere-green)",
        })

    pending_fees = float(invoices.filter(Invoice.status != "paid").with_entities(func.coalesce(func.sum(Invoice.amount - Invoice.paid_amount), 0)).scalar() or 0)
    certificates = []

    return {
        "profileCompletion": 78,
        "learningStreak": 7,
        "enrolledCourseCount": len(courses),
        "assignmentsCompleted": (
            db.query(func.count(LessonProgress.id))
            .join(Lesson, Lesson.id == LessonProgress.lesson_id)
            .join(Enrollment, Enrollment.course_id == Lesson.course_id)
            .filter(
                Enrollment.student_id == student_id,
                LessonProgress.student_id == student_id,
                Lesson.content_type == "assignment",
                LessonProgress.is_completed == True,  # noqa: E712
            )
            .scalar()
            or 0
        ),
        "enrolledCourses": courses,
        "assignmentsDue": [
            {
                "id": lesson.id,
                "title": lesson.title,
                "course": lesson.course.title if lesson.course else "LMS",
                "due": lesson.due_at.strftime("%d %b %Y") if lesson.due_at else "Upcoming",
                "priority": "High" if lesson.due_at and lesson.due_at.date() <= date.today() + timedelta(days=2) else "Medium",
            }
            for lesson in (
                db.query(Lesson)
                .join(Enrollment, Enrollment.course_id == Lesson.course_id)
                .filter(
                    Enrollment.student_id == student_id,
                    Enrollment.status == "active",
                    Lesson.content_type == "assignment",
                )
                .order_by(Lesson.due_at.asc())
                .limit(5)
                .all()
            )
        ],
        "certificates": certificates,
        "placementReadiness": {
            "resumeScore": 0,
            "interviewReadiness": 0,
            "projectsCompleted": 0,
            "projectsRequired": 0,
            "eligible": False,
        },
        "glance": {
            "attendance": attendance["rate"],
            "pendingTasks": 0,
            "certificatesEarned": len(certificates),
        },
        "fees": {"pending": pending_fees},
        "notifications": [],
        "messages": [],
        "calendar": [],
    }


@router.get("/branch-admin/dashboard")
def branch_admin_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.BRANCH_ADMIN))):
    _role_guard(current_user, UserRole.BRANCH_ADMIN)
    return _cached_dashboard_payload(db, current_user, UserRole.BRANCH_ADMIN, "branch-admin-dashboard")


@router.get("/counsellor/dashboard")
def counsellor_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.COUNSELLOR))):
    _role_guard(current_user, UserRole.COUNSELLOR)
    return _cached_dashboard_payload(db, current_user, UserRole.COUNSELLOR, "counsellor-dashboard")


@router.get("/trainer/dashboard")
def trainer_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.TRAINER))):
    _role_guard(current_user, UserRole.TRAINER)
    return _cached_dashboard_payload(db, current_user, UserRole.TRAINER, "trainer-dashboard")


@router.get("/hr/dashboard")
def hr_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.HR))):
    _role_guard(current_user, UserRole.HR)
    return _cached_dashboard_payload(db, current_user, UserRole.HR, "hr-dashboard")


@router.get("/parent/dashboard")
def parent_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.PARENT))):
    _role_guard(current_user, UserRole.PARENT)
    return _cached_dashboard_payload(db, current_user, UserRole.PARENT, "parent-dashboard")


@router.get("/student/dashboard")
def student_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.STUDENT))):
    _role_guard(current_user, UserRole.STUDENT)
    return _cached_student_payload(db, current_user)


@router.get("/super-admin/overview")
def super_admin_overview(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return _cached_super_admin_payload(db, current_user)


@router.get("/super-admin/dashboard")
def super_admin_dashboard_alias(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.SUPER_ADMIN))):
    return super_admin_overview(db, current_user)


@router.get("/finance/dashboard")
def finance_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.FINANCE))):
    _role_guard(current_user, UserRole.FINANCE)
    return _cached_dashboard_payload(db, current_user, UserRole.FINANCE, "finance-dashboard")


@router.get("/franchise-owner/dashboard")
def franchise_owner_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.FRANCHISE_OWNER))):
    _role_guard(current_user, UserRole.FRANCHISE_OWNER)
    return _cached_dashboard_payload(db, current_user, UserRole.FRANCHISE_OWNER, "franchise-owner-dashboard")


@router.get("/company-hr/dashboard")
def company_hr_dashboard(db: Session = Depends(get_db), current_user=Depends(require_roles(UserRole.COMPANY_HR))):
    _role_guard(current_user, UserRole.COMPANY_HR)
    return _cached_dashboard_payload(db, current_user, UserRole.COMPANY_HR, "company-hr-dashboard")
