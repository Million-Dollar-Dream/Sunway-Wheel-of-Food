import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "sunway_admin";
const SESSION_MS = 12 * 60 * 60 * 1000;

function unquote(value: string) {
  if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1);
  }
  return value;
}

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const value = unquote(secret);
  if (value.length < 32) return null;
  return value;
}

export async function verifyAdminPassword(password: string) {
  if (password.length < 1 || password.length > 200) return false;
  const raw = process.env.ADMIN_PASSWORD_HASH;
  const stored = raw ? unquote(raw) : raw;
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (N !== 16384 || r !== 8 || p !== 1) return false;
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length < 16 || expected.length < 16) return false;
  const actual = scryptSync(password, salt, expected.length, { N, r, p });
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function sign(body: string, secret: string) {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export function createAdminSession() {
  const secret = authSecret();
  if (!secret) return null;
  const body = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_MS }),
  ).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function readAdminSession(token: string | undefined) {
  const secret = authSecret();
  if (!secret || !token) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body, secret);
  const actualBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      exp?: unknown;
    };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_MS / 1000;
