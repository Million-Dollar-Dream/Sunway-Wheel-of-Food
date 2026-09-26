import { AREA_PINS } from "@/data/restaurants";
import type { UsageBar, UsageReport } from "@/lib/usage-report";
import type { UsageRange } from "@/lib/usage";
import { cn } from "@/lib/utils";

const RANGES: { id: UsageRange; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
];

const MAP = { minLat: 3.058, maxLat: 3.082, minLng: 101.59, maxLng: 101.618 };

function percent(part: number, whole: number) {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 100);
}

function BarList({ items, total }: { items: UsageBar[]; total: number }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing recorded in this stretch.</p>;
  }
  const peak = Math.max(...items.map((item) => item.count), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span>{item.label}</span>
            <span className="text-muted-foreground">
              {item.count}
              <span className="ml-1 text-xs">{percent(item.count, total)}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.max(6, (item.count / peak) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function project(lat: number, lng: number) {
  const x = ((lng - MAP.minLng) / (MAP.maxLng - MAP.minLng)) * 100;
  const y = ((MAP.maxLat - lat) / (MAP.maxLat - MAP.minLat)) * 100;
  return { x, y, inside: x >= 0 && x <= 100 && y >= 0 && y <= 100 };
}

export function UsageBoard({ range, report }: { range: UsageRange; report: UsageReport }) {
  const offMap = report.points.filter((point) => !project(point.lat, point.lng).inside).length;
  const segments = [
    { label: "Looked only", count: report.neither, className: "bg-muted-foreground/35" },
    { label: "Filtered", count: report.filteredOnly, className: "bg-[oklch(0.72_0.12_85)]" },
    { label: "Spun", count: report.spunOnly, className: "bg-[oklch(0.62_0.14_145)]" },
    { label: "Filtered and spun", count: report.both, className: "bg-primary" },
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-primary uppercase">
            Bandar Sunway
          </p>
          <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight">
            How lunch got picked
          </h1>
        </div>
        <div className="flex rounded-full border border-border bg-card p-1 text-sm">
          {RANGES.map((item) => (
            <a
              key={item.id}
              href={`/admin/analytics?range=${item.id}`}
              className={cn(
                "rounded-full px-3 py-1.5",
                range === item.id ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>

      {report.capped ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Showing the latest 2,000 visits in this stretch.
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <article className="rounded-3xl border border-border bg-card px-5 py-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Visits</p>
          <p className="mt-2 font-heading text-4xl font-semibold">{report.visits}</p>
          <p className="mt-1 text-sm text-muted-foreground">One tab session each</p>
        </article>
        <article className="rounded-3xl border border-primary/20 bg-[linear-gradient(160deg,oklch(0.93_0.05_75),oklch(0.97_0.02_85))] px-5 py-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Used the wheel</p>
          <p className="mt-2 font-heading text-4xl font-semibold">
            {percent(report.spunVisits, report.visits)}
            <span className="text-2xl">%</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.spunVisits} of {report.visits} visits · {report.spins} spins
          </p>
        </article>
        <article className="rounded-3xl border border-border bg-card px-5 py-5">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Used a filter</p>
          <p className="mt-2 font-heading text-4xl font-semibold">
            {percent(report.filteredVisits, report.visits)}
            <span className="text-2xl">%</span>
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {report.filteredVisits} of {report.visits} visits
            {report.shortlistSpins > 0 ? ` · ${report.shortlistSpins} shortlist spins` : ""}
          </p>
        </article>
      </section>

      <section className="mt-4 rounded-3xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-xl font-semibold">Of these visits</h2>
        <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-muted">
          {segments.map((segment) =>
            segment.count > 0 ? (
              <div
                key={segment.label}
                className={segment.className}
                style={{ width: `${(segment.count / Math.max(report.visits, 1)) * 100}%` }}
              />
            ) : null,
          )}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", segment.className)} />
                {segment.label}
              </span>
              <span className="text-muted-foreground">
                {segment.count} · {percent(segment.count, report.visits)}%
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-border bg-card px-5 py-5">
          <h2 className="font-heading text-xl font-semibold">Turned on</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Choices touched at any point in the visit.
          </p>
          <BarList items={report.ever} total={report.visits} />
        </section>
        <section className="rounded-3xl border border-border bg-card px-5 py-5">
          <h2 className="font-heading text-xl font-semibold">Left with</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            The filters still on at the last update.
          </p>
          <BarList items={report.settled} total={report.visits} />
        </section>
      </div>

      <section className="mt-4 rounded-3xl border border-border bg-card px-5 py-5">
        <h2 className="font-heading text-xl font-semibold">Where they stood</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Coordinates are rounded to about 10 meters. Visits with no pin stay in the list only.
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[16rem_1fr]">
          <BarList items={report.places} total={report.visits} />
          <div>
            <svg viewBox="0 0 100 70" className="w-full rounded-2xl bg-[oklch(0.94_0.03_145)]" role="img" aria-label="Visit locations around Sunway">
              <rect x="0" y="0" width="100" height="70" fill="oklch(0.93 0.025 145)" />
              {report.points.map((point, index) => {
                const spot = project(point.lat, point.lng);
                if (!spot.inside) return null;
                return (
                  <circle
                    key={`${point.lat}-${point.lng}-${index}`}
                    cx={spot.x}
                    cy={(spot.y / 100) * 70}
                    r="1.3"
                    fill="oklch(0.52 0.15 42)"
                    opacity="0.85"
                  />
                );
              })}
              {AREA_PINS.map((pin) => {
                const spot = project(pin.lat, pin.lng);
                return (
                  <g key={pin.id}>
                    <circle cx={spot.x} cy={(spot.y / 100) * 70} r="1.1" fill="oklch(0.28 0.04 50)" />
                    <text
                      x={spot.x + 1.6}
                      y={(spot.y / 100) * 70 + 0.8}
                      fontSize="3.2"
                      fill="oklch(0.28 0.04 50)"
                    >
                      {pin.label.replace("Sunway ", "")}
                    </text>
                  </g>
                );
              })}
            </svg>
            {offMap > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {offMap} {offMap === 1 ? "point sits" : "points sit"} outside Pyramid, Geo, and PJS.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
