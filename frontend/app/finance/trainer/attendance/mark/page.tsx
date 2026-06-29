import type { Metadata } from "next"
import { TrainerAttendanceMarkPage } from "@/modules/trainers/components/TrainerAttendanceMarkPage"

export const metadata: Metadata = {
  title: "Mark Attendance | Trainer Portal – Pinesphere ERP",
  description: "Mark student attendance for your assigned training sessions.",
}

export default function TrainerAttendanceMarkRoute() {
  return <TrainerAttendanceMarkPage />
}