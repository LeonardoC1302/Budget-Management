"use client";

import { useState } from "react";
import { monthLabel } from "@/lib/utils/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/format";

import { t } from "@/lib/i18n";
export interface BudgetHistoryPoint {
  monthKey: string;
  spent: number;
  cap: number;
}

interface BudgetHistoryChartProps {
  data: BudgetHistoryPoint[];
  currency: string;
  selected: string;
  onSelect?: (monthKey: string) => void;
}

const WIDTH = 320;
const HEIGHT = 150;
const PAD_X = 6;
const PAD_TOP = 14;
const AXIS_H = 22;
const GAP = 10;

/**
 * Spend in capped categories per month (bars) against that month's total cap
 * (dashed tick). One series plus a reference mark, so no categorical color:
 * over-cap months switch to the expense tone and are also named in the
 * readout. Tap a month to open it.
 */
export default function BudgetHistoryChart({
  data,
  currency,
  selected,
  onSelect,
}: BudgetHistoryChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (data.length === 0) return null;

  const chartH = HEIGHT - AXIS_H - PAD_TOP;
  const max = Math.max(...data.map((d) => Math.max(d.spent, d.cap)), 1) * 1.08;
  const slot = (WIDTH - PAD_X * 2) / data.length;
  const barW = Math.max(slot - GAP, 6);
  const y = (v: number) => PAD_TOP + chartH - (v / max) * chartH;
  const baseline = PAD_TOP + chartH;

  const focus = hovered ?? data.findIndex((d) => d.monthKey === selected);
  const f = data[focus] ?? data[data.length - 1];
  const fOver = f.cap > 0 && f.spent > f.cap;

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3 text-xs">
        <span className="text-fg-muted">
          {monthLabel(f.monthKey, false)}
        </span>
        <span className="tabular-nums text-fg">
          {formatCurrency(f.spent, currency)}
          <span className="text-fg-subtle">
            {f.cap > 0 ? ` of ${formatCurrency(f.cap, currency)}` : t(" · no caps")}
          </span>
          {fOver && <span className="text-expense">{" "}{t("· Over")}</span>}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[150px]"
        role="img"
        aria-label={t("Spending against caps, {0} to {1}", { "0": monthLabel(data[0].monthKey, false), "1": monthLabel(data[data.length - 1].monthKey, false) })}
        onMouseLeave={() => setHovered(null)}
      >
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={baseline}
          y2={baseline}
          stroke="var(--color-border)"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const x = PAD_X + slot * i + (slot - barW) / 2;
          const over = d.cap > 0 && d.spent > d.cap;
          const isSelected = d.monthKey === selected;
          const top = y(d.spent);
          const h = Math.max(baseline - top, d.spent > 0 ? 2 : 0);
          return (
            <g key={d.monthKey}>
              <rect
                x={x}
                y={baseline - h}
                width={barW}
                height={h}
                rx={4}
                fill={over ? "var(--color-expense)" : "var(--color-celadon-strong)"}
                opacity={isSelected || hovered === i ? 1 : 0.5}
              />
              {d.cap > 0 && (
                <line
                  x1={x - 3}
                  x2={x + barW + 3}
                  y1={y(d.cap)}
                  y2={y(d.cap)}
                  stroke="var(--color-fg)"
                  strokeWidth={2}
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              )}
              <text
                x={x + barW / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize={11}
                fill={isSelected ? "var(--color-fg)" : "var(--color-fg-subtle)"}
                fontWeight={isSelected ? 600 : 400}
              >
                {monthLabel(d.monthKey)}
              </text>
              {/* Hit target: the whole column, not just the bar. */}
              <rect
                x={PAD_X + slot * i}
                y={0}
                width={slot}
                height={HEIGHT}
                fill="transparent"
                className={cn(onSelect && "cursor-pointer")}
                onMouseEnter={() => setHovered(i)}
                onClick={() => onSelect?.(d.monthKey)}
              >
                <title>{`${monthLabel(d.monthKey, false)}: ${formatCurrencyCompact(d.spent, currency)} of ${formatCurrencyCompact(d.cap, currency)}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 text-[11px] text-fg-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ background: "var(--color-celadon-strong)" }}
          />
          {t("Spent in capped categories")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg aria-hidden width="14" height="4">
            <line
              x1="0"
              x2="14"
              y1="2"
              y2="2"
              stroke="var(--color-fg)"
              strokeWidth="2"
              strokeDasharray="4 3"
            />
          </svg>
          {t("Cap")}
        </span>
      </div>

      <table className="sr-only">
        <caption>{t("Spending against caps by month")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("Month")}</th>
            <th scope="col">{t("Spent")}</th>
            <th scope="col">{t("Cap")}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.monthKey}>
              <th scope="row">{monthLabel(d.monthKey, false)}</th>
              <td>{formatCurrency(d.spent, currency)}</td>
              <td>{formatCurrency(d.cap, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
