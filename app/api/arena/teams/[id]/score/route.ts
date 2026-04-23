import { revalidatePath } from "next/cache"

import { awardPoint } from "@/lib/arena-service"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await awardPoint(id)
  revalidatePath("/")
  revalidatePath("/coordinator")
  revalidatePath("/admin")

  return Response.json({ ok: true })
}