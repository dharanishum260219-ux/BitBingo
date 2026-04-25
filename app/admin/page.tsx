import { redirect } from "next/navigation"

import { hasAdminAccess, isAdminPortalConfigured } from "@/lib/admin-auth"
import AdminPageClient from "./page-client"

export default async function AdminPage() {
  if (!(await hasAdminAccess())) {
    redirect(isAdminPortalConfigured() ? "/admin/login" : "/admin/login?setup=1")
  }

  return <AdminPageClient />
}
