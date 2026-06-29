"use client"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { createTrainerAssignment } from "../services/trainerAssignmentService"
import type { TrainerAssignmentFormValues } from "../types"
import { TrainerAssignmentForm } from "./TrainerAssignmentForm"

export function TrainerAssignmentCreatePage() {
  const router = useRouter()

  async function handleSubmit(values: TrainerAssignmentFormValues) {
    const assignment = await createTrainerAssignment(values)
    router.push(`/trainer/assignments/${encodeURIComponent(assignment.id)}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <section>
        <Link href="/trainer/assignments" className="inline-flex items-center gap-2 text-sm font-black text-[#0B7A5A] transition hover:text-[#096747]">
          <ArrowLeft size={15} />
          <span>Back to Assignments</span>
        </Link>
        <h2 className="mt-3 text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
          Create Assignment
        </h2>
        <p className="mt-1.5 text-sm font-semibold text-[#475569]">
          Create an assignment for one of your active trainer-scoped batches.
        </p>
      </section>

      <TrainerAssignmentForm mode="create" submitLabel="Create Assignment" onSubmit={handleSubmit} />
    </div>
  )
}
