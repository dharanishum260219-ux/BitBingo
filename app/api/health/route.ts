import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""

export async function GET() {
  const missingEnv: string[] = []

  if (!SUPABASE_URL) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_URL")
  }

  if (!SUPABASE_ANON_KEY) {
    missingEnv.push("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }

  if (missingEnv.length > 0) {
    return Response.json(
      {
        ok: false,
        status: "degraded",
        missingEnv,
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }

  try {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { error } = await client.from("sessions").select("id").limit(1)

    if (error) {
      return Response.json(
        {
          ok: false,
          status: "degraded",
          dependency: "supabase",
          message: error.message,
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      )
    }

    return Response.json({
      ok: true,
      status: "healthy",
      dependency: "supabase",
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "degraded",
        dependency: "supabase",
        message: error instanceof Error ? error.message : "Unknown health check error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    )
  }
}
