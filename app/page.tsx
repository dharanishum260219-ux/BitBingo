import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

import BingoGrid from "@/components/BingoGrid";
import Leaderboard from "@/components/Leaderboard";
import { DEMO_CHALLENGES } from "@/lib/demo-data";
import type { Challenge, Completion, Participant } from "@/types";

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
    <main className="page-enter flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-10">
      <header className="quest-panel px-5 py-6 md:px-8 md:py-7 mb-8">
        <div className="quest-inset px-4 py-5 md:px-6 md:py-6 text-center">
          <p className="text-xs md:text-sm uppercase tracking-[0.25em] text-[var(--ink-500)]">
            Live Tournament Arena
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl leading-none mt-2 text-[var(--ink-900)]">
            BitBingo
          </h1>
          <p className="mt-3 text-sm md:text-base text-[var(--ink-700)] max-w-2xl mx-auto">
            Claim tiles, submit proof, and race up the board. Every completion redraws
            the map in real-time.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/coordinator" className="quest-button px-5 py-2.5">
              Open Coordinator
            </Link>
            <a href="#arena" className="quest-button px-5 py-2.5">
              Enter Arena
            </a>
          </div>
        </div>
      </header>

      {!isConfigured && (
        <div className="quest-panel mb-6 px-4 py-3 text-sm text-center text-[var(--ink-700)]">
          Supabase is not configured. Demo mode is active until you set .env.local.
        </div>
      )}

      <section id="arena" className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
        <Leaderboard initialParticipants={participants} />
        <BingoGrid challenges={challenges} initialCompletions={completions} />
      </section>

      <footer className="mt-12 text-center text-xs uppercase tracking-[0.2em] text-[var(--ink-500)]">
        BitBingo Quest Arena  Real-time by Supabase + Next.js
      </footer>
    </main>
  );
}
