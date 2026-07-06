"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyPoint } from "@/lib/utils/analytics";

interface SavingsBarChartProps {
  data: MonthlyPoint[];
  currency?: string;
}

const WIDTH = 320;
const HEIGHT = 140;
const PAD_X = 8;
const PAD_TOP = 12;
const AXIS_H = 24; // reserved for month labels
const BAR_GAP = 8;

export default function SavingsBarChart({
  data,
  currency = "USD",
}: SavingsBarChartProps) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-fg-subtle">
        Not enough data yet to plot monthly savings.
      </p>
    );
  }

  const chartH = HEIGHT - AXIS_H - PAD_TOP;
  const maxAbs = Math.max(...data.map((p) => Math.abs(p.net)), 1);
  const zeroY = PAD_TOP + chartH / 2;

  const usableW = WIDTH - PAD_X * 2;
  const slot = usableW / data.length;
  const barW = Math.max(slot - BAR_GAP, 4);

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-[140px]"
        role="img"
        aria-label="Monthly savings for the last 6 months"
      >
        {/* baseline */}
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        {data.map((p, i) => {
          const cx = PAD_X + slot * i + slot / 2;
          const magnitude = (Math.abs(p.net) / maxAbs) * (chartH / 2);
          const y = p.net >= 0 ? zeroY - magnitude : zeroY;
          const fill = p.net >= 0 ? "var(--color-income)" : "var(--color-expense)";
          return (
            <g key={p.monthKey}>
              <rect
                x={cx - barW / 2}
                y={y}
                width={barW}
                height={Math.max(magnitude, 1)}
                rx={3}
                fill={fill}
              >
                <title>
                  {`${p.label}: ${formatCurrency(p.net, currency)}`}
                </title>
              </rect>
              <text
                x={cx}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={10}
                fill="var(--color-fg-subtle)"
              >
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 text-xs text-fg-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-sm bg-income"
          />
          Saved
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            className="w-2.5 h-2.5 rounded-sm bg-expense"
          />
          Shortfall
        </span>
      </div>
    </div>
  );
}
