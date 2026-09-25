export type Coordinates = {
  lat: number;
  lng: number;
};

export const SUNWAY_CENTER: Coordinates = {
  lat: 3.0719,
  lng: 101.6063,
};

export const MIN_RADIUS_M = 500;
export const MAX_RADIUS_M = 3000;
export const DEFAULT_RADIUS_M = 1500;
export const RADIUS_STEP_M = 100;

const EARTH_M = 6_371_000;

export function haversineMeters(from: Coordinates, to: Coordinates) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number) {
  if (meters < 950) {
    return `${Math.round(meters / 10) * 10} m`;
  }
  const km = meters / 1000;
  return `${km < 2 ? km.toFixed(1) : km.toFixed(1)} km`;
}

export function radiusCovering(origin: Coordinates, points: Coordinates[]) {
  if (points.length === 0) return DEFAULT_RADIUS_M;
  const farthest = Math.max(...points.map((point) => haversineMeters(origin, point)));
  const stepped = Math.ceil(farthest / RADIUS_STEP_M) * RADIUS_STEP_M;
  return Math.min(MAX_RADIUS_M, Math.max(MIN_RADIUS_M, stepped));
}

export function formatRadius(meters: number) {
  if (meters < 1000) return `${meters} m`;
  const km = meters / 1000;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
}
