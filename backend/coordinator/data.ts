import "server-only";

import type { Challenge, Participant, Session } from "@/types";
import { getPublicSupabaseClient, isSupabaseConfigured } from "@/backend/supabase";

export async function getCoordinatorData() {
  if (!isSupabaseConfigured()) {
    return {
      isConfigured: false,
      participants: [] as Participant[],
      challenges: [] as Challenge[],
      activeSession: null as Session | null,
      error: null as string | null,
    };
  }

  const db = getPublicSupabaseClient();

  if (!db) {
    return {
      isConfigured: false,
      participants: [] as Participant[],
      challenges: [] as Challenge[],
      activeSession: null as Session | null,
      error: "Supabase is not configured.",
    };
  }

  const [participantsResult, challengesResult, sessionResult] = await Promise.all([
    db.from("participants").select("*").order("name"),
    db.from("challenges").select("*").order("position"),
    db.from("sessions").select("*").eq("is_active", true).limit(1),
  ]);

  const participants = (participantsResult.data ?? []) as Participant[];
  const challenges = (challengesResult.data ?? []) as Challenge[];
  const sessions = (sessionResult.data ?? []) as Session[];

  const error =
    participantsResult.error?.message ??
    challengesResult.error?.message ??
    sessionResult.error?.message ??
    null;

  return {
    isConfigured: true,
    participants,
    challenges,
    activeSession: sessions[0] ?? null,
    error,
  };
}