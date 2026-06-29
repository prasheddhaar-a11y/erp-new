import { CounsellorAdmissionModule } from "@/components/admissions/CounsellorAdmissionModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function AdmissionDetailsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorAdmissionModule initialView="details" />
    </RoleLayout>
  )
}
