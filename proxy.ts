import { NextRequest, NextResponse } from "next/server"

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
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.search = "?setup=1"
    return NextResponse.redirect(loginUrl)
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value ?? ""
  if (token !== configuredPasscode) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/admin/login"
    loginUrl.search = ""
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
