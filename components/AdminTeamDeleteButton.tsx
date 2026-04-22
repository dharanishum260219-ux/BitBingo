"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface AdminTeamDeleteButtonProps {
  participantId: string;
  teamName: string;
}

export default function AdminTeamDeleteButton({
  participantId,
  teamName,
}: AdminTeamDeleteButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Delete team "${teamName}"? This removes its score and completions.`
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/participants/${participantId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "Unable to delete this team.");
        setSubmitting(false);
        return;
      }

      router.refresh();
    } catch {
      window.alert("Unable to delete this team.");
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={submitting}
      className="quest-button px-3 py-1.5 text-[11px] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {submitting ? "Deleting" : "Delete Team"}
    </button>
  );
}
