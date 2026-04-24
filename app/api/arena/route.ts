import { getArenaSnapshot } from "@/lib/arena-service"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("session_id")
  const snapshot = await getArenaSnapshot(sessionId)
  return Response.json(snapshot)
}