# Sunway Lunch

A small site for picking lunch in **Bandar Sunway** — Sunway Pyramid, Sunway Geo Avenue, and a couple of PJS tables.

Browse by walk distance, cuisine, budget, and mood. Save a shortlist. When the group stalls, spin and go.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

## What you can do

- Use GPS, drop a pin on the map, or pin Sunway Pyramid, Geo Avenue, or PJS, then slide distance from **500 m to 3 km**
- If you are outside that area, center the map back on Sunway
- Only restaurants inside that radius stay on the list, sorted nearest first
- Filter by one or more cuisines, plus pork-free and vegetarian-friendly
- Tap a mood chip (under RM20, spicy, sit-down, with the team)
- Bookmark places into a shortlist stored in this browser
- Use **Can’t decide** to spin a prize wheel of the restaurants in your current list
- Open Google Maps for the chosen spot

Restaurant records include `lat` / `lng` so distance is calculated locally with the haversine formula. There is no live GPS database or API key — OpenStreetMap tiles power the pin map.

Hours and prices change. Confirm on Maps or the restaurant’s page before you walk over. “Pork-free” here means no pork on the menu — not always JAKIM-certified.

Restaurant details are a local snapshot for weekday lunch planning, not a live directory.
