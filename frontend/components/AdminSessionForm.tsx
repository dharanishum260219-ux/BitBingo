"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminSessionFormProps {
  message?: string;
}

type SubmitState = "idle" | "submitting" | "success" | "error";

export default function AdminSessionForm({ message }: AdminSessionFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState(message ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setFeedback("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/sessions", {
        method: "POST",
        body: formData,
        headers: {
          "x-admin-request": "fetch",
        },
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setState("error");
        setFeedback(payload.message ?? "Unable to create a new session right now.");
        return;
      }

      setState("success");
      setFeedback(payload.message ?? "Session created and activated.");
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setState("error");
      setFeedback("Unable to create a new session right now.");
    }
  };

  const feedbackClassName =
    state === "success"
      ? "text-sm font-medium border border-emerald-300 bg-emerald-50 px-3 py-2 rounded-sm text-emerald-800"
      : "text-sm font-medium border border-red-300 bg-red-50 px-3 py-2 rounded-sm text-red-700";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border border-stone-300 bg-orange-50/70 p-4 rounded-sm"
    >
      <div className="space-y-1">
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-stone-700 uppercase tracking-wider"
        >
          Session Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Spring Sprint, Hack Night, Demo Day..."
          className="w-full border-2 border-stone-500 bg-amber-50 text-stone-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        />
      </div>

      {feedback && <p className={feedbackClassName}>{feedback}</p>}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full px-5 py-2.5 bg-red-700 text-amber-50 font-bold uppercase tracking-wide rounded-sm hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting"
          ? "Creating Session..."
          : "Create and Activate Session"}
      </button>
    </form>
  );
}