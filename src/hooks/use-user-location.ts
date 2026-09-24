"use client";

import { useCallback, useState } from "react";

import { type Coordinates } from "@/lib/geo";

export type LocationSource = "gps" | "pin";
export type GpsStatus = "idle" | "pending" | "granted" | "denied" | "error";

export function useUserLocation() {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [source, setSource] = useState<LocationSource | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [gpsError, setGpsError] = useState<string | null>(null);

  const setPin = useCallback((coords: Coordinates) => {
    setOrigin(coords);
    setSource("pin");
  }, []);

  const clear = useCallback(() => {
    setOrigin(null);
    setSource(null);
    setGpsStatus("idle");
    setGpsError(null);
  }, []);

  const requestGps = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGpsStatus("error");
      setGpsError("This browser cannot share a location. Drop a pin on the map.");
      return;
    }

    setGpsStatus("pending");
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setSource("gps");
        setGpsStatus("granted");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGpsStatus("denied");
          setGpsError("Location permission was denied. Drop a pin on the map instead.");
        } else {
          setGpsStatus("error");
          setGpsError("Could not read GPS. Drop a pin on the map instead.");
        }
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 15_000 },
    );
  }, []);

  return {
    origin,
    source,
    gpsStatus,
    gpsError,
    setPin,
    requestGps,
    clear,
  };
}
