"use client";

import { useEffect, useState } from "react";
import CompletionModal from "@/components/CompletionModal";
import { supabase } from "@/lib/supabase";
import type { Challenge, Completion, Participant } from "@/types";

interface BingoGridProps {
  challenges: Challenge[];
  initialCompletions: Completion[];
}

type CompletionWithDetails = Completion & {
  participant?: Participant;
  challenge?: Challenge;
};

export default function BingoGrid({
  challenges,
  initialCompletions,
}: BingoGridProps) {
  const [completedIds, setCompletedIds] = useState<Set<number>>(
    () => new Set(initialCompletions.map((c) => c.challenge_id))
  );
  const [completions, setCompletions] = useState<Map<string, Completion>>(
    () => new Map(initialCompletions.map((c) => [c.id, c]))
  );
  const [selectedCompletion, setSelectedCompletion] =
    useState<CompletionWithDetails | null>(null);

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
            setCompletions((prev) => new Map(prev).set(newComp.id, newComp));
          } else if (payload.eventType === "DELETE") {
            const oldComp = payload.old as Completion;
            setCompletedIds((prev) => {
              const next = new Set(prev);
              next.delete(oldComp.challenge_id);
              return next;
            });
            setCompletions((prev) => {
              const next = new Map(prev);
              next.delete(oldComp.id);
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

  const fetchCompletionDetails = async (completionId: string) => {
    try {
      const response = await fetch(`/api/completions/${completionId}`);
      const payload = (await response.json()) as {
        ok?: boolean;
        data?: CompletionWithDetails;
      };

      if (response.ok && payload.data) {
        setSelectedCompletion(payload.data);
      }
    } catch (error) {
      console.error("Failed to fetch completion details:", error);
    }
  };

  const challengeByPosition = new Map(challenges.map((c) => [c.position, c]));
  const completionIdByChallenge = new Map(
    Array.from(completions.values()).map((c) => [c.challenge_id, c.id])
  );

  return (
    <section className="quest-panel p-4 md:p-6">
      <div className="quest-inset px-3 py-4 md:px-5 md:py-5">
        <h2 className="text-center text-3xl text-[var(--ink-900)]">Quest Grid</h2>
        <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--ink-500)] mb-4">
          Click cleared tiles to inspect submissions
        </p>

        <div className="grid grid-cols-5 gap-1.5 md:gap-2">
          {Array.from({ length: 25 }, (_, pos) => {
            const challenge = challengeByPosition.get(pos);
            if (!challenge) return null;

            const isCompleted = completedIds.has(challenge.id);
            const isCenter = pos === 12;
            const completionId = isCompleted
              ? completionIdByChallenge.get(challenge.id)
              : undefined;

            return (
              <button
                key={pos}
                type="button"
                title={challenge.description}
                onClick={() => {
                  if (isCompleted && completionId) {
                    fetchCompletionDetails(completionId);
                  }
                }}
                className={[
                  "relative min-h-[82px] sm:min-h-[98px] p-1.5 text-center rounded-xl border-2 transition-all duration-200",
                  "flex flex-col items-center justify-center overflow-hidden",
                  isCompleted
                    ? "border-[var(--accent-b)] bg-[var(--accent-b)]/12 cursor-pointer hover:bg-[var(--accent-b)]/20 hover:-translate-y-0.5"
                    : isCenter
                    ? "border-[var(--accent-a)] bg-[var(--accent-a)]/12"
                    : "border-[var(--edge-soft)] bg-white/55",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[10px] sm:text-xs leading-tight font-semibold",
                    isCompleted
                      ? "text-[var(--ink-700)] opacity-65"
                      : "text-[var(--ink-900)]",
                  ].join(" ")}
                >
                  {challenge.title}
                </span>

                {isCompleted && (
                  <span
                    aria-label="Completed"
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
                  >
                    <svg viewBox="0 0 40 40" className="w-10 h-10 opacity-90" aria-hidden="true">
                      <line
                        x1="4"
                        y1="4"
                        x2="36"
                        y2="36"
                        stroke="#c44536"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                      <line
                        x1="36"
                        y1="4"
                        x2="4"
                        y2="36"
                        stroke="#c44536"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                )}

                {isCenter && !isCompleted && (
                  <span className="mt-1 text-base text-[var(--accent-a)]" aria-hidden="true">
                    CORE
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <CompletionModal
        isOpen={selectedCompletion !== null}
        completion={selectedCompletion}
        onClose={() => setSelectedCompletion(null)}
      />
    </section>
  );
}
