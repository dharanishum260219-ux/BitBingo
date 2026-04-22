"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Participant } from "@/types";

interface TeamRegistrationFormProps {
  sessionId: string;
  onRegistered?: (participant: Participant) => void;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function TeamRegistrationForm({
  sessionId,
  onRegistered,
}: TeamRegistrationFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setFeedback("");

    const formData = new FormData(event.currentTarget);
    formData.append("sessionId", sessionId);

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
        participant?: Participant;
      };

      if (!response.ok || !payload.ok) {
        setState("error");
        setFeedback(payload.message ?? "Unable to register team right now.");
        return;
      }

      if (payload.participant) {
        onRegistered?.(payload.participant);
      }

      setState("success");
      setFeedback(payload.message ?? "Team registered.");
      event.currentTarget.reset();
      window.setTimeout(() => {
        setState("idle");
        setFeedback("");
      }, 1800);

      if (!onRegistered) {
        router.refresh();
      }
    } catch {
      setState("error");
      setFeedback("Unable to register team right now.");
    }
  };

  const feedbackClassName =
    state === "success"
      ? "text-sm rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-700"
      : "text-sm rounded-xl border border-[var(--accent-b)]/40 bg-[var(--accent-b)]/10 px-3 py-2 text-[var(--accent-b)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="team-name" className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-700)]">
          Team Name
        </label>
        <input
          id="team-name"
          name="name"
          type="text"
          required
          placeholder="Neon Kraken Squad"
          className="w-full rounded-xl border-2 border-[var(--edge-soft)] bg-white/80 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]"
        />
      </div>

      {feedback && <p className={feedbackClassName}>{feedback}</p>}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="quest-button w-full px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "Registering" : "Register Team"}
      </button>
    </form>
  );
}
