import type { RoleSidebarModule } from "./types"

export const financeSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/finance/dashboard", icon: "dashboard" },
  { key: "fees", label: "Fees", href: "/finance", icon: "fees" },
  { key: "invoices", label: "Invoices", href: "/finance", icon: "wallet" },
  { key: "payments", label: "Payments", href: "/finance", icon: "wallet" },
  { key: "salary", label: "Salary", href: "/hr", icon: "payroll" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
