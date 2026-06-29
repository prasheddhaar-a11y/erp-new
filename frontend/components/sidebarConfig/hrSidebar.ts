import type { RoleSidebarModule } from "./types"

export const hrSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/hr/dashboard", icon: "dashboard" },
  { key: "employees", label: "Employees", href: "/hr", icon: "staff" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "payroll", label: "Payroll", href: "/hr", icon: "payroll" },
  { key: "leave", label: "Leave", href: "/hr", icon: "calendar" },
  { key: "performance", label: "Performance", href: "/reports", icon: "reports" },
  { key: "recruitment", label: "Recruitment", href: "/users", icon: "users" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
