"use client";

import { Bookmark, BookmarkCheck, MapPin, UtensilsCrossed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapsUrl, type Restaurant } from "@/data/restaurants";
import { cn } from "@/lib/utils";

function pricePips(tier: 1 | 2 | 3) {
  return (
    <span className="font-medium tracking-tight" aria-label={`${tier} of 3 price`}>
      <span className="text-foreground">{"$".repeat(tier)}</span>
      <span className="text-muted-foreground/40">{"$".repeat(3 - tier)}</span>
    </span>
  );
}

export function RestaurantCard({
  restaurant,
  saved,
  onToggleSave,
  onOpen,
}: {
  restaurant: Restaurant;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white shadow-inner"
          style={{ background: restaurant.accent }}
          aria-hidden
        >
          {restaurant.name.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="min-w-0 text-left"
            >
              <h3 className="truncate font-heading text-lg leading-tight font-semibold tracking-tight">
                {restaurant.name}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {restaurant.cuisine} · {restaurant.areaLabel}
              </p>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-pressed={saved}
              aria-label={saved ? "Remove from shortlist" : "Save to shortlist"}
              onClick={onToggleSave}
            >
              {saved ? (
                <BookmarkCheck className="size-4 text-primary" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">
        {restaurant.why}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{restaurant.priceNote}</Badge>
        {restaurant.porkFree ? <Badge variant="outline">Pork-free</Badge> : null}
        {restaurant.spicy ? <Badge variant="outline">Spicy</Badge> : null}
        {restaurant.pace === "quick" ? <Badge variant="outline">Quick</Badge> : null}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-sm text-muted-foreground">
        <UtensilsCrossed className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Order the <span className="text-foreground">{restaurant.signature}</span>
        </span>
      </p>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
        <span className="text-xs text-muted-foreground">{pricePips(restaurant.priceTier)}</span>
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="sm" onClick={onOpen}>
            Details
          </Button>
          <Button type="button" size="sm" nativeButton={false} render={<a href={mapsUrl(restaurant.mapsQuery)} target="_blank" rel="noreferrer" />}>
            <MapPin data-icon="inline-start" />
            Maps
          </Button>
        </div>
      </div>
    </article>
  );
}
