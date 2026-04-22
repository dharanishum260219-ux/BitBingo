import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(request: Request) {
  const db = getServiceClient();

  if (!db) {
    return NextResponse.json(
      {
        ok: false,
        message: "SUPABASE_SERVICE_ROLE_KEY is required to register teams.",
      },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Team name is required." },
      { status: 400 }
    );
  }

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      { ok: false, message: "Active session is required to register a team." },
      { status: 400 }
    );
  }

  const { data, error } = await db
    .from("participants")
    .insert({
      name,
      score: 0,
      session_id: sessionId,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Team registered.",
    participant: data,
  });
}