import "server-only"

import { cookies } from "next/headers"

import { COORDINATOR_COOKIE_NAME, verifyCoordinatorAccessToken } from "@/lib/coordinator-auth"

export async function getCoordinatorAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COORDINATOR_COOKIE_NAME)?.value ?? ""

  if (!token) {
    return null
  }

  return verifyCoordinatorAccessToken(token)
}

export async function hasCoordinatorAccess() {
  return Boolean(await getCoordinatorAccess())
}
