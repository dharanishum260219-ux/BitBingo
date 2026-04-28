import { NextResponse } from "next/server"

import { buildPublicUrl } from "@/lib/admin-redirect"
import { COORDINATOR_COOKIE_NAME } from "@/lib/coordinator-auth"

export async function POST(request: Request) {
  const response = NextResponse.redirect(buildPublicUrl(request, "/coordinator/login"), 303)

  response.cookies.set({
    name: COORDINATOR_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
