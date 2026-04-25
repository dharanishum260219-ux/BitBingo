import { revalidatePath } from "next/cache"

import { deleteSession, stopSession } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const { id } = await params

  await stopSession(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const { id } = await params

  await deleteSession(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}