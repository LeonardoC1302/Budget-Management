"use client";

import { useState } from "react";
import { usePreferences } from "@/contexts/PreferencesContext";
import { useNetWorth } from "@/hooks/useNetWorth";
import { monthLabel } from "@/lib/utils/analytics";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatCurrencyCompact } from "@/lib/utils/format";

import { t } from "@/lib/i18n";
const W = 320;
const H = 140;
const PAD_X = 10;
const PAD_TOP = 10;
const AXIS_H = 20;

/**
 * Net worth at each month end: accounts plus investments, minus what's owed
 * on cards. One series, so the title names it and no legend is needed. The
 * hovered (or latest) month's breakdown sits in the readout above the plot.
 */
export default function NetWorthCard() {
  const { series, loading } = useNetWorth();
  const { displayCurrency, convertUsd } = usePreferences();
  const [hovered, setHovered] = useState<number | null>(null);

  if (loading) {
    return <div className="chart-card h-[260px] animate-pulse" aria-busy />;
  }
  if (series.length === 0) return null;

  const fmt = (usd: number) => formatCurrency(convertUsd(usd), displayCurrency);
  const values = series.map((p) => p.netWorth);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 0);
  const span = max - min || 1;
  const chartH = H - PAD_TOP - AXIS_H;
  const step = (W - PAD_X * 2) / Math.max(series.length - 1, 1);
  const x = (i: number) => PAD_X + step * i;
  const y = (v: number) => PAD_TOP + chartH - ((v - min) / span) * chartH;

  const last = series[series.length - 1];
  const prev = series[series.length - 2];
  const change = prev ? last.netWorth - prev.netWorth : 0;
  const focusIndex = hovered ?? series.length - 1;
  const focus = series[focusIndex];

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.netWorth).toFixed(1)}`)
    .join(" ");
  const area = `${path} L${x(series.length - 1).toFixed(1)},${y(min).toFixed(1)} L${x(0).toFixed(1)},${y(min).toFixed(1)} Z`;
  const anyEstimated = series.some((p) => p.estimated);

  return (
    <section className="chart-card flex flex-col gap-3" aria-labelledby="net-worth-title">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div className="flex flex-col gap-0.5">
          <span id="net-worth-title" className="chart-title">
            {t("Net worth")}
          </span>
          <span className="font-serif text-2xl tabular-nums leading-tight">
            {fmt(last.netWorth)}
          </span>
        </div>
        {prev && (
          <span
            className={cn(
              "text-xs tabular-nums",
              change >= 0 ? "text-income" : "text-expense",
            )}
          >
            {change >= 0 ? "+" : "−"}
            {t("{amount} since {month}", { amount: fmt(Math.abs(change)), month: monthLabel(prev.monthKey) })}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted" aria-live="polite">
        <span className="text-fg">{monthLabel(focus.monthKey, false)}</span>
        <span>{t("Accounts {amount}", { amount: fmt(focus.cash) })}</span>
        <span>{t("Invested {amount}", { amount: fmt(focus.investments) })}</span>
        {focus.liabilities > 0 && <span>{t("Cards owed {amount}", { amount: fmt(focus.liabilities) })}</span>}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[140px]"
        role="img"
        aria-label={t("Net worth over the last {length} months, from {0} to {1}", { length: series.length, "0": fmt(series[0].netWorth), "1": fmt(last.netWorth) })}
        onMouseLeave={() => setHovered(null)}
      >
        {min < 0 && (
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--color-border)"
            strokeDasharray="3 3"
          />
        )}
        <path d={area} fill="var(--color-celadon-strong)" opacity={0.12} />
        <path
          d={path}
          fill="none"
          stroke="var(--color-celadon-strong)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {hovered !== null && (
          <line
            x1={x(hovered)}
            x2={x(hovered)}
            y1={PAD_TOP}
            y2={PAD_TOP + chartH}
            stroke="var(--color-border-strong)"
            strokeWidth={1}
          />
        )}
        <circle
          cx={x(focusIndex)}
          cy={y(focus.netWorth)}
          r={4}
          fill="var(--color-celadon-strong)"
          stroke="var(--color-surface)"
          strokeWidth={2}
        />
        {series.map((p, i) =>
          i % 2 === series.length % 2 || i === series.length - 1 ? (
            <text
              key={p.monthKey}
              x={x(i)}
              y={H - 5}
              textAnchor={i === 0 ? "start" : i === series.length - 1 ? "end" : "middle"}
              fontSize={10}
              fill="var(--color-fg-subtle)"
            >
              {monthLabel(p.monthKey)}
            </text>
          ) : null,
        )}
        {series.map((p, i) => (
          <rect
            key={p.monthKey}
            x={x(i) - step / 2}
            y={0}
            width={step}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
            onTouchStart={() => setHovered(i)}
          >
            <title>{`${monthLabel(p.monthKey, false)}: ${formatCurrencyCompact(convertUsd(p.netWorth), displayCurrency)}`}</title>
          </rect>
        ))}
      </svg>

      <p className="text-[11px] text-fg-subtle">
        {t("Month-end balances at today's exchange rates.")}
        {anyEstimated
          ? t(" Holdings without price history are counted at what you put in.")
          : ""}
      </p>

      <table className="sr-only">
        <caption>{t("Net worth by month")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("Month")}</th>
            <th scope="col">{t("Accounts")}</th>
            <th scope="col">{t("Invested")}</th>
            <th scope="col">{t("Cards owed")}</th>
            <th scope="col">{t("Net worth")}</th>
          </tr>
        </thead>
        <tbody>
          {series.map((p) => (
            <tr key={p.monthKey}>
              <th scope="row">{monthLabel(p.monthKey, false)}</th>
              <td>{fmt(p.cash)}</td>
              <td>{fmt(p.investments)}</td>
              <td>{fmt(p.liabilities)}</td>
              <td>{fmt(p.netWorth)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
