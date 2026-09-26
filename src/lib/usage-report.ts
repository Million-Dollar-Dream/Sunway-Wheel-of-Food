import { CUISINES, MOODS } from "@/data/restaurants";
import { readFinal, readUsed, usedAny, type PlaceSource } from "@/lib/usage";
import type { UsageSessionRow } from "@/lib/usage-store";

const BUDGETS = [
  { id: 1, label: "Around RM20" },
  { id: 2, label: "Up to RM40" },
  { id: 3, label: "Treat day" },
] as const;

export const PLACE_LABELS: Record<PlaceSource | "none", string> = {
  gps: "Used GPS",
  pyramid: "Pinned Pyramid",
  geo: "Pinned Geo",
  pjs: "Pinned PJS",
  center: "Centered on Sunway",
  pin: "Dropped another pin",
  none: "No location",
};

export type UsageBar = { label: string; count: number };

export type UsageReport = {
  visits: number;
  capped: boolean;
  spunVisits: number;
  spins: number;
  shortlistSpins: number;
  filteredVisits: number;
  spunOnly: number;
  filteredOnly: number;
  both: number;
  neither: number;
  ever: UsageBar[];
  settled: UsageBar[];
  places: UsageBar[];
  points: { lat: number; lng: number; source: string }[];
};

function bump(map: Map<string, number>, label: string) {
  map.set(label, (map.get(label) ?? 0) + 1);
}

function bars(map: Map<string, number>, order: string[]) {
  return order
    .map((label) => ({ label, count: map.get(label) ?? 0 }))
    .filter((bar) => bar.count > 0);
}

export function buildUsageReport(rows: UsageSessionRow[], capped: boolean): UsageReport {
  const ever = new Map<string, number>();
  const settled = new Map<string, number>();
  const places = new Map<string, number>();
  let spunVisits = 0;
  let spins = 0;
  let shortlistSpins = 0;
  let filteredVisits = 0;
  let spunOnly = 0;
  let filteredOnly = 0;
  let both = 0;
  let neither = 0;
  const points: UsageReport["points"] = [];

  const cuisineOrder = [...CUISINES];
  const moodOrder = MOODS.map((mood) => mood.label);
  const budgetOrder = BUDGETS.map((budget) => budget.label);
  const extraOrder = ["Diet: pork-free", "Diet: vegetarian", "Typed a search", "Changed the walk radius"];

  for (const row of rows) {
    const used = readUsed(row.filters_used);
    const finalFilters = readFinal(row.filters_final);
    const didFilter = usedAny(used);
    const didSpin = row.spin_count > 0;
    spins += row.spin_count;
    shortlistSpins += row.shortlist_spins;
    if (didSpin) spunVisits += 1;
    if (didFilter) filteredVisits += 1;
    if (didSpin && didFilter) both += 1;
    else if (didSpin) spunOnly += 1;
    else if (didFilter) filteredOnly += 1;
    else neither += 1;

    for (const cuisine of used.cuisines) bump(ever, cuisine);
    for (const moodId of used.moods) {
      bump(ever, MOODS.find((mood) => mood.id === moodId)?.label ?? moodId);
    }
    for (const budget of used.budgets) {
      bump(ever, BUDGETS.find((item) => item.id === budget)?.label ?? String(budget));
    }
    if (used.porkFree) bump(ever, "Diet: pork-free");
    if (used.vegetarian) bump(ever, "Diet: vegetarian");
    if (used.searched) bump(ever, "Typed a search");
    if (used.radiusChanged) bump(ever, "Changed the walk radius");

    if (finalFilters) {
      for (const cuisine of finalFilters.cuisines) bump(settled, cuisine);
      if (finalFilters.mood) {
        bump(settled, MOODS.find((mood) => mood.id === finalFilters.mood)?.label ?? finalFilters.mood);
      }
      if (finalFilters.budget !== 0) {
        bump(settled, BUDGETS.find((item) => item.id === finalFilters.budget)?.label ?? String(finalFilters.budget));
      }
      if (finalFilters.porkFree) bump(settled, "Diet: pork-free");
      if (finalFilters.vegetarian) bump(settled, "Diet: vegetarian");
      if (finalFilters.searched) bump(settled, "Typed a search");
      if (finalFilters.maxDistanceM !== 1500) bump(settled, "Changed the walk radius");
    }

    const place = row.location_source && row.location_source in PLACE_LABELS
      ? PLACE_LABELS[row.location_source as PlaceSource]
      : PLACE_LABELS.none;
    bump(places, place);
    if (typeof row.lat === "number" && typeof row.lng === "number") {
      points.push({ lat: row.lat, lng: row.lng, source: row.location_source ?? "pin" });
    }
  }

  const order = [...cuisineOrder, ...moodOrder, ...budgetOrder, ...extraOrder];
  const placeOrder = Object.values(PLACE_LABELS);

  return {
    visits: rows.length,
    capped,
    spunVisits,
    spins,
    shortlistSpins,
    filteredVisits,
    spunOnly,
    filteredOnly,
    both,
    neither,
    ever: bars(ever, order),
    settled: bars(settled, order),
    places: bars(places, placeOrder),
    points,
  };
}
