#!/usr/bin/env node

const isProduction = process.env.NODE_ENV === "production"

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

if (isProduction) {
  required.push("ADMIN_PORTAL_SECRET")
}

const missing = required.filter((name) => {
  const value = process.env[name]
  return typeof value !== "string" || value.trim().length === 0
})

if (missing.length > 0) {
  console.error("[deploy-preflight] Missing required environment variables:")
  for (const key of missing) {
    console.error(`- ${key}`)
  }
  process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
  console.error("[deploy-preflight] NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase https URL")
  process.exit(1)
}

console.log("[deploy-preflight] Environment validation passed")
