import { getCoordinatorAccess } from "@/lib/coordinator-session"

export async function GET() {
  const access = await getCoordinatorAccess()

  if (!access) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  return Response.json({ sessionId: access.sessionId, usn: access.usn })
}
