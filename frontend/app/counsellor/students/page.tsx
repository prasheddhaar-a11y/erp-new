import { RoleLayout } from "@/components/role-dashboard"
import { CounsellorStudentsModule } from "@/components/students/CounsellorStudentsModule"

export default function CounsellorStudentsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorStudentsModule />
    </RoleLayout>
  )
}
