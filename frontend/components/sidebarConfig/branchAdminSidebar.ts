import type { RoleSidebarModule } from "./types"

export const branchAdminSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/branch-admin/dashboard", icon: "dashboard" },
  { key: "students", label: "Students", href: "/branch-admin/students", icon: "students" },
  { key: "staff", label: "Staff", href: "/branch-admin/users", icon: "staff" },
  { key: "finance", label: "Finance", href: "/branch-admin/fees", icon: "fees" },
  { key: "lms", label: "LMS", href: "/branch-admin/lms", icon: "lms" },
  { key: "reports", label: "Reports", href: "/branch-admin/reports", icon: "reports" },
  { key: "communication", label: "Communication", href: "/branch-admin/settings", icon: "communication" },
  { key: "settings", label: "Settings", href: "/branch-admin/settings", icon: "settings" },
]
