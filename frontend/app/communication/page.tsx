import { RoleLayout } from "@/components/role-dashboard"
import { CounsellorCommunicationModule } from "@/components/communication/CounsellorCommunicationModule"

export default function CommunicationPage() {
  return (
    <RoleLayout expectedRole="counsellor" endpoint="/api/counsellor/dashboard">
      <CounsellorCommunicationModule />
    </RoleLayout>
  )
}
