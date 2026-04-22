"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { Participant } from "@/types";

interface AdminTeamRosterProps {
  participants: Participant[];
}

type SubmitState = "idle" | "submitting";

export default function AdminTeamRoster({ participants }: AdminTeamRosterProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [feedback, setFeedback] = useState("");

  const startEdit = (participant: Participant) => {
    setEditingId(participant.id);
    setDraftName(participant.name);
    setFeedback("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveEdit = async (participantId: string) => {
    if (!draftName.trim()) {
      setFeedback("Team name is required.");
      return;
    }

    setState("submitting");
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/participants/${participantId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: draftName }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Unable to update team right now.");
        setState("idle");
        return;
      }

      setEditingId(null);
      setDraftName("");
      setState("idle");
      setFeedback(payload.message ?? "Team updated.");
      router.refresh();
    } catch {
      setState("idle");
      setFeedback("Unable to update team right now.");
    }
  };

  const deleteTeam = async (participantId: string) => {
    setState("submitting");
    setFeedback("");

    try {
      const response = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setFeedback(payload.message ?? "Unable to delete team right now.");
        setState("idle");
        return;
      }

      setState("idle");
      setFeedback(payload.message ?? "Team deleted.");
      router.refresh();
    } catch {
      setState("idle");
      setFeedback("Unable to delete team right now.");
    }
  };

  return (
    <div className="space-y-3">
      {feedback && (
        <p className="text-sm font-medium border border-stone-300 bg-stone-50 px-3 py-2 rounded-sm text-stone-700">
          {feedback}
        </p>
      )}

      <ol className="space-y-2">
        {participants.map((participant) => (
          <li
            key={participant.id}
            className="border border-stone-300 bg-orange-50/60 rounded-sm px-3 py-3"
          >
            {editingId === participant.id ? (
              <div className="space-y-2">
                <input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full border-2 border-stone-500 bg-amber-50 text-stone-800 px-3 py-2 rounded-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(participant.id)}
                    disabled={state === "submitting"}
                    className="px-3 py-1.5 bg-red-700 text-amber-50 font-bold uppercase tracking-wide rounded-sm hover:bg-red-800 transition-colors disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    disabled={state === "submitting"}
                    className="px-3 py-1.5 border border-stone-600 text-stone-700 font-bold uppercase tracking-wide rounded-sm hover:bg-stone-100 transition-colors disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-800 truncate">{participant.name}</p>
                  <p className="text-xs uppercase tracking-wide font-bold text-stone-500">
                    {participant.score} pts
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(participant)}
                    disabled={state === "submitting"}
                    className="px-3 py-1.5 border border-stone-600 text-stone-700 font-bold uppercase tracking-wide rounded-sm hover:bg-stone-100 transition-colors disabled:opacity-60"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTeam(participant.id)}
                    disabled={state === "submitting"}
                    className="px-3 py-1.5 bg-red-700 text-amber-50 font-bold uppercase tracking-wide rounded-sm hover:bg-red-800 transition-colors disabled:opacity-60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}