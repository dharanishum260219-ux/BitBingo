import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/backend/admin/auth";
import { createAdminParticipant } from "@/backend/admin/participants";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Enter a team name before registering." },
      { status: 400 }
    );
  }

  if (!sessionId) {
    return NextResponse.json(
      { ok: false, message: "No active session found. Create one first." },
      { status: 400 }
    );
  }

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Invalid active session id. Create or reselect an active session in Admin.",
      },
      { status: 400 }
    );
  }

  try {
    await createAdminParticipant(name, sessionId);
    return NextResponse.json({ ok: true, message: "Team registered." });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to register team right now.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}