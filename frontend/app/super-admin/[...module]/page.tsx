import { SuperAdminModulePage } from "@/components/super-admin-module-page"

export default async function SuperAdminModuleRoute({ params }: { params: Promise<{ module?: string[] }> }) {
  const resolvedParams = await params
  return <SuperAdminModulePage slug={resolvedParams.module ?? []} />
}
