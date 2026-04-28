import { NextResponse } from "next/server"

import { buildPublicUrl } from "@/lib/admin-redirect"
import { authenticateCoordinator } from "@/lib/arena-service"
import { COORDINATOR_COOKIE_NAME, createCoordinatorAccessToken } from "@/lib/coordinator-auth"

export async function POST(request: Request) {
  const formData = await request.formData()
  const sessionId = String(formData.get("sessionId") ?? "")
  const usn = String(formData.get("usn") ?? "")
  const password = String(formData.get("password") ?? "")

  try {
    const access = await authenticateCoordinator({ sessionId, usn, password })
    const token = await createCoordinatorAccessToken({
      sessionId: access.sessionId,
      usn: access.usn,
      issuedAt: Date.now(),
    })

    const response = NextResponse.redirect(buildPublicUrl(request, `/coordinator?session_id=${encodeURIComponent(access.sessionId)}`), 303)
    response.cookies.set({
      name: COORDINATOR_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    })

    return response
  } catch {
    return NextResponse.redirect(buildPublicUrl(request, "/coordinator/login?error=1"), 303)
  }
}
