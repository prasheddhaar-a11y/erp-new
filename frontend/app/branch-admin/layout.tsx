import { BranchAdminShell } from "./_components/BranchAdminShell"
import type { ReactNode } from "react"

export default function BranchAdminLayout({ children }: { children: ReactNode }) {
  return <BranchAdminShell>{children}</BranchAdminShell>
}
