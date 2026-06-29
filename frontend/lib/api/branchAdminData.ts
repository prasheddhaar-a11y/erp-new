import { apiRequest } from "@/lib/api"
import type { UserProfile } from "@/lib/auth"

export type BranchScope = {
  branch_id: string
  branch_name: string
  branch_code?: string
  city?: string
}

type BranchProfile = UserProfile & {
  branch_name?: string | null
  branch_code?: string | null
  city?: string | null
  branch?: { id?: string | null; name?: string | null; code?: string | null; city?: string | null } | null
}

export function resolveBranchScope(user?: UserProfile | null): BranchScope {
  const profile = user as BranchProfile | undefined
  const branchId = profile?.branch_id || profile?.branch?.id || ""
  return {
    branch_id: branchId,
    branch_name: profile?.branch_name || profile?.branch?.name || "Assigned Branch",
    branch_code: profile?.branch_code || profile?.branch?.code || "",
    city: profile?.city || profile?.branch?.city || "",
  }
}

function withBranchQuery(endpoint: string, branchId: string) {
  const separator = endpoint.includes("?") ? "&" : "?"
  return `${endpoint}${separator}branch_id=${encodeURIComponent(branchId)}`
}

export function scopedApiRequest<T>(endpoint: string, accessToken: string, branchId: string, init: RequestInit = {}) {
  return apiRequest<T>(withBranchQuery(endpoint, branchId), accessToken, init)
}

export function inScope<T extends { branch_id: string }>(rows: T[], scope: BranchScope) {
  return rows.filter((row) => row.branch_id === scope.branch_id)
}
