import { RoleDashboardPage } from "@/components/role-dashboard"

export default function HrDashboard() {
  return <RoleDashboardPage expectedRole="hr" endpoint="/api/hr/dashboard" />
}
