import type { Metadata } from "next"
import { TrainerBatchesPage } from "@/modules/trainers/components/TrainerBatchesPage"

export const metadata: Metadata = {
  title: "My Batches | Trainer Portal – Pinesphere ERP",
  description: "View and manage your assigned training batches.",
}

export default function TrainerBatchesRoute() {
  return <TrainerBatchesPage />
}
