import { RoleDashboardPage } from "@/components/role-dashboard"

export default function FinanceDashboard() {
  return <RoleDashboardPage expectedRole="finance" endpoint="/api/finance/dashboard" />
}
