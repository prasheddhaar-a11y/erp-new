import type { RoleSidebarModule } from "./types"

export const counsellorSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/counsellor/dashboard", icon: "dashboard" },
  { key: "leads", label: "Leads", href: "/crm", icon: "students" },
  { key: "follow-ups", label: "Follow Ups", href: "/follow-ups", icon: "calendar" },
  { key: "admissions", label: "Admissions", href: "/counsellor/admissions", icon: "admissions" },
  { key: "students", label: "Students", href: "/counsellor/students", icon: "students" },
  { key: "tasks", label: "Tasks", href: "/counsellor/tasks", icon: "tasks" },
  { key: "calendar", label: "Calendar", href: "/counsellor/calendar", icon: "calendar" },
  { key: "settings", label: "Settings", href: "/settings/profile", icon: "settings" },
]
