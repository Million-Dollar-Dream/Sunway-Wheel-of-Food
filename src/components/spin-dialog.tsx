"use client";

import { useRef, useState } from "react";
import { Bookmark, MapPin, RotateCw } from "lucide-react";

import { FortuneWheel } from "@/components/fortune-wheel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCuisines, mapsUrl, type Restaurant } from "@/data/restaurants";
import { targetRotation } from "@/lib/fortune-wheel";

const SPIN_MS = 4500;

function SpinRound({
  candidates,
  saved,
  onToggleSave,
  onOpenRestaurant,
  onClose,
}: {
  candidates: Restaurant[];
  saved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpenRestaurant: (restaurant: Restaurant) => void;
  onClose: () => void;
}) {
  const [list] = useState(candidates);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const rotationRef = useRef(0);
  const pendingIndex = useRef(0);
  const spinningRef = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const empty = list.length === 0;

  function spin() {
    if (spinningRef.current || empty) return;
    const index = Math.floor(Math.random() * list.length);
    pendingIndex.current = index;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = targetRotation(
      index,
      list.length,
      rotationRef.current,
      reduced ? 1 : 6,
      Math.random(),
    );
    rotationRef.current = next;
    setWinner(null);
    if (reduced) {
      setRotation(next);
      setWinner(list[index] ?? null);
      return;
    }
    spinningRef.current = true;
    setSpinning(true);
    setRotation(next);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(handleSpinEnd, SPIN_MS + 120);
  }

  function handleSpinEnd() {
    if (!spinningRef.current) return;
    spinningRef.current = false;
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setSpinning(false);
    const restaurant = list[pendingIndex.current];
    setWinner(restaurant ?? null);
  }

  return (
    <>
      {empty ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-muted-foreground">
          No restaurants in this filter set. Loosen the filters, then spin.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-4 pt-2">
          <FortuneWheel
            slices={list.map((restaurant) => ({
              id: restaurant.id,
              label: restaurant.name,
              accent: restaurant.accent,
            }))}
            rotation={rotation}
            spinning={spinning}
            durationMs={SPIN_MS}
            onSpinEnd={handleSpinEnd}
          >
            <button
              type="button"
              onClick={spin}
              disabled={spinning || empty}
              className="absolute top-1/2 left-1/2 z-30 flex size-[4.25rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#fde7c7] bg-primary font-heading text-sm font-bold tracking-[0.18em] text-primary-foreground shadow-md transition disabled:opacity-80"
            >
              {spinning ? "…" : "SPIN"}
            </button>
          </FortuneWheel>

          <div
            className="min-h-16 text-center"
            aria-live="polite"
            aria-atomic="true"
          >
            {spinning ? (
              <p className="text-sm font-medium tracking-widest text-primary uppercase">
                Spinning…
              </p>
            ) : winner ? (
              <>
                <p className="text-xs font-medium tracking-widest text-primary uppercase">
                  Eat here
                </p>
                <p
                  className="font-heading text-2xl font-semibold tracking-tight"
                  style={{ color: winner.accent }}
                >
                  {winner.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCuisines(winner.cuisines)} · {winner.areaLabel}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pointer at the top. Spin when you are ready.
              </p>
            )}
          </div>
        </div>
      )}

      {winner ? (
        <DialogFooter className="sm:flex-wrap sm:justify-between">
          <Button type="button" variant="outline" onClick={spin} disabled={spinning}>
            <RotateCw data-icon="inline-start" />
            Spin again
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onToggleSave(winner.id)}
            >
              <Bookmark data-icon="inline-start" />
              {saved(winner.id) ? "Saved" : "Shortlist"}
            </Button>
            <Button
              type="button"
              nativeButton={false}
              render={
                <a href={mapsUrl(winner.mapsQuery)} target="_blank" rel="noreferrer" />
              }
            >
              <MapPin data-icon="inline-start" />
              Maps
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="sm:w-full"
            onClick={() => {
              onClose();
              onOpenRestaurant(winner);
            }}
          >
            See the full card
          </Button>
        </DialogFooter>
      ) : (
        <DialogFooter>
          <Button
            type="button"
            className="h-10 w-full sm:w-auto sm:min-w-40"
            onClick={spin}
            disabled={spinning || empty}
            autoFocus
          >
            {spinning ? "Spinning…" : "Spin the wheel"}
          </Button>
        </DialogFooter>
      )}
    </>
  );
}

export function SpinDialog({
  open,
  onOpenChange,
  candidates,
  saved,
  onToggleSave,
  onOpenRestaurant,
  spinId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidates: Restaurant[];
  saved: (id: string) => boolean;
  onToggleSave: (id: string) => void;
  onOpenRestaurant: (restaurant: Restaurant) => void;
  spinId: number;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Wheel of lunch</DialogTitle>
          <DialogDescription>
            {candidates.length === 0
              ? "Nothing matches these filters. Loosen them, then spin again."
              : `${candidates.length} spot${candidates.length === 1 ? "" : "s"} on the wheel — the list you are looking at right now.`}
          </DialogDescription>
        </DialogHeader>
        {open ? (
          <SpinRound
            key={spinId}
            candidates={candidates}
            saved={saved}
            onToggleSave={onToggleSave}
            onOpenRestaurant={onOpenRestaurant}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
