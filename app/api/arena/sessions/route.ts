import { revalidatePath } from "next/cache"

import { createSession } from "@/lib/arena-service"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name : ""

  if (!name.trim()) {
    return Response.json({ error: "Session name is required" }, { status: 400 })
  }

  await createSession(name)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}