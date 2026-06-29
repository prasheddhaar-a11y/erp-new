import { RoleDashboardPage } from "@/components/role-dashboard"

export default function CounsellorDashboard() {
  return <RoleDashboardPage expectedRole="counsellor" endpoint="/api/counsellor/dashboard" />
}
