import { revalidatePath } from "next/cache"

import { createSession } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function POST(request: Request) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name : ""
  const durationMinutes = typeof body?.durationMinutes === "number"
    ? body.durationMinutes
    : Number(body?.durationMinutes)
  const challengeIds = Array.isArray(body?.challengeIds)
    ? body.challengeIds.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
    : []
  const teamNames = Array.isArray(body?.teamNames)
    ? body.teamNames.filter((name: unknown): name is string => typeof name === "string")
    : []
  const coordinatorUsns = Array.isArray(body?.coordinatorUsns)
    ? body.coordinatorUsns.filter((usn: unknown): usn is string => typeof usn === "string")
    : []
  const sessionPassword = typeof body?.sessionPassword === "string" ? body.sessionPassword : ""
  const questionRows = Array.isArray(body?.questionRows)
    ? body.questionRows
        .map((row: unknown) => {
          if (!row || typeof row !== "object") return null
          const asRecord = row as Record<string, unknown>
          return {
            title: typeof asRecord.title === "string" ? asRecord.title : "",
            description: typeof asRecord.description === "string" ? asRecord.description : "",
            difficulty: typeof asRecord.difficulty === "string" ? asRecord.difficulty : "",
            points: typeof asRecord.points === "number" ? asRecord.points : Number(asRecord.points),
          }
        })
        .filter(
          (row: { title: string; description: string; difficulty: string; points: number } | null): row is {
            title: string
            description: string
            difficulty: string
            points: number
          } => Boolean(row),
        )
    : []

  if (!name.trim()) {
    return Response.json({ error: "Session name is required" }, { status: 400 })
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return Response.json({ error: "durationMinutes must be a positive number" }, { status: 400 })
  }

  if (!sessionPassword.trim()) {
    return Response.json({ error: "Session password is required" }, { status: 400 })
  }

  if (coordinatorUsns.length === 0) {
    return Response.json({ error: "At least one coordinator USN is required" }, { status: 400 })
  }

  try {
    const sessionId = await createSession({
      name,
      durationMinutes,
      challengeIds,
      teamNames,
      coordinatorUsns,
      sessionPassword,
      questionRows,
    })
    revalidatePath("/")
    revalidatePath("/coordinator")
    revalidatePath("/admin")

    return Response.json({ ok: true, sessionId })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error && "message" in error && typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : typeof error === "string"
            ? error
            : "Failed to create session"
    return Response.json({ error: message }, { status: 500 })
  }
}