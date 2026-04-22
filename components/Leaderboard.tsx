"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Participant } from "@/types";

interface LeaderboardProps {
  initialParticipants: Participant[];
}

export default function Leaderboard({ initialParticipants }: LeaderboardProps) {
  const [participants, setParticipants] =
    useState<Participant[]>(initialParticipants);

  useEffect(() => {
    // Sort helper – highest score first, then by name
    const sorted = (list: Participant[]) =>
      [...list].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));

    setParticipants(sorted(initialParticipants));

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
  }, [initialParticipants]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <aside className="border-double border-4 border-stone-600 bg-amber-50/80 p-5 rounded-sm shadow-lg">
      {/* Header */}
      <h2 className="text-center text-2xl font-bold text-stone-900 tracking-wide uppercase mb-1">
        ⚓ Bounty Board
      </h2>
      <p className="text-center text-sm italic text-stone-600 mb-4">
        Top Adventurers
      </p>
      <hr className="border-stone-400 border-dashed mb-4" />

      {participants.length === 0 ? (
        <p className="text-center text-stone-500 italic text-sm py-4">
          No adventurers have registered yet…
        </p>
      ) : (
        <ol className="space-y-2">
          {participants.map((p, idx) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 py-2 px-3 border border-stone-300 bg-orange-50/60 rounded-sm"
            >
              <span className="text-lg w-6 shrink-0">
                {medals[idx] ?? `${idx + 1}.`}
              </span>
              {/* Cursive handwritten font for participant name */}
              <span className="font-cursive text-xl text-stone-800 flex-1 truncate">
                {p.name}
              </span>
              <span className="text-red-700 font-bold tabular-nums text-sm">
                {p.score} pts
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-4 text-center text-xs text-stone-400 italic">
        ✦ Updates in real-time ✦
      </p>
    </aside>
  );
}
