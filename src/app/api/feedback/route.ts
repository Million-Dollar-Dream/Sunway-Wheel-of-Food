import { getSql } from "@/lib/db";
import { parseFeedback } from "@/lib/feedback";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;
const MAX_BODY_BYTES = 8_000;

const hits = new Map<string, number[]>();
let tableReady = false;

function clientKey(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || "unknown";
}

function isLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_HITS) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5_000) {
    const oldest = hits.keys().next().value;
    if (oldest) hits.delete(oldest);
  }
  return false;
}

function sameSite(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  return originHost === host;
}

async function ensureTable(sql: NonNullable<ReturnType<typeof getSql>>) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS feedback (
      id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      created_at timestamptz NOT NULL DEFAULT now(),
      kind text NOT NULL CHECK (kind IN ('wrong-place', 'idea', 'other')),
      message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 1000),
      restaurant_id text
    )
  `;
  tableReady = true;
}

export async function POST(request: Request) {
  if (!sameSite(request)) {
    return Response.json({ error: "Submit this note from the site." }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json({ error: "Send the note as JSON." }, { status: 415 });
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "That note is too long." }, { status: 413 });
  }

  if (isLimited(clientKey(request))) {
    return Response.json(
      { error: "Too many notes. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a note to submit." }, { status: 400 });
  }

  const parsed = parseFeedback(body);
  if (parsed === "honeypot") {
    return Response.json({ ok: true });
  }
  if (typeof parsed === "string") {
    return Response.json({ error: parsed }, { status: 400 });
  }

  const sql = getSql();
  if (!sql) {
    return Response.json(
      { error: "Feedback is not available right now." },
      { status: 503 },
    );
  }

  try {
    await ensureTable(sql);
    await sql`
      INSERT INTO feedback (kind, message, restaurant_id)
      VALUES (${parsed.kind}, ${parsed.message}, ${parsed.restaurantId})
    `;
  } catch {
    return Response.json(
      { error: "Could not save that note. Try again." },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
