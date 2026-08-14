"use client";

import { useMemo } from "react";
import Button from "@/components/atoms/Button";
import RouteMasthead from "@/components/molecules/RouteMasthead";
import { useBccrRates } from "@/hooks/useBccrRates";

function fmtRate(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtRelative(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = now - then;
  if (Number.isNaN(then)) return iso;
  const seconds = Math.round(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function RatesPage() {
  const { snapshot, loading, error, refresh } = useBccrRates();

  const summary = useMemo(() => {
    if (!snapshot) return null;
    const buys = snapshot.entities
      .map((e) => e.buy)
      .filter((v): v is number => v !== null);
    const sells = snapshot.entities
      .map((e) => e.sell)
      .filter((v): v is number => v !== null);
    if (buys.length === 0 || sells.length === 0) return null;
    const bestBuy = Math.max(...buys);
    const bestSell = Math.min(...sells);
    const medianBuy = median(buys);
    const medianSell = median(sells);
    const bestBuyEntity = snapshot.entities.find((e) => e.buy === bestBuy);
    const bestSellEntity = snapshot.entities.find((e) => e.sell === bestSell);
    const buyRange = { min: Math.min(...buys), max: bestBuy };
    const sellRange = { min: bestSell, max: Math.max(...sells) };
    return {
      bestBuy,
      bestSell,
      medianBuy,
      medianSell,
      bestBuyEntity: bestBuyEntity?.name ?? "—",
      bestSellEntity: bestSellEntity?.name ?? "—",
      buyRange,
      sellRange,
      spread: bestSell - bestBuy,
    };
  }, [snapshot]);

  return (
    <div className="flex flex-col gap-6">
      <RouteMasthead
        kicker="Exchange rates"
        title="Costa Rica window"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void refresh()}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      <p className="lede">
        The rate each entity posts at its window for USD ↔ CRC.{" "}
        <em className="not-italic text-fg">Buy</em> is where the bank buys USD
        (the rate that applies when you move USD → CRC).{" "}
        <em className="not-italic text-fg">Sell</em> is where the bank sells
        USD (applies to CRC → USD). Sourced from{" "}
        <a
          className="text-fg not-italic underline decoration-dotted underline-offset-4"
          href="https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx"
          target="_blank"
          rel="noreferrer"
        >
          BCCR
        </a>
        .
      </p>

      {error && (
        <div
          className="surface p-4 text-sm text-expense"
          style={{ borderColor: "var(--color-expense)" }}
        >
          Could not load rates: {error}
        </div>
      )}

      {loading && !snapshot && (
        <div className="empty">
          <p className="empty-title">Loading rates…</p>
          <p className="empty-body">
            Fetching the latest window rates from every entity.
          </p>
        </div>
      )}

      {summary && (
        <section
          className="courtyard p-6 flex flex-col gap-5"
          aria-label="Market at a glance"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="courtyard-kicker mb-0">
              USD → CRC · today
            </span>
            {snapshot && (
              <span className="kicker">{fmtRelative(snapshot.fetchedAt)}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <span className="kicker" style={{ color: "var(--color-income)" }}>
                Best buy
              </span>
              <span
                className="font-serif tabular-nums leading-none"
                style={{
                  color: "var(--color-income)",
                  fontSize: "clamp(2rem, 8vw, 3rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {fmtRate(summary.bestBuy)}
              </span>
              <span className="lede text-xs mt-1">
                at {summary.bestBuyEntity}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="kicker" style={{ color: "var(--color-expense)" }}>
                Best sell
              </span>
              <span
                className="font-serif tabular-nums leading-none"
                style={{
                  color: "var(--color-expense)",
                  fontSize: "clamp(2rem, 8vw, 3rem)",
                  letterSpacing: "-0.02em",
                }}
              >
                {fmtRate(summary.bestSell)}
              </span>
              <span className="lede text-xs mt-1">
                at {summary.bestSellEntity}
              </span>
            </div>
          </div>

          <div
            className="grid grid-cols-3 gap-4 pt-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <StatCol label="Median buy" value={fmtRate(summary.medianBuy)} />
            <StatCol label="Median sell" value={fmtRate(summary.medianSell)} />
            <StatCol
              label="Spread"
              value={`₡${fmtRate(summary.spread)}`}
              tone="var(--color-invest)"
            />
          </div>
        </section>
      )}

      {snapshot && summary && (
        <>
          <div className="section-head">
            <span className="section-head-title">By entity</span>
            <span className="section-head-meta">
              {snapshot.entities.length} banks · CRC per 1 USD
            </span>
          </div>

          <div className="rooms" role="list">
            {snapshot.entities.map((entity) => (
              <EntityRow
                key={entity.id}
                name={entity.name}
                buy={entity.buy}
                sell={entity.sell}
                buyRange={summary.buyRange}
                sellRange={summary.sellRange}
                bestBuy={summary.bestBuy}
                bestSell={summary.bestSell}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface StatColProps {
  label: string;
  value: string;
  tone?: string;
}

function StatCol({ label, value, tone }: StatColProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="kicker">{label}</span>
      <span
        className="figure text-sm"
        style={{ color: tone ?? "var(--color-fg)" }}
      >
        {value}
      </span>
    </div>
  );
}

interface EntityRowProps {
  name: string;
  buy: number | null;
  sell: number | null;
  buyRange: { min: number; max: number };
  sellRange: { min: number; max: number };
  bestBuy: number;
  bestSell: number;
}

function EntityRow({
  name,
  buy,
  sell,
  buyRange,
  sellRange,
  bestBuy,
  bestSell,
}: EntityRowProps) {
  const isBestBuy = buy !== null && buy === bestBuy;
  const isBestSell = sell !== null && sell === bestSell;

  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-4">
      <div className="min-w-0">
        <p className="font-serif text-base text-fg truncate">{name}</p>
        <div className="flex items-center gap-1.5 mt-1">
          {isBestBuy && (
            <span
              className="chip"
              style={{
                background: "var(--color-income-soft)",
                color: "var(--color-income)",
                borderColor: "transparent",
              }}
            >
              Best buy
            </span>
          )}
          {isBestSell && (
            <span
              className="chip"
              style={{
                background: "var(--color-expense-soft)",
                color: "var(--color-expense)",
                borderColor: "transparent",
              }}
            >
              Best sell
            </span>
          )}
          {!isBestBuy && !isBestSell && (
            <span className="text-[11px] text-fg-muted uppercase tracking-[0.14em]">
              Bank window
            </span>
          )}
        </div>
      </div>
      <RateCell
        label="Buy"
        value={buy}
        range={buyRange}
        isBest={isBestBuy}
        goodDirection="higher"
      />
      <RateCell
        label="Sell"
        value={sell}
        range={sellRange}
        isBest={isBestSell}
        goodDirection="lower"
      />
    </div>
  );
}

interface RateCellProps {
  label: string;
  value: number | null;
  range: { min: number; max: number };
  isBest: boolean;
  /** Which direction is favorable to you as the customer. */
  goodDirection: "higher" | "lower";
}

function RateCell({ label, value, range, isBest, goodDirection }: RateCellProps) {
  const span = range.max - range.min;
  // Position along the range (0 = min, 1 = max). We tint the bar so the
  // customer-favorable end reads as green.
  const t =
    value === null || span <= 0
      ? 0
      : (value - range.min) / span;
  const good = goodDirection === "higher" ? t : 1 - t;
  const tone = isBest
    ? "var(--color-income)"
    : good > 0.66
      ? "var(--color-income)"
      : good < 0.33
        ? "var(--color-expense)"
        : "var(--color-invest)";
  return (
    <div className="flex flex-col gap-1 items-end w-24">
      <span className="kicker">{label}</span>
      <span
        className="figure text-sm"
        style={{ color: isBest ? tone : "var(--color-fg)" }}
      >
        ₡{fmtRate(value)}
      </span>
      <div
        className="w-full h-px mt-1"
        style={{ background: "var(--color-border)" }}
      >
        <div
          className="h-full transition-all"
          style={{
            width: `${Math.max(6, Math.round((value === null ? 0 : good) * 100))}%`,
            background: tone,
            marginLeft: goodDirection === "higher" ? "auto" : 0,
          }}
        />
      </div>
    </div>
  );
}
