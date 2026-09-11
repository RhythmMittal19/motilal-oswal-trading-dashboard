"use client";

import { useId } from "react";

import type { Direction } from "@/lib/format";
import type { PricePoint } from "@/types/market";

/**
 * The SVG coordinate space. The element is rendered at whatever width the
 * layout gives it and the browser scales these numbers to fit, so no resize
 * listener is needed.
 */
const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 180;
const PADDING_Y = 10;

interface IntradayChartProps {
  points: PricePoint[];
  /** Yesterday's close — the dashed line the day's move is measured against. */
  referencePrice: number;
  direction: Direction;
}

export function IntradayChart({
  points,
  referencePrice,
  direction,
}: IntradayChartProps) {
  // useId keeps the gradient id unique, so two charts on one page can't
  // accidentally share a definition.
  const gradientId = useId();

  if (points.length < 2) return null;

  const prices = points.map((point) => point.price);

  // The reference line is included in the range so it is always on screen,
  // even on a day that never crossed it.
  const min = Math.min(...prices, referencePrice);
  const max = Math.max(...prices, referencePrice);

  // A perfectly flat series would make this zero and every y NaN.
  const span = max - min || 1;

  const xAt = (index: number) => (index / (points.length - 1)) * VIEW_WIDTH;
  const yAt = (price: number) =>
    PADDING_Y + (1 - (price - min) / span) * (VIEW_HEIGHT - PADDING_Y * 2);

  const line = points
    .map((point, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(2)},${yAt(point.price).toFixed(2)}`)
    .join(" ");

  // Close the path down to the baseline to get a fillable area.
  const area = `${line} L${VIEW_WIDTH},${VIEW_HEIGHT} L0,${VIEW_HEIGHT} Z`;

  const stroke =
    direction === "down" ? "var(--color-down)" : "var(--color-up)";

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        // The chart is decorative detail; the numbers above it carry the data.
        preserveAspectRatio="none"
        role="img"
        aria-label={`Intraday price from ${points[0].time} to ${points[points.length - 1].time}`}
        className="h-44 w-full"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1="0"
          x2={VIEW_WIDTH}
          y1={yAt(referencePrice)}
          y2={yAt(referencePrice)}
          stroke="var(--color-line)"
          strokeDasharray="4 4"
          // Without this, preserveAspectRatio="none" stretches the stroke too.
          vectorEffect="non-scaling-stroke"
        />

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <figcaption className="mt-1 flex justify-between font-mono text-[10px] text-muted">
        <span>{points[0].time}</span>
        <span>{points[points.length - 1].time}</span>
      </figcaption>
    </figure>
  );
}
