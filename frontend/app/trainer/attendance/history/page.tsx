import type { Metadata } from "next"
import { TrainerAttendanceHistoryPage } from "@/modules/trainers/components/TrainerAttendanceHistoryPage"

export const metadata: Metadata = {
  title: "Attendance History | Trainer Portal – Pinesphere ERP",
  description: "Review historical attendance records for your assigned batches.",
}

export default function TrainerAttendanceHistoryRoute() {
  return <TrainerAttendanceHistoryPage />
}