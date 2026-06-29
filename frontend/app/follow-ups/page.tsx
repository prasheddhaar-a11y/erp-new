import { CounsellorFollowUpsModule } from "@/components/follow-ups/CounsellorFollowUpsModule"
import { RoleLayout } from "@/components/role-dashboard"

export default function FollowUpsPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorFollowUpsModule />
    </RoleLayout>
  )
}
