"use client";

import { MapPin, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { mapsUrl, type Restaurant } from "@/data/restaurants";

export function ShortlistSheet({
  open,
  onOpenChange,
  restaurants,
  onRemove,
  onClear,
  onOpenRestaurant,
  onSpinFromList,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  restaurants: Restaurant[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onOpenRestaurant: (restaurant: Restaurant) => void;
  onSpinFromList: () => void;
}) {
  const empty = restaurants.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle className="font-heading text-xl">Your shortlist</SheetTitle>
          <SheetDescription>
            Save a few places, then pick one when the group is stalling.
          </SheetDescription>
        </SheetHeader>

        {empty ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-heading text-lg font-medium">Nothing saved yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Tap the bookmark on a restaurant to build a lunch shortlist for this
              browser.
            </p>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <ul className="flex flex-col gap-2 p-4">
              {restaurants.map((restaurant) => (
                <li
                  key={restaurant.id}
                  className="rounded-xl border border-border/80 bg-card p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      className="min-w-0 text-left"
                      onClick={() => {
                        onOpenChange(false);
                        onOpenRestaurant(restaurant);
                      }}
                    >
                      <p className="font-heading text-base font-semibold">
                        {restaurant.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {restaurant.cuisine} · {restaurant.priceNote}
                      </p>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${restaurant.name}`}
                      onClick={() => onRemove(restaurant.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{restaurant.signature}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    nativeButton={false}
                    render={
                      <a
                        href={mapsUrl(restaurant.mapsQuery)}
                        target="_blank"
                        rel="noreferrer"
                      />
                    }
                  >
                    <MapPin data-icon="inline-start" />
                    Maps
                  </Button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <SheetFooter className="border-t">
          {empty ? null : (
            <>
                  <Button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onSpinFromList();
                    }}
                  >
                    Can&apos;t pick — spin the shortlist
                  </Button>
              <Button type="button" variant="ghost" onClick={onClear}>
                Clear shortlist
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
