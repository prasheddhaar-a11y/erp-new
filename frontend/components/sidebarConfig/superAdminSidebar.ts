import type { RoleSidebarModule } from "./types"

export const superAdminSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/super-admin/dashboard", icon: "dashboard" },
  { key: "users", label: "Users", href: "/super-admin/users", icon: "users" },
  { key: "branches", label: "Branches", href: "/super-admin/branches", icon: "branches" },
  {
    key: "crm",
    label: "CRM",
    href: "/super-admin/crm",
    icon: "admissions",
    children: [
      { key: "crm-admissions", label: "Admissions", href: "/super-admin/crm/admissions", icon: "admissions" },
      { key: "crm-leads", label: "Lead Management", href: "/super-admin/crm/lead-management", icon: "students" },
    ],
  },
  { key: "students", label: "Students", href: "/super-admin/students", icon: "students" },
  {
    key: "lms",
    label: "LMS",
    href: "/super-admin/lms",
    icon: "lms",
    children: [
      { key: "batch", label: "Batch", href: "/super-admin/lms/batch", icon: "batches" },
      { key: "attendance", label: "Attendance", href: "/super-admin/lms/attendance", icon: "attendance" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    href: "/super-admin/finance",
    icon: "fees",
    children: [
      { key: "finance-payments", label: "Payments", href: "/super-admin/finance/payments", icon: "wallet" },
      { key: "finance-invoices", label: "Invoices", href: "/super-admin/finance/invoices", icon: "fees" },
      { key: "finance-payroll", label: "Payroll", href: "/super-admin/finance/payroll", icon: "payroll" },
    ],
  },
  {
    key: "hr",
    label: "HR",
    href: "/super-admin/hr",
    icon: "staff",
    children: [
      { key: "hr-payroll", label: "Payroll", href: "/super-admin/hr/payroll", icon: "payroll" },
      { key: "hr-leave", label: "Leave Management", href: "/super-admin/hr/leave-management", icon: "calendar" },
      { key: "hr-performance", label: "Performance", href: "/super-admin/hr/performance", icon: "reports" },
    ],
  },
  { key: "placement", label: "Placement Portal", href: "/super-admin/placement-portal", icon: "placement" },
  { key: "ai-platform", label: "AI Platform", href: "/super-admin/ai-platform", icon: "lms" },
  { key: "franchise", label: "Franchise", href: "/super-admin/franchise", icon: "franchise" },
  {
    key: "reports",
    label: "Reports",
    href: "/super-admin/reports",
    icon: "reports",
    children: [
      { key: "reports-analytics", label: "Analytics", href: "/super-admin/reports/analytics", icon: "reports" },
      { key: "branch-reports", label: "Branch Reports", href: "/super-admin/reports/branch-reports", icon: "branches" },
    ],
  },
  { key: "security", label: "Security", href: "/super-admin/security", icon: "security" },
  { key: "settings", label: "Settings", href: "/super-admin/settings", icon: "settings" },
]
