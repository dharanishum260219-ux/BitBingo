import { revalidatePath } from "next/cache"

import { awardPoint } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const { id } = await params
  const body = await _request.json().catch(() => null)
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : ""

  if (!sessionId) {
    return Response.json({ error: "sessionId is required" }, { status: 400 })
  }

  await awardPoint(id, sessionId)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}