"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyPoint } from "@/lib/utils/analytics";

interface SavingsLineChartProps {
  data: MonthlyPoint[];
  currency?: string;
}

const WIDTH = 320;
const HEIGHT = 240;
const PAD_X = 16;
const PAD_TOP = 20;
const AXIS_H = 28;

export default function SavingsLineChart({
  data,
  currency = "USD",
}: SavingsLineChartProps) {
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
  const step = data.length > 1 ? usableW / (data.length - 1) : 0;

  const points = data.map((p, i) => {
    const x = data.length > 1 ? PAD_X + step * i : WIDTH / 2;
    const y = zeroY - (p.net / maxAbs) * (chartH / 2);
    return { x, y, point: p };
  });

  const path = points
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    points.length > 1
      ? `${path} L ${points[points.length - 1].x.toFixed(2)} ${zeroY} L ${points[0].x.toFixed(2)} ${zeroY} Z`
      : "";

  return (
    <div className="flex flex-col gap-2">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-[240px]"
        role="img"
        aria-label="Monthly savings for the last 6 months"
      >
        <defs>
          <linearGradient id="savings-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />

        {areaPath && <path d={areaPath} fill="url(#savings-area)" />}

        <path
          d={path}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map(({ x, y, point }) => {
          const fill =
            point.net >= 0 ? "var(--color-income)" : "var(--color-expense)";
          return (
            <g key={point.monthKey}>
              <circle cx={x} cy={y} r={4} fill={fill}>
                <title>
                  {`${point.label}: ${formatCurrency(point.net, currency)}`}
                </title>
              </circle>
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize={11}
                fill="var(--color-fg-subtle)"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-4 text-xs text-fg-subtle">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-income" />
          Saved
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="w-2.5 h-2.5 rounded-full bg-expense" />
          Shortfall
        </span>
      </div>
    </div>
  );
}
