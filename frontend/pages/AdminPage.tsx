import Link from "next/link";

import AdminLoginForm from "@/frontend/components/AdminLoginForm";
import AdminSessionForm from "@/frontend/components/AdminSessionForm";
import AdminTeamRoster from "@/frontend/components/AdminTeamRoster";
import AdminTeamForm from "@/frontend/components/AdminTeamForm";
import { hasAdminAccess, isAdminPortalConfigured } from "@/backend/admin/auth";
import { getAdminParticipants } from "@/backend/admin/participants";
import { getAdminSessions } from "@/backend/admin/sessions";
import { isAdminBackendConfigured, isSupabaseConfigured } from "@/backend/supabase";

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string | string[];
    status?: string | string[];
  }>;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getAlertMessage(error?: string, status?: string) {
  switch (error) {
    case "invalid":
      return "Invalid admin passcode.";
    case "not-configured":
      return "Admin portal secrets are not configured yet.";
    case "unauthorized":
      return "Please sign in to access the admin portal.";
    case "missing-name":
      return "Enter a session name before creating a new session.";
    case "create-failed":
      return "Unable to create a new session right now.";
    default:
      break;
  }

  switch (status) {
    case "logged-out":
      return "You have been signed out.";
    case "session-created":
      return "Session created and activated.";
    default:
      return "";
  }
}

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const error = getQueryValue(resolvedSearchParams.error);
  const status = getQueryValue(resolvedSearchParams.status);
  const message = getAlertMessage(error, status);
  const portalConfigured = isAdminPortalConfigured();
  const isConfigured = isSupabaseConfigured() && isAdminBackendConfigured();
  const hasAccess = portalConfigured ? await hasAdminAccess() : false;

  const { sessions, activeSession, error: sessionsError } = hasAccess
    ? await getAdminSessions()
    : { sessions: [], activeSession: null, error: null };

  const { participants, activeSession: participantSession, error: participantsError } =
    hasAccess
      ? await getAdminParticipants()
      : { participants: [], activeSession: null, error: null };

  return (
    <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-red-700 italic transition-colors"
        >
          ← Back to the Map
        </Link>
      </div>

      {!isConfigured ? (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚠</p>
          <p className="text-xl font-bold text-stone-800 mb-2">
            Supabase Not Configured
          </p>
          <p className="text-stone-600 italic text-sm">
            Copy <code className="font-mono">.env.local.example</code> to{" "}
            <code className="font-mono">.env.local</code> and add your Supabase
            URL and anon key to enable session creation.
          </p>
        </div>
      ) : !hasAccess ? (
        <>
          <AdminLoginForm message={message || undefined} />
          <p className="mt-4 text-center text-xs text-stone-500 italic">
            The portal is protected by a shared secret stored on the server.
          </p>
        </>
      ) : (
        <div className="space-y-6">
          <section className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold text-stone-900 tracking-wide uppercase mb-1">
                  ⚓ Admin Portal
                </h1>
                <p className="text-sm italic text-stone-600">
                  Create and activate competition sessions
                </p>
              </div>
              <form action="/api/admin/logout" method="post">
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-stone-700 text-stone-700 font-bold uppercase tracking-wide rounded-sm hover:bg-stone-700 hover:text-amber-50 transition-colors"
                >
                  Sign Out
                </button>
              </form>
            </div>

            {message && (
              <p className="mt-4 text-sm font-medium border border-emerald-300 bg-emerald-50 px-3 py-2 rounded-sm text-emerald-800">
                {message}
              </p>
            )}
            {sessionsError && (
              <p className="mt-4 text-sm font-medium border border-red-300 bg-red-50 px-3 py-2 rounded-sm text-red-700">
                {sessionsError}
              </p>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg space-y-3">
              <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide">
                Current Session
              </h2>
              {activeSession ? (
                <div className="space-y-1 text-stone-700">
                  <p className="text-lg font-semibold text-stone-900">
                    {activeSession.name}
                  </p>
                  <p className="text-sm italic">Active since {activeSession.created_at}</p>
                  <p className="text-xs uppercase tracking-wide text-red-700 font-bold">
                    Active
                  </p>
                </div>
              ) : (
                <p className="text-stone-600 italic text-sm">
                  No active session yet.
                </p>
              )}
            </div>

            <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg space-y-3">
              <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide">
                Create Session
              </h2>
              <AdminSessionForm message={error === "create-failed" ? message : undefined} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg space-y-3">
              <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide">
                Register Team
              </h2>
              {participantSession ? (
                <>
                  <p className="text-xs italic text-stone-500">
                    Registering teams for <strong>{participantSession.name}</strong>
                  </p>
                  <AdminTeamForm sessionId={participantSession.id} />
                </>
              ) : (
                <p className="text-stone-600 italic text-sm">
                  Create an active session first, then register teams.
                </p>
              )}
            </div>

            <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg space-y-3">
              <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide">
                Registered Teams
              </h2>
              {participantsError ? (
                <p className="text-sm font-medium border border-red-300 bg-red-50 px-3 py-2 rounded-sm text-red-700">
                  {participantsError}
                </p>
              ) : participants.length === 0 ? (
                <p className="text-stone-600 italic text-sm">
                  No teams registered yet.
                </p>
              ) : (
                <AdminTeamRoster participants={participants} />
              )}
            </div>
          </section>

          <section className="border-double border-4 border-stone-600 bg-amber-50/80 p-6 rounded-sm shadow-lg">
            <h2 className="text-xl font-bold text-stone-900 uppercase tracking-wide mb-4">
              Session History
            </h2>
            {sessions.length === 0 ? (
              <p className="text-stone-600 italic text-sm">
                No sessions have been created yet.
              </p>
            ) : (
              <ol className="space-y-2">
                {sessions.map((session) => (
                  <li
                    key={session.id}
                    className="flex items-center justify-between gap-3 border border-stone-300 bg-orange-50/60 rounded-sm px-3 py-2"
                  >
                    <span className="font-semibold text-stone-800 truncate">
                      {session.name}
                    </span>
                    <span
                      className={[
                        "text-xs uppercase tracking-wide font-bold",
                        session.is_active ? "text-red-700" : "text-stone-500",
                      ].join(" ")}
                    >
                      {session.is_active ? "Active" : "Archived"}
                    </span>
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