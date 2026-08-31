"use client";

import { Bookmark, BookmarkCheck, Clock, MapPin, Users, Wheat } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

export function RestaurantDetail({
  restaurant,
  open,
  onOpenChange,
  saved,
  onToggleSave,
}: {
  restaurant: Restaurant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saved: boolean;
  onToggleSave: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        {restaurant ? (
          <>
            <DialogHeader>
              <div className="pr-6">
                <p className="text-xs font-medium tracking-wide text-primary uppercase">
                  {restaurant.areaLabel}
                </p>
                <DialogTitle className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                  {restaurant.name}
                </DialogTitle>
                <DialogDescription className="mt-1">
                  {restaurant.cuisine} · {restaurant.lot}
                </DialogDescription>
              </div>
            </DialogHeader>

            <p className="leading-relaxed text-foreground/85">{restaurant.why}</p>

            <dl className="grid gap-3 rounded-xl bg-muted/60 p-3">
              <div className="flex gap-2">
                <Wheat className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs text-muted-foreground">Order this</dt>
                  <dd className="font-medium">{restaurant.signature}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs text-muted-foreground">Hours</dt>
                  <dd className="font-medium">{restaurant.hours}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs text-muted-foreground">From the BRT</dt>
                  <dd className="font-medium">{restaurant.walkFromBrt}</dd>
                </div>
              </div>
              <div className="flex gap-2">
                <Users className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <dt className="text-xs text-muted-foreground">Spend</dt>
                  <dd className="font-medium">{restaurant.priceNote}</dd>
                </div>
              </div>
            </dl>

            <div className="flex flex-wrap gap-1.5">
              {restaurant.porkFree ? <Badge variant="secondary">Pork-free</Badge> : null}
              {restaurant.vegetarianFriendly ? (
                <Badge variant="secondary">Vegetarian-friendly</Badge>
              ) : null}
              {restaurant.spicy ? <Badge variant="secondary">Spicy options</Badge> : null}
              {restaurant.goodForGroups ? (
                <Badge variant="secondary">Good for groups</Badge>
              ) : null}
              <Badge variant="outline">
                {restaurant.pace === "quick"
                  ? "Quick"
                  : restaurant.pace === "sit-down"
                    ? "Sit-down"
                    : "Casual"}
              </Badge>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button type="button" variant="outline" onClick={onToggleSave}>
                {saved ? <BookmarkCheck data-icon="inline-start" /> : <Bookmark data-icon="inline-start" />}
                {saved ? "On your shortlist" : "Save to shortlist"}
              </Button>
              <Button
                type="button"
                render={
                  <a
                    href={mapsUrl(restaurant.mapsQuery)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <MapPin data-icon="inline-start" />
                Open in Maps
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
