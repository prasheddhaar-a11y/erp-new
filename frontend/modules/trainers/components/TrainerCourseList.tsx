"use client"

import { useRouter } from "next/navigation"

import type { TrainerLmsCourse } from "../types"
import { TrainerCourseCard } from "./TrainerCourseCard"
import { TrainerLmsEmptyState } from "./TrainerLmsEmptyState"

export function TrainerCourseList({
  courses,
  selectedCourseId,
  onSelectCourse,
  connected,
}: {
  courses: TrainerLmsCourse[]
  onSelectCourse?: (courseId: string) => void
  selectedCourseId?: string | null
  connected: boolean
}) {
  const router = useRouter()

  if (courses.length === 0) {
    return (
      <TrainerLmsEmptyState
        message={
          connected
            ? "No trainer-owned courses are assigned yet."
            : "Trainer LMS courses API is not connected yet."
        }
      />
    )
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {courses.map((course) => (
        <TrainerCourseCard
          key={course.id}
          course={course}
          active={course.id === selectedCourseId}
          onSelect={() => {
            onSelectCourse?.(course.id)
            router.push(`/trainer/lms/${course.id}`)
          }}
        />
      ))}
    </section>
  )
}