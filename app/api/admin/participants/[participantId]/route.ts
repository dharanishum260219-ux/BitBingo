import { NextResponse } from "next/server";

import { hasAdminAccess } from "@/backend/admin/auth";
import {
  deleteAdminParticipant,
  updateAdminParticipant,
} from "@/backend/admin/participants";

type RouteParams = {
  params: Promise<{
    participantId: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const { participantId } = await params;
  const body = (await request.json()) as { name?: string };
  const name = String(body?.name ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Team name is required." },
      { status: 400 }
    );
  }

  try {
    await updateAdminParticipant(participantId, name);
    return NextResponse.json({ ok: true, message: "Team updated." });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to update team right now.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const { participantId } = await params;

  try {
    await deleteAdminParticipant(participantId);
    return NextResponse.json({ ok: true, message: "Team deleted." });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to delete team right now.";
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}