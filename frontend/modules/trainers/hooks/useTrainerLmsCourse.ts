"use client"

import { useCallback, useEffect, useState } from "react"

import {
  createTrainerLesson,
  deleteTrainerLesson,
  getCourseMaterials,
  getTrainerCourseDetail,
  getTrainerCourseLessons,
  updateTrainerCourseStatus,
  updateTrainerLesson,
  uploadTrainerMaterial,
} from "../services/trainerLmsService"
import type {
  TrainerLessonMaterial,
  TrainerLmsCourse,
  TrainerLmsCourseUpdate,
  TrainerLmsLesson,
  TrainerLmsLessonCreate,
  TrainerLmsLessonUpdate,
  TrainerMaterialUploadInput,
} from "../types"

export interface UseTrainerLmsCourseResult {
  /** The resolved course for this courseId, or null while loading / not found. */
  course: TrainerLmsCourse | null
  lessons: TrainerLmsLesson[]
  /** Uploaded materials for this course. */
  materials: TrainerLessonMaterial[]
  /** True during the initial course + lesson + material fetch. */
  loading: boolean
  /** True only while the lesson list is being re-fetched after a mutation. */
  lessonsLoading: boolean
  /** True while the material list is being fetched or re-fetched. */
  materialsLoading: boolean
  /** True while the publish/unpublish PATCH is in-flight. */
  statusUpdating: boolean
  /** Page-level fetch error (course not found, network, auth). */
  error: string | null
  /** Mutation-level error (edit / delete / status update failed). Does not replace the page. */
  mutationError: string | null
  /** Isolated upload error — does not collide with mutationError. */
  uploadError: string | null
  /** Whether the LMS API is connected (gates edit / delete actions). */
  connected: boolean
  /** Whether the upload API is connected (passed to TrainerMaterialUploadPanel). */
  uploadApiConnected: boolean
  /** Refetch course, lessons, and materials from scratch. */
  refresh: () => Promise<void>
  createLesson: (payload: TrainerLmsLessonCreate) => Promise<void>
  editLesson: (courseId: string, lessonId: string, payload: TrainerLmsLessonUpdate) => Promise<void>
  deleteLesson: (courseId: string, lessonId: string) => Promise<void>
  /** PATCH course status to "draft" or "published". Re-throws on failure. */
  updateCourseStatus: (payload: TrainerLmsCourseUpdate) => Promise<void>
  /**
   * Upload a material file for this course.
   * On success the material list is refreshed automatically.
   * Re-throws on failure so TrainerMaterialUploadPanel can show inline error.
   */
  uploadMaterial: (input: TrainerMaterialUploadInput) => Promise<void>
}

/**
 * Drives TrainerLmsCourseDetailPage.
 *
 * Fetches course detail, lessons, and materials for the given courseId.
 * Exposes the same editLesson / deleteLesson signatures as useTrainerLms
 * so TrainerLessonList can be reused without prop changes.
 */
