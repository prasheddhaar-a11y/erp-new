/* =========================================================
   SECTION: Imports
   Purpose: External libraries, types, and shared utilities
========================================================= */

/* =========================================================
   SECTION: Constants
   Purpose: Static values, API URLs, role mappings
========================================================= */

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const SESSION_KEYS = [
  "pinesphere_access_token",
  "pinesphere_refresh_token",
  "pinesphere_profile",
] as const;

export const ALL_SESSION_KEYS = [
  ...SESSION_KEYS,
  "pinesphere_user",
  "pinesphere_remember_me",
] as const;

export const AUTH_STORAGE_KEYS = {
  accessToken: "pinesphere_access_token",
  refreshToken: "pinesphere_refresh_token",
  user: "pinesphere_user",
  rememberMe: "pinesphere_remember_me",
} as const;

export const USER_ROLES = [
  "super_admin",
  "branch_admin",
  "counsellor",
  "trainer",
  "student",
  "parent",
  "hr",
  "finance",
  "franchise_owner",
  "company_hr",
  "public",
] as const;

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  branch_admin: "Branch Admin",
  counsellor: "Counsellor",
  trainer: "Trainer",
  student: "Student",
  parent: "Parent",
  hr: "HR",
  finance: "Finance",
  franchise_owner: "Franchise Owner",
  company_hr: "Company HR",
  public: "Public",
} as const;

export const ROLE_ABBREVIATIONS = {
  super_admin: "SA",
  branch_admin: "BA",
  counsellor: "CL",
  trainer: "TR",
  student: "ST",
  parent: "P",
  hr: "HR",
  finance: "FN",
  franchise_owner: "FO",
  company_hr: "CH",
  public: "PB",
} as const;

export const ROLE_ALIASES = {
  SUPER_ADMIN: "super_admin",
  SA: "super_admin",
  BRANCH_ADMIN: "branch_admin",
  BA: "branch_admin",
  TRAINER: "trainer",
  TR: "trainer",
} as const;

export const ROLE_DASHBOARD_PATHS = {
  super_admin: "/super-admin/dashboard",
  branch_admin: "/branch-admin/dashboard",
  counsellor: "/counsellor/dashboard",
  trainer: "/trainer/dashboard",
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  hr: "/hr/dashboard",
  finance: "/finance/dashboard",
  franchise_owner: "/franchise-owner/dashboard",
  company_hr: "/company-hr/dashboard",
  public: "/public",
} as const;

export const PUBLIC_AUTH_ROUTES = new Set(["/accept-invite", "/reset-password", "/verify-email"]);

/* =========================================================
   SECTION: Types
   Purpose: Shared TypeScript types and interfaces
========================================================= */

/* =========================================================
   SECTION: Helper Functions
   Purpose: Reusable frontend logic
========================================================= */

/* =========================================================
   SECTION: Exports
   Purpose: Public exports used across the app
========================================================= */
