import "server-only";

import {
  getBackendSupabaseClient,
  getServiceSupabaseClient,
  isAdminBackendConfigured,
} from "@/backend/supabase";
import type { Session } from "@/types";

export async function getAdminSessions() {
  if (!isAdminBackendConfigured()) {
    return {
      sessions: [] as Session[],
      activeSession: null as Session | null,
      error: "Admin backend is not configured.",
    };
  }

  const db = getBackendSupabaseClient();

  if (!db) {
    return {
      sessions: [] as Session[],
      activeSession: null as Session | null,
      error: "Admin backend is not configured.",
    };
  }

  const { data, error } = await db
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      sessions: [] as Session[],
      activeSession: null as Session | null,
      error: error.message,
    };
  }

  const sessions = (data ?? []) as Session[];

  return {
    sessions,
    activeSession: sessions.find((session) => session.is_active) ?? null,
    error: null as string | null,
  };
}

export async function createAdminSession(name: string) {
  if (!isAdminBackendConfigured()) {
    throw new Error("Admin backend is not configured.");
  }

  const sessionName = name.trim();

  if (!sessionName) {
    throw new Error("Session name is required.");
  }

  const serviceDb = getServiceSupabaseClient();
  const db = serviceDb ?? getBackendSupabaseClient();

  if (!db) {
    throw new Error("Admin backend is not configured.");
  }

  if (serviceDb) {
    const { error: deactivateError } = await serviceDb
      .from("sessions")
      .update({ is_active: false })
      .eq("is_active", true);

    if (deactivateError) {
      throw new Error(deactivateError.message);
    }

    const { data: created, error: createError } = await serviceDb
      .from("sessions")
      .insert({ name: sessionName, is_active: true })
      .select("*")
      .single();

    if (createError) {
      throw new Error(createError.message);
    }

    return created as Session;
  }

  const { data, error } = await db.rpc("create_admin_session", {
    p_name: sessionName,
  });

  if (error) {
    if (error.code === "PGRST202") {
      throw new Error(
        "Missing database function create_admin_session. Run the latest database/schema.sql or set SUPABASE_SERVICE_ROLE_KEY in .env.local."
      );
    }

    throw new Error(error.message);
  }

  return data as Session;
}