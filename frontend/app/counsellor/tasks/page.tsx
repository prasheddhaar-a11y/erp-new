import { RoleLayout } from "@/components/role-dashboard"
import { CounsellorTasksModule } from "@/components/tasks/CounsellorTasksModule"

export default function CounsellorTasksPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorTasksModule />
    </RoleLayout>
  )
}