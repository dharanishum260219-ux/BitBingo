import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/backend/admin/auth";
import { createAdminSession } from "@/backend/admin/sessions";

function isFetchSubmission(request: Request) {
  return request.headers.get("x-admin-request") === "fetch";
}

export async function POST(request: Request) {
  const fetchSubmission = isFetchSubmission(request);

  if (!(await hasAdminAccess())) {
    if (fetchSubmission) {
      return NextResponse.json(
        { ok: false, message: "Please sign in to access the admin portal." },
        { status: 401 }
      );
    }

    return NextResponse.redirect(new URL("/admin?error=unauthorized", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    if (fetchSubmission) {
      return NextResponse.json(
        { ok: false, message: "Enter a session name before creating a new session." },
        { status: 400 }
      );
    }

    return NextResponse.redirect(new URL("/admin?error=missing-name", request.url), {
      status: 303,
    });
  }

  try {
    await createAdminSession(name);

    if (fetchSubmission) {
      return NextResponse.json({ ok: true, message: "Session created and activated." });
    }

    return NextResponse.redirect(
      new URL("/admin?status=session-created", request.url),
      {
        status: 303,
      }
    );
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create a new session right now.";

    if (fetchSubmission) {
      return NextResponse.json(
        { ok: false, message },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/admin?error=create-failed", request.url), {
      status: 303,
    });
  }
}