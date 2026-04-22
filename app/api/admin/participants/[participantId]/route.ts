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
  params: Promise<{ participantId: string }>;
};

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
        message: "SUPABASE_SERVICE_ROLE_KEY is required to delete teams.",
      },
      { status: 500 }
    );
  }

  const { participantId } = await context.params;

  if (!UUID_REGEX.test(participantId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid team id." },
      { status: 400 }
    );
  }

  const { error } = await db.from("participants").delete().eq("id", participantId);

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, message: "Team deleted." });
}