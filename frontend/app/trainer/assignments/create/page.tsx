import type { Metadata } from "next"

import { TrainerAssignmentCreatePage as TrainerAssignmentCreateModulePage } from "@/modules/trainers/components/TrainerAssignmentCreatePage"

export const metadata: Metadata = {
  title: "Create Assignment | Trainer Portal - Pinesphere ERP",
  description: "Create trainer-scoped assignments for assigned batches.",
}

export default function TrainerAssignmentCreateRoute() {
  return <TrainerAssignmentCreateModulePage />
}
