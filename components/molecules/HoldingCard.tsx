"use client";

import Amount from "@/components/atoms/Amount";
import Sparkline from "@/components/atoms/Sparkline";
import { cn } from "@/lib/utils/cn";
import type { QuoteResult } from "@/lib/services/marketData";
import type { Holding } from "@/lib/types";
import type { HoldingPosition, HoldingValueSnapshot } from "@/lib/utils/holdings";

interface HoldingCardProps {
  holding: Holding;
  position?: HoldingPosition;
  snapshot: HoldingValueSnapshot;
  quote?: QuoteResult;
  sparklinePoints?: number[];
  onOpen: (holding: Holding) => void;
}

function formatShares(shares: number): string {
  if (shares === 0) return "0";
  if (Math.abs(shares) < 0.01) return shares.toExponential(2);
  return shares.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function formatSignedPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${(pct * 100).toFixed(2)}%`;
}

export default function HoldingCard({
  holding,
  position,
  snapshot,
  quote,
  sparklinePoints,
  onOpen,
}: HoldingCardProps) {
  const isMarket = holding.kind === "market";
  const gainPct = snapshot.gainPct;
  const gainTone =
    snapshot.gainUSD > 0
      ? "text-income"
      : snapshot.gainUSD < 0
        ? "text-expense"
        : "text-fg-muted";

  const label =
    holding.symbol && holding.symbol.trim()
      ? holding.symbol
      : isMarket
        ? "?"
        : "MANUAL";
  const shares = position?.shares ?? 0;
  const showShares = isMarket && shares > 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(holding)}
        className="w-full text-left surface p-4 flex items-center gap-3 hover:bg-surface-2 transition-colors"
      >
        <div className="w-10 h-10 shrink-0 rounded-full bg-surface-2 border border-border flex items-center justify-center">
          <span
            className={cn(
              "text-[10px] font-semibold tracking-tight",
              holding.symbol && holding.symbol.trim()
                ? "text-invest"
                : "text-fg-muted",
            )}
          >
            {label.length > 5 ? label.slice(0, 5) : label}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-fg truncate">
            {holding.name}
          </p>
          <p className="text-xs text-fg-subtle truncate">
            {isMarket ? (
              <>
                {showShares ? `${formatShares(shares)} sh` : "No shares yet"}
                {quote?.priceUSD ? (
                  <>
                    {" · "}
                    <Amount
                      value={quote.priceUSD}
                      size="sm"
                      className="text-fg-subtle"
                    />
                  </>
                ) : null}
              </>
            ) : snapshot.asOf ? (
              <>as of {snapshot.asOf}</>
            ) : (
              <>No valuation yet</>
            )}
          </p>
        </div>

        {isMarket && sparklinePoints && sparklinePoints.length > 1 && (
          <Sparkline values={sparklinePoints} className="hidden xs:block" />
        )}

        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <Amount value={snapshot.currentValueUSD} size="md" />
          {gainPct !== null && (
            <span className={cn("text-xs tabular-nums", gainTone)}>
              {formatSignedPct(gainPct)}
            </span>
          )}
        </div>
      </button>
    </li>
  );
}
