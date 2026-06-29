/* =========================================================
   SECTION: Imports
   Purpose: External libraries, types, and shared utilities
========================================================= */

import type { UserRole } from "./auth";

/* =========================================================
   SECTION: Constants
   Purpose: Static values, API URLs, role mappings
========================================================= */

export const ALL_MODULE_LABELS = [
  "Dashboard",
  "Users",
  "Branches",
  "CRM",
  "Students",
  "LMS",
  "Finance",
  "HR",
  "AI",
  "Placement",
  "Franchise",
  "Reports",
  "Security",
  "Settings",
] as const;

export const ROLE_MODULE_ACCESS: Record<UserRole, readonly ModuleLabel[]> = {
  super_admin: ALL_MODULE_LABELS,
  branch_admin: ["Dashboard", "Students", "HR", "Finance", "LMS"],
  counsellor: ["Dashboard", "CRM"],
  trainer: ["Dashboard", "LMS", "Students"],
  student: ["Dashboard", "LMS", "AI"],
  parent: ["Dashboard", "Students", "Finance"],
  hr: ["Dashboard", "HR", "Users", "Finance"],
  finance: ["Dashboard", "Finance", "HR"],
  franchise_owner: ["Dashboard", "Franchise", "Branches", "Reports"],
  company_hr: ["Dashboard", "Placement"],
  public: [],
};

export const MODULE_ACTION_ACCESS: Partial<Record<ModuleLabel, readonly UserRole[]>> = {
  Students: ["super_admin", "branch_admin"],
  LMS: ["super_admin", "branch_admin", "trainer"],
  CRM: ["super_admin", "counsellor"],
  Finance: ["super_admin", "branch_admin", "finance"],
  Users: ["super_admin"],
  Security: ["super_admin"],
  Settings: ["super_admin"],
  HR: ["super_admin", "branch_admin", "hr"],
};

/* =========================================================
   SECTION: Types
   Purpose: Shared TypeScript types and interfaces
========================================================= */

export type ModuleLabel = typeof ALL_MODULE_LABELS[number];

/* =========================================================
   SECTION: Helper Functions
   Purpose: Reusable frontend logic
========================================================= */

export function getAllowedModulesForRole(role: UserRole | string | null | undefined): readonly ModuleLabel[] {
  if (!role || !(role in ROLE_MODULE_ACCESS)) return [];
  return ROLE_MODULE_ACCESS[role as UserRole];
}

export function canAccessModule(role: UserRole | string | null | undefined, module: ModuleLabel) {
  return getAllowedModulesForRole(role).includes(module);
}

export function canUseModuleActions(role: UserRole | string | null | undefined, module: ModuleLabel) {
  if (!role) return false;
  const allowedRoles = MODULE_ACTION_ACCESS[module];
  return allowedRoles ? allowedRoles.includes(role as UserRole) : false;
}

/* =========================================================
   SECTION: Exports
   Purpose: Public exports used across the app
========================================================= */
