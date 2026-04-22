import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { hasAdminAccess } from "@/lib/admin-auth";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(_: Request, context: RouteContext) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const db = getServiceClient();

  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        message: "SUPABASE_SERVICE_ROLE_KEY is required to stop a session.",
      },
      { status: 500 }
    );
  }

  const { sessionId } = await context.params;

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid session id." },
      { status: 400 }
    );
  }

  const { data: current, error: currentError } = await db
    .from("sessions")
    .select("id,is_active")
    .eq("id", sessionId)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json(
      { ok: false, message: currentError.message },
      { status: 500 }
    );
  }

  if (!current) {
    return NextResponse.json(
      { ok: false, message: "Session not found." },
      { status: 404 }
    );
  }

  if (!current.is_active) {
    return NextResponse.json({ ok: true, message: "Session is already stopped." });
  }

  const { error } = await db
    .from("sessions")
    .update({ is_active: false })
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Running session stopped." });
}

export async function DELETE(_: Request, context: RouteContext) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const db = getServiceClient();

  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        message: "SUPABASE_SERVICE_ROLE_KEY is required to delete sessions.",
      },
      { status: 500 }
    );
  }

  const { sessionId } = await context.params;

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid session id." },
      { status: 400 }
    );
  }

  const { data: current, error: currentError } = await db
    .from("sessions")
    .select("id,is_active")
    .eq("id", sessionId)
    .maybeSingle();

  if (currentError) {
    return NextResponse.json(
      { ok: false, message: currentError.message },
      { status: 500 }
    );
  }

  if (!current) {
    return NextResponse.json(
      { ok: false, message: "Session not found." },
      { status: 404 }
    );
  }

  if (current.is_active) {
    return NextResponse.json(
      {
        ok: false,
        message: "Stop the running session before deleting it.",
      },
      { status: 400 }
    );
  }

  const { error } = await db.from("sessions").delete().eq("id", sessionId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Archived session deleted." });
}