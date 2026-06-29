import type { Metadata } from "next"

import { TrainerLmsPage as TrainerLmsModulePage } from "@/modules/trainers/components/TrainerLmsPage"

export const metadata: Metadata = {
  title: "LMS | Trainer Portal – Pinesphere ERP",
  description: "Manage your course content and learning materials.",
}

export default function TrainerLmsPage() {
  return <TrainerLmsModulePage />
}
