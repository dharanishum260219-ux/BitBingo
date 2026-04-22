"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminLoginFormProps {
  message?: string;
}

type SubmitState = "idle" | "submitting" | "error";

export default function AdminLoginForm({ message }: AdminLoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState(message ?? "");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("submitting");
    setFeedback("");

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/admin/login", {
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
        setFeedback(payload.message ?? "Invalid admin passcode.");
        return;
      }

      event.currentTarget.reset();
      router.refresh();
    } catch {
      setState("error");
      setFeedback("Unable to sign in right now.");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg max-w-lg mx-auto"
    >
      <div>
        <h2 className="text-center text-3xl font-bold text-stone-900 tracking-wide uppercase mb-1">
          ⚓ Admin Portal
        </h2>
        <p className="text-center text-sm italic text-stone-600 mb-5">
          Enter the portal passcode to manage sessions
        </p>
      </div>

      <div className="space-y-1">
        <label
          htmlFor="passcode"
          className="block text-sm font-semibold text-stone-700 uppercase tracking-wider"
        >
          Passcode
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoComplete="current-password"
          className="w-full border-2 border-stone-500 bg-orange-50 text-stone-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600"
        />
      </div>

      {feedback && (
        <p className="text-sm font-medium border border-red-300 bg-red-50 px-3 py-2 rounded-sm text-red-700">
          {feedback}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full px-6 py-3 bg-red-700 text-amber-50 font-bold uppercase tracking-wide rounded-sm hover:bg-red-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? "Entering..." : "Enter Admin Portal"}
      </button>
    </form>
  );
}