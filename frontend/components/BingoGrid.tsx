"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Challenge, Completion } from "@/types";

interface BingoGridProps {
  challenges: Challenge[];
  initialCompletions: Completion[];
}

export default function BingoGrid({
  challenges,
  initialCompletions,
}: BingoGridProps) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    () => new Set(initialCompletions.map((c) => c.challenge_id))
  );

  useEffect(() => {
    const channel = supabase
      .channel("completions-bingo")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "completions" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newComp = payload.new as Completion;
            setCompletedIds((prev) => new Set([...prev, newComp.challenge_id]));
          } else if (payload.eventType === "DELETE") {
            const oldComp = payload.old as Completion;
            setCompletedIds((prev) => {
              const next = new Set(prev);
              next.delete(oldComp.challenge_id);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const challengeByPosition = new Map(challenges.map((c) => [c.position, c]));

  return (
    <section>
      <h2 className="text-center text-2xl font-bold text-stone-900 tracking-wide uppercase mb-1">
        🗺 Treasure Map
      </h2>
      <p className="text-center text-sm italic text-stone-600 mb-4">
        Complete challenges to chart the territory
      </p>

      <div className="border-double border-4 border-stone-600 p-2 bg-amber-50/80 shadow-lg rounded-sm">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }, (_, pos) => {
            const challenge = challengeByPosition.get(pos);
            if (!challenge) return null;

            const isCompleted = completedIds.has(challenge.id);
            const isCenter = pos === 12;

            return (
              <div
                key={pos}
                title={challenge.description}
                className={[
                  "relative flex flex-col items-center justify-center",
                  "border-double border-4 min-h-[80px] sm:min-h-[96px] p-1 text-center",
                  "transition-all duration-300 rounded-sm overflow-hidden",
                  isCompleted
                    ? "border-red-700 bg-orange-100"
                    : isCenter
                    ? "border-stone-700 bg-amber-100 ring-2 ring-offset-1 ring-stone-500"
                    : "border-stone-400 bg-amber-50",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[10px] sm:text-xs leading-tight font-semibold",
                    isCompleted ? "text-stone-600 opacity-60" : "text-stone-800",
                    isCenter ? "text-cyan-800" : "",
                  ].join(" ")}
                >
                  {challenge.title}
                </span>

                {isCompleted && (
                  <span
                    aria-label="Completed"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  >
                    <svg
                      viewBox="0 0 40 40"
                      className="w-10 h-10 opacity-90"
                      aria-hidden="true"
                    >
                      <line
                        x1="4"
                        y1="4"
                        x2="36"
                        y2="36"
                        stroke="#b91c1c"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <line
                        x1="36"
                        y1="4"
                        x2="4"
                        y2="36"
                        stroke="#b91c1c"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}

                {isCenter && !isCompleted && (
                  <span className="mt-1 text-base" aria-hidden="true">
                    ✦
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-2 text-center text-xs text-stone-400 italic">
        ✦ Grid updates in real-time ✦
      </p>
    </section>
  );
}