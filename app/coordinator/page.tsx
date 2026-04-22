import { createClient } from "@supabase/supabase-js";
import CoordinatorForm from "@/components/CoordinatorForm";
import type { Participant, Challenge, Session } from "@/types";
import Link from "next/link";

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
    const [participantsResult, challengesResult, sessionsResult] =
      await Promise.all([
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
    <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-red-700 italic transition-colors"
        >
          ← Back to the Map
        </Link>
      </div>

      {!isConfigured ? (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚠</p>
          <p className="text-xl font-bold text-stone-800 mb-2">
            Supabase Not Configured
          </p>
          <p className="text-stone-600 italic text-sm">
            Copy <code className="font-mono">.env.local.example</code> to{" "}
            <code className="font-mono">.env.local</code> and add your Supabase
            credentials to enable this feature.
          </p>
        </div>
      ) : activeSession ? (
        <>
          <p className="text-center text-xs text-stone-500 italic mb-6">
            Active session:{" "}
            <strong className="text-stone-700">{activeSession.name}</strong>
          </p>
          <CoordinatorForm
            participants={participants}
            challenges={challenges}
            sessionId={activeSession.id}
          />
        </>
      ) : (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚓</p>
          <p className="text-xl font-bold text-stone-800 mb-2">
            No Active Session
          </p>
          <p className="text-stone-600 italic text-sm">
            A coordinator must create and activate a session in Supabase before
            completions can be logged.
          </p>
        </div>
      )}
    </main>
  );
}
