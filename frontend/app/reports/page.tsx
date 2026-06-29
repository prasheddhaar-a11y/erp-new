import { RoleLayout } from "@/components/role-dashboard"
import { CounsellorReportsModule } from "@/components/reports/CounsellorReportsModule"

export default function ReportsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorReportsModule />
    </RoleLayout>
  )
}
