"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Dices, Search, SlidersHorizontal, X } from "lucide-react";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { LocationPanel } from "@/components/location-panel";
import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantDetail } from "@/components/restaurant-detail";
import { ShortlistSheet } from "@/components/shortlist-sheet";
import { SpinDialog } from "@/components/spin-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CUISINES,
  MOODS,
  daySeedFromDate,
  restaurants,
  todaysPick,
  type Restaurant,
} from "@/data/restaurants";
import { useShortlist } from "@/hooks/use-shortlist";
import { useUserLocation } from "@/hooks/use-user-location";
import {
  DEFAULT_FILTERS,
  filterRestaurants,
  restaurantDistance,
  type Filters,
} from "@/lib/filter-restaurants";
import { sendUsage } from "@/lib/track-usage";
import { describePlace, finalFromFilters, usedFromFilters } from "@/lib/usage";
import { cn } from "@/lib/utils";

function Chip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-sm whitespace-nowrap transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function LunchApp() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [detail, setDetail] = useState<Restaurant | null>(null);
  const [spinOpen, setSpinOpen] = useState(false);
  const [spinId, setSpinId] = useState(0);
  const [spinSource, setSpinSource] = useState<"filtered" | "shortlist">("filtered");
  const [shortlistOpen, setShortlistOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const shortlist = useShortlist();
  const location = useUserLocation();

  const filtered = useMemo(
    () => filterRestaurants(restaurants, filters, location.origin),
    [filters, location.origin],
  );

  const savedRestaurants = useMemo(
    () => restaurants.filter((item) => shortlist.ids.includes(item.id)),
    [shortlist.ids],
  );

  const spinCandidates =
    spinSource === "shortlist" && savedRestaurants.length > 0
      ? savedRestaurants
      : filtered;

  const filtersRef = useRef(filters);
  const resultCountRef = useRef(filtered.length);
  filtersRef.current = filters;
  resultCountRef.current = filtered.length;

  useEffect(() => {
    sendUsage({ type: "visit" });
    const flush = () => {
      sendUsage({
        type: "filters",
        used: usedFromFilters(filtersRef.current),
        final: finalFromFilters(filtersRef.current),
        resultCount: resultCountRef.current,
      });
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sendUsage({
        type: "filters",
        used: usedFromFilters(filters),
        final: finalFromFilters(filters),
        resultCount: filtered.length,
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [filters, filtered.length]);

  useEffect(() => {
    const place = describePlace(location.source, location.origin);
    if (!place) return;
    sendUsage({ type: "place", place });
  }, [location.source, location.origin]);

  const featured = todaysPick(restaurants, daySeedFromDate());
  const activeFilterCount = [
    filters.cuisine.length > 0,
    filters.budget !== 0,
    filters.porkFree,
    filters.vegetarian,
    filters.mood !== null,
    filters.query.trim().length > 0,
  ].filter(Boolean).length;

  function openSpin(source: "filtered" | "shortlist") {
    setSpinSource(source);
    setSpinId((value) => value + 1);
    setSpinOpen(true);
  }

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border/80 bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="font-heading text-lg font-semibold tracking-tight sm:text-xl">
              Sunway Lunch
            </p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Bandar Sunway · weekday lunch
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShortlistOpen(true)}
            >
              <Bookmark data-icon="inline-start" />
              Shortlist
              {shortlist.ids.length > 0 ? (
                <Badge variant="secondary" className="ml-1">
                  {shortlist.ids.length}
                </Badge>
              ) : null}
            </Button>
            <Button type="button" size="sm" onClick={() => openSpin("filtered")}>
              <Dices data-icon="inline-start" />
              Can&apos;t decide
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-[linear-gradient(135deg,oklch(0.93_0.05_75)_0%,oklch(0.97_0.02_85)_45%,oklch(0.94_0.04_145)_100%)] px-5 py-7 sm:px-8 sm:py-9 dark:bg-[linear-gradient(135deg,oklch(0.28_0.04_55)_0%,oklch(0.22_0.02_85)_100%)]">
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Bandar Sunway
          </p>
          <h1 className="mt-2 max-w-xl font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            Where are we eating lunch?
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-foreground/75 sm:text-base">
            Pyramid, Geo, and a couple of PJS tables that still beat the food court.
            Filter by walk distance, mood, or budget — or spin the wheel when nobody can decide.
          </p>

          {featured ? (
            <button
              type="button"
              onClick={() => setDetail(featured)}
              className="mt-6 flex w-full max-w-lg items-start gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 text-left shadow-sm backdrop-blur-sm transition hover:border-primary/30"
            >
              <div
                className="mt-0.5 size-10 shrink-0 rounded-xl"
                style={{ background: featured.accent }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-primary">Today&apos;s house pick</p>
                <p className="font-heading text-lg font-semibold">{featured.name}</p>
                <p className="text-sm text-muted-foreground">
                  {featured.signature} · {featured.priceNote}
                </p>
              </div>
            </button>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <Chip
                key={mood.id}
                active={filters.mood === mood.id}
                onClick={() =>
                  update("mood", filters.mood === mood.id ? null : mood.id)
                }
              >
                {mood.label}
              </Chip>
            ))}
          </div>
        </section>

        <div className="mt-6">
          <LocationPanel
            origin={location.origin}
            source={location.source}
            gpsStatus={location.gpsStatus}
            gpsError={location.gpsError}
            radiusM={filters.maxDistanceM}
            restaurants={restaurants}
            matchCount={filtered.length}
            onRequestGps={location.requestGps}
            onPick={location.setPin}
            onRadiusChange={(meters) => update("maxDistanceM", meters)}
          />
        </div>

        <section className="mt-6 flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filters.query}
                onChange={(event) => update("query", event.target.value)}
                placeholder="Search nasi lemak, ramen, Geo…"
                className="h-10 bg-card pl-8"
                aria-label="Search restaurants"
              />
            </label>
            <Button
              type="button"
              variant={showFilters ? "secondary" : "outline"}
              className="h-10"
              onClick={() => setShowFilters((value) => !value)}
            >
              <SlidersHorizontal data-icon="inline-start" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge variant="secondary">{activeFilterCount}</Badge>
              ) : null}
            </Button>
          </div>

          {showFilters ? (
            <div className="grid gap-4 rounded-2xl border border-border/80 bg-card p-4 sm:grid-cols-3">
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Cuisine
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={filters.cuisine.length === 0}
                    onClick={() => update("cuisine", [])}
                  >
                    All
                  </Chip>
                  {CUISINES.map((cuisine) => (
                    <Chip
                      key={cuisine}
                      active={filters.cuisine.includes(cuisine)}
                      onClick={() =>
                        update(
                          "cuisine",
                          filters.cuisine.includes(cuisine)
                            ? filters.cuisine.filter((item) => item !== cuisine)
                            : [...filters.cuisine, cuisine],
                        )
                      }
                    >
                      {cuisine}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Budget
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      [0, "Any"],
                      [1, "Around RM20"],
                      [2, "Up to RM40"],
                      [3, "Treat day"],
                    ] as const
                  ).map(([value, label]) => (
                    <Chip
                      key={value}
                      active={filters.budget === value}
                      onClick={() => update("budget", value)}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Dietary
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={filters.porkFree}
                    onClick={() => update("porkFree", !filters.porkFree)}
                  >
                    Pork-free
                  </Chip>
                  <Chip
                    active={filters.vegetarian}
                    onClick={() => update("vegetarian", !filters.vegetarian)}
                  >
                    Vegetarian-friendly
                  </Chip>
                </div>
              </fieldset>
              {activeFilterCount > 0 ? (
                <div className="sm:col-span-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFilters((current) => ({
                        ...DEFAULT_FILTERS,
                        maxDistanceM: current.maxDistanceM,
                      }))
                    }
                  >
                    <X data-icon="inline-start" />
                    Clear all filters
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-6 flex-1">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="font-heading text-lg font-semibold">
              {filtered.length === restaurants.length
                ? `${filtered.length} lunch spots`
                : `${filtered.length} match${filtered.length === 1 ? "" : "es"}`}
            </h2>
            {filters.mood ? (
              <p className="text-sm text-muted-foreground">
                Mood: {MOODS.find((mood) => mood.id === filters.mood)?.label}
              </p>
            ) : null}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <p className="font-heading text-xl font-semibold">Nothing fits that</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {location.origin
                  ? "Nothing sits inside that walking circle. Widen the slider, move the pin, or drop a filter."
                  : "Bandar Sunway is not that picky. Drop a filter or spin from the full list."}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFilters((current) => ({
                      ...DEFAULT_FILTERS,
                      maxDistanceM: current.maxDistanceM,
                    }))
                  }
                >
                  Reset filters
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setFilters((current) => ({
                      ...DEFAULT_FILTERS,
                      maxDistanceM: current.maxDistanceM,
                    }));
                    openSpin("filtered");
                  }}
                >
                  Just pick something
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  saved={shortlist.has(restaurant.id)}
                  onToggleSave={() => shortlist.toggle(restaurant.id)}
                  onOpen={() => setDetail(restaurant)}
                  distanceM={
                    location.origin
                      ? restaurantDistance(restaurant, location.origin)
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
        <p>
          Hours and prices shift. Confirm on the restaurant&apos;s page or Maps before you
          walk over. Pork-free here means no pork on the menu — not always JAKIM-certified.
        </p>
        <div className="mt-2">
          <FeedbackDialog />
        </div>
      </footer>

      <div className="sticky bottom-0 z-20 border-t border-border/80 bg-card/95 p-3 backdrop-blur-md sm:hidden">
        <Button
          type="button"
          className="h-11 w-full"
          onClick={() => openSpin("filtered")}
        >
          <Dices data-icon="inline-start" />
          Can&apos;t decide — pick for me
        </Button>
      </div>

      <RestaurantDetail
        restaurant={detail}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        saved={detail ? shortlist.has(detail.id) : false}
        onToggleSave={() => {
          if (detail) shortlist.toggle(detail.id);
        }}
        distanceM={
          detail && location.origin
            ? restaurantDistance(detail, location.origin)
            : undefined
        }
      />

      <SpinDialog
        open={spinOpen}
        onOpenChange={setSpinOpen}
        candidates={spinCandidates}
        saved={shortlist.has}
        onToggleSave={shortlist.toggle}
        onOpenRestaurant={setDetail}
        spinId={spinId}
        onRecordSpin={() => sendUsage({ type: "spin", source: spinSource })}
      />

      <ShortlistSheet
        open={shortlistOpen}
        onOpenChange={setShortlistOpen}
        restaurants={savedRestaurants}
        onRemove={shortlist.remove}
        onClear={shortlist.clear}
        onOpenRestaurant={setDetail}
        onSpinFromList={() => openSpin("shortlist")}
      />
    </div>
  );
}
