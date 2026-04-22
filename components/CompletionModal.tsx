"use client";

import { useEffect, useState } from "react";
import type { Challenge, Completion, Participant } from "@/types";

interface CompletionModalProps {
  isOpen: boolean;
  completion: Completion & { participant?: Participant; challenge?: Challenge } | null;
  onClose: () => void;
}

export default function CompletionModal({
  isOpen,
  completion,
  onClose,
}: CompletionModalProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    setImageError(false);
  }, [completion?.id]);

  if (!isOpen || !completion) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[rgba(10,6,4,0.55)] z-40" onClick={onClose} aria-hidden="true" />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="quest-panel w-full max-w-3xl max-h-[90vh] overflow-auto">
          <div className="sticky top-0 border-b-2 border-[var(--edge-soft)] bg-[var(--panel)]/95 p-5 flex items-center justify-between">
            <div>
              <h2 className="text-3xl leading-none text-[var(--ink-900)]">Submission Intel</h2>
              <p className="text-sm text-[var(--ink-700)] mt-1">
                Challenge: <span className="font-semibold">{completion.challenge?.title}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="quest-button px-3 py-1.5 text-xs"
            >
              Close
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="quest-inset p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-500)]">
                  Crew
                </p>
                <p className="text-2xl font-cursive text-[var(--ink-900)] mt-1">
                  {completion.participant?.name ?? "Unknown"}
                </p>
              </div>

              <div className="quest-inset p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-500)]">
                  Submitted
                </p>
                <p className="text-lg font-semibold text-[var(--ink-900)] mt-1">
                  {new Date(completion.created_at).toLocaleString()}
                </p>
              </div>

              {completion.challenge && (
                <div className="md:col-span-2 quest-inset p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-500)]">
                    Objective Notes
                  </p>
                  <p className="text-[var(--ink-700)] mt-2">{completion.challenge.description}</p>
                </div>
              )}
            </div>

            {completion.proof_url ? (
              <div className="quest-inset overflow-hidden bg-white/70">
                <div className="px-4 py-2 border-b border-[var(--edge-soft)] text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--ink-500)]">
                  Proof Capture
                </div>
                <div className="p-4 flex items-center justify-center min-h-[220px]">
                  {imageError ? (
                    <div className="text-center text-[var(--ink-500)]">
                      <p className="text-sm">Image preview failed.</p>
                      <a
                        href={completion.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-[var(--accent-a)] font-semibold text-sm"
                      >
                        Open proof in new tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={completion.proof_url}
                      alt="Proof of completion"
                      className="max-w-full max-h-[420px] rounded-lg object-contain border border-[var(--edge-soft)]"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="quest-inset p-6 text-center text-[var(--ink-500)]">
                No proof image was submitted for this completion.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
