import {
  isVisitId,
  parseFinalPayload,
  parsePlace,
  parseUsedPayload,
} from "@/lib/usage";
import { recordFilters, recordPlace, recordSpin, recordVisit } from "@/lib/usage-store";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 120;
const MAX_BODY_BYTES = 4_000;

const hits = new Map<string, number[]>();

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
  try {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameSite(request)) {
    return Response.json({ error: "Send this from the site." }, { status: 403 });
  }
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return Response.json({ error: "Send JSON." }, { status: 415 });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return Response.json({ error: "That update is too large." }, { status: 413 });
  }
  if (isLimited(clientKey(request))) {
    return Response.json({ error: "Too many updates." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a usage update." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Send a usage update." }, { status: 400 });
  }
  const record = body as Record<string, unknown>;
  if (!isVisitId(record.id) || typeof record.type !== "string") {
    return Response.json({ error: "Send a usage update." }, { status: 400 });
  }

  try {
    if (record.type === "visit") {
      const saved = await recordVisit(record.id);
      if (!saved) return Response.json({ error: "Usage is not available right now." }, { status: 503 });
      return Response.json({ ok: true });
    }
    if (record.type === "spin") {
      const saved = await recordSpin(record.id, record.source === "shortlist");
      if (!saved) return Response.json({ error: "Usage is not available right now." }, { status: 503 });
      return Response.json({ ok: true });
    }
    if (record.type === "filters") {
      const used = parseUsedPayload(record.used);
      const finalFilters = parseFinalPayload(record.final);
      const resultCount = record.resultCount;
      if (!used || !finalFilters || typeof resultCount !== "number") {
        return Response.json({ error: "Send a usage update." }, { status: 400 });
      }
      if (!Number.isInteger(resultCount) || resultCount < 0 || resultCount > 500) {
        return Response.json({ error: "Send a usage update." }, { status: 400 });
      }
      const saved = await recordFilters(record.id, used, finalFilters, resultCount);
      if (!saved) return Response.json({ error: "Usage is not available right now." }, { status: 503 });
      return Response.json({ ok: true });
    }
    if (record.type === "place") {
      const place = parsePlace(record.place);
      if (!place) return Response.json({ error: "Send a usage update." }, { status: 400 });
      const saved = await recordPlace(record.id, place.source, place.lat, place.lng);
      if (!saved) return Response.json({ error: "Usage is not available right now." }, { status: 503 });
      return Response.json({ ok: true });
    }
  } catch {
    return Response.json({ error: "Could not save that update." }, { status: 500 });
  }

  return Response.json({ error: "Send a usage update." }, { status: 400 });
}
