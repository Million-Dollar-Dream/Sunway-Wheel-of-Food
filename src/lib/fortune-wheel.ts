export function sliceDegrees(count: number) {
  return 360 / Math.max(count, 1);
}

/** Clockwise CSS rotation that puts `index` under a 12-o'clock pointer. */
export function targetRotation(
  index: number,
  count: number,
  currentRotation: number,
  spins = 6,
  jitter = 0.5,
) {
  const slice = sliceDegrees(count);
  const offset = slice * (0.16 + jitter * 0.68);
  const targetMod = (360 - (index * slice + offset)) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const delta = (targetMod - currentMod + 360) % 360;
  return currentRotation + spins * 360 + delta;
}

export function indexAtPointer(rotation: number, count: number) {
  if (count <= 0) return 0;
  const slice = sliceDegrees(count);
  const normalized = ((rotation % 360) + 360) % 360;
  const fromTop = (360 - normalized) % 360;
  return Math.min(count - 1, Math.floor(fromTop / slice));
}

export function polar(cx: number, cy: number, r: number, angleFromTop: number) {
  const rad = ((angleFromTop - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function slicePath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
) {
  if (end - start >= 359.99) {
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  }
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export function sliceLabel(name: string, count: number) {
  const max = count > 16 ? 8 : count > 10 ? 12 : 18;
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

export function hexLuminance(hex: string) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return 0.4;
  const r = Number.parseInt(raw.slice(0, 2), 16) / 255;
  const g = Number.parseInt(raw.slice(2, 4), 16) / 255;
  const b = Number.parseInt(raw.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
