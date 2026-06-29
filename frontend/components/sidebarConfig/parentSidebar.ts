import type { RoleSidebarModule } from "./types"

export const parentSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/parent/dashboard", icon: "dashboard" },
  { key: "children", label: "My Children", href: "/students", icon: "students" },
  { key: "attendance", label: "Attendance", href: "/attendance", icon: "attendance" },
  { key: "fees", label: "Fees", href: "/finance", icon: "fees" },
  { key: "academics", label: "Academics", href: "/lms", icon: "academics" },
  { key: "assignments", label: "Assignments", href: "/assignments", icon: "assignments" },
  { key: "messages", label: "Messages", href: "/messages", icon: "messages", badge: "3" },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar" },
  { key: "profile", label: "Profile", href: "/profile", icon: "profile" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
