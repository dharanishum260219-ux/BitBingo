"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminTeamFormProps {
  sessionId: string;
}

export default function AdminTeamForm({ sessionId }: AdminTeamFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    const formData = new FormData(event.currentTarget);
    formData.append("sessionId", sessionId);

    try {
      const response = await fetch("/api/admin/participants", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Unable to register team right now.");
        setSubmitting(false);
        return;
      }

      event.currentTarget.reset();
      setFeedback(payload.message ?? "Team registered.");
      setSubmitting(false);
      router.refresh();
    } catch {
      setFeedback("Unable to register team right now.");
      setSubmitting(false);
    }
  };

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

      {feedback && (
        <p className="rounded-xl border border-[var(--edge-soft)] bg-white/70 px-3 py-2 text-sm text-[var(--ink-700)]">
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="quest-button w-full px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Registering" : "Register Team"}
      </button>
    </form>
  );
}
