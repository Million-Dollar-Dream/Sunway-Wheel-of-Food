import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!client) client = neon(url);
  return client;
}
