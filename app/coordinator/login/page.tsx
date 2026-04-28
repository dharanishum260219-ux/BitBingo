import Link from "next/link"
import { redirect } from "next/navigation"

import { FantasyBackground } from "@/components/fantasy-background"
import { getArenaSnapshot } from "@/lib/arena-service"
import { getCoordinatorAccess } from "@/lib/coordinator-session"

export default async function CoordinatorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>
}) {
  const access = await getCoordinatorAccess()
  if (access) {
    redirect(`/coordinator?session_id=${encodeURIComponent(access.sessionId)}`)
  }

  const params = await searchParams
  const showError = params.error === "1"
  const showSetupWarning = params.setup === "1"
  const snapshot = await getArenaSnapshot()
  const sessions = snapshot.sessions

  return (
    <FantasyBackground>
      <main className="min-h-screen px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-lg bg-[#e8d9a0] border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
          <div className="bg-stone-800 px-5 py-4">
            <p className="text-[10px] uppercase tracking-widest font-serif text-stone-400">Coordinator Access</p>
            <h1 className="font-cursive text-3xl font-bold text-amber-100 mt-1">Coordinator Login</h1>
          </div>
          <div className="h-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-600" />

          <div className="p-5 space-y-4">
            <p className="text-sm text-stone-700 font-serif">
              Choose your session, then enter the USN and session password assigned to that session.
            </p>

            {showSetupWarning && (
              <p className="text-sm font-serif text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2">
                Coordinator auth is not configured. Add a session password and coordinator USNs when creating the session.
              </p>
            )}

            {showError && (
              <p className="text-sm font-serif text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2">
                Invalid session, USN, or password.
              </p>
            )}

            {sessions.length === 0 ? (
              <p className="text-sm font-serif text-stone-700 bg-amber-50 border border-stone-300 rounded px-3 py-2">
                No sessions are available yet.
              </p>
            ) : (
              <form action="/coordinator/auth/login" method="post" className="space-y-4">
                <div>
                  <label
                    htmlFor="sessionId"
                    className="block font-serif font-bold text-[10px] uppercase tracking-widest text-stone-700 mb-1"
                  >
                    Session
                  </label>
                  <select
                    id="sessionId"
                    name="sessionId"
                    required
                    defaultValue={sessions[0]?.id ?? ""}
                    className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 focus:outline-none focus:bg-amber-100/70 transition-colors"
                  >
                    {sessions.map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name} {session.status === "Active" ? "(Active)" : "(Stopped)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="usn"
                    className="block font-serif font-bold text-[10px] uppercase tracking-widest text-stone-700 mb-1"
                  >
                    Coordinator USN
                  </label>
                  <input
                    id="usn"
                    name="usn"
                    type="text"
                    autoComplete="username"
                    required
                    className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors"
                    placeholder="1BM23CS001"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block font-serif font-bold text-[10px] uppercase tracking-widest text-stone-700 mb-1"
                  >
                    Session Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="w-full px-4 py-3 bg-white/70 border-b-4 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none focus:bg-amber-100/70 transition-colors"
                    placeholder="Enter session password"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center gap-2 border-2 border-stone-900 rounded-lg px-4 py-3 bg-gradient-to-b from-amber-500 to-amber-600 text-white font-serif font-bold shadow-[0_3px_0_rgba(0,0,0,0.6)] hover:-translate-y-0.5 transition-all"
                >
                  ENTER COORDINATOR DECK
                </button>
              </form>
            )}

            <div className="pt-2 flex items-center justify-between text-xs uppercase tracking-widest font-serif text-stone-600">
              <Link href="/" className="hover:text-stone-900 transition-colors">
                Back to Arena
              </Link>
              <Link href="/admin" className="hover:text-stone-900 transition-colors">
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </main>
    </FantasyBackground>
  )
}
