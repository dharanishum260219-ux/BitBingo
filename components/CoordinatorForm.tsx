"use client";

import { FormEvent, useRef, useState } from "react";
import type { Challenge, Participant } from "@/types";

interface CoordinatorFormProps {
  participants: Participant[];
  challenges: Challenge[];
  sessionId: string;
}

type FormStatus = "idle" | "uploading" | "saving" | "success" | "error";

export default function CoordinatorForm({
  participants,
  challenges,
  sessionId,
}: CoordinatorFormProps) {
  const [participantId, setParticipantId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setParticipantId("");
    setChallengeId("");
    setStatus("idle");
    setErrorMsg("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!participantId || !challengeId) {
      setErrorMsg("Select both a crew and a challenge.");
      return;
    }

    const file = fileRef.current?.files?.[0];

    try {
      setStatus(file ? "uploading" : "saving");
      const formData = new FormData();
      formData.append("participantId", participantId);
      formData.append("challengeId", challengeId);
      formData.append("sessionId", sessionId);

      if (file) {
        formData.append("proof", file);
      }

      const response = await fetch("/api/completions", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Unexpected error.");
      }

      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unexpected error.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const selectedParticipant = participants.find((p) => p.id === participantId);
  const selectedChallenge = challenges.find((c) => c.id === parseInt(challengeId, 10));

  return (
    <div className="quest-panel p-6 max-w-xl mx-auto">
      <div className="quest-inset p-5">
        <h1 className="text-center text-4xl leading-none text-[var(--ink-900)]">Control Deck</h1>
        <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--ink-500)] mt-1 mb-5">
          Log challenge completions
        </p>

        {status === "success" ? (
          <div className="text-center space-y-3 py-2">
            <p className="text-3xl font-semibold text-[var(--accent-a)]">Record Saved</p>
            {selectedParticipant && selectedChallenge && (
              <p className="text-[var(--ink-700)] text-sm">
                <span className="font-cursive text-xl text-[var(--ink-900)]">{selectedParticipant.name}</span>{" "}
                cleared <strong>{selectedChallenge.title}</strong>
              </p>
            )}
            <button onClick={reset} className="quest-button mt-2 px-6 py-2.5">
              Log Another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="participant" className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-700)]">
                Crew
              </label>
              <select
                id="participant"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-[var(--edge-soft)] bg-white/80 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]"
              >
                <option value="">Select crew</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="challenge" className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-700)]">
                Challenge
              </label>
              <select
                id="challenge"
                value={challengeId}
                onChange={(e) => setChallengeId(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-[var(--edge-soft)] bg-white/80 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]"
              >
                <option value="">Select challenge</option>
                {challenges.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.position === 12 ? "Core - " : ""}
                    {c.title}
                  </option>
                ))}
              </select>
              {selectedChallenge && (
                <p className="text-xs text-[var(--ink-500)]">{selectedChallenge.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="proof" className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-700)]">
                Proof Capture
              </label>
              <input
                id="proof"
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="w-full rounded-xl border-2 border-[var(--edge-soft)] bg-white/80 px-3 py-2 text-sm"
              />
            </div>

            {errorMsg && (
              <p className="rounded-xl border border-[var(--accent-b)]/40 bg-[var(--accent-b)]/10 px-3 py-2 text-sm text-[var(--accent-b)]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "uploading" || status === "saving"}
              className="quest-button w-full py-3"
            >
              {status === "uploading"
                ? "Uploading proof"
                : status === "saving"
                ? "Saving record"
                : "Log Completion"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
