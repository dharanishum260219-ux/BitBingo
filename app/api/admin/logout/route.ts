import { NextResponse } from "next/server";

import { ADMIN_COOKIE_NAME } from "@/backend/admin/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(
    new URL("/admin?status=logged-out", request.url),
    {
      status: 303,
    }
  );
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}