import "server-only";

import { getServiceSupabaseClient } from "@/backend/supabase";

type CompletionInput = {
  participantId: string;
  challengeId: number;
  sessionId: string;
  proofFile?: File | null;
};

export async function createCoordinatorCompletion({
  participantId,
  challengeId,
  sessionId,
  proofFile,
}: CompletionInput) {
  const db = getServiceSupabaseClient();

  if (!db) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for coordinator completion logging."
    );
  }

  let proofUrl: string | null = null;

  if (proofFile) {
    const ext = proofFile.name.split(".").pop() ?? "jpg";
    const path = `${sessionId}/${participantId}-${challengeId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await db.storage
      .from("proofs")
      .upload(path, proofFile, { upsert: true });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = db.storage.from("proofs").getPublicUrl(path);
    proofUrl = data.publicUrl;
  }

  const { error: insertError } = await db.from("completions").insert({
    participant_id: participantId,
    challenge_id: challengeId,
    session_id: sessionId,
    proof_url: proofUrl,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { error: scoreError } = await db.rpc("increment_participant_score", {
    p_id: participantId,
  });

  if (scoreError) {
    throw new Error(scoreError.message);
  }

  return { proofUrl };
}