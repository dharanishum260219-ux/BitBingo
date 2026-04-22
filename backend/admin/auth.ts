import "server-only";

import crypto from "node:crypto";

import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "bitbingo_admin_access";

const DEV_ADMIN_SECRET = "bitbingo-dev-admin";

export function getAdminPasscode() {
  if (process.env.ADMIN_PORTAL_SECRET) {
    return process.env.ADMIN_PORTAL_SECRET;
  }

  return process.env.NODE_ENV === "production" ? "" : DEV_ADMIN_SECRET;
}

export function isAdminPortalConfigured() {
  return Boolean(getAdminPasscode());
}

export function isAdminBackendReady() {
  return Boolean(getAdminPasscode() && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isValidAdminPasscode(passcode: string) {
  const secret = getAdminPasscode();

  if (!secret || !passcode) {
    return false;
  }

  const secretBuffer = Buffer.from(secret);
  const passcodeBuffer = Buffer.from(passcode);

  if (secretBuffer.length !== passcodeBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(secretBuffer, passcodeBuffer);
}

export async function hasAdminAccess() {
  const secret = getAdminPasscode();

  if (!secret) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? "";

  return isValidAdminPasscode(token);
}