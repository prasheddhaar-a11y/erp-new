"use client"

import { ExternalLink, FileText, FileUp, Loader2, UploadCloud, Video } from "lucide-react"
import { useRef, useState } from "react"

import { openAuthenticatedFile } from "@/lib/api"
import type { TrainerLessonMaterial, TrainerLmsCourse, TrainerMaterialUploadInput } from "../types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return ""
  }
}

function MaterialIcon({ contentType }: { contentType: string }) {
  const isVideo = contentType === "video"
  return isVideo ? (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF2FF] text-[#4F46E5]">
      <Video size={16} />
    </div>
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF7ED] text-[#C2410C]">
      <FileText size={16} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TrainerMaterialUploadPanel({
  course,
  lessonId = null,
  uploadApiConnected,
  materials = [],
  materialsLoading = false,
  uploadMaterial,
  uploadError,
  onUploaded,
}: {
  course: TrainerLmsCourse | null
  /** Optional: when provided, uploads are attached to this lesson. */
  lessonId?: string | null
  uploadApiConnected: boolean
  /** Defaults to [] — safe when parent has not yet passed the new prop. */
  materials?: TrainerLessonMaterial[]
  materialsLoading?: boolean
  /** Optional — if not provided the upload button is hidden. */
  uploadMaterial?: (input: TrainerMaterialUploadInput) => Promise<void>
  uploadError?: string | null
  /** Optional — kept for backward compatibility with any existing callers. */
  onUploaded?: () => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const canUpload = Boolean(course && uploadApiConnected && uploadMaterial)
  const isLessonScoped = Boolean(lessonId)
  const visibleMaterials = isLessonScoped
    ? materials.filter((material) => material.lesson_id === lessonId)
    : materials
  // Surface either the hook-level upload error or the local one
  const displayError = uploadError ?? localError

  async function handleUpload() {
    if (!course || !file || !canUpload || !uploadMaterial) return
    setUploading(true)
    setSuccessMessage(null)
    setLocalError(null)
    try {
      await uploadMaterial({ courseId: course.id, lessonId, file })
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      setSuccessMessage(`"${file.name}" uploaded successfully.`)
      await onUploaded?.()
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setSuccessMessage(null)
    setLocalError(null)
    setFile(event.target.files?.[0] ?? null)
  }

  return (
    <section className="rounded-lg border border-[#E3ECE8] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)]">

      {/* Header */}
      <div>
        <h3 className="text-lg font-black text-[#0F172A]">
          {isLessonScoped ? "Lesson Materials" : "Materials"}
        </h3>
        <p className="mt-1 text-sm font-semibold text-[#64748B]">
          {isLessonScoped
            ? "PDF and video attachments for this lesson."
            : "PDF and video attachments for this course."}
        </p>
      </div>

      {/* Upload zone */}
      <div className="mt-4 rounded-lg border border-dashed border-[#C8DDD7] bg-[#F8FAF8] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8F6F0] text-[#0B7A5A]">
            <UploadCloud size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-[#0F172A]">
              {isLessonScoped ? "Upload lesson material" : "Upload PDF or video"}
            </p>
            <p className="mt-1 text-xs font-bold text-[#64748B]">
              {isLessonScoped
                ? "Attach a PDF, MP4, WebM, or MOV file to this lesson."
                : "Attach a PDF, MP4, WebM, or MOV file to this course."}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,video/mp4,video/webm,video/quicktime"
                disabled={!canUpload || uploading}
                onChange={handleFileChange}
                className="max-w-full text-xs font-bold text-[#475569] file:mr-3 file:rounded-lg file:border-0 file:bg-[#E8F6F0] file:px-3 file:py-2 file:text-xs file:font-black file:text-[#0B7A5A] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="button"
                disabled={!canUpload || !file || uploading}
                onClick={handleUpload}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#0B7A5A] px-3 text-xs font-black text-white transition hover:bg-[#09684D] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <FileUp size={14} />
                )}
                <span>{uploading ? "Uploading..." : "Upload"}</span>
              </button>
            </div>

            {/* Success message */}
            {successMessage ? (
              <p className="mt-2 text-xs font-bold text-[#0B7A5A]">{successMessage}</p>
            ) : null}

            {/* Error message */}
            {displayError ? (
              <p className="mt-2 text-xs font-bold text-[#DC2626]">{displayError}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Material list */}
      <div className="mt-4">
        {materialsLoading ? (
          <div className="flex items-center gap-2 py-3 text-xs font-bold text-[#64748B]">
            <Loader2 size={14} className="animate-spin" />
            <span>Loading materials…</span>
          </div>
        ) : visibleMaterials.length === 0 ? (
          <p className="py-3 text-xs font-bold text-[#94A3B8]">
            {isLessonScoped
              ? "No materials uploaded for this lesson yet."
              : "No materials uploaded for this course yet."}
          </p>
        ) : (
          <ul className="divide-y divide-[#F1F5F9]">
            {visibleMaterials.map((material) => {
              const sizeLabel = formatBytes(material.file_size)
              const dateLabel = formatDate(material.created_at)
              return (
                <li
                  key={material.id}
                  className="flex items-center gap-3 py-3"
                >
                  <MaterialIcon contentType={material.content_type} />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-[#0F172A]">
                      {material.filename}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-[#64748B]">
                      {[
                        material.content_type.toUpperCase(),
                        sizeLabel,
                        dateLabel,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openAuthenticatedFile(material.file_url, material.filename)}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-[#E3ECE8] bg-white px-3 text-xs font-black text-[#0B7A5A] transition hover:bg-[#F0FAF6]"
                  >
                    <ExternalLink size={12} />
                    <span>Open</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
