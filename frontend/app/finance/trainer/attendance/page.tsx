import type { Metadata } from "next"
import { TrainerAttendancePage } from "@/modules/trainers/components/TrainerAttendancePage"

export const metadata: Metadata = {
  title: "Attendance | Trainer Portal – Pinesphere ERP",
  description: "Mark and review attendance for your assigned batches.",
}

export default function TrainerAttendanceRoute() {
  return <TrainerAttendancePage />
}