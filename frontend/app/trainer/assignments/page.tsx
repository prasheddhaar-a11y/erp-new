import type { Metadata } from "next"

import { TrainerAssignmentsPage as TrainerAssignmentsModulePage } from "@/modules/trainers/components/TrainerAssignmentsPage"

export const metadata: Metadata = {
  title: "Assignments | Trainer Portal - Pinesphere ERP",
  description: "Create and manage assignments for your students.",
}

export default function TrainerAssignmentsPage() {
  return <TrainerAssignmentsModulePage />
}
