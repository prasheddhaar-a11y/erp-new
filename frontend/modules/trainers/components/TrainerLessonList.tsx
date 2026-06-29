"use client"

import { FileText, Pencil, Plus, Trash2, Video } from "lucide-react"
import { useState } from "react"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type {
  TrainerLessonMaterial,
  TrainerLmsCourse,
  TrainerLmsLesson,
  TrainerLmsLessonCreate,
  TrainerLmsLessonUpdate,
  TrainerMaterialUploadInput,
} from "../types"
import { TrainerLessonForm } from "./TrainerLessonForm"
import { TrainerMaterialUploadPanel } from "./TrainerMaterialUploadPanel"

function contentLabel(type: string) {
  if (type === "assignment") return "Assignment"
  if (type === "quiz_prep") return "Quiz prep"
  if (type === "project") return "Project"
  return "Lesson"
}

export function TrainerLessonList({
  course,
  lessons,
  loading,
  connected,
  materials = [],
  materialsLoading = false,
  uploadApiConnected = false,
  uploadMaterial,
  uploadError,
  createLesson,
  onEditLesson,
  onDeleteLesson,
}: {
  course: TrainerLmsCourse | null
  lessons: TrainerLmsLesson[]
  loading: boolean
  connected: boolean
  materials?: TrainerLessonMaterial[]
  materialsLoading?: boolean
  uploadApiConnected?: boolean
  uploadMaterial?: (input: TrainerMaterialUploadInput) => Promise<void>
  uploadError?: string | null
  createLesson?: (payload: TrainerLmsLessonCreate) => Promise<void>
  onEditLesson: (courseId: string, lessonId: string, payload: TrainerLmsLessonUpdate) => Promise<void>
  onDeleteLesson: (courseId: string, lessonId: string) => Promise<void>
}) {
  const [creatingLesson, setCreatingLesson] = useState(false)
  const [editingLesson, setEditingLesson] = useState<TrainerLmsLesson | null>(null)
  const [expandedMaterialsLessonId, setExpandedMaterialsLessonId] = useState<string | null>(null)
  /** The lesson currently staged for deletion (dialog open). */
  const [pendingDelete, setPendingDelete] = useState<TrainerLmsLesson | null>(null)
  /** The lesson id whose delete request is in-flight. */
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleConfirmDelete() {
    if (!course || !pendingDelete) return

    setDeletingId(pendingDelete.id)
    try {
      await onDeleteLesson(course.id, pendingDelete.id)
      // Close dialog only after successful deletion.
      setPendingDelete(null)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleCreate(payload: TrainerLmsLessonCreate) {
    if (!createLesson) throw new Error("Lesson creation is not available.")
    await createLesson(payload)
  }

  async function handleSave(lessonId: string, payload: TrainerLmsLessonUpdate) {
    if (!course) return
    await onEditLesson(course.id, lessonId, payload)
  }

  const canMutate = connected && course !== null
  const isDeleting = deletingId !== null

  return (
    <>
      <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-[#0F172A]">Lessons</h3>
            <p className="mt-1 text-sm font-semibold text-[#64748B]">
              {course ? course.title : "Select a course to view lessons."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {canMutate && (
              <button
                type="button"
                onClick={() => setCreatingLesson(true)}
                disabled={isDeleting}
                className="inline-flex h-8 items-center justify-center gap-2 rounded-lg bg-[#0B7A5A] px-3 text-xs font-black text-white shadow-sm transition hover:bg-[#09684D] disabled:opacity-60"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span>New Lesson</span>
              </button>
            )}
            <span className="rounded-full border border-[#CFE8DF] bg-[#E8F6F0] px-3 py-1 text-xs font-black text-[#0B7A5A]">
              {canMutate ? "Editable" : "Read-only"}
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-20 animate-pulse rounded-lg bg-[#F1F5F9]" />
              ))}
            </div>
          ) : lessons.length > 0 ? (
            lessons.map((lesson) => {
              const lessonMaterials = materials.filter((material) => material.lesson_id === lesson.id)
              const hasUploadedVideo = lessonMaterials.some((material) => material.content_type === "video")
              const hasUploadedDocument = lessonMaterials.some((material) => material.content_type === "pdf")
              const videoCount = lessonMaterials.filter((material) => material.content_type === "video").length
              const pdfCount = lessonMaterials.filter((material) => material.content_type === "pdf").length
              const isMaterialsExpanded = expandedMaterialsLessonId === lesson.id

              return (
                <div key={lesson.id} className="rounded-lg border border-[#E3ECE8] bg-[#F8FAF8] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-[#0F172A]">{lesson.title}</p>
                      <p className="mt-1 text-xs font-bold text-[#64748B]">
                        {contentLabel(lesson.content_type)}
                        {lesson.due_at
                          ? ` | Due ${new Date(lesson.due_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUploadedVideo || (!hasUploadedDocument && lesson.video_url) ? (
                        <Video size={16} className="text-[#0B7A5A]" />
                      ) : null}
                      {hasUploadedDocument || (!hasUploadedVideo && lesson.pdf_url) ? (
                        <FileText size={16} className="text-[#2563EB]" />
                      ) : null}
                      {lessonMaterials.length > 0 ? (
                        <span className="rounded-full border border-[#D7E4FF] bg-[#EAF1FF] px-2 py-0.5 text-[10px] font-black text-[#2563EB]">
                          {lessonMaterials.length} uploaded
                        </span>
                      ) : null}

                      {canMutate && (
                        <button
                          type="button"
                          onClick={() => setEditingLesson(lesson)}
                          disabled={isDeleting}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D0DFDA] bg-white text-[#475569] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0] hover:text-[#0B7A5A] disabled:opacity-40"
                          aria-label={`Edit ${lesson.title}`}
                        >
                          <Pencil size={13} />
                        </button>
                      )}

                      {canMutate && (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(lesson)}
                          disabled={isDeleting}
                          className="flex h-7 w-7 items-center justify-center rounded-md border border-[#FECACA] bg-white text-[#EF4444] transition hover:border-[#EF4444] hover:bg-[#FEF2F2] disabled:opacity-40"
                          aria-label={`Delete ${lesson.title}`}
                        >
                          {deletingId === lesson.id ? (
                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#EF4444]/30 border-t-[#EF4444]" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2 text-sm font-semibold text-[#64748B]">
                    {lesson.summary ?? "Lesson summary not connected yet."}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#E3ECE8] pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#D7E4FF] bg-white px-2.5 py-1 text-[11px] font-black text-[#2563EB]">
                        {lessonMaterials.length} {lessonMaterials.length === 1 ? "material" : "materials"}
                      </span>
                      {pdfCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-bold text-[#2563EB]">
                          <FileText size={11} />
                          {pdfCount} PDF
                        </span>
                      ) : null}
                      {videoCount > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#CFE8DF] bg-[#E8F6F0] px-2.5 py-1 text-[11px] font-bold text-[#0B7A5A]">
                          <Video size={11} />
                          {videoCount} Video
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMaterialsLessonId((current) =>
                          current === lesson.id ? null : lesson.id
                        )
                      }
                      className="inline-flex h-8 items-center justify-center gap-2 rounded-lg border border-[#D0DFDA] bg-white px-3 text-xs font-black text-[#0B7A5A] transition hover:border-[#0B7A5A] hover:bg-[#E8F6F0]"
                    >
                      <FileText size={13} />
                      <span>{lessonMaterials.length > 0 ? "Manage Materials" : "Upload Materials"}</span>
                    </button>
                  </div>

                  {isMaterialsExpanded ? (
                    <div className="mt-4">
                      <TrainerMaterialUploadPanel
                        course={course}
                        lessonId={lesson.id}
                        uploadApiConnected={uploadApiConnected}
                        materials={lessonMaterials}
                        materialsLoading={materialsLoading}
                        uploadMaterial={uploadMaterial}
                        uploadError={uploadError}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border border-dashed border-[#C8DDD7] bg-[#F8FAF8] p-6 text-center">
              <p className="text-sm font-black text-[#0F172A]">No lessons found</p>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">
                {connected
                  ? "No lessons are connected to this trainer-owned course yet."
                  : "Lessons will appear after Trainer LMS lessons API is connected."}
              </p>
            </div>
          )}
        </div>
      </section>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null)
        }}
      >
        <AlertDialogContent className="w-[92vw] max-w-[430px] overflow-hidden rounded-[22px] border border-[#E3ECE8] bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="px-7 pb-6 pt-7">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF2F2] ring-4 ring-[#FEE2E2]">
              <Trash2 size={18} className="text-[#EF4444]" strokeWidth={2.5} />
            </div>

            <AlertDialogHeader className="space-y-0 text-left">
              <AlertDialogTitle className="text-base font-black text-[#0F172A]">
                Delete lesson?
              </AlertDialogTitle>

              <AlertDialogDescription asChild>
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-[#E3ECE8] bg-[#F8FAFC] px-4 py-3">
                    <p className="truncate text-sm font-black text-[#0F172A]">
                      {pendingDelete?.title}
                    </p>
                  </div>

                  <p className="text-sm font-medium leading-relaxed text-[#64748B]">
                    This lesson will be permanently removed from the course.
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#EF4444]" />
                    <p className="text-sm font-bold text-[#EF4444]">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <div className="flex w-full items-center justify-end gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-7 py-5">
            <AlertDialogCancel
              disabled={isDeleting}
              className="m-0 h-11 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-bold text-[#475569] shadow-sm hover:bg-[#F1F5F9]"
            >
              Cancel
            </AlertDialogCancel>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#DC2626] disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={15} strokeWidth={2.5} />
                  Delete lesson
                </>
              )}
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {creatingLesson && (
        <TrainerLessonForm
          onCreate={handleCreate}
          onClose={() => setCreatingLesson(false)}
        />
      )}

      {editingLesson && (
        <TrainerLessonForm
          lesson={editingLesson}
          onSave={handleSave}
          onClose={() => setEditingLesson(null)}
        />
      )}
    </>
  )
}
