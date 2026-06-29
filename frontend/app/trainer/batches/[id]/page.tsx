import type { Metadata } from "next"
import { TrainerBatchDetailsPage } from "@/modules/trainers/components/TrainerBatchDetailsPage"

export const metadata: Metadata = {
  title: "Batch Details | Trainer Portal – Pinesphere ERP",
  description: "View student roster, schedule, and metrics for your assigned batch.",
}

export default function TrainerBatchDetailsRoute() {
  return <TrainerBatchDetailsPage />
}
