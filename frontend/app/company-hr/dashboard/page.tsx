import { RoleDashboardPage } from "@/components/role-dashboard"

export default function CompanyHrDashboard() {
  return <RoleDashboardPage expectedRole="company_hr" endpoint="/api/company-hr/dashboard" />
}
