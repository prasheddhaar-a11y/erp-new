import type { Metadata } from "next"

import { TrainerLmsCourseDetailPage } from "@/modules/trainers/components/TrainerLmsCourseDetailPage"

export const metadata: Metadata = {
  title: "Course Detail | LMS | Trainer Portal – Pinesphere ERP",
  description: "View and manage lessons and materials for this trainer-owned course.",
}

export default async function TrainerLmsCourseDetailRoute({
  params,
}: {
  params: Promise<{ courseId: string }>
}) {
  const { courseId } = await params
  return <TrainerLmsCourseDetailPage courseId={courseId} />
}