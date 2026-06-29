import type { RoleSidebarModule } from "./types"

export const studentSidebar: RoleSidebarModule[] = [
  { key: "dashboard", label: "Dashboard", href: "/student/dashboard", icon: "dashboard" },
  { key: "courses", label: "My Courses", href: "/student/lms", icon: "lms" },
  { key: "attendance", label: "Attendance", href: "/student/attendance", icon: "attendance" },
  { key: "assignments", label: "Assignments", href: "/student/dashboard#student-assignments", icon: "assignments", hidden: true },
  { key: "exams", label: "Exams", href: "/exams", icon: "tests", hidden: true },
  { key: "certificates", label: "Certificates", href: "/student/dashboard#student-certificates", icon: "academics", hidden: true },
  { key: "fees", label: "Fees", href: "/student/fees", icon: "fees" },
  { key: "messages", label: "Messages", href: "/messages", icon: "messages", hidden: true },
  { key: "calendar", label: "Calendar", href: "/calendar", icon: "calendar", hidden: true },
  { key: "placement", label: "Placement", href: "/student/dashboard#student-placement", icon: "placement", hidden: true },
  { key: "settings", label: "Settings", href: "/student/settings", icon: "settings" },
]
