import { getChallengePool, upsertChallengePool } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function GET() {
  const challenges = await getChallengePool()
  return Response.json({ challenges })
}

export async function POST(request: Request) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const body = await request.json().catch(() => null)
  const rows = Array.isArray(body?.rows)
    ? body.rows
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

  if (rows.length === 0) {
    return Response.json({ error: "rows are required" }, { status: 400 })
  }

  const result = await upsertChallengePool(rows)
  const challenges = await getChallengePool()
  return Response.json({ ok: true, ...result, challenges })
}
