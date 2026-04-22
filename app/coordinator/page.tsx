import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

import CoordinatorWorkspace from "@/components/CoordinatorWorkspace";
import type { Challenge, Participant, Session } from "@/types";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export const dynamic = "force-dynamic";

export default async function CoordinatorPage() {
  const db = getServerSupabase();

  let participants: Participant[] = [];
  let challenges: Challenge[] = [];
  let activeSession: Session | null = null;
  const isConfigured = !!db;

  if (db) {
    const [participantsResult, challengesResult, sessionsResult] = await Promise.all([
      db.from("participants").select("*").order("name"),
      db.from("challenges").select("*").order("position"),
      db.from("sessions").select("*").eq("is_active", true).limit(1),
    ]);

    participants = participantsResult.data ?? [];
    challenges = challengesResult.data ?? [];
    const sessions: Session[] = sessionsResult.data ?? [];
    activeSession = sessions[0] ?? null;
  }

  return (
    <main className="page-enter flex-1 w-full max-w-3xl mx-auto px-4 py-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="quest-button px-4 py-2 text-xs">
          Back to Arena
        </Link>
      </div>

      {!isConfigured ? (
        <div className="quest-panel p-8 text-center">
          <p className="text-3xl text-[var(--accent-b)]">Setup Required</p>
          <p className="text-[var(--ink-700)] mt-2">
            Configure Supabase credentials in .env.local to use coordinator tools.
          </p>
        </div>
      ) : activeSession ? (
        <CoordinatorWorkspace
          initialParticipants={participants}
          challenges={challenges}
          activeSession={activeSession}
        />
      ) : (
        <div className="quest-panel p-8 text-center">
          <p className="text-3xl text-[var(--accent-b)]">No Active Session</p>
          <p className="text-[var(--ink-700)] mt-2">
            Create and activate a session from the admin console before logging runs.
          </p>
        </div>
      )}
    </main>
  );
}
