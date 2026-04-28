const textEncoder = new TextEncoder()

const COORDINATOR_PASSWORD_ITERATIONS = 120000
const COORDINATOR_PASSWORD_SALT_BYTES = 16
const COORDINATOR_PASSWORD_HASH_BYTES = 32
const COORDINATOR_TOKEN_SECRET = process.env.COORDINATOR_PORTAL_SECRET ?? (process.env.NODE_ENV === "production" ? "" : "bitbingo-dev-coordinator")

export const COORDINATOR_COOKIE_NAME = "bitbingo_coordinator_access"

export interface CoordinatorAccessToken {
  sessionId: string
  usn: string
  issuedAt: number
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ""

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "===".slice((normalized.length + 3) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false
  }

  let result = 0
  for (let index = 0; index < left.length; index += 1) {
    result |= left[index] ^ right[index]
  }

  return result === 0
}

async function derivePasswordBits(password: string, salt: BufferSource, iterations: number) {
  const keyMaterial = await crypto.subtle.importKey("raw", textEncoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    COORDINATOR_PASSWORD_HASH_BYTES * 8,
  )

  return new Uint8Array(derivedBits)
}

async function signCoordinatorMessage(message: string) {
  const key = await crypto.subtle.importKey("raw", textEncoder.encode(COORDINATOR_TOKEN_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(message))
  return bytesToBase64Url(new Uint8Array(signature))
}

export function normalizeCoordinatorUsn(usn: string) {
  return usn.trim().toUpperCase()
}

export async function hashCoordinatorPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(COORDINATOR_PASSWORD_SALT_BYTES))
  const derivedBits = await derivePasswordBits(password, salt, COORDINATOR_PASSWORD_ITERATIONS)

  return [
    "pbkdf2-sha256",
    String(COORDINATOR_PASSWORD_ITERATIONS),
    bytesToBase64Url(salt),
    bytesToBase64Url(derivedBits),
  ].join("$")
}

export async function verifyCoordinatorPassword(password: string, storedHash: string) {
  const [algorithm, iterationsRaw, saltRaw, hashRaw] = storedHash.split("$")

  if (algorithm !== "pbkdf2-sha256") {
    return false
  }

  const iterations = Number(iterationsRaw)
  if (!Number.isFinite(iterations) || iterations <= 0 || !saltRaw || !hashRaw) {
    return false
  }

  const salt = base64UrlToBytes(saltRaw)
  const expectedHash = base64UrlToBytes(hashRaw)
  const derivedBits = await derivePasswordBits(password, salt, iterations)

  return constantTimeEqual(derivedBits, expectedHash)
}

export async function createCoordinatorAccessToken(payload: CoordinatorAccessToken) {
  const message = bytesToBase64Url(textEncoder.encode(JSON.stringify(payload)))
  const signature = await signCoordinatorMessage(message)
  return `${message}.${signature}`
}

export async function verifyCoordinatorAccessToken(token: string) {
  const [message, signature] = token.split(".")

  if (!message || !signature || !COORDINATOR_TOKEN_SECRET) {
    return null
  }

  const expectedSignature = await signCoordinatorMessage(message)
  if (!constantTimeEqual(textEncoder.encode(signature), textEncoder.encode(expectedSignature))) {
    return null
  }

  try {
    const decoded = JSON.parse(new TextDecoder().decode(base64UrlToBytes(message))) as Partial<CoordinatorAccessToken>
    if (typeof decoded.sessionId !== "string" || typeof decoded.usn !== "string" || !Number.isFinite(decoded.issuedAt)) {
      return null
    }

    return {
      sessionId: decoded.sessionId,
      usn: decoded.usn,
      issuedAt: Number(decoded.issuedAt),
    }
  } catch {
    return null
  }
}
