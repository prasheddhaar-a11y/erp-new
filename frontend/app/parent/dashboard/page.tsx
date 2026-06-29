import { RoleDashboardPage } from "@/components/role-dashboard"

export default function ParentDashboard() {
  return <RoleDashboardPage expectedRole="parent" endpoint="/api/parent/dashboard" />
}
