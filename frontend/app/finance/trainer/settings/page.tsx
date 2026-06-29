/**
 * Trainer Settings page.
 * Auth + role guard is handled by the parent TrainerLayout (../layout.tsx).
 * This page only renders the profile settings content.
 */
import ProfileSettingsPage from "@/app/settings/profile/page"

export default function TrainerSettingsPage() {
  return <ProfileSettingsPage />
}
