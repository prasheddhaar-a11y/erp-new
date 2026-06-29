"""
PINESPHERE ERP
Module      : Backend Platform
File        : permissions.py
Purpose     : Provides Permissions backend functionality
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

from app.core.roles import UserRole

Permission = str

# =====================================================
# SECTION: CONSTANTS
# PURPOSE:
# This section stores fixed values used by the file.
# Centralizing these values helps avoid repeated magic strings or numbers.
# =====================================================

PERMISSION_ACTIONS = ["view", "create", "edit", "delete", "export", "approve", "analytics"]

ROLE_PERMISSIONS: dict[UserRole, dict[str, list[Permission]]] = {
    UserRole.SUPER_ADMIN: {
        "*": PERMISSION_ACTIONS,
    },
    UserRole.BRANCH_ADMIN: {
        "students": PERMISSION_ACTIONS,
        "staff": PERMISSION_ACTIONS,
        "users": ["view", "create", "edit", "export"],
        "lms": PERMISSION_ACTIONS,
        "attendance": PERMISSION_ACTIONS,
        "finance": PERMISSION_ACTIONS,
    },
    UserRole.COUNSELLOR: {
        "crm": ["view", "create", "edit", "export"],
        "admissions": ["view", "create", "edit", "approve", "export"],
        "leads": ["view", "create", "edit", "export"],
        "students": ["view", "create", "edit"],
    },
    UserRole.TRAINER: {
        "students": ["view", "edit"],
        "lms": ["view", "create", "edit", "analytics"],
        "attendance": ["view", "create", "edit"],
        "batches": ["view", "create", "edit"],
    },
    UserRole.STUDENT: {
        "lms": ["view"],
        "ai_lab": ["view"],
        "internship": ["view"],
        "parent_portal": ["view"],
        "attendance": ["view"],
        "students": ["view"],
    },
    UserRole.PARENT: {
        "students": ["view"],
        "parent_portal": ["view"],
        "notifications": ["view"],
        "attendance": ["view"],
        "finance": ["view"],
        "lms": ["view"],
    },
    UserRole.HR: {
        "hr": PERMISSION_ACTIONS,
        "staff": PERMISSION_ACTIONS,
        "payroll": PERMISSION_ACTIONS,
        "leave": PERMISSION_ACTIONS,
        "performance": PERMISSION_ACTIONS,
        "users": ["view", "create", "edit"],
    },
    UserRole.FINANCE: {
        "finance": PERMISSION_ACTIONS,
        "fees": PERMISSION_ACTIONS,
        "invoicing": PERMISSION_ACTIONS,
        "salary": PERMISSION_ACTIONS,
        "p_and_l": PERMISSION_ACTIONS,
        "students": ["view"],
    },
    UserRole.FRANCHISE_OWNER: {
        "franchise": ["view", "analytics"],
        "branches": ["view", "analytics"],
        "reports": ["view", "export", "analytics"],
    },
    UserRole.COMPANY_HR: {
        "placement": ["view", "create", "edit", "export"],
        "students": ["view"],
    },
    UserRole.PUBLIC: {
        "website": ["view"],
        "admissions": ["view", "create"],
        "bookings": ["view", "create"],
    },
}


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def get_permissions(role: UserRole) -> dict[str, list[Permission]]:
    return ROLE_PERMISSIONS.get(role, {})


def has_permission(role: UserRole, module: str, action: Permission) -> bool:
    permissions = get_permissions(role)
    return action in permissions.get("*", []) or action in permissions.get(module, [])
