"use client";

import Amount from "@/components/atoms/Amount";
import ProgressBar from "@/components/atoms/ProgressBar";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/format";
import type { BudgetTotals } from "@/lib/utils/budgets";

interface BudgetSummaryProps {
  totals: BudgetTotals;
  currency?: string;
}

export default function BudgetSummary({
  totals,
  currency = "USD",
}: BudgetSummaryProps) {
  const { totalCap, totalSpent, uncappedSpend } = totals;
  const percent = totalCap > 0 ? totalSpent / totalCap : 0;
  const over = totalSpent > totalCap && totalCap > 0;
  const remaining = totalCap - totalSpent;

  return (
    <section className="masthead-balance surface p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex flex-col gap-1">
          <span className="label-sm">Spent this month</span>
          <Amount
            value={totalSpent}
            size="xl"
            tone={over ? "expense" : "neutral"}
            currency={currency}
          />
          <p className="text-xs text-fg-subtle tabular-nums">
            of {formatCurrency(totalCap, currency)} capped
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col gap-1">
          <span className="label-sm">{over ? "Over" : "Left"}</span>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums leading-tight",
              over ? "text-expense" : "text-fg",
            )}
          >
            {over
              ? formatCurrency(-remaining, currency)
              : formatCurrency(remaining, currency)}
          </p>
          <p className="text-[11px] text-fg-subtle uppercase tracking-wide">
            {Math.round(percent * 100)}% used
          </p>
        </div>
      </div>

      <ProgressBar
        value={percent}
        tone={over ? "expense" : "accent"}
        ariaLabel="Overall budget progress"
      />

      {uncappedSpend > 0 && (
        <p className="text-xs text-fg-subtle">
          Plus{" "}
          <span className="text-fg font-medium">
            {formatCurrency(uncappedSpend, currency)}
          </span>{" "}
          spent in categories without a budget.
        </p>
      )}
    </section>
  );
}
