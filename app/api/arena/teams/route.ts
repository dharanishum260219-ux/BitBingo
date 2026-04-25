import { revalidatePath } from "next/cache"

import { registerTeam } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function POST(request: Request) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name : ""
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : ""

  if (!name.trim() || !sessionId) {
    return Response.json({ error: "Team name and sessionId are required" }, { status: 400 })
  }

  await registerTeam(name, sessionId)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}