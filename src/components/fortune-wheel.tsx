"use client";

import {
  hexLuminance,
  polar,
  sliceDegrees,
  sliceLabel,
  slicePath,
} from "@/lib/fortune-wheel";
import { cn } from "@/lib/utils";

export type WheelSlice = {
  id: string;
  label: string;
  accent: string;
};

const CREAM = "#f3e4c4";
const CX = 100;
const CY = 100;
const RADIUS = 96;

export function FortuneWheel({
  slices,
  rotation,
  spinning,
  durationMs,
  onSpinEnd,
  className,
}: {
  slices: WheelSlice[];
  rotation: number;
  spinning: boolean;
  durationMs: number;
  onSpinEnd: () => void;
  className?: string;
}) {
  const count = Math.max(slices.length, 1);
  const slice = sliceDegrees(count);
  const fontSize = count > 16 ? 6.2 : count > 12 ? 7 : count > 8 ? 8 : 9.5;

  return (
    <div className={cn("relative mx-auto aspect-square w-[min(100%,20.5rem)]", className)}>
      <div
        className="pointer-events-none absolute top-0 left-1/2 z-20 -translate-x-1/2 -translate-y-0.5"
        aria-hidden
      >
        <svg width="28" height="34" viewBox="0 0 28 34" className="drop-shadow-md">
          <polygon
            points="14,34 2,4 26,4"
            fill="#c2410c"
            stroke="#fde7c7"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="6" r="3.2" fill="#fde7c7" />
        </svg>
      </div>

      <div className="absolute inset-0 rounded-full bg-[#7c2d12] p-[7px] shadow-[0_12px_28px_-8px_rgba(92,38,12,0.45)] ring-1 ring-[#9a3412]/40">
        <div className="h-full w-full rounded-full bg-[#fde7c7] p-[5px]">
          <svg
            viewBox="0 0 200 200"
            className="block h-full w-full origin-center will-change-transform"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${durationMs}ms cubic-bezier(0.12, 0.72, 0.08, 1)`
                : "none",
            }}
            onTransitionEnd={(event) => {
              if (event.propertyName === "transform") onSpinEnd();
            }}
            role="img"
            aria-label="Restaurant prize wheel"
          >
            {slices.length === 0 ? (
              <circle cx={CX} cy={CY} r={RADIUS} fill={CREAM} />
            ) : (
              slices.map((item, index) => {
                const start = index * slice;
                const end = start + slice;
                const fill = index % 2 === 0 ? item.accent : CREAM;
                const dark = hexLuminance(fill) < 0.55;
                const mid = start + slice / 2;
                const labelPos = polar(CX, CY, count > 14 ? 58 : 62, mid);
                const flip = mid > 90 && mid < 270;
                return (
                  <g key={item.id}>
                    <path
                      d={slicePath(CX, CY, RADIUS, start, end)}
                      fill={fill}
                      stroke="#fde7c7"
                      strokeWidth="0.8"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill={dark ? "#fff7ed" : "#431407"}
                      fontSize={fontSize}
                      fontWeight={600}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${flip ? mid + 90 : mid - 90} ${labelPos.x} ${labelPos.y})`}
                      style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui" }}
                    >
                      {sliceLabel(item.label, count)}
                    </text>
                  </g>
                );
              })
            )}
            <circle
              cx={CX}
              cy={CY}
              r={RADIUS}
              fill="none"
              stroke="#c2410c"
              strokeWidth="2.2"
            />
            <circle cx={CX} cy={CY} r="20" fill="#9a3412" />
            <circle cx={CX} cy={CY} r="14" fill="#fde7c7" />
            <circle cx={CX} cy={CY} r="5" fill="#c2410c" />
          </svg>
        </div>
      </div>
    </div>
  );
}
