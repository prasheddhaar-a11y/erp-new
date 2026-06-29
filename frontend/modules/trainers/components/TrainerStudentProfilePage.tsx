"use client"

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

import { useTrainerStudentDetails } from "../hooks/useTrainerStudentDetails"
import { TrainerStudentAIInsights } from "./TrainerStudentAIInsights"
import { TrainerStudentAttendanceSummary } from "./TrainerStudentAttendanceSummary"
import { TrainerStudentLmsProgress } from "./TrainerStudentLmsProgress"
import { TrainerStudentOverviewCard } from "./TrainerStudentOverviewCard"
import { TrainerStudentProjectsTracker } from "./TrainerStudentProjectsTracker"
import { TrainerStudentRiskAlerts } from "./TrainerStudentRiskAlerts"
import { TrainerStudentSkillProgress } from "./TrainerStudentSkillProgress"

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-gray-200" />
        <div className="space-y-2">
          <div className="h-8 w-64 rounded bg-gray-200" />
          <div className="h-4 w-80 rounded bg-gray-200" />
        </div>
      </div>
      <div className="h-56 rounded-xl bg-gray-200" />
      <div className="grid gap-5 lg:grid-cols-2">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="h-52 rounded-lg bg-gray-200" />
        ))}
      </div>
    </div>
  )
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const lower = message.toLowerCase()
  const restricted =
    message.includes("403") ||
    lower.includes("not assigned") ||
    lower.includes("permission")

  return (
    <div className="grid min-h-[420px] place-items-center rounded-xl border border-dashed border-[#FCA5A5] bg-[#FEF2F2] p-6 text-center">
      <div className="max-w-md space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FEE2E2] text-[#EF4444]">
          <AlertCircle size={28} />
        </div>
        <h3 className="text-lg font-black text-[#991B1B]">
          {restricted ? "Student profile restricted" : "Failed to load student profile"}
        </h3>
        <p className="text-sm font-semibold text-[#B91C1C]">
          {restricted
            ? "This student is not assigned to your courses or batches."
            : message}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/trainer/students"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-5 text-sm font-black text-[#475569] transition hover:bg-gray-50"
          >
            <ArrowLeft size={14} />
            <span>Back to Students</span>
          </Link>
          {!restricted ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-5 text-sm font-black text-white transition hover:bg-[#DC2626]"
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function TrainerStudentProfilePage() {
  const params = useParams()
  const studentId = params?.id as string
  const { data, loading, error, refresh } = useTrainerStudentDetails(studentId)

  if (loading) return <PageSkeleton />
  if (error || !data) {
    return <ErrorBanner message={error || "Could not resolve student profile."} onRetry={refresh} />
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/trainer/students"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D0DFDA] bg-white text-[#475569] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] hover:text-[#0B7A5A]"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-[#0B7A5A]">
              Back to Students
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-normal text-[#020617] sm:text-3xl">
              {data.full_name}
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#475569]">
              {data.display_code || "-"} - {data.batch.name || "-"} - {data.course.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded border border-[#CFE8DF] bg-[#E8F6F0] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#0B7A5A]">
            Read Only
          </span>
          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-4 text-sm font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </section>

      <TrainerStudentOverviewCard data={data} />

      <section className="grid gap-5 lg:grid-cols-2">
        <TrainerStudentSkillProgress data={data} />
        <TrainerStudentProjectsTracker data={data} />
        <TrainerStudentAttendanceSummary data={data} />
        <TrainerStudentLmsProgress data={data} />
        <TrainerStudentAIInsights data={data} />
        <TrainerStudentRiskAlerts data={data} />
      </section>
    </div>
  )
}