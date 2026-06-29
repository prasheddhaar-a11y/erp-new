import type { BranchScope } from "@/lib/api/branchAdminData"
import { getAttendanceOverview } from "@/lib/api/branchAdmin"

export type AttendanceTrendPoint = {
  day: string
  rate: number
}

export type BatchAttendance = {
  branch_id: string | null
  batch: string
  course: string
  attendance_rate: number
  students: number
}

export type TrainerCompliance = {
  branch_id: string | null
  trainer: string
  classes_assigned: number
  attendance_submitted: number
  status: "Compliant" | "Pending" | "At Risk"
}

export type AttendanceAlert = {
  title: string
  detail: string
  severity: "Critical" | "Warning" | "Info"
}

export type RiskStudent = {
  branch_id: string | null
  student: string
  course: string
  batch: string
  attendance_rate: number
  last_present: string
  risk_level: "High" | "Medium" | "Low"
}

export type HeatmapCell = {
  day: string
  slot: string
  rate: number
}

export type ActivityItem = {
  title: string
  detail: string
  time: string
}

export type BranchAttendanceDashboard = {
  branch_id: string | null
  kpis: {
    today_attendance_rate: number
    present_students: number
    absent_students: number
    late_checkins: number
    attendance_compliance: number
  }
  trend: AttendanceTrendPoint[]
  batches: BatchAttendance[]
  trainers: TrainerCompliance[]
  alerts: AttendanceAlert[]
  risk_students: RiskStudent[]
  heatmap: HeatmapCell[]
  activity: ActivityItem[]
}

export const mockBranchAttendance: BranchAttendanceDashboard = {
  branch_id: null,
  kpis: {
    today_attendance_rate: 0,
    present_students: 0,
    absent_students: 0,
    late_checkins: 0,
    attendance_compliance: 0,
  },
  trend: [],
  batches: [],
  trainers: [],
  alerts: [
    {
      title: "Low attendance in Full Stack batch",
      detail: "ba-seed-batch-01 has students close to the 75% threshold. Review today's absentees.",
      severity: "Warning",
    },
    {
      title: "Repeated absence follow-up",
      detail: "Three students missed consecutive sessions this week and need branch follow-up.",
      severity: "Critical",
    },
    {
      title: "Evening session pending",
      detail: "One trainer attendance submission needs confirmation before daily close.",
      severity: "Info",
    },
  ],
  risk_students: [
    {
      branch_id: null,
      student: "Aarav Menon",
      course: "Full Stack Web Development",
      batch: "ba-seed-batch-01",
      attendance_rate: 68,
      last_present: "2026-06-19",
      risk_level: "High",
    },
    {
      branch_id: null,
      student: "Nandini R",
      course: "Data Science",
      batch: "ba-seed-batch-06",
      attendance_rate: 72,
      last_present: "2026-06-20",
      risk_level: "Medium",
    },
    {
      branch_id: null,
      student: "Imran Ali",
      course: "UI/UX Design",
      batch: "ba-seed-batch-11",
      attendance_rate: 74,
      last_present: "2026-06-21",
      risk_level: "Medium",
    },
  ],
  heatmap: [
    { day: "Mon", slot: "Morning", rate: 92 },
    { day: "Mon", slot: "Afternoon", rate: 86 },
    { day: "Mon", slot: "Evening", rate: 78 },
    { day: "Tue", slot: "Morning", rate: 89 },
    { day: "Tue", slot: "Afternoon", rate: 84 },
    { day: "Tue", slot: "Evening", rate: 76 },
    { day: "Wed", slot: "Morning", rate: 94 },
    { day: "Wed", slot: "Afternoon", rate: 88 },
    { day: "Wed", slot: "Evening", rate: 81 },
  ],
  activity: [
    {
      title: "Attendance marked",
      detail: "Trainer Karthik submitted Full Stack Web Development attendance.",
      time: "Today 10:15 AM",
    },
    {
      title: "Risk student flagged",
      detail: "Aarav Menon dropped below the required attendance threshold.",
      time: "Today 09:40 AM",
    },
    {
      title: "Batch report updated",
      detail: "ba-seed-batch-06 attendance summary refreshed.",
      time: "Yesterday",
    },
  ],
}

export function getMockBranchAttendance(_scope: BranchScope) {
  return mockBranchAttendance
}

export async function fetchBranchAttendance() {
  return getAttendanceOverview()
}
