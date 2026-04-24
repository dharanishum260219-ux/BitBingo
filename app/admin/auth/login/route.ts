import { NextResponse } from "next/server"

import {
  ADMIN_COOKIE_NAME,
  getAdminPasscode,
  isValidAdminPasscode,
} from "@/lib/admin-auth"

export async function POST(request: Request) {
  const formData = await request.formData()
  const passcode = String(formData.get("passcode") ?? "")

  const configuredSecret = getAdminPasscode()

  if (!configuredSecret || !isValidAdminPasscode(passcode)) {
    return new NextResponse(null, {
      status: 303,
      headers: { Location: "/admin/login?error=1" },
    })
  }

  const response = new NextResponse(null, {
    status: 303,
    headers: { Location: "/admin" },
  })

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
