import { NextResponse } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  getAdminPasscode,
  isValidAdminPasscode,
} from "@/lib/admin-auth"
import { buildPublicUrl } from "@/lib/admin-redirect"

export async function POST(request: Request) {
  const formData = await request.formData()
  const passcode = String(formData.get("passcode") ?? "")
  const baseUrl = new URL(request.url)

  const configuredSecret = getAdminPasscode()

  if (!configuredSecret || !isValidAdminPasscode(passcode)) {
    return NextResponse.redirect(buildPublicUrl(request, "/admin/login?error=1"), 303)
  }

  const response = NextResponse.redirect(buildPublicUrl(request, "/admin"), 303)

  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: configuredSecret,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  })

  return response
}
