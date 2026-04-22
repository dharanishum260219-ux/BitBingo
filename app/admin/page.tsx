import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

import AdminLoginForm from "@/components/AdminLoginForm";
import AdminLogoutButton from "@/components/AdminLogoutButton";
import AdminSessionActions from "@/components/AdminSessionActions";
import AdminSessionForm from "@/components/AdminSessionForm";
import AdminTeamDeleteButton from "@/components/AdminTeamDeleteButton";
import AdminTeamForm from "@/components/AdminTeamForm";
import { hasAdminAccess, isAdminPortalConfigured } from "@/lib/admin-auth";
import type { Participant, Session } from "@/types";

function getServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const configured = isAdminPortalConfigured();
  const access = configured ? await hasAdminAccess() : false;
  const db = getServerSupabase();

  let sessions: Session[] = [];
  let activeSession: Session | null = null;
  let participants: Participant[] = [];

  if (access && db) {
    const sessionsResult = await db
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false });

    sessions = (sessionsResult.data ?? []) as Session[];
    activeSession = sessions.find((session) => session.is_active) ?? null;

    if (activeSession) {
      const participantsResult = await db
        .from("participants")
        .select("*")
        .eq("session_id", activeSession.id)
        .order("name");

      participants = (participantsResult.data ?? []) as Participant[];
    }
  }

  return (
    <main className="page-enter flex-1 w-full max-w-6xl mx-auto px-4 py-8 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link href="/" className="quest-button px-4 py-2 text-xs">
          Back to Arena
        </Link>
        <Link href="/coordinator" className="quest-button px-4 py-2 text-xs">
          Open Coordinator
        </Link>
      </div>

      {!configured ? (
        <div className="quest-panel p-8 text-center">
          <p className="text-3xl text-[var(--accent-b)]">Admin Portal Not Configured</p>
          <p className="text-[var(--ink-700)] mt-2">
            Set ADMIN_PORTAL_SECRET in .env.local and restart the server.
          </p>
        </div>
      ) : !access ? (
        <AdminLoginForm />
      ) : (
        <div className="space-y-6">
          <section className="quest-panel p-6">
            <div className="quest-inset p-4 md:p-5 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-4xl leading-none text-[var(--ink-900)]">Mission Control</h1>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--ink-500)] mt-1">
                  Session and roster management
                </p>
              </div>
              <AdminLogoutButton />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="quest-panel p-5 space-y-3">
              <h2 className="text-3xl leading-none text-[var(--ink-900)]">Current Session</h2>
              {activeSession ? (
                <div className="quest-inset p-4 space-y-2 text-[var(--ink-700)]">
                  <p className="text-xl text-[var(--ink-900)] font-semibold">{activeSession.name}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--accent-b)] font-semibold">
                    Active
                  </p>
                  <div className="pt-1">
                    <AdminSessionActions
                      sessionId={activeSession.id}
                      sessionName={activeSession.name}
                      isActive
                    />
                  </div>
                </div>
              ) : (
                <p className="quest-inset p-4 text-[var(--ink-500)]">No active session yet.</p>
              )}
            </div>

            <div className="quest-panel p-5">
              <h2 className="text-3xl leading-none text-[var(--ink-900)] mb-3">Create Session</h2>
              <AdminSessionForm />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="quest-panel p-5">
              <h2 className="text-3xl leading-none text-[var(--ink-900)] mb-3">Register Team</h2>
              {activeSession ? (
                <AdminTeamForm sessionId={activeSession.id} />
              ) : (
                <p className="quest-inset p-4 text-[var(--ink-500)]">
                  Create and activate a session first.
                </p>
              )}
            </div>

            <div className="quest-panel p-5">
              <h2 className="text-3xl leading-none text-[var(--ink-900)] mb-3">Active Roster</h2>
              {participants.length === 0 ? (
                <p className="quest-inset p-4 text-[var(--ink-500)]">No teams registered yet.</p>
              ) : (
                <ol className="space-y-2">
                  {participants.map((participant) => (
                    <li
                      key={participant.id}
                      className="quest-inset px-3 py-2 flex items-center justify-between gap-3"
                    >
                      <span className="font-semibold text-[var(--ink-900)] truncate">
                        {participant.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-[0.12em] font-semibold text-[var(--ink-500)]">
                          {participant.score} pts
                        </span>
                        <AdminTeamDeleteButton
                          participantId={participant.id}
                          teamName={participant.name}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </section>

          <section className="quest-panel p-5">
            <h2 className="text-3xl leading-none text-[var(--ink-900)] mb-3">Session History</h2>
            {sessions.length === 0 ? (
              <p className="quest-inset p-4 text-[var(--ink-500)]">No sessions have been created yet.</p>
            ) : (
              <ol className="space-y-2">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="quest-inset px-3 py-2 flex items-center justify-between gap-3"
                  >
                    <span className="font-semibold text-[var(--ink-900)] truncate">
                      {session.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={[
                          "text-xs uppercase tracking-[0.12em] font-semibold",
                          session.is_active
                            ? "text-[var(--accent-b)]"
                            : "text-[var(--ink-500)]",
                        ].join(" ")}
                      >
                        {session.is_active ? "Active" : "Archived"}
                      </span>
                      <AdminSessionActions
                        sessionId={session.id}
                        sessionName={session.name}
                        isActive={session.is_active}
                      />
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
