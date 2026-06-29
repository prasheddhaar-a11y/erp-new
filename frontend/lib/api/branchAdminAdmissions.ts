import { getAdmissions, updateAdmission, type AdmissionRecord } from "@/lib/api/branchAdmin"
import { inScope, type BranchScope } from "@/lib/api/branchAdminData"

export type { AdmissionRecord } from "@/lib/api/branchAdmin"

export type AdmissionStatus = "New" | "Pending" | "Approved" | "Rejected" | "Student Created" | "Batch Assigned"

export type AdmissionUpdate = Partial<AdmissionRecord>

export const mockAdmissions: AdmissionRecord[] = []

export function getMockAdmissions(scope: BranchScope) {
  return inScope(mockAdmissions, scope)
}

export async function fetchBranchAdmissions() {
  return getAdmissions()
}

export async function updateBranchAdmission(id: string, payload: AdmissionUpdate) {
  return updateAdmission(id, payload)
}
