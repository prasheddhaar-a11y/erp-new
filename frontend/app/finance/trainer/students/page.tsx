import type { Metadata } from "next"
import { TrainerStudentsPage } from "@/modules/trainers/components/TrainerStudentsPage"

export const metadata: Metadata = {
  title: "Assigned Students | Trainer Portal - Pinesphere ERP",
  description: "View students assigned to your batches.",
}

export default function TrainerStudentsRoute() {
  return <TrainerStudentsPage />
}
