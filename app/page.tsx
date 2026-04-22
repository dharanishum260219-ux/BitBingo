import { createClient } from "@supabase/supabase-js";
import Leaderboard from "@/components/Leaderboard";
import BingoGrid from "@/components/BingoGrid";
import type { Participant, Challenge, Completion } from "@/types";
import { DEMO_CHALLENGES } from "@/lib/demo-data";
import Link from "next/link";

// Server-side Supabase client (uses the same public anon key for public data)
function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = getServerSupabase();

  let challenges: Challenge[] = DEMO_CHALLENGES;
  let participants: Participant[] = [];
  let completions: Completion[] = [];
  const isConfigured = !!db;

  if (db) {
    const [challengesResult, participantsResult, completionsResult] =
      await Promise.all([
        db.from("challenges").select("*").order("position"),
        db
          .from("participants")
          .select("*")
          .order("score", { ascending: false }),
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
      {/* ── Page header ─────────────────────────────────────── */}
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
            className="inline-block px-4 py-1.5 border-2 border-red-700 text-red-700 font-bold uppercase tracking-wide rounded-sm hover:bg-red-700 hover:text-amber-50 transition-colors"
          >
            ⚓ Coordinator Portal
          </Link>
        </div>
      </header>

      <hr className="border-stone-400 border-dashed mb-8" />

      {!isConfigured && (
        <div className="mb-6 border border-amber-600 bg-amber-100 text-amber-800 px-4 py-3 rounded-sm text-sm text-center">
          ⚠ Supabase is not configured — showing demo data. Copy{" "}
          <code className="font-mono">.env.local.example</code> to{" "}
          <code className="font-mono">.env.local</code> and add your credentials
          to enable live data and real-time updates.
        </div>
      )}

      {/* ── Two-column layout ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Left: Leaderboard */}
        <Leaderboard initialParticipants={participants} />

        {/* Right: Bingo grid */}
        <BingoGrid challenges={challenges} initialCompletions={completions} />
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="mt-12 text-center text-xs text-stone-400 italic">
        BitBingo · Explorer&apos;s Chart Edition · Powered by Supabase &amp;
        Next.js
      </footer>
    </main>
  );
}
