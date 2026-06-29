"""
PINESPHERE ERP
Module      : Backend Platform
File        : roles.py
Purpose     : Provides Roles backend functionality
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

from enum import Enum


class UserRole(str, Enum):
    # =====================================================
    # SECTION: CONSTANTS
    # PURPOSE:
    # This section stores fixed values used by the file.
    # Centralizing these values helps avoid repeated magic strings or numbers.
    # =====================================================

    SUPER_ADMIN = "super_admin"
    BRANCH_ADMIN = "branch_admin"
    COUNSELLOR = "counsellor"
    TRAINER = "trainer"
    STUDENT = "student"
    PARENT = "parent"
    HR = "hr"
    FINANCE = "finance"
    FRANCHISE_OWNER = "franchise_owner"
    COMPANY_HR = "company_hr"
    PUBLIC = "public"


ROLE_ABBREVIATIONS = {
    UserRole.SUPER_ADMIN: "SA",
    UserRole.BRANCH_ADMIN: "BA",
    UserRole.COUNSELLOR: "CL",
    UserRole.TRAINER: "TR",
    UserRole.HR: "HR",
    UserRole.FINANCE: "FN",
    UserRole.STUDENT: "ST",
    UserRole.PARENT: "PA",
    UserRole.FRANCHISE_OWNER: "FO",
    UserRole.COMPANY_HR: "CH",
    UserRole.PUBLIC: "PB",
}


# =====================================================
# SECTION: HELPER FUNCTIONS
# PURPOSE:
# This section contains small reusable utilities used by the file.
# Helpers keep repeated logic in one clear place.
# =====================================================

def role_abbreviation(role: UserRole) -> str:
    return ROLE_ABBREVIATIONS[role]
