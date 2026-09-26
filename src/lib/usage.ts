import { AREA_PINS, CUISINES, MOODS, type MoodId } from "@/data/restaurants";
import {
  DEFAULT_RADIUS_M,
  haversineMeters,
  SUNWAY_CENTER,
  type Coordinates,
} from "@/lib/geo";
import type { Filters } from "@/lib/filter-restaurants";

export const PLACE_SOURCES = [
  "gps",
  "pyramid",
  "geo",
  "pjs",
  "center",
  "pin",
] as const;

export type PlaceSource = (typeof PLACE_SOURCES)[number];

export type FiltersUsed = {
  cuisines: string[];
  moods: MoodId[];
  budgets: number[];
  porkFree: boolean;
  vegetarian: boolean;
  searched: boolean;
  radiusChanged: boolean;
};

export type FiltersFinal = {
  cuisines: string[];
  mood: MoodId | null;
  budget: number;
  porkFree: boolean;
  vegetarian: boolean;
  searched: boolean;
  maxDistanceM: number;
};

const cuisineSet = new Set<string>(CUISINES);
const moodSet = new Set<string>(MOODS.map((mood) => mood.id));

export const EMPTY_USED: FiltersUsed = {
  cuisines: [],
  moods: [],
  budgets: [],
  porkFree: false,
  vegetarian: false,
  searched: false,
  radiusChanged: false,
};

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVisitId(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

export function usedFromFilters(filters: Filters): FiltersUsed {
  return {
    cuisines: filters.cuisine.filter((cuisine) => cuisineSet.has(cuisine)),
    moods: filters.mood && moodSet.has(filters.mood) ? [filters.mood] : [],
    budgets: filters.budget === 0 ? [] : [filters.budget],
    porkFree: filters.porkFree,
    vegetarian: filters.vegetarian,
    searched: filters.query.trim().length > 0,
    radiusChanged: filters.maxDistanceM !== DEFAULT_RADIUS_M,
  };
}

export function finalFromFilters(filters: Filters): FiltersFinal {
  const used = usedFromFilters(filters);
  return {
    cuisines: used.cuisines,
    mood: used.moods[0] ?? null,
    budget: filters.budget,
    porkFree: filters.porkFree,
    vegetarian: filters.vegetarian,
    searched: used.searched,
    maxDistanceM: filters.maxDistanceM,
  };
}

export function mergeUsed(previous: FiltersUsed, next: FiltersUsed): FiltersUsed {
  return {
    cuisines: [...new Set([...previous.cuisines, ...next.cuisines])],
    moods: [...new Set([...previous.moods, ...next.moods])],
    budgets: [...new Set([...previous.budgets, ...next.budgets])].sort((a, b) => a - b),
    porkFree: previous.porkFree || next.porkFree,
    vegetarian: previous.vegetarian || next.vegetarian,
    searched: previous.searched || next.searched,
    radiusChanged: previous.radiusChanged || next.radiusChanged,
  };
}

export function usedAny(used: FiltersUsed) {
  return (
    used.cuisines.length > 0 ||
    used.moods.length > 0 ||
    used.budgets.length > 0 ||
    used.porkFree ||
    used.vegetarian ||
    used.searched ||
    used.radiusChanged
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function readUsed(value: unknown): FiltersUsed {
  const record = asRecord(value);
  if (!record) return { ...EMPTY_USED };
  const cuisines = Array.isArray(record.cuisines)
    ? record.cuisines.filter((item): item is string => typeof item === "string" && cuisineSet.has(item))
    : [];
  const moods = Array.isArray(record.moods)
    ? record.moods.filter((item): item is MoodId => typeof item === "string" && moodSet.has(item))
    : [];
  const budgets = Array.isArray(record.budgets)
    ? record.budgets.filter(
        (item): item is number => item === 1 || item === 2 || item === 3,
      )
    : [];
  return {
    cuisines: [...new Set(cuisines)],
    moods: [...new Set(moods)],
    budgets: [...new Set(budgets)],
    porkFree: record.porkFree === true,
    vegetarian: record.vegetarian === true,
    searched: record.searched === true,
    radiusChanged: record.radiusChanged === true,
  };
}

export function readFinal(value: unknown): FiltersFinal | null {
  const record = asRecord(value);
  if (!record) return null;
  const used = readUsed({
    cuisines: record.cuisines,
    moods: record.mood ? [record.mood] : [],
    budgets: record.budget ? [record.budget] : [],
    porkFree: record.porkFree,
    vegetarian: record.vegetarian,
    searched: record.searched,
    radiusChanged:
      typeof record.maxDistanceM === "number" && record.maxDistanceM !== DEFAULT_RADIUS_M,
  });
  const budget = record.budget === 1 || record.budget === 2 || record.budget === 3 ? record.budget : 0;
  const maxDistanceM =
    typeof record.maxDistanceM === "number" &&
    record.maxDistanceM >= 500 &&
    record.maxDistanceM <= 3000
      ? record.maxDistanceM
      : DEFAULT_RADIUS_M;
  return {
    cuisines: used.cuisines,
    mood: used.moods[0] ?? null,
    budget,
    porkFree: used.porkFree,
    vegetarian: used.vegetarian,
    searched: used.searched,
    maxDistanceM,
  };
}

export function parseUsedPayload(value: unknown): FiltersUsed | null {
  const record = asRecord(value);
  if (!record) return null;
  return readUsed(record);
}

export function parseFinalPayload(value: unknown): FiltersFinal | null {
  return readFinal(value);
}

export function describePlace(
  source: "gps" | "pin" | null,
  origin: Coordinates | null,
): { source: PlaceSource; lat: number; lng: number } | null {
  if (!source || !origin) return null;
  const lat = Math.round(origin.lat * 10_000) / 10_000;
  const lng = Math.round(origin.lng * 10_000) / 10_000;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (source === "gps") return { source: "gps", lat, lng };
  const here = { lat: origin.lat, lng: origin.lng };
  for (const pin of AREA_PINS) {
    if (haversineMeters(here, pin) < 50) return { source: pin.id, lat, lng };
  }
  if (haversineMeters(here, SUNWAY_CENTER) < 50) return { source: "center", lat, lng };
  return { source: "pin", lat, lng };
}

export function parsePlace(value: unknown): { source: PlaceSource; lat: number; lng: number } | null {
  const record = asRecord(value);
  if (!record) return null;
  if (typeof record.source !== "string" || !PLACE_SOURCES.includes(record.source as PlaceSource)) {
    return null;
  }
  if (typeof record.lat !== "number" || typeof record.lng !== "number") return null;
  if (record.lat < -90 || record.lat > 90 || record.lng < -180 || record.lng > 180) return null;
  return {
    source: record.source as PlaceSource,
    lat: Math.round(record.lat * 10_000) / 10_000,
    lng: Math.round(record.lng * 10_000) / 10_000,
  };
}

export type UsageRange = "week" | "month" | "all";

export function usageRangeStart(range: UsageRange) {
  if (range === "all") return new Date(0);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  if (range === "month") return new Date(Date.UTC(year, month - 1, 1, -8, 0, 0));
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  return new Date(Date.UTC(year, month - 1, day - mondayOffset, -8, 0, 0));
}
