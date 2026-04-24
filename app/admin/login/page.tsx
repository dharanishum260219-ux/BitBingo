import Link from "next/link"
import { redirect } from "next/navigation"

import { hasAdminAccess, isAdminPortalConfigured } from "@/lib/admin-auth"

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; setup?: string }>
}) {
  if (await hasAdminAccess()) {
    redirect("/admin")
  }

  const params = await searchParams
  const showError = params.error === "1"
  const showSetupWarning = params.setup === "1" || !isAdminPortalConfigured()

  return (
    <main className="min-h-screen bg-amber-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-[#e8d9a0] border-4 border-stone-900 rounded-lg shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden">
        <div className="bg-stone-800 px-5 py-4">
          <p className="text-[10px] uppercase tracking-widest font-serif text-stone-400">Restricted Console</p>
          <h1 className="font-cursive text-3xl font-bold text-amber-100 mt-1">Admin Login</h1>
        </div>
        <div className="h-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600" />

        <div className="p-5 space-y-4">
          <p className="text-sm text-stone-700 font-serif">
            Enter the admin passcode to open Mission Control.
          </p>

          {showSetupWarning && (
            <p className="text-sm font-serif text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2">
              Admin auth is not configured. Set ADMIN_PORTAL_SECRET before production deployment.
            </p>
          )}

          {showError && (
            <p className="text-sm font-serif text-red-700 bg-red-100 border border-red-400 rounded px-3 py-2">
              Invalid passcode. Try again.
            </p>
          )}

          <form action="/admin/auth/login" method="post" className="space-y-4">
            <div>
              <label
                htmlFor="passcode"
                className="block font-serif font-bold text-[10px] uppercase tracking-widest text-stone-700 mb-1"
              >
                Admin Passcode
              </label>
              <input
                id="passcode"
                name="passcode"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 bg-white/70 border-2 border-stone-900 font-serif text-stone-800 placeholder-stone-400 focus:outline-none rounded-lg"
                placeholder="Enter passcode"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 border-2 rounded-lg px-4 py-3 transition-all cursor-pointer border-[#7a6130] bg-gradient-to-b from-[#d4a930] to-[#b8860b] text-white shadow-[0_3px_0_#5c4000] hover:shadow-[0_4px_0_#5c4000] font-serif font-bold uppercase tracking-wider text-sm"
            >
              Unlock Admin
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs uppercase tracking-widest font-serif text-stone-600 hover:text-stone-900 underline">
              Back to Arena
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
