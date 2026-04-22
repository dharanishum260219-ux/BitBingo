"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminLoginFormProps {
  message?: string;
}

export default function AdminLoginForm({ message }: AdminLoginFormProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState(message ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Invalid admin passcode.");
        setSubmitting(false);
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    } catch {
      setFeedback("Unable to sign in right now.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="quest-panel p-6 max-w-xl mx-auto space-y-4">
      <div className="quest-inset p-4 text-center">
        <h2 className="text-4xl leading-none text-[var(--ink-900)]">Command Gate</h2>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--ink-500)] mt-1">
          Enter passcode for control access
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="passcode" className="text-xs uppercase tracking-[0.14em] font-semibold text-[var(--ink-700)]">
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border-2 border-[var(--edge-soft)] bg-white/80 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--accent-a)]"
        />
      </div>

      {feedback && (
        <p className="rounded-xl border border-[var(--accent-b)]/40 bg-[var(--accent-b)]/10 px-3 py-2 text-sm text-[var(--accent-b)]">
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="quest-button w-full px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "Entering" : "Enter Admin Portal"}
      </button>
    </form>
  );
}
