"use client";

import { useMemo } from "react";
import Card from "@/components/atoms/Card";
import SummaryCard from "@/components/molecules/SummaryCard";
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
 * Income + Expenses side-by-side, with a quiet Portfolio value tile that
 * shows only when the user has any holdings on file.
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

  return (
    <section className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Income" amount={income} tone="income" />
        <SummaryCard label="Expenses" amount={expense} tone="expense" />
      </div>

      {portfolio && (
        <Card className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="label-sm">Portfolio value</span>
            <span className="text-lg font-semibold tabular-nums text-invest">
              {formatCurrency(portfolio.currentValue, "USD")}
            </span>
          </div>
          {portfolio.gainPct !== null && (
            <span
              className={
                portfolio.gain > 0
                  ? "text-xs text-income tabular-nums"
                  : portfolio.gain < 0
                    ? "text-xs text-expense tabular-nums"
                    : "text-xs text-fg-muted tabular-nums"
              }
            >
              {portfolio.gain >= 0 ? "+" : ""}
              {(portfolio.gainPct * 100).toFixed(2)}%
            </span>
          )}
        </Card>
      )}
    </section>
  );
}
