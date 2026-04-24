import { getArenaSnapshot } from "@/lib/arena-service"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get("session_id")
    const snapshot = await getArenaSnapshot(sessionId)
    return Response.json(snapshot)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load arena snapshot"
    return Response.json({ error: message }, { status: 500 })
  }
}