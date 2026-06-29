"use client"

import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { useTrainerBatchDetails } from "../hooks/useTrainerBatchDetails"
import { BatchOverviewCard } from "./BatchOverviewCard"
import { BatchStudentsPreview } from "./BatchStudentsPreview"
import { BatchAttendanceSummary } from "./BatchAttendanceSummary"
import { BatchLmsProgress } from "./BatchLmsProgress"
import { BatchAssignmentsPreview } from "./BatchAssignmentsPreview"
import { BatchSchedulePreview } from "./BatchSchedulePreview"

function DetailsPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-72 rounded bg-gray-200" />
        </div>
      </div>

      {/* Main card skeleton */}
      <div className="h-56 rounded-lg bg-gray-200" />

      {/* 3 column grid skeleton */}
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-44 rounded-lg bg-gray-200" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="h-64 rounded-lg bg-gray-200" />
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const isForbidden = message.includes("403") || message.toLowerCase().includes("restricted") || message.toLowerCase().includes("permission")
  const title = isForbidden ? "Access Denied" : "Failed to load batch details"
  const detail = isForbidden
    ? "You do not have permission to view this batch or it is not assigned to you."
    : message

  return (
    <div className="grid min-h-[400px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-lg font-black text-[#991B1B]">{title}</h3>
        <p className="text-sm font-semibold text-[#B91C1C]">{detail}</p>
        
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/trainer/batches"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-5 text-sm font-black text-[#475569] transition hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            <span>Back to Batches</span>
          </Link>
          {!isForbidden && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#DC2626]"
            >
              <RefreshCw size={14} />
              <span>Try Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function TrainerBatchDetailsPage() {
  const params = useParams()
  const batchId = params?.id as string

  const { data, loading, error, refresh } = useTrainerBatchDetails(batchId)

  if (loading) {
    return <DetailsPageSkeleton />
  }

  if (error || !data) {
    return <ErrorBanner message={error || "Could not resolve batch payload."} onRetry={refresh} />
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/trainer/batches"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D0DFDA] bg-white text-[#475569] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] hover:text-[#0B7A5A] outline-none"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
              Batch Details
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#475569]">
              Read-only view of course enrollments, schedules, and metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] outline-none"
        >
          <RefreshCw size={14} className="shrink-0" />
          <span>Refresh Details</span>
        </button>
      </section>

      {/* 1. Overview parameters */}
      <section>
        <BatchOverviewCard data={data} />
      </section>

      {/* 2. Grid section of preview summaries */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Attendance Summary */}
        <div className="md:col-span-1">
          <BatchAttendanceSummary data={data} />
        </div>

        {/* LMS Progress */}
        <div className="md:col-span-1">
          <BatchLmsProgress data={data} />
        </div>

        {/* Assignments Preview */}
        <div className="md:col-span-1">
          <BatchAssignmentsPreview data={data} />
        </div>

        {/* Schedule Slots */}
        <div className="md:col-span-1">
          <BatchSchedulePreview data={data} />
        </div>
      </section>

      {/* 3. Full roster table */}
      <section>
        <BatchStudentsPreview data={data} />
      </section>
    </div>
  )
}