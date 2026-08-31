import {
  type MoodId,
  type Restaurant,
  type Area,
} from "@/data/restaurants";

export type Filters = {
  query: string;
  area: Area | "all";
  cuisine: string | "all";
  budget: 0 | 1 | 2 | 3;
  porkFree: boolean;
  vegetarian: boolean;
  mood: MoodId | null;
};

export const DEFAULT_FILTERS: Filters = {
  query: "",
  area: "all",
  cuisine: "all",
  budget: 0,
  porkFree: false,
  vegetarian: false,
  mood: null,
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

export function filterRestaurants(list: Restaurant[], filters: Filters) {
  const q = filters.query.trim().toLowerCase();

  return list.filter((restaurant) => {
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
}

export function pickRandom<T>(list: T[]) {
  if (list.length === 0) return null;
  return list[Math.floor(Math.random() * list.length)];
}
