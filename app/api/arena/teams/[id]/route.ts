import { revalidatePath } from "next/cache"

import { deleteTeam } from "@/lib/arena-service"
import { ensureAdminAccess } from "@/lib/require-admin"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await ensureAdminAccess()
  if (unauthorized) {
    return unauthorized
  }

  const { id } = await params

  await deleteTeam(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}