import "server-only";

import { getBackendSupabaseClient, getServiceSupabaseClient } from "@/backend/supabase";
import type { Participant, Session } from "@/types";

type AdminParticipantData = {
  participants: Participant[];
  activeSession: Session | null;
  error: string | null;
};

export async function getAdminParticipants(): Promise<AdminParticipantData> {
  const db = getBackendSupabaseClient();

  if (!db) {
    return {
      participants: [],
      activeSession: null,
      error: "Supabase is not configured.",
    };
  }

  const { data: sessionData, error: sessionError } = await db
    .from("sessions")
    .select("*")
    .eq("is_active", true)
    .limit(1);

  if (sessionError) {
    return {
      participants: [],
      activeSession: null,
      error: sessionError.message,
    };
  }

  const activeSession = ((sessionData ?? [])[0] ?? null) as Session | null;

  if (!activeSession) {
    return {
      participants: [],
      activeSession: null,
      error: null,
    };
  }

  const { data: participantData, error: participantError } = await db
    .from("participants")
    .select("*")
    .eq("session_id", activeSession.id)
    .order("name");

  if (participantError) {
    return {
      participants: [],
      activeSession,
      error: participantError.message,
    };
  }

  return {
    participants: (participantData ?? []) as Participant[],
    activeSession,
    error: null,
  };
}

export async function createAdminParticipant(name: string, sessionId: string) {
  const teamName = name.trim();

  if (!teamName) {
    throw new Error("Team name is required.");
  }

  if (!sessionId) {
    throw new Error("Active session is required to register a team.");
  }

  const db = getServiceSupabaseClient();

  if (!db) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to register teams.");
  }

  const { data, error } = await db
    .from("participants")
    .insert({
      name: teamName,
      session_id: sessionId,
      score: 0,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Participant;
}

export async function updateAdminParticipant(participantId: string, name: string) {
  const teamName = name.trim();

  if (!participantId) {
    throw new Error("Participant id is required.");
  }

  if (!teamName) {
    throw new Error("Team name is required.");
  }

  const db = getServiceSupabaseClient();

  if (!db) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to edit teams.");
  }

  const { data, error } = await db
    .from("participants")
    .update({ name: teamName })
    .eq("id", participantId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Participant;
}

export async function deleteAdminParticipant(participantId: string) {
  if (!participantId) {
    throw new Error("Participant id is required.");
  }

  const db = getServiceSupabaseClient();

  if (!db) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to delete teams.");
  }

  const { error } = await db.from("participants").delete().eq("id", participantId);

  if (error) {
    throw new Error(error.message);
  }
}