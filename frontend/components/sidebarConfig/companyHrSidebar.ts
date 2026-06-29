import type { RoleSidebarModule } from "./types"

export const companyHrSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/company-hr/dashboard", icon: "dashboard" },
  { key: "placement", label: "Placement", href: "/placement", icon: "placement" },
  { key: "students", label: "Students", href: "/students", icon: "students" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
