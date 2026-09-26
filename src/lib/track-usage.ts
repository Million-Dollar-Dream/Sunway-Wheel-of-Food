const STORAGE_KEY = "sunway-visit";

export function visitId() {
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEY, id);
  return id;
}

export function sendUsage(body: Record<string, unknown>) {
  const payload = JSON.stringify({ id: visitId(), ...body });
  void fetch("/api/usage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => undefined);
}
