export function getPublicOrigin(request: { url: string; headers: Headers }) {
  const origin = request.headers.get("origin")?.trim()
  if (origin) {
    return origin
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim()
  const forwardedHost = request.headers.get("x-forwarded-host")?.trim()
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  if (forwardedHost) {
    const fallbackProto = forwardedProto || new URL(request.url).protocol.replace(":", "")
    return `${fallbackProto}://${forwardedHost}`
  }

  return new URL(request.url).origin
}

export function buildPublicUrl(request: { url: string; headers: Headers }, pathname: string) {
  return new URL(pathname, getPublicOrigin(request))
}