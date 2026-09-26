import { getSql } from "@/lib/db";
import {
  mergeUsed,
  readUsed,
  type FiltersFinal,
  type FiltersUsed,
  type PlaceSource,
} from "@/lib/usage";

let tableReady = false;

export type UsageSessionRow = {
  id: string;
  started_at: string | Date;
  spin_count: number;
  shortlist_spins: number;
  filters_used: unknown;
  filters_final: unknown;
  location_source: string | null;
  lat: number | null;
  lng: number | null;
};

async function ensureTable(sql: NonNullable<ReturnType<typeof getSql>>) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS usage_sessions (
      id uuid PRIMARY KEY,
      started_at timestamptz NOT NULL DEFAULT now(),
      last_seen_at timestamptz NOT NULL DEFAULT now(),
      spin_count integer NOT NULL DEFAULT 0 CHECK (spin_count >= 0),
      shortlist_spins integer NOT NULL DEFAULT 0 CHECK (shortlist_spins >= 0),
      filters_used jsonb NOT NULL DEFAULT '{}'::jsonb,
      filters_final jsonb NOT NULL DEFAULT '{}'::jsonb,
      location_source text CHECK (
        location_source IS NULL OR location_source IN ('gps', 'pyramid', 'geo', 'pjs', 'center', 'pin')
      ),
      lat double precision,
      lng double precision,
      result_count integer
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS usage_sessions_started_at_idx
    ON usage_sessions (started_at DESC)
  `;
  tableReady = true;
}

function jsonValue(value: unknown) {
  return JSON.stringify(value);
}

export async function recordVisit(id: string) {
  const sql = getSql();
  if (!sql) return false;
  await ensureTable(sql);
  await sql`
    INSERT INTO usage_sessions (id)
    VALUES (${id}::uuid)
    ON CONFLICT (id) DO UPDATE SET last_seen_at = now()
  `;
  return true;
}

export async function recordSpin(id: string, fromShortlist: boolean) {
  const sql = getSql();
  if (!sql) return false;
  await ensureTable(sql);
  const shortlist = fromShortlist ? 1 : 0;
  await sql`
    INSERT INTO usage_sessions (id, spin_count, shortlist_spins)
    VALUES (${id}::uuid, 1, ${shortlist})
    ON CONFLICT (id) DO UPDATE SET
      spin_count = usage_sessions.spin_count + 1,
      shortlist_spins = usage_sessions.shortlist_spins + ${shortlist},
      last_seen_at = now()
  `;
  return true;
}

export async function recordFilters(
  id: string,
  incoming: FiltersUsed,
  finalFilters: FiltersFinal,
  resultCount: number,
) {
  const sql = getSql();
  if (!sql) return false;
  await ensureTable(sql);
  const existing = await sql`
    SELECT filters_used FROM usage_sessions WHERE id = ${id}::uuid
  `;
  const merged = mergeUsed(readUsed(existing[0]?.filters_used), incoming);
  await sql`
    INSERT INTO usage_sessions (id, filters_used, filters_final, result_count)
    VALUES (
      ${id}::uuid,
      ${jsonValue(merged)}::jsonb,
      ${jsonValue(finalFilters)}::jsonb,
      ${resultCount}
    )
    ON CONFLICT (id) DO UPDATE SET
      filters_used = EXCLUDED.filters_used,
      filters_final = EXCLUDED.filters_final,
      result_count = EXCLUDED.result_count,
      last_seen_at = now()
  `;
  return true;
}

export async function recordPlace(
  id: string,
  source: PlaceSource,
  lat: number,
  lng: number,
) {
  const sql = getSql();
  if (!sql) return false;
  await ensureTable(sql);
  await sql`
    INSERT INTO usage_sessions (id, location_source, lat, lng)
    VALUES (${id}::uuid, ${source}, ${lat}, ${lng})
    ON CONFLICT (id) DO UPDATE SET
      location_source = EXCLUDED.location_source,
      lat = EXCLUDED.lat,
      lng = EXCLUDED.lng,
      last_seen_at = now()
  `;
  return true;
}

export async function listUsageSessions(since: Date) {
  const sql = getSql();
  if (!sql) return null;
  await ensureTable(sql);
  const rows = await sql`
    SELECT
      id,
      started_at,
      spin_count,
      shortlist_spins,
      filters_used,
      filters_final,
      location_source,
      lat,
      lng
    FROM usage_sessions
    WHERE started_at >= ${since.toISOString()}
    ORDER BY started_at DESC
    LIMIT 2000
  `;
  return rows as UsageSessionRow[];
}
