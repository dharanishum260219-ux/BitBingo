import { NextRequest } from "next/server"
import { revalidatePath } from "next/cache"

import { hasAdminAccess } from "@/lib/admin-auth"
import { isCoordinatorLinkedToSession, logCompletion } from "@/lib/arena-service"
import { COORDINATOR_COOKIE_NAME, verifyCoordinatorAccessToken } from "@/lib/coordinator-auth"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const participantId = typeof body?.participantId === "string" ? body.participantId : ""
  const challengeId = typeof body?.challengeId === "number" ? body.challengeId : Number(body?.challengeId)
  const proofUrl = typeof body?.proofUrl === "string" && body.proofUrl.trim() ? body.proofUrl : null
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : ""

  if (!participantId || Number.isNaN(challengeId) || !sessionId) {
    return Response.json({ error: "participantId, challengeId, and sessionId are required" }, { status: 400 })
  }

  const adminAllowed = await hasAdminAccess()
  if (!adminAllowed) {
    const token = request.cookies.get(COORDINATOR_COOKIE_NAME)?.value ?? ""
    const access = token ? await verifyCoordinatorAccessToken(token) : null

    if (!access || access.sessionId !== sessionId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const linked = await isCoordinatorLinkedToSession(sessionId, access.usn)
    if (!linked) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    await logCompletion({ participantId, challengeId, proofUrl, sessionId })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log completion"
    if (
      message.includes("Team does not belong to selected session") ||
      message.includes("Challenge is not mapped to selected session") ||
      message.includes("Missing participant or selected session")
    ) {
      return Response.json({ error: message }, { status: 400 })
    }

    return Response.json({ error: message }, { status: 500 })
  }
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}