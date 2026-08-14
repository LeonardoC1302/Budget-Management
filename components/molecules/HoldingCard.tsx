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
        : "MAN";
  const shares = position?.shares ?? 0;
  const showShares = isMarket && shares > 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(holding)}
      className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-surface-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
    >
      <div className="w-9 h-9 shrink-0 flex items-center justify-center border border-border" style={{ borderRadius: "var(--radius-control)" }}>
        <span
          className={cn(
            "text-[10px] font-medium tracking-[0.1em] uppercase",
            holding.symbol && holding.symbol.trim()
              ? "text-invest"
              : "text-fg-muted",
          )}
          style={{ fontFamily: "var(--font-sans)" }}
        >
          {label.length > 5 ? label.slice(0, 5) : label}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-serif text-base text-fg truncate">{holding.name}</p>
        <p className="text-[11px] text-fg-muted mt-1 uppercase tracking-[0.14em] truncate">
          {isMarket ? (
            <>
              {showShares ? `${formatShares(shares)} sh` : "No shares yet"}
              {quote?.priceUSD ? (
                <>
                  {" · "}
                  <Amount
                    value={quote.priceUSD}
                    size="sm"
                    className="text-fg-muted normal-case tracking-normal"
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

      <div className="flex flex-col items-end gap-1 shrink-0">
        <Amount
          value={snapshot.currentValueUSD}
          size="md"
          className="font-serif"
        />
        {gainPct !== null && (
          <span className={cn("figure text-xs", gainTone)}>
            {formatSignedPct(gainPct)}
          </span>
        )}
      </div>
    </button>
  );
}
