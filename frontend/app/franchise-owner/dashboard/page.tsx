import { RoleDashboardPage } from "@/components/role-dashboard"

export default function FranchiseOwnerDashboard() {
  return <RoleDashboardPage expectedRole="franchise_owner" endpoint="/api/franchise-owner/dashboard" />
}
