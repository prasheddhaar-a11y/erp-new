/* =====================================================
PINESPHERE ERP
Module      : Student Module
Component   : Data
Purpose     : Provides Data frontend logic and shared types
Author      : Pinesphere Development Team
Last Updated: Auto Generated
===================================================== */

import { apiRequest, getStoredSessionValue } from "@/lib/api"

/* =====================================================
   SECTION: TYPES AND INTERFACES
   PURPOSE:
   This section describes the shape of data used by the code.
   Clear types make component props, API payloads, and state easier to understand.
===================================================== */

export type StudentCourse = {
  id: string
  title: string
  track: string | null
  trainer: string | null
  trainerInitials: string | null
  progress: number
  remainingLessons: number
  totalLessons: number
  nextClass: string | null
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  accent: string
}

export type StudentAssignment = {
  id: string
  title: string
  course: string
  due: string
  priority: "High" | "Medium" | "Low"
}

export type StudentCertificate = {
  id: string
  name: string
  issueDate: string
}

export type PlacementReadiness = {
  resumeScore: number
  interviewReadiness: number
  projectsCompleted: number
  projectsRequired: number
  eligible: boolean
}

export type StudentDashboardData = {
  profileCompletion: number
  learningStreak: number
  enrolledCourseCount: number
  assignmentsCompleted: number
  enrolledCourses: StudentCourse[]
  assignmentsDue: StudentAssignment[]
  certificates: StudentCertificate[]
  placementReadiness: PlacementReadiness
  glance: {
    attendance: number
    pendingTasks: number
    certificatesEarned: number
  }
}

export type StudentMaterial = {
  id: string
  lesson_id: string | null
  filename: string
  file_url: string
  file_size: number | null
  content_type: string
  download_count: number
  created_at: string
}

export type StudentLesson = {
  id: string
  course_id: string
  title: string
  summary: string | null
  content: string | null
  video_url: string | null
  pdf_url: string | null
  assignment_url: string | null
  content_type: string
  due_at: string | null
  max_marks: number
  sort_order: number
  is_preview: boolean
  is_completed: boolean
  completed_at: string | null
  created_at: string
  materials: StudentMaterial[]
}

export type StudentCourseDetail = {
  id: string
  title: string
  description: string
  thumbnail_url: string | null
  trainer_id: string | null
  duration: string | null
  difficulty_level: string
  status: string
  created_at: string
  lessons: StudentLesson[]
}


export const studentDashboardApiEndpoints = {
  dashboard: "/api/student/dashboard",
  profile: "/profile/me",
  enrolledCourses: "/student/courses",
  assignments: "/student/assignments",
  certificates: "/student/certificates",
  placementReadiness: "/student/placement-readiness",
  courseDetail: (courseId: string) => `/lms/student/courses/${courseId}`,
  lessonProgress: (lessonId: string) => `/lms/lessons/${lessonId}/progress`,
}

export const mockStudentDashboardData: StudentDashboardData = {
  profileCompletion: 78,
  learningStreak: 7,
  enrolledCourseCount: 8,
  assignmentsCompleted: 12,
  enrolledCourses: [
    {
      id: "ai-foundation",
      title: "AI Foundation Program",
      track: "Tech Pack",
      trainer: "Nisha Raman",
      trainerInitials: "NR",
      progress: 68,
      remainingLessons: 9,
      totalLessons: 28,
      nextClass: "Tomorrow, 6:00 PM",
      difficulty: "Beginner",
      accent: "var(--pinesphere-green)",
    },
    {
      id: "prompt-engineering",
      title: "Prompt Engineering Lab",
      track: "Business Pack",
      trainer: "Arun Mathew",
      trainerInitials: "AM",
      progress: 52,
      remainingLessons: 16,
      totalLessons: 33,
      nextClass: "07 Jun, 7:30 PM",
      difficulty: "Intermediate",
      accent: "#7C3AED",
    },
    {
      id: "python-ml",
      title: "Machine Learning Basics",
      track: "Tech Pack",
      trainer: "Meera Joseph",
      trainerInitials: "MJ",
      progress: 34,
      remainingLessons: 24,
      totalLessons: 36,
      nextClass: "09 Jun, 5:00 PM",
      difficulty: "Advanced",
      accent: "#F97316",
    },
  ],
  assignmentsDue: [
    { id: "as-1", title: "AI Foundation Worksheet", course: "AI Foundation Program", due: "Today, 11:59 PM", priority: "High" },
    { id: "as-2", title: "Prompt Engineering Project", course: "Prompt Engineering Lab", due: "07 Jun, 11:59 PM", priority: "Medium" },
    { id: "as-3", title: "ML Basics Lab Report", course: "Machine Learning Basics", due: "10 Jun, 11:59 PM", priority: "Low" },
  ],
  certificates: [
    { id: "cert-1", name: "AI Foundation Completion", issueDate: "20 May 2026" },
    { id: "cert-2", name: "Prompt Engineering Explorer", issueDate: "29 May 2026" },
  ],
  placementReadiness: {
    resumeScore: 85,
    interviewReadiness: 72,
    projectsCompleted: 4,
    projectsRequired: 5,
    eligible: true,
  },
  glance: {
    attendance: 86,
    pendingTasks: 3,
    certificatesEarned: 2,
  },
}

/* =====================================================
   SECTION: HELPER FUNCTIONS
   PURPOSE:
   This section contains small reusable utilities used by the file.
   Helpers keep repeated logic in one clear place.
===================================================== */

export async function loadStudentDashboardData(): Promise<StudentDashboardData> {
  const accessToken = getStoredSessionValue("pinesphere_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  try {
    const data = await apiRequest<StudentDashboardData>(
      studentDashboardApiEndpoints.dashboard,
      accessToken,
    )
    return data
  } catch (error) {
    console.error("Student dashboard API failed:", error)
    throw error
  }
}

export async function loadStudentCourseDetail(courseId: string): Promise<StudentCourseDetail> {
  const accessToken = getStoredSessionValue("pinesphere_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  try {
    const data = await apiRequest<StudentCourseDetail>(
      studentDashboardApiEndpoints.courseDetail(courseId),
      accessToken,
    )
    return data
  } catch (error) {
    console.error("Failed to load course detail:", error)
    throw error
  }
}

export async function updateStudentLessonProgress(
  lessonId: string,
  isCompleted = true,
): Promise<{ progress_percent: number }> {
  const accessToken = getStoredSessionValue("pinesphere_access_token")

  if (!accessToken) {
    throw new Error("Not authenticated")
  }

  return apiRequest<{ progress_percent: number }>(
    studentDashboardApiEndpoints.lessonProgress(lessonId),
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ is_completed: isCompleted }),
    },
  )
}
