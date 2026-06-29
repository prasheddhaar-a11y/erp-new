/**
 * PINESPHERE ERP
 * Module      : Trainers
 * File        : trainer/settings/page.tsx
 * Purpose     : Trainer Settings page.
 *               Auth + role guard is handled by the parent TrainerLayout (../layout.tsx).
 *               Renders the trainer-specific settings component — not the shared
 *               student/generic profile page.
 */

import TrainerSettingsPage from "./_components/TrainerSettingsPage"

export default function TrainerSettingsRoute() {
  return <TrainerSettingsPage />
}