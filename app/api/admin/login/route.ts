import { NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  getAdminPasscode,
  isAdminPortalConfigured,
  isValidAdminPasscode,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminPortalConfigured()) {
    return NextResponse.json(
      { ok: false, message: "Admin portal is not configured." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const passcode = String(formData.get("passcode") ?? "").trim();

  if (!isValidAdminPasscode(passcode)) {
    return NextResponse.json(
      { ok: false, message: "Invalid admin passcode." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true, message: "Signed in." });
  response.cookies.set(ADMIN_COOKIE_NAME, getAdminPasscode(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}