import { CounsellorAdmissionModule } from "@/components/admissions/CounsellorAdmissionModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function AdmissionAnalyticsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorAdmissionModule initialView="analytics" />
    </RoleLayout>
  )
}
