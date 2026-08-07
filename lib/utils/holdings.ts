import type { Holding, HoldingValuation, Transaction } from "@/lib/types";
import type { QuoteResult } from "@/lib/services/marketData";

export interface HoldingPosition {
  holdingId: string;
  contributions: Transaction[];
  costBasisUSD: number;
  shares: number;      // sum of sharesDelta on priced contributions
  avgCostUSD: number;  // costBasisUSD / shares when shares > 0
  hasUnpriced: boolean;
}

export function computePositions(
  investments: Transaction[],
): Record<string, HoldingPosition> {
  const map: Record<string, HoldingPosition> = {};
  for (const t of investments) {
    if (t.type !== "investment" || !t.holdingId) continue;
    const pos = (map[t.holdingId] ??= {
      holdingId: t.holdingId,
      contributions: [],
      costBasisUSD: 0,
      shares: 0,
      avgCostUSD: 0,
      hasUnpriced: false,
    });
    pos.contributions.push(t);
    pos.costBasisUSD += t.amountUSD;
    if (typeof t.sharesDelta === "number") pos.shares += t.sharesDelta;
    if (t.unpriced) pos.hasUnpriced = true;
  }
  for (const pos of Object.values(map)) {
    pos.avgCostUSD = pos.shares > 0 ? pos.costBasisUSD / pos.shares : 0;
  }
  return map;
}

export interface HoldingValueSnapshot {
  currentValueUSD: number;
  gainUSD: number;
  gainPct: number | null;
  priceUSD: number | null;
  changePct: number | null;
  asOf: string | null;
  source: "market" | "manual" | "cost-basis";
}

/** Compute current value for a market holding using a live quote and shares. */
export function marketSnapshot(
  position: HoldingPosition | undefined,
  quote: QuoteResult | undefined,
): HoldingValueSnapshot {
  const costBasis = position?.costBasisUSD ?? 0;
  if (!quote || !position || position.shares === 0) {
    return {
      currentValueUSD: costBasis,
      gainUSD: 0,
      gainPct: null,
      priceUSD: quote?.priceUSD ?? null,
      changePct: quote?.changePct ?? null,
      asOf: quote?.asOf ?? null,
      source: "cost-basis",
    };
  }
  const currentValueUSD = position.shares * quote.priceUSD;
  const gainUSD = currentValueUSD - costBasis;
  const gainPct = costBasis > 0 ? gainUSD / costBasis : null;
  return {
    currentValueUSD,
    gainUSD,
    gainPct,
    priceUSD: quote.priceUSD,
    changePct: quote.changePct,
    asOf: quote.asOf,
    source: "market",
  };
}

/** Compute current value for a manual holding using the latest valuation entry. */
export function manualSnapshot(
  position: HoldingPosition | undefined,
  latestValuation: HoldingValuation | undefined,
): HoldingValueSnapshot {
  const costBasis = position?.costBasisUSD ?? 0;
  if (!latestValuation) {
    return {
      currentValueUSD: costBasis,
      gainUSD: 0,
      gainPct: null,
      priceUSD: null,
      changePct: null,
      asOf: null,
      source: "cost-basis",
    };
  }
  const gainUSD = latestValuation.valueUSD - costBasis;
  const gainPct = costBasis > 0 ? gainUSD / costBasis : null;
  return {
    currentValueUSD: latestValuation.valueUSD,
    gainUSD,
    gainPct,
    priceUSD: null,
    changePct: null,
    asOf: latestValuation.asOfDate,
    source: "manual",
  };
}

export function latestValuationFor(
  holdingId: string,
  valuations: HoldingValuation[],
): HoldingValuation | undefined {
  let latest: HoldingValuation | undefined;
  for (const v of valuations) {
    if (v.holdingId !== holdingId) continue;
    if (!latest || v.asOfDate > latest.asOfDate) latest = v;
  }
  return latest;
}

export function holdingLabel(h: Holding): string {
  if (h.kind === "market" && h.symbol) {
    return h.name ? `${h.symbol} · ${h.name}` : h.symbol;
  }
  return h.name;
}
