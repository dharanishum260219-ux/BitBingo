"use client";

import { useState, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Participant, Challenge } from "@/types";

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
  const router = useRouter();
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
      setErrorMsg("Please select a participant and a challenge.");
      return;
    }

    const file = fileRef.current?.files?.[0];

    try {
      setStatus("saving");
      const formData = new FormData();
      formData.append("participantId", participantId);
      formData.append("challengeId", challengeId);
      formData.append("sessionId", sessionId);
      if (file) {
        setStatus("uploading");
        formData.append("proof", file);
      }

      const response = await fetch("/api/coordinator/completions", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Unable to log completion right now.");
      }

      router.refresh();

      setStatus("success");
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again.";
      setErrorMsg(msg);
      setStatus("error");
    }
  };

  const selectedParticipant = participants.find((p) => p.id === participantId);
  const selectedChallenge = challenges.find(
    (c) => c.id === parseInt(challengeId, 10)
  );

  return (
    <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg max-w-lg mx-auto">
      <h1 className="text-center text-3xl font-bold text-stone-900 tracking-wide uppercase mb-1">
        📜 Captain&apos;s Log
      </h1>
      <p className="text-center text-sm italic text-stone-600 mb-5">
        Log a completed challenge
      </p>
      <hr className="border-stone-400 border-dashed mb-6" />

      {status === "success" ? (
        <div className="text-center space-y-4">
          <div className="text-5xl">⚓</div>
          <p className="text-xl font-bold text-stone-800">Completion Logged!</p>
          {selectedParticipant && selectedChallenge && (
            <p className="text-stone-600 italic text-sm">
              <span className="font-cursive text-lg text-stone-800">
                {selectedParticipant.name}
              </span>{" "}
              completed <strong>&ldquo;{selectedChallenge.title}&rdquo;</strong>
            </p>
          )}
          <button
            onClick={reset}
            className="mt-4 px-6 py-2 bg-red-700 text-amber-50 font-bold uppercase tracking-wide rounded-sm hover:bg-red-800 transition-colors"
          >
            Log Another
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label
              htmlFor="participant"
              className="block text-sm font-semibold text-stone-700 uppercase tracking-wider"
            >
              Adventurer
            </label>
            <select
              id="participant"
              value={participantId}
              onChange={(e) => setParticipantId(e.target.value)}
              required
              className="w-full border-2 border-stone-500 bg-orange-50 text-stone-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">— Select adventurer —</option>
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="challenge"
              className="block text-sm font-semibold text-stone-700 uppercase tracking-wider"
            >
              Challenge
            </label>
            <select
              id="challenge"
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              required
              className="w-full border-2 border-stone-500 bg-orange-50 text-stone-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600"
            >
              <option value="">— Select challenge —</option>
              {challenges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.position === 12 ? "⭐ " : ""}
                  {c.title}
                </option>
              ))}
            </select>
            {selectedChallenge && (
              <p className="text-xs italic text-stone-500 mt-1">
                {selectedChallenge.description}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="proof"
              className="block text-sm font-semibold text-stone-700 uppercase tracking-wider"
            >
              Proof (Photo)
            </label>
            <input
              id="proof"
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="w-full text-sm text-stone-700
                file:mr-3 file:py-1.5 file:px-4
                file:border file:border-stone-800
                file:bg-stone-200 file:text-stone-800
                file:rounded-sm file:cursor-pointer
                file:font-semibold file:uppercase file:tracking-wide
                hover:file:bg-stone-300 transition-colors"
            />
            <p className="text-xs text-stone-400 italic">
              Takes a photo of the participant&apos;s screen as evidence.
            </p>
          </div>

          {errorMsg && (
            <p className="text-red-700 text-sm font-medium border border-red-300 bg-red-50 px-3 py-2 rounded-sm">
              ⚠ {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "uploading" || status === "saving"}
            className="w-full py-3 bg-red-700 text-amber-50 font-bold uppercase tracking-widest rounded-sm
              hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow"
          >
            {status === "uploading"
              ? "⏫ Uploading proof…"
              : status === "saving"
              ? "📝 Saving record…"
              : "⚓ Log Completion"}
          </button>
        </form>
      )}
    </div>
  );
}