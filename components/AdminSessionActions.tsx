"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminSessionActionsProps {
  sessionId: string;
  sessionName: string;
  isActive: boolean;
}

export default function AdminSessionActions({
  sessionId,
  sessionName,
  isActive,
}: AdminSessionActionsProps) {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const stopSession = async () => {
    const confirmed = window.confirm(
      `Stop running session "${sessionName}"? It will be archived.`
    );

    if (!confirmed) {
      return;
    }

    setStopping(true);

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "PATCH",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "Unable to stop this session.");
        setStopping(false);
        return;
      }

      router.refresh();
    } catch {
      window.alert("Unable to stop this session.");
      setStopping(false);
    }
  };

  const deleteSession = async () => {
    const confirmed = window.confirm(
      `Delete archived session "${sessionName}"? This removes related teams and completions.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "Unable to delete this session.");
        setDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      window.alert("Unable to delete this session.");
      setDeleting(false);
    }
  };

  if (isActive) {
    return (
      <button
        type="button"
        onClick={stopSession}
        disabled={stopping}
        className="quest-button px-3 py-1.5 text-[11px] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {stopping ? "Stopping" : "Stop Session"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={deleteSession}
      disabled={deleting}
      className="quest-button px-3 py-1.5 text-[11px] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {deleting ? "Deleting" : "Delete Archived"}
    </button>
  );
}
