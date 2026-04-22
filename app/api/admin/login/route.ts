import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminPasscode,
  isAdminPortalConfigured,
  isValidAdminPasscode,
} from "@/backend/admin/auth";

function isFetchSubmission(request: Request) {
  return request.headers.get("x-admin-request") === "fetch";
}

export async function POST(request: Request) {
  const fetchSubmission = isFetchSubmission(request);

  if (!isAdminPortalConfigured()) {
    if (fetchSubmission) {
      return NextResponse.json(
        { ok: false, message: "Admin portal is not configured." },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/admin?error=not-configured", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const passcode = String(formData.get("passcode") ?? "").trim();

  if (!isValidAdminPasscode(passcode)) {
    if (fetchSubmission) {
      return NextResponse.json(
        { ok: false, message: "Invalid admin passcode." },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/admin?error=invalid", request.url), {
      status: 303,
    });
  }

  const response = fetchSubmission
    ? NextResponse.json({ ok: true, message: "Signed in." })
    : NextResponse.redirect(new URL("/admin", request.url), {
        status: 303,
      });

  response.cookies.set(ADMIN_COOKIE_NAME, getAdminPasscode(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}