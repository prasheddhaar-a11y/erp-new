import type { Metadata } from "next"
import { TrainerStudentProfilePage } from "@/modules/trainers/components/TrainerStudentProfilePage"

export const metadata: Metadata = {
  title: "Student Profile | Trainer Portal - Pinesphere ERP",
  description: "Read-only profile for an assigned trainer student.",
}

export default function TrainerStudentProfileRoute() {
  return <TrainerStudentProfilePage />
}
