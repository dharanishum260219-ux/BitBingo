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
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const formData = await request.formData();
  const participantId = String(formData.get("participantId") ?? "").trim();
  const challengeId = String(formData.get("challengeId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const proofFile = formData.get("proof");

  if (!UUID_REGEX.test(participantId)) {
    return NextResponse.json(
      { ok: false, message: "Please select a valid participant." },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(challengeId)) {
    return NextResponse.json(
      { ok: false, message: "Please select a valid challenge." },
      { status: 400 }
    );
  }

  if (!UUID_REGEX.test(sessionId)) {
    return NextResponse.json(
      { ok: false, message: "Active session is required." },
      { status: 400 }
    );
  }

  const { data: participant, error: participantError } = await db
    .from("participants")
    .select("id,session_id")
    .eq("id", participantId)
    .eq("session_id", sessionId)
    .maybeSingle();

  if (participantError) {
    return NextResponse.json(
      { ok: false, message: participantError.message },
      { status: 500 }
    );
  }

  if (!participant) {
    return NextResponse.json(
      { ok: false, message: "Participant not found in this session." },
      { status: 404 }
    );
  }

  const { data: activeSession, error: sessionError } = await db
    .from("sessions")
    .select("id,is_active")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json(
      { ok: false, message: sessionError.message },
      { status: 500 }
    );
  }

  if (!activeSession || !activeSession.is_active) {
    return NextResponse.json(
      { ok: false, message: "This session is no longer active." },
      { status: 400 }
    );
  }

  let proofUrl: string | null = null;

  if (proofFile instanceof File && proofFile.size > 0) {
    const ext = proofFile.name.split(".").pop() ?? "jpg";
    const path = `${sessionId}/${participantId}-${challengeId}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await proofFile.arrayBuffer());

    const { error: uploadError } = await db.storage
      .from("proofs")
      .upload(path, buffer, {
        contentType: proofFile.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { ok: false, message: uploadError.message },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = db.storage.from("proofs").getPublicUrl(path);
    proofUrl = publicUrlData.publicUrl;
  }

  const { data: completion, error: completionError } = await db
    .from("completions")
    .insert({
      participant_id: participantId,
      challenge_id: Number.parseInt(challengeId, 10),
      session_id: sessionId,
      proof_url: proofUrl,
    })
    .select("*")
    .single();

  if (completionError) {
    return NextResponse.json(
      { ok: false, message: completionError.message },
      { status: 500 }
    );
  }

  const { error: scoreError } = await db.rpc("increment_participant_score", {
    p_id: participantId,
  });

  if (scoreError) {
    return NextResponse.json(
      { ok: false, message: scoreError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Completion logged.",
    completion,
    proofUrl,
  });
}