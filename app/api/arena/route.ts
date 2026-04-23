import { getArenaSnapshot } from "@/lib/arena-service"

export async function GET() {
  const snapshot = await getArenaSnapshot()
  return Response.json(snapshot)
}