"use client";

import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { type Restaurant } from "@/data/restaurants";
import { SUNWAY_CENTER, type Coordinates } from "@/lib/geo";

import "leaflet/dist/leaflet.css";

const userIcon = L.divIcon({
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  html: `<span style="display:block;width:22px;height:22px;border-radius:999px;background:#c45c26;border:3px solid #fde7c7;box-shadow:0 0 0 6px rgba(196,92,38,0.25)"></span>`,
});

const spotIcon = L.divIcon({
  className: "",
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  html: `<span style="display:block;width:12px;height:12px;border-radius:999px;background:#431407;border:2px solid #fde7c7"></span>`,
});

function Recenter({ origin }: { origin: Coordinates | null }) {
  const map = useMap();
  useEffect(() => {
    if (origin) {
      map.panTo([origin.lat, origin.lng]);
    }
  }, [map, origin]);
  return null;
}

function ClickToPin({ onPick }: { onPick: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

export function LocationMap({
  origin,
  radiusM,
  restaurants,
  onPick,
}: {
  origin: Coordinates | null;
  radiusM: number;
  restaurants: Restaurant[];
  onPick: (coords: Coordinates) => void;
}) {
  const center = origin ?? SUNWAY_CENTER;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={15}
      scrollWheelZoom
      className="z-0 h-64 w-full rounded-xl sm:h-72"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickToPin onPick={onPick} />
      <Recenter origin={origin} />
      {origin ? (
        <>
          <Marker position={[origin.lat, origin.lng]} icon={userIcon} />
          <Circle
            center={[origin.lat, origin.lng]}
            radius={radiusM}
            pathOptions={{
              color: "#c45c26",
              fillColor: "#c45c26",
              fillOpacity: 0.12,
              weight: 1.5,
            }}
          />
        </>
      ) : null}
      {restaurants.map((restaurant) => (
        <Marker
          key={restaurant.id}
          position={[restaurant.lat, restaurant.lng]}
          icon={spotIcon}
          title={restaurant.name}
        />
      ))}
    </MapContainer>
  );
}
