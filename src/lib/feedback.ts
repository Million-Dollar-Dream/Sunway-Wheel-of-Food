import { restaurants } from "@/data/restaurants";

export const FEEDBACK_KINDS = ["wrong-place", "idea", "other"] as const;

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

export const FEEDBACK_KIND_LABELS: Record<FeedbackKind, string> = {
  "wrong-place": "A place is wrong",
  idea: "A feature idea",
  other: "Something else",
};

const MAX_MESSAGE = 1000;
const restaurantIds = new Set(restaurants.map((restaurant) => restaurant.id));

export type FeedbackInput = {
  kind: FeedbackKind;
  message: string;
  restaurantId: string | null;
};

export function parseFeedback(body: unknown): FeedbackInput | string {
  if (!body || typeof body !== "object") return "Send a note to submit.";
  const record = body as Record<string, unknown>;
  if (typeof record.company === "string" && record.company.trim().length > 0) {
    return "honeypot";
  }
  if (
    typeof record.kind !== "string" ||
    !FEEDBACK_KINDS.includes(record.kind as FeedbackKind)
  ) {
    return "Choose what kind of note this is.";
  }
  if (typeof record.message !== "string") return "Write a short note.";
  const message = record.message.trim();
  if (message.length < 1) return "Write a short note.";
  if (message.length > MAX_MESSAGE) {
    return `Keep the note under ${MAX_MESSAGE} characters.`;
  }
  const rawRestaurant = record.restaurantId;
  let restaurantId: string | null = null;
  if (typeof rawRestaurant === "string" && rawRestaurant.length > 0) {
    if (!restaurantIds.has(rawRestaurant)) return "That place is not on the list.";
    restaurantId = rawRestaurant;
  } else if (rawRestaurant != null && rawRestaurant !== "") {
    return "That place is not on the list.";
  }
  return { kind: record.kind as FeedbackKind, message, restaurantId };
}
