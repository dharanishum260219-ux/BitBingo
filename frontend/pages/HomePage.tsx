import Link from "next/link";

import BingoGrid from "@/frontend/components/BingoGrid";
import Leaderboard from "@/frontend/components/Leaderboard";
import { DEMO_CHALLENGES } from "@/lib/demo-data";
import { getPublicSupabaseClient, isSupabaseConfigured } from "@/backend/supabase";
import type { Challenge, Completion, Participant } from "@/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getPublicSupabaseClient();

  let challenges: Challenge[] = DEMO_CHALLENGES;
  let participants: Participant[] = [];
  let completions: Completion[] = [];

  if (db) {
    const [challengesResult, participantsResult, completionsResult] =
      await Promise.all([
        db.from("challenges").select("*").order("position"),
        db.from("participants").select("*").order("score", { ascending: false }),
        db.from("completions").select("*"),
      ]);

    challenges =
      challengesResult.data && challengesResult.data.length > 0
        ? challengesResult.data
        : DEMO_CHALLENGES;
    participants = participantsResult.data ?? [];
    completions = completionsResult.data ?? [];
  }

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-stone-900 tracking-wide">
          ⚓ BitBingo
        </h1>
        <p className="mt-2 text-stone-600 italic text-base sm:text-lg">
          Explorer&apos;s Chart — Live Coding Competition Map
        </p>
        <div className="mt-3 flex justify-center gap-4 text-sm">
          <Link
            href="/coordinator"
            className="inline-block px-4 py-1.5 border-2 border-stone-700 text-stone-700 font-bold uppercase tracking-wide rounded-sm hover:bg-stone-700 hover:text-amber-50 transition-colors"
          >
            📜 Coordinator Portal
          </Link>
          <Link
            href="/admin"
            className="inline-block px-4 py-1.5 border-2 border-red-700 text-red-700 font-bold uppercase tracking-wide rounded-sm hover:bg-red-700 hover:text-amber-50 transition-colors"
          >
            ⚓ Admin Portal
          </Link>
        </div>
      </header>

      <hr className="border-stone-400 border-dashed mb-8" />

      {!isSupabaseConfigured() && (
        <div className="mb-6 border border-amber-600 bg-amber-100 text-amber-800 px-4 py-3 rounded-sm text-sm text-center">
          ⚠ Supabase is not configured — showing demo data. Copy{" "}
          <code className="font-mono">.env.local.example</code> to{" "}
          <code className="font-mono">.env.local</code> and add your
          credentials to enable live data and real-time updates.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        <Leaderboard initialParticipants={participants} />
        <BingoGrid challenges={challenges} initialCompletions={completions} />
      </div>

      <footer className="mt-12 text-center text-xs text-stone-400 italic">
        BitBingo · Explorer&apos;s Chart Edition · Powered by Supabase &amp;
        Next.js
      </footer>
    </main>
  );
}