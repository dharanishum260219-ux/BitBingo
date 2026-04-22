import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/backend/admin/auth";
import { createCoordinatorCompletion } from "@/backend/coordinator/completions";

export async function POST(request: Request) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the coordinator portal." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const participantId = String(formData.get("participantId") ?? "").trim();
  const challengeIdValue = String(formData.get("challengeId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const proofFile = formData.get("proof");

  if (!participantId || !challengeIdValue || !sessionId) {
    return NextResponse.json(
      { ok: false, message: "Missing participant, challenge, or session value." },
      { status: 400 }
    );
  }

  const challengeId = Number.parseInt(challengeIdValue, 10);

  if (Number.isNaN(challengeId)) {
    return NextResponse.json(
      { ok: false, message: "Invalid challenge value." },
      { status: 400 }
    );
  }

  const file = proofFile instanceof File ? proofFile : null;

  try {
    await createCoordinatorCompletion({
      participantId,
      challengeId,
      sessionId,
      proofFile: file,
    });

    return NextResponse.json({ ok: true, message: "Completion logged." });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to log completion right now.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}