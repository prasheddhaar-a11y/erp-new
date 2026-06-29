import type { RoleSidebarModule } from "./types"

export const franchiseOwnerSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/franchise-owner/dashboard", icon: "dashboard" },
  { key: "franchise", label: "Franchise", href: "/franchise", icon: "franchise" },
  { key: "branches", label: "Branches", href: "/branches", icon: "branches" },
  { key: "reports", label: "Reports", href: "/reports", icon: "reports" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
