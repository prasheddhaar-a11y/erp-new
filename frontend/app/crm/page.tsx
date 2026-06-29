import { CounsellorLeadsModule } from "@/components/leads/CounsellorLeadsModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function CrmLeadsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorLeadsModule />
    </RoleLayout>
  )
}
