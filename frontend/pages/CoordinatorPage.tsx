import Link from "next/link";

import { hasAdminAccess } from "@/backend/admin/auth";
import { getCoordinatorData } from "@/backend/coordinator/data";
import AdminLoginForm from "@/frontend/components/AdminLoginForm";
import CoordinatorForm from "@/frontend/components/CoordinatorForm";

export const dynamic = "force-dynamic";

export default async function CoordinatorPage() {
  const hasAccess = await hasAdminAccess();
  const data = hasAccess ? await getCoordinatorData() : null;

  return (
    <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Link
          href="/"
          className="text-sm text-stone-500 hover:text-red-700 italic transition-colors"
        >
          ← Back to the Map
        </Link>
        <Link
          href="/admin"
          className="text-sm text-stone-500 hover:text-red-700 italic transition-colors"
        >
          Open Admin Portal →
        </Link>
      </div>

      {!hasAccess ? (
        <>
          <AdminLoginForm message="Sign in to access coordinator tools." />
          <p className="mt-4 text-center text-xs text-stone-500 italic">
            Coordinator tools are protected by the same portal passcode.
          </p>
        </>
      ) : !data?.isConfigured ? (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚠</p>
          <p className="text-xl font-bold text-stone-800 mb-2">Supabase Not Configured</p>
          <p className="text-stone-600 italic text-sm">
            Add your Supabase URL and anon key in .env.local.
          </p>
        </div>
      ) : data.error ? (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚠</p>
          <p className="text-xl font-bold text-stone-800 mb-2">Unable to Load Coordinator Data</p>
          <p className="text-stone-600 italic text-sm">{data.error}</p>
        </div>
      ) : !data.activeSession ? (
        <div className="border-double border-4 border-stone-600 bg-amber-50/80 p-8 rounded-sm text-center shadow-lg">
          <p className="text-2xl mb-2">⚓</p>
          <p className="text-xl font-bold text-stone-800 mb-2">No Active Session</p>
          <p className="text-stone-600 italic text-sm">
            Create and activate a session in the Admin Portal before logging completions.
          </p>
        </div>
      ) : (
        <>
          <p className="text-center text-xs text-stone-500 italic mb-6">
            Active session: <strong className="text-stone-700">{data.activeSession.name}</strong>
          </p>
          <CoordinatorForm
            participants={data.participants}
            challenges={data.challenges}
            sessionId={data.activeSession.id}
          />
        </>
      )}
    </main>
  );
}