export function useTrainerLmsCourse(courseId: string): UseTrainerLmsCourseResult {
  const [course, setCourse] = useState<TrainerLmsCourse | null>(null)
  const [lessons, setLessons] = useState<TrainerLmsLesson[]>([])
  const [materials, setMaterials] = useState<TrainerLessonMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [lessonsLoading, setLessonsLoading] = useState(false)
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  // ─── Internal: reload lesson list after mutations ───────────────────────────

  /** Reload only the lesson list; used after a successful lesson mutation. */
  const reloadLessons = useCallback(async (id: string) => {
    setLessonsLoading(true)
    try {
      const payload = await getTrainerCourseLessons(id)
      setLessons(payload)
    } catch (err: unknown) {
      setLessons([])
      setMutationError(err instanceof Error ? err.message : "Failed to reload lessons.")
    } finally {
      setLessonsLoading(false)
    }
  }, [])

  /** Reload only the course detail; used after mutations that affect course counts. */
  const reloadCourseDetail = useCallback(async (id: string) => {
    try {
      const payload = await getTrainerCourseDetail(id)
      setCourse(payload)
      setConnected(true)
    } catch (err: unknown) {
      setMutationError(err instanceof Error ? err.message : "Failed to reload course detail.")
    }
  }, [])

  // ─── Internal: reload material list after upload ────────────────────────────

  /** Reload only the material list; used after a successful upload. */
  const reloadMaterials = useCallback(async (id: string) => {
    if (!id) return
    setMaterialsLoading(true)
    try {
      const payload = await getCourseMaterials(id)
      setMaterials(payload.materials)
    } catch (err: unknown) {
      setMaterials([])
      setMutationError(err instanceof Error ? err.message : "Failed to reload materials.")
    } finally {
      setMaterialsLoading(false)
    }
  }, [])

  // ─── Full refresh ───────────────────────────────────────────────────────────

  /**
   * Full refresh — re-fetches course detail, lessons, and materials.
   * Called on initial mount and after status updates.
   */
  const refresh = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    setError(null)
    setMutationError(null)
    try {
      const [courseData, lessonPayload, materialPayload] = await Promise.all([
        getTrainerCourseDetail(courseId),
        getTrainerCourseLessons(courseId),
        getCourseMaterials(courseId),
      ])
      setCourse(courseData)
      setConnected(true)
      setLessons(lessonPayload)
      setMaterials(materialPayload.materials)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load course.")
      setCourse(null)
      setLessons([])
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [courseId])

  // Initial load
  useEffect(() => {
    void refresh()
  }, [refresh])

  // ─── Lesson mutations ───────────────────────────────────────────────────────

  /**
   * POST a new lesson, then reload lessons and course detail.
   * Re-throws so the caller can show an inline error.
   */
  const createLesson = useCallback(
    async (payload: TrainerLmsLessonCreate) => {
      if (!courseId) return
      setMutationError(null)
      try {
        await createTrainerLesson(courseId, payload)
        await Promise.all([reloadLessons(courseId), reloadCourseDetail(courseId)])
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create lesson."
        setMutationError(message)
        throw err
      }
    },
    [courseId, reloadCourseDetail, reloadLessons]
  )

  /**
   * PATCH the lesson, then reload the lesson list.
   * Re-throws so TrainerLessonForm can show the error inline.
   */
  const editLesson = useCallback(
    async (cId: string, lessonId: string, payload: TrainerLmsLessonUpdate) => {
      setMutationError(null)
      try {
        await updateTrainerLesson(cId, lessonId, payload)
        await reloadLessons(cId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update lesson."
        setMutationError(message)
        throw err
      }
    },
    [reloadLessons]
  )

  /**
   * DELETE the lesson, then reload the lesson list.
   * Re-throws so TrainerLessonList can handle it.
   */
  const deleteLesson = useCallback(
    async (cId: string, lessonId: string) => {
      setMutationError(null)
      try {
        await deleteTrainerLesson(cId, lessonId)
        await reloadLessons(cId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to delete lesson."
        setMutationError(message)
        throw err
      }
    },
    [reloadLessons]
  )

  // ─── Course status mutation ─────────────────────────────────────────────────

  /**
   * PATCH the course status to "draft" or "published".
   * Optimistically updates local state, then re-fetches to stay in sync.
   * Re-throws so TrainerLmsCourseDetailPage can react to failure.
   */
  const updateCourseStatus = useCallback(
    async (payload: TrainerLmsCourseUpdate) => {
      if (!courseId) return
      setStatusUpdating(true)
      setMutationError(null)
      try {
        const updated = await updateTrainerCourseStatus(courseId, payload)
        // Apply optimistic update immediately so the badge flips without waiting
        // for the full refresh round-trip.
        setCourse(updated)
        // Then re-fetch in the background to sync counts and any other fields.
        await refresh()
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update course status."
        setMutationError(message)
        throw err
      } finally {
        setStatusUpdating(false)
      }
    },
    [courseId, refresh]
  )

  // ─── Material upload ────────────────────────────────────────────────────────

  /**
   * POST multipart upload then reload the material list for the course.
   * Clears uploadError on start. Sets uploadError on failure.
   * Re-throws so TrainerMaterialUploadPanel can show inline success/error state.
   */
  const uploadMaterial = useCallback(
    async (input: TrainerMaterialUploadInput) => {
      setUploadError(null)
      try {
        await uploadTrainerMaterial(input)
        await reloadMaterials(input.courseId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed."
        setUploadError(message)
        throw err
      }
    },
    [reloadMaterials]
  )

  // ─── Derived ────────────────────────────────────────────────────────────────

  // Upload capability comes from the course record itself.
  const uploadApiConnected = course?.can_upload_materials === true

  // ─── Return ─────────────────────────────────────────────────────────────────

  return {
    course,
    lessons,
    materials,
    loading,
    lessonsLoading,
    materialsLoading,
    statusUpdating,
    error,
    mutationError,
    uploadError,
    connected,
    uploadApiConnected,
    refresh,
    createLesson,
    editLesson,
    deleteLesson,
    updateCourseStatus,
    uploadMaterial,
  }
}
