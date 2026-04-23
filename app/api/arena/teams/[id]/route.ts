import { revalidatePath } from "next/cache"

import { deleteTeam } from "@/lib/arena-service"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await deleteTeam(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}