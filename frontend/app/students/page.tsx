import { RoleLayout } from "@/components/role-dashboard"
import { CounsellorStudentsModule } from "@/components/students/CounsellorStudentsModule"

export default function StudentsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorStudentsModule />
    </RoleLayout>
  )
}
