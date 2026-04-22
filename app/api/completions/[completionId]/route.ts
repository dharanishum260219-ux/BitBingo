import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ completionId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const db = getSupabaseClient();

  if (!db) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { completionId } = await context.params;

  if (!UUID_REGEX.test(completionId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid completion id." },
      { status: 400 }
    );
  }

  const { data: completion, error: completionError } = await db
    .from("completions")
    .select("*")
    .eq("id", completionId)
    .single();

  if (completionError) {
    return NextResponse.json(
      { ok: false, message: completionError.message },
      { status: 500 }
    );
  }

  // Fetch participant data
  const { data: participant, error: participantError } = await db
    .from("participants")
    .select("id,name,score,session_id,created_at")
    .eq("id", completion.participant_id)
    .single();

  if (participantError) {
    return NextResponse.json(
      { ok: false, message: participantError.message },
      { status: 500 }
    );
  }

  // Fetch challenge data
  const { data: challenge, error: challengeError } = await db
    .from("challenges")
    .select("id,title,description,position")
    .eq("id", completion.challenge_id)
    .single();

  if (challengeError) {
    return NextResponse.json(
      { ok: false, message: challengeError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...completion,
      participant,
      challenge,
    },
  });
}
