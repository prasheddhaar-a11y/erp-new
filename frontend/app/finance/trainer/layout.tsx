import { TrainerShell } from "./_components/TrainerShell"
import type { ReactNode } from "react"

export default function TrainerLayout({ children }: { children: ReactNode }) {
  return <TrainerShell>{children}</TrainerShell>
}
