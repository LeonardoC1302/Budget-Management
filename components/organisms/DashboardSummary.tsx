"use client";

import { useMemo } from "react";
import { useHoldings } from "@/hooks/useHoldings";
import { useMarketQuotes } from "@/hooks/useMarketQuotes";
import { formatCurrency } from "@/lib/utils/format";
import {
  latestValuationFor,
  manualSnapshot,
  marketSnapshot,
} from "@/lib/utils/holdings";

interface DashboardSummaryProps {
  income: number;
  expense: number;
}

/**
 * Income / Expenses / (optional) Portfolio — presented as a joined three-up
 * of rooms sharing hairline walls. Alcove's grouping pattern.
 */
export default function DashboardSummary({
  income,
  expense,
}: DashboardSummaryProps) {
  const { holdings, positionsById, valuationsByHolding, unassignedInvestments } =
    useHoldings();

  const marketSymbols = useMemo(
    () =>
      holdings
        .filter((h) => h.kind === "market" && !!h.symbol)
        .map((h) => h.symbol as string),
    [holdings],
  );
  const { quotes } = useMarketQuotes(marketSymbols);

  const portfolio = useMemo(() => {
    if (holdings.length === 0 && unassignedInvestments.length === 0) {
      return null;
    }
    let costBasis = 0;
    let currentValue = 0;
    for (const h of holdings) {
      const position = positionsById[h.id];
      const snap =
        h.kind === "market"
          ? marketSnapshot(position, h.symbol ? quotes[h.symbol] : undefined)
          : manualSnapshot(
              position,
              latestValuationFor(h.id, valuationsByHolding[h.id] ?? []),
            );
      costBasis += position?.costBasisUSD ?? 0;
      currentValue += snap.currentValueUSD;
    }
    for (const t of unassignedInvestments) {
      costBasis += t.amountUSD;
      currentValue += t.amountUSD;
    }
    return {
      costBasis,
      currentValue,
      gain: currentValue - costBasis,
      gainPct: costBasis > 0 ? (currentValue - costBasis) / costBasis : null,
    };
  }, [
    holdings,
    positionsById,
    quotes,
    valuationsByHolding,
    unassignedInvestments,
  ]);

  const cols = portfolio ? "grid-cols-3" : "grid-cols-2";
  const gainTone =
    portfolio?.gain === undefined
      ? "text-fg-muted"
      : portfolio.gain > 0
        ? "text-income"
        : portfolio.gain < 0
          ? "text-expense"
          : "text-fg-muted";

  return (
    <section className={`rooms-h ${cols}`} aria-label="Month summary">
      <Tile
        label="Income"
        value={formatCurrency(income, "USD")}
        tone="text-income"
      />
      <Tile
        label="Expenses"
        value={formatCurrency(expense, "USD")}
        tone="text-expense"
      />
      {portfolio && (
        <Tile
          label="Portfolio"
          value={formatCurrency(portfolio.currentValue, "USD")}
          tone="text-invest"
          hint={
            portfolio.gainPct !== null
              ? `${portfolio.gain >= 0 ? "+" : ""}${(portfolio.gainPct * 100).toFixed(2)}%`
              : undefined
          }
          hintTone={gainTone}
        />
      )}
    </section>
  );
}

interface TileProps {
  label: string;
  value: string;
  tone: string;
  hint?: string;
  hintTone?: string;
}

function Tile({ label, value, tone, hint, hintTone }: TileProps) {
  return (
    <div className="p-4 flex flex-col gap-2 min-w-0">
      <span className="kicker">{label}</span>
      <span className={`font-serif text-xl tabular-nums leading-none ${tone}`}>
        {value}
      </span>
      {hint && (
        <span className={`text-[11px] tabular-nums ${hintTone ?? "text-fg-muted"}`}>
          {hint}
        </span>
      )}
    </div>
  );
}
