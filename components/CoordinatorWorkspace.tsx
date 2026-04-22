"use client";

import { useState } from "react";

import CoordinatorForm from "@/components/CoordinatorForm";
import TeamRegistrationForm from "@/components/TeamRegistrationForm";
import type { Challenge, Participant, Session } from "@/types";

interface CoordinatorWorkspaceProps {
  initialParticipants: Participant[];
  challenges: Challenge[];
  activeSession: Session;
}

export default function CoordinatorWorkspace({
  initialParticipants,
  challenges,
  activeSession,
}: CoordinatorWorkspaceProps) {
  const [participants, setParticipants] = useState<Participant[]>(
    [...initialParticipants].sort(
      (a, b) =>
        a.name.localeCompare(b.name) || a.created_at.localeCompare(b.created_at)
    )
  );

  const handleRegistered = (participant: Participant) => {
    setParticipants((current) => {
      const next = [...current.filter((item) => item.id !== participant.id), participant];

      return next.sort(
        (a, b) =>
          a.name.localeCompare(b.name) || a.created_at.localeCompare(b.created_at)
      );
    });
  };

  return (
    <>
      <p className="text-center text-xs uppercase tracking-[0.18em] text-[var(--ink-500)] mb-6">
        Active session: <strong className="text-[var(--ink-900)]">{activeSession.name}</strong>
      </p>

      <div className="quest-panel p-5 max-w-xl mx-auto mb-6">
        <div className="quest-inset p-4">
          <h2 className="text-center text-3xl text-[var(--ink-900)]">Crew Registration</h2>
          <p className="text-center text-xs uppercase tracking-[0.14em] text-[var(--ink-500)] mb-4">
            Add teams before logging runs
          </p>
          <TeamRegistrationForm sessionId={activeSession.id} onRegistered={handleRegistered} />
        </div>
      </div>

      <CoordinatorForm
        participants={participants}
        challenges={challenges}
        sessionId={activeSession.id}
      />
    </>
  );
}
