import { NextResponse } from "next/server"

import { ADMIN_COOKIE_NAME } from "@/lib/admin-auth"
import { buildPublicUrl } from "@/lib/admin-redirect"

export async function POST(request: Request) {
  const response = NextResponse.redirect(buildPublicUrl(request, "/admin/login"), 303)

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })

  return response
}
