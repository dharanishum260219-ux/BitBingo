import { revalidatePath } from "next/cache"

import { createSession } from "@/lib/arena-service"

export async function POST(request: Request) {
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

  try {
    const sessionId = await createSession({
      name,
      durationMinutes,
      challengeIds,
      teamNames,
      questionRows,
    })
    revalidatePath("/")
    revalidatePath("/coordinator")
    revalidatePath("/admin")

    return Response.json({ ok: true, sessionId })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create session"
    return Response.json({ error: message }, { status: 500 })
  }
}