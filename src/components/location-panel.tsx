"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ChevronDown, Crosshair, LoaderCircle, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { AREA_PINS, type Restaurant } from "@/data/restaurants";
import { type GpsStatus, type LocationSource } from "@/hooks/use-user-location";
import {
  DEFAULT_RADIUS_M,
  MAX_RADIUS_M,
  MIN_RADIUS_M,
  RADIUS_STEP_M,
  SUNWAY_CENTER,
  formatRadius,
  haversineMeters,
  radiusCovering,
  type Coordinates,
} from "@/lib/geo";

const LocationMap = dynamic(
  () => import("@/components/location-map").then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground sm:h-72">
        Loading the map…
      </div>
    ),
  },
);

export function LocationPanel({
  origin,
  source,
  gpsStatus,
  gpsError,
  radiusM,
  restaurants,
  matchCount,
  onRequestGps,
  onPick,
  onRadiusChange,
}: {
  origin: Coordinates | null;
  source: LocationSource | null;
  gpsStatus: GpsStatus;
  gpsError: string | null;
  radiusM: number;
  restaurants: Restaurant[];
  matchCount: number;
  onRequestGps: () => void;
  onPick: (coords: Coordinates) => void;
  onRadiusChange: (meters: number) => void;
}) {
  const locating = gpsStatus === "pending";
  const [pinsOpen, setPinsOpen] = useState(false);
  const pinsRef = useRef<HTMLDivElement>(null);
  const outsideCoverage =
    origin !== null &&
    restaurants.every(
      (restaurant) =>
        haversineMeters(origin, { lat: restaurant.lat, lng: restaurant.lng }) >
        MAX_RADIUS_M,
    );

  useEffect(() => {
    if (!pinsOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!pinsRef.current?.contains(event.target as Node)) setPinsOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setPinsOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinsOpen]);

  function centerOnCoverage() {
    onPick(SUNWAY_CENTER);
    onRadiusChange(
      radiusCovering(
        SUNWAY_CENTER,
        restaurants.map((restaurant) => ({
          lat: restaurant.lat,
          lng: restaurant.lng,
        })),
      ),
    );
  }

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold">How far will you walk?</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Use GPS, or tap the map to drop a pin. Only restaurants inside the
            circle stay on the list.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRequestGps}
            disabled={locating}
          >
            {locating ? (
              <LoaderCircle className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Crosshair data-icon="inline-start" />
            )}
            {locating ? "Finding you…" : "Use my location"}
          </Button>
          <div className="relative" ref={pinsRef}>
            <Button
              type="button"
              variant="secondary"
              aria-expanded={pinsOpen}
              aria-haspopup="listbox"
              onClick={() => setPinsOpen((open) => !open)}
            >
              <MapPin data-icon="inline-start" />
              Pin a Sunway spot
              <ChevronDown data-icon="inline-end" />
            </Button>
            {pinsOpen ? (
              <ul
                role="listbox"
                aria-label="Pin a Sunway spot"
                className="absolute right-0 z-30 mt-1 min-w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {AREA_PINS.map((pin) => (
                  <li key={pin.id}>
                    <button
                      type="button"
                      role="option"
                      className="w-full rounded-md px-2.5 py-1.5 text-left text-sm hover:bg-muted"
                      onClick={() => {
                        onPick({ lat: pin.lat, lng: pin.lng });
                        setPinsOpen(false);
                      }}
                    >
                      {pin.label}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>

      {outsideCoverage ? (
        <div className="mt-3 flex flex-col gap-2 rounded-lg bg-primary/10 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            You are outside Pyramid, Geo, and PJS. Center the map on that area to see lunch spots.
          </p>
          <Button type="button" size="sm" onClick={centerOnCoverage}>
            <MapPin data-icon="inline-start" />
            Center on Sunway
          </Button>
        </div>
      ) : null}

      {gpsError ? (
        <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {gpsError}
        </p>
      ) : null}

      <p className="mt-3 flex items-center gap-1.5 text-sm text-foreground/80">
        <MapPin className="size-3.5 shrink-0 text-primary" />
        {origin
          ? source === "gps"
            ? "Using your GPS position."
            : "Using the pin you dropped on the map."
          : "No position yet — tap the map to set one."}
      </p>

      <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-border">
        <LocationMap
          origin={origin}
          radiusM={radiusM}
          restaurants={restaurants}
          onPick={onPick}
        />
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <label htmlFor="distance-radius" className="text-sm font-medium">
            Distance from you
          </label>
          <span className="text-sm text-muted-foreground">
            Up to {formatRadius(radiusM)}
          </span>
        </div>
        <Slider
          id="distance-radius"
          min={MIN_RADIUS_M}
          max={MAX_RADIUS_M}
          step={RADIUS_STEP_M}
          value={[radiusM]}
          disabled={!origin}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value;
            if (typeof next === "number") onRadiusChange(next);
          }}
        />
        <p className="mt-2 text-sm text-muted-foreground">
          {origin
            ? `${matchCount} spot${matchCount === 1 ? "" : "s"} within ${formatRadius(radiusM)}`
            : `Slider unlocks after you set a position. Default range is ${formatRadius(DEFAULT_RADIUS_M)}.`}
        </p>
      </div>
    </section>
  );
}
