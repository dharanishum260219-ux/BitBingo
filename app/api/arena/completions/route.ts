import { revalidatePath } from "next/cache"

import { logCompletion } from "@/lib/arena-service"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const participantId = typeof body?.participantId === "string" ? body.participantId : ""
  const challengeId = typeof body?.challengeId === "number" ? body.challengeId : Number(body?.challengeId)
  const proofUrl = typeof body?.proofUrl === "string" && body.proofUrl.trim() ? body.proofUrl : null
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : ""

  if (!participantId || Number.isNaN(challengeId) || !sessionId) {
    return Response.json({ error: "participantId, challengeId, and sessionId are required" }, { status: 400 })
  }

  await logCompletion({ participantId, challengeId, proofUrl, sessionId })
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}