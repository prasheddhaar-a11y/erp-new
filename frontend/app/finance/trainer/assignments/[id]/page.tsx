import type { Metadata } from "next"

import { TrainerAssignmentDetailsPage as TrainerAssignmentDetailsModulePage } from "@/modules/trainers/components/TrainerAssignmentDetailsPage"

export const metadata: Metadata = {
  title: "Assignment Details | Trainer Portal - Pinesphere ERP",
  description: "View trainer-scoped assignment details and submissions.",
}

export default function TrainerAssignmentDetailsRoute({
  params,
}: {
  params: { id: string }
}) {
  return <TrainerAssignmentDetailsModulePage assignmentId={params.id} />
}
