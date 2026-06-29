import { RoleLayout } from "@/components/role-dashboard"
import CounsellorCalendarModule from "@/components/calendar/CounsellorCalendarModule"

export default function CounsellorCalendarPage() {
  return (
    <RoleLayout
      expectedRole="counsellor"
      endpoint="/api/counsellor/dashboard"
    >
      <CounsellorCalendarModule />
    </RoleLayout>
  )
}