// Password hashing for email + password sign-in. Uses Node's built-in
// scrypt (no external dependency): hash format "scrypt:<saltB64>:<hashB64>".

import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored) return false;
  const [scheme, saltB64, hashB64] = stored.split(":");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  try {
    const salt = Buffer.from(saltB64, "base64url");
    const expected = Buffer.from(hashB64, "base64url");
    const actual = scryptSync(password, salt, expected.length);
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** Shared local demo password for seeded users; overridable per environment. */
export function demoUserPassword(): string {
  return process.env.DEMO_USER_PASSWORD ?? "iltzam-demo";
}

export function demoAdminCredentials(): { email: string; password: string } {
  return {
    email: (process.env.DEMO_ADMIN_EMAIL ?? "platform.admin@iltzam.example").toLowerCase(),
    password: process.env.DEMO_ADMIN_PASSWORD ?? demoUserPassword(),
  };
}
