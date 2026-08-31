"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "sunway-lunch-shortlist";

let snapshot: string[] = [];
let snapshotRaw = "[]";
const listeners = new Set<() => void>();

function parse(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return [];
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  if (typeof window === "undefined") return snapshot;
  const raw = window.localStorage.getItem(KEY) ?? "[]";
  if (raw === snapshotRaw) return snapshot;
  snapshotRaw = raw;
  snapshot = parse(raw);
  return snapshot;
}

function getServerSnapshot() {
  return snapshot;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function write(next: string[]) {
  snapshot = next;
  snapshotRaw = JSON.stringify(next);
  window.localStorage.setItem(KEY, snapshotRaw);
  emit();
}

export function useShortlist() {
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback((id: string) => {
    write(ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  }, [ids]);

  const remove = useCallback((id: string) => {
    write(ids.filter((item) => item !== id));
  }, [ids]);

  const clear = useCallback(() => write([]), []);

  return {
    ids,
    toggle,
    remove,
    clear,
    has: (id: string) => ids.includes(id),
  };
}
