"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Participant } from "@/types";

interface LeaderboardProps {
  initialParticipants: Participant[];
}

export default function Leaderboard({ initialParticipants }: LeaderboardProps) {
  const sorted = (list: Participant[]) =>
    [...list].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

  const [participants, setParticipants] =
    useState<Participant[]>(() => sorted(initialParticipants));

  useEffect(() => {
    const channel = supabase
      .channel("participants-leaderboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        (payload) => {
          setParticipants((prev) => {
            let updated = [...prev];
            if (payload.eventType === "INSERT") {
              updated.push(payload.new as Participant);
            } else if (payload.eventType === "UPDATE") {
              updated = updated.map((p) =>
                p.id === (payload.new as Participant).id
                  ? (payload.new as Participant)
                  : p
              );
            } else if (payload.eventType === "DELETE") {
              updated = updated.filter(
                (p) => p.id !== (payload.old as Participant).id
              );
            }
            return sorted(updated);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const medals = ["#1", "#2", "#3"];

  return (
    <aside className="quest-panel p-5 md:p-6">
      <div className="quest-inset px-3 py-4 md:px-4 md:py-5">
        <h2 className="text-center text-3xl text-[var(--ink-900)]">Bounty Board</h2>
        <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--ink-500)] mt-1 mb-4">
          Top Crews in the Arena
        </p>

        {participants.length === 0 ? (
          <p className="text-center text-[var(--ink-500)] italic text-sm py-5">
            Waiting for the first crew to join the run.
          </p>
        ) : (
          <ol className="space-y-2">
            {participants.map((p, idx) => (
              <li
                key={p.id}
                className="quest-inset px-3 py-2.5 flex items-center gap-3 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <span className="w-9 h-9 shrink-0 rounded-full border-2 border-[var(--edge)] bg-[var(--accent-c)]/65 flex items-center justify-center text-xs font-bold text-[var(--ink-900)]">
                  {medals[idx] ?? idx + 1}
                </span>
                <span className="font-cursive text-xl text-[var(--ink-900)] flex-1 truncate">
                  {p.name}
                </span>
                <span className="text-[var(--accent-b)] font-bold tabular-nums text-sm">
                  {p.score} pts
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <p className="mt-4 text-center text-xs uppercase tracking-[0.14em] text-[var(--ink-500)]">
        Auto-sync enabled
      </p>
    </aside>
  );
}
