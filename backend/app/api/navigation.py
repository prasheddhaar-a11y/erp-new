"""
PINESPHERE ERP
Module      : Backend Platform
File        : navigation.py
Purpose     : Defines Navigation API endpoints and request handling
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

from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.core.roles import UserRole

router = APIRouter(prefix="/navigation", tags=["Navigation"])

ROLE_SIDEBARS = {
    UserRole.SUPER_ADMIN: ["Dashboard", "Branches", "Users", "Students", "Finance", "HR", "Franchise", "Reports", "Security", "Settings"],
    UserRole.BRANCH_ADMIN: ["Dashboard", "Students", "Staff", "Finance", "LMS", "Reports", "Communication", "Settings"],
    UserRole.COUNSELLOR: ["Dashboard", "Leads", "Follow Ups", "Admissions", "Students", "Tasks", "Calendar", "Reports", "Communication", "Settings"],
    UserRole.TRAINER: ["Dashboard", "My Batches", "Students", "Attendance", "LMS", "Assignments", "Tests", "Calendar", "Messages", "Settings"],
    UserRole.HR: ["Dashboard", "Employees", "Attendance", "Payroll", "Leave", "Performance", "Recruitment", "Reports", "Settings"],
    UserRole.FINANCE: ["Dashboard", "Fees", "Invoices", "Payments", "Salary", "Reports", "Settings"],
    UserRole.FRANCHISE_OWNER: ["Dashboard", "Franchise", "Branches", "Reports", "Settings"],
    UserRole.COMPANY_HR: ["Dashboard", "Placement", "Students", "Reports", "Settings"],
    UserRole.PARENT: ["Dashboard", "My Children", "Attendance", "Fees", "Academics", "Assignments", "Messages", "Calendar", "Profile", "Settings"],
    UserRole.STUDENT: ["Dashboard", "My Courses", "Attendance", "Assignments", "Exams", "Certificates", "Fees", "Messages", "Calendar", "Settings"],
}


# =====================================================
# SECTION: ROUTES AND ENDPOINTS
# PURPOSE:
# This section defines HTTP endpoints exposed by the backend.
# Routes receive requests, call services, and return API responses.
# =====================================================

@router.get("/sidebar")
# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def get_sidebar_navigation(current_user=Depends(get_current_user)):
    modules = ROLE_SIDEBARS.get(current_user.role, [])
    return {
        "role": current_user.role.value,
        "modules": modules,
        "dropdowns": {module: [] for module in modules},
        "excludedDropdowns": [module for module in set().union(*[set(items) for items in ROLE_SIDEBARS.values()]) if module not in modules],
    }
