"use server";

import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_MAX_AGE,
  adminCookieOptions,
  createAdminSession,
  verifyAdminPassword,
} from "@/lib/admin-auth";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;
const failures = new Map<string, number[]>();

function clientIp(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headerList.get("x-real-ip") ?? "unknown";
}

function limited(ip: string) {
  const now = Date.now();
  const recent = (failures.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  failures.set(ip, recent);
  return recent.length >= MAX_FAILURES;
}

function noteFailure(ip: string) {
  const now = Date.now();
  const recent = (failures.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  recent.push(now);
  failures.set(ip, recent);
}

function sameSite(headerList: Headers) {
  const origin = headerList.get("origin");
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function login(formData: FormData) {
  const headerList = await headers();
  const password = formData.get("password");
  if (!sameSite(headerList)) redirect("/admin?error=1");
  const ip = clientIp(headerList);
  if (limited(ip)) redirect("/admin?error=1");
  const ok =
    typeof password === "string" && (await verifyAdminPassword(password));
  if (!ok) {
    noteFailure(ip);
    redirect("/admin?error=1");
  }
  const token = createAdminSession();
  if (!token) redirect("/admin?error=1");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, adminCookieOptions(ADMIN_COOKIE_MAX_AGE));
  redirect("/admin");
}

export async function logout() {
  const headerList = await headers();
  if (!sameSite(headerList)) redirect("/admin");
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", adminCookieOptions(0));
  redirect("/admin");
}
