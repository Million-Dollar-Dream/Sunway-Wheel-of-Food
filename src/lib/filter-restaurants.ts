import {
  type MoodId,
  type Restaurant,
  type Area,
} from "@/data/restaurants";
import { DEFAULT_RADIUS_M, haversineMeters, type Coordinates } from "@/lib/geo";

export type Filters = {
  query: string;
  area: Area | "all";
  cuisine: string | "all";
  budget: 0 | 1 | 2 | 3;
  porkFree: boolean;
  vegetarian: boolean;
  mood: MoodId | null;
  maxDistanceM: number;
};

export const DEFAULT_FILTERS: Filters = {
  query: "",
  area: "all",
  cuisine: "all",
  budget: 0,
  porkFree: false,
  vegetarian: false,
  mood: null,
  maxDistanceM: DEFAULT_RADIUS_M,
};

export function matchesMood(restaurant: Restaurant, mood: MoodId) {
  switch (mood) {
    case "cheap":
      return restaurant.priceTier === 1;
    case "quick":
      return restaurant.pace === "quick";
    case "spicy":
      return restaurant.spicy;
    case "pork-free":
      return restaurant.porkFree;
    case "sit-down":
      return restaurant.pace === "sit-down";
    case "cafe":
      return restaurant.cuisine === "Cafe";
    case "group":
      return restaurant.goodForGroups;
  }
}

export function restaurantDistance(restaurant: Restaurant, origin: Coordinates) {
  return haversineMeters(origin, { lat: restaurant.lat, lng: restaurant.lng });
}

export function filterRestaurants(
  list: Restaurant[],
  filters: Filters,
  origin: Coordinates | null = null,
) {
  const q = filters.query.trim().toLowerCase();

  const matches = list.filter((restaurant) => {
    if (filters.area !== "all" && restaurant.area !== filters.area) return false;
    if (filters.cuisine !== "all" && restaurant.cuisine !== filters.cuisine) {
      return false;
    }
    if (filters.budget !== 0 && restaurant.priceTier > filters.budget) {
      return false;
    }
    if (filters.porkFree && !restaurant.porkFree) return false;
    if (filters.vegetarian && !restaurant.vegetarianFriendly) return false;
    if (filters.mood && !matchesMood(restaurant, filters.mood)) return false;
    if (origin) {
      const distance = restaurantDistance(restaurant, origin);
      if (distance > filters.maxDistanceM) return false;
    }
    if (q) {
      const haystack = [
        restaurant.name,
        restaurant.cuisine,
        restaurant.areaLabel,
        restaurant.signature,
        restaurant.why,
        restaurant.lot,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  if (!origin) return matches;

  return [...matches].sort(
    (a, b) => restaurantDistance(a, origin) - restaurantDistance(b, origin),
  );
}

export function pickRandom<T>(list: T[]) {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
