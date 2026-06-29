/* =========================================================
   SECTION: Imports
   Purpose: External libraries, types, and shared utilities
========================================================= */

import type { UserRole } from "./auth";
import { ROLE_DASHBOARD_PATHS } from "./constants";

/* =========================================================
   SECTION: Constants
   Purpose: Static values, API URLs, role mappings
========================================================= */

export const DASHBOARD_ICON_KEYS = [
  "academics",
  "admissions",
  "assignments",
  "attendance",
  "batches",
  "branches",
  "calendar",
  "communication",
  "dashboard",
  "exams",
  "fees",
  "franchise",
  "library",
  "lms",
  "messages",
  "notices",
  "payroll",
  "placement",
  "profile",
  "reports",
  "security",
  "settings",
  "staff",
  "students",
  "tasks",
  "tests",
  "users",
  "wallet",
] as const;

export const roleDashboardPaths = ROLE_DASHBOARD_PATHS;

export const superAdminSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/super-admin/dashboard", icon: "dashboard" },
  { key: "branches", label: "Branches", href: "/branches", icon: "branches" },
  { key: "users", label: "Users", href: "/users", icon: "users" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "finance", label: "Finance", href: "/finance", icon: "fees" },
  { key: "hr", label: "HR", href: "/hr", icon: "staff" },
  { key: "franchise", label: "Franchise", href: "/franchise", icon: "franchise" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "security", label: "Security", href: "/security", icon: "security" },
  { key: "settings", label: "Settings", href: "/super-admin/settings", icon: "settings" },
] as const;

export const branchAdminSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/branch-admin/dashboard", icon: "dashboard" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "staff", label: "Staff", href: "/hr", icon: "staff" },
  { key: "finance", label: "Finance", href: "/finance", icon: "fees" },
  { key: "lms", label: "LMS", href: "/lms", icon: "lms" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "communication", label: "Communication", href: "/communication", icon: "communication" },
  { key: "settings", label: "Settings", href: "/branch-admin/settings", icon: "settings" },
] as const;

export const counsellorSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/counsellor/dashboard", icon: "dashboard" },
  { key: "leads", label: "Leads", href: "/crm", icon: "students" },
  { key: "follow-ups", label: "Follow Ups", href: "/crm", icon: "calendar" },
  { key: "admissions", label: "Admissions", href: "/crm", icon: "admissions" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "tasks", label: "Tasks", href: "/tasks", icon: "tasks" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "communication", label: "Communication", href: "/communication", icon: "communication" },
  { key: "settings", label: "Settings", href: "/counsellor/settings", icon: "settings" },
] as const;

export const trainerSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/trainer/dashboard", icon: "dashboard" },
  { key: "my-batches", label: "My Batches", href: "/lms", icon: "batches" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "lms", label: "LMS", href: "/lms", icon: "lms" },
  { key: "assignments", label: "Assignments", href: "/assignments", icon: "assignments" },
  { key: "tests", label: "Tests", href: "/exams", icon: "tests" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { key: "messages", label: "Messages", href: "/messages", icon: "messages" },
  { key: "settings", label: "Settings", href: "/trainer/settings", icon: "settings" },
] as const;

export const studentSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { key: "courses", label: "My Courses", href: "/student/dashboard#student-courses", icon: "lms" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "assignments", label: "Assignments", href: "/student/dashboard#student-assignments", icon: "assignments" },
  { key: "exams", label: "Exams", href: "/exams", icon: "tests" },
  { key: "certificates", label: "Certificates", href: "/student/dashboard#student-certificates", icon: "academics" },
  { key: "fees", label: "Fees", href: "/finance", icon: "fees" },
  { key: "messages", label: "Messages", href: "/messages", icon: "messages" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { key: "settings", label: "Settings", href: "/student/settings", icon: "settings" },
] as const;

export const parentSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/parent/dashboard", icon: "dashboard" },
  { key: "children", label: "My Children", href: "/students", icon: "students" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "fees", label: "Fees", href: "/finance", icon: "fees" },
  { key: "academics", label: "Academics", href: "/lms", icon: "academics" },
  { key: "assignments", label: "Assignments", href: "/assignments", icon: "assignments" },
  { key: "messages", label: "Messages", href: "/messages", icon: "messages", badge: "3" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { key: "profile", label: "Profile", href: "/profile", icon: "profile" },
  { key: "settings", label: "Settings", href: "/parent/settings", icon: "settings" },
] as const;

export const hrSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/hr/dashboard", icon: "dashboard" },
  { key: "employees", label: "Employees", href: "/hr", icon: "staff" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "payroll", label: "Payroll", href: "/hr", icon: "payroll" },
  { key: "leave", label: "Leave", href: "/hr", icon: "calendar" },
  { key: "performance", label: "Performance", href: "/reports", icon: "reports" },
  { key: "recruitment", label: "Recruitment", href: "/users", icon: "users" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/hr/settings", icon: "settings" },
] as const;

export const financeSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/finance/dashboard", icon: "dashboard" },
  { key: "fees", label: "Fees", href: "/finance", icon: "fees" },
  { key: "invoices", label: "Invoices", href: "/finance", icon: "wallet" },
  { key: "payments", label: "Payments", href: "/finance", icon: "wallet" },
  { key: "salary", label: "Salary", href: "/hr", icon: "payroll" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/finance/settings", icon: "settings" },
] as const;

export const franchiseOwnerSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/franchise-owner/dashboard", icon: "dashboard" },
  { key: "franchise", label: "Franchise", href: "/franchise", icon: "franchise" },
  { key: "branches", label: "Branches", href: "/branches", icon: "branches" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
] as const;

export const companyHrSidebar = [
  { key: "dashboard", label: "Dashboard", href: "/company-hr/dashboard", icon: "dashboard" },
  { key: "placement", label: "Placement", href: "/placement", icon: "placement" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
] as const;

export const roleSidebars = {
  super_admin: superAdminSidebar,
  branch_admin: branchAdminSidebar,
  counsellor: counsellorSidebar,
  trainer: trainerSidebar,
  student: studentSidebar,
  parent: parentSidebar,
  hr: hrSidebar,
  finance: financeSidebar,
  franchise_owner: franchiseOwnerSidebar,
  company_hr: companyHrSidebar,
  public: [],
} as const;

/* =========================================================
   SECTION: Types
   Purpose: Shared TypeScript types and interfaces
========================================================= */

export type DashboardIconKey = typeof DASHBOARD_ICON_KEYS[number];

export type SidebarModule = {
  key: string;
  label: string;
  href: string;
  icon: DashboardIconKey;
  badge?: string;
};

export type RoleDashboardKey = Exclude<UserRole, "student" | "public">;

/* =========================================================
   SECTION: Helper Functions
   Purpose: Reusable frontend logic
========================================================= */

export function getRoleSidebar(role: UserRole | null | undefined): readonly SidebarModule[] {
  return role ? roleSidebars[role] : [];
}

export function getRoleDashboardRoute(role: UserRole | null | undefined) {
  return role ? roleDashboardPaths[role] : undefined;
}

/* =========================================================
   SECTION: Exports
   Purpose: Public exports used across the app
========================================================= */
