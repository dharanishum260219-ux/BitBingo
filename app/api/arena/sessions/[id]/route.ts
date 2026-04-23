import { revalidatePath } from "next/cache"

import { stopSession } from "@/lib/arena-service"

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await stopSession(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}