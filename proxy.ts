import { NextRequest, NextResponse } from "next/server"

import { buildPublicUrl } from "@/lib/admin-redirect"

const ADMIN_COOKIE_NAME = "bitbingo_admin_access"
const DEV_ADMIN_SECRET = "bitbingo-dev-admin"

function getAdminPasscode() {
  if (process.env.ADMIN_PORTAL_SECRET) {
    return process.env.ADMIN_PORTAL_SECRET
  }

  return process.env.NODE_ENV === "production" ? "" : DEV_ADMIN_SECRET
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname === "/admin/login" || pathname === "/admin/logout" || pathname === "/admin/auth/login") {
    return NextResponse.next()
  }

  if (!pathname.startsWith("/admin")) {
    return NextResponse.next()
  }

  const configuredPasscode = getAdminPasscode()

  if (!configuredPasscode) {
    return NextResponse.redirect(buildPublicUrl(request, "/admin/login?setup=1"))
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? ""
  if (token !== configuredPasscode) {
    return NextResponse.redirect(buildPublicUrl(request, "/admin/login"))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
