import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { hasAdminAccess } from "@/lib/admin-auth";

function getClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!url || !anonKey) return { anon: null, service: null };

  const options = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  };

  return {
    anon: createClient(url, anonKey, options),
    service: serviceKey ? createClient(url, serviceKey, options) : null,
  };
}

export async function POST(request: Request) {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return NextResponse.json(
      { ok: false, message: "Session name is required." },
      { status: 400 }
    );
  }

  const { anon, service } = getClients();
  const db = service ?? anon;

  if (!db) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  try {
    if (service) {
      const { error: deactivateError } = await service
        .from("sessions")
        .update({ is_active: false })
        .eq("is_active", true);

      if (deactivateError) throw new Error(deactivateError.message);

      const { error: createError } = await service
        .from("sessions")
        .insert({ name, is_active: true });

      if (createError) throw new Error(createError.message);

      return NextResponse.json({ ok: true, message: "Session created and activated." });
    }

    const { error } = await db.rpc("create_admin_session", {
      p_name: name,
    });

    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true, message: "Session created and activated." });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to create session right now.";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

export async function GET() {
  if (!(await hasAdminAccess())) {
    return NextResponse.json(
      { ok: false, message: "Please sign in to access the admin portal." },
      { status: 401 }
    );
  }

  const { service } = getClients();

  if (!service) {
    return NextResponse.json(
      { ok: false, message: "Supabase is not configured." },
      { status: 500 }
    );
  }

  const { data, error } = await service
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, sessions: data ?? [] });
}