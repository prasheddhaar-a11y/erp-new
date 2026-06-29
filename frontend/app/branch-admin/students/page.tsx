import { redirect } from "next/navigation"

export default function StudentsRedirectPage() {
  redirect("/branch-admin/users")
}
