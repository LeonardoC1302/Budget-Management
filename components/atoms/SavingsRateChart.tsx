"use client";

import { useState } from "react";
import { monthLabel, type MonthlyPoint } from "@/lib/utils/analytics";

import { t } from "@/lib/i18n";
interface SavingsRateChartProps {
  data: MonthlyPoint[];
}

const W = 320;
const H = 120;
const PAD_X = 8;
const PAD_TOP = 14;
const AXIS_H = 20;
const GAP = 12;
// Rates are clamped to ±100% so one bad month doesn't flatten the rest.
const LIMIT = 1;

export function savingsRate(p: Pick<MonthlyPoint, "income" | "net">): number | null {
  return p.income > 0 ? p.net / p.income : null;
}

function pct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Share of each month's income that wasn't spent. Bars rise from zero when
 * money was kept and drop below it when spending passed income; the value is
 * printed on the bar under the cursor (or the latest), so tone isn't the only
 * cue. Months with no income have no rate and show a gap.
 */
export default function SavingsRateChart({ data }: SavingsRateChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const rates = data.map(savingsRate);
  const hasNegative = rates.some((r) => r !== null && r < 0);
  const chartH = H - PAD_TOP - AXIS_H;
  const zeroY = hasNegative ? PAD_TOP + chartH / 2 : PAD_TOP + chartH;
  const scale = hasNegative ? chartH / 2 : chartH;
  const slot = (W - PAD_X * 2) / data.length;
  const barW = Math.max(slot - GAP, 6);
  const focus = hovered ?? data.length - 1;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-[120px]"
      role="img"
      aria-label={t("Savings rate by month: {0}", { "0": data
        .map((p, i) => `${monthLabel(p.monthKey)} ${rates[i] === null ? t("no income") : pct(rates[i]!)}`)
        .join(", ") })}
      onMouseLeave={() => setHovered(null)}
    >
      <line
        x1={PAD_X}
        x2={W - PAD_X}
        y1={zeroY}
        y2={zeroY}
        stroke="var(--color-border)"
        strokeWidth={1}
      />
      {data.map((p, i) => {
        const rate = rates[i];
        const x = PAD_X + slot * i + (slot - barW) / 2;
        const clamped = rate === null ? 0 : Math.max(-LIMIT, Math.min(LIMIT, rate));
        const h = Math.max(Math.abs(clamped) * scale, rate ? 2 : 0);
        const up = clamped >= 0;
        const isFocus = i === focus;
        return (
          <g key={p.monthKey}>
            {rate !== null && (
              <rect
                x={x}
                y={up ? zeroY - h : zeroY}
                width={barW}
                height={h}
                rx={3}
                fill={up ? "var(--color-celadon-strong)" : "var(--color-expense)"}
                opacity={isFocus ? 1 : 0.55}
              />
            )}
            {isFocus && (
              <text
                x={x + barW / 2}
                y={rate === null ? zeroY - 4 : up ? zeroY - h - 4 : zeroY + h + 11}
                textAnchor="middle"
                fontSize={11}
                fontWeight={600}
                fill="var(--color-fg)"
              >
                {rate === null ? "—" : pct(rate)}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H - 5}
              textAnchor="middle"
              fontSize={10}
              fill={isFocus ? "var(--color-fg)" : "var(--color-fg-subtle)"}
            >
              {monthLabel(p.monthKey)}
            </text>
            <rect
              x={PAD_X + slot * i}
              y={0}
              width={slot}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onTouchStart={() => setHovered(i)}
            />
          </g>
        );
      })}
    </svg>
  );
}
