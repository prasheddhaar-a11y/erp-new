"use client"

import { ArrowLeft, CalendarClock, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { useTrainerAssignmentDetails } from "../hooks/useTrainerAssignmentDetails"
import { updateTrainerAssignment } from "../services/trainerAssignmentService"
import type { TrainerAssignmentFormValues } from "../types"
import { TrainerAssignmentForm } from "./TrainerAssignmentForm"
import { TrainerAssignmentGithubPanel } from "./TrainerAssignmentGithubPanel"
import { TrainerAssignmentOverviewCard } from "./TrainerAssignmentOverviewCard"
import { TrainerAssignmentSubmissionTable } from "./TrainerAssignmentSubmissionTable"

function dateLabel(value: string | null) {
  if (!value) return "No due date"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function statusClass(status: string) {
  return status.toLowerCase() === "published"
    ? "border-[#CFE8DF] bg-[#E8F6F0] text-[#0B7A5A]"
    : "border-[#E3ECE8] bg-[#F8FAF8] text-[#64748B]"
}

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-24 rounded-lg bg-gray-200" />
      <div className="h-72 rounded-lg bg-gray-200" />
      <div className="h-64 rounded-lg bg-gray-200" />
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <h3 className="text-lg font-black text-[#991B1B]">Failed to load assignment</h3>
        <p className="text-sm font-semibold text-[#B91C1C]">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white transition hover:bg-[#DC2626]"
        >
          <RefreshCw size={14} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  )
}

export function TrainerAssignmentDetailsPage({ assignmentId }: { assignmentId: string }) {
  const { assignment, submissions, loading, error, refresh } =
    useTrainerAssignmentDetails(assignmentId)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  if (loading) return <PageSkeleton />
  if (error) return <ErrorBanner message={error} onRetry={refresh} />

  if (!assignment) {
    return (
      <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-[#D0DFDA] bg-white p-6 text-center">
        <div>
          <h2 className="text-lg font-black text-[#0F172A]">Assignment not found</h2>
          <p className="mt-1 text-sm font-semibold text-[#64748B]">
            This assignment is not available in your trainer scope.
          </p>
          <Link
            href="/trainer/assignments"
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
          >
            <ArrowLeft size={14} />
            <span>Back to Assignments</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/trainer/assignments"
            className="inline-flex items-center gap-2 text-sm font-black text-[#0B7A5A] transition hover:text-[#096747]"
          >
            <ArrowLeft size={15} />
            <span>Back to Assignments</span>
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h2 className="min-w-0 text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
              {assignment.title}
            </h2>
            <span className={`rounded border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${statusClass(assignment.status)}`}>
              {assignment.status}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={14} />
              {dateLabel(assignment.due_date)}
            </span>
            <span>{assignment.course ?? "Course not connected"}</span>
            <span>{assignment.batch ?? "Batch not connected"}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
        >
          <RefreshCw size={14} />
          <span>Refresh</span>
        </button>
      </section>

      <TrainerAssignmentOverviewCard assignment={assignment} />

      {saveNotice ? (
        <div className="rounded-lg border border-[#CFE8DF] bg-[#E8F6F0] px-4 py-3 text-sm font-semibold text-[#0B7A5A]">
          {saveNotice}
        </div>
      ) : null}

      <TrainerAssignmentForm
        assignment={assignment}
        mode="edit"
        submitLabel="Save Assignment"
        onSubmit={async (values: TrainerAssignmentFormValues) => {
          await updateTrainerAssignment(assignment.id, values)
          setSaveNotice("Assignment updated.")
          await refresh()
        }}
      />

      <TrainerAssignmentSubmissionTable submissions={submissions} />
      <TrainerAssignmentGithubPanel />
    </div>
  )
}