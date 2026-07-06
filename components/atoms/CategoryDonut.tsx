"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { CategoryBreakdown } from "@/lib/utils/analytics";

interface CategoryDonutProps {
  breakdown: CategoryBreakdown;
  currency?: string;
}

// Palette tuned for the dark surface. Cycles if there are more slices.
const PALETTE = [
  "#6366f1", // indigo (accent)
  "#f43f5e", // rose (expense)
  "#10b981", // emerald (income)
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#38bdf8", // sky
];

const SIZE = 160;
const STROKE = 22;
const R = (SIZE - STROKE) / 2;
const CIRCUM = 2 * Math.PI * R;

export default function CategoryDonut({
  breakdown,
  currency = "USD",
}: CategoryDonutProps) {
  const { slices, total } = breakdown;

  if (total === 0) {
    return (
      <p className="text-sm text-fg-subtle">
        No expenses recorded this month yet.
      </p>
    );
  }

  const offsets = slices.reduce<number[]>(
    (acc, slice) => [...acc, (acc.at(-1) ?? 0) + slice.share * CIRCUM],
    [0],
  );

  const segments = slices.map((slice, i) => {
    const color = PALETTE[i % PALETTE.length];
    const length = slice.share * CIRCUM;
    const dashArray = `${length} ${CIRCUM - length}`;
    return (
      <circle
        key={slice.categoryId}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={STROKE}
        strokeDasharray={dashArray}
        strokeDashoffset={-offsets[i]}
        transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
      >
        <title>
          {`${slice.name}: ${formatCurrency(slice.amount, currency)} (${Math.round(slice.share * 100)}%)`}
        </title>
      </circle>
    );
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label="Category spending breakdown"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke="var(--color-surface-2)"
            strokeWidth={STROKE}
          />
          {segments}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-fg-subtle">Total</span>
          <span className="text-base font-semibold text-fg tabular-nums">
            {formatCurrency(total, currency)}
          </span>
        </div>
      </div>

      <ul className="flex-1 w-full flex flex-col gap-2">
        {slices.map((slice, i) => (
          <li
            key={slice.categoryId}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-fg truncate">{slice.name}</span>
            </div>
            <div className="flex items-center gap-2 text-fg-muted tabular-nums shrink-0">
              <span>{formatCurrency(slice.amount, currency)}</span>
              <span className="text-fg-subtle w-9 text-right">
                {Math.round(slice.share * 100)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
