import { CounsellorAdmissionModule } from "@/components/admissions/CounsellorAdmissionModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function AdmissionPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorAdmissionModule />
    </RoleLayout>
  )
}
