import { CounsellorAdmissionModule } from "@/components/admissions/CounsellorAdmissionModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function CreateAdmissionPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorAdmissionModule initialView="create" />
    </RoleLayout>
  )
}
