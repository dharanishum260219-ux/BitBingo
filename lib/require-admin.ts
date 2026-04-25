import "server-only"

import { hasAdminAccess } from "@/lib/admin-auth"

export async function ensureAdminAccess() {
  const allowed = await hasAdminAccess()
  if (!allowed) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}
