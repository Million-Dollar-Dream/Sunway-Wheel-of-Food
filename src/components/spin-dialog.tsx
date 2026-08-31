"use client";

import { useEffect, useState } from "react";
import { Bookmark, Dices, MapPin, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mapsUrl, type Restaurant } from "@/data/restaurants";
import { pickRandom } from "@/lib/filter-restaurants";

function runSpin(
  list: Restaurant[],
  onTick: (restaurant: Restaurant) => void,
  onDone: (restaurant: Restaurant) => void,
) {
  const picked = pickRandom(list);
  if (!picked) return () => undefined;

  let i = 0;
  const tick = window.setInterval(() => {
    onTick(list[i % list.length]);
    i += 1;
  }, 70);

  const done = window.setTimeout(() => {
    window.clearInterval(tick);
    onDone(picked);
  }, 1600);

  return () => {
    window.clearInterval(tick);
    window.clearTimeout(done);
  };
}

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
  const [shown, setShown] = useState<Restaurant | null>(list[0] ?? null);
  const [winner, setWinner] = useState<Restaurant | null>(null);
  const empty = list.length === 0;

  useEffect(() => {
    if (list.length === 0) return undefined;
    return runSpin(list, setShown, (restaurant) => {
      setShown(restaurant);
      setWinner(restaurant);
    });
  }, [list]);

  function spinAgain() {
    if (list.length === 0) return;
    setWinner(null);
    runSpin(list, setShown, (restaurant) => {
      setShown(restaurant);
      setWinner(restaurant);
    });
  }

  return (
    <>
      <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-4 py-8 text-center">
        {empty ? (
          <p className="text-muted-foreground">No restaurants in this filter set.</p>
        ) : shown ? (
          <>
            <p className="text-xs font-medium tracking-widest text-primary uppercase">
              {winner ? "Eat here" : "Spinning"}
            </p>
            <p
              className="mt-2 font-heading text-3xl font-semibold tracking-tight"
              style={{ color: shown.accent }}
            >
              {shown.name}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {shown.cuisine} · {shown.areaLabel}
            </p>
            {winner ? (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-foreground/80">
                {winner.why}
              </p>
            ) : null}
          </>
        ) : (
          <Dices className="size-8 animate-pulse text-primary" />
        )}
      </div>

      {winner ? (
        <DialogFooter className="sm:flex-wrap sm:justify-between">
          <Button type="button" variant="outline" onClick={spinAgain}>
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
          <Button type="button" disabled>
            <Dices data-icon="inline-start" />
            {empty ? "Nothing to spin" : "Spinning…"}
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Can&apos;t decide?</DialogTitle>
          <DialogDescription>
            {candidates.length === 0
              ? "Nothing matches these filters. Loosen them, then spin again."
              : "We will pick one lunch from the list you are looking at."}
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